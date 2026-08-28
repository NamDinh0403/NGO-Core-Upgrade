'use strict';
/*
 * Skill engine: registry loading, schema-lite validation, deterministic skill
 * selection, transition enforcement, client-mutation gate, uncertainty gates,
 * lazy capability activation, and invocation recording.
 * Dependency-free, Node 14+.
 */
const fs = require('fs');
const path = require('path');
const core = require('./core');
const yaml = require('./yaml');

const ROOT = core.ROOT;
const P = (...p) => path.join(ROOT, ...p);
const readJson = (rel) => JSON.parse(fs.readFileSync(P(rel), 'utf8'));
const nowIso = core.nowIso;

const SKILL_RESULTS = new Set([
  'SUCCEEDED', 'SUCCEEDED_WITH_WARNINGS', 'RESEARCH_REQUIRED', 'RETRYABLE_FAILURE',
  'BLOCKED_NEEDS_CONTEXT', 'BLOCKED_NEEDS_DEVELOPER', 'BLOCKED_NEEDS_APPROVAL',
  'FAILED_POLICY', 'FAILED_BUDGET', 'CANCELLED',
]);
const PLAN_STATUSES = new Set(['READY', 'READY_WITH_ASSUMPTIONS', 'RESEARCH_REQUIRED', 'BLOCKED_NEEDS_CONTEXT', 'BLOCKED_NEEDS_DEVELOPER', 'FAILED_POLICY']);
const DOCTOR_STATUSES = new Set([
  'READY_FOR_INVENTORY', 'READY_FOR_PLANNING', 'BLOCKED_INVALID_REQUEST',
  'BLOCKED_INVALID_CLIENT_REPOSITORY', 'BLOCKED_INVALID_CORE_REPOSITORY',
  'BLOCKED_VERSION_MISMATCH', 'BLOCKED_MISSING_PREREQUISITE', 'BLOCKED_NEEDS_DEVELOPER',
]);
const UNCERTAINTY_STATUS = new Set(['OPEN', 'RESEARCHING', 'RESOLVED', 'ACCEPTED_RISK', 'DEFERRED', 'REQUIRES_DEVELOPER', 'NOT_APPLICABLE']);
const UNCERTAINTY_CATEGORY = new Set(['KNOWN', 'ASSUMED', 'UNCERTAIN', 'CONTRADICTORY', 'NOT_APPLICABLE']);
const IMPACTS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// Capability → activation level (lazy activation model).
const CAPABILITY_LEVEL = {
  // Level 0 — repository inspection, no specialist install
  'read-client-repository': 0, 'read-core-repository': 0, 'search-repository': 0,
  'inspect-configuration': 0, 'inspect-approved-knowledge': 0,
  'parse-package-json': 0, 'parse-lockfile': 0, 'parse-angular-workspace': 0,
  'resolve-typescript-inheritance': 0, 'create-plan': 0,
  'create-uncertainty-records': 0, 'validate-json-schema': 0,
  'inspect-npm-registry-metadata': 0,
  // Level 1 — normal dev prerequisites (mutation of the client)
  'repository-version-control': 1, 'create-client-checkpoint': 1,
  'create-client-worktree': 1, 'install-client-dependencies': 1,
  'run-package-manager': 1, 'run-tests': 1,
  // Level 2 — build/typecheck research tooling
  'create-readonly-core-worktree': 2, 'build-angular-development': 2,
  'build-angular-production': 2, 'typecheck-typescript': 2,
  'scan-typescript-symbols': 2, 'probe-dependency-resolution': 2,
  // Level 3 — deep research
  'runtime-config-trace': 3,
};
const levelOf = (cap) => (cap in CAPABILITY_LEVEL ? CAPABILITY_LEVEL[cap] : 2);

function loadRegistry() {
  return yaml.parse(fs.readFileSync(P('skills/registry.yaml'), 'utf8'));
}
function skills() { return loadRegistry().skills || []; }
function getSkill(id) { return skills().find((s) => s.id === id) || null; }

// --- schema-lite validation (required + type + enum + const) -----------------
function typeOk(v, t) {
  if (Array.isArray(t)) return t.some((x) => typeOk(v, x));
  switch (t) {
    case 'string': return typeof v === 'string';
    case 'integer': return Number.isInteger(v);
    case 'number': return typeof v === 'number';
    case 'boolean': return typeof v === 'boolean';
    case 'object': return v && typeof v === 'object' && !Array.isArray(v);
    case 'array': return Array.isArray(v);
    case 'null': return v === null;
    default: return true;
  }
}
function validate(instance, schema, where) {
  const errs = [];
  for (const req of schema.required || []) if (!(req in (instance || {}))) errs.push(`${where}: missing '${req}'`);
  for (const [k, spec] of Object.entries(schema.properties || {})) {
    if (!instance || !(k in instance)) continue;
    const v = instance[k];
    if (spec.type && !typeOk(v, spec.type)) errs.push(`${where}: '${k}' wrong type`);
    if (spec.enum && !spec.enum.includes(v)) errs.push(`${where}: '${k}'='${v}' not in enum`);
    if (spec.const !== undefined && v !== spec.const) errs.push(`${where}: '${k}' must equal '${spec.const}'`);
  }
  return errs;
}
function validateSkillIO(skillId, io, instance) {
  const s = getSkill(skillId);
  if (!s) return [`unknown skill ${skillId}`];
  const rel = io === 'input' ? s.inputSchema : s.outputSchema;
  if (!rel || !core.exists(P(rel))) return [`missing ${io} schema for ${skillId}`];
  return validate(instance, readJson(rel), `${skillId}.${io}`);
}

// --- transitions -------------------------------------------------------------
function isValidTransition(fromId, toId) {
  if (toId === 'developer-escalation') return true; // reachable everywhere
  const s = getSkill(fromId);
  return !!s && Array.isArray(s.allowedNextSkills) && s.allowedNextSkills.includes(toId);
}

// --- deterministic selection -------------------------------------------------
function selectSkill(ctx) {
  ctx = ctx || {};
  if (ctx.requestedOperation === 'escalate' || ctx.blocked) return { skillId: 'developer-escalation', reason: 'explicit escalation or blocked state' };
  if (ctx.requestedOperation === 'learn' || ctx.workflowPhase === 'HANDOVER') return { skillId: 'learn-from-frontend-run', reason: 'run reached learning/handover' };
  if (!ctx.doctorStatus || ctx.requestedOperation === 'doctor') return { skillId: 'validate-local-repositories', reason: 'doctor / repository validation required' };
  if (String(ctx.doctorStatus).startsWith('BLOCKED')) return { skillId: 'developer-escalation', reason: `doctor blocked: ${ctx.doctorStatus}` };
  if (!ctx.clientInventoryDone) return { skillId: 'inventory-client-frontend', reason: 'client inventory required' };
  if (!ctx.coreInspectionDone) return { skillId: 'inspect-local-core', reason: 'core inspection required' };
  if (!ctx.packagesResolved) return { skillId: 'resolve-target-packages', reason: 'target package resolution required' };
  if (!ctx.requirementsDerived) return { skillId: 'derive-release-requirements', reason: 'core requirement derivation required' };
  if (!ctx.requirementsMapped) return { skillId: 'map-core-to-client', reason: 'requirement-to-client mapping required' };
  if (!ctx.planStatus || ctx.requestedOperation === 'plan') return { skillId: 'plan-frontend-upgrade', reason: 'planning required' };
  if (ctx.buildFailure) return { skillId: 'investigate-frontend-failure', reason: 'build failure signature present' };
  if (ctx.requestedOperation === 'audit') return { skillId: 'audit-frontend-integration', reason: 'integration audit requested' };
  if (ctx.requestedOperation === 'run') {
    const gate = mutationGate(ctx);
    if (gate.permitted) return { skillId: 'execute-frontend-upgrade', reason: 'ready plan + mutation gate open' };
    return { skillId: 'plan-frontend-upgrade', reason: 'mutation gate closed: ' + gate.reasons.join('; ') };
  }
  return { skillId: 'plan-frontend-upgrade', reason: 'default: plan before acting' };
}

// --- uncertainty gates -------------------------------------------------------
function blockingUncertainty(register) {
  return (register || []).filter((u) => u.status === 'OPEN' && (u.impact === 'HIGH' || u.impact === 'CRITICAL'));
}
function uncertaintyBlocksMutation(register) { return blockingUncertainty(register).length > 0; }
function uncertaintyBlocksCompletion(register) {
  return (register || []).some((u) => u.status === 'OPEN' && u.blocksCompletion === true);
}
function canAcceptRisk(u) { return !(u.impact === 'HIGH' || u.impact === 'CRITICAL'); }

// --- client mutation gate ----------------------------------------------------
function mutationGate(ctx) {
  ctx = ctx || {};
  const reasons = [];
  const planReady = ctx.planStatus === 'READY' || (ctx.planStatus === 'READY_WITH_ASSUMPTIONS' && ctx.policyPermitsAssumptions === true);
  if (!ctx.planExists) reasons.push('no valid plan');
  if (!planReady) reasons.push(`plan status '${ctx.planStatus}' does not permit mutation`);
  if (uncertaintyBlocksMutation(ctx.uncertaintyRegister)) reasons.push('unresolved HIGH/CRITICAL uncertainty');
  if (ctx.requiredCapabilitiesAvailable === false) reasons.push('required capabilities unavailable');
  if (ctx.baselineRecorded !== true) reasons.push('baseline state not recorded');
  if (ctx.rollbackCheckpointExists !== true) reasons.push('no client rollback checkpoint');
  if (ctx.clientStatusKnown !== true) reasons.push('client repository status unknown');
  if (ctx.coreFingerprintRecorded !== true) reasons.push('core baseline fingerprint not recorded');
  if (ctx.planningFingerprintsMatch === false) reasons.push('client/core changed since planning fingerprints');
  if (ctx.actionInPlan === false) reasons.push('requested action is not part of the approved plan');
  if (ctx.retriesExceeded === true) reasons.push('retry policy exceeded');
  return { permitted: reasons.length === 0, reasons };
}

// --- core read-only guard ----------------------------------------------------
/** Verify Core is unchanged by comparing before/after fingerprints. */
function coreUnchanged(beforeFp, afterFp) {
  const git = require('./git');
  const diffs = git.diffFingerprints(beforeFp, afterFp);
  return { unchanged: diffs.length === 0, differences: diffs };
}

// --- lazy capability activation ---------------------------------------------
function capabilityActivation(requiredCaps, availableCaps) {
  requiredCaps = requiredCaps || [];
  const have = new Set(availableCaps || []);
  const activateNow = [];
  const missingBlocking = [];
  for (const cap of requiredCaps) {
    if (have.has(cap)) continue;
    if (levelOf(cap) <= 1) missingBlocking.push(cap);
    else activateNow.push(cap);
  }
  return { activateNow, missingBlocking, planningBlocked: false };
}

// --- invocation recording ----------------------------------------------------
function recordInvocation(runDirAbs, inv) {
  fs.mkdirSync(runDirAbs, { recursive: true });
  const line = JSON.stringify(Object.assign({ recordedAt: nowIso() }, inv)) + '\n';
  fs.appendFileSync(path.join(runDirAbs, 'skill-invocations.jsonl'), line);
}

module.exports = {
  ROOT, P, nowIso, SKILL_RESULTS, PLAN_STATUSES, DOCTOR_STATUSES, UNCERTAINTY_STATUS,
  UNCERTAINTY_CATEGORY, IMPACTS, CAPABILITY_LEVEL, levelOf,
  loadRegistry, skills, getSkill, validate, validateSkillIO, isValidTransition, selectSkill,
  blockingUncertainty, uncertaintyBlocksMutation, uncertaintyBlocksCompletion, canAcceptRisk,
  mutationGate, coreUnchanged, capabilityActivation, recordInvocation,
};

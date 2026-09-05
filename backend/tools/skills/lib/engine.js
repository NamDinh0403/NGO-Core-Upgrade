'use strict';
/*
 * Skill engine: registry loading, schema-lite validation, deterministic skill
 * selection, transition enforcement, client-mutation gate, uncertainty gates,
 * lazy capability activation, and invocation recording.
 * Dependency-free, Node 14+. The functional backbone of the skill layer.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('../../bootstrap/lib/yaml');

const ROOT = path.resolve(__dirname, '..', '..', '..'); // backend
const P = (...p) => path.join(ROOT, ...p);
const readJson = (rel) => JSON.parse(fs.readFileSync(P(rel), 'utf8'));
const nowIso = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');

const SKILL_RESULTS = new Set([
  'SUCCEEDED', 'SUCCEEDED_WITH_WARNINGS', 'RESEARCH_REQUIRED', 'RETRYABLE_FAILURE',
  'BLOCKED_NEEDS_CONTEXT', 'BLOCKED_NEEDS_DEVELOPER', 'BLOCKED_NEEDS_APPROVAL',
  'FAILED_POLICY', 'FAILED_BUDGET', 'CANCELLED',
]);
const PLAN_STATUSES = new Set(['READY', 'READY_WITH_ASSUMPTIONS', 'RESEARCH_REQUIRED', 'BLOCKED_NEEDS_CONTEXT', 'BLOCKED_NEEDS_DEVELOPER', 'FAILED_POLICY']);
const UNCERTAINTY_STATUS = new Set(['OPEN', 'RESEARCHING', 'RESOLVED', 'ACCEPTED_RISK', 'DEFERRED', 'REQUIRES_DEVELOPER', 'NOT_APPLICABLE']);
const IMPACTS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// Capability → activation level (lazy activation model).
const CAPABILITY_LEVEL = {
  // Level 0 — repository inspection, no specialist install
  'read-repository': 0, 'search-repository': 0, 'search-source': 0,
  'inspect-configuration': 0, 'inspect-approved-knowledge': 0,
  'create-plan': 0, 'create-uncertainty-records': 0, 'validate-json-schema': 0,
  'inspect-npm-registry-metadata': 0, 'inspect-nuget-metadata': 0,
  // Level 1 — normal dev prerequisites
  'repository-version-control': 1, 'create-git-checkpoint': 1, 'create-git-worktree': 1,
  'restore-nuget-dependency-graph': 1, 'build-dotnet': 1, 'test-dotnet': 1, 'run-tests': 1,
  'run-local-dotnet-tools': 1, 'acquire-npm-package': 1, 'install-isolated-npm-dependencies': 1,
  // Level 2 — local research tools (activate only when the plan requires)
  'acquire-nuget-package': 2, 'compare-package-content': 2, 'compare-npm-package-content': 2,
  'inspect-dotnet-public-api': 2, 'compare-dotnet-public-api': 2, 'scan-csharp-symbols': 2,
  'typecheck-typescript': 2, 'scan-typescript-symbols': 2, 'inspect-angular-workspace': 2,
  'build-angular-development': 2, 'build-angular-production': 2,
  // Level 3 — deep research
  'selectively-decompile-dotnet': 3, 'inspect-dotnet-assembly-metadata': 3,
  'container-isolation': 3, 'runtime-trace': 3,
};
const levelOf = (cap) => (cap in CAPABILITY_LEVEL ? CAPABILITY_LEVEL[cap] : 2);

let _registryCache = null;
function loadRegistry() {
  // Cached after first parse: this file is read/parsed on every skill
  // selection call, and a single phase can call skills()/getSkill() dozens of
  // times. The registry never changes mid-process, so a per-process cache is
  // safe and removes 40+ redundant disk reads/parses per phase.
  if (_registryCache) return _registryCache;
  _registryCache = yaml.parse(fs.readFileSync(P('skills/registry.yaml'), 'utf8'));
  return _registryCache;
}
function skills() { return loadRegistry().skills; }
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
function validateSkillIO(skillId, io /* 'input'|'output' */, instance) {
  const s = getSkill(skillId);
  if (!s) return [`unknown skill ${skillId}`];
  const rel = io === 'input' ? s.inputSchema : s.outputSchema;
  return validate(instance, readJson(rel), `${skillId}.${io}`);
}

// --- transitions -------------------------------------------------------------
function isValidTransition(fromId, toId) {
  if (toId === 'developer-escalation') return true; // reachable from every skill
  const s = getSkill(fromId);
  return !!s && Array.isArray(s.allowedNextSkills) && s.allowedNextSkills.includes(toId);
}

// --- deterministic selection -------------------------------------------------
function selectSkill(ctx) {
  ctx = ctx || {};
  const vk = ctx.versionKnowledgeStatus;
  const openUnc = ctx.openUncertainty || [];
  if (ctx.requestedOperation === 'escalate' || ctx.blocked) return { skillId: 'developer-escalation', reason: 'explicit escalation or blocked state' };
  if (ctx.requestedOperation === 'learn' || ctx.workflowPhase === 'HANDOVER') return { skillId: 'learn-from-run', reason: 'run reached learning/handover' };
  if (!ctx.planStatus || ctx.requestedOperation === 'plan') return { skillId: 'plan-upgrade', reason: 'no valid plan or planning requested' };
  if (ctx.planStatus === 'RESEARCH_REQUIRED' || ['missing', 'contradictory', 'insufficient'].includes(vk)) return { skillId: 'research-version', reason: 'version knowledge insufficient' };
  if (ctx.buildFailure) return { skillId: 'investigate-build-failure', reason: 'build failure signature present' };
  if (ctx.requestedOperation === 'audit-frontend' && ctx.frontendPresent) return { skillId: 'audit-frontend-integration', reason: 'front-end integration audit requested' };
  if (ctx.requestedOperation === 'analyze') return { skillId: 'analyze-client-impact', reason: 'client-impact analysis requested' };
  if (ctx.requestedOperation === 'run') {
    const gate = mutationGate(ctx);
    if (gate.permitted) return { skillId: 'execute-upgrade', reason: 'ready plan + mutation gate open' };
    return { skillId: 'plan-upgrade', reason: 'mutation gate closed: ' + gate.reasons.join('; ') };
  }
  return { skillId: 'plan-upgrade', reason: 'default: plan before acting' };
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
  if (ctx.rollbackCheckpointExists !== true) reasons.push('no rollback checkpoint');
  if (ctx.repositoryStatusKnown !== true) reasons.push('repository status unknown');
  if (ctx.actionInPlan === false) reasons.push('requested action is not part of the approved plan');
  if (ctx.usingCandidateAsAuthoritative === true) reasons.push('candidate knowledge treated as authoritative');
  if (ctx.retriesExceeded === true) reasons.push('retry policy exceeded');
  if (ctx.targetInstallDuringResearch === true) reasons.push('target package installation during research');
  return { permitted: reasons.length === 0, reasons };
}

// --- lazy capability activation ---------------------------------------------
function capabilityActivation(requiredCaps, availableCaps) {
  requiredCaps = requiredCaps || [];
  const have = new Set(availableCaps || []);
  const activateNow = [];   // L2/L3 required-but-missing → install on demand
  const missingBlocking = []; // L0/L1 required-but-missing → blocks
  for (const cap of requiredCaps) {
    if (have.has(cap)) continue;
    if (levelOf(cap) <= 1) missingBlocking.push(cap);
    else activateNow.push(cap);
  }
  return {
    activateNow, missingBlocking,
    planningBlocked: false, // planning (Level 0) is never blocked by L2/L3 absence
  };
}
// Planning readiness: Level 0 always available; Level 1 per detected technology.
function planningReadiness(evidence, available) {
  const have = new Set(available || []);
  const missing = [];
  if (!have.has('repository-version-control')) missing.push('git');
  if (evidence && evidence.domainDotnet && !have.has('build-dotnet')) missing.push('.NET SDK');
  if (evidence && evidence.frontendPresent && !have.has('acquire-npm-package')) missing.push('npm');
  return { status: missing.length === 0 ? 'READY_FOR_PLANNING' : 'PREREQUISITES_MISSING', missingPrerequisites: missing };
}

// --- invocation recording ----------------------------------------------------
function recordInvocation(runDirRel, inv) {
  const dir = P(runDirRel);
  fs.mkdirSync(dir, { recursive: true });
  const line = JSON.stringify(Object.assign({ recordedAt: nowIso() }, inv)) + '\n';
  fs.appendFileSync(path.join(dir, 'skill-invocations.jsonl'), line);
}

module.exports = {
  ROOT, P, nowIso, SKILL_RESULTS, PLAN_STATUSES, UNCERTAINTY_STATUS, IMPACTS, CAPABILITY_LEVEL, levelOf,
  loadRegistry, skills, getSkill, validate, validateSkillIO, isValidTransition, selectSkill,
  blockingUncertainty, uncertaintyBlocksMutation, uncertaintyBlocksCompletion, canAcceptRisk,
  mutationGate, capabilityActivation, planningReadiness, recordInvocation,
};

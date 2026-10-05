'use strict';
/*
 * Skill-layer test suite. Dependency-free, offline, deterministic. Node 14+.
 * Run: node tools/skills.test.js
 *
 * Covers: registry integrity, per-skill SKILL.md + input/output schema parsing,
 * eval outputs validated against each skill output schema, and the behavioural
 * evaluations required by the dual-repository specification (read-only doctor,
 * inventory, Core inspection, package resolution, mapping, planning gates,
 * mutation gate, audit, learning, escalation).
 */
const fs = require('fs');
const path = require('path');
const e = require('./lib/engine');
const yaml = require('./lib/yaml');
const doctor = require('./lib/doctor');
const request = require('./lib/request');
const inventory = require('./lib/inventory');
const inspectCore = require('./lib/inspect-core');
const resolvePackages = require('./lib/resolve-packages');
const core = require('./lib/core');
const stateM = require('./lib/state-machine');

const FX = (p) => path.join('evals', 'fixtures', p);
const CLIENT = FX('client-ngmodule');
const CORE = FX('core-repo');

const results = [];
function test(id, fn) {
  try { fn(); results.push({ id, pass: true }); }
  catch (err) { results.push({ id, pass: false, error: err.message }); }
}
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }
const readJson = (rel) => JSON.parse(fs.readFileSync(e.P(rel), 'utf8'));

// Shared read-only pipeline (computed once, reused by many evals).
const REQ = request.build({
  'client-path': CLIENT, 'core-path': CORE,
  'source-version': '8.3.0', 'target-version': '9.2.0',
});
const REPORT = doctor.run(REQ);
const INV = inventory.run(REQ.resolved.clientPath);
const COREINV = inspectCore.run(REQ.resolved.corePath, INV, { targetCommit: REPORT.core.targetCommit });
const PKG = resolvePackages.run({
  clientSummary: REPORT.client.summary, clientPath: REQ.resolved.clientPath,
  corePath: REQ.resolved.corePath, coreSummary: REPORT.core.summary,
  targetVersion: REQ.upgrade.targetVersion, policy: core.loadConfig().packageAlignment,
});

// --------------------------------------------------------------------------
// A. Registry + skill-file integrity (structural)
// --------------------------------------------------------------------------
const SKILLS = e.skills();
const SKILL_IDS = SKILLS.map((s) => s.id);
const REQUIRED_SECTIONS = [
  'Purpose', 'Trigger conditions', 'Exclusions', 'Required capabilities', 'Inputs',
  'Procedure', 'Evidence requirements', 'Uncertainty behavior', 'Completion criteria',
  'Retry behavior', 'Escalation behavior', 'Outputs', 'Allowed next skills',
  'Prohibited behavior', 'Evaluations',
];

test('A00-all-skills-registered', () => {
  assert(SKILLS.length === 13, `expected 13 skills, got ${SKILLS.length}`);
});

test('A01-developer-escalation-reachable-everywhere', () => {
  for (const s of SKILLS) {
    if (s.id === 'developer-escalation') continue;
    assert(e.isValidTransition(s.id, 'developer-escalation'), `${s.id} cannot escalate`);
  }
});

for (const s of SKILLS) {
  test(`A-skill-${s.id}`, () => {
    const dir = `skills/${s.id}`;
    // SKILL.md exists with frontmatter + required sections.
    const md = fs.readFileSync(e.P(`${dir}/SKILL.md`), 'utf8');
    assert(/^---[\s\S]*?---/.test(md), `${s.id}: missing YAML frontmatter`);
    for (const sec of REQUIRED_SECTIONS) {
      assert(md.indexOf(`# ${sec}`) !== -1, `${s.id}: missing section '${sec}'`);
    }
    // Input + output schemas parse and are draft-07 objects.
    const inSchema = readJson(s.inputSchema);
    const outSchema = readJson(s.outputSchema);
    for (const sc of [inSchema, outSchema]) {
      assert(sc.type === 'object', `${s.id}: schema type must be object`);
      assert(sc.properties && sc.properties.skillId, `${s.id}: schema needs skillId`);
      assert(sc.properties.skillId.const === s.id, `${s.id}: skillId const mismatch`);
    }
    // Output status enum must exist and contain every registry completion status.
    const enumv = outSchema.properties.status.enum;
    assert(Array.isArray(enumv) && enumv.length > 0, `${s.id}: output status needs enum`);
    for (const cs of s.completionStatuses || []) {
      assert(enumv.includes(cs), `${s.id}: completionStatus '${cs}' not in output enum`);
    }
    // allowedNextSkills reference real skills (or developer-escalation).
    for (const nx of s.allowedNextSkills || []) {
      assert(SKILL_IDS.includes(nx), `${s.id}: allowedNextSkills '${nx}' unknown`);
    }
    // Every eval output validates against the output schema.
    const evalDir = e.P(`${dir}/evals`);
    const evalFiles = fs.readdirSync(evalDir).filter((f) => f.endsWith('.output.json'));
    assert(evalFiles.length > 0, `${s.id}: no eval outputs`);
    for (const f of evalFiles) {
      const inst = readJson(`${dir}/evals/${f}`);
      const errs = e.validateSkillIO(s.id, 'output', inst);
      assert(errs.length === 0, `${s.id}/${f}: ${errs.join(' | ')}`);
      assert(enumv.includes(inst.status), `${s.id}/${f}: status '${inst.status}' not in enum`);
    }
  });
}

// --------------------------------------------------------------------------
// B. Doctor / repository validation (read-only)
// --------------------------------------------------------------------------
test('B01-valid-paths-ready-for-inventory', () => {
  assert(REPORT.status === doctor.STATUS.READY_FOR_INVENTORY, `status=${REPORT.status}`);
});
test('B02-missing-client-path-blocks', () => {
  const req = request.build({ 'core-path': CORE, 'source-version': '8.3.0', 'target-version': '9.2.0' });
  assert(request.validate(req).some((m) => /client/i.test(m)), 'missing client path must be reported');
  const rep = doctor.run(req);
  assert(rep.status === doctor.STATUS.BLOCKED_INVALID_REQUEST, `status=${rep.status}`);
});
test('B03-missing-core-path-blocks', () => {
  const req = request.build({ 'client-path': CLIENT, 'source-version': '8.3.0', 'target-version': '9.2.0' });
  assert(request.validate(req).some((m) => /core/i.test(m)), 'missing core path must be reported');
  const rep = doctor.run(req);
  assert(rep.status === doctor.STATUS.BLOCKED_INVALID_REQUEST, `status=${rep.status}`);
});
test('B04-identical-paths-contradiction', () => {
  const req = request.build({ 'client-path': CLIENT, 'core-path': CLIENT, 'source-version': '8.3.0', 'target-version': '9.2.0' });
  const rep = doctor.run(req);
  assert(rep.contradictions.some((c) => /identical|same/i.test(c.id + c.detail)), 'identical paths must be flagged');
  assert(String(rep.status).startsWith('BLOCKED'), 'identical paths must block');
});
test('B05-nested-paths-contradiction', () => {
  const req = request.build({ 'client-path': CORE, 'core-path': path.dirname(e.P(CORE)) + path.sep, 'source-version': '8.3.0', 'target-version': '9.2.0' });
  const rep = doctor.run(req);
  assert(rep.contradictions.length > 0 || String(rep.status).startsWith('BLOCKED'), 'overlapping paths flagged');
});
test('B06-source-version-agrees-with-client', () => {
  const c = REPORT.client.checks.find((x) => /source|version/i.test(x.id));
  assert(c && c.ok, 'source version should confirm against client');
});
test('B07-source-version-mismatch-blocks', () => {
  const req = request.build({ 'client-path': CLIENT, 'core-path': CORE, 'source-version': '7.0.0', 'target-version': '9.2.0' });
  const rep = doctor.run(req);
  assert(rep.contradictions.some((c) => /source/i.test(c.id)) || String(rep.status).startsWith('BLOCKED'),
    'wrong source version must contradict/block');
});
test('B08-core-identity-recorded', () => {
  const s = REPORT.core.summary;
  assert(s.packageName === 'ngo-core', `core package name=${s.packageName}`);
  assert(s.packageVersion, 'core version recorded');
});
test('B09-doctor-report-validates', () => {
  const errs = e.validateSkillIO('validate-local-repositories', 'output', {
    skillId: 'validate-local-repositories', status: REPORT.status,
    doctorReportRef: 'doctor-report.json', readOnly: true, nextAction: REPORT.nextAction,
  });
  assert(errs.length === 0, errs.join(' | '));
});

// --------------------------------------------------------------------------
// C. Client inventory (read-only, non-standard aware)
// --------------------------------------------------------------------------
test('C01-workspace-classified-ngmodule', () => {
  assert(INV.semanticGraph.workspaceType === 'NGMODULE', `type=${INV.semanticGraph.workspaceType}`);
});
test('C02-bootstrap-style-detected', () => {
  assert(INV.semanticGraph.bootstrapStyle === 'bootstrapModule', `bootstrap=${INV.semanticGraph.bootstrapStyle}`);
});
test('C03-coverage-present-or-absent-with-evidence', () => {
  const rs = INV.coverage.roleStatus || {};
  const keys = Object.keys(rs);
  assert(keys.length > 0, 'coverage roleStatus present');
  for (const k of keys) {
    assert(rs[k] === 'PRESENT' || rs[k] === 'ABSENT_WITH_EVIDENCE', `role ${k} status=${rs[k]}`);
  }
});
test('C04-present-roles-cite-files', () => {
  assert(INV.coverage.coveredRoles.length > 0, 'some roles present');
  const nodes = INV.semanticGraph.nodes || INV.semanticGraph.roles || {};
  for (const role of INV.coverage.coveredRoles) {
    const node = nodes[role];
    if (!node) continue;
    const files = node.files || node;
    assert(Array.isArray(files) ? files.length > 0 : true, `role ${role} lacks files`);
  }
});
test('C05-standalone-fixture-classified', () => {
  const p = FX('client-standalone');
  if (!core.exists(e.P(p))) return; // fixture optional
  const inv = inventory.run(e.P(p));
  assert(inv.semanticGraph.workspaceType === 'STANDALONE', `type=${inv.semanticGraph.workspaceType}`);
});

// --------------------------------------------------------------------------
// D. Core inspection (read-only, scoped)
// --------------------------------------------------------------------------
test('D01-core-inspection-scoped-requirements', () => {
  assert(COREINV.requirementsScaffold.requirements.length > 0, 'requirements derived');
});
test('D02-core-requirements-have-evidence', () => {
  for (const r of COREINV.requirementsScaffold.requirements) {
    assert(r.evidenceSource || r.evidence || r.status === 'REQUIRES_RESEARCH', `requirement ${r.id} lacks evidence`);
  }
});

// --------------------------------------------------------------------------
// E. Package resolution (exact versions from Core)
// --------------------------------------------------------------------------
const pkgByName = {};
for (const p of PKG.alignmentMap.packages) pkgByName[p.name] = p;

test('E01-not-just-core-package', () => {
  assert(PKG.alignmentMap.packages.length > 1, 'more than ngo-core is resolved');
});
test('E02-exact-versions-no-ranges', () => {
  for (const p of PKG.alignmentMap.packages) {
    const v = p.selectedTargetVersion;
    if (v == null) continue;
    assert(!/[\^~*]|latest|\|\|| - /.test(String(v)), `package ${p.name} has non-exact version '${v}'`);
  }
});
test('E03-shared-package-aligned-to-core', () => {
  const rx = pkgByName['rxjs'];
  assert(rx, 'rxjs present');
  assert(rx.selectedTargetVersion === '7.8.1', `rxjs=${rx.selectedTargetVersion}`);
});
test('E04-client-only-preserved', () => {
  const w = pkgByName['acme-client-widgets'];
  assert(w, 'client-only package present');
  assert(/CLIENT_ONLY/.test(w.classification), `classification=${w.classification}`);
});
test('E05-core-only-dev-dep-not-added', () => {
  const t = pkgByName['internal-core-buildtool'];
  assert(!t || /NOT_APPLICABLE|CORE_ONLY/.test(t.classification), 'core internal dev tool must not be added as client dep');
});
test('E06-missing-core-required-added', () => {
  const c = pkgByName['ngx-contextmenu'];
  assert(c, 'core-required package should appear');
});
test('E07-status-reflects-uncertainty', () => {
  assert(/RESOLVED/.test(PKG.status), `status=${PKG.status}`);
});

// --------------------------------------------------------------------------
// F. Planning + mutation gate
// --------------------------------------------------------------------------
test('F01-default-selects-planning', () => {
  const sel = e.selectSkill({ doctorStatus: 'READY_FOR_INVENTORY', clientInventoryDone: true, coreInspectionDone: true, packagesResolved: true, requirementsDerived: true, requirementsMapped: true });
  assert(sel.skillId === 'plan-frontend-upgrade', `selected=${sel.skillId}`);
});
test('F02-execution-requires-ready-plan', () => {
  const g = e.mutationGate({ planExists: true, planStatus: 'RESEARCH_REQUIRED', baselineRecorded: true, rollbackCheckpointExists: true, clientStatusKnown: true, coreFingerprintRecorded: true });
  assert(!g.permitted, 'non-ready plan must block mutation');
});
test('F03-execution-requires-rollback', () => {
  const g = e.mutationGate({ planExists: true, planStatus: 'READY', baselineRecorded: true, rollbackCheckpointExists: false, clientStatusKnown: true, coreFingerprintRecorded: true });
  assert(!g.permitted && g.reasons.some((r) => /rollback/.test(r)), 'missing rollback must block');
});
test('F04-high-uncertainty-blocks-mutation', () => {
  const g = e.mutationGate({ planExists: true, planStatus: 'READY', baselineRecorded: true, rollbackCheckpointExists: true, clientStatusKnown: true, coreFingerprintRecorded: true, uncertaintyRegister: [{ status: 'OPEN', impact: 'CRITICAL' }] });
  assert(!g.permitted && g.reasons.some((r) => /uncertainty/.test(r)), 'HIGH/CRITICAL uncertainty must block');
});
test('F05-core-fingerprint-required-for-mutation', () => {
  const g = e.mutationGate({ planExists: true, planStatus: 'READY', baselineRecorded: true, rollbackCheckpointExists: true, clientStatusKnown: true, coreFingerprintRecorded: false });
  assert(!g.permitted && g.reasons.some((r) => /core/i.test(r)), 'missing core fingerprint must block');
});
test('F06-out-of-plan-action-blocked', () => {
  const g = e.mutationGate({ planExists: true, planStatus: 'READY', baselineRecorded: true, rollbackCheckpointExists: true, clientStatusKnown: true, coreFingerprintRecorded: true, actionInPlan: false });
  assert(!g.permitted && g.reasons.some((r) => /plan/.test(r)), 'action not in plan must block');
});
test('F07-planning-drift-blocks', () => {
  const g = e.mutationGate({ planExists: true, planStatus: 'READY', baselineRecorded: true, rollbackCheckpointExists: true, clientStatusKnown: true, coreFingerprintRecorded: true, planningFingerprintsMatch: false });
  assert(!g.permitted && g.reasons.some((r) => /changed since planning/.test(r)), 'planning drift must block');
});
test('F08-fully-satisfied-gate-permits', () => {
  const g = e.mutationGate({ planExists: true, planStatus: 'READY', baselineRecorded: true, rollbackCheckpointExists: true, clientStatusKnown: true, coreFingerprintRecorded: true, planningFingerprintsMatch: true, actionInPlan: true, uncertaintyRegister: [] });
  assert(g.permitted, 'satisfied gate must permit: ' + g.reasons.join('; '));
});
test('F09-retry-budget-blocks', () => {
  const g = e.mutationGate({ planExists: true, planStatus: 'READY', baselineRecorded: true, rollbackCheckpointExists: true, clientStatusKnown: true, coreFingerprintRecorded: true, retriesExceeded: true });
  assert(!g.permitted && g.reasons.some((r) => /retry/.test(r)), 'exceeded retries must block');
});

// --------------------------------------------------------------------------
// G. State machine / resume / documentation / escalation
// --------------------------------------------------------------------------
test('G01-mutation-phases-marked', () => {
  assert(stateM.isMutationPhase('EXECUTE') && stateM.isMutationPhase('BUILD_AND_FIX') && stateM.isMutationPhase('CHECKPOINT'), 'mutation phases');
  assert(stateM.isReadOnlyPhase('INVENTORY_CLIENT') && stateM.isReadOnlyPhase('INSPECT_CORE'), 'read-only phases');
});
test('G02-handover-reachable-from-any-state', () => {
  for (const st of stateM.STATES) {
    if (st === 'HANDOVER' || st === 'COMPLETE') continue;
    assert(stateM.isValidTransition(st, 'HANDOVER'), `${st} cannot reach HANDOVER`);
  }
});
test('G03-documentation-completeness-gate', () => {
  assert(stateM.documentationComplete({}) === false, 'empty docs not complete');
  const full = {};
  for (const item of stateM.REQUIRED_DOC_ITEMS) full[item] = true;
  assert(stateM.documentationComplete(full) === true, 'all docs complete');
});
test('G04-repeated-failure-escalates', () => {
  assert(stateM.shouldEscalateRepeat(4, 3) === true, 'exceeding repeat budget escalates');
  assert(stateM.shouldEscalateRepeat(1, 3) === false, 'within budget continues');
});
test('G05-escalation-terminal-with-next-action', () => {
  const out = readJson('skills/developer-escalation/evals/escalated.output.json');
  assert(out.nextAction && out.resumeCommand, 'escalation gives exact next action + resume');
});

// --------------------------------------------------------------------------
// H. Learning (candidates only)
// --------------------------------------------------------------------------
test('H01-learning-writes-candidates-only', () => {
  const out = readJson('skills/learn-from-frontend-run/evals/candidates.output.json');
  assert(out.approvedWritten === false, 'learning must not write approved memory');
});

// --------------------------------------------------------------------------
// Report
// --------------------------------------------------------------------------
const failed = results.filter((r) => !r.pass);
for (const r of results) {
  process.stdout.write(`${r.pass ? 'PASS' : 'FAIL'}  ${r.id}${r.pass ? '' : '  -> ' + r.error}\n`);
}
process.stdout.write(`\n${results.length - failed.length}/${results.length} passed\n`);
process.exit(failed.length ? 1 : 0);

'use strict';
/*
 * Behavioural evaluation harness for the dual-repository front-end upgrade agent.
 * Dependency-free, offline, deterministic. Node 14+.
 * Run: node tools/run-evals.js
 *
 * Drives the real read-only pipeline (doctor -> inventory -> core inspection ->
 * package resolution) and the mutation/uncertainty gates against local fixtures,
 * then scores each scenario. No repository is mutated; Core is only inspected.
 */
const path = require('path');
const engine = require('./lib/engine');
const doctor = require('./lib/doctor');
const request = require('./lib/request');
const inventory = require('./lib/inventory');
const inspectCore = require('./lib/inspect-core');
const resolvePackages = require('./lib/resolve-packages');
const core = require('./lib/core');

const FX = (p) => path.join('evals', 'fixtures', p);
const CLIENT = FX('client-ngmodule');
const CORE = FX('core-repo');

function buildReq(over) {
  return request.build(Object.assign({
    'client-path': CLIENT, 'core-path': CORE,
    'source-version': '8.3.0', 'target-version': '9.2.0',
  }, over || {}));
}

const scenarios = [];
const add = (id, category, fn) => scenarios.push({ id, category, fn });
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }

// --- Doctor / repository validation ----------------------------------------
add('valid-repositories-ready', 'doctor', () => {
  const r = doctor.run(buildReq());
  assert(r.status === doctor.STATUS.READY_FOR_INVENTORY, `status=${r.status}`);
  assert(r.readOnly === true, 'doctor is read-only');
});
add('missing-client-path-invalid-request', 'doctor', () => {
  const r = doctor.run(buildReq({ 'client-path': undefined }));
  assert(r.status === doctor.STATUS.BLOCKED_INVALID_REQUEST, `status=${r.status}`);
});
add('identical-paths-blocked', 'doctor', () => {
  const r = doctor.run(buildReq({ 'core-path': CLIENT }));
  assert(String(r.status).startsWith('BLOCKED'), `status=${r.status}`);
});
add('source-version-mismatch-flagged', 'doctor', () => {
  const r = doctor.run(buildReq({ 'source-version': '7.0.0' }));
  assert(r.contradictions.length > 0 || String(r.status).startsWith('BLOCKED'), 'mismatch flagged');
});

// --- Inventory --------------------------------------------------------------
add('client-classified-ngmodule', 'inventory', () => {
  const inv = inventory.run(buildReq().resolved.clientPath);
  assert(inv.semanticGraph.workspaceType === 'NGMODULE', inv.semanticGraph.workspaceType);
  assert(inv.semanticGraph.bootstrapStyle === 'bootstrapModule', inv.semanticGraph.bootstrapStyle);
});
add('coverage-is-present-or-absent-with-evidence', 'inventory', () => {
  const inv = inventory.run(buildReq().resolved.clientPath);
  for (const [role, st] of Object.entries(inv.coverage.roleStatus || {})) {
    assert(st === 'PRESENT' || st === 'ABSENT_WITH_EVIDENCE', `${role}=${st}`);
  }
});
add('environment-service-detected', 'inventory', () => {
  const inv = inventory.run(buildReq().resolved.clientPath);
  assert(inv.coverage.coveredRoles.includes('environmentService'), 'app-environment.service.ts recognised');
});

// --- Core inspection --------------------------------------------------------
add('core-inspection-scoped-and-readonly', 'core', () => {
  const req = buildReq();
  const inv = inventory.run(req.resolved.clientPath);
  const ci = inspectCore.run(req.resolved.corePath, inv, {});
  assert(ci.requirementsScaffold.requirements.length > 0, 'requirements derived');
});

// --- Package resolution -----------------------------------------------------
function resolveFixture() {
  const req = buildReq();
  const rep = doctor.run(req);
  return resolvePackages.run({
    clientSummary: rep.client.summary, clientPath: req.resolved.clientPath,
    corePath: req.resolved.corePath, coreSummary: rep.core.summary,
    targetVersion: req.upgrade.targetVersion, policy: core.loadConfig().packageAlignment,
  });
}
add('packages-not-only-core', 'packages', () => {
  assert(resolveFixture().alignmentMap.packages.length > 1, 'more than ngo-core resolved');
});
add('packages-exact-versions', 'packages', () => {
  for (const p of resolveFixture().alignmentMap.packages) {
    if (p.selectedTargetVersion == null) continue;
    assert(!/[\^~*]|latest/.test(String(p.selectedTargetVersion)), `${p.name}=${p.selectedTargetVersion}`);
  }
});
add('shared-package-aligned', 'packages', () => {
  const rx = resolveFixture().alignmentMap.packages.find((p) => p.name === 'rxjs');
  assert(rx && rx.selectedTargetVersion === '7.8.1', `rxjs=${rx && rx.selectedTargetVersion}`);
});
add('client-only-preserved', 'packages', () => {
  const w = resolveFixture().alignmentMap.packages.find((p) => p.name === 'acme-client-widgets');
  assert(w && /CLIENT_ONLY/.test(w.classification), 'client-only preserved');
});
add('core-dev-tool-not-added', 'packages', () => {
  const t = resolveFixture().alignmentMap.packages.find((p) => p.name === 'internal-core-buildtool');
  assert(!t || /NOT_APPLICABLE|CORE_ONLY/.test(t.classification), 'core dev tool not added');
});

// --- Planning + mutation gate ----------------------------------------------
add('planning-is-default', 'gate', () => {
  const sel = engine.selectSkill({ doctorStatus: 'READY_FOR_INVENTORY', clientInventoryDone: true, coreInspectionDone: true, packagesResolved: true, requirementsDerived: true, requirementsMapped: true });
  assert(sel.skillId === 'plan-frontend-upgrade', sel.skillId);
});
add('mutation-requires-ready-plan', 'gate', () => {
  assert(!engine.mutationGate({ planExists: true, planStatus: 'RESEARCH_REQUIRED', baselineRecorded: true, rollbackCheckpointExists: true, clientStatusKnown: true, coreFingerprintRecorded: true }).permitted, 'non-ready blocks');
});
add('mutation-requires-rollback', 'gate', () => {
  const g = engine.mutationGate({ planExists: true, planStatus: 'READY', baselineRecorded: true, rollbackCheckpointExists: false, clientStatusKnown: true, coreFingerprintRecorded: true });
  assert(!g.permitted && g.reasons.some((r) => /rollback/.test(r)), 'rollback required');
});
add('mutation-requires-core-fingerprint', 'gate', () => {
  const g = engine.mutationGate({ planExists: true, planStatus: 'READY', baselineRecorded: true, rollbackCheckpointExists: true, clientStatusKnown: true, coreFingerprintRecorded: false });
  assert(!g.permitted && g.reasons.some((r) => /core/i.test(r)), 'core fingerprint required');
});
add('high-uncertainty-blocks-mutation', 'gate', () => {
  const g = engine.mutationGate({ planExists: true, planStatus: 'READY', baselineRecorded: true, rollbackCheckpointExists: true, clientStatusKnown: true, coreFingerprintRecorded: true, uncertaintyRegister: [{ status: 'OPEN', impact: 'HIGH' }] });
  assert(!g.permitted, 'high uncertainty blocks');
});
add('satisfied-gate-permits', 'gate', () => {
  const g = engine.mutationGate({ planExists: true, planStatus: 'READY', baselineRecorded: true, rollbackCheckpointExists: true, clientStatusKnown: true, coreFingerprintRecorded: true, planningFingerprintsMatch: true, actionInPlan: true, uncertaintyRegister: [] });
  assert(g.permitted, 'satisfied gate permits: ' + g.reasons.join('; '));
});

// --- Run -------------------------------------------------------------------
const results = scenarios.map((s) => {
  try { s.fn(); return { id: s.id, category: s.category, pass: true }; }
  catch (e) { return { id: s.id, category: s.category, pass: false, error: e.message }; }
});
const byCat = {};
for (const r of results) {
  byCat[r.category] = byCat[r.category] || { pass: 0, total: 0 };
  byCat[r.category].total++;
  if (r.pass) byCat[r.category].pass++;
  process.stdout.write(`${r.pass ? 'PASS' : 'FAIL'}  [${r.category}] ${r.id}${r.pass ? '' : '  -> ' + r.error}\n`);
}
process.stdout.write('\nby category:\n');
for (const [c, v] of Object.entries(byCat)) process.stdout.write(`  ${c}: ${v.pass}/${v.total}\n`);
const failed = results.filter((r) => !r.pass).length;
process.stdout.write(`\n${results.length - failed}/${results.length} scenarios passed\n`);
process.exit(failed ? 1 : 0);

'use strict';
/*
 * orchestrator test suite. Dependency-free, Node 14+. Run: node tests/orchestrator.test.js
 * Uses a temp HOME override (ORCHESTRATOR_TEST_RUNS_ROOT is not read by the
 * module — instead each test creates/cleans its own client id under the
 * real runs/ dir and removes it afterward) plus fixture state.json files
 * for backend/frontend, so no real git repo or real ingest call is needed.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const yaml = require('../tools/lib/yaml');
const runLib = require('../tools/lib/run');
const requirementsLib = require('../tools/lib/requirements');
const coverageLib = require('../tools/lib/coverage');
const handoverLib = require('../tools/lib/handover');
const orchestrator = require('../tools/orchestrator');

const results = [];
function test(id, fn) { try { fn(); results.push({ id, pass: true }); } catch (e) { results.push({ id, pass: false, error: e.stack || e.message }); } }
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }

const TEST_CLIENT = `orchestrator-test-${process.pid}`;
const TEMPLATES_DIR = path.resolve(__dirname, '..', 'templates');

// --- lib/yaml.js ---------------------------------------------------------
test('01-yaml-roundtrip', () => {
  const obj = { a: 1, b: 'x', c: [1, 2, { d: 'e' }], empty: [], nested: { f: null } };
  const text = yaml.stringify(obj);
  const back = yaml.parse(text);
  assert(back.a === 1 && back.b === 'x' && back.c.length === 3 && back.c[2].d === 'e', 'roundtrip mismatch: ' + text);
  assert(Array.isArray(back.empty) && back.empty.length === 0, 'empty array should roundtrip as []');
});

// --- lib/run.js ------------------------------------------------------------
test('02-run-id-is-sanitized-and-timestamped', () => {
  const id = runLib.newRunId('Some Client!!');
  assert(/^some-client-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z$/.test(id), `unexpected run id shape: ${id}`);
});

// --- lib/requirements.js ---------------------------------------------------
const tmpIngestRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'orchestrator-test-ingest-'));
test('03-requirements-split-backend-frontend-shared', () => {
  const candidateDir = path.join(tmpIngestRoot, 'knowledge', 'candidates', 'releases');
  fs.mkdirSync(candidateDir, { recursive: true });
  fs.writeFileSync(path.join(candidateDir, '9.9.9.json'), JSON.stringify({
    schemaVersion: 1, version: '9.9.9', status: 'CANDIDATE', ingestedAt: '2026-01-01T00:00:00Z',
    sources: { coreRepoPath: 'x', tagRange: { from: 'v9.9.8', to: 'v9.9.9' } },
    findings: {
      backend: [{ scope: 'backend', category: 'dotnet-source', path: 'a.cs', statement: 'workflow-flexibility change', source: 'git-diff', crossCheck: 'CONFIRMED_BY_DIFF_AND_NOTES', evidence: 'e' }],
      frontend: [{ scope: 'frontend', category: 'ts', path: 'b.ts', statement: 'finance module route added', source: 'git-diff', crossCheck: 'CONFIRMED_BY_DIFF_AND_NOTES', evidence: 'e' }],
      shared: [{ scope: 'shared', category: 'deployment-config', path: 'web.config', statement: 'security header change', source: 'git-diff', crossCheck: 'OBSERVED_IN_DIFF_NOT_MENTIONED_IN_NOTES', evidence: 'e' }]
    },
    unresolvedItems: ['9.9.9 [shared] web.config: unconfirmed'],
    nextAction: 'review'
  }, null, 2));

  const featureDecisionsPath = path.join(tmpIngestRoot, 'feature-decisions.yaml');
  fs.writeFileSync(featureDecisionsPath, yaml.stringify({ features: { finance: { decision: 'EXCLUDED', evidence: 'client-request' } } }));

  const split = requirementsLib.splitRequirements({ ingestRoot: tmpIngestRoot, version: '9.9.9', featureDecisionsPath, runId: 'r1' });
  assert(split.hadCandidateRecord === true, 'should have found the candidate record');
  assert(split.backend.requirements.length === 2, 'backend.yaml should have 2 requirements (1 backend finding + 1 shared finding)');
  assert(split.shared.requirements.length === 1, 'shared.yaml should have 1 requirement');
  assert(split.frontend.requirements.length === 1, 'frontend.yaml should keep the shared finding after filtering the excluded frontend finding');
  assert(split.frontend.excluded.length === 1 && split.frontend.excluded[0].excludedByFeature === 'finance', 'excluded finding should be recorded, not silently dropped');
  assert(split.all.requirements.length === 3, 'all.yaml should keep every finding regardless of exclusion');
});

test('04-requirements-split-without-candidate-record', () => {
  const split = requirementsLib.splitRequirements({ ingestRoot: tmpIngestRoot, version: '0.0.1', featureDecisionsPath: null, runId: 'r2' });
  assert(split.hadCandidateRecord === false, 'missing candidate record should be reported, not throw');
  assert(split.all.requirements.length === 0, 'no findings when there is no candidate record');
});

// --- lib/coverage.js --------------------------------------------------------
const tmpFrontendRun = fs.mkdtempSync(path.join(os.tmpdir(), 'orchestrator-test-frontend-run-'));
test('05-coverage-merges-frontend-structured-and-backend-synthetic', () => {
  fs.writeFileSync(path.join(tmpFrontendRun, 'requirement-coverage.yaml'), yaml.stringify({
    schemaVersion: 1, runId: 'fe-1',
    requirements: [
      { id: 'REQ-1', scope: 'FRONTEND', status: 'VERIFIED', mappedFiles: [], changedFiles: [] },
      { id: 'REQ-2', scope: 'FRONTEND', status: 'DECISION_PENDING', owner: 'deployment-owner' }
    ]
  }));
  const backendState = { status: 'SUCCEEDED', currentPhase: 'BUILD_AND_FIX', pendingSteps: ['06-test'], unresolvedIssues: ['flaky integration test'] };
  const { coverage, missingSteps } = coverageLib.verifyCoverage({ runId: 'shared-1', frontendRunDir: tmpFrontendRun, backendState });

  assert(coverage.requirements.length === 4, `expected 2 frontend + 2 backend-synthetic entries, got ${coverage.requirements.length}`);
  assert(coverage.requirements.some((r) => r.source === 'frontend-track' && r.status === 'VERIFIED'), 'should reuse frontend entries verbatim');
  assert(coverage.requirements.some((r) => r.source === 'backend-track-synthetic' && r.id === 'BACKEND-UNRESOLVED-1'), 'should synthesize one entry per backend unresolved issue');
  assert(coverage.requirements.some((r) => r.id === 'BACKEND-TRACK-OVERALL' && r.status === 'IMPLEMENTED'), 'backend overall status should reflect SUCCEEDED-but-pending-steps as IMPLEMENTED not VERIFIED');
  assert(missingSteps.items.some((i) => i.id === 'REQ-2' && /decision/.test(i.reason)), 'DECISION_PENDING item should appear in missing-steps with a reason');
  assert(!missingSteps.items.some((i) => i.id === 'REQ-1'), 'VERIFIED item should not appear in missing-steps');
});

test('06-coverage-handles-missing-tracks-gracefully', () => {
  const { coverage, missingSteps } = coverageLib.verifyCoverage({ runId: 'shared-2', frontendRunDir: null, backendState: null });
  assert(coverage.requirements.length === 0 && missingSteps.items.length === 0, 'no tracks composed yet should produce an empty, not a thrown, result');
});

// --- lib/handover.js ---------------------------------------------------------
test('07-handover-merges-frontend-checklist-and-backend-pointer', () => {
  fs.writeFileSync(path.join(tmpFrontendRun, 'deployment-checklist.yaml'), yaml.stringify({
    schemaVersion: 1,
    items: [{ id: 'REQ-2', action: 'Set config', owner: 'deployment-owner', timing: 'AFTER_DEPLOYMENT', instructions: 'Set X', risk: 'MEDIUM', verification: 'config present', status: 'DECISION_PENDING' }]
  }));
  const backendState = { status: 'SUCCEEDED', targetVersion: '9.2.1', nextAction: 'run migration', safeResumeInstruction: 'resume at 06-test' };
  const { checklist, beforeMd, afterMd } = handoverLib.prepareHandover({
    runId: 'shared-1', clientId: 'acme', sourceVersion: '9.2.0', targetVersion: '9.2.1',
    frontendRunDir: tmpFrontendRun, backendState, backendRunRef: '/tmp/backend-run', frontendRunRef: tmpFrontendRun,
    templatesDir: TEMPLATES_DIR
  });
  assert(checklist.items.length === 2, 'should merge 1 frontend item + 1 backend pointer item');
  assert(checklist.items.some((i) => i.source === 'frontend-track'), 'frontend item should be tagged frontend-track');
  assert(checklist.items.some((i) => i.source === 'backend-track-manual-review'), 'backend pointer item should be tagged backend-track-manual-review');
  assert(/Set config/.test(afterMd), 'after-deployment.md should render the merged AFTER_DEPLOYMENT items');
  assert(/BACKEND-MANUAL-REVIEW/.test(afterMd), 'after-deployment.md should surface the backend pointer item, not hide it');
});

// --- end-to-end CLI flow (isolated fake ingest root — no real git needed) ---
const e2eIngestRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'orchestrator-test-e2e-ingest-'));
const e2eBackendRun = fs.mkdtempSync(path.join(os.tmpdir(), 'orchestrator-test-backend-run-'));
const e2eFrontendRun = fs.mkdtempSync(path.join(os.tmpdir(), 'orchestrator-test-frontend-run-'));
let e2eRunId = null;

test('08-e2e-create-run', () => {
  const candidateDir = path.join(e2eIngestRoot, 'knowledge', 'candidates', 'releases');
  fs.mkdirSync(candidateDir, { recursive: true });
  fs.writeFileSync(path.join(candidateDir, '9.2.1.json'), JSON.stringify({
    schemaVersion: 1, version: '9.2.1', status: 'CANDIDATE', ingestedAt: '2026-01-01T00:00:00Z',
    sources: { coreRepoPath: 'x', tagRange: { from: 'v9.2.0', to: 'v9.2.1' } },
    findings: { backend: [], frontend: [], shared: [] }, unresolvedItems: [], nextAction: 'review'
  }, null, 2));

  const code = orchestrator.cmdCreateRun.call(null, { client: TEST_CLIENT, tracks: 'backend,frontend', 'target-version': '9.2.1', 'ingest-root': e2eIngestRoot });
  assert(code === 0, `expected exit 0, got ${code}`);
  const clientDir = path.join(runLib.RUNS_ROOT, runLib.sanitizeClientId(TEST_CLIENT));
  const runIds = fs.readdirSync(clientDir);
  assert(runIds.length === 1, `expected exactly 1 run dir, got ${runIds.length}`);
  e2eRunId = runIds[0];
  const reqDir = path.join(clientDir, e2eRunId, 'requirements');
  assert(fs.existsSync(path.join(reqDir, 'backend.yaml')) && fs.existsSync(path.join(reqDir, 'frontend.yaml')), 'requirements seeds should be written');
});

test('09-e2e-compose-results', () => {
  fs.writeFileSync(path.join(e2eBackendRun, 'state.json'), JSON.stringify({ status: 'SUCCEEDED', currentPhase: 'HANDOVER', pendingSteps: [], unresolvedIssues: [], targetVersion: '9.2.1' }));
  fs.writeFileSync(path.join(e2eFrontendRun, 'state.json'), JSON.stringify({ status: 'COMPLETE', targetVersion: '9.2.1' }));
  const code = orchestrator.cmdComposeResults.call(null, { run: `${TEST_CLIENT}/${e2eRunId}`, 'backend-run': e2eBackendRun, 'frontend-run': e2eFrontendRun });
  assert(code === 0, `expected exit 0, got ${code}`);
  const state = orchestrator.cmdStatus ? runLib.readJson(path.join(runLib.runDir(TEST_CLIENT, e2eRunId), 'state.json')) : null;
  assert(state.status === 'RESULTS_COMPOSED', `expected RESULTS_COMPOSED, got ${state.status}`);
  assert(state.trackStatus.backend === 'SUCCEEDED' && state.trackStatus.frontend === 'COMPLETE', 'trackStatus should reflect each composed result');
});

test('10-e2e-verify-coverage-then-prepare-handover-then-final-report', () => {
  let code = orchestrator.cmdVerifyCoverage.call(null, { run: `${TEST_CLIENT}/${e2eRunId}` });
  assert(code === 0, `verify-coverage expected exit 0, got ${code}`);
  code = orchestrator.cmdPrepareHandover.call(null, { run: `${TEST_CLIENT}/${e2eRunId}` });
  assert(code === 0, `prepare-handover expected exit 0, got ${code}`);
  code = orchestrator.cmdFinalReport.call(null, { run: `${TEST_CLIENT}/${e2eRunId}` });
  assert(code === 0, `final-report expected exit 0, got ${code}`);

  const base = runLib.runDir(TEST_CLIENT, e2eRunId);
  assert(fs.existsSync(path.join(base, 'requirement-coverage.yaml')), 'requirement-coverage.yaml should exist');
  assert(fs.existsSync(path.join(base, 'deployment-checklist.yaml')), 'deployment-checklist.yaml should exist');
  assert(fs.existsSync(path.join(base, 'final-report.md')), 'final-report.md should exist');
});

test('11-e2e-prepare-handover-refuses-before-verify-coverage', () => {
  const code = orchestrator.cmdCreateRun.call(null, { client: `${TEST_CLIENT}-gate`, tracks: 'backend', 'target-version': '9.2.1' });
  assert(code === 0);
  const clientDir = path.join(runLib.RUNS_ROOT, runLib.sanitizeClientId(`${TEST_CLIENT}-gate`));
  const runId = fs.readdirSync(clientDir)[0];
  const rc = orchestrator.cmdPrepareHandover.call(null, { run: `${TEST_CLIENT}-gate/${runId}` });
  assert(rc === 1, 'prepare-handover before verify-coverage must be refused, not silently proceed');
  fs.rmSync(clientDir, { recursive: true, force: true });
});

test('12-cleanup', () => {
  fs.rmSync(path.join(runLib.RUNS_ROOT, runLib.sanitizeClientId(TEST_CLIENT)), { recursive: true, force: true });
  fs.rmSync(tmpIngestRoot, { recursive: true, force: true });
  fs.rmSync(tmpFrontendRun, { recursive: true, force: true });
  fs.rmSync(e2eIngestRoot, { recursive: true, force: true });
  fs.rmSync(e2eBackendRun, { recursive: true, force: true });
  fs.rmSync(e2eFrontendRun, { recursive: true, force: true });
  assert(!fs.existsSync(path.join(runLib.RUNS_ROOT, runLib.sanitizeClientId(TEST_CLIENT))));
});

// --- report ---
const passed = results.filter((r) => r.pass).length;
console.log('orchestrator test suite');
for (const r of results) console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.id}${r.error ? '  -> ' + r.error : ''}`);
console.log(`\n${passed}/${results.length} passed, ${results.length - passed} failed.`);
process.exit(passed === results.length ? 0 : 1);

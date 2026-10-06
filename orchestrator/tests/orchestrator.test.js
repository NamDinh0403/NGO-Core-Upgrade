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
const contextLib = require('../tools/lib/context');

const results = [];
function test(id, fn) { try { fn(); results.push({ id, pass: true }); } catch (e) { results.push({ id, pass: false, error: e.stack || e.message }); } }
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }

const TEST_CLIENT = `orchestrator-test-${process.pid}`;
const TEMPLATES_DIR = path.resolve(__dirname, '..', '..', 'engine', 'templates');

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
  fs.mkdirSync(path.join(e2eIngestRoot, 'tools'), { recursive: true });
  fs.writeFileSync(path.join(e2eIngestRoot, 'tools', 'ingest.js'), `
    const fs = require('fs'); const path = require('path');
    exports.ensureReleases = (flags) => {
      if (flags['core-path'] === 'fail') throw new Error('fixture ingestion failure');
      const file = path.join(flags.out, flags.target + '.json');
      fs.writeFileSync(path.join(flags.out, 'last-flags.json'), JSON.stringify(flags));
      const record = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (flags['core-path'] === 'race') fs.writeFileSync(file, JSON.stringify(Object.assign({}, record, { findings: { backend: [], frontend: [{ statement: 'concurrent replacement' }], shared: [] } })));
      return { reused: true, entries: [{ path: file, reused: true, record }] };
    };
  `);

  const code = orchestrator.cmdCreateRun.call(null, { client: TEST_CLIENT, tracks: 'backend,frontend', 'source-version': '9.2.0', 'target-version': '9.2.1', 'core-path': 'fixture', 'ingest-root': e2eIngestRoot });
  assert(code === 0, `expected exit 0, got ${code}`);
  const clientDir = path.join(runLib.RUNS_ROOT, runLib.sanitizeClientId(TEST_CLIENT));
  const runIds = fs.readdirSync(clientDir);
  assert(runIds.length === 1, `expected exactly 1 run dir, got ${runIds.length}`);
  e2eRunId = runIds[0];
  const reqDir = path.join(clientDir, e2eRunId, 'requirements');
  assert(fs.existsSync(path.join(reqDir, 'backend.yaml')) && fs.existsSync(path.join(reqDir, 'frontend.yaml')), 'requirements seeds should be written');
  const forwarded = JSON.parse(fs.readFileSync(path.join(candidateDir, 'last-flags.json'), 'utf8'));
  assert(forwarded.since === '9.2.0', 'source release must be forwarded to ingestion');
  assert(orchestrator.cmdVerifyCoverage({ run: `${TEST_CLIENT}/${e2eRunId}` }) === 1, 'missing track results must block coverage');
});

test('09-e2e-compose-results', () => {
  const historicalFile = path.join(runLib.runDir(TEST_CLIENT, e2eRunId), 'state.json');
  const historical = runLib.readJson(historicalFile);
  assert(historical.executionContract === 'ENGINE', 'new runs require engine validation');
  delete historical.executionContract;
  runLib.writeJson(historicalFile, historical);
  fs.writeFileSync(path.join(e2eBackendRun, 'state.json'), JSON.stringify({ status: 'SUCCEEDED', currentPhase: 'HANDOVER', pendingSteps: [], unresolvedIssues: [], targetVersion: '9.2.1' }));
  fs.writeFileSync(path.join(e2eFrontendRun, 'state.json'), JSON.stringify({ status: 'COMPLETE', targetVersion: '9.2.1' }));
  fs.writeFileSync(path.join(e2eFrontendRun, 'requirement-coverage.yaml'), yaml.stringify({ requirements: [] }));
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
  assert(runLib.readJson(path.join(base, 'state.json')).status === 'COMPLETE', 'valid full run must complete');
  assert(orchestrator.cmdFinalReport({ run: `${TEST_CLIENT}/${e2eRunId}` }) === 0 && runLib.readJson(path.join(base, 'state.json')).status === 'COMPLETE', 'report regeneration must be idempotent');
});

test('11-e2e-prepare-handover-refuses-before-verify-coverage', () => {
  const code = orchestrator.cmdCreateRun.call(null, { client: `${TEST_CLIENT}-gate`, tracks: 'backend', 'source-version': '9.2.0', 'target-version': '9.2.1', 'core-path': 'fixture', 'ingest-root': e2eIngestRoot });
  assert(code === 0);
  const clientDir = path.join(runLib.RUNS_ROOT, runLib.sanitizeClientId(`${TEST_CLIENT}-gate`));
  const runId = fs.readdirSync(clientDir)[0];
  const rc = orchestrator.cmdPrepareHandover.call(null, { run: `${TEST_CLIENT}-gate/${runId}` });
  assert(rc === 1, 'prepare-handover before verify-coverage must be refused, not silently proceed');
  fs.rmSync(clientDir, { recursive: true, force: true });
});

test('12-failed-ingestion-blocks-delegation', () => {
  for (const corePath of [null, 'fail']) {
    const client = `${TEST_CLIENT}-failure-${corePath || 'missing'}`;
    const code = orchestrator.cmdCreateRun({ client, 'source-version': '9.2.0', 'target-version': '9.2.1', 'core-path': corePath, 'ingest-root': e2eIngestRoot });
    assert(code === 1, 'missing/failed ingestion must fail');
    const directory = path.join(runLib.RUNS_ROOT, client);
    const state = runLib.readJson(path.join(directory, fs.readdirSync(directory)[0], 'state.json'));
    assert(state.status === 'BLOCKED' && !state.ingestCandidateRef && /do not delegate/.test(state.nextAction), 'failure must retain explicit resumable blocked state');
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('13-missing-or-blocked-track-cannot-complete', () => {
  const base = runLib.runDir(TEST_CLIENT, e2eRunId);
  const original = runLib.readJson(path.join(base, 'state.json'));
  for (const replacement of [{ frontendRunRef: null }, { trackStatus: { backend: 'SUCCEEDED', frontend: 'BLOCKED' } }]) {
    const state = Object.assign({}, original, replacement, { status: 'HANDOVER_READY' });
    if (replacement.trackStatus) fs.writeFileSync(path.join(e2eFrontendRun, 'state.json'), JSON.stringify({ status: 'BLOCKED_NEEDS_CONTEXT', safeResumeInstruction: 'EXACT fixture resume' }));
    runLib.writeJson(path.join(base, 'state.json'), state);
    orchestrator.cmdFinalReport({ run: `${TEST_CLIENT}/${e2eRunId}` });
    const after = runLib.readJson(path.join(base, 'state.json'));
    assert(after.status === 'BLOCKED', 'missing/blocked track cannot COMPLETE even with clear old coverage');
    if (replacement.trackStatus) assert(after.nextAction.includes('EXACT fixture resume'), 'exact track resume instruction must survive');
  }
});

test('14-cumulative-seed-keeps-intermediate-version', () => {
  const records = ['9.1.0', '9.2.0'].map((version) => ({ path: version, record: { version, findings: { backend: [{ statement: version }], frontend: [], shared: [] }, unresolvedItems: [version] } }));
  const split = requirementsLib.splitRequirements({ ingestRoot: tmpIngestRoot, version: '9.2.0', records, runId: 'range' });
  assert(split.backend.requirements.length === 2 && split.backend.requirements[0].id.startsWith('9.1.0'), 'seed must retain intermediate release and stable IDs');
  assert(split.all.unresolvedItems.length === 2, 'intermediate unresolved evidence must survive');
});

test('15-discovery-contract-links-and-installed-root', () => {
  const root = path.resolve(__dirname, '..', '..');
  const primary = fs.readFileSync(path.join(root, '.github', 'agents', 'ngo-core-upgrade-orchestrator.agent.md'), 'utf8');
  assert(/^name: ngo-core-upgrade$/m.test(primary), 'existing primary agent must expose public name');
  for (const name of ['ngo-core-backend-upgrade', 'ngo-core-frontend-upgrade', 'ngo-core-upgrade-orchestrator']) {
    for (const relative of [`.github/agents/${name}.agent.md`, `.github/skills/${name}/SKILL.md`]) {
      const file = path.join(root, relative);
      const text = fs.readFileSync(file, 'utf8');
      assert(/^---\r?\n[\s\S]*?\r?\n---\r?\n/.test(text) && /^description: .+/m.test(text), 'discovery frontmatter must remain valid');
      for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
        assert(fs.existsSync(path.resolve(path.dirname(file), match[1].split('#')[0])), `broken discovery link: ${relative} ${match[1]}`);
      }
    }
  }
  for (const installer of ['install.ps1', 'install.sh']) {
    const text = fs.readFileSync(path.join(root, installer), 'utf8');
    assert(text.includes('orchestrator/') && text.includes('ngo-core-upgrade'), 'installer must include shared root and public identity');
  }
});

test('16-source-version-is-required', () => {
  const client = `${TEST_CLIENT}-no-source`;
  assert(orchestrator.cmdCreateRun({ client, 'target-version': '9.2.1', 'core-path': 'fixture', 'ingest-root': e2eIngestRoot }) === 1, 'undiscovered source must block');
  fs.rmSync(path.join(runLib.RUNS_ROOT, client), { recursive: true, force: true });
});

test('17-changed-or-missing-evidence-cannot-complete', () => {
  const base = runLib.runDir(TEST_CLIENT, e2eRunId);
  fs.writeFileSync(path.join(e2eFrontendRun, 'state.json'), JSON.stringify({ status: 'COMPLETE', targetVersion: '9.2.1' }));
  assert(orchestrator.cmdVerifyCoverage({ run: `${TEST_CLIENT}/${e2eRunId}` }) === 0);
  assert(orchestrator.cmdPrepareHandover({ run: `${TEST_CLIENT}/${e2eRunId}` }) === 0);
  fs.writeFileSync(path.join(e2eFrontendRun, 'requirement-coverage.yaml'), yaml.stringify({ requirements: [{ id: 'new', status: 'FAILED' }] }));
  orchestrator.cmdFinalReport({ run: `${TEST_CLIENT}/${e2eRunId}` });
  assert(runLib.readJson(path.join(base, 'state.json')).status === 'BLOCKED', 'changed coverage must invalidate old clear summary');
  const candidateFile = path.join(e2eIngestRoot, 'knowledge', 'candidates', 'releases', '9.2.1.json');
  const candidateContent = fs.readFileSync(candidateFile, 'utf8');
  fs.unlinkSync(candidateFile);
  orchestrator.cmdFinalReport({ run: `${TEST_CLIENT}/${e2eRunId}` });
  assert(runLib.readJson(path.join(base, 'state.json')).status === 'BLOCKED', 'deleted candidate must block');
  fs.writeFileSync(candidateFile, candidateContent);
  fs.writeFileSync(path.join(e2eFrontendRun, 'requirement-coverage.yaml'), yaml.stringify({ requirements: [] }));
});

test('18-unaccounted-seed-finding-blocks-coverage', () => {
  const base = runLib.runDir(TEST_CLIENT, e2eRunId);
  fs.writeFileSync(path.join(base, 'requirements', 'frontend.yaml'), yaml.stringify({ requirements: [{ id: 'unaccounted' }] }));
  assert(orchestrator.cmdVerifyCoverage({ run: `${TEST_CLIENT}/${e2eRunId}` }) === 1, 'empty coverage cannot account for a seeded finding');
  assert(runLib.readJson(path.join(base, 'state.json')).nextAction.includes('unaccounted'), 'missing finding must appear in exact next action');
  fs.writeFileSync(path.join(e2eFrontendRun, 'requirement-coverage.yaml'), yaml.stringify({ requirements: [{ id: 'hint', status: 'VERIFIED', sourceCandidateIds: ['unaccounted'], evidence: '   ' }] }));
  assert(orchestrator.cmdVerifyCoverage({ run: `${TEST_CLIENT}/${e2eRunId}` }) === 1, 'blank linked evidence must not satisfy a seed');
  fs.writeFileSync(path.join(e2eFrontendRun, 'release-finding-dispositions.yaml'), yaml.stringify({ findings: [{ id: 'unaccounted', status: 'NOT_APPLICABLE_WITH_EVIDENCE', evidence: 'fixture feature absent from client' }] }));
  assert(orchestrator.cmdVerifyCoverage({ run: `${TEST_CLIENT}/${e2eRunId}` }) === 0, 'explicit evidenced not-applicable disposition must satisfy seed gate');
  fs.unlinkSync(path.join(base, 'requirements', 'frontend.yaml'));
  assert(orchestrator.cmdVerifyCoverage({ run: `${TEST_CLIENT}/${e2eRunId}` }) === 1, 'missing seed must block rather than crash');
});

test('19-concurrent-cache-replacement-invalidates-seed-provenance', () => {
  const file = path.join(e2eIngestRoot, 'knowledge', 'candidates', 'releases', '9.2.1.json');
  const content = fs.readFileSync(file, 'utf8');
  const client = `${TEST_CLIENT}-race`;
  try {
    assert(orchestrator.cmdCreateRun({ client, 'source-version': '9.2.0', 'target-version': '9.2.1', 'core-path': 'race', 'ingest-root': e2eIngestRoot }) === 0);
    const directory = path.join(runLib.RUNS_ROOT, client);
    const runId = fs.readdirSync(directory)[0];
    orchestrator.cmdComposeResults({ run: `${client}/${runId}`, 'backend-run': e2eBackendRun, 'frontend-run': e2eFrontendRun });
    assert(orchestrator.cmdVerifyCoverage({ run: `${client}/${runId}` }) === 1, 'replacement on disk must not become authoritative over returned-record seeds');
  } finally {
    fs.writeFileSync(file, content);
    fs.rmSync(path.join(runLib.RUNS_ROOT, client), { recursive: true, force: true });
  }
});

test('20-changed-deployment-evidence-invalidates-handover', () => {
  const base = runLib.runDir(TEST_CLIENT, e2eRunId);
  fs.writeFileSync(path.join(base, 'requirements', 'frontend.yaml'), yaml.stringify({ requirements: [] }));
  fs.writeFileSync(path.join(e2eFrontendRun, 'requirement-coverage.yaml'), yaml.stringify({ requirements: [] }));
  assert(orchestrator.cmdVerifyCoverage({ run: `${TEST_CLIENT}/${e2eRunId}` }) === 0);
  assert(orchestrator.cmdPrepareHandover({ run: `${TEST_CLIENT}/${e2eRunId}` }) === 0);
  fs.writeFileSync(path.join(e2eFrontendRun, 'deployment-checklist.yaml'), yaml.stringify({ items: [{ id: 'new-action', action: 'Review new deployment action' }] }));
  orchestrator.cmdFinalReport({ run: `${TEST_CLIENT}/${e2eRunId}` });
  assert(runLib.readJson(path.join(base, 'state.json')).status === 'BLOCKED', 'changed source deployment checklist must invalidate old report');
  fs.unlinkSync(path.join(e2eFrontendRun, 'deployment-checklist.yaml'));
  assert(orchestrator.cmdVerifyCoverage({ run: `${TEST_CLIENT}/${e2eRunId}` }) === 0);
  assert(orchestrator.cmdPrepareHandover({ run: `${TEST_CLIENT}/${e2eRunId}` }) === 0);
  fs.appendFileSync(path.join(base, 'before-deployment.md'), 'changed');
  orchestrator.cmdFinalReport({ run: `${TEST_CLIENT}/${e2eRunId}` });
  assert(runLib.readJson(path.join(base, 'state.json')).status === 'BLOCKED', 'changed generated handover must invalidate report');
});

test('21-malformed-handover-blocks-previously-complete-run', () => {
  const base = runLib.runDir(TEST_CLIENT, e2eRunId);
  for (const text of ['', 'items: null\n']) {
    const state = runLib.readJson(path.join(base, 'state.json'));
    state.status = 'COMPLETE';
    runLib.writeJson(path.join(base, 'state.json'), state);
    fs.writeFileSync(path.join(base, 'deployment-checklist.yaml'), text);
    assert(orchestrator.cmdFinalReport({ run: `${TEST_CLIENT}/${e2eRunId}` }) === 0, 'malformed handover must produce blocked report, not throw');
    assert(runLib.readJson(path.join(base, 'state.json')).status === 'BLOCKED', 'stale COMPLETE must be cleared');
  }
});

test('22-track-context-isolation-and-drift', () => {
  const base = runLib.runDir(TEST_CLIENT, e2eRunId);
  const state = runLib.readJson(path.join(base, 'state.json'));
  const frontend = contextLib.consumeTrackContext(state.trackContextRefs.frontend, 'frontend');
  assert(contextLib.consumeTrackContext(state.trackContextRefs.frontend, 'frontend', { sourceVersion: '9.2' }), 'version shorthand must match equivalent resolved versions');
  assert(frontend.track === 'frontend' && !JSON.stringify(frontend).includes('backendClientPath'), 'frontend must not receive backend client metadata');
  assert(!JSON.stringify(frontend).includes('package.json'), 'shared context must not inline package implementation');
  let rejected = false;
  try { contextLib.consumeTrackContext(state.trackContextRefs.frontend, 'backend'); } catch (_) { rejected = true; }
  assert(rejected, 'opposite executor context must be rejected');
  const file = state.trackContextRefs.frontend;
  const original = fs.readFileSync(file, 'utf8');
  try {
    const altered = JSON.parse(original);
    altered.requirements.push({ scope: 'backend', statement: 'backend-only sentinel' });
    fs.writeFileSync(file, JSON.stringify(altered));
    assert(orchestrator.cmdContext({ run: `${TEST_CLIENT}/${e2eRunId}`, track: 'frontend' }) === 1, 'tampered context must block without invoking ingest');
  } finally { fs.writeFileSync(file, original); }
  assert(contextLib.trackStatus({ status: 'BLOCKED_NEEDS_CONTEXT' }) === 'BLOCKED' && contextLib.trackStatus({ status: 'COMPLETE' }) === 'PASSED', 'local statuses must project without rewriting track state');
});

test('23-shared-owner-reuses-supplied-context-and-run', () => {
  const base = runLib.runDir(TEST_CLIENT, e2eRunId);
  const state = runLib.readJson(path.join(base, 'state.json'));
  const execution = require('../tools/lib/execution');
  execution.attach(e2eBackendRun, 'backend', { contextRef: state.trackContextRefs.backend, runId: e2eRunId });
  assert(fs.existsSync(path.join(e2eBackendRun, 'shared-context-ref.json')) && execution.guard(e2eBackendRun, 'backend', { runId: e2eRunId }), 'execution must durably bind the existing context');
  assert(orchestrator.cmdCreateRun({ client: TEST_CLIENT, tracks: 'backend', 'run-id': e2eRunId, 'source-version': '9.2.0', 'target-version': '9.2.1' }) === 0, 'same run must consume context without invoking ingest');
  assert(orchestrator.cmdCreateRun({ client: TEST_CLIENT, tracks: 'backend', 'run-id': e2eRunId, 'source-version': '9.1.0', 'target-version': '9.2.1' }) === 1, 'conflicting source must not overwrite shared run');
  assert(orchestrator.cmdCreateRun({ client: TEST_CLIENT, tracks: 'backend', 'run-id': e2eRunId, 'source-version': '9.2.0', 'target-version': '9.2.1', 'backend-client-path': 'other-client' }) === 1, 'conflicting explicitly supplied paths must not reuse old evidence');
  assert(execution.guard(tmpFrontendRun, 'frontend') === null, 'legacy runs must remain readable');
});

test('24-backend-configuration-evidence-isolated-and-required', () => {
  const configuration = require('../tools/lib/executors').capability('backend', 'configuration');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'orchestrator-config-'));
  try {
    fs.writeFileSync(path.join(root, 'appsettings.json'), JSON.stringify({ Core: { Secret: 'PRIVATE-SENTINEL' } }));
    const evidence = configuration.inspect(root, [{ id: 'secret', key: 'Secret', section: 'Core', owningProcess: 'ALL', sensitive: true }]);
    assert(!JSON.stringify(evidence).includes('PRIVATE-SENTINEL') && evidence.secretRejections.length === 1, 'backend adapter must reject a concrete secret without persisting values');
    const file = path.join(root, 'evidence.json');
    fs.writeFileSync(file, JSON.stringify(evidence));
    const result = coverageLib.verifyCoverage({ runId: 'isolated', domainEvidenceRefs: [file] });
    assert(result.coverage.summary.outstanding === 1 && result.missingSteps.items[0].status === 'BLOCKED', 'moved configuration check must remain a shared completion gate');
    const split = requirementsLib.splitRequirements({ records: [], version: '9.2.0', runId: 'isolated' });
    requirementsLib.appendCanonical(split, '8.3.0', '9.2.0');
    assert(split.backend.requirements.some((finding) => finding.id.includes('DATABASE')) && split.frontend.requirements.every((finding) => ['frontend', 'shared'].includes(finding.scope)), 'formerly mixed canonical requirements must route to their owner');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('25-scoped-discovery-and-lifecycle-projection', () => {
  const discovery = require('../tools/lib/discovery');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'orchestrator-discovery-'));
  try {
    fs.writeFileSync(path.join(root, 'client.sln'), 'fixture');
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ dependencies: { '@angular/core': '15.2.0', private: 'git+https://PRIVATE-SENTINEL@example.test/repository' } }));
    const backend = discovery.inspect(root, 'backend');
    assert(backend.present && !JSON.stringify(backend).includes('FRONTEND-SENTINEL'), 'backend discovery must not parse frontend package details');
    const frontend = discovery.inspect(root, 'frontend');
    assert(frontend.package.dependencies['@angular/core'] === '15.2.0' && !JSON.stringify(frontend).includes('PRIVATE-SENTINEL') && frontend.package.dependencies.private === '<RESOLVE_LOCALLY>', 'credential-bearing dependency declarations must not enter persisted context');
    const evidence = discovery.backendEvidence(root);
    assert(!evidence.frontendPresent && evidence.dotnetClientPresent, 'backend discovery must not activate frontend toolchains');
    const lifecycle = require('../tools/lib/lifecycle');
    assert(lifecycle.phase({ status: 'REQUIREMENTS_READY' }) === 'PLAN' && lifecycle.phase({ status: 'RESULTS_COMPOSED', executorStatus: { backend: 'RUNNING' } }) === 'EXECUTE', 'shared lifecycle must be a projection, not a second execution engine');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('26-re-signed-context-and-missing-binding-still-block', () => {
  const base = runLib.runDir(TEST_CLIENT, e2eRunId);
  const state = runLib.readJson(path.join(base, 'state.json'));
  const file = state.trackContextRefs.backend;
  const original = fs.readFileSync(file, 'utf8');
  try {
    const changed = JSON.parse(original);
    changed.client.path = 'different-client';
    delete changed.fingerprint;
    changed.fingerprint = contextLib.digest(changed);
    fs.writeFileSync(file, JSON.stringify(changed));
    assert(orchestrator.cmdContext({ run: `${TEST_CLIENT}/${e2eRunId}`, track: 'backend' }) === 1, 're-signing cannot replace shared run provenance');
  } finally { fs.writeFileSync(file, original); }
  assert(orchestrator.cmdCreateRun({ client: TEST_CLIENT, 'run-id': '../escape', 'source-version': '9.2.0', 'target-version': '9.2.1' }) === 2, 'unsafe run id must be rejected before writes');
});

test('27-backend-validation-refresh-and-scoped-evidence', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'orchestrator-refresh-'));
  try {
    const file = path.join(root, 'appsettings.json');
    const requirements = [{ id: 'required', key: 'Enabled', section: 'Core', owningProcess: 'ALL', sensitive: false, automation: 'AUTO_AFTER_MAPPING' }];
    fs.writeFileSync(file, '{}');
    const configuration = require('../tools/lib/executors').capability('backend', 'configuration');
    const evidenceFile = path.join(root, 'backend-evidence.json');
    runLib.writeJson(evidenceFile, Object.assign(configuration.inspect(root, requirements), { input: { root, requirements } }));
    const upgradeContextRef = path.join(root, 'upgrade.json');
    runLib.writeJson(upgradeContextRef, { integration: {} });
    fs.writeFileSync(file, JSON.stringify({ Core: { Enabled: true } }));
    contextLib.refreshDomainEvidence({ domainEvidenceRefs: [evidenceFile], upgradeContextRef });
    const result = coverageLib.verifyCoverage({ runId: 'refresh', domainEvidenceRefs: [evidenceFile] });
    assert(result.coverage.summary.outstanding === 0, 'successful backend changes must refresh initially missing coverage');
    const base = runLib.runDir(TEST_CLIENT, e2eRunId);
    const state = runLib.readJson(path.join(base, 'state.json'));
    const packet = contextLib.consumeTrackContext(state.trackContextRefs.frontend, 'frontend');
    const selected = contextLib.readTrackEvidence(packet, '9.2.1');
    assert(Array.isArray(selected.facts) && !('backend' in selected), 'lazy retrieval must expose only the executor slice');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('28-detached-context-is-not-an-owner', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'orchestrator-detached-'));
  try {
    const state = runLib.readJson(path.join(runLib.runDir(TEST_CLIENT, e2eRunId), 'state.json'));
    fs.mkdirSync(path.join(root, 'contexts'));
    const file = path.join(root, 'contexts', 'backend.json');
    fs.copyFileSync(state.trackContextRefs.backend, file);
    let blocked = false;
    try { contextLib.consumeTrackContext(file, 'backend'); } catch (_) { blocked = true; }
    assert(blocked, 'a valid digest alone must not authorize a detached shared context');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('29-shared-requirements-appear-once-per-packet', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'orchestrator-compact-'));
  try {
    const original = runLib.readJson(path.join(runLib.runDir(TEST_CLIENT, e2eRunId), 'core-change-set.json'));
    const shared = { id: 'SHARED-SENTINEL', scope: 'shared' };
    const split = { shared: { requirements: [shared] }, backend: { requirements: [shared], excluded: [] }, frontend: { requirements: [shared], excluded: [] } };
    const refs = contextLib.persistContexts(root, { clientId: 'compact', tracks: ['backend', 'frontend'], sourceVersion: '9.2.0', targetVersion: '9.2.1' }, 'compact', original, split);
    for (const file of Object.values(refs.trackContextRefs)) {
      const packet = runLib.readJson(file);
      assert(packet.requirements.length === 0 && packet.upgrade.sharedRequirements.length === 1, 'shared requirements must not be duplicated in a track packet');
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('30-cleanup', () => {
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

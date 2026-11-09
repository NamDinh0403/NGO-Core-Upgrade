'use strict';
/*
 * ingest test suite. Dependency-free, Node 14+. Run: node tools/ingest.test.js
 * Uses a throwaway git repo + in-memory release notes; cleans up after itself.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const notes = require('./lib/notes');
const classify = require('./lib/classify');
const ingest = require('./ingest');
const git = require('./lib/git');
const partitionLib = require('./lib/partition');
const releaseReader = require('./lib/release-reader');
const schemaLib = require('../../engine/tools/lib/schema');

const results = [];
function test(id, fn) { try { fn(); results.push({ id, pass: true }); } catch (e) { results.push({ id, pass: false, error: e.message }); } }
function assert(c, m) { if (!c) throw new Error(m); }

// --- lib/notes.js ------------------------------------------------------------
test('01-notes-splits-by-version-heading', () => {
  const text = '9.1.0\ncard a\n\ncard b\n\n9.2.0\ncard c\n';
  const sections = notes.parse(text);
  assert(sections.get('9.1.0').length === 2, 'expected 2 cards for 9.1.0');
  assert(sections.get('9.2.0').length === 1, 'expected 1 card for 9.2.0');
});

test('02-notes-cardsFor-missing-version-returns-empty', () => {
  assert(notes.cardsFor('9.1.0\ncard a\n', '9.9.9').length === 0, 'missing version should be empty array, not throw');
});

// --- lib/classify.js ----------------------------------------------------------
test('03-classify-csproj-is-backend', () => { assert(classify.classify('NGO.API/NGO.API.csproj').scope === 'backend'); });
test('04-classify-package-json-is-frontend', () => { assert(classify.classify('client-core/package.json').scope === 'frontend'); });
test('05-classify-sql-is-shared', () => { assert(classify.classify('scripts/datafix.sql').scope === 'shared'); });
test('06-classify-unknown-defaults-shared', () => { assert(classify.classify('README').scope === 'shared'); });

// --- end-to-end with a throwaway git repo ------------------------------------
const tmpRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'ingest-test-'));
const tmpOut = fs.mkdtempSync(path.join(os.tmpdir(), 'ingest-test-out-'));
function sh(cmd) { cp.execSync(cmd, { cwd: tmpRepo, stdio: 'pipe' }); }

test('07-e2e-setup-repo', () => {
  sh('git init -q');
  sh('git config user.email t@t.com');
  sh('git config user.name t');
  fs.mkdirSync(path.join(tmpRepo, 'NGO.API'), { recursive: true });
  fs.writeFileSync(path.join(tmpRepo, 'NGO.API', 'appsettings.json'), '{"A":1}');
  fs.mkdirSync(path.join(tmpRepo, 'client-core'), { recursive: true });
  fs.writeFileSync(path.join(tmpRepo, 'client-core', 'package.json'), '{"name":"ngo-core"}');
  fs.writeFileSync(path.join(tmpRepo, 'obsolete.sql'), 'SELECT 1;');
  sh('git add -A');
  sh('git commit -q -m init');
  sh('git tag v9.1.0');
  fs.writeFileSync(path.join(tmpRepo, 'NGO.API', 'appsettings.json'), '{"A":1,"B":2}');
  fs.writeFileSync(path.join(tmpRepo, 'client-core', 'package.json'), '{"name":"ngo-core","version":"2.0.0"}');
  sh('git add -A');
  sh('git commit -q -am work');
  sh('git tag v9.2.0');
  assert(true);
});

test('08-e2e-check-finds-newer-tag', () => {
  const r = ingest.newerTags(tmpRepo, '9.1.0', 'v');
  assert(r.ok && r.versions.length === 1 && r.versions[0] === '9.2.0', JSON.stringify(r));
});

test('09-e2e-ingest-writes-shared-record', () => {
  const releaseNotes = '9.2.0\nAdd to all appsettings.json files: "B"\n\npackage.json version bump\n';
  const record = ingest.ingestOneVersion(tmpRepo, releaseNotes, 'v9.1.0', 'v9.2.0', '9.2.0');
  assert(record.findings.backend.some((f) => f.path === 'NGO.API/appsettings.json' && f.crossCheck === 'CONFIRMED_BY_DIFF_AND_NOTES'), 'appsettings.json should cross-confirm');
  assert(record.findings.frontend.some((f) => f.path === 'client-core/package.json' && f.crossCheck === 'CONFIRMED_BY_DIFF_AND_NOTES'), 'package.json should cross-confirm');
});

test('10-e2e-ingest-flags-unconfirmed-diff', () => {
  const record = ingest.ingestOneVersion(tmpRepo, 'no matching notes here', 'v9.1.0', 'v9.2.0', '9.2.0');
  assert(record.unresolvedItems.length > 0, 'diff-only findings with no note match should be unresolved');
});

test('11-e2e-ingest-without-notes-still-produces-diff-findings', () => {
  const record = ingest.ingestOneVersion(tmpRepo, null, 'v9.1.0', 'v9.2.0', '9.2.0');
  assert(record.findings.backend.length > 0 && record.findings.frontend.length > 0, 'diff-only ingestion should still classify by scope');
  assert(record.unresolvedItems.some((u) => /no release-notes/.test(u)), 'should note release-notes.md was not provided');
});

test('12-e2e-cmdIngest-cli-writes-file', () => {
  const notesPath = path.join(tmpRepo, 'release-notes.md');
  fs.writeFileSync(notesPath, '9.2.0\nAdd to all appsettings.json files: "B"\n');
  const code = ingest.cmdIngest({ 'core-path': tmpRepo, 'release-notes': notesPath, since: '9.1.0', out: tmpOut });
  assert(code === 0, `expected exit 0, got ${code}`);
  assert(fs.existsSync(path.join(tmpOut, '9.2.0.json')), 'output file should exist');
  const written = JSON.parse(fs.readFileSync(path.join(tmpOut, '9.2.0.json'), 'utf8'));
  assert(written.status === 'CANDIDATE', 'output must be labelled CANDIDATE, never canonical');
});

test('13-e2e-redaction-strips-secret-like-values', () => {
  const notesPath = path.join(tmpRepo, 'release-notes-secret.md');
  fs.writeFileSync(notesPath, '9.2.0\nSet ApiKey=SUPERSECRETVALUE1234567890 in config\n');
  const record = ingest.ingestOneVersion(tmpRepo, fs.readFileSync(notesPath, 'utf8'), 'v9.1.0', 'v9.2.0', '9.2.0');
  const allText = JSON.stringify(record);
  assert(!allText.includes('SUPERSECRETVALUE1234567890'), 'raw secret-like value must not appear in the candidate record');
});

test('14-cache-hit-skips-extraction-and-preserves-record', () => {
  const flags = { 'core-path': tmpRepo, since: '9.1', target: '9.2', out: tmpOut };
  const first = ingest.ensureReleases(flags);
  const file = first.entries[0].path;
  const content = fs.readFileSync(file, 'utf8');
  const show = git.showFile;
  git.showFile = () => { throw new Error('cache hit must not extract'); };
  try {
    const second = ingest.ensureReleases(flags);
    assert(second.reused && fs.readFileSync(file, 'utf8') === content, 'unchanged release should reuse without rewriting');
  } finally { git.showFile = show; }
});

test('15-cache-invalidates-notes-corruption-and-analyzer', () => {
  const notesFile = path.join(tmpOut, 'notes.md');
  const flags = { 'core-path': tmpRepo, since: '9.1.0', target: '9.2.0', out: tmpOut, 'release-notes': notesFile };
  fs.writeFileSync(notesFile, '9.2.0\nnew requirement\n');
  assert(!ingest.ensureReleases(flags).reused, 'changed notes must refresh');
  const file = path.join(tmpOut, '9.2.0.json');
  const record = JSON.parse(fs.readFileSync(file, 'utf8'));
  record.identity.analyzerVersion = 'old';
  record.identity.key = 'old';
  fs.writeFileSync(file, JSON.stringify(record));
  assert(!ingest.ensureReleases(flags).reused, 'old analyzer must refresh');
  fs.writeFileSync(file, '{broken');
  assert(!ingest.ensureReleases(flags).reused, 'corrupt candidate must refresh');
  assert(ingest.ensureReleases(flags).reused, 'fresh result must reuse');
});

test('16-invalid-boundaries-fail-without-removing-cache', () => {
  const before = fs.readFileSync(path.join(tmpOut, '9.2.0.json'), 'utf8');
  for (const flags of [{ since: 'bad', target: '9.2.0' }, { since: '9.0.0', target: '9.2.0' }, { target: '9.9.9' }, { target: '9.1.0' }]) {
    assert(ingest.cmdIngest(Object.assign({ 'core-path': tmpRepo, out: tmpOut }, flags)) === 1, 'invalid boundary should fail');
  }
  assert(fs.readFileSync(path.join(tmpOut, '9.2.0.json'), 'utf8') === before, 'failure must preserve old cache');
});

test('17-rename-status-and-structured-facts', () => {
  fs.mkdirSync(path.join(tmpRepo, 'client-core', 'nested'));
  sh('git mv client-core/package.json client-core/nested/package.json');
  fs.writeFileSync(path.join(tmpRepo, 'NGO.API', 'appsettings.json'), '{"A":1,"B":3,"Password":"DONOTPERSIST"}');
  fs.mkdirSync(path.join(tmpRepo, 'NGO.API', 'Migrations'));
  fs.writeFileSync(path.join(tmpRepo, 'NGO.API', 'Migrations', 'Add.cs'), 'public class Add {}');
  fs.writeFileSync(path.join(tmpRepo, 'client-core', 'a space.ts'), 'export interface Example {}');
  fs.unlinkSync(path.join(tmpRepo, 'obsolete.sql'));
  sh('git add -A');
  sh('git commit -q -m rename');
  sh('git tag v9.3.0');
  const record = ingest.ensureReleases({ 'core-path': tmpRepo, since: '9.2.0', target: '9.3.0', out: tmpOut }).entries[0].record;
  assert(record.changes.some((change) => change.status.startsWith('R') && change.oldPath === 'client-core/package.json' && change.path === 'client-core/nested/package.json'), 'rename must preserve both paths');
  assert(record.facts.some((fact) => fact.kind === 'json-key' && fact.key === 'B' && fact.change === 'MODIFIED'), 'config value change must be detected');
  assert(record.facts.some((fact) => fact.kind === 'ef-migration'), 'migration must be detected');
  assert(record.facts.some((fact) => fact.kind === 'api-declaration-change-hint'), 'public API declaration hint expected');
  assert(record.changes.some((change) => change.path === 'obsolete.sql' && change.status === 'D'), 'deleted file status must survive');
  assert(record.changes.some((change) => change.path === 'client-core/a space.ts' && change.status === 'A'), 'spaced filename must survive without Git quoting');
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'schemas', 'ingested-release.schema.json'), 'utf8'));
  assert(schema.required.every((key) => Object.prototype.hasOwnProperty.call(record, key)), 'candidate must satisfy required schema fields');
  assert(!JSON.stringify(record).includes('DONOTPERSIST'), 'config values must not leak');
});

test('18-cumulative-range-includes-intermediate-release', () => {
  const result = ingest.ensureReleases({ 'core-path': tmpRepo, since: '9.1.0', target: '9.3.0', out: tmpOut });
  assert(result.entries.map((entry) => entry.record.version).join(',') === '9.2.0,9.3.0', 'all intermediate releases must be available');
});

test('19-retag-invalidates-cached-release', () => {
  fs.writeFileSync(path.join(tmpRepo, 'client-core', 'nested', 'package.json'), '{"version":"3.0.0","dependencies":{"angular":"17.0.0","private":"https://registry.example/pkg?token=FAKE_CREDENTIAL_123","git":"git+https://FAKE_USERINFO_TOKEN@github.com/example/pkg.git"}}');
  sh('git add -A');
  sh('git commit -q -m retag');
  sh('git tag -f v9.3.0');
  const result = ingest.ensureReleases({ 'core-path': tmpRepo, since: '9.2.0', target: '9.3.0', out: tmpOut });
  assert(!result.reused, 'moved tag must refresh');
  assert(result.entries[0].record.facts.some((fact) => fact.kind === 'dependency' && fact.name === 'angular' && fact.after === '17.0.0'), 'dependency facts expected');
  assert(!JSON.stringify(result.entries[0].record).includes('FAKE_CREDENTIAL_123'), 'dependency URL credentials must be redacted');
  assert(!JSON.stringify(result.entries[0].record).includes('FAKE_USERINFO_TOKEN'), 'token-only URL userinfo must be redacted');
});

test('20-dirty-fingerprint-detects-content-drift', () => {
  const file = path.join(tmpRepo, 'NGO.API', 'appsettings.json');
  fs.writeFileSync(file, '{"A":2}');
  const before = git.fingerprint(tmpRepo);
  fs.writeFileSync(file, '{"A":3}');
  const after = git.fingerprint(tmpRepo);
  assert(!before.statusClean && !after.statusClean && git.diffFingerprints(before, after).length > 0, 'dirty-to-dirty drift must be detected');
});

test('21-failed-refresh-preserves-previous-record', () => {
  const file = path.join(tmpOut, '9.3.0.json');
  const previous = fs.readFileSync(file, 'utf8');
  const fingerprint = git.fingerprint;
  let calls = 0;
  git.fingerprint = (repo) => Object.assign({}, fingerprint(repo), ++calls === 2 ? { contentDigest: 'changed' } : {});
  try {
    const code = ingest.cmdIngest({ 'core-path': tmpRepo, since: '9.2.0', target: '9.3.0', out: tmpOut });
    assert(code === 1 && fs.readFileSync(file, 'utf8') === previous, 'failed verification must not erase prior evidence');
  } finally { git.fingerprint = fingerprint; }
});

test('22-extraction-uses-immutable-commits', () => {
  const diff = git.diffNameStatus;
  let observed = false;
  git.diffNameStatus = (repo, from, to) => { observed = /^[a-f0-9]{40,64}$/.test(from) && /^[a-f0-9]{40,64}$/.test(to); return diff(repo, from, to); };
  try {
    ingest.ingestOneVersion(tmpRepo, null, 'v9.2.0', 'v9.3.0', '9.3.0');
    assert(observed, 'extraction must never resolve mutable tags again');
  } finally { git.diffNameStatus = diff; }
});

test('23-partition-candidate-schema-and-integrity', () => {
  const SCHEMAS_DIR = path.resolve(__dirname, '..', 'schemas');
  const manifestSchema = JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, 'release-manifest-v2.schema.json'), 'utf8'));
  const partitionSchema = JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, 'release-partition.schema.json'), 'utf8'));
  const evidenceSchema = JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, 'release-evidence.schema.json'), 'utf8'));

  const sampleCandidate = {
    schemaVersion: 1,
    version: '9.9.0',
    status: 'CANDIDATE',
    identity: {
      analyzerVersion: '2',
      version: '9.9.0',
      fromCommit: 'aaaabbbbccccdddd000011112222333344445555',
      toCommit: '6666777788889999aaaabbbbccccdddd00001111',
      notesHash: '1234567890abcdef',
      key: 'abcdef1234567890'
    },
    changes: [
      { status: 'M', path: 'src/backend/app.cs', category: 'dotnet-source', scope: 'backend' },
      { status: 'A', path: 'src/frontend/app.ts', category: 'frontend-source', scope: 'frontend' },
      { status: 'A', path: 'src/db/mig.cs', category: 'ef-migration', scope: 'backend' },
      { status: 'M', path: 'scripts/deploy.sh', category: 'other', scope: 'shared' }
    ],
    facts: [
      { kind: 'api-declaration-change-hint', path: 'src/backend/app.cs', added: 1, removed: 0 },
      { kind: 'ef-migration', path: 'src/db/mig.cs', status: 'A' },
      { kind: 'json-key', path: 'packages.lock.json', key: 'AngleSharp', change: 'MODIFIED' }
    ],
    ingestedAt: '2026-10-21T00:00:00Z',
    sources: {
      coreRepoPath: '/repo',
      tagRange: { from: 'v9.8.0', to: 'v9.9.0' }
    },
    findings: {
      backend: [{ scope: 'backend', category: 'dotnet-source', path: 'src/backend/app.cs', status: 'M', statement: 'Modified src/backend/app.cs' }],
      frontend: [{ scope: 'frontend', category: 'frontend-source', path: 'src/frontend/app.ts', status: 'A', statement: 'Added src/frontend/app.ts' }],
      shared: [
        { scope: 'backend', category: 'ef-migration', path: 'src/db/mig.cs', status: 'A', statement: 'Added src/db/mig.cs' },
        { scope: 'shared', category: 'other', path: 'scripts/deploy.sh', status: 'M', statement: 'Modified scripts/deploy.sh' }
      ]
    },
    unresolvedItems: [],
    nextAction: 'review'
  };

  const partOut = path.join(tmpOut, 'partitioned');
  const result = partitionLib.partitionCandidate(sampleCandidate, partOut);

  // Validate schemas
  const manErrs = schemaLib.validate(result.manifest, manifestSchema, 'manifest');
  assert(manErrs.length === 0, 'manifest schema valid: ' + manErrs.join(', '));
  const evErrs = schemaLib.validate(result.rawDiff, evidenceSchema, 'evidence');
  assert(evErrs.length === 0, 'evidence schema valid: ' + evErrs.join(', '));

  for (const scope of ['backend', 'frontend', 'shared', 'database']) {
    const partFile = path.join(partOut, '9.9.0', 'changes', `${scope}.json`);
    const partObj = JSON.parse(fs.readFileSync(partFile, 'utf8'));
    const partErrs = schemaLib.validate(partObj, partitionSchema, `changes/${scope}`);
    assert(partErrs.length === 0, `partition ${scope} schema valid: ` + partErrs.join(', '));
  }

  // Validate partition hashes against manifest
  for (const [key, part] of Object.entries(result.manifest.partitions)) {
    const file = path.join(partOut, '9.9.0', part.path);
    const content = fs.readFileSync(file, 'utf8');
    assert(partitionLib.sha256(content) === part.sha256, `SHA-256 integrity mismatch for ${key}`);
  }
});

test('24-release-reader-dual-format-and-scope-isolation', () => {
  const partOut = path.join(tmpOut, 'partitioned');
  const read = releaseReader.readRelease(partOut, '9.9.0');
  assert(read.isPartitioned === true, 'should identify as partitioned');
  assert(read.record.version === '9.9.0', 'version matches');
  assert(read.record.status === 'CANDIDATE', 'status matches CANDIDATE');
  assert(read.record.findings.backend.length === 1, 'backend findings synthesized');
  assert(read.record.findings.frontend.length === 1, 'frontend findings synthesized');
  assert(read.record.findings.shared.length === 2, 'shared and database findings synthesized');

  // Test scope isolation
  const beScope = releaseReader.readScope(partOut, '9.9.0', 'backend');
  assert(beScope.scope === 'backend', 'scope matches');
  assert(beScope.recordCount === 1, 'recordCount matches');
});

test('25-cleanup', () => {
  fs.rmSync(tmpRepo, { recursive: true, force: true });
  fs.rmSync(tmpOut, { recursive: true, force: true });
  assert(!fs.existsSync(tmpRepo) && !fs.existsSync(tmpOut));
});

// --- report ---
const passed = results.filter((r) => r.pass).length;
console.log('ingest test suite');
for (const r of results) console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.id}${r.error ? '  -> ' + r.error : ''}`);
console.log(`\n${passed}/${results.length} passed, ${results.length - passed} failed.`);
process.exit(passed === results.length ? 0 : 1);

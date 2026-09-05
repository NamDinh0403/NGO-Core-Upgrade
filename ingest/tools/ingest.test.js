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

test('14-cleanup', () => {
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

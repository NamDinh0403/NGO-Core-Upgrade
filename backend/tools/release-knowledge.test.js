'use strict';
/*
 * Release-knowledge coverage/consistency tests for backend.
 * Complements tools/validate.js's schema check with the specific gap that
 * caused a real incident: a run needing a target version with NO canonical
 * knowledge and NO candidate finding, discovered only mid-engagement
 * (see runs/ngo-online-brc/.../developer-review-9.2.1.md, which needed 9.2.1
 * before knowledge/canonical/versions/ had anything past 9.1.0).
 * Dependency-free, Node 14+. Run: node tools/release-knowledge.test.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const P = (...p) => path.join(ROOT, ...p);
const exists = (rel) => fs.existsSync(P(rel));
const readJSON = (rel) => JSON.parse(fs.readFileSync(P(rel), 'utf8'));
const listJson = (rel) => (exists(rel) ? fs.readdirSync(P(rel)).filter((f) => f.endsWith('.json')) : []);
const parseVer = (v) => { const m = String(v || '').match(/^(\d+)\.(\d+)\.(\d+)$/); return m ? [+m[1], +m[2], +m[3]] : null; };
const cmpVer = (a, b) => { for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };

const results = [];
function test(id, fn) { try { fn(); results.push({ id, pass: true }); } catch (e) { results.push({ id, pass: false, error: e.message }); } }
function assert(c, m) { if (!c) throw new Error(m); }

const CANON_DIR = 'knowledge/canonical/versions';
const SHARED_CANDIDATE_DIR = '../ingest/knowledge/candidates/releases'; // shared with frontend

const canonicalFiles = listJson(CANON_DIR);
const canonicalVersions = canonicalFiles.map((f) => f.replace(/\.json$/, ''));

// 1. Every canonical version file's internal `version` matches its filename.
test('01-filename-matches-internal-version', () => {
  for (const f of canonicalFiles) {
    const rec = readJSON(`${CANON_DIR}/${f}`);
    const expected = f.replace(/\.json$/, '');
    assert(rec.version === expected, `${f}: internal version '${rec.version}' != filename '${expected}'`);
  }
});

// 2. No duplicate versions (filenames are already unique on a filesystem, but
//    guard against a normalization mismatch, e.g. "9.2.0" vs "9.2.00").
test('02-no-duplicate-canonical-versions', () => {
  const seen = new Set();
  for (const v of canonicalVersions) {
    assert(!seen.has(v), `duplicate canonical version: ${v}`);
    seen.add(v);
  }
});

// 3. Every canonical version parses as a strict x.y.z semver-ish string.
test('03-canonical-versions-well-formed', () => {
  for (const v of canonicalVersions) assert(parseVer(v), `not a well-formed version: ${v}`);
});

// 4. entryType/schemaVersion present and consistent (belt-and-braces on top of
//    tools/validate.js's full schema check).
test('04-entry-type-consistent', () => {
  for (const f of canonicalFiles) {
    const rec = readJSON(`${CANON_DIR}/${f}`);
    assert(rec.entryType === 'version', `${f}: entryType must be 'version'`);
  }
});

// 5. Every shared ingest candidate record is labelled CANDIDATE, never a
//    canonical-looking status (skip entirely if ingest isn't present —
//    a standalone copy of this track without its sibling).
test('05-shared-candidate-records-labelled-candidate', () => {
  if (!exists(SHARED_CANDIDATE_DIR)) return;
  for (const f of listJson(SHARED_CANDIDATE_DIR)) {
    const rec = readJSON(`${SHARED_CANDIDATE_DIR}/${f}`);
    assert(rec.status === 'CANDIDATE', `${f}: shared candidate record must have status 'CANDIDATE', got '${rec.status}'`);
    assert(rec.findings && rec.findings.backend && rec.findings.frontend && rec.findings.shared, `${f}: findings must have backend/frontend/shared arrays`);
  }
});

// 6. THE regression this suite exists to catch: every targetVersion referenced
//    by a run's state.json has either canonical knowledge OR a shared candidate
//    finding — never neither (which is what happened with 9.2.1 before this
//    change). A version older than the lowest canonical entry is exempt (out
//    of the knowledge base's supported range, not a coverage gap).
test('06-every-run-target-version-has-coverage', () => {
  const runsRoot = P('runs');
  if (!fs.existsSync(runsRoot)) return; // nothing to check
  const candidateVersions = new Set(exists(SHARED_CANDIDATE_DIR) ? listJson(SHARED_CANDIDATE_DIR).map((f) => f.replace(/\.json$/, '')) : []);
  const canonicalSet = new Set(canonicalVersions);
  const gaps = [];
  (function walk(dir) {
    for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
      if (name.name === '_bootstrap' || name.name === 'wrapper-logs') continue;
      const full = path.join(dir, name.name);
      if (name.isDirectory()) { walk(full); continue; }
      if (name.name !== 'state.json') continue;
      let st; try { st = JSON.parse(fs.readFileSync(full, 'utf8')); } catch (e) { continue; }
      const tv = st.targetVersion;
      if (!tv || !parseVer(tv)) continue;
      if (canonicalSet.has(tv) || candidateVersions.has(tv)) continue;
      gaps.push(`${path.relative(ROOT, full)} targets ${tv} (no canonical or shared candidate knowledge — run: node ../ingest/tools/ingest.js check --core-path <path>, then skills/ingest-core-release)`);
    }
  })(runsRoot);
  assert(gaps.length === 0, gaps.join(' | '));
});

// --- report ---
const passed = results.filter((r) => r.pass).length;
console.log('Release-knowledge coverage/consistency');
for (const r of results) console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.id}${r.error ? '  -> ' + r.error : ''}`);
console.log(`\n${passed}/${results.length} passed, ${results.length - passed} failed.`);
process.exit(passed === results.length ? 0 : 1);

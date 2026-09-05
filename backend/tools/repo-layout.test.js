'use strict';
/*
 * Repository layout + cleanliness policy test. Fails if any legacy directory,
 * legacy root file, or legacy reference returns. Dependency-free, Node 14+.
 * Run: node tools/repo-layout.test.js
 */
const fs = require('fs');
const path = require('path');
const yaml = require('./bootstrap/lib/yaml');

const ROOT = path.resolve(__dirname, '..');
const P = (...p) => path.join(ROOT, ...p);
const policy = yaml.parse(fs.readFileSync(P('config/repository-layout-policy.yaml'), 'utf8'));

const failures = [];
const checks = [];
function check(name, fn) {
  try { fn(); checks.push({ name, pass: true }); }
  catch (e) { checks.push({ name, pass: false, error: e.message }); failures.push(`${name}: ${e.message}`); }
}
function assert(c, m) { if (!c) throw new Error(m); }

// Actual on-disk names (case-sensitive) at the repository root.
const rootEntries = fs.readdirSync(ROOT, { withFileTypes: true });
const rootDirs = rootEntries.filter((e) => e.isDirectory()).map((e) => e.name);
const rootFiles = rootEntries.filter((e) => e.isFile()).map((e) => e.name);

// 1. Forbidden legacy directories must not exist (exact on-disk name).
check('no forbidden legacy directories', () => {
  for (const d of policy.forbiddenLegacyDirectories) {
    assert(!rootDirs.includes(d), `legacy directory present: ${d}/`);
  }
});

// 2. Forbidden legacy root files must not exist.
check('no forbidden legacy root files', () => {
  for (const f of policy.forbiddenLegacyFiles) {
    assert(!rootFiles.includes(f), `legacy root file present: ${f}`);
  }
});

// 3. Every root directory is allowed.
check('root directories are allowed', () => {
  for (const d of rootDirs) {
    assert(policy.allowedRootDirectories.includes(d), `unexpected root directory: ${d}/`);
  }
});

// 4. Every root file is allowed.
check('root files are allowed', () => {
  for (const f of rootFiles) {
    assert(policy.allowedRootFiles.includes(f), `unexpected root file: ${f}`);
  }
});

// 5. Required directories exist.
check('required directories present', () => {
  for (const d of policy.requiredDirectories) {
    assert(fs.existsSync(P(d)), `required directory missing: ${d}`);
  }
});

// --- content scan for legacy references (active files only) ---
function activeFiles() {
  const out = [];
  const exemptDirNames = new Set(['node_modules', '.git', 'runs']);
  const exemptPaths = (policy.historicalExemptPaths || []).map((p) => p.replace(/\//g, path.sep));
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (exemptDirNames.has(e.name)) continue;
      const full = path.join(dir, e.name);
      const rel = path.relative(ROOT, full);
      if (exemptPaths.some((ex) => rel.startsWith(ex.replace(/[/\\]$/, '')))) continue;
      if (e.isDirectory()) walk(full);
      else if (/\.(md|json|yaml|js)$/.test(e.name)) out.push(full);
    }
  })(ROOT);
  return out;
}

const legacyDirRe = /(^|[^A-Za-z0-9_])(Agent|Case-Studies|Version-Changes|Templates)\//;
const legacyFileRe = /(^|[^A-Za-z0-9_])(BOOT\.md|ARCHITECTURE\.md)/;

// 6. No active file references a legacy directory path.
check('no legacy directory references in active files', () => {
  const bad = [];
  for (const f of activeFiles()) {
    const text = fs.readFileSync(f, 'utf8');
    if (legacyDirRe.test(text) || legacyFileRe.test(text)) bad.push(path.relative(ROOT, f));
  }
  assert(bad.length === 0, `legacy path references found in: ${bad.join(', ')}`);
});

// 7. No active file references a deleted legacy Agent document name.
check('no legacy Agent document references in active files', () => {
  const names = policy.forbiddenLegacyReferenceNames;
  const bad = [];
  for (const f of activeFiles()) {
    const text = fs.readFileSync(f, 'utf8');
    if (names.some((n) => text.includes(n))) bad.push(path.relative(ROOT, f));
  }
  assert(bad.length === 0, `legacy document-name references found in: ${bad.join(', ')}`);
});

// --- report ---
const passed = checks.filter((c) => c.pass).length;
console.log('Repository layout policy');
for (const c of checks) console.log(`  ${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.error ? '  -> ' + c.error : ''}`);
console.log(`\n${passed}/${checks.length} checks passed, ${failures.length} failed.`);
process.exit(failures.length === 0 ? 0 : 1);

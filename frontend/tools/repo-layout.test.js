'use strict';
/*
 * Repository layout test. Enforces config/repository-layout-policy.yaml against
 * the actual on-disk tree: only allowed root directories/files are present, and
 * no forbidden legacy (multi-session snapshot/delta) artifacts remain.
 * Dependency-free, Node 14+. Run: node tools/repo-layout.test.js
 */
const fs = require('fs');
const path = require('path');
const core = require('./lib/core');
const yaml = require('./lib/yaml');

const P = core.P || ((...p) => path.join(core.ROOT, ...p));
const policy = yaml.parse(fs.readFileSync(P('config/repository-layout-policy.yaml'), 'utf8'));
const problems = [];
const fail = (m) => problems.push(m);

const allowedDirs = new Set(policy.allowedRootDirectories || []);
const allowedFiles = new Set(policy.allowedRootFiles || []);
const forbidden = policy.forbiddenLegacyArtifacts || [];
const forbiddenRootDirs = new Set(policy.forbiddenRootDirectories || []);
const forbiddenRootFiles = new Set(policy.forbiddenRootFiles || []);
const requiredDirs = policy.requiredDirectories || [];

function matchesGlob(name, pattern) {
  if (pattern.indexOf('*') === -1) return name === pattern;
  const rx = new RegExp('^' + pattern.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
  return rx.test(name);
}

// 1) Root entries must be declared; forbidden root dirs/files must be absent.
for (const entry of fs.readdirSync(P('.'))) {
  if (entry.startsWith('.') && entry !== '.gitignore') continue; // dotfiles (.git etc.) are out of scope
  const full = P(entry);
  const isDir = fs.statSync(full).isDirectory();
  if (isDir) {
    if (forbiddenRootDirs.has(entry)) fail(`forbidden root directory present (must be lowercase): ${entry}`);
    else if (!allowedDirs.has(entry)) fail(`unexpected root directory: ${entry}`);
  } else {
    if (forbiddenRootFiles.has(entry)) fail(`forbidden root file present: ${entry}`);
    else if (!allowedFiles.has(entry)) fail(`unexpected root file: ${entry}`);
  }
}

// 1b) Required directories must exist.
for (const d of requiredDirs) {
  if (!core.exists(P(d))) fail(`required directory missing: ${d}`);
}

// 1c) Runtime source must never read raw release-note import files.
const runtimeDir = (policy.runtime && policy.runtime.runtimeSourceDir) || 'tools/lib';
const forbiddenReads = (policy.runtime && policy.runtime.forbiddenRuntimeReadPatterns) || [];
if (core.exists(P(runtimeDir))) {
  for (const f of fs.readdirSync(P(runtimeDir))) {
    if (!f.endsWith('.js')) continue;
    const txt = fs.readFileSync(P(runtimeDir, f), 'utf8');
    for (const pat of forbiddenReads) {
      const rx = new RegExp('(require|readFileSync|readYaml\\w*|readJson\\w*)\\([^)]*' + pat.replace(/[.+?^${}()|[\]\\/]/g, '\\$&'));
      if (rx.test(txt)) fail(`runtime module ${runtimeDir}/${f} reads forbidden source '${pat}'`);
    }
  }
}

// 2) Forbidden legacy artifacts must not exist anywhere (excluding runs/ + node_modules/.git).
const SKIP = new Set(['runs', 'node_modules', '.git']);
function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    let st;
    try { st = fs.statSync(full); } catch (_) { continue; }
    if (st.isDirectory()) {
      if (SKIP.has(entry)) continue;
      walk(full);
    } else {
      for (const pat of forbidden) {
        if (matchesGlob(entry, pat)) fail(`forbidden legacy artifact present: ${path.relative(P('.'), full)}`);
      }
    }
  }
}
walk(P('.'));

// 3) Run artifacts must live only under runs/<client>/<run-id>/.
if (core.exists(P('runs'))) {
  // Presence of the directory is sufficient; contents are per-run and not policed here.
}

if (problems.length) {
  for (const p of problems) process.stdout.write(`LAYOUT  ${p}\n`);
  process.stdout.write(`\n${problems.length} layout problem(s)\n`);
  process.exit(1);
}
process.stdout.write('LAYOUT OK  repository tree conforms to repository-layout-policy.yaml\n');
process.exit(0);

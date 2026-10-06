#!/usr/bin/env node
'use strict';
/*
 * Single validation entry point for the whole NGO Core upgrade agent.
 *
 *   node tools/validate-all.js
 *
 * Runs every suite in ingest/, orchestrator/, backend/ and frontend/, then asserts the
 * working tree is unchanged. Each suite must run from its own module directory because
 * the suites resolve paths relative to the current working directory.
 *
 * Exit code 0 only when every suite passes AND no tracked file was modified.
 * Dependency-free, Node 14+.
 */
const path = require('path');
const cp = require('child_process');
const fs = require('fs');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');

const SUITES = [
  ['ingest', 'ingest', 'tools/ingest.test.js'],
  ['orchestrator', 'orchestrator', 'tests/orchestrator.test.js'],
  ['engine', 'engine', 'tests/engine.test.js'],
  ['backend: structure', 'backend', 'tools/validate.js'],
  ['backend: repository layout', 'backend', 'tools/repo-layout.test.js'],
  ['backend: skills', 'backend', 'tools/skills.test.js'],
  ['backend: release knowledge', 'backend', 'tools/release-knowledge.test.js'],
  ['backend: tool bootstrap', 'backend', 'tools/bootstrap/tests/bootstrap.test.js'],
  ['backend: behavioral evals', 'backend', 'tools/run-evals.js'],
  ['frontend: structure', 'frontend', 'tools/validate.js'],
  ['frontend: repository layout', 'frontend', 'tools/repo-layout.test.js'],
  ['frontend: skills', 'frontend', 'tools/skills.test.js'],
  ['frontend: release schema', 'frontend', 'tests/release-schema.test.js'],
  ['frontend: release knowledge', 'frontend', 'tests/release-knowledge.test.js'],
  ['frontend: behavioral evals', 'frontend', 'tools/run-evals.js'],
];

function git(args) {
  const res = cp.spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', shell: true, windowsHide: true });
  return res.status === 0 ? (res.stdout || '').trim() : null;
}

function trackedSnapshot() {
  const files = git(['ls-files', '-z']);
  if (files === null) return null;
  const hash = crypto.createHash('sha256');
  for (const file of files.split('\0').filter(Boolean).sort()) {
    hash.update(file).update('\0');
    try { hash.update(fs.readFileSync(path.join(ROOT, file))); } catch (_) { hash.update('<MISSING>'); }
  }
  return hash.digest('hex');
}

const verbose = process.argv.includes('--verbose');
const baseline = git(['status', '--porcelain']);
const baselineContents = trackedSnapshot();
const failures = [];

console.log('NGO Core upgrade agent - complete validation\n');
for (const [label, cwd, script] of SUITES) {
  const started = Date.now();
  const res = cp.spawnSync(process.execPath, [script], {
    cwd: path.join(ROOT, cwd), encoding: 'utf8', windowsHide: true,
  });
  const ok = res.status === 0;
  const ms = Date.now() - started;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}  (${ms} ms)`);
  if (!ok || verbose) {
    const out = `${res.stdout || ''}${res.stderr || ''}`.trimEnd();
    if (out) console.log(out.split(/\r?\n/).map((l) => '        ' + l).join('\n'));
  }
  if (!ok) failures.push(label);
}

// Running the suites must never modify the repository: the agent's own tests used to
// delete tracked files, which silently corrupted the package before it was published.
let treeDirty = false;
const after = git(['status', '--porcelain']);
const afterContents = trackedSnapshot();
if (baseline === null || after === null || baselineContents === null || afterContents === null) {
  console.log('\n  SKIP  working-tree check (git unavailable)');
} else if (after !== baseline || baselineContents !== afterContents) {
  treeDirty = true;
  const before = new Set(baseline.split(/\r?\n/));
  const added = after.split(/\r?\n/).filter((l) => l && !before.has(l));
  console.log('\n  FAIL  working tree changed while validating:');
  for (const l of added) console.log('        ' + l);
  if (baselineContents !== afterContents) console.log('        tracked file contents changed (including previously dirty files)');
} else {
  console.log('\n  PASS  working tree and tracked contents unchanged');
}

const total = SUITES.length;
console.log(`\n${total - failures.length}/${total} suites passed${failures.length ? ': ' + failures.join(', ') + ' failed' : ''}.`);
process.exit(failures.length === 0 && !treeDirty ? 0 : 1);

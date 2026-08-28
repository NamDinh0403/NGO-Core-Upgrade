'use strict';
/*
 * Test runner for the deterministic tests/ tree. Spawns each *.test.js as its
 * own process (they call process.exit) and aggregates results.
 * Dependency-free, Node 14+. Run: node tests/run.js
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

function findTests(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'fixtures' || e.name === 'node_modules') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push.apply(out, findTests(full));
    else if (e.name.endsWith('.test.js')) out.push(full);
  }
  return out;
}

const tests = findTests(__dirname);
let failed = 0;
for (const t of tests) {
  const rel = path.relative(path.join(__dirname, '..'), t);
  process.stdout.write(`\n=== ${rel} ===\n`);
  const res = cp.spawnSync(process.execPath, [t], { encoding: 'utf8' });
  process.stdout.write(res.stdout || '');
  if (res.stderr) process.stdout.write(res.stderr);
  if (res.status !== 0) failed++;
}

process.stdout.write(`\n${tests.length - failed}/${tests.length} test files passed\n`);
process.exit(failed ? 1 : 0);

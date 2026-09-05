'use strict';
/*
 * Minimal, read-only git helper for an EXTERNAL repository path (the local
 * NGO.Core checkout, config/core-repository.yaml). Deliberately does not use
 * tools/bootstrap/lib/core.js#runExec's cwd handling: that helper's `P()`
 * joins its `cwd` option onto this repo's ROOT, which silently produces a
 * broken path for an absolute external directory (Node's path.join does not
 * special-case already-absolute segments the way path.resolve does). Instead,
 * mirrors frontend/tools/lib/git.js: pass `-C <repoPath>` as a literal
 * git argument so the working directory used by spawnSync is irrelevant.
 *
 * SAFETY: read-only verbs only. No checkout/reset/switch/branch/commit/push in
 * the Core repository — see tools/wrappers/core-repository-history for the
 * capability-gated wrapper used mid-run by skills. This module backs the
 * lightweight `upgrade-agent.js check-core-releases` maintenance command,
 * which is intentionally usable outside a run/TOOL_BOOTSTRAP.
 */
const cp = require('child_process');

function git(repoPath, argv, opts) {
  const safety = ['-c', 'core.fsmonitor=false', '-c', 'core.useBuiltinFSMonitor=false'];
  const args = ['-C', repoPath].concat(safety, argv);
  const res = cp.spawnSync('git', args, { encoding: 'utf8', timeout: (opts && opts.timeout) || 30000, windowsHide: true });
  return { code: res.status, stdout: res.stdout || '', stderr: res.stderr || '', error: res.error ? String(res.error.message || res.error) : null };
}

function isGitRepo(repoPath) {
  const r = git(repoPath, ['rev-parse', '--is-inside-work-tree']);
  return r.code === 0 && /true/.test(r.stdout);
}

/** List tags, unsorted (caller applies version parsing/sorting). */
function listTags(repoPath) {
  const r = git(repoPath, ['tag', '--list']);
  if (r.code !== 0) return { ok: false, error: (r.stderr || r.error || 'git tag failed').trim(), tags: [] };
  return { ok: true, error: null, tags: r.stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) };
}

module.exports = { git, isGitRepo, listTags };

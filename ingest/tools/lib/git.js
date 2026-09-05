'use strict';
/*
 * Minimal, read-only git helper for the local NGO.Core checkout. Shared by
 * both backend and frontend via ingest/tools/ingest.js —
 * this is the ONE place "run git safely against an external repo path" is
 * implemented, instead of each track keeping its own copy.
 *
 * SAFETY: read-only verbs only. No checkout/reset/switch/branch/commit/push in
 * the Core repository. A ref other than the current checkout must be inspected
 * via `git show`/`git diff <ref>..<ref>` (no working-tree checkout needed for
 * those), never by switching the repository's HEAD in place.
 */
const cp = require('child_process');

function git(repoPath, argv, opts) {
  const safety = ['-c', 'core.fsmonitor=false', '-c', 'core.useBuiltinFSMonitor=false'];
  const args = ['-C', repoPath].concat(safety, argv);
  const res = cp.spawnSync('git', args, { encoding: 'utf8', timeout: (opts && opts.timeout) || 60000, windowsHide: true });
  return { code: res.status, stdout: res.stdout || '', stderr: res.stderr || '', error: res.error ? String(res.error.message || res.error) : null };
}

function isGitRepo(repoPath) {
  const r = git(repoPath, ['rev-parse', '--is-inside-work-tree']);
  return r.code === 0 && /true/.test(r.stdout);
}

function headCommit(repoPath) {
  const r = git(repoPath, ['rev-parse', 'HEAD']);
  return r.code === 0 ? r.stdout.trim() : null;
}

function statusPorcelain(repoPath) {
  const r = git(repoPath, ['status', '--porcelain']);
  return r.code === 0 ? r.stdout : null;
}

/** Compact fingerprint captured before/after inspection to prove Core is unchanged. */
function fingerprint(repoPath) {
  const status = statusPorcelain(repoPath);
  return {
    path: repoPath,
    isGitRepo: isGitRepo(repoPath),
    headCommit: headCommit(repoPath),
    statusClean: status !== null && status.trim() === '',
  };
}

function diffFingerprints(before, after) {
  const diffs = [];
  if (!before || !after) return ['missing fingerprint'];
  if (before.headCommit !== after.headCommit) diffs.push(`HEAD changed ${before.headCommit} -> ${after.headCommit}`);
  if (before.statusClean !== after.statusClean) diffs.push(`working-tree cleanliness changed ${before.statusClean} -> ${after.statusClean}`);
  return diffs;
}

/** List all tags (read-only). */
function listTags(repoPath) {
  const r = git(repoPath, ['tag', '--list']);
  if (r.code !== 0) return { ok: false, error: (r.stderr || r.error || 'git tag failed').trim(), tags: [] };
  return { ok: true, error: null, tags: r.stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) };
}

/** Name-status diff between two refs, no working-tree checkout of either. */
function diffNameStatus(repoPath, refA, refB) {
  const r = git(repoPath, ['diff', '--name-status', `${refA}..${refB}`]);
  if (r.code !== 0) return { ok: false, error: (r.stderr || r.error || 'git diff failed').trim(), changes: [] };
  const changes = r.stdout.split(/\r?\n/).filter(Boolean).map((line) => {
    const [status, ...rest] = line.split(/\t/);
    return { status, path: rest.join('\t') };
  });
  return { ok: true, error: null, changes };
}

module.exports = { git, isGitRepo, headCommit, statusPorcelain, fingerprint, diffFingerprints, listTags, diffNameStatus };

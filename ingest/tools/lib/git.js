'use strict';
/*
 * Minimal, read-only git helper for the local NGO.Core checkout. Shared by
 * both backend and frontend via ingest/tools/ingest.js —
 * this is the ONE place "run git safely against an external repo path" is
 * implemented, instead of each track keeping its own copy.
 *
 * SAFETY: no checkout/reset/switch/branch/commit/push in the Core repository.
 * Fetch may refresh remote-tracking release refs, but source content, HEAD and
 * the working tree are never changed. Other refs are inspected via
 * `git show`/`git diff <ref>..<ref>`, never by switching HEAD in place.
 */
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function git(repoPath, argv, opts) {
  const safety = ['-c', 'core.fsmonitor=false', '-c', 'core.useBuiltinFSMonitor=false'];
  const args = ['-C', repoPath].concat(safety, argv);
  const res = cp.spawnSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, timeout: (opts && opts.timeout) || 60000, windowsHide: true });
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
  const head = headCommit(repoPath);
  const diff = git(repoPath, ['diff', '--binary', 'HEAD', '--']);
  const untracked = git(repoPath, ['ls-files', '--others', '--exclude-standard', '-z']);
  const hash = crypto.createHash('sha256');
  let valid = status !== null && head !== null && diff.code === 0 && untracked.code === 0;
  hash.update(status || '').update(diff.stdout);
  try {
    for (const relative of untracked.stdout.split('\0').filter(Boolean).sort()) {
      const file = path.join(repoPath, relative);
      hash.update(relative).update('\0');
      hash.update(fs.lstatSync(file).isSymbolicLink() ? fs.readlinkSync(file) : fs.readFileSync(file));
    }
  } catch (_) { valid = false; }
  return {
    path: repoPath,
    isGitRepo: isGitRepo(repoPath),
    headCommit: head,
    statusClean: status !== null && status.trim() === '',
    valid,
    contentDigest: valid ? hash.digest('hex') : null,
  };
}

function diffFingerprints(before, after) {
  const diffs = [];
  if (!before || !after) return ['missing fingerprint'];
  if (before.valid === false || after.valid === false) diffs.push('Core fingerprint could not be verified');
  if (before.headCommit !== after.headCommit) diffs.push(`HEAD changed ${before.headCommit} -> ${after.headCommit}`);
  if (before.statusClean !== after.statusClean) diffs.push(`working-tree cleanliness changed ${before.statusClean} -> ${after.statusClean}`);
  if (before.contentDigest !== after.contentDigest) diffs.push('working-tree content changed');
  return diffs;
}

/** List all tags (read-only). */
function listTags(repoPath) {
  const r = git(repoPath, ['tag', '--list']);
  if (r.code !== 0) return { ok: false, error: (r.stderr || r.error || 'git tag failed').trim(), tags: [] };
  return { ok: true, error: null, tags: r.stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) };
}

/** Refresh only origin's release refs; never changes HEAD or the working tree. */
function fetchReleaseBranches(repoPath) {
  const r = git(repoPath, [
    'fetch', '--prune', 'origin',
    '+refs/heads/releases/*:refs/remotes/origin/releases/*',
  ], { timeout: 180000 });
  return r.code === 0
    ? { ok: true, error: null }
    : { ok: false, error: (r.stderr || r.error || 'git fetch failed').trim() };
}

/** List fetched origin release branches without changing the Core checkout. */
function listReleaseBranches(repoPath) {
  const r = git(repoPath, ['for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin/releases/*']);
  if (r.code !== 0) return { ok: false, error: (r.stderr || r.error || 'git branch listing failed').trim(), branches: [] };
  const branches = Array.from(new Set(r.stdout.split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => /(?:^|\/)releases\/[^/]+$/.test(s))
    .map((s) => s.replace(/^origin\//, ''))));
  return { ok: true, error: null, branches };
}

/** Name-status diff between two refs, no working-tree checkout of either. */
function diffNameStatus(repoPath, refA, refB) {
  const from = resolveRef(repoPath, refA);
  const to = resolveRef(repoPath, refB);
  if (!from || !to) return { ok: false, error: 'release boundary does not resolve to commits', changes: [] };
  const r = git(repoPath, ['diff', '--name-status', '-z', '--find-renames', from, to, '--']);
  if (r.code !== 0) return { ok: false, error: (r.stderr || r.error || 'git diff failed').trim(), changes: [] };
  const fields = r.stdout.split('\0');
  const changes = [];
  for (let index = 0; index < fields.length && fields[index];) {
    const status = fields[index++];
    const oldPath = fields[index++];
    const renamed = /^[RC]/.test(status);
    const newPath = renamed ? fields[index++] : oldPath;
    changes.push({ status, path: newPath, oldPath: renamed ? oldPath : null });
  }
  return { ok: true, error: null, changes };
}

function resolveRef(repoPath, ref) {
  if (typeof ref !== 'string' || !ref || ref.startsWith('-')) return null;
  const result = git(repoPath, ['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`]);
  return result.code === 0 ? result.stdout.trim() : null;
}

function showFile(repoPath, commit, file) {
  const result = git(repoPath, ['show', `${commit}:${file}`]);
  if (result.code !== 0) throw new Error(`cannot read ${file} at ${commit}`);
  return result.stdout;
}

function commitLog(repoPath, refA, refB) {
  const from = resolveRef(repoPath, refA);
  const to = resolveRef(repoPath, refB);
  if (!from || !to) return { ok: false, error: 'release boundary does not resolve to commits', commits: [] };
  const r = git(repoPath, ['log', '--format=%H%x00%s%x00', `${from}..${to}`, '--']);
  if (r.code !== 0) return { ok: false, error: (r.stderr || r.error || 'git log failed').trim(), commits: [] };
  const fields = r.stdout.split('\0');
  const commits = [];
  for (let i = 0; i + 1 < fields.length; i += 2) {
    const sha = fields[i].trim();
    if (sha) commits.push({ sha, subject: fields[i + 1] || '' });
  }
  return { ok: true, error: null, commits };
}

function diffPatch(repoPath, refA, refB) {
  const from = resolveRef(repoPath, refA);
  const to = resolveRef(repoPath, refB);
  if (!from || !to) return { ok: false, error: 'release boundary does not resolve to commits', patch: '' };
  const r = git(repoPath, ['diff', '--find-renames', '--unified=0', from, to, '--']);
  return r.code === 0
    ? { ok: true, error: null, patch: r.stdout }
    : { ok: false, error: (r.stderr || r.error || 'git diff failed').trim(), patch: '' };
}

module.exports = {
  git, isGitRepo, headCommit, statusPorcelain, fingerprint, diffFingerprints,
  listTags, fetchReleaseBranches, listReleaseBranches, diffNameStatus, commitLog, diffPatch, resolveRef, showFile,
};

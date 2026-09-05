'use strict';
/*
 * Git helpers. Non-mutating inspection of both repositories, plus explicitly
 * scoped mutation helpers for the CLIENT repository only (checkpoint/branch).
 *
 * SAFETY: nothing in this module writes to, resets, or switches branches in the
 * Core repository. Core target references are resolved through a read-only
 * `git worktree` created OUTSIDE both repositories, never by switching the
 * developer's Core working tree.
 */
const path = require('path');
const core = require('./core');

function git(repoPath, argv, opts) {
  // Disable the filesystem-monitor daemon and optional locks: a lingering
  // `git fsmonitor--daemon` child can otherwise inherit and hold this process's
  // stdout pipe open, preventing prompt, clean termination of the agent run.
  const safety = [
    '-c', 'core.fsmonitor=false',
    '-c', 'core.useBuiltinFSMonitor=false',
  ];
  return core.runExec('git', ['-C', `"${repoPath}"`].concat(safety, argv), opts || {});
}

function isGitRepo(repoPath) {
  const r = git(repoPath, ['rev-parse', '--is-inside-work-tree']);
  return r.code === 0 && /true/.test(r.stdout);
}

function currentBranch(repoPath) {
  const r = git(repoPath, ['rev-parse', '--abbrev-ref', 'HEAD']);
  if (r.code !== 0) return null;
  const b = r.stdout.trim();
  return b === 'HEAD' ? null : b; // null → detached
}

function headCommit(repoPath) {
  const r = git(repoPath, ['rev-parse', 'HEAD']);
  return r.code === 0 ? r.stdout.trim() : null;
}

function isDetached(repoPath) {
  const r = git(repoPath, ['rev-parse', '--abbrev-ref', 'HEAD']);
  return r.code === 0 && r.stdout.trim() === 'HEAD';
}

function statusPorcelain(repoPath) {
  const r = git(repoPath, ['status', '--porcelain']);
  return r.code === 0 ? r.stdout : null;
}

function isClean(repoPath) {
  const s = statusPorcelain(repoPath);
  return s !== null && s.trim() === '';
}

function uncommittedFiles(repoPath) {
  const s = statusPorcelain(repoPath);
  if (!s) return [];
  return s.split(/\r?\n/).filter((l) => l.trim().length).map((l) => l.slice(3));
}

/** Resolve a ref (tag/branch/sha) to a commit sha WITHOUT checking it out. */
function resolveRef(repoPath, ref) {
  if (!ref) return null;
  // Prefer an annotated/lightweight tag or branch; fall back to raw rev-parse.
  let r = git(repoPath, ['rev-list', '-n', '1', ref]);
  if (r.code === 0 && r.stdout.trim()) return r.stdout.trim();
  r = git(repoPath, ['rev-parse', '--verify', `${ref}^{commit}`]);
  return r.code === 0 ? r.stdout.trim() : null;
}

function refExists(repoPath, ref) {
  return resolveRef(repoPath, ref) !== null;
}

/**
 * Read a file's contents at a specific commit WITHOUT touching the working tree.
 * Returns null when the path does not exist at that commit.
 */
function showFileAtRef(repoPath, ref, relPath) {
  const spec = `${ref}:${relPath.replace(/\\/g, '/')}`;
  const r = git(repoPath, ['show', `"${spec}"`]);
  return r.code === 0 ? r.stdout : null;
}

/** List tracked files at a ref (read-only). */
function listFilesAtRef(repoPath, ref) {
  const r = git(repoPath, ['ls-tree', '-r', '--name-only', ref]);
  return r.code === 0 ? r.stdout.split(/\r?\n/).filter(Boolean) : [];
}

/**
 * List all tags in the repository (read-only). Used by ingest-core-release to
 * enumerate historical Core releases, rather than only the single
 * repositories.core.targetRef this module otherwise resolves.
 */
function listTags(repoPath) {
  const r = git(repoPath, ['tag', '--list']);
  if (r.code !== 0) return { ok: false, error: (r.stderr || 'git tag failed').trim(), tags: [] };
  return { ok: true, error: null, tags: r.stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) };
}

/**
 * Name-status diff between two refs (read-only, no working-tree checkout).
 * Returns [{ status: 'A'|'M'|'D'|'R100'|..., path }].
 */
function diffNameStatus(repoPath, refA, refB) {
  const r = git(repoPath, ['diff', '--name-status', `${refA}..${refB}`]);
  if (r.code !== 0) return { ok: false, error: (r.stderr || 'git diff failed').trim(), changes: [] };
  const changes = r.stdout.split(/\r?\n/).filter(Boolean).map((line) => {
    const [status, ...rest] = line.split(/\t/);
    return { status, path: rest.join('\t') };
  });
  return { ok: true, error: null, changes };
}

/**
 * Create a READ-ONLY worktree for a Core target ref at an external destination
 * (must be outside both repositories). Used only when the requested target ref
 * differs from the current Core checkout. The developer's Core working tree is
 * never switched. Returns { ok, worktreePath, commit, error }.
 */
function addReadonlyWorktree(corePath, ref, destAbs) {
  const commit = resolveRef(corePath, ref);
  if (!commit) return { ok: false, error: `cannot resolve ref '${ref}' in Core`, commit: null, worktreePath: null };
  core.ensureDir(path.dirname(destAbs));
  // --detach avoids creating/moving a branch; the worktree is inspected read-only.
  const r = git(corePath, ['worktree', 'add', '--detach', '--force', `"${destAbs}"`, commit]);
  if (r.code !== 0) return { ok: false, error: (r.stderr || r.stdout || 'worktree add failed').trim(), commit, worktreePath: null };
  return { ok: true, worktreePath: destAbs, commit, error: null };
}

function removeWorktree(corePath, destAbs) {
  const r = git(corePath, ['worktree', 'remove', '--force', `"${destAbs}"`]);
  return r.code === 0;
}

/**
 * A compact, comparable fingerprint of a repository's git identity + key hashes.
 * Captured before and after Core inspection to prove Core is unchanged.
 */
function fingerprint(repoPath, keyFilesRel) {
  const fp = {
    path: path.resolve(repoPath),
    isGitRepo: isGitRepo(repoPath),
    branch: null,
    detached: null,
    headCommit: null,
    statusClean: null,
    uncommittedCount: null,
    fileHashes: {},
    capturedAt: core.nowIso(),
  };
  if (fp.isGitRepo) {
    fp.branch = currentBranch(repoPath);
    fp.detached = isDetached(repoPath);
    fp.headCommit = headCommit(repoPath);
    const status = statusPorcelain(repoPath);
    fp.statusClean = status !== null && status.trim() === '';
    fp.uncommittedCount = status ? status.split(/\r?\n/).filter((l) => l.trim().length).length : 0;
  }
  for (const rel of keyFilesRel || []) {
    const abs = path.join(repoPath, rel);
    fp.fileHashes[rel] = core.sha256Maybe(abs);
  }
  return fp;
}

/** Compare two fingerprints; returns list of human-readable differences. */
function diffFingerprints(before, after) {
  const diffs = [];
  if (!before || !after) return ['missing fingerprint'];
  if (before.headCommit !== after.headCommit) diffs.push(`HEAD changed ${before.headCommit} -> ${after.headCommit}`);
  if (before.branch !== after.branch) diffs.push(`branch changed ${before.branch} -> ${after.branch}`);
  if (before.statusClean !== after.statusClean) diffs.push(`working-tree cleanliness changed ${before.statusClean} -> ${after.statusClean}`);
  const keys = new Set([...Object.keys(before.fileHashes || {}), ...Object.keys(after.fileHashes || {})]);
  for (const k of keys) {
    if ((before.fileHashes || {})[k] !== (after.fileHashes || {})[k]) diffs.push(`file changed: ${k}`);
  }
  return diffs;
}

module.exports = {
  git, isGitRepo, currentBranch, headCommit, isDetached, statusPorcelain, isClean,
  uncommittedFiles, resolveRef, refExists, showFileAtRef, listFilesAtRef, listTags, diffNameStatus,
  addReadonlyWorktree, removeWorktree, fingerprint, diffFingerprints,
};

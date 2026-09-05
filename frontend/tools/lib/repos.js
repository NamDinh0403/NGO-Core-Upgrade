'use strict';
/*
 * Repository inspection primitives shared by doctor, inventory, and package
 * resolution. Pure reads — nothing here mutates any repository.
 *
 * Handles two repository roles:
 *   - client: the mutable Angular/NGO client front-end.
 *   - core:   the read-only local NGO Core repository (source of truth).
 */
const path = require('path');
const core = require('./core');
const git = require('./git');

const CORE_PACKAGE_NAME = 'ngo-core';

// Files whose presence/identity is fingerprinted to prove Core stays unchanged.
const CORE_KEY_FILES = [
  'package.json', 'package-lock.json', 'npm-shrinkwrap.json',
  'yarn.lock', 'pnpm-lock.yaml', 'angular.json', 'tsconfig.json',
];

function readPackageJson(repoPath) {
  const abs = path.join(repoPath, 'package.json');
  if (!core.exists(abs)) return { ok: false, error: 'package.json not found', abs, data: null };
  try {
    return { ok: true, error: null, abs, data: core.readJsonAbs(abs), hash: core.sha256File(abs) };
  } catch (e) {
    return { ok: false, error: `package.json is not valid JSON: ${e.message}`, abs, data: null };
  }
}

const LOCKFILES = [
  { file: 'package-lock.json', manager: 'npm' },
  { file: 'npm-shrinkwrap.json', manager: 'npm' },
  { file: 'yarn.lock', manager: 'yarn' },
  { file: 'pnpm-lock.yaml', manager: 'pnpm' },
];

function detectLockfile(repoPath) {
  for (const l of LOCKFILES) {
    const abs = path.join(repoPath, l.file);
    if (core.exists(abs)) return { file: l.file, manager: l.manager, abs, hash: core.sha256File(abs) };
  }
  return null;
}

/** Package manager preference: explicit packageManager field > lockfile > npm. */
function detectPackageManager(repoPath, pkg) {
  if (pkg && typeof pkg.packageManager === 'string') {
    const m = pkg.packageManager.split('@')[0];
    if (['npm', 'yarn', 'pnpm'].includes(m)) return { manager: m, source: 'packageManager field' };
  }
  const lock = detectLockfile(repoPath);
  if (lock) return { manager: lock.manager, source: `lockfile ${lock.file}` };
  return { manager: 'npm', source: 'default' };
}

function readAngularWorkspace(repoPath) {
  const abs = path.join(repoPath, 'angular.json');
  if (!core.exists(abs)) return { present: false, abs, projects: [], defaultProject: null };
  try {
    const data = core.readJsonAbs(abs);
    const projects = data.projects ? Object.keys(data.projects) : [];
    return {
      present: true, abs, data, projects,
      defaultProject: data.defaultProject || (projects.length === 1 ? projects[0] : null),
      hash: core.sha256File(abs),
    };
  } catch (e) {
    return { present: true, abs, error: `angular.json is not valid JSON: ${e.message}`, projects: [] };
  }
}

/** Find a package's declared version across dependency sections. */
function declaredVersion(pkg, name) {
  if (!pkg) return null;
  for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    if (pkg[section] && pkg[section][name] != null) {
      return { version: pkg[section][name], section };
    }
  }
  return null;
}

/** Resolve an installed package version from node_modules, when present. */
function resolvedVersion(repoPath, name) {
  const abs = path.join(repoPath, 'node_modules', ...name.split('/'), 'package.json');
  if (!core.exists(abs)) return null;
  try { return core.readJsonAbs(abs).version || null; } catch (e) { return null; }
}

/** Locate the client's NGO Core package reference (default name: ngo-core). */
function findCoreReference(pkg, coreName) {
  coreName = coreName || CORE_PACKAGE_NAME;
  const direct = declaredVersion(pkg, coreName);
  if (direct) return { name: coreName, version: direct.version, section: direct.section };
  // Fall back: any ngo-* / @ngo/* dependency that looks like the core package.
  const candidates = [];
  for (const section of ['dependencies', 'devDependencies']) {
    for (const [k, v] of Object.entries((pkg && pkg[section]) || {})) {
      if (/^(@ngo\/core|ngo-core|@ngo\/.+-core)$/.test(k)) candidates.push({ name: k, version: v, section });
    }
  }
  return candidates[0] || null;
}

/** List client ngo-* packages (used to flag ones absent from target Core). */
function ngoPackages(pkg) {
  const out = [];
  for (const section of ['dependencies', 'devDependencies']) {
    for (const [k, v] of Object.entries((pkg && pkg[section]) || {})) {
      if (/(^|\/)ngo[-/]/i.test(k) || /^@ngo\//i.test(k) || /^ngo-/i.test(k)) out.push({ name: k, version: v, section });
    }
  }
  return out;
}

/** Extract the Core package's own declared version from its package.json. */
function corePackageVersion(pkg) {
  return (pkg && typeof pkg.version === 'string') ? pkg.version : null;
}

/** A resolved-version reader for a lockfile entry (npm v2/v3 lock formats). */
function lockResolvedVersion(lockAbs, manager, name) {
  if (!core.exists(lockAbs)) return null;
  try {
    if (manager === 'npm') {
      const lock = core.readJsonAbs(lockAbs);
      if (lock.packages) {
        const key = `node_modules/${name}`;
        if (lock.packages[key] && lock.packages[key].version) return lock.packages[key].version;
      }
      if (lock.dependencies && lock.dependencies[name] && lock.dependencies[name].version) {
        return lock.dependencies[name].version;
      }
    }
    // yarn/pnpm lock text parsing is intentionally conservative and returns null
    // here; resolve-target-packages performs the deeper text scan when required.
    return null;
  } catch (e) { return null; }
}

/** Compose a repository summary object used by doctor + run artifacts. */
function summarize(repoPath, role, opts) {
  opts = opts || {};
  const summary = {
    role,
    path: path.resolve(repoPath),
    exists: core.exists(repoPath),
    readable: core.isReadable(repoPath),
    isDirectory: core.isDir(repoPath),
    isGitRepo: false,
    git: null,
    packageJson: null,
    packageName: null,
    packageVersion: null,
    lockfile: null,
    packageManager: null,
    angular: null,
    coreReference: null,
    capturedAt: core.nowIso(),
  };
  if (!summary.exists || !summary.isDirectory) return summary;

  summary.isGitRepo = git.isGitRepo(repoPath);
  if (summary.isGitRepo) {
    summary.git = {
      branch: git.currentBranch(repoPath),
      detached: git.isDetached(repoPath),
      headCommit: git.headCommit(repoPath),
      clean: git.isClean(repoPath),
      uncommittedCount: git.uncommittedFiles(repoPath).length,
    };
  }

  const pkg = readPackageJson(repoPath);
  summary.packageJson = { ok: pkg.ok, error: pkg.error, hash: pkg.hash || null };
  if (pkg.ok) {
    summary.packageName = pkg.data.name || null;
    summary.packageVersion = pkg.data.version || null;
    summary.packageManager = detectPackageManager(repoPath, pkg.data);
    summary.angular = readAngularWorkspace(repoPath);
    if (role === 'client') {
      summary.coreReference = findCoreReference(pkg.data, opts.coreName);
    }
    summary._pkg = pkg.data; // internal, stripped before persistence
  }
  summary.lockfile = detectLockfile(repoPath);
  return summary;
}

module.exports = {
  CORE_PACKAGE_NAME, CORE_KEY_FILES,
  readPackageJson, detectLockfile, detectPackageManager, readAngularWorkspace,
  declaredVersion, resolvedVersion, findCoreReference, ngoPackages,
  corePackageVersion, lockResolvedVersion, summarize,
};

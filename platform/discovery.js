'use strict';
/*
 * Workspace Project Discovery Service.
 *
 * Scans approved workspace roots to identify candidate NGO Client repositories,
 * inspects .git state, extracts installed Core versions from backend (.csproj)
 * and frontend (package.json) manifests, and provides diagnostic explanations
 * for skipped or unidentifiable directories.
 *
 * Security: Bound strictly to approved workspace roots. Never recursively scans
 * the full filesystem.
 *
 * Dependency-free, Node 14+.
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const settings = require('./settings');

let cachedDiscovery = null;
let lastDiscoveryTime = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

/**
 * Extract Git branch and dirty status safely using read-only operations.
 */
function inspectGitStatus(repoPath) {
  const gitDir = path.join(repoPath, '.git');
  if (!fs.existsSync(gitDir)) {
    return { isGit: false, branch: null, isClean: true };
  }

  let branch = null;
  let isClean = true;

  // 1. Fast path: parse .git/HEAD directly without spawning git process
  try {
    if (fs.statSync(gitDir).isFile()) {
      branch = 'worktree';
    } else {
      const headFile = path.join(gitDir, 'HEAD');
      if (fs.existsSync(headFile)) {
        const content = fs.readFileSync(headFile, 'utf8').trim();
        const m = content.match(/ref:\s*refs\/heads\/(.+)/);
        branch = m ? m[1] : (content.length <= 40 ? content.slice(0, 8) : null);
      }
    }
  } catch (_) {}

  // Fallback to git rev-parse only if direct read was not possible
  if (!branch) {
    try {
      const branchRes = cp.spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
        cwd: repoPath,
        encoding: 'utf8',
        windowsHide: true,
        timeout: 2000,
      });
      if (branchRes.status === 0 && branchRes.stdout) {
        branch = branchRes.stdout.trim();
      }
    } catch (_) {}
  }

  try {
    // 2. Check if clean
    const statusRes = cp.spawnSync('git', ['status', '--porcelain'], {
      cwd: repoPath,
      encoding: 'utf8',
      windowsHide: true,
      timeout: 3000,
    });
    if (statusRes.status === 0) {
      const lines = (statusRes.stdout || '').trim().split(/\r?\n/).filter(Boolean);
      isClean = lines.length === 0;
    }
  } catch (_) {}

  return { isGit: true, branch: branch || 'unknown', isClean };
}

/**
 * Detect installed Core version from project manifests.
 */
function inspectCoreVersion(clientPath) {
  let backendVersion = null;
  let frontendVersion = null;
  let backendPath = null;
  let frontendPath = null;
  let slnFound = false;

  // Check for .sln or .slnx files
  try {
    const rootFiles = fs.readdirSync(clientPath);
    for (const f of rootFiles) {
      if (f.endsWith('.sln') || f.endsWith('.slnx')) {
        slnFound = true;
        break;
      }
    }
  } catch (_) {}

  // 1. Inspect Backend (.csproj)
  const apiDir = path.join(clientPath, 'ngo-api');
  const searchDirs = [apiDir, clientPath].filter((d) => fs.existsSync(d));

  for (const dir of searchDirs) {
    if (backendVersion) break;
    try {
      const scanDir = (current, depth) => {
        if (depth > 3) return;
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            if (!['bin', 'obj', '.vs', 'node_modules', '.git'].includes(entry.name)) {
              scanDir(path.join(current, entry.name), depth + 1);
            }
          } else if (entry.name.endsWith('.csproj')) {
            const full = path.join(current, entry.name);
            backendPath = full;
            try {
              const content = fs.readFileSync(full, 'utf8');
              const m =
                content.match(/<PackageReference\s+Include=["']NGO\.Core(?:\.[^"']+)?["']\s+Version=["']([^"']+)["']/i) ||
                content.match(/<PackageReference\s+Version=["']([^"']+)["']\s+Include=["']NGO\.Core/i) ||
                content.match(/<NGO_Core_Version>([^<]+)<\/NGO_Core_Version>/i);
              if (m && !backendVersion) {
                backendVersion = m[1];
              }
            } catch (_) {}
          }
        }
      };
      scanDir(dir, 1);
    } catch (_) {}
  }

  // 2. Inspect Frontend (package.json)
  const clientDir = path.join(clientPath, 'ngo-client');
  const searchClientDirs = [clientDir, clientPath].filter((d) => fs.existsSync(d));

  for (const dir of searchClientDirs) {
    if (frontendVersion) break;
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      frontendPath = pkgPath;
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const deps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
        for (const [dep, ver] of Object.entries(deps)) {
          if (dep.includes('ngo-core') || dep.includes('@ngo/core')) {
            frontendVersion = String(ver).replace(/^[\^~>=<]/, '');
            break;
          }
        }
      } catch (_) {}
    }
  }

  const primaryVersion = backendVersion || frontendVersion || null;
  const hasVersionMismatch = Boolean(backendVersion && frontendVersion && backendVersion !== frontendVersion);

  return {
    version: primaryVersion,
    backendVersion,
    frontendVersion,
    backendPath,
    frontendPath,
    hasBackend: Boolean(backendPath),
    hasFrontend: Boolean(frontendPath),
    hasSln: slnFound,
    hasVersionMismatch,
  };
}

/**
 * Format project folder name to human-readable title.
 */
function formatProjectName(folderName) {
  return folderName
    .replace(/^ngo-online-/, '')
    .replace(/[-_]/g, ' ')
    .toUpperCase();
}

/**
 * Scan approved workspace roots and identify client projects.
 */
function discoverWorkspaceProjects(options) {
  options = options || {};
  const bypassCache = Boolean(options.bypassCache || options.refresh);

  if (!bypassCache && cachedDiscovery && Date.now() - lastDiscoveryTime < CACHE_TTL_MS) {
    return cachedDiscovery;
  }

  const appSettings = settings.loadSettings();
  const roots = options.roots || options.approvedWorkspaceRoots || appSettings.approvedWorkspaceRoots || [];
  const corePathNorm = appSettings.corePath ? path.resolve(appSettings.corePath) : null;
  const repoRootNorm = path.resolve(__dirname, '..');

  const projects = [];
  const skipped = [];
  const seenPaths = new Set();

  for (const root of roots) {
    const resolvedRoot = path.resolve(root);
    if (!fs.existsSync(resolvedRoot)) {
      skipped.push({
        name: path.basename(resolvedRoot),
        path: resolvedRoot,
        reason: 'Configured workspace root does not exist on disk',
        root: resolvedRoot,
      });
      continue;
    }

    // Check if the root itself is an individual client project
    const rootName = path.basename(resolvedRoot);
    const rootIsClient =
      (rootName.startsWith('ngo-online-') ||
        fs.existsSync(path.join(resolvedRoot, 'ngo-api')) ||
        fs.existsSync(path.join(resolvedRoot, 'ngo-client'))) &&
      resolvedRoot !== corePathNorm &&
      resolvedRoot !== repoRootNorm;

    if (rootIsClient) {
      if (!seenPaths.has(resolvedRoot)) {
        seenPaths.add(resolvedRoot);
        const coreInfo = inspectCoreVersion(resolvedRoot);
        const gitInfo = inspectGitStatus(resolvedRoot);
        let status = 'READY';
        let statusLabel = 'Ready for Upgrade';
        if (coreInfo.hasVersionMismatch) {
          status = 'VERSION_MISMATCH';
          statusLabel = `Version Mismatch (Backend: ${coreInfo.backendVersion}, Frontend: ${coreInfo.frontendVersion})`;
        } else if (!gitInfo.isGit) {
          status = 'NON_GIT';
          statusLabel = 'Non-Git Workspace';
        } else if (!gitInfo.isClean) {
          status = 'DIRTY_GIT';
          statusLabel = 'Working Tree Has Uncommitted Changes';
        }

        projects.push({
          id: rootName,
          name: formatProjectName(rootName),
          path: resolvedRoot,
          root: resolvedRoot,
          approved: true,
          currentVersion: coreInfo.version || 'Unknown',
          installedCoreVersion: coreInfo.version || 'Unknown',
          backendVersion: coreInfo.backendVersion,
          frontendVersion: coreInfo.frontendVersion,
          hasVersionMismatch: coreInfo.hasVersionMismatch,
          hasBackend: coreInfo.hasBackend,
          hasFrontend: coreInfo.hasFrontend,
          hasSln: coreInfo.hasSln,
          isGit: gitInfo.isGit,
          gitBranch: gitInfo.branch,
          gitClean: gitInfo.isClean,
          status,
          statusLabel,
          backendPath: coreInfo.backendPath,
          frontendPath: coreInfo.frontendPath,
        });
      }
      // Since this root is an individual client project, don't treat internal folders like ngo-api as child projects
      continue;
    }

    let entries = [];
    try {
      entries = fs.readdirSync(resolvedRoot, { withFileTypes: true });
    } catch (err) {
      skipped.push({
        name: path.basename(resolvedRoot),
        path: resolvedRoot,
        reason: `Cannot read workspace root directory: ${err.message}`,
        root: resolvedRoot,
      });
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const fullPath = path.join(resolvedRoot, entry.name);
      const normalizedPath = path.resolve(fullPath);

      if (seenPaths.has(normalizedPath)) continue;
      seenPaths.add(normalizedPath);

      // Check for known skip conditions
      if (entry.name.endsWith('.worktrees')) {
        skipped.push({
          name: entry.name,
          path: fullPath,
          reason: 'Worktree cache directory (internal Git metadata)',
          root: resolvedRoot,
        });
        continue;
      }

      if (normalizedPath === repoRootNorm || entry.name === 'NGO Core Upgrade') {
        skipped.push({
          name: entry.name,
          path: fullPath,
          reason: 'NGO Core Upgrade Platform engine repository',
          root: resolvedRoot,
        });
        continue;
      }

      if (corePathNorm && normalizedPath === corePathNorm) {
        skipped.push({
          name: entry.name,
          path: fullPath,
          reason: 'Upstream reference NGO Core repository (read-only)',
          root: resolvedRoot,
        });
        continue;
      }

      if (['node_modules', '.git', '.vscode', '.idea', 'bin', 'obj'].includes(entry.name)) {
        continue;
      }

      // Check whether this directory has client indicators
      const hasNgoPrefix = entry.name.startsWith('ngo-online-');
      const hasNgoApi = fs.existsSync(path.join(fullPath, 'ngo-api'));
      const hasNgoClient = fs.existsSync(path.join(fullPath, 'ngo-client'));
      const hasPkgJson = fs.existsSync(path.join(fullPath, 'package.json'));
      const hasGit = fs.existsSync(path.join(fullPath, '.git'));

      // Inspect Core version and project files
      const coreInfo = inspectCoreVersion(fullPath);
      const isRecognizedClient =
        hasNgoPrefix ||
        hasNgoApi ||
        hasNgoClient ||
        coreInfo.backendVersion !== null ||
        coreInfo.frontendVersion !== null;

      if (!isRecognizedClient) {
        skipped.push({
          name: entry.name,
          path: fullPath,
          reason: 'Non-client repository: no NGO.Core dependencies or standard ngo-api/ngo-client directories found',
          root: resolvedRoot,
        });
        continue;
      }

      const gitInfo = inspectGitStatus(fullPath);

      let status = 'READY';
      let statusLabel = 'Ready for Upgrade';
      if (coreInfo.hasVersionMismatch) {
        status = 'VERSION_MISMATCH';
        statusLabel = `Version Mismatch (Backend: ${coreInfo.backendVersion}, Frontend: ${coreInfo.frontendVersion})`;
      } else if (!gitInfo.isGit) {
        status = 'NON_GIT';
        statusLabel = 'Non-Git Workspace';
      } else if (!gitInfo.isClean) {
        status = 'DIRTY_GIT';
        statusLabel = 'Working Tree Has Uncommitted Changes';
      }

      projects.push({
        id: entry.name,
        name: formatProjectName(entry.name),
        path: fullPath,
        root: resolvedRoot,
        approved: true,
        currentVersion: coreInfo.version || 'Unknown',
        installedCoreVersion: coreInfo.version || 'Unknown',
        backendVersion: coreInfo.backendVersion,
        frontendVersion: coreInfo.frontendVersion,
        hasVersionMismatch: coreInfo.hasVersionMismatch,
        hasBackend: coreInfo.hasBackend,
        hasFrontend: coreInfo.hasFrontend,
        hasSln: coreInfo.hasSln,
        isGit: gitInfo.isGit,
        gitBranch: gitInfo.branch,
        gitClean: gitInfo.isClean,
        status,
        statusLabel,
        backendPath: coreInfo.backendPath,
        frontendPath: coreInfo.frontendPath,
      });
    }
  }

  // Sort projects alphabetically by display name
  projects.sort((a, b) => a.name.localeCompare(b.name));

  const result = {
    ok: true,
    lastScanned: new Date().toISOString(),
    approvedRoots: roots,
    projects,
    skipped,
    totalDiscovered: projects.length,
    totalSkipped: skipped.length,
    summary: {
      totalRoots: roots.length,
      projectsFound: projects.length,
      skippedCount: skipped.length,
      mismatchedCount: projects.filter((p) => p.hasVersionMismatch).length,
      cleanGitCount: projects.filter((p) => p.gitClean).length,
    },
  };

  cachedDiscovery = result;
  lastDiscoveryTime = Date.now();
  return result;
}

/**
 * Validate a candidate path against approved roots and inspect its suitability.
 */
function validateClientPath(candidatePath, approvedRoots) {
  if (!candidatePath || typeof candidatePath !== 'string') {
    return { ok: false, valid: false, approved: false, isApproved: false, error: 'Path must be a non-empty string', reason: 'Path must be a non-empty string' };
  }

  const resolved = path.resolve(candidatePath);
  if (!fs.existsSync(resolved)) {
    return { ok: false, valid: false, approved: false, isApproved: false, error: `Directory does not exist: ${resolved}`, reason: 'Directory does not exist' };
  }

  const isApproved = settings.isWorkspaceApproved(resolved, approvedRoots);
  if (!isApproved) {
    return {
      ok: false,
      valid: false,
      approved: false,
      isApproved: false,
      error: `Security violation: Path "${resolved}" is outside approved workspace roots. Add its parent folder to Approved Workspace Roots in Settings first.`,
      reason: `Path is outside approved workspace roots`,
      path: resolved,
    };
  }

  // Check if it's the core repo or upgrade platform itself
  const appSettings = settings.loadSettings();
  const corePathNorm = appSettings.corePath ? path.resolve(appSettings.corePath) : null;
  const repoRootNorm = path.resolve(__dirname, '..');
  if (resolved === corePathNorm || resolved === repoRootNorm || path.basename(resolved) === 'NGO Core Upgrade') {
    return {
      ok: false,
      valid: false,
      approved: true,
      isApproved: true,
      error: 'Directory is upstream Core repository or Platform engine, not a client project',
      reason: 'Upstream Core repository or Platform engine (non-client)',
      path: resolved,
    };
  }

  const coreInfo = inspectCoreVersion(resolved);
  const gitInfo = inspectGitStatus(resolved);
  const folderName = path.basename(resolved);

  return {
    ok: true,
    valid: true,
    approved: true,
    isApproved: true,
    path: resolved,
    project: {
      id: folderName,
      name: formatProjectName(folderName),
      path: resolved,
      approved: true,
      currentVersion: coreInfo.version || 'Unknown',
      installedCoreVersion: coreInfo.version || 'Unknown',
      backendVersion: coreInfo.backendVersion,
      frontendVersion: coreInfo.frontendVersion,
      hasVersionMismatch: coreInfo.hasVersionMismatch,
      hasBackend: coreInfo.hasBackend,
      hasFrontend: coreInfo.hasFrontend,
      isGit: gitInfo.isGit,
      gitBranch: gitInfo.branch,
      gitClean: gitInfo.isClean,
      backendPath: coreInfo.backendPath,
      frontendPath: coreInfo.frontendPath,
    },
  };
}

module.exports = {
  discoverWorkspaceProjects,
  validateClientPath,
  inspectCoreVersion,
  inspectGitStatus,
};

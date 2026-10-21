'use strict';
/*
 * Cross-Machine Local NGO Core Repository Discovery and Validation Subsystem.
 *
 * Implements Phase 4 requirements:
 *   - Accepts explicitly configured Core repository locations (--core-path, NGO_CORE_PATH, settings.json).
 *   - Inspects approved workspace roots supplied by the user or configuration.
 *   - Supports common Windows directory layouts without assuming a single drive or username.
 *   - Supports repositories stored in nested directories (bounded traversal).
 *   - Validates candidates using actual Git metadata, remote repository identity, and expected Core structure.
 *   - Distinguishes the Core source repository from client repositories and unrelated repositories.
 *   - Handles multiple valid candidates by returning all candidates and requiring selection when ambiguous.
 *   - Caches discovery results with deterministic validation and explicit invalidation.
 *
 * Safety:
 *   - Never recursively scans an entire drive by default.
 *   - Excludes generated, dependency, and protected system directories.
 *   - Strictly read-only on all inspected repositories.
 *
 * Dependency-free, Node 14+.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const crypto = require('crypto');

const REPO_ROOT = path.resolve(__dirname, '..');
const CACHE_FILE = path.join(os.tmpdir(), 'ngo-core-upgrade-discovery-cache.json');

const EXCLUDED_DIRS = new Set([
  'node_modules', '.git', 'bin', 'obj', 'dist', 'out-tsc', '.angular', '.nx',
  '.vs', '.vscode', '.idea', 'runs', 'jobs', 'packages', 'coverage',
  'TestResults', 'frontend-runtime', '$RECYCLE.BIN', 'System Volume Information',
  'Windows', 'Program Files', 'Program Files (x86)', 'ProgramData', 'AppData',
  'Recovery', 'PerfLogs', 'Documents and Settings',
]);

let memoryCache = new Map();

function redactUrlCredentials(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
  return rawUrl.replace(/(\/\/)[^/@\s]+:[^/@\s]+@/g, '$1***REDACTED***@');
}

function runGit(repoPath, args, timeoutMs = 8000) {
  const res = cp.spawnSync(
    'git',
    ['-C', repoPath, '-c', 'core.fsmonitor=false', '-c', 'core.useBuiltinFSMonitor=false', ...args],
    {
      encoding: 'utf8',
      windowsHide: true,
      timeout: timeoutMs,
      env: Object.assign({}, process.env, {
        GIT_OPTIONAL_LOCKS: '0',
        GIT_TERMINAL_PROMPT: '0',
      }),
    }
  );
  return {
    ok: res.status === 0,
    status: res.status,
    stdout: (res.stdout || '').trim(),
    stderr: (res.stderr || '').trim(),
  };
}

function normalizePathKey(p) {
  if (!p) return '';
  try {
    const resolved = path.resolve(p);
    return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
  } catch (_) {
    return String(p);
  }
}

function isDriveRoot(dirPath) {
  const resolved = path.resolve(dirPath);
  if (process.platform === 'win32') {
    return /^[A-Za-z]:\\?$/.test(resolved);
  }
  return resolved === '/';
}

function isUpgradeAgentRepo(dirPath) {
  try {
    return (
      fs.existsSync(path.join(dirPath, 'engine', 'tools', 'upgrade-engine.js')) &&
      fs.existsSync(path.join(dirPath, 'ingest', 'tools', 'ingest.js'))
    );
  } catch (_) {
    return false;
  }
}

/**
 * Inspect and validate whether a directory is a valid NGO Core source repository.
 */
function validateCoreCandidate(candidatePath, opts = {}) {
  const failedCriteria = [];
  const warnings = [];

  if (!candidatePath || typeof candidatePath !== 'string') {
    return {
      path: candidatePath || null,
      valid: false,
      classification: 'INVALID_PATH',
      failedCriteria: ['Candidate path is empty or not a string'],
      warnings: [],
    };
  }

  const resolvedPath = path.resolve(candidatePath);

  if (!fs.existsSync(resolvedPath)) {
    return {
      path: resolvedPath,
      valid: false,
      classification: 'NOT_FOUND',
      failedCriteria: [`Directory does not exist: ${resolvedPath}`],
      warnings: [],
    };
  }

  let stat;
  try {
    stat = fs.statSync(resolvedPath);
  } catch (err) {
    return {
      path: resolvedPath,
      valid: false,
      classification: 'UNREADABLE',
      failedCriteria: [`Cannot stat directory: ${err.message}`],
      warnings: [],
    };
  }

  if (!stat.isDirectory()) {
    return {
      path: resolvedPath,
      valid: false,
      classification: 'NOT_DIRECTORY',
      failedCriteria: [`Path is not a directory: ${resolvedPath}`],
      warnings: [],
    };
  }

  // Reject if identical to or overlapping with clientPath
  if (opts.clientPath) {
    const normClient = normalizePathKey(opts.clientPath);
    const normCand = normalizePathKey(resolvedPath);
    const sep = process.platform === 'win32' ? '\\' : path.sep;
    if (normClient === normCand || normCand.startsWith(normClient + sep) || normClient.startsWith(normCand + sep)) {
      return {
        path: resolvedPath,
        valid: false,
        classification: 'OVERLAPS_CLIENT',
        failedCriteria: ['Candidate path is identical to or overlaps the target client repository'],
        warnings: [],
      };
    }
  }

  // Reject if this is the NGO Core Upgrade agent repository itself
  if (isUpgradeAgentRepo(resolvedPath)) {
    return {
      path: resolvedPath,
      valid: false,
      classification: 'UPGRADE_AGENT_REPO',
      failedCriteria: ['Path is the NGO Core Upgrade agent repository, not the NGO Core source repository'],
      warnings: [],
    };
  }

  // 1. Inspect project structure for Core vs Client markers
  const hasApiCoreDir = fs.existsSync(path.join(resolvedPath, 'ngo-api-core'));
  const hasClientCoreDir = fs.existsSync(path.join(resolvedPath, 'ngo-client-core'));
  const hasClientAppDirs =
    fs.existsSync(path.join(resolvedPath, 'ngo-api')) &&
    fs.existsSync(path.join(resolvedPath, 'ngo-client')) &&
    !hasApiCoreDir &&
    !hasClientCoreDir;

  let rootPkg = null;
  let clientCorePkg = null;
  const rootPkgPath = path.join(resolvedPath, 'package.json');
  const subPkgPath = path.join(resolvedPath, 'ngo-client-core', 'package.json');

  if (fs.existsSync(rootPkgPath)) {
    try { rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8')); } catch (_) {}
  }
  if (fs.existsSync(subPkgPath)) {
    try { clientCorePkg = JSON.parse(fs.readFileSync(subPkgPath, 'utf8')); } catch (_) {}
  }

  // Check for Core .csproj or .sln definitions
  let definesCoreCsproj = false;
  let consumesCorePackageOnly = false;
  const checkDirsForCsproj = [resolvedPath];
  if (hasApiCoreDir) checkDirsForCsproj.push(path.join(resolvedPath, 'ngo-api-core'));
  if (fs.existsSync(path.join(resolvedPath, 'ngo-api'))) checkDirsForCsproj.push(path.join(resolvedPath, 'ngo-api'));

  for (const d of checkDirsForCsproj) {
    try {
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && /\.(csproj|sln|slnx)$/i.test(entry.name)) {
          if (/^NGO\.Core(\..+)?\.(csproj|sln|slnx)$/i.test(entry.name) || /^ngo-api-core\.(sln|slnx)$/i.test(entry.name)) {
            definesCoreCsproj = true;
          } else if (entry.name.endsWith('.csproj')) {
            const content = fs.readFileSync(path.join(d, entry.name), 'utf8');
            if (/PackageReference\s+Include="NGO\.Core(\.[^"]*)?"/i.test(content) && !/<PackageId>NGO\.Core/i.test(content)) {
              consumesCorePackageOnly = true;
            }
          }
        } else if (entry.isDirectory() && /^NGO\.Core(\..+)?$/i.test(entry.name)) {
          const nestedCsproj = path.join(d, entry.name, `${entry.name}.csproj`);
          if (fs.existsSync(nestedCsproj)) definesCoreCsproj = true;
        }
      }
    } catch (_) {}
  }

  const effectiveCorePkg = clientCorePkg || rootPkg;
  const pkgName = effectiveCorePkg && typeof effectiveCorePkg.name === 'string' ? effectiveCorePkg.name : null;
  const isCorePackageJson = Boolean(
    pkgName && (/^(ngo-core|@ngo\/core|ngo-client-core|ngo-online-core)$/i.test(pkgName))
  );

  // Check if root package.json is a client that merely depends on ngo-core / @ngo/core
  const dependsOnCore = Boolean(
    rootPkg &&
    !isCorePackageJson &&
    ((rootPkg.dependencies && (rootPkg.dependencies['ngo-core'] || rootPkg.dependencies['@ngo/core'])) ||
     (rootPkg.devDependencies && (rootPkg.devDependencies['ngo-core'] || rootPkg.devDependencies['@ngo/core'])))
  );

  // 2. Check Git repository metadata (must be a Git repository root with .git directory/file)
  const hasDotGit = fs.existsSync(path.join(resolvedPath, '.git'));
  const gitCheck = hasDotGit ? runGit(resolvedPath, ['rev-parse', '--is-inside-work-tree']) : { ok: false, stdout: '' };
  const isGitRepo = hasDotGit && gitCheck.ok && gitCheck.stdout === 'true';
  if (!isGitRepo) {
    failedCriteria.push('Candidate directory is not a valid Git repository (.git missing or unreadable)');
  }

  let remoteUrl = null;
  let branch = null;
  let headCommit = null;
  let tags = [];
  let releaseBranches = [];
  let remoteMatchesCore = false;
  let remoteLooksLikeClient = false;

  if (isGitRepo) {
    const remoteRes = runGit(resolvedPath, ['config', '--get', 'remote.origin.url']);
    if (remoteRes.ok && remoteRes.stdout) {
      remoteUrl = redactUrlCredentials(remoteRes.stdout);
      if (/ngo-online-core|ngo-core|\/core(\.git)?$/i.test(remoteUrl)) {
        remoteMatchesCore = true;
      } else if (/ngo-online-[a-z0-9-]+/i.test(remoteUrl) && !/core/i.test(remoteUrl)) {
        remoteLooksLikeClient = true;
      }
    }

    const branchRes = runGit(resolvedPath, ['rev-parse', '--abbrev-ref', 'HEAD']);
    if (branchRes.ok) branch = branchRes.stdout === 'HEAD' ? '(detached)' : branchRes.stdout;

    const headRes = runGit(resolvedPath, ['rev-parse', 'HEAD']);
    if (headRes.ok) headCommit = headRes.stdout;

    const tagRes = runGit(resolvedPath, ['tag', '--list']);
    if (tagRes.ok && tagRes.stdout) {
      tags = tagRes.stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    }

    const refRes = runGit(resolvedPath, ['branch', '-a', '--list', '*releases/*', '*release/*']);
    if (refRes.ok && refRes.stdout) {
      releaseBranches = refRes.stdout
        .split(/\r?\n/)
        .map((s) => s.replace(/^\*?\s+/, '').trim())
        .filter(Boolean);
    }
  }

  const dirBaseName = path.basename(resolvedPath).toLowerCase();
  const dirNameMatchesCore = dirBaseName === 'ngo-online-core' || dirBaseName === 'ngo-core';

  // Distinguish Client vs Core
  if (
    hasClientAppDirs ||
    remoteLooksLikeClient ||
    ((dependsOnCore || consumesCorePackageOnly) && !hasApiCoreDir && !hasClientCoreDir && !definesCoreCsproj && !isCorePackageJson)
  ) {
    return {
      path: resolvedPath,
      valid: false,
      classification: 'CLIENT_REPOSITORY',
      failedCriteria: ['Candidate is an NGO client repository (consumes NGO.Core), not the NGO Core source repository'],
      warnings,
      git: isGitRepo ? { remoteUrl, branch, headCommit, tagCount: tags.length, releaseBranchCount: releaseBranches.length } : null,
    };
  }

  const hasCoreStructure = hasApiCoreDir || hasClientCoreDir || definesCoreCsproj || isCorePackageJson;
  if (!hasCoreStructure) {
    failedCriteria.push(
      'Missing expected NGO Core project structure (expected ngo-api-core/, ngo-client-core/, NGO.Core*.csproj, or package.json with name "ngo-core")'
    );
  }

  if (remoteUrl && !remoteMatchesCore && !hasApiCoreDir && !hasClientCoreDir && !isCorePackageJson) {
    failedCriteria.push(`Git remote origin URL (${remoteUrl}) does not match NGO Core repository identity`);
  }

  if (isGitRepo && tags.length === 0 && releaseBranches.length === 0 && !headCommit) {
    failedCriteria.push('Git repository has no commits, tags, or release branches');
  } else if (isGitRepo && tags.length === 0 && releaseBranches.length === 0) {
    warnings.push('No version tags or releases/* branches found locally; package-first mode or git fetch --all --tags may be required');
  }

  // Compute confidence score for ranking candidates
  let score = 0;
  if (hasApiCoreDir && hasClientCoreDir) score += 50;
  else if (hasApiCoreDir || hasClientCoreDir) score += 35;
  if (definesCoreCsproj) score += 25;
  if (isCorePackageJson) score += 25;
  if (remoteMatchesCore) score += 30;
  if (dirNameMatchesCore) score += 15;
  if (tags.length > 0 || releaseBranches.length > 0) score += 10;

  const valid = isGitRepo && hasCoreStructure && failedCriteria.length === 0;

  return {
    path: resolvedPath,
    valid,
    classification: valid ? 'NGO_CORE_REPOSITORY' : 'INVALID_CANDIDATE',
    score,
    structure: {
      hasApiCoreDir,
      hasClientCoreDir,
      definesCoreCsproj,
      isCorePackageJson,
      packageName: pkgName,
      packageVersion: effectiveCorePkg ? effectiveCorePkg.version || null : null,
    },
    git: isGitRepo
      ? {
          remoteUrl,
          remoteMatchesCore,
          branch,
          headCommit,
          tagCount: tags.length,
          sampleTags: tags.slice(-5),
          releaseBranchCount: releaseBranches.length,
          sampleReleaseBranches: releaseBranches.slice(0, 5),
        }
      : null,
    failedCriteria,
    warnings,
  };
}

/**
 * Enumerate common Windows developer workspace roots that actually exist on disk.
 */
function getStandardWindowsRoots() {
  const roots = [];
  const home = os.homedir();
  const candidates = [
    path.join(home, 'source', 'repos'),
    path.join(home, 'repos'),
    path.join(home, 'Projects'),
    path.join(home, 'Documents', 'GitHub'),
    path.join(home, 'Documents', 'Projects'),
    path.join(home, 'dev'),
    path.join(home, 'workspace'),
  ];

  const sysDrive = process.env.SystemDrive || 'C:';
  candidates.push(
    path.join(sysDrive + '\\', 'NGO Client'),
    path.join(sysDrive + '\\', 'Projects'),
    path.join(sysDrive + '\\', 'repos'),
    path.join(sysDrive + '\\', 'source', 'repos')
  );

  for (const c of candidates) {
    try {
      if (fs.existsSync(c) && fs.statSync(c).isDirectory()) {
        roots.push(path.resolve(c));
      }
    } catch (_) {}
  }
  return roots;
}

/**
 * Bounded directory scan for potential NGO Core repositories under a root directory.
 */
function scanRootBounded(rootDir, maxDepth = 2) {
  const foundDirs = [];
  if (!rootDir || !fs.existsSync(rootDir)) return foundDirs;

  const resolvedRoot = path.resolve(rootDir);
  const effectiveMaxDepth = isDriveRoot(resolvedRoot) ? Math.min(1, maxDepth) : Math.min(3, maxDepth);

  function walk(currentDir, depth) {
    // Check if currentDir itself looks like a potential repo
    const base = path.basename(currentDir).toLowerCase();
    const hasGitMarker = fs.existsSync(path.join(currentDir, '.git'));
    if (
      depth === 0 ||
      hasGitMarker ||
      base.includes('core') ||
      fs.existsSync(path.join(currentDir, 'ngo-api-core')) ||
      fs.existsSync(path.join(currentDir, 'ngo-client-core'))
    ) {
      foundDirs.push(currentDir);
    }

    // Do not walk inside subdirectories of an existing Git repository
    if (hasGitMarker && depth > 0) return;
    if (depth >= effectiveMaxDepth) return;

    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (_) {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (EXCLUDED_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      walk(path.join(currentDir, entry.name), depth + 1);
    }
  }

  walk(resolvedRoot, 0);
  return foundDirs;
}

function computeDiscoveryCacheKey(opts = {}) {
  const payload = {
    explicitPath: opts.corePath || null,
    envCorePath: opts.envCorePath !== undefined ? opts.envCorePath : (process.env.NGO_CORE_PATH || null),
    settingsCorePath: opts.settingsCorePath || null,
    clientPath: opts.clientPath || null,
    approvedWorkspaceRoots: opts.approvedWorkspaceRoots || [],
    additionalSearchRoots: opts.additionalSearchRoots || [],
  };
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function getCachedDiscovery(cacheKey) {
  let entry = memoryCache.get(cacheKey);
  if (!entry) {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const disk = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        if (disk && disk[cacheKey]) entry = disk[cacheKey];
      }
    } catch (_) {}
  }
  if (!entry || !entry.selected || !entry.selected.path) return null;

  // Validate cached path is still valid and unchanged
  const p = entry.selected.path;
  if (!fs.existsSync(p) || !fs.existsSync(path.join(p, '.git'))) {
    invalidateDiscoveryCache(cacheKey);
    return null;
  }
  const currentHead = runGit(p, ['rev-parse', 'HEAD']);
  if (!currentHead.ok) {
    invalidateDiscoveryCache(cacheKey);
    return null;
  }
  return Object.assign({}, entry, { fromCache: true });
}

function saveDiscoveryCache(cacheKey, result) {
  memoryCache.set(cacheKey, result);
  try {
    let disk = {};
    if (fs.existsSync(CACHE_FILE)) {
      try { disk = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) || {}; } catch (_) { disk = {}; }
    }
    disk[cacheKey] = result;
    fs.writeFileSync(CACHE_FILE, JSON.stringify(disk, null, 2));
  } catch (_) {}
}

function invalidateDiscoveryCache(cacheKey = null) {
  if (cacheKey) {
    memoryCache.delete(cacheKey);
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const disk = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) || {};
        delete disk[cacheKey];
        fs.writeFileSync(CACHE_FILE, JSON.stringify(disk, null, 2));
      }
    } catch (_) {}
  } else {
    memoryCache.clear();
    try {
      if (fs.existsSync(CACHE_FILE)) fs.unlinkSync(CACHE_FILE);
    } catch (_) {}
  }
}

/**
 * Discover and validate the local NGO Core repository across configured and workspace locations.
 */
function discoverCoreRepository(opts = {}) {
  const checkedLocations = [];
  const rejectedCandidates = [];

  // 1. If an explicit corePath was passed by the caller/CLI, validate it strictly
  if (opts.corePath && typeof opts.corePath === 'string' && opts.corePath.trim()) {
    const explicitResolved = path.resolve(opts.corePath.trim());
    checkedLocations.push({ path: explicitResolved, source: 'explicit-argument' });
    const validation = validateCoreCandidate(explicitResolved, opts);
    if (validation.valid) {
      return {
        ok: true,
        status: 'RESOLVED_EXPLICIT',
        selected: Object.assign({}, validation, { discoverySource: 'explicit-argument' }),
        candidates: [validation],
        checkedLocations,
        rejectedCandidates,
        requiresSelection: false,
        remediation: null,
      };
    }

    rejectedCandidates.push(validation);
    // If allowFallbackOnExplicitInvalid is not enabled, report the explicit failure clearly
    if (!opts.allowFallbackOnExplicitInvalid) {
      return {
        ok: false,
        status: 'INVALID_EXPLICIT_PATH',
        selected: null,
        candidates: [],
        checkedLocations,
        rejectedCandidates,
        requiresSelection: false,
        remediation: `The specified Core path "${explicitResolved}" failed validation: ${validation.failedCriteria.join('; ')}. Supply a valid local ngo-online-core checkout via --core-path <path> or set NGO_CORE_PATH.`,
      };
    }
  }

  const cacheKey = computeDiscoveryCacheKey(opts);
  if (!opts.bypassCache) {
    const cached = getCachedDiscovery(cacheKey);
    if (cached) return cached;
  }

  // Build tiered search locations
  const tiers = [];

  // Tier 1: Environment variable NGO_CORE_PATH
  const envCore = opts.envCorePath !== undefined ? opts.envCorePath : process.env.NGO_CORE_PATH;
  if (envCore && typeof envCore === 'string' && envCore.trim()) {
    tiers.push({
      name: 'env:NGO_CORE_PATH',
      paths: [path.resolve(envCore.trim())],
      scanChildren: false,
    });
  }

  // Tier 2: Persisted settings corePath
  if (opts.settingsCorePath && typeof opts.settingsCorePath === 'string' && opts.settingsCorePath.trim()) {
    tiers.push({
      name: 'settings:corePath',
      paths: [path.resolve(opts.settingsCorePath.trim())],
      scanChildren: false,
    });
  }

  // Tier 3: Direct sibling of clientPath or REPO_ROOT named ngo-online-core / ngo-core
  const siblingCandidates = [];
  if (opts.clientPath && fs.existsSync(opts.clientPath)) {
    const clientParent = path.dirname(path.resolve(opts.clientPath));
    siblingCandidates.push(path.join(clientParent, 'ngo-online-core'));
    siblingCandidates.push(path.join(clientParent, 'ngo-core'));
  }
  if (opts.includeRepoSiblings !== false) {
    const repoParent = path.resolve(REPO_ROOT, '..');
    siblingCandidates.push(path.join(repoParent, 'ngo-online-core'));
    siblingCandidates.push(path.join(repoParent, 'ngo-core'));
  }
  if (siblingCandidates.length > 0) {
    tiers.push({
      name: 'workspace-sibling',
      paths: Array.from(new Set(siblingCandidates)),
      scanChildren: false,
    });
  }

  // Tier 4: Approved workspace roots & additional search roots (bounded traversal)
  const workspaceRoots = [
    ...(Array.isArray(opts.approvedWorkspaceRoots) ? opts.approvedWorkspaceRoots : []),
    ...(Array.isArray(opts.additionalSearchRoots) ? opts.additionalSearchRoots : []),
  ].filter((r) => typeof r === 'string' && r.trim());
  if (workspaceRoots.length > 0) {
    tiers.push({
      name: 'approved-workspace-roots',
      paths: Array.from(new Set(workspaceRoots.map((r) => path.resolve(r)))),
      scanChildren: true,
    });
  }

  // Tier 5: Standard Windows developer layouts (opt-in or default when not disabled)
  if (opts.includeStandardWindowsLayouts !== false) {
    const stdRoots = getStandardWindowsRoots();
    if (stdRoots.length > 0) {
      tiers.push({
        name: 'standard-developer-roots',
        paths: stdRoots,
        scanChildren: true,
      });
    }
  }

  const seenNormalized = new Set(checkedLocations.map((l) => normalizePathKey(l.path)));
  const maxDepth = opts.maxDepth != null ? opts.maxDepth : 2;

  for (const tier of tiers) {
    const validInTier = [];

    for (const rootPath of tier.paths) {
      const candidateDirs = tier.scanChildren ? scanRootBounded(rootPath, maxDepth) : [rootPath];
      for (const dir of candidateDirs) {
        const key = normalizePathKey(dir);
        if (seenNormalized.has(key)) continue;
        seenNormalized.add(key);

        checkedLocations.push({ path: dir, source: tier.name });
        if (!fs.existsSync(dir)) continue;

        const validation = validateCoreCandidate(dir, opts);
        if (validation.valid) {
          validInTier.push(Object.assign({}, validation, { discoverySource: tier.name }));
        } else if (
          validation.classification === 'CLIENT_REPOSITORY' ||
          validation.classification === 'INVALID_CANDIDATE'
        ) {
          // Record non-trivial rejections where the folder existed
          if (
            !tier.scanChildren ||
            /core/i.test(path.basename(dir)) ||
            validation.classification === 'CLIENT_REPOSITORY'
          ) {
            rejectedCandidates.push(validation);
          }
        }
      }
    }

    if (validInTier.length === 1) {
      const result = {
        ok: true,
        status: 'DISCOVERED',
        selected: validInTier[0],
        candidates: validInTier,
        checkedLocations,
        rejectedCandidates,
        requiresSelection: false,
        remediation: null,
      };
      saveDiscoveryCache(cacheKey, result);
      return result;
    }

    if (validInTier.length > 1) {
      validInTier.sort((a, b) => b.score - a.score);
      return {
        ok: false,
        status: 'MULTIPLE_CANDIDATES_FOUND',
        selected: null,
        candidates: validInTier,
        checkedLocations,
        rejectedCandidates,
        requiresSelection: true,
        remediation: `Multiple valid NGO Core repositories were found (${validInTier.map((c) => c.path).join(', ')}). Specify the desired repository explicitly via --core-path "<path>" or NGO_CORE_PATH.`,
      };
    }
  }

  const checkedList = checkedLocations.slice(0, 10).map((c) => `${c.path} (${c.source})`).join(', ');
  const rejectedList = rejectedCandidates.length
    ? ` Rejected candidates: ${rejectedCandidates.map((r) => `${r.path} [${r.failedCriteria.join('; ')}]`).join('; ')}.`
    : '';

  return {
    ok: false,
    status: 'NOT_FOUND',
    selected: null,
    candidates: [],
    checkedLocations,
    rejectedCandidates,
    requiresSelection: false,
    remediation: `No valid local NGO Core repository was found. Checked locations: ${checkedList || 'none'}.${rejectedList} Clone ngo-online-core locally and pass --core-path "<path>", set NGO_CORE_PATH, or update corePath in platform/config/settings.json.`,
  };
}

module.exports = {
  discoverCoreRepository,
  validateCoreCandidate,
  invalidateDiscoveryCache,
  getStandardWindowsRoots,
  redactUrlCredentials,
};

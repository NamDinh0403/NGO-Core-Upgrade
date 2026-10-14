'use strict';
/*
 * Deterministic Project Inspector and Evidence-Based Core Release Preflight.
 *
 * Scans client projects, extracts installed Core versions, verifies package availability,
 * performs source resolution, checks Git working tree safety, calculates documented
 * evidence completeness, and generates traceable upgrade plans.
 *
 * Dependency-free, Node 14+.
 */

const fs = require('fs');
const path = require('path');
const resolver = require('../ingest/tools/lib/release-resolver');
const git = require('../ingest/tools/lib/git');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_CLIENTS_DIR = path.resolve(REPO_ROOT, '..');
const DEFAULT_CORE_DIR = path.join(DEFAULT_CLIENTS_DIR, 'ngo-online-core');

const UPGRADE_TARGET_FILE_PATTERN = /(\.csproj|\.sln|package\.json|package-lock\.json|appsettings.*\.json|packages\.config|Directory\.Build\.props)$/i;

/**
 * Scan a directory for candidate NGO Client repositories.
 */
function discoverProjects(searchDir) {
  const dir = searchDir || DEFAULT_CLIENTS_DIR;
  const projects = [];

  if (!fs.existsSync(dir)) return projects;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'NGO Core Upgrade' || entry.name.endsWith('.worktrees')) continue;

      const fullPath = path.join(dir, entry.name);
      const isClient =
        entry.name.startsWith('ngo-online-') ||
        fs.existsSync(path.join(fullPath, 'ngo-api')) ||
        fs.existsSync(path.join(fullPath, 'ngo-client')) ||
        fs.existsSync(path.join(fullPath, 'package.json'));

      if (isClient) {
        const detected = detectCurrentVersion(fullPath);
        projects.push({
          id: entry.name,
          name: entry.name.replace(/^ngo-online-/, '').replace(/-/g, ' ').toUpperCase(),
          path: fullPath,
          hasBackend: fs.existsSync(path.join(fullPath, 'ngo-api')) || detected.backendPath !== null,
          hasFrontend: fs.existsSync(path.join(fullPath, 'ngo-client')) || detected.frontendPath !== null,
          currentVersion: detected.version || 'Unknown',
          backendVersion: detected.backendVersion,
          frontendVersion: detected.frontendVersion,
          hasVersionMismatch: detected.hasVersionMismatch,
        });
      }
    }
  } catch (_) {}

  return projects;
}

/**
 * Detect current installed NGO Core version from a client project.
 */
function detectCurrentVersion(clientPath) {
  let backendVersion = null;
  let frontendVersion = null;
  let backendPath = null;
  let frontendPath = null;

  // 1. Inspect Backend (.csproj or packages.config)
  const apiDir = path.join(clientPath, 'ngo-api');
  const searchApi = fs.existsSync(apiDir) ? apiDir : clientPath;
  try {
    const findCsproj = (dir) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const full = path.join(dir, file.name);
        if (file.isDirectory() && !['bin', 'obj', '.vs', 'node_modules'].includes(file.name)) {
          findCsproj(full);
        } else if (file.name.endsWith('.csproj')) {
          backendPath = full;
          const content = fs.readFileSync(full, 'utf8');
          const m = content.match(/<PackageReference\s+Include=["']NGO\.Core(?:\.[^"']+)?["']\s+Version=["']([^"']+)["']/i) ||
                    content.match(/<PackageReference\s+Version=["']([^"']+)["']\s+Include=["']NGO\.Core/i);
          if (m && !backendVersion) backendVersion = m[1];
        }
      }
    };
    findCsproj(searchApi);
  } catch (_) {}

  // 2. Inspect Frontend (package.json)
  const clientDir = path.join(clientPath, 'ngo-client');
  const searchClient = fs.existsSync(clientDir) ? clientDir : clientPath;
  const pkgPath = path.join(searchClient, 'package.json');
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

  const primaryVersion = backendVersion || frontendVersion || null;
  const hasVersionMismatch = Boolean(backendVersion && frontendVersion && backendVersion !== frontendVersion);

  return {
    version: primaryVersion,
    backendVersion,
    frontendVersion,
    backendPath,
    frontendPath,
    hasVersionMismatch,
  };
}

/**
 * Get available Core release versions from tags, manifests, NuGet cache, and candidates.
 */
function getAvailableVersions(corePath) {
  const versions = new Set();
  const cPath = corePath || (fs.existsSync(DEFAULT_CORE_DIR) ? DEFAULT_CORE_DIR : null);

  // 1. Read from Ingest version manifest if present
  const manifestPath = path.join(REPO_ROOT, 'ingest', 'knowledge', 'candidates', 'version-manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      for (const rel of manifest.releases || []) {
        if (rel.version) versions.add(rel.version);
      }
    } catch (_) {}
  }

  // 2. Read from candidates releases directory
  const candidatesDir = path.join(REPO_ROOT, 'ingest', 'knowledge', 'candidates', 'releases');
  if (fs.existsSync(candidatesDir)) {
    try {
      for (const f of fs.readdirSync(candidatesDir)) {
        if (f.endsWith('.json')) versions.add(f.replace(/\.json$/, ''));
      }
    } catch (_) {}
  }

  // 3. Read from Core Git repository branches using authoritative discovery rule
  if (cPath && git.isGitRepo(cPath)) {
    try {
      const branchRes = resolver.discoverCoreBranchReleases(cPath);
      if (branchRes.ok && Array.isArray(branchRes.versions)) {
        for (const v of branchRes.versions) {
          versions.add(v);
        }
      }
    } catch (_) {}

    const tagRes = git.listTags(cPath);
    if (tagRes.ok && Array.isArray(tagRes.tags)) {
      for (const t of tagRes.tags) {
        const norm = resolver.normalizeVersion(t.replace(/^v/, ''));
        if (norm) versions.add(norm);
      }
    }
  }

  // 4. Read from local NuGet cache if available
  const homeDir = process.env.USERPROFILE || process.env.HOME || '';
  if (homeDir) {
    for (const name of ['ngo.core.api', 'ngo.core']) {
      const nugetPkgDir = path.join(homeDir, '.nuget', 'packages', name);
      if (fs.existsSync(nugetPkgDir)) {
        try {
          for (const v of fs.readdirSync(nugetPkgDir)) {
            const norm = resolver.normalizeVersion(v);
            if (norm) versions.add(norm);
          }
        } catch (_) {}
      }
    }
  }

  // Return sorted versions descending
  return Array.from(versions).sort((a, b) => resolver.cmpVer(b, a));
}

/**
 * Parse porcelain status to identify modified, untracked, and conflict-risk files.
 */
function parseGitWorkingTreeStatus(clientPath) {
  if (!git.isGitRepo(clientPath)) {
    return {
      isGitRepo: false,
      isClean: false,
      status: 'NOT_A_GIT_REPO',
      modifiedFiles: [],
      untrackedFiles: [],
      conflictingFiles: [],
      conflictRisk: 'UNKNOWN',
      summary: 'Directory is not a Git repository.',
    };
  }

  const porcelain = git.statusPorcelain(clientPath);
  if (porcelain === null) {
    return {
      isGitRepo: true,
      isClean: false,
      status: 'CHECK_FAILED',
      modifiedFiles: [],
      untrackedFiles: [],
      conflictingFiles: [],
      conflictRisk: 'HIGH',
      summary: 'git status command failed.',
    };
  }

  const lines = porcelain.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    return {
      isGitRepo: true,
      isClean: true,
      status: 'CLEAN',
      modifiedFiles: [],
      untrackedFiles: [],
      conflictingFiles: [],
      conflictRisk: 'NONE',
      summary: 'Working tree is clean.',
    };
  }

  const modifiedFiles = [];
  const untrackedFiles = [];
  const conflictingFiles = [];

  for (const line of lines) {
    const code = line.slice(0, 2);
    const filePath = line.slice(3).trim();

    if (code === '??') {
      untrackedFiles.push(filePath);
    } else {
      modifiedFiles.push(filePath);
      if (UPGRADE_TARGET_FILE_PATTERN.test(filePath)) {
        conflictingFiles.push(filePath);
      }
    }
  }

  let conflictRisk = 'NONE';
  if (conflictingFiles.length > 0) {
    conflictRisk = 'HIGH';
  } else if (modifiedFiles.length > 0) {
    conflictRisk = 'MEDIUM';
  } else if (untrackedFiles.length > 0) {
    conflictRisk = 'LOW';
  }

  return {
    isGitRepo: true,
    isClean: modifiedFiles.length === 0 && untrackedFiles.length === 0,
    status: modifiedFiles.length > 0 ? 'DIRTY_MODIFIED' : (untrackedFiles.length > 0 ? 'DIRTY_UNTRACKED' : 'CLEAN'),
    modifiedFiles,
    untrackedFiles,
    conflictingFiles,
    conflictRisk,
    summary: `${modifiedFiles.length} modified, ${untrackedFiles.length} untracked files (${conflictRisk} conflict risk).`,
  };
}

/**
 * Calculate evidence completeness against documented evidence items.
 *
 * Required Evidence (Weight 2 each):
 *   1. Package Binary Available (NuGet / npm)
 *   2. Source Revision Resolved (Tag / Branch / Commit)
 *   3. Client Working Tree Safe (Clean of uncommitted target changes)
 *
 * Optional Evidence (Weight 1 each):
 *   4. Source Diff Available
 *   5. Release Notes / Change Cards Available
 *   6. Approved Ref Mapping Available
 */
function calculateEvidenceCompleteness(resolution, workingTree) {
  const ev = resolution.evidence || {};
  const items = [
    {
      id: 'PACKAGE_BINARY',
      name: 'Package Binary Availability',
      required: true,
      weight: 2,
      satisfied: ev.packageAvailable === true,
      source: resolution.sources?.package?.source || 'none',
    },
    {
      id: 'SOURCE_REVISION',
      name: 'Source Revision Reachability',
      required: true,
      weight: 2,
      satisfied: ev.sourceRevisionAvailable === true,
      source: resolution.sources?.source?.revisionType || 'none',
    },
    {
      id: 'WORKING_TREE_SAFETY',
      name: 'Client Working Tree Cleanliness',
      required: true,
      weight: 2,
      satisfied: workingTree.isClean === true || workingTree.conflictRisk === 'NONE',
      source: 'client-git-status',
    },
    {
      id: 'SOURCE_DIFF',
      name: 'Source Commit Diff',
      required: false,
      weight: 1,
      satisfied: ev.sourceDiffAvailable === true,
      source: 'core-git-diff',
    },
    {
      id: 'RELEASE_NOTES',
      name: 'Official Release Notes / Migration Cards',
      required: false,
      weight: 1,
      satisfied: ev.releaseNotesAvailable === true,
      source: 'release-notes-markdown',
    },
    {
      id: 'APPROVED_MAPPING',
      name: 'Approved Release Ref Mapping',
      required: false,
      weight: 1,
      satisfied: Boolean(resolution.sources?.source?.approvedMapping),
      source: 'approved-release-ref-mappings',
    },
  ];

  let totalWeight = 0;
  let earnedWeight = 0;
  const missingRequired = [];
  const missingOptional = [];

  for (const item of items) {
    totalWeight += item.weight;
    if (item.satisfied) {
      earnedWeight += item.weight;
    } else {
      if (item.required) {
        missingRequired.push(item.name);
      } else {
        missingOptional.push(item.name);
      }
    }
  }

  const percentage = Math.round((earnedWeight / totalWeight) * 100);

  return {
    numerator: earnedWeight,
    denominator: totalWeight,
    percentage,
    isComplete: missingRequired.length === 0 && missingOptional.length === 0,
    hasAllRequired: missingRequired.length === 0,
    missingRequired,
    missingOptional,
    items,
    summary: `${earnedWeight}/${totalWeight} (${percentage}%)`,
  };
}

/**
 * Generate traceable upgrade plan items derived from inspected client files.
 */
function generateTraceablePlan(detected, targetVersion, resolution, selectedTracks) {
  const tasks = [];

  // 1. Backend Track Task
  if (selectedTracks.includes('backend') && detected.backendPath) {
    tasks.push({
      id: 'task-backend-nuget',
      title: `Update NGO.Core NuGet package in ${path.basename(detected.backendPath)}`,
      track: 'backend',
      type: 'NUGET_DEPENDENCY',
      file: detected.backendPath,
      currentValue: detected.backendVersion || 'Unknown',
      targetValue: targetVersion,
      source: resolution.sources?.package?.identity || `NuGet Core v${targetVersion}`,
      reason: `Align backend Core package dependency from v${detected.backendVersion || '?'} to target v${targetVersion}`,
      verification: 'Run dotnet build and verify assembly reference version',
      isDerivedFromEvidence: true,
    });
  }

  // 2. Frontend Track Task
  if (selectedTracks.includes('frontend') && detected.frontendPath) {
    tasks.push({
      id: 'task-frontend-npm',
      title: `Update @ngo/core npm package in ${path.basename(detected.frontendPath)}`,
      track: 'frontend',
      type: 'NPM_DEPENDENCY',
      file: detected.frontendPath,
      currentValue: detected.frontendVersion || 'Unknown',
      targetValue: targetVersion,
      source: `@ngo/core@${targetVersion}`,
      reason: `Align Angular Core dependency in package.json from v${detected.frontendVersion || '?'} to target v${targetVersion}`,
      verification: 'Run npm build and verify Angular template typechecking',
      isDerivedFromEvidence: true,
    });
  }

  // 3. Deterministic Verification Task
  tasks.push({
    id: 'task-verification',
    title: `Run deterministic verification suite for v${targetVersion}`,
    track: 'both',
    type: 'VERIFICATION',
    file: detected.backendPath || detected.frontendPath || 'solution-root',
    currentValue: 'unverified',
    targetValue: 'verified',
    source: 'Platform Deterministic Verifier',
    reason: `Assert all package references, builds, and public API surfaces match target v${targetVersion}`,
    verification: 'Execute verifier.verify({ tracks }) and assert all checks pass',
    isDerivedFromEvidence: true,
  });

  return tasks;
}

/**
 * Execute rigorous, evidence-based preflight checks for a client and target version.
 */
function runPreflight(options) {
  options = options || {};
  const startTime = Date.now();
  const { clientPath, targetVersion, corePath, tracks } = options;
  const cPath = corePath || (fs.existsSync(DEFAULT_CORE_DIR) ? DEFAULT_CORE_DIR : null);

  const checks = [];
  const blockers = [];
  const warnings = [];

  // Helper to add structured check
  const addCheck = (chk) => {
    checks.push(chk);
    if (chk.status === 'BLOCKED' || chk.status === 'FAIL') {
      blockers.push(chk.failureReason || `${chk.name} failed`);
    } else if (chk.status === 'WARNING') {
      warnings.push(chk.failureReason || `${chk.name} warning`);
    }
  };

  // -------------------------------------------------------------------------
  // CHECK 1: Target Version Semver Format
  // -------------------------------------------------------------------------
  const normTarget = resolver.normalizeVersion(targetVersion);
  if (!normTarget) {
    addCheck({
      id: 'CHK-SEMVER-FORMAT',
      name: 'Target Version Semver Validation',
      status: 'BLOCKED',
      severity: 'CRITICAL',
      durationMs: 1,
      sourceOrCommand: `normalizeVersion('${targetVersion}')`,
      sanitizedOutput: `Invalid semver: '${targetVersion}'`,
      evidenceReferences: targetVersion,
      failureReason: `Invalid target version format '${targetVersion}'. Must be semver x.y or x.y.z.`,
      remediation: 'Provide a valid semantic version number (e.g. 9.4.0).',
      fromCache: false,
      freshness: new Date().toISOString(),
    });

    return {
      ok: false,
      canProceed: false,
      readyToUpgrade: false,
      status: 'BLOCKED',
      safetyDecision: 'BLOCKED_INVALID_TARGET',
      decisionReason: `Blocked: Target version '${targetVersion}' is not a valid semantic version.`,
      clientPath,
      currentVersion: null,
      targetVersion,
      tracks: tracks || ['backend', 'frontend'],
      checks,
      blockers,
      warnings,
      tasks: [],
      completeness: { numerator: 0, denominator: 9, percentage: 0, summary: '0/9 (0%)' },
      evidence: { packageFound: false, packageAvailable: false, completenessPercent: 0 },
      isClean: false,
      workingTreeClean: false,
      resolutionMode: 'INVALID_VERSION',
      impactPreview: { mode: 'INVALID_VERSION', packageAvailable: false, sourceDiffAvailable: false },
    };
  }

  // -------------------------------------------------------------------------
  // CHECK 2: Client Project Detection & Version Trajectory
  // -------------------------------------------------------------------------
  const detected = detectCurrentVersion(clientPath);
  const currentVersion = detected.version;

  if (!currentVersion) {
    addCheck({
      id: 'CHK-CURRENT-VERSION',
      name: 'Current Installed Core Version Detection',
      status: 'WARNING',
      severity: 'WARNING',
      durationMs: 5,
      sourceOrCommand: `inspect ${clientPath}`,
      sanitizedOutput: 'No Core PackageReference or package.json dependency found',
      evidenceReferences: clientPath,
      failureReason: 'Could not detect currently installed Core version from client repository files.',
      remediation: 'Ensure client repository contains .csproj or package.json referencing NGO Core.',
      fromCache: false,
      freshness: new Date().toISOString(),
    });
  } else {
    const cmp = resolver.cmpVer(normTarget, currentVersion);
    if (cmp === 0) {
      addCheck({
        id: 'CHK-VERSION-TRAJECTORY',
        name: 'Upgrade Trajectory Validation',
        status: 'BLOCKED',
        severity: 'CRITICAL',
        durationMs: 1,
        sourceOrCommand: `cmpVer('${normTarget}', '${currentVersion}')`,
        sanitizedOutput: `Current (${currentVersion}) == Target (${normTarget})`,
        evidenceReferences: `${currentVersion} -> ${normTarget}`,
        failureReason: `Client is already at target Core version ${normTarget}. No upgrade is needed.`,
        remediation: 'Select a newer target Core version to perform an upgrade.',
        fromCache: false,
        freshness: new Date().toISOString(),
      });
    } else if (cmp < 0) {
      addCheck({
        id: 'CHK-VERSION-TRAJECTORY',
        name: 'Upgrade Trajectory Validation',
        status: 'BLOCKED',
        severity: 'CRITICAL',
        durationMs: 1,
        sourceOrCommand: `cmpVer('${normTarget}', '${currentVersion}')`,
        sanitizedOutput: `Target (${normTarget}) < Current (${currentVersion})`,
        evidenceReferences: `${currentVersion} -> ${normTarget}`,
        failureReason: `Target version ${normTarget} is older than current version ${currentVersion}. Downgrading is disallowed by policy.`,
        remediation: 'Select a target version newer than the currently installed version.',
        fromCache: false,
        freshness: new Date().toISOString(),
      });
    } else {
      addCheck({
        id: 'CHK-VERSION-TRAJECTORY',
        name: 'Upgrade Trajectory Validation',
        status: 'PASS',
        severity: 'INFO',
        durationMs: 1,
        sourceOrCommand: `cmpVer('${normTarget}', '${currentVersion}')`,
        sanitizedOutput: `Valid upgrade trajectory: v${currentVersion} -> v${normTarget}`,
        evidenceReferences: `${currentVersion} -> ${normTarget}`,
        failureReason: null,
        remediation: null,
        fromCache: false,
        freshness: new Date().toISOString(),
      });
    }

    if (detected.hasVersionMismatch) {
      warnings.push(`Client has mismatched installed Core versions (Backend: ${detected.backendVersion}, Frontend: ${detected.frontendVersion}). Upgrade will align both tracks.`);
    }
  }

  // -------------------------------------------------------------------------
  // CHECK 3: Release Resolution & Package Evidence
  // -------------------------------------------------------------------------
  const resolutionStart = Date.now();
  const resolution = resolver.resolveRelease(normTarget, {
    corePath: cPath,
    since: currentVersion,
    feedCheck: options.feedCheck,
    authError: options.authError,
    forbiddenError: options.forbiddenError,
    registryError: options.registryError,
    packageAvailable: options.packageAvailable,
  });
  const resolutionDuration = Date.now() - resolutionStart;

  if (!resolution.ok) {
    addCheck({
      id: 'CHK-RELEASE-RESOLUTION',
      name: 'Release Resolution Status',
      status: 'BLOCKED',
      severity: 'CRITICAL',
      durationMs: resolutionDuration,
      sourceOrCommand: `resolver.resolveRelease('${normTarget}')`,
      sanitizedOutput: resolution.error || 'Resolution failed',
      evidenceReferences: normTarget,
      failureReason: resolution.error || 'Release resolution failed',
      remediation: resolution.nextAction || 'Ensure release packages or tags are published.',
      fromCache: false,
      freshness: new Date().toISOString(),
    });
  } else {
    // Package availability check
    const pkg = resolution.sources?.package || {};
    if (pkg.available) {
      addCheck({
        id: 'CHK-PACKAGE-AVAILABILITY',
        name: 'Target Package Publication Verification',
        status: 'PASS',
        severity: 'INFO',
        durationMs: resolutionDuration,
        sourceOrCommand: `discoverPackageEvidence('${normTarget}') -> ${pkg.source}`,
        sanitizedOutput: `Package confirmed available: ${pkg.identity || normTarget}`,
        evidenceReferences: pkg.identity || pkg.artifact || normTarget,
        failureReason: null,
        remediation: null,
        fromCache: false,
        freshness: new Date().toISOString(),
      });
    } else {
      const isAuthError = pkg.failureType === 'AUTH_REQUIRED' || pkg.status === 'AUTH_FAILED';
      const isForbidden = pkg.failureType === 'FORBIDDEN' || pkg.status === 'FORBIDDEN';
      const isNetworkError = pkg.failureType === 'NETWORK_OR_TIMEOUT' || pkg.status === 'CHECK_FAILED';

      let failureReason = `Target package ${normTarget} is not published or available in NuGet/npm caches, local artifacts, or manifests.`;
      let remediation = `Publish the package binary for ${normTarget} or supply local package artifacts before upgrading.`;

      if (isAuthError) {
        failureReason = `Package feed authentication required: ${pkg.reason || 'Failed to authenticate to private NuGet feed'}. Package availability could not be verified due to credential failure.`;
        remediation = pkg.remediation || 'Authenticate to the private feed using Azure Artifacts Credential Provider, or provide AZURE_DEVOPS_EXT_PAT.';
      } else if (isForbidden) {
        failureReason = `Package feed access forbidden (HTTP 403): ${pkg.reason || 'Insufficient permissions'}. Access denied to package feed.`;
        remediation = pkg.remediation || 'Verify your account has Reader or Contributor permissions on the feed.';
      } else if (isNetworkError) {
        failureReason = `Package registry check failed: ${pkg.reason || 'Network timeout or unreachable endpoint'}.`;
        remediation = 'Verify internet connection, proxy settings, and package registry availability.';
      }

      addCheck({
        id: 'CHK-PACKAGE-AVAILABILITY',
        name: 'Target Package Publication Verification',
        status: 'BLOCKED',
        severity: 'CRITICAL',
        durationMs: resolutionDuration,
        sourceOrCommand: `discoverPackageEvidence('${normTarget}')`,
        sanitizedOutput: pkg.reason || 'Package binary not found in NuGet cache, npm, or artifacts',
        evidenceReferences: normTarget,
        failureReason,
        remediation,
        fromCache: false,
        freshness: new Date().toISOString(),
      });
    }

    // Source revision check
    const src = resolution.sources?.source || {};
    if (src.sourceRevisionAvailable) {
      addCheck({
        id: 'CHK-SOURCE-REVISION',
        name: 'Core Source Revision Reachability',
        status: 'PASS',
        severity: 'INFO',
        durationMs: 5,
        sourceOrCommand: `git resolveRef(${src.revisionType})`,
        sanitizedOutput: `Source revision resolved via ${src.revisionType}: ${src.targetCommit ? src.targetCommit.slice(0, 10) : 'resolved'}`,
        evidenceReferences: src.targetCommit,
        failureReason: null,
        remediation: null,
        fromCache: false,
        freshness: new Date().toISOString(),
      });
    } else {
      addCheck({
        id: 'CHK-SOURCE-REVISION',
        name: 'Core Source Revision Reachability',
        status: pkg.available ? 'WARNING' : 'BLOCKED',
        severity: pkg.available ? 'WARNING' : 'CRITICAL',
        durationMs: 5,
        sourceOrCommand: 'discoverSourceEvidence',
        sanitizedOutput: 'No matching Git tag or branch found in Core checkout',
        evidenceReferences: normTarget,
        failureReason: `Core repository has no matching tag or branch for ${normTarget}.`,
        remediation: pkg.available
          ? 'Package artifact is available; proceeding with package-first upgrade without source tag.'
          : 'Create release tag or push release branch before upgrading.',
        fromCache: false,
        freshness: new Date().toISOString(),
      });
    }

    // Source diff check
    if (resolution.evidence?.sourceDiffAvailable) {
      addCheck({
        id: 'CHK-SOURCE-DIFF',
        name: 'Source Commit Diff Availability',
        status: 'PASS',
        severity: 'INFO',
        durationMs: 10,
        sourceOrCommand: `git diff ${resolution.fromCommit?.slice(0, 8)}..${resolution.targetCommit?.slice(0, 8)}`,
        sanitizedOutput: 'Source diff computed successfully',
        evidenceReferences: `${resolution.fromCommit?.slice(0, 8)}..${resolution.targetCommit?.slice(0, 8)}`,
        failureReason: null,
        remediation: null,
        fromCache: false,
        freshness: new Date().toISOString(),
      });
    } else {
      addCheck({
        id: 'CHK-SOURCE-DIFF',
        name: 'Source Commit Diff Availability',
        status: 'WARNING',
        severity: 'WARNING',
        durationMs: 5,
        sourceOrCommand: 'git diff',
        sanitizedOutput: 'Source diff unavailable',
        evidenceReferences: normTarget,
        failureReason: `Source diff between ${currentVersion || 'baseline'} and ${normTarget} is unavailable.`,
        remediation: 'Proceeding under reduced-evidence package inspection. In-depth source diff will be skipped.',
        fromCache: false,
        freshness: new Date().toISOString(),
      });
    }
  }

  // -------------------------------------------------------------------------
  // CHECK 4: Client Working Tree Safety
  // -------------------------------------------------------------------------
  const workingTree = parseGitWorkingTreeStatus(clientPath);
  if (!workingTree.isGitRepo) {
    addCheck({
      id: 'CHK-GIT-SAFETY',
      name: 'Client Git Repository Check',
      status: 'WARNING',
      severity: 'WARNING',
      durationMs: 5,
      sourceOrCommand: `git rev-parse --is-inside-work-tree (${clientPath})`,
      sanitizedOutput: 'Client directory is not a Git repository',
      evidenceReferences: clientPath,
      failureReason: 'Client repository is not tracked by Git. Automated rollback will not be available.',
      remediation: 'Initialize Git in the client repository before running automated upgrades.',
      fromCache: false,
      freshness: new Date().toISOString(),
    });
  } else if (workingTree.conflictRisk === 'HIGH') {
    addCheck({
      id: 'CHK-GIT-SAFETY',
      name: 'Client Working Tree Conflict Safety',
      status: 'BLOCKED',
      severity: 'CRITICAL',
      durationMs: 10,
      sourceOrCommand: `git status --porcelain (${clientPath})`,
      sanitizedOutput: `Uncommitted modifications in upgrade targets: ${workingTree.conflictingFiles.join(', ')}`,
      evidenceReferences: workingTree.conflictingFiles.join(', '),
      failureReason: `Client repository has uncommitted modifications in upgrade target files (${workingTree.conflictingFiles.join(', ')}).`,
      remediation: 'Commit, stash, or revert changes to these files before starting the upgrade to avoid data loss.',
      fromCache: false,
      freshness: new Date().toISOString(),
    });
  } else if (workingTree.modifiedFiles.length > 0 || workingTree.untrackedFiles.length > 0) {
    addCheck({
      id: 'CHK-GIT-SAFETY',
      name: 'Client Working Tree Cleanliness',
      status: 'WARNING',
      severity: 'WARNING',
      durationMs: 8,
      sourceOrCommand: `git status --porcelain (${clientPath})`,
      sanitizedOutput: workingTree.summary,
      evidenceReferences: clientPath,
      failureReason: `Working tree has uncommitted changes (${workingTree.summary}).`,
      remediation: 'A clean working tree is recommended before upgrading to isolate upgrade changes.',
      fromCache: false,
      freshness: new Date().toISOString(),
    });
  } else {
    addCheck({
      id: 'CHK-GIT-SAFETY',
      name: 'Client Working Tree Cleanliness',
      status: 'PASS',
      severity: 'INFO',
      durationMs: 8,
      sourceOrCommand: `git status --porcelain (${clientPath})`,
      sanitizedOutput: 'Working tree clean. Safe for automated mutation.',
      evidenceReferences: clientPath,
      failureReason: null,
      remediation: null,
      fromCache: false,
      freshness: new Date().toISOString(),
    });
  }

  // -------------------------------------------------------------------------
  // Compute Evidence Completeness & Traceable Plan
  // -------------------------------------------------------------------------
  const completeness = calculateEvidenceCompleteness(resolution, workingTree);
  const selectedTracks = tracks || ['backend', 'frontend'];
  const tasks = generateTraceablePlan(detected, normTarget, resolution, selectedTracks);

  const canProceed = blockers.length === 0;
  let safetyDecision = 'READY_TO_UPGRADE';
  let decisionReason = `Preflight passed: Target v${normTarget} verified; Working tree safe.`;

  if (!canProceed) {
    safetyDecision = 'BLOCKED';
    decisionReason = `Upgrade blocked: ${blockers.join('; ')}`;
  } else if (warnings.length > 0) {
    safetyDecision = 'READY_WITH_WARNINGS';
    decisionReason = `Preflight passed with ${warnings.length} warning(s): ${warnings[0]}`;
  }

  const upgradeMode = classifyUpgradeMode(currentVersion, normTarget);

  return {
    ok: canProceed,
    canProceed,
    readyToUpgrade: canProceed,
    isBlocked: blockers.length > 0,
    status: canProceed ? (warnings.length > 0 ? 'WARNING' : 'PASS') : 'BLOCKED',
    safetyDecision,
    decisionReason,
    clientPath,
    currentVersion,
    targetVersion: normTarget,
    tracks: selectedTracks,
    resolution,
    isClean: workingTree.isClean,
    workingTreeClean: workingTree.isClean,
    workingTree,
    completeness,
    evidence: {
      packageFound: resolution.sources?.package?.available === true,
      packageAvailable: resolution.sources?.package?.available === true,
      packageSource: resolution.sources?.package?.source || 'none',
      packageIdentity: resolution.sources?.package?.identity || null,
      sourceRevisionAvailable: resolution.evidence?.sourceRevisionAvailable === true,
      sourceDiffAvailable: resolution.evidence?.sourceDiffAvailable === true,
      releaseNotesAvailable: resolution.evidence?.releaseNotesAvailable === true,
      completenessNumerator: completeness.numerator,
      completenessDenominator: completeness.denominator,
      completenessPercent: completeness.percentage,
      missingRequired: completeness.missingRequired,
      missingOptional: completeness.missingOptional,
    },
    upgradeMode,
    resolutionMode: resolution.mode || 'UNKNOWN',
    impactPreview: {
      mode: resolution.mode || 'UNKNOWN',
      upgradeMode: upgradeMode.name,
      isPatch: upgradeMode.isPatch,
      compatibilityEvidence: resolution.evidence?.compatibilityEvidence || 'UNKNOWN',
      packageAvailable: resolution.sources?.package?.available === true,
      sourceDiffAvailable: resolution.evidence?.sourceDiffAvailable === true,
    },
    checks,
    tasks,
    blockers,
    warnings,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Classify upgrade mode: Fast Patch Mode vs Full Semantic Upgrade.
 */
function classifyUpgradeMode(currentVersion, targetVersion) {
  if (!currentVersion || !targetVersion) {
    return {
      mode: 'FULL_SEMANTIC',
      name: 'Full Semantic Upgrade',
      badgeClass: 'badge-primary',
      isPatch: false,
      reason: 'Unknown or missing version bounds; defaults to full semantic analysis.',
      description: 'Executes comprehensive Core analysis, Copilot semantic reasoning, and full verification.',
    };
  }

  const parse = (v) => {
    const parts = String(v).replace(/^v/i, '').trim().split('.').map((n) => parseInt(n, 10) || 0);
    return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 };
  };

  const curr = parse(currentVersion);
  const tgt = parse(targetVersion);

  const isSameMajor = curr.major === tgt.major;
  const isSameMinor = curr.minor === tgt.minor;
  const isPatchBump = isSameMajor && isSameMinor && tgt.patch > curr.patch;

  if (isPatchBump) {
    return {
      mode: 'FAST_PATCH',
      name: 'Fast Patch Upgrade',
      badgeClass: 'badge-success',
      isPatch: true,
      reason: `Patch version bump (v${currentVersion} -> v${targetVersion}): major and minor versions are identical.`,
      description: 'Streamlined flow: deterministic package version replacement and build/restore verification. Copilot semantic reasoning skipped unless compiler errors occur.',
      recommendedAction: 'Direct version replacement & restore/build verification.',
    };
  }

  return {
    mode: 'FULL_SEMANTIC',
    name: 'Full Semantic Upgrade',
    badgeClass: 'badge-primary',
    isPatch: false,
    reason: `Major/minor version upgrade (v${currentVersion} -> v${targetVersion}): architectural or breaking changes may be present.`,
    description: 'Comprehensive flow: Core changeset ingestion, Copilot CLI semantic migration reasoning, configuration alignment, and bounded repair loop.',
    recommendedAction: 'Full semantic reasoning, migration analysis, and build repair.',
  };
}

module.exports = {
  discoverProjects,
  detectCurrentVersion,
  getAvailableVersions,
  runPreflight,
  parseGitWorkingTreeStatus,
  calculateEvidenceCompleteness,
  classifyUpgradeMode,
  DEFAULT_CLIENTS_DIR,
  DEFAULT_CORE_DIR,
};

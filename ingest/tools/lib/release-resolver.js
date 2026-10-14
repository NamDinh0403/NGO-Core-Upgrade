'use strict';
/*
 * Evidence-based release resolver for NGO Core releases.
 *
 * Discovers and selects the best available evidence source for a target version
 * without requiring the existence of a `releases` branch.
 *
 * Evidence source hierarchy:
 *   1. Published package artifact matching the requested version.
 *   2. Official release tag or immutable source revision, if available.
 *   3. Official release metadata and release notes.
 *   4. Relevant commits, pull requests, or source diffs, if available.
 *   5. Other authoritative package metadata and compatibility information.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const git = require('./git');
const notes = require('./notes');
const classify = require('./classify');

const ANALYZER_VERSION = 'release-resolver-1';
const hash = (value) => crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');

const parseVer = (v) => {
  const m = String(v || '').trim().match(/^(\d+)\.(\d+)(?:\.(\d+))?(?:-([^\s]+))?$/);
  return m ? [+m[1], +m[2], +(m[3] || 0), m[4] || null] : null;
};

const normalizeVersion = (v) => {
  const p = parseVer(v);
  if (!p) return null;
  const base = `${p[0]}.${p[1]}.${p[2]}`;
  return p[3] ? `${base}-${p[3]}` : base;
};

const cmpVer = (a, b) => {
  const pa = parseVer(a), pb = parseVer(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  if (pa[3] && !pb[3]) return -1;
  if (!pa[3] && pb[3]) return 1;
  if (pa[3] && pb[3]) return pa[3].localeCompare(pb[3]);
  return 0;
};

const gtVer = (a, b) => cmpVer(a, b) > 0;

/**
 * Check approved release ref mappings (e.g. from ingest/config/approved-release-ref-mappings.json).
 */
function getApprovedMapping(version, mappingsPath) {
  if (!mappingsPath || !fs.existsSync(mappingsPath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
    const mapping = data && data.mappings && data.mappings[version];
    return mapping && mapping.decision === 'APPROVED' ? mapping : null;
  } catch (_) {
    return null;
  }
}

/**
 * Check version manifest (e.g. from ingest/knowledge/candidates/version-manifest.json).
 */
function getManifestRelease(version, manifestPath) {
  if (!manifestPath || !fs.existsSync(manifestPath)) return null;
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return (manifest.releases || []).find((r) => r.version === version) || null;
  } catch (_) {
    return null;
  }
}

/**
 * Discover package publication evidence.
 */
function discoverPackageEvidence(targetVersion, options) {
  options = options || {};
  const normTarget = normalizeVersion(targetVersion);

  // 1. Explicit package artifacts provided
  if (Array.isArray(options.packageArtifacts) && options.packageArtifacts.length > 0) {
    const matched = options.packageArtifacts.find((art) => {
      if (typeof art === 'string') return art.includes(normTarget);
      return art && (art.version === normTarget || (art.name && art.name.includes(normTarget)));
    });
    if (matched) {
      return {
        available: true,
        source: 'package-artifact',
        artifact: matched,
        identity: typeof matched === 'string' ? path.basename(matched) : matched.name || normTarget,
      };
    }
  }

  // 2. Explicit published packages list/set
  if (options.publishedPackages) {
    const list = Array.isArray(options.publishedPackages)
      ? options.publishedPackages.map(normalizeVersion)
      : options.publishedPackages instanceof Set
        ? Array.from(options.publishedPackages).map(normalizeVersion)
        : [];
    if (list.includes(normTarget)) {
      return {
        available: true,
        source: 'published-packages-list',
        identity: `published-version-${normTarget}`,
      };
    }
  }

  // 3. Custom package checker function
  if (typeof options.isPackagePublished === 'function') {
    const res = options.isPackagePublished(normTarget);
    if (res) {
      return {
        available: true,
        source: 'package-checker',
        identity: typeof res === 'object' && res.identity ? res.identity : `checked-${normTarget}`,
      };
    }
  }

  // 4. Manifest publication record
  const manifestRel = getManifestRelease(normTarget, options.manifestPath);
  if (manifestRel) {
    return {
      available: true,
      source: 'version-manifest',
      identity: manifestRel.candidatePath || `manifest-${normTarget}`,
      manifestRelease: manifestRel,
    };
  }

  // 5. Explicit flag
  if (options.packageAvailable === true) {
    return {
      available: true,
      source: 'options-flag',
      identity: `declared-${normTarget}`,
    };
  }
  if (options.packageAvailable === false) {
    return {
      available: false,
      source: 'options-flag',
      identity: null,
      reason: 'explicitly marked package unavailable',
    };
  }

  // 6. Check local package artifacts directory if configured
  if (options.packagesDir && fs.existsSync(options.packagesDir)) {
    try {
      const files = fs.readdirSync(options.packagesDir);
      const match = files.find((f) => f.includes(normTarget));
      if (match) {
        return {
          available: true,
          source: 'local-packages-directory',
          artifact: path.join(options.packagesDir, match),
          identity: match,
        };
      }
    } catch (_) {}
  }

  // 7. Check Core checkout package.json when present
  if (options.corePath && fs.existsSync(path.join(options.corePath, 'package.json'))) {
    try {
      const corePkg = JSON.parse(fs.readFileSync(path.join(options.corePath, 'package.json'), 'utf8'));
      if (normalizeVersion(corePkg.version) === normTarget) {
        return {
          available: true,
          status: 'CONFIRMED_AVAILABLE',
          source: 'core-checkout-package-json',
          identity: `${corePkg.name || 'core'}@${corePkg.version}`,
        };
      }
    } catch (_) {}
  }

  // 8. Check standard NuGet global packages cache (~/.nuget/packages)
  const homeDir = process.env.USERPROFILE || process.env.HOME || '';
  if (homeDir) {
    const nugetDir = path.join(homeDir, '.nuget', 'packages');
    if (fs.existsSync(nugetDir)) {
      try {
        const candidateNames = ['ngo.core', 'ngo.core.api', 'ngo.core.common'];
        for (const name of candidateNames) {
          const pkgVerDir = path.join(nugetDir, name, normTarget);
          if (fs.existsSync(pkgVerDir)) {
            return {
              available: true,
              status: 'CONFIRMED_AVAILABLE',
              source: 'nuget-cache',
              artifact: pkgVerDir,
              identity: `NuGet: ${name}@${normTarget}`,
            };
          }
        }
      } catch (_) {}
    }
  }

  // 9. If authenticated feed failed with authentication error (HTTP 401)
  if (options.authError) {
    return {
      available: false,
      status: 'AUTH_FAILED',
      source: 'authenticated-feed',
      identity: null,
      reason: `Package feed authentication failed (HTTP 401): ${options.authError}`,
      failureType: 'AUTH_REQUIRED',
      remediation: 'Authenticate using Azure Artifacts Credential Provider or provide AZURE_DEVOPS_EXT_PAT.',
    };
  }

  // 10. If authenticated feed failed with forbidden / insufficient permissions (HTTP 403)
  if (options.forbiddenError) {
    return {
      available: false,
      status: 'FORBIDDEN',
      source: 'authenticated-feed',
      identity: null,
      reason: `Package feed access forbidden (HTTP 403): ${options.forbiddenError}`,
      failureType: 'FORBIDDEN',
      remediation: 'Verify your Azure DevOps account has Reader permissions in Feed Settings -> Permissions.',
    };
  }

  // 11. If registry probe failed with network error / timeout
  if (options.registryError) {
    return {
      available: false,
      status: 'CHECK_FAILED',
      source: 'registry-probe',
      identity: null,
      reason: `Package registry check failed: ${options.registryError}`,
      failureType: 'NETWORK_OR_TIMEOUT',
    };
  }

  // 12. If pre-resolved feed check passed in options
  if (options.feedCheck) {
    if (options.feedCheck.available) {
      return {
        available: true,
        status: options.feedCheck.status || 'CONFIRMED_AVAILABLE',
        source: options.feedCheck.source || 'nuget-feed',
        identity: options.feedCheck.identity || `NuGet Feed: NGO.Core@${normTarget}`,
      };
    }
    if (options.feedCheck.status === 'AUTH_FAILED' || options.feedCheck.failureType === 'AUTH_REQUIRED') {
      return {
        available: false,
        status: 'AUTH_FAILED',
        source: options.feedCheck.source || 'authenticated-feed',
        identity: null,
        reason: options.feedCheck.reason || 'Package feed authentication failed',
        failureType: 'AUTH_REQUIRED',
        remediation: options.feedCheck.remediation || 'Authenticate using Azure Artifacts Credential Provider or provide AZURE_DEVOPS_EXT_PAT.',
      };
    }
    if (options.feedCheck.status === 'FORBIDDEN' || options.feedCheck.failureType === 'FORBIDDEN') {
      return {
        available: false,
        status: 'FORBIDDEN',
        source: options.feedCheck.source || 'authenticated-feed',
        identity: null,
        reason: options.feedCheck.reason || 'Package feed access forbidden',
        failureType: 'FORBIDDEN',
        remediation: options.feedCheck.remediation || 'Verify your Azure DevOps account has Reader permissions in Feed Settings -> Permissions.',
      };
    }
  }

  return {
    available: false,
    status: 'UNVERIFIED',
    source: null,
    identity: null,
    reason: 'not found in package artifacts, published registry, NuGet cache, or manifests',
    failureType: 'NOT_FOUND',
  };
}

/**
 * Discover Git source evidence (tags, branches, approved refs, commits).
 */
function discoverSourceEvidence(corePath, targetVersion, options) {
  options = options || {};
  const normTarget = normalizeVersion(targetVersion);
  const tagPrefix = options.tagPrefix !== undefined ? options.tagPrefix : 'v';
  const result = {
    tag: null,
    branch: null,
    approvedMapping: null,
    targetCommit: null,
    sourceRevisionAvailable: false,
    revisionType: null,
  };

  if (!corePath || !git.isGitRepo(corePath)) {
    return result;
  }

  // 1. Check official release tags
  const listedTags = git.listTags(corePath);
  if (listedTags.ok && Array.isArray(listedTags.tags)) {
    const candidates = [`${tagPrefix}${normTarget}`, normTarget, `release-${normTarget}`];
    const foundTag = listedTags.tags.find((t) => candidates.includes(t));
    if (foundTag) {
      const commit = git.resolveRef(corePath, foundTag);
      if (commit) {
        result.tag = { name: foundTag, commit };
        result.targetCommit = commit;
        result.sourceRevisionAvailable = true;
        result.revisionType = 'tag';
      }
    }
  }

  // 2. Check approved release ref mappings (e.g. for non-tagged releases)
  const approved = getApprovedMapping(normTarget, options.approvedMappingsPath);
  if (approved) {
    const commit = git.resolveRef(corePath, approved.ref);
    if (commit) {
      result.approvedMapping = { mapping: approved, commit };
      if (!result.targetCommit) {
        result.targetCommit = commit;
        result.sourceRevisionAvailable = true;
        result.revisionType = 'approved-mapping';
      }
    }
  }

  // 3. Check release branches (OPTIONAL discovery hint)
  const listedBranches = git.listReleaseBranches(corePath);
  if (listedBranches.ok && Array.isArray(listedBranches.branches)) {
    const [maj, min] = normTarget.split('.');
    const branchCandidates = [
      `releases/${maj}.${min}`,
      `releases/${normTarget}`,
      `release/${maj}.${min}`,
      `release/${normTarget}`,
    ];
    const foundBranch = listedBranches.branches.find((b) => branchCandidates.includes(b));
    if (foundBranch) {
      const commit = git.resolveRef(corePath, `origin/${foundBranch}`) || git.resolveRef(corePath, foundBranch);
      if (commit) {
        result.branch = { name: foundBranch, commit };
        if (!result.targetCommit) {
          result.targetCommit = commit;
          result.sourceRevisionAvailable = true;
          result.revisionType = 'branch';
        }
      }
    }
  }

  // 3b. Check discovered branch releases (derived patches and beta branches)
  if (!result.targetCommit && corePath) {
    try {
      const discovered = discoverCoreBranchReleases(corePath);
      if (discovered && discovered.ok) {
        const parsed = parseVer(normTarget);
        if (parsed) {
          const sub = `${parsed[0]}.${parsed[1]}`;
          const subMeta = discovered.branchMetadata && discovered.branchMetadata[sub];
          if (subMeta && subMeta.nextPatchDerived && subMeta.nextPatchDerived.nextPatchVersion === normTarget) {
            const commit = git.resolveRef(corePath, `origin/${subMeta.branch}`) || git.resolveRef(corePath, subMeta.branch) || subMeta.sha;
            if (commit) {
              result.branch = { name: subMeta.branch, commit };
              result.targetCommit = commit;
              result.sourceRevisionAvailable = true;
              result.revisionType = 'derived-patch-branch';
            }
          }
        }
        if (!result.targetCommit && discovered.latestMajorBeta && discovered.latestMajorBeta.version === normTarget) {
          const commit = git.resolveRef(corePath, `origin/${discovered.latestMajorBeta.branch}`) || git.resolveRef(corePath, discovered.latestMajorBeta.branch) || discovered.latestMajorBeta.sha;
          if (commit) {
            result.branch = { name: discovered.latestMajorBeta.branch, commit };
            result.targetCommit = commit;
            result.sourceRevisionAvailable = true;
            result.revisionType = 'beta-branch';
          }
        }
      }
    } catch (_) {}
  }

  // 4. Fallback direct commit or manifest commit
  if (!result.targetCommit && options.targetCommit) {
    const commit = git.resolveRef(corePath, options.targetCommit);
    if (commit) {
      result.targetCommit = commit;
      result.sourceRevisionAvailable = true;
      result.revisionType = 'explicit-commit';
    }
  }

  if (!result.targetCommit) {
    const manifestRel = getManifestRelease(normTarget, options.manifestPath);
    if (manifestRel && manifestRel.commit) {
      const commit = git.resolveRef(corePath, manifestRel.commit);
      if (commit) {
        result.targetCommit = commit;
        result.sourceRevisionAvailable = true;
        result.revisionType = 'manifest-commit';
      }
    }
  }

  return result;
}

/**
 * Detect conflicting evidence between discovered sources.
 */
function detectConflicts(corePath, targetVersion, pkgEvidence, srcEvidence) {
  const normTarget = normalizeVersion(targetVersion);
  const conflicts = [];

  // Check tag vs branch commit disagreement
  if (srcEvidence.tag && srcEvidence.branch) {
    if (srcEvidence.tag.commit !== srcEvidence.branch.commit) {
      // If branch commit has package.json with a different version, flag conflict
      if (corePath) {
        try {
          const branchPkgText = git.showFile(corePath, srcEvidence.branch.commit, 'package.json');
          const branchPkg = JSON.parse(branchPkgText);
          const branchPkgVer = normalizeVersion(branchPkg.version);
          if (branchPkgVer && branchPkgVer !== normTarget) {
            conflicts.push(`Branch ${srcEvidence.branch.name} head (${srcEvidence.branch.commit.slice(0, 10)}) declares version ${branchPkgVer}, contradicting tag ${srcEvidence.tag.name} (${normTarget}).`);
          }
        } catch (_) {}
      }
    }
  }

  // Check source revision package.json vs requested target version
  if (corePath && srcEvidence.targetCommit) {
    try {
      const pkgText = git.showFile(corePath, srcEvidence.targetCommit, 'package.json');
      const parsed = JSON.parse(pkgText);
      const revVer = normalizeVersion(parsed.version);
      // Only flag if revVer is a valid semver and doesn't match target, and isn't a placeholder (0.0.0)
      if (revVer && revVer !== normTarget && !/^0\.0\./.test(revVer)) {
        conflicts.push(`Source revision ${srcEvidence.targetCommit.slice(0, 10)} declares package version ${revVer}, which contradicts target ${normTarget}.`);
      }
    } catch (_) {}
  }

  // Check approved mapping drift
  if (srcEvidence.approvedMapping && srcEvidence.approvedMapping.mapping) {
    const approved = srcEvidence.approvedMapping.mapping;
    if (srcEvidence.branch && approved.sourceBranch && srcEvidence.branch.name !== approved.sourceBranch) {
      conflicts.push(`Approved release mapping branch '${approved.sourceBranch}' does not match discovered branch '${srcEvidence.branch.name}'.`);
    }
  }

  return conflicts;
}

/**
 * Evidence-based release resolver.
 *
 * @param {string} targetVersion Target version to resolve (e.g. "9.4.0").
 * @param {object} [options]
 * @returns {object} Structured resolution result.
 */
function resolveRelease(targetVersion, options) {
  options = options || {};
  const normTarget = normalizeVersion(targetVersion);

  // Scenario E (part 1): Invalid target version
  if (!normTarget) {
    return {
      ok: false,
      status: 'INVALID_TARGET_VERSION',
      targetVersion: targetVersion,
      error: `Invalid target version: '${targetVersion}'. Must be semver x.y or x.y.z.`,
      attempts: 1,
      termination: 'BOUNDED_TERMINATION',
      nextAction: 'Supply a valid semantic version (e.g. 9.4.0).',
    };
  }

  const corePath = options.corePath;
  const since = options.since ? normalizeVersion(options.since) : null;

  // 1. Discover sources
  const pkgEvidence = discoverPackageEvidence(normTarget, options);
  const srcEvidence = discoverSourceEvidence(corePath, normTarget, options);

  // 2. Discover baseline revision for diff
  let fromCommit = null;
  if (since && corePath && git.isGitRepo(corePath)) {
    const baselineSrc = discoverSourceEvidence(corePath, since, options);
    fromCommit = baselineSrc.targetCommit;
  }

  // 3. Detect conflicts
  const conflicts = detectConflicts(corePath, normTarget, pkgEvidence, srcEvidence);
  if (conflicts.length > 0) {
    return {
      ok: false,
      status: 'CONFLICTING_RELEASE_EVIDENCE',
      targetVersion: normTarget,
      error: `Conflicting release evidence detected for ${normTarget}: ${conflicts.join('; ')}`,
      conflicts,
      provenance: {
        package: pkgEvidence,
        source: srcEvidence,
      },
      attempts: 1,
      termination: 'BOUNDED_TERMINATION',
      nextAction: 'Resolve conflicting release evidence; do not silently select an arbitrary source.',
    };
  }

  // 4. Evaluate release notes
  let releaseNotesAvailable = false;
  let releaseNotesText = options.releaseNotesText || null;
  if (!releaseNotesText && options['release-notes'] && fs.existsSync(options['release-notes'])) {
    try { releaseNotesText = fs.readFileSync(options['release-notes'], 'utf8'); } catch (_) {}
  }
  if (!releaseNotesText && options.releaseNotesPath && fs.existsSync(options.releaseNotesPath)) {
    try { releaseNotesText = fs.readFileSync(options.releaseNotesPath, 'utf8'); } catch (_) {}
  }
  if (releaseNotesText) {
    const cards = notes.cardsFor(releaseNotesText, normTarget);
    releaseNotesAvailable = cards.length > 0;
  }

  // 5. Evaluate source diff availability
  let sourceDiffAvailable = false;
  let sourceDiffReason = null;
  if (fromCommit && srcEvidence.targetCommit && corePath && git.isGitRepo(corePath)) {
    const diff = git.diffNameStatus(corePath, fromCommit, srcEvidence.targetCommit);
    sourceDiffAvailable = diff.ok;
    if (!diff.ok) sourceDiffReason = diff.error;
  } else {
    sourceDiffReason = !since
      ? 'no baseline version provided for diff'
      : !fromCommit
        ? `baseline commit for ${since} could not be resolved`
        : 'target source revision could not be resolved in Core checkout';
  }

  // Scenario E (part 2): Neither package nor source revision is available
  if (!pkgEvidence.available && !srcEvidence.sourceRevisionAvailable) {
    return {
      ok: false,
      status: 'RELEASE_UNAVAILABLE',
      targetVersion: normTarget,
      error: `Target version ${normTarget} is unavailable: package artifact not found and source repository has no matching tag or branch.`,
      attempts: 1,
      termination: 'BOUNDED_TERMINATION',
      evidence: {
        packageAvailable: false,
        sourceRevisionAvailable: false,
        releaseNotesAvailable,
        sourceDiffAvailable: false,
        packageInspectionCompleted: false,
        compatibilityEvidence: 'INCOMPLETE',
      },
      nextAction: `Publish package ${normTarget} or push the release tag/commit before upgrading.`,
    };
  }

  // Scenario D: Source revision exists, but package is unavailable
  if (!pkgEvidence.available && srcEvidence.sourceRevisionAvailable) {
    return {
      ok: true,
      status: 'SOURCE_AVAILABLE_PACKAGE_UNAVAILABLE',
      targetVersion: normTarget,
      sourceVersion: since,
      mode: 'SOURCE_ONLY_UNVERIFIED_PACKAGE',
      evidence: {
        packageAvailable: false,
        sourceRevisionAvailable: true,
        releaseNotesAvailable,
        sourceDiffAvailable,
        packageInspectionCompleted: false,
        compatibilityEvidence: 'PARTIAL',
      },
      sources: {
        package: pkgEvidence,
        source: srcEvidence,
        releaseNotes: { available: releaseNotesAvailable },
      },
      targetCommit: srcEvidence.targetCommit,
      fromCommit,
      unresolvedItems: [
        `${normTarget}: source branch/tag exists at ${srcEvidence.targetCommit.slice(0, 10)}, but published package artifact is unavailable. Published artifact compatibility cannot be verified.`,
      ],
      nextAction: `Publish or supply the target package artifact for ${normTarget} to complete artifact-level compatibility verification.`,
    };
  }

  // Scenario C: Package published, but source diff unavailable
  if (pkgEvidence.available && !sourceDiffAvailable) {
    return {
      ok: true,
      status: 'PACKAGE_PUBLISHED_SOURCE_DIFF_UNAVAILABLE',
      targetVersion: normTarget,
      sourceVersion: since,
      mode: 'PACKAGE_FIRST_REDUCED_EVIDENCE',
      evidence: {
        packageAvailable: true,
        sourceRevisionAvailable: srcEvidence.sourceRevisionAvailable,
        releaseNotesAvailable,
        sourceDiffAvailable: false,
        packageInspectionCompleted: true,
        compatibilityEvidence: 'PARTIAL',
      },
      sources: {
        package: pkgEvidence,
        source: srcEvidence,
        releaseNotes: { available: releaseNotesAvailable },
      },
      targetCommit: srcEvidence.targetCommit,
      fromCommit,
      unresolvedItems: [
        `${normTarget}: package is published (${pkgEvidence.identity}), but source diff is unavailable (${sourceDiffReason}). Source-level diff conclusions cannot be established; proceeding with package surface inspection.`,
      ],
      nextAction: 'Inspect client impact and installed assembly/API surface; source diff is unavailable for this release.',
    };
  }

  // Scenario B: Urgent package-first release (package published, release branch missing, but tag or other source exists)
  if (pkgEvidence.available && !srcEvidence.branch) {
    return {
      ok: true,
      status: 'PACKAGE_FIRST_RELEASE',
      targetVersion: normTarget,
      sourceVersion: since,
      mode: 'PACKAGE_FIRST',
      evidence: {
        packageAvailable: true,
        sourceRevisionAvailable: srcEvidence.sourceRevisionAvailable,
        releaseNotesAvailable,
        sourceDiffAvailable,
        packageInspectionCompleted: true,
        compatibilityEvidence: sourceDiffAvailable ? 'COMPLETE' : 'PARTIAL',
      },
      sources: {
        package: pkgEvidence,
        source: srcEvidence,
        releaseNotes: { available: releaseNotesAvailable },
      },
      targetCommit: srcEvidence.targetCommit,
      fromCommit,
      unresolvedItems: [],
      nextAction: `Proceed with package-first release for ${normTarget}; releases branch is not required.`,
    };
  }

  // Scenario A: Normal release (package published and release branch/tag exists)
  return {
    ok: true,
    status: 'NORMAL_RELEASE',
    targetVersion: normTarget,
    sourceVersion: since,
    mode: 'FULL',
    evidence: {
      packageAvailable: true,
      sourceRevisionAvailable: true,
      releaseNotesAvailable,
      sourceDiffAvailable,
      packageInspectionCompleted: true,
      compatibilityEvidence: 'COMPLETE',
    },
    sources: {
      package: pkgEvidence,
      source: srcEvidence,
      releaseNotes: { available: releaseNotesAvailable },
    },
    targetCommit: srcEvidence.targetCommit,
    fromCommit,
    unresolvedItems: [],
    nextAction: `Proceed with full upgrade analysis for ${normTarget} using package artifact and source evidence.`,
  };
}

// In-memory cache for branch release discovery to keep calls fast across the platform
const branchDiscoveryCache = new Map();
const BRANCH_CACHE_TTL_MS = 60000; // 60 seconds

/**
 * Authoritative Core Release Discovery from Git branches, tags, and commits.
 *
 * Rules:
 *  1. Scan for releases branches in Core repo, extract major releases (6, 7, 8, 9, 10...),
 *     sub-versions (e.g. 6.6, 8.2, 9.4), and patch versions of each sub-version.
 *  2. For major versions with only beta branch(es), find the latest beta branch
 *     and mark it as the latest major release candidate.
 *  3. For patch versions, check if any newer commits exist on that branch above the
 *     highest identified patch commit/tag; if so, mark it with the branch/patch version plus 1
 *     (e.g. 8.2.3 commit found, but HEAD has newer commits -> derives 8.2.4).
 */
function discoverCoreBranchReleases(corePath, options) {
  options = options || {};
  if (!corePath || !git.isGitRepo(corePath)) {
    return { ok: false, error: 'Not a git repository', versions: [], latestMajorBeta: null, branchMetadata: {}, majors: [], subVersions: [] };
  }

  // Check cache unless explicitly bypassed
  if (!options.bypassCache && !options.forceRefresh && branchDiscoveryCache.has(corePath)) {
    const cached = branchDiscoveryCache.get(corePath);
    if (Date.now() - cached.timestamp < BRANCH_CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // 1. Get all refs matching releases or beta
  const r = git.git(corePath, [
    'for-each-ref',
    '--format=%(refname:short) %(objectname)',
    'refs/remotes/origin/releases/*',
    'refs/heads/releases/*',
    'refs/remotes/origin/*beta*',
    'refs/heads/*beta*'
  ]);

  if (r.code !== 0) {
    return { ok: false, error: r.stderr || 'git ref discovery failed', versions: [], latestMajorBeta: null, branchMetadata: {}, majors: [], subVersions: [] };
  }

  const branchMap = new Map();
  for (const line of r.stdout.split(/\r?\n/).filter(Boolean)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;
    const ref = parts[0];
    const sha = parts[1];
    const clean = ref.replace(/^origin\//, '');
    // Prefer remote origin ref over local checkout ref if present
    if (!branchMap.has(clean) || ref.startsWith('origin/')) {
      branchMap.set(clean, { ref, sha, raw: clean });
    }
  }

  const versions = new Set();
  const releasedMajors = new Set();
  const allMajors = new Set();
  const branchMetadata = {};
  const betaBranches = [];

  // 2. Classify release branches and beta branches
  for (const [clean, info] of branchMap.entries()) {
    const isBeta = /(?:^|[-._/])beta(?:[-._/0-9]|$)/i.test(clean);

    // Pattern A: standard releases/X.Y or releases/X.Y.Z
    const m = clean.match(/^releases\/(\d+)\.(\d+)(?:\.(\d+))?(?:-([^\/]+))?$/i);
    if (m) {
      const major = parseInt(m[1], 10);
      const minor = parseInt(m[2], 10);
      const sub = `${major}.${minor}`;
      const patch = m[3] ? parseInt(m[3], 10) : null;
      const prerelease = m[4] || null;
      allMajors.add(major);

      if (isBeta || prerelease) {
        betaBranches.push({ branch: clean, major, minor, patch: patch || 0, prerelease: prerelease || 'beta', ...info });
      } else {
        releasedMajors.add(major);
        if (!branchMetadata[sub]) {
          branchMetadata[sub] = { branch: clean, major, minor, sub, explicitPatch: patch, ...info };
        }
      }
    } else if (isBeta) {
      // Pattern B: beta branch naming e.g. klbu/3.1.0-beta.5 or releases/2.23.0-beta.4 or 10.0-beta
      const bm = clean.match(/(?:^|\/)(\d+)\.(\d+)(?:\.(\d+))?(?:-([^\/]+))?/i);
      if (bm) {
        const major = parseInt(bm[1], 10);
        const minor = parseInt(bm[2], 10);
        const patch = bm[3] ? parseInt(bm[3], 10) : 0;
        allMajors.add(major);
        betaBranches.push({ branch: clean, major, minor, patch, prerelease: bm[4] || 'beta', ...info });
      }
    }
  }

  // 3. Rule 1 & Rule 3: For each sub-version release branch, discover patches & newer commits
  for (const [sub, meta] of Object.entries(branchMetadata)) {
    const logRes = git.git(corePath, ['log', '-n', '30', '--format=%H %s', meta.ref]);
    const lines = logRes.code === 0 ? logRes.stdout.split(/\r?\n/).filter(Boolean) : [];

    let highestPatch = meta.explicitPatch !== null ? meta.explicitPatch : 0;
    let highestCommitIdx = -1;
    let highestPatchVer = null;
    const discovered = [];

    for (let i = 0; i < lines.length; i++) {
      const [h, ...rest] = lines[i].split(' ');
      const msg = rest.join(' ');
      const pm = msg.match(/(?:Merged PR \d+:|Release|v)?\s*(\d+\.\d+\.(\d+))/i);
      if (pm && pm[1].startsWith(`${sub}.`)) {
        const pNum = parseInt(pm[2], 10);
        discovered.push(pm[1]);
        if (pNum >= highestPatch) {
          highestPatch = pNum;
          highestPatchVer = pm[1];
          if (highestCommitIdx === -1 || i < highestCommitIdx) {
            highestCommitIdx = i;
          }
        }
      }
    }

    meta.discoveredPatches = discovered;

    if (discovered.length > 0) {
      for (const d of discovered) versions.add(d);
    } else if (meta.explicitPatch !== null) {
      versions.add(`${sub}.${meta.explicitPatch}`);
    } else {
      versions.add(`${sub}.0`);
    }

    // Rule 3: Check if any newer commit above that branch, then mark it with the branch name plus 1
    // (e.g. 8.2.3 commit found, but HEAD has newer commits -> derives 8.2.4)
    if (highestCommitIdx > 0 && highestPatchVer) {
      const nextPatch = `${sub}.${highestPatch + 1}`;
      versions.add(nextPatch);
      meta.nextPatchDerived = {
        baseVersion: highestPatchVer,
        nextPatchVersion: nextPatch,
        commitsAhead: highestCommitIdx,
      };
    }
  }

  // 4. Rule 2: For major versions where only beta branch exists, get latest beta branch and mark as latest major release
  let latestMajorBeta = null;
  if (betaBranches.length > 0) {
    betaBranches.sort((a, b) => {
      if (a.major !== b.major) return b.major - a.major;
      if (a.minor !== b.minor) return b.minor - a.minor;
      return b.patch - a.patch;
    });

    // Check if highest beta branch is a major without GA release branch (or higher than all released majors)
    const topBeta = betaBranches[0];
    const maxReleased = releasedMajors.size > 0 ? Math.max(...Array.from(releasedMajors)) : 0;
    const isLatestMajor = !releasedMajors.has(topBeta.major) || topBeta.major >= maxReleased;
    const betaVer = `${topBeta.major}.${topBeta.minor}.${topBeta.patch}-${topBeta.prerelease}`;

    latestMajorBeta = {
      version: betaVer,
      major: topBeta.major,
      minor: topBeta.minor,
      patch: topBeta.patch,
      branch: topBeta.branch,
      isLatestMajor,
      sha: topBeta.sha,
    };

    versions.add(betaVer);

    // Also register any beta branch for majors that have no released GA branches
    for (const b of betaBranches) {
      if (!releasedMajors.has(b.major)) {
        versions.add(`${b.major}.${b.minor}.${b.patch}-${b.prerelease}`);
      }
    }
  }

  // 5. Cross-reference git tags
  const tagRes = git.listTags(corePath);
  if (tagRes.ok && Array.isArray(tagRes.tags)) {
    for (const t of tagRes.tags) {
      const norm = normalizeVersion(t.replace(/^v/, ''));
      if (norm) versions.add(norm);
    }
  }

  // 6. Cross-reference local NuGet cache
  const homeDir = process.env.USERPROFILE || process.env.HOME || '';
  if (homeDir) {
    const nugetDir = path.join(homeDir, '.nuget', 'packages');
    if (fs.existsSync(nugetDir)) {
      for (const name of ['ngo.core.api', 'ngo.core']) {
        const pkgDir = path.join(nugetDir, name);
        if (fs.existsSync(pkgDir)) {
          try {
            for (const v of fs.readdirSync(pkgDir)) {
              const norm = normalizeVersion(v);
              if (norm) versions.add(norm);
            }
          } catch (_) {}
        }
      }
    }
  }

  const result = {
    ok: true,
    versions: Array.from(versions).sort((a, b) => cmpVer(b, a)),
    latestMajorBeta,
    branchMetadata,
    majors: Array.from(allMajors).sort((a, b) => b - a),
    subVersions: Object.keys(branchMetadata).sort((a, b) => cmpVer(`${b}.0`, `${a}.0`)),
  };

  // Cache result
  branchDiscoveryCache.set(corePath, { timestamp: Date.now(), data: result });
  return result;
}

module.exports = {
  resolveRelease,
  discoverPackageEvidence,
  discoverSourceEvidence,
  discoverCoreBranchReleases,
  detectConflicts,
  parseVer,
  normalizeVersion,
  cmpVer,
  gtVer,
  ANALYZER_VERSION,
};


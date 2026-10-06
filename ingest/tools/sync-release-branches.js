#!/usr/bin/env node
'use strict';

/*
 * Synchronize shared candidate evidence from Core releases/* branches.
 * Core refs are refreshed, but HEAD and the working tree are never changed.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const git = require('./lib/git');
const classify = require('./lib/classify');

const ROOT = path.resolve(__dirname, '..');
const REPOSITORY_ROOT = path.resolve(ROOT, '..');
const DEFAULT_OUT = path.join(ROOT, 'knowledge', 'candidates', 'releases');
const SCHEMA_VERSION = 4;
const ANALYZER_VERSION = 'release-branches-2';
const MINIMUM_VERSION = '5.0.0';
const VERSION_RE = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?$/;
const HIGH_RISK = /controller|migration|appsettings|config|\.csproj$|packages\.props$|startup|program|authorize|permission|interface/i;
const SYMBOL_RE = /^\s*(?:public|protected|internal|export)\s+(?:(?:abstract|static|virtual|override|sealed|async|readonly)\s+)*(?:(?:class|interface|record|enum|struct)\b|[A-Za-z_$][\w$<>,[\]? .]*\s+[A-Za-z_$][\w$]*\s*\([^;{}]{0,300}\))/;

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) flags[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return flags;
}

function versionParts(value) {
  const match = String(value || '').match(VERSION_RE);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2] || 0),
    patch: Number(match[3] || 0),
    explicitParts: 1 + Number(match[2] !== undefined) + Number(match[3] !== undefined),
  };
}

function normalizeVersion(value) {
  const parsed = versionParts(value);
  return parsed ? `${parsed.major}.${parsed.minor}.${parsed.patch}` : null;
}

function compareVersion(a, b) {
  const left = versionParts(a);
  const right = versionParts(b);
  if (!left || !right) throw new Error(`cannot compare invalid semantic versions: ${a}, ${b}`);
  for (const key of ['major', 'minor', 'patch']) {
    if (left[key] !== right[key]) return left[key] - right[key];
  }
  return 0;
}

function branchVersion(branch) {
  const match = String(branch).match(/^releases\/([^/]+)$/);
  return match ? normalizeVersion(match[1]) : null;
}

function branchPreference(branch) {
  const raw = String(branch).replace(/^releases\//, '');
  const parsed = versionParts(raw);
  const standard = parsed && raw === [parsed.major, parsed.minor, parsed.patch].slice(0, parsed.explicitParts).join('.');
  return { standard: standard ? 1 : 0, explicitParts: parsed ? parsed.explicitParts : 0, branch };
}

function preferBranch(left, right) {
  const a = branchPreference(left.branch);
  const b = branchPreference(right.branch);
  if (a.standard !== b.standard) return b.standard - a.standard;
  if (a.explicitParts !== b.explicitParts) return b.explicitParts - a.explicitParts;
  return a.branch.localeCompare(b.branch);
}

function discoverReleases(corePath) {
  const listed = git.listReleaseBranches(corePath);
  if (!listed.ok) throw new Error(listed.error);
  const parsed = listed.branches
    .map((branch) => ({ branch, version: branchVersion(branch), commit: git.resolveRef(corePath, `origin/${branch}`) || git.resolveRef(corePath, branch) }))
    .filter((release) => release.version && release.commit);
  const groups = new Map();
  for (const release of parsed) {
    const matches = groups.get(release.version) || [];
    matches.push(release);
    groups.set(release.version, matches);
  }
  const duplicates = [];
  const canonical = [];
  for (const [version, matches] of groups) {
    matches.sort(preferBranch);
    canonical.push(matches[0]);
    if (matches.length > 1) {
      duplicates.push({
        version,
        selectedBranch: matches[0].branch,
        branches: matches.map((item) => ({ branch: item.branch, commit: item.commit })),
        conflictingHeads: new Set(matches.map((item) => item.commit)).size > 1,
      });
    }
  }
  canonical.sort((a, b) => compareVersion(a.version, b.version));
  const supported = canonical.filter((release) => compareVersion(release.version, MINIMUM_VERSION) >= 0);
  if (!supported.length) throw new Error(`no releases/* branches found at or above ${MINIMUM_VERSION}`);
  const firstSupportedIndex = canonical.findIndex((release) => release.version === supported[0].version);
  const baseline = firstSupportedIndex > 0 ? canonical[firstSupportedIndex - 1] : null;
  if (!baseline) throw new Error(`no previous release branch exists for minimum release ${supported[0].version}`);
  return { supported, baseline, duplicates };
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function declarationsByFile(patch) {
  const result = new Map();
  let oldPath = null;
  let currentPath = null;
  let namespace = null;
  for (const line of String(patch || '').split(/\r?\n/)) {
    if (line.startsWith('diff --git ')) {
      oldPath = null;
      currentPath = null;
      namespace = null;
    } else if (line.startsWith('--- ')) {
      const value = line.slice(4);
      oldPath = value === '/dev/null' ? null : value.replace(/^a\//, '');
    } else if (line.startsWith('+++ ')) {
      const value = line.slice(4);
      currentPath = value === '/dev/null' ? oldPath : value.replace(/^b\//, '');
    } else if (/^[+-](?![+-])\s*namespace\s+/.test(line)) {
      const match = line.slice(1).match(/^\s*namespace\s+([^\s{;]+)/);
      if (match) namespace = match[1];
    } else if (currentPath && /^[+-](?![+-])/.test(line) && SYMBOL_RE.test(line.slice(1))) {
      const values = result.get(currentPath) || [];
      if (values.length < 100) {
        values.push({
          operation: line[0] === '+' ? 'added' : 'removed',
          signature: line.slice(1).trim(),
          namespace,
        });
        result.set(currentPath, values);
      }
    }
  }
  return result;
}

function riskFor(change, symbols) {
  if (/^[DR]/.test(change.status) || symbols.some((symbol) => symbol.operation === 'removed') || HIGH_RISK.test(change.path)) return 'high';
  if (/\.json$|package|route|api|\.ts$|\.cs$/i.test(change.path)) return 'medium';
  return 'low';
}

function evidenceFor(previous, current, change, symbols) {
  const risk = riskFor(change, symbols);
  const symbolChanges = symbols.length ? symbols : [{
    operation: change.status === 'A' ? 'added' : change.status === 'D' ? 'removed' : change.status.startsWith('R') ? 'renamed' : 'changed',
    signature: null,
    namespace: null,
  }];
  return symbolChanges.map((symbol) => {
    const exactSymbol = symbol.signature || change.path;
    return {
      currentVersion: current.version,
      previousVersion: previous.version,
      currentBranch: current.branch,
      previousBranch: previous.branch,
      currentCommitSha: current.commit,
      previousCommitSha: previous.commit,
      changeType: symbol.operation,
      exactSymbol,
      fullyQualifiedSymbol: symbol.namespace && symbol.signature ? `${symbol.namespace}.${symbol.signature}` : exactSymbol,
      oldSignature: symbol.operation === 'removed' ? symbol.signature : null,
      newSignature: symbol.operation === 'added' ? symbol.signature : null,
      sourceFilePath: change.path,
      previousSourcePath: change.oldPath || (change.status === 'A' ? null : change.path),
      currentSourcePath: change.status === 'D' ? null : change.path,
      description: `${symbol.operation} ${exactSymbol}`,
      impact: risk === 'high' ? 'Manual compatibility review required.' : risk === 'medium' ? 'Review affected integration before upgrade.' : 'unknown',
      lookupTerms: [current.version, change.path, exactSymbol],
      verificationStatus: 'source-diff-observed',
    };
  });
}

function factsFor(changes) {
  const facts = [];
  for (const change of changes) {
    if (/package\.json$|\.csproj$|Directory\.(Packages|Build)\.props$/i.test(change.path)) {
      facts.push({ kind: 'package-or-framework-change', path: change.path, status: change.status, requiresReview: true });
    }
    if (/appsettings|\.config$|configuration|settings/i.test(change.path)) {
      facts.push({ kind: 'configuration-change', path: change.path, status: change.status, requiresReview: true });
    }
    if (/migration|dbcontext|\.sql$/i.test(change.path)) {
      facts.push({ kind: 'database-change', path: change.path, status: change.status, requiresReview: true });
    }
  }
  return facts;
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return null;
  }
}

function writeJsonAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporary, file);
}

function fingerprintMatches(existing, previous, current) {
  const value = existing && existing.sourceFingerprint;
  return Boolean(value &&
    existing.version === current.version &&
    existing.previousVersion === previous.version &&
    value.normalizedVersion === current.version &&
    value.previousNormalizedVersion === previous.version &&
    value.currentSourceBranch === current.branch &&
    value.previousSourceBranch === previous.branch &&
    value.currentCommitSha === current.commit &&
    value.previousCommitSha === previous.commit &&
    value.evidenceSchemaVersion === SCHEMA_VERSION &&
    value.analyzerVersion === ANALYZER_VERSION &&
    Array.isArray(existing.searchableSymbolChanges));
}

function candidateAliases(outDir) {
  if (!fs.existsSync(outDir)) return new Map();
  const aliases = new Map();
  for (const name of fs.readdirSync(outDir)) {
    if (!name.endsWith('.json')) continue;
    const version = normalizeVersion(name.slice(0, -5));
    if (!version) continue;
    const files = aliases.get(version) || [];
    files.push(path.join(outDir, name));
    aliases.set(version, files);
  }
  return aliases;
}

function isTrackedCandidate(file) {
  const relative = path.relative(REPOSITORY_ROOT, file).replace(/\\/g, '/');
  const result = git.git(REPOSITORY_ROOT, ['ls-files', '--', relative]);
  return result.code === 0 && result.stdout.trim() === relative;
}

function removeBelowMinimumCandidates(outDir) {
  const removed = [];
  if (!fs.existsSync(outDir)) return removed;
  for (const name of fs.readdirSync(outDir)) {
    if (!name.endsWith('.json')) continue;
    const version = normalizeVersion(name.slice(0, -5));
    if (!version || compareVersion(version, MINIMUM_VERSION) >= 0) continue;
    const file = path.join(outDir, name);
    const existing = readJson(file);
    if (existing && existing.analyzerVersion === ANALYZER_VERSION) {
      fs.unlinkSync(file);
      removed.push(path.relative(REPOSITORY_ROOT, file).replace(/\\/g, '/'));
    }
  }
  return removed;
}

function existingKnowledgeLocations(versions) {
  const wanted = new Set(versions);
  const found = Object.fromEntries(versions.map((version) => [version, []]));
  const roots = ['backend', 'frontend', 'ingest'].map((name) => path.join(REPOSITORY_ROOT, name));
  const visit = (directory) => {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'runs') continue;
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
        continue;
      }
      if (!/\.(json|ya?ml|md)$/i.test(entry.name)) continue;
      const relative = path.relative(REPOSITORY_ROOT, fullPath).replace(/\\/g, '/');
      const text = fs.readFileSync(fullPath, 'utf8');
      const tokens = new Set((`${relative}\n${text}`.match(/\b\d+(?:\.\d+){0,2}\b/g) || []).map(normalizeVersion).filter(Boolean));
      for (const version of tokens) {
        if (wanted.has(version)) found[version].push(relative);
      }
    }
  };
  roots.forEach(visit);
  for (const version of versions) found[version] = Array.from(new Set(found[version])).sort();
  return found;
}

function latestByMajor(releases) {
  const result = {};
  for (const release of releases) result[String(versionParts(release.version).major)] = release.version;
  return result;
}

function buildRecord(corePath, previous, current) {
  const diff = git.diffNameStatus(corePath, `origin/${previous.branch}`, `origin/${current.branch}`);
  if (!diff.ok) throw new Error(diff.error);
  const log = git.commitLog(corePath, `origin/${previous.branch}`, `origin/${current.branch}`);
  if (!log.ok) throw new Error(log.error);
  const patch = git.diffPatch(corePath, `origin/${previous.branch}`, `origin/${current.branch}`);
  if (!patch.ok) throw new Error(patch.error);
  const declarations = declarationsByFile(patch.patch);
  const evidence = diff.changes.flatMap((change) => evidenceFor(previous, current, change, declarations.get(change.path) || []));
  const facts = factsFor(diff.changes);
  const generatedAt = new Date().toISOString();
  const record = {
    schemaVersion: SCHEMA_VERSION,
    evidenceSchemaVersion: SCHEMA_VERSION,
    analyzerVersion: ANALYZER_VERSION,
    version: current.version,
    previousVersion: previous.version,
    status: 'CANDIDATE',
    ingestedAt: generatedAt,
    sourceFingerprint: {
      normalizedVersion: current.version,
      previousNormalizedVersion: previous.version,
      currentSourceBranch: current.branch,
      previousSourceBranch: previous.branch,
      currentCommitSha: current.commit,
      previousCommitSha: previous.commit,
      evidenceSchemaVersion: SCHEMA_VERSION,
      analyzerVersion: ANALYZER_VERSION,
    },
    sources: {
      coreRepoPath: corePath,
      sourceBranch: current.branch,
      previousSourceBranch: previous.branch,
      sourceCommitSha: current.commit,
      previousSourceCommitSha: previous.commit,
      comparisonRange: `${previous.commit}...${current.commit}`,
      tagRange: { from: previous.branch, to: current.branch },
    },
    changedFileCount: diff.changes.length,
    commitsAnalyzed: log.commits,
    technicalSummary: `${diff.changes.length} files changed across ${log.commits.length} commits from ${previous.branch} to ${current.branch}.`,
    highRiskChanges: evidence.filter((item) => item.impact.startsWith('Manual')),
    searchableSymbolChanges: evidence,
    packageAndFrameworkChanges: facts.filter((fact) => fact.kind === 'package-or-framework-change'),
    configurationChanges: facts.filter((fact) => fact.kind === 'configuration-change'),
    databaseChanges: facts.filter((fact) => fact.kind === 'database-change'),
    apiChanges: evidence.filter((item) => /controller|route|api/i.test(item.sourceFilePath)),
    manualReviewItems: evidence.filter((item) => item.impact.startsWith('Manual')).map((item) => `${item.sourceFilePath}: ${item.description}`),
    validationResults: { sourcePathsResolved: true, coreFingerprintUnchanged: null, duplicateEvidence: false },
    changes: diff.changes.map((change) => Object.assign({}, change, classify.classify(change.path))),
    facts,
    findings: { backend: [], frontend: [], shared: evidence },
    unresolvedItems: [],
    nextAction: `Review source evidence for ${current.version} before promoting applicable findings into track canonical knowledge.`,
  };
  record.contentHash = sha256(JSON.stringify(record));
  return record;
}

function validate(releases, entries, manifest) {
  const errors = [];
  const versions = releases.map((release) => release.version);
  if (versions.some((version) => compareVersion(version, MINIMUM_VERSION) < 0)) errors.push('a generated version is below the minimum');
  if (new Set(versions).size !== versions.length) errors.push('normalized versions are not unique');
  if (versions.some((version, index) => index && compareVersion(versions[index - 1], version) >= 0)) errors.push('versions are not semantically sorted');
  if (manifest.latestCoreVersion !== versions[versions.length - 1]) errors.push('latest Core version is not dynamically derived');
  for (let index = 0; index < entries.length; index++) {
    const expectedPrevious = index ? releases[index - 1].version : manifest.baseline.version;
    if (entries[index].previousVersion !== expectedPrevious) errors.push(`${entries[index].version} has an incorrect previous version`);
    if (!entries[index].fingerprintCurrent) errors.push(`${entries[index].version} has a stale or missing fingerprint`);
  }
  return { passed: errors.length === 0, errors };
}

function sync(corePath, outDir, options) {
  if (!git.isGitRepo(corePath)) throw new Error(`not a git repository: ${corePath}`);
  const before = git.fingerprint(corePath);
  if (!before.valid) throw new Error('cannot verify Core baseline');
  if (!options.skipFetch) {
    const fetched = git.fetchReleaseBranches(corePath);
    if (!fetched.ok) throw new Error(fetched.error);
  }
  const discovered = discoverReleases(corePath);
  fs.mkdirSync(outDir, { recursive: true });
  const aliases = candidateAliases(outDir);
  const knowledgeLocations = existingKnowledgeLocations(discovered.supported.map((release) => release.version));
  const entries = [];
  for (let index = 0; index < discovered.supported.length; index++) {
    const current = discovered.supported[index];
    const previous = index ? discovered.supported[index - 1] : discovered.baseline;
    const files = aliases.get(current.version) || [];
    const canonicalFile = path.join(outDir, `${current.version}.json`);
    const existingFile = files.includes(canonicalFile) ? canonicalFile : files[0];
    const existing = existingFile ? readJson(existingFile) : null;
    const tracked = isTrackedCandidate(existingFile || canonicalFile);
    const unchanged = fingerprintMatches(existing, previous, current);
    let action = 'skipped';
    let record = existing;
    if (!unchanged) {
      record = buildRecord(corePath, previous, current);
      writeJsonAtomic(existingFile || canonicalFile, record);
      action = tracked ? 'updated' : 'added';
    }
    entries.push({
      version: current.version,
      previousVersion: previous.version,
      branch: current.branch,
      previousBranch: previous.branch,
      commit: current.commit,
      previousCommit: previous.commit,
      action,
      candidatePath: path.relative(REPOSITORY_ROOT, existingFile || canonicalFile).replace(/\\/g, '/'),
      fingerprintCurrent: fingerprintMatches(record, previous, current),
      changedFiles: record.changedFileCount,
      evidenceItems: record.searchableSymbolChanges.length,
    });
  }
  const generatedAt = new Date().toISOString();
  const manifest = {
    schemaVersion: 1,
    generatedAt,
    minimumProcessedVersion: MINIMUM_VERSION,
    latestCoreVersion: discovered.supported[discovered.supported.length - 1].version,
    baseline: discovered.baseline,
    latestReleaseByMajor: latestByMajor(discovered.supported),
    releases: entries.map((entry) => ({
      version: entry.version,
      previousVersion: entry.previousVersion,
      branch: entry.branch,
      previousBranch: entry.previousBranch,
      commit: entry.commit,
      previousCommit: entry.previousCommit,
      candidatePath: entry.candidatePath,
      sourceFingerprintCurrent: entry.fingerprintCurrent,
    })),
  };
  const validation = validate(discovered.supported, entries, manifest);
  if (!validation.passed) throw new Error(`synchronization validation failed: ${validation.errors.join('; ')}`);
  const removedBelowMinimum = removeBelowMinimumCandidates(outDir);
  const report = {
    schemaVersion: 1,
    generatedAt,
    minimumProcessedVersion: MINIMUM_VERSION,
    latestDiscoveredCoreVersion: manifest.latestCoreVersion,
    latestReleaseByMajor: manifest.latestReleaseByMajor,
    duplicateBranches: discovered.duplicates,
    versionsAdded: entries.filter((entry) => entry.action === 'added').map((entry) => entry.version),
    versionsUpdated: entries.filter((entry) => entry.action === 'updated').map((entry) => entry.version),
    versionsSkippedUnchanged: entries.filter((entry) => entry.action === 'skipped').map((entry) => entry.version),
    incrementalComparisons: entries.map((entry) => `${entry.previousVersion} -> ${entry.version}`),
    removedBelowMinimum,
    existingKnowledgeLocations: knowledgeLocations,
    validation: Object.assign({}, validation, {
      patchVersionsPreserved: true,
      normalizedVersionsUnique: true,
      semanticallySorted: true,
      previousVersionsCorrect: true,
      fingerprintsCurrent: true,
      reviewedKnowledgePreserved: true,
      coreWorkingTreeUnchanged: true,
    }),
  };
  writeJsonAtomic(path.join(path.dirname(outDir), 'version-manifest.json'), manifest);
  writeJsonAtomic(path.join(path.dirname(outDir), 'synchronization-report.json'), report);
  const after = git.fingerprint(corePath);
  const drift = git.diffFingerprints(before, after);
  if (drift.length) throw new Error(`Core changed during synchronization: ${drift.join('; ')}`);
  return report;
}

if (require.main === module) {
  try {
    const flags = parseFlags(process.argv.slice(2));
    if (!flags['core-path']) throw new Error('specify --core-path <read-only Core checkout>');
    const result = sync(flags['core-path'], flags.out || DEFAULT_OUT, { skipFetch: Boolean(flags['skip-fetch']) });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  sync,
  versionParts,
  normalizeVersion,
  compareVersion,
  branchVersion,
  discoverReleases,
  fingerprintMatches,
};

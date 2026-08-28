'use strict';
/*
 * Exact target package-version resolution from the local NGO Core repository.
 *
 * Authority order (highest first):
 *   1. approved Core version/compatibility manifest (config policy)
 *   2. target Core package.json exact versions
 *   3. target Core lockfile resolved versions
 *   4. published package metadata (deferred; recorded as REQUIRES_RESEARCH)
 *   5. isolated dependency-resolution probe (deferred)
 *   6. developer escalation
 *
 * Produces target-package-manifest.yaml and package-alignment-map.yaml.
 * Never introduces `latest`, wildcards, or broad ranges. Never mutates files.
 */
const path = require('path');
const core = require('./core');
const repos = require('./repos');

const CLASSIFICATIONS = [
  'CORE_REQUIRED_DIRECT', 'CORE_REQUIRED_PEER', 'CLIENT_AND_CORE_SHARED',
  'CLIENT_ONLY_KEEP', 'CORE_ONLY_NOT_APPLICABLE', 'REMOVED_FROM_CORE_REVIEW',
  'VERSION_CONFLICT', 'REQUIRES_RESEARCH',
];

function readDeps(pkg) {
  return {
    dependencies: (pkg && pkg.dependencies) || {},
    devDependencies: (pkg && pkg.devDependencies) || {},
    peerDependencies: (pkg && pkg.peerDependencies) || {},
  };
}

function isNgoPkg(name) {
  return /^@ngo\//i.test(name) || /^ngo-/i.test(name) || /(^|\/)ngo[-/]/i.test(name);
}

/**
 * Decide whether a Core dev dependency is client-relevant. We do NOT add every
 * Core devDependency to the client. Only build/test/lint toolchain packages the
 * client also owns are considered; the rest are CORE_ONLY_NOT_APPLICABLE.
 */
const CLIENT_RELEVANT_DEV = [
  /^@angular\/cli$/, /^@angular-devkit\//, /^@angular\/compiler-cli$/,
  /^typescript$/, /^tslib$/, /^rxjs$/, /^zone\.js$/, /^@ngrx\//,
  /^karma/, /^jasmine/, /^jest/, /^@types\//, /^eslint/, /^@angular-eslint\//,
  /^@typescript-eslint\//,
];
function isClientRelevantDev(name) { return CLIENT_RELEVANT_DEV.some((re) => re.test(name)); }

function run(ctx) {
  const clientPkgRead = repos.readPackageJson(ctx.clientPath);
  const corePkgRead = repos.readPackageJson(ctx.corePath);
  const clientPkg = clientPkgRead.ok ? clientPkgRead.data : {};
  const corePkg = corePkgRead.ok ? corePkgRead.data : {};

  const clientDeps = readDeps(clientPkg);
  const coreDeps = readDeps(corePkg);
  const policy = ctx.policy || {};
  const exactAlignmentRequired = policy.requireExactAlignment !== false; // default true
  const coreLock = repos.detectLockfile(ctx.corePath);
  const clientLock = repos.detectLockfile(ctx.clientPath);

  const uncertainties = [];
  const packages = [];
  const seen = new Set();

  const clientDeclared = (name) => repos.declaredVersion(clientPkg, name);
  const coreDeclared = (name) => repos.declaredVersion(corePkg, name);

  function coreResolved(name) {
    if (!coreLock) return null;
    return repos.lockResolvedVersion(coreLock.abs, coreLock.manager, name);
  }
  function clientResolved(name) {
    return repos.resolvedVersion(ctx.clientPath, name) ||
      (clientLock ? repos.lockResolvedVersion(clientLock.abs, clientLock.manager, name) : null);
  }

  function classifyAndAdd(name, coreSection) {
    if (seen.has(name)) return;
    seen.add(name);
    const cDecl = clientDeclared(name);
    const coDecl = coreDeclared(name);
    const cResolved = clientResolved(name);
    const coResolved = coreResolved(name);
    const corePeer = repos.declaredVersion(corePkg, name);

    let classification, selected, action, risk = 'MEDIUM', validation = 'install resolves + build passes';
    const coreVersion = coDecl ? coDecl.version : null;

    if (coreSection === 'peerDependencies') {
      classification = 'CORE_REQUIRED_PEER';
      selected = coreVersion;
      action = cDecl ? 'align-to-core-peer' : 'review-peer-need';
    } else if (cDecl && coDecl) {
      // Shared package.
      const cmp = core.compareVersions(cDecl.version, coDecl.version);
      if (cmp === null) {
        classification = 'VERSION_CONFLICT';
        selected = coreVersion;
        action = 'research-version-strings';
        risk = 'HIGH';
        uncertainties.push(mkUnc(name, `unparseable version(s): client ${cDecl.version} / core ${coDecl.version}`, 'HIGH'));
      } else if (cmp === 0) {
        classification = 'CLIENT_AND_CORE_SHARED';
        selected = coreVersion;
        action = 'already-aligned';
        risk = 'LOW';
      } else {
        classification = exactAlignmentRequired ? 'CLIENT_AND_CORE_SHARED' : 'VERSION_CONFLICT';
        selected = coreVersion;
        action = 'align-to-core-exact';
        if (cmp > 0) {
          // client is AHEAD of core: flag rather than silently downgrade.
          risk = 'HIGH';
          uncertainties.push(mkUnc(name, `client ${cDecl.version} is ahead of Core ${coDecl.version}; downgrade needs confirmation`, 'HIGH'));
          action = 'confirm-downgrade';
        }
      }
    } else if (!cDecl && coDecl) {
      // Core has it, client doesn't.
      if (coreSection === 'devDependencies' && !isClientRelevantDev(name)) {
        classification = 'CORE_ONLY_NOT_APPLICABLE';
        selected = null;
        action = 'do-not-add';
        risk = 'LOW';
      } else {
        classification = 'CORE_REQUIRED_DIRECT';
        selected = coreVersion;
        action = 'add-if-client-requires-direct-ownership';
        uncertainties.push(mkUnc(name, `Core requires ${name}@${coreVersion}; confirm client needs direct ownership`, 'MEDIUM'));
      }
    } else {
      return; // neither has it
    }

    if (!core.isExactVersion(selected) && selected != null) {
      // Core declared a range; prefer resolved lock version if exact.
      if (core.isExactVersion(coResolved)) selected = coResolved;
      else {
        uncertainties.push(mkUnc(name, `Core declares non-exact version '${coreVersion}' and lockfile did not yield an exact version`, 'MEDIUM'));
        classification = classification === 'CLIENT_AND_CORE_SHARED' ? 'REQUIRES_RESEARCH' : classification;
        action = 'resolve-exact-version';
      }
    }

    packages.push({
      name,
      clientDeclaredVersion: cDecl ? cDecl.version : null,
      clientResolvedVersion: cResolved || null,
      targetCoreDeclaredVersion: coreVersion,
      targetCoreResolvedVersion: coResolved || null,
      targetPeerRange: (corePeer && corePeer.section === 'peerDependencies') ? corePeer.version : null,
      classification,
      selectedTargetVersion: selected,
      action,
      evidence: `core:package.json#${coreSection || (coDecl ? coDecl.section : 'n/a')}` + (coResolved ? `; core-lock:${coreLock.file}` : ''),
      risk,
      validation,
    });
  }

  // 1) All Core direct deps.
  for (const name of Object.keys(coreDeps.dependencies)) classifyAndAdd(name, 'dependencies');
  // 2) Core peer deps.
  for (const name of Object.keys(coreDeps.peerDependencies)) classifyAndAdd(name, 'peerDependencies');
  // 3) Core dev deps (filtered).
  for (const name of Object.keys(coreDeps.devDependencies)) classifyAndAdd(name, 'devDependencies');

  // 4) Client-only packages: preserve.
  for (const section of ['dependencies', 'devDependencies']) {
    for (const name of Object.keys(clientDeps[section])) {
      if (seen.has(name)) continue;
      seen.add(name);
      const cDecl = clientDeclared(name);
      const inCore = !!coreDeclared(name);
      let classification = 'CLIENT_ONLY_KEEP';
      let action = 'preserve';
      let risk = 'LOW';
      if (isNgoPkg(name) && !inCore) {
        classification = 'REMOVED_FROM_CORE_REVIEW';
        action = 'investigate-removal';
        risk = 'HIGH';
        uncertainties.push(mkUnc(name, `client ngo-* package ${name} is absent from target Core; may be removed/renamed`, 'HIGH'));
      }
      packages.push({
        name,
        clientDeclaredVersion: cDecl ? cDecl.version : null,
        clientResolvedVersion: clientResolved(name) || null,
        targetCoreDeclaredVersion: null,
        targetCoreResolvedVersion: null,
        targetPeerRange: null,
        classification,
        selectedTargetVersion: cDecl ? cDecl.version : null,
        action,
        evidence: 'client:package.json (absent from core)',
        risk,
        validation: 'preserved; no change unless evidence requires',
      });
    }
  }

  const conflicts = packages.filter((p) => p.classification === 'VERSION_CONFLICT' || p.classification === 'REQUIRES_RESEARCH');
  const reviews = packages.filter((p) => p.classification === 'REMOVED_FROM_CORE_REVIEW');
  let status = 'RESOLVED';
  if (!corePkgRead.ok) status = 'BLOCKED_INVALID_CORE_PACKAGE';
  else if (conflicts.length || reviews.length) status = 'RESOLVED_WITH_UNCERTAINTY';

  const manifest = {
    schemaVersion: 1,
    generatedAt: core.nowIso(),
    targetVersion: ctx.targetVersion || repos.corePackageVersion(corePkg),
    coreName: corePkg.name || null,
    coreLockfile: coreLock ? coreLock.file : null,
    authorityOrder: ['approved-manifest', 'core-package.json', 'core-lockfile', 'published-metadata', 'resolution-probe', 'developer'],
    exactAlignmentRequired,
    packages: packages
      .filter((p) => p.selectedTargetVersion != null && p.classification !== 'CORE_ONLY_NOT_APPLICABLE' && p.classification !== 'CLIENT_ONLY_KEEP')
      .map((p) => ({ name: p.name, version: p.selectedTargetVersion, classification: p.classification, action: p.action })),
  };
  const alignmentMap = { schemaVersion: 1, generatedAt: core.nowIso(), status, packages };

  return { manifest, alignmentMap, uncertainties, status };
}

let uncSeq = 0;
function mkUnc(pkg, statement, impact) {
  return {
    id: `UNC-PKG-${String(++uncSeq).padStart(3, '0')}`,
    statement: `${pkg}: ${statement}`,
    category: 'UNCERTAIN', impact, confidence: 'LOW',
    evidenceAvailable: 'core package.json/lockfile', evidenceMissing: 'confirmed compatibility',
    resolutionOptions: ['inspect Core lockfile', 'published metadata probe', 'developer confirmation'],
    requiredCapability: 'inspect-npm-registry-metadata',
    blocksMutation: impact === 'HIGH' || impact === 'CRITICAL',
    blocksCompletion: false,
    owner: 'agent', status: 'OPEN', finalResolution: null,
  };
}

module.exports = { run, CLASSIFICATIONS };

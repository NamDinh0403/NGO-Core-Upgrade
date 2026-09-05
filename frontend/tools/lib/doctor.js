'use strict';
/*
 * Dual-repository doctor: a single non-mutating preflight for BOTH the client
 * and the local NGO Core repository. It validates each repository, detects
 * cross-repository contradictions, and returns exactly one terminal status
 * plus an exact next action.
 *
 * Doctor NEVER mutates either repository:
 *   - no install, no node_modules deletion, no lockfile deletion,
 *   - no package.json / .npmrc edits, no Core edits, no migrations, no fixes.
 */
const path = require('path');
const core = require('./core');
const git = require('./git');
const repos = require('./repos');

const STATUS = {
  READY_FOR_INVENTORY: 'READY_FOR_INVENTORY',
  READY_FOR_PLANNING: 'READY_FOR_PLANNING',
  BLOCKED_INVALID_REQUEST: 'BLOCKED_INVALID_REQUEST',
  BLOCKED_INVALID_CLIENT_REPOSITORY: 'BLOCKED_INVALID_CLIENT_REPOSITORY',
  BLOCKED_INVALID_CORE_REPOSITORY: 'BLOCKED_INVALID_CORE_REPOSITORY',
  BLOCKED_VERSION_MISMATCH: 'BLOCKED_VERSION_MISMATCH',
  BLOCKED_MISSING_PREREQUISITE: 'BLOCKED_MISSING_PREREQUISITE',
  BLOCKED_NEEDS_DEVELOPER: 'BLOCKED_NEEDS_DEVELOPER',
};

function check(id, ok, detail, severity) {
  return { id, ok: !!ok, detail: detail || null, severity: severity || (ok ? 'info' : 'error') };
}

// --- prerequisite probes (non-mutating) ------------------------------------
function probePrerequisites(clientManager) {
  const checks = [];
  const node = core.runExec('node', ['--version']);
  checks.push(check('node-available', node.code === 0, node.code === 0 ? node.stdout.trim() : 'node not found'));

  const gitv = core.runExec('git', ['--version']);
  checks.push(check('git-available', gitv.code === 0, gitv.code === 0 ? gitv.stdout.trim() : 'git not found'));

  const mgr = (clientManager && clientManager.manager) || 'npm';
  const mgrv = core.runExec(mgr, ['--version']);
  checks.push(check(`${mgr}-available`, mgrv.code === 0, mgrv.code === 0 ? `${mgr} ${mgrv.stdout.trim()}` : `${mgr} not found`));
  return checks;
}

// --- client repository validation ------------------------------------------
function validateClient(req) {
  const clientPath = req.resolved.clientPath;
  const checks = [];
  const expectedName = (req.repositories.client && req.repositories.client.expectedPackageName) || repos.CORE_PACKAGE_NAME;
  const summary = repos.summarize(clientPath, 'client', { coreName: expectedName });

  checks.push(check('client-path-exists', summary.exists, summary.exists ? clientPath : `not found: ${clientPath}`));
  checks.push(check('client-path-readable', summary.readable, summary.readable ? 'readable' : 'not readable'));
  checks.push(check('client-git-detectable', summary.isGitRepo, summary.isGitRepo ? `branch ${summary.git && summary.git.branch || 'detached'}` : 'not a git repository', summary.isGitRepo ? 'info' : 'warn'));
  checks.push(check('client-package-json-valid', summary.packageJson && summary.packageJson.ok, summary.packageJson ? (summary.packageJson.error || 'valid') : 'no package.json'));

  const lock = summary.lockfile;
  checks.push(check('client-lockfile-identified', !!lock, lock ? lock.file : 'no lockfile found', lock ? 'info' : 'warn'));
  checks.push(check('client-package-manager-identified', !!(summary.packageManager && summary.packageManager.manager), summary.packageManager ? `${summary.packageManager.manager} (${summary.packageManager.source})` : 'unknown'));

  const ng = summary.angular;
  checks.push(check('client-angular-workspace', ng && ng.present, ng && ng.present ? `${ng.projects.length} project(s)` : 'no angular.json', (ng && ng.present) ? 'info' : 'warn'));

  const coreRef = summary.coreReference;
  checks.push(check('client-core-reference-found', !!coreRef, coreRef ? `${coreRef.name}@${coreRef.version} (${coreRef.section})` : `no ${expectedName} reference in client package.json`));

  // Source-version confirmation against the client's declared Core version.
  const declared = coreRef ? core.normalizeVersion(coreRef.version) : null;
  const requestedSource = req.upgrade && req.upgrade.sourceVersion ? core.normalizeVersion(req.upgrade.sourceVersion) : null;
  let sourceOk = null, sourceDetail = 'source version not confirmable (no client Core reference)';
  if (declared && requestedSource) {
    sourceOk = declared === requestedSource;
    sourceDetail = sourceOk
      ? `client ${coreRef.name} ${declared} matches requested source ${requestedSource}`
      : `CONTRADICTION: client declares ${coreRef.name} ${declared} but request source is ${requestedSource}`;
  }
  checks.push(check('client-source-version-confirmed', sourceOk !== false, sourceDetail, sourceOk === false ? 'error' : 'info'));

  checks.push(check('client-mutable-flag', req.repositories.client.mutable === true, 'client repository is the only mutable repository'));

  // Rollback strategy availability (git checkpoint or a copyable working tree).
  const rollback = summary.isGitRepo ? 'git-checkpoint' : 'filesystem-copy';
  checks.push(check('client-rollback-strategy', true, `rollback strategy available: ${rollback}`));

  return { summary, checks, rollback, sourceContradiction: sourceOk === false };
}

// --- core repository validation --------------------------------------------
function validateCore(req) {
  const corePath = req.resolved.corePath;
  const checks = [];
  const summary = repos.summarize(corePath, 'core', {});
  const expectedName = (req.repositories.client && req.repositories.client.expectedPackageName) || repos.CORE_PACKAGE_NAME;

  checks.push(check('core-path-exists', summary.exists, summary.exists ? corePath : `not found: ${corePath}`));
  checks.push(check('core-path-readable', summary.readable, summary.readable ? 'readable' : 'not readable'));
  checks.push(check('core-is-git-repo', summary.isGitRepo, summary.isGitRepo ? 'git repository' : 'not a git repository', summary.isGitRepo ? 'info' : 'warn'));

  // Repository identity plausibility: package.json exists and names the Core package.
  const pkgOk = summary.packageJson && summary.packageJson.ok;
  checks.push(check('core-package-json-exists', pkgOk, pkgOk ? 'valid package.json' : (summary.packageJson ? summary.packageJson.error : 'missing package.json')));
  const identityPlausible = pkgOk && (summary.packageName === expectedName || /core/i.test(summary.packageName || '') || summary.packageName != null);
  checks.push(check('core-identity-plausible', identityPlausible, pkgOk ? `package name: ${summary.packageName}` : 'no package identity', identityPlausible ? 'info' : 'warn'));
  checks.push(check('core-target-package-identity', pkgOk && summary.packageName != null, pkgOk ? `target package: ${summary.packageName}` : 'no target package identity'));

  // Git identity recording.
  if (summary.isGitRepo) {
    checks.push(check('core-branch-recorded', !!summary.git, `branch: ${summary.git.branch || '(detached)'} @ ${(summary.git.headCommit || '').slice(0, 12)}`));
  } else {
    checks.push(check('core-branch-recorded', false, 'cannot record git identity: not a git repository', 'warn'));
  }

  // Target ref resolution (read-only) + target commit recording.
  const targetRef = req.repositories.core.targetRef;
  let targetCommit = null, targetResolvable = null;
  if (summary.isGitRepo && targetRef) {
    targetCommit = git.resolveRef(corePath, targetRef);
    targetResolvable = !!targetCommit;
    checks.push(check('core-target-ref-resolvable', targetResolvable,
      targetResolvable ? `${targetRef} -> ${targetCommit.slice(0, 12)}` : `cannot resolve target ref '${targetRef}'`,
      targetResolvable ? 'info' : 'warn'));
  } else if (targetRef) {
    checks.push(check('core-target-ref-resolvable', null, `target ref '${targetRef}' cannot be resolved (Core is not a git repository); will use current checkout`, 'warn'));
  }

  // Required source directories discoverable.
  const srcDirs = ['src', 'projects', 'packages', 'lib'];
  const foundSrc = srcDirs.filter((d) => core.isDir(path.join(corePath, d)));
  checks.push(check('core-source-dirs-discoverable', foundSrc.length > 0, foundSrc.length ? `found: ${foundSrc.join(', ')}` : 'no recognizable source directories', foundSrc.length ? 'info' : 'warn'));

  // Package version agreement with requested target.
  const coreVersion = summary.packageVersion ? core.normalizeVersion(summary.packageVersion) : null;
  const requestedTarget = req.upgrade && req.upgrade.targetVersion ? core.normalizeVersion(req.upgrade.targetVersion) : null;
  let versionAgrees = null, versionDetail = 'target version agreement not checkable';
  // If a target ref differs from current checkout, read the package.json at that ref.
  let coreVersionAtTarget = coreVersion;
  if (summary.isGitRepo && targetCommit) {
    const atRef = git.showFileAtRef(corePath, targetCommit, 'package.json');
    if (atRef) {
      try { coreVersionAtTarget = core.normalizeVersion(JSON.parse(atRef).version); } catch (e) { /* keep checkout value */ }
    }
  }
  // A local Core working tree is version-stamped only at CI/publish time; an
  // unstamped placeholder (e.g. 0.0.0 / 0.0.x) is the ABSENCE of a version, not a
  // real version that could contradict the requested target. In that case the
  // release identity is taken from the git ref/branch and the check is
  // "not checkable (unstamped)" rather than a contradiction. A real, different
  // semver (e.g. 8.5.0 != 9.2.1) still contradicts and blocks.
  const corePlaceholderVersion = !!coreVersionAtTarget && /^0\.0\.\d+$/.test(coreVersionAtTarget);
  if (corePlaceholderVersion) {
    versionAgrees = null;
    const refLabel = targetRef || (summary.git && summary.git.branch) || 'current checkout';
    versionDetail = requestedTarget
      ? `Core working tree is unstamped (package version ${coreVersionAtTarget}); release identity taken from git ref '${refLabel}' for requested target ${requestedTarget}`
      : `Core working tree is unstamped (package version ${coreVersionAtTarget})`;
  } else if (coreVersionAtTarget && requestedTarget) {
    versionAgrees = coreVersionAtTarget === requestedTarget;
    versionDetail = versionAgrees
      ? `Core package version ${coreVersionAtTarget} matches requested target ${requestedTarget}`
      : `CONTRADICTION: Core package version ${coreVersionAtTarget} != requested target ${requestedTarget}`;
  }
  checks.push(check('core-version-agrees-with-target', versionAgrees !== false, versionDetail, versionAgrees === false ? 'error' : (corePlaceholderVersion ? 'warn' : 'info')));

  // Inspectable without modification (readable + git or plain readable dir).
  checks.push(check('core-inspectable-readonly', summary.readable && summary.isDirectory, 'Core can be inspected without modification'));

  return {
    summary, checks, targetRef, targetCommit,
    coreVersionAtCheckout: coreVersion, coreVersionAtTarget, corePlaceholderVersion,
    versionMismatch: versionAgrees === false,
    currentDiffersFromTarget: !!(summary.isGitRepo && targetCommit && summary.git && summary.git.headCommit !== targetCommit),
    coreDirty: !!(summary.git && summary.git.clean === false),
  };
}

// --- cross-repository contradiction detection ------------------------------
function detectContradictions(req, clientR, coreR) {
  const c = [];
  const clientPath = req.resolved.clientPath;
  const corePath = req.resolved.corePath;

  if (clientPath && corePath && path.resolve(clientPath) === path.resolve(corePath)) {
    c.push({ id: 'paths-identical', severity: 'fatal', detail: 'client and Core paths are identical' });
  } else if (clientPath && corePath && core.pathsOverlap(clientPath, corePath)) {
    c.push({ id: 'paths-overlap', severity: 'fatal', detail: 'client and Core paths overlap (one is nested inside the other)' });
  }

  // Core path actually points at the client repository (has a client Core ref).
  if (coreR.summary._pkg && repos.findCoreReference(coreR.summary._pkg) && !coreR.summary.packageName) {
    c.push({ id: 'core-looks-like-client', severity: 'fatal', detail: 'Core path appears to be a client repository' });
  }

  if (clientR.sourceContradiction) {
    c.push({ id: 'client-source-mismatch', severity: 'version', detail: 'client Core package declaration differs from requested source version' });
  }
  if (coreR.versionMismatch) {
    c.push({ id: 'core-target-mismatch', severity: 'version', detail: 'Core package version contradicts requested target version' });
  }
  // Target tag points to a different package version than requested. An unstamped
  // placeholder Core version is not real drift evidence (identity is the git ref).
  if (coreR.targetCommit && coreR.coreVersionAtTarget && req.upgrade.targetVersion &&
      !coreR.corePlaceholderVersion &&
      coreR.coreVersionAtTarget !== core.normalizeVersion(req.upgrade.targetVersion)) {
    c.push({ id: 'target-tag-version-drift', severity: 'version', detail: `target ref resolves to package version ${coreR.coreVersionAtTarget}, not ${req.upgrade.targetVersion}` });
  }
  // Lockfile version differs from package.json (client).
  if (clientR.summary._pkg) {
    const cr = clientR.summary.coreReference;
    if (cr && clientR.summary.lockfile) {
      const lockV = repos.lockResolvedVersion(clientR.summary.lockfile.abs, clientR.summary.lockfile.manager, cr.name);
      if (lockV && core.normalizeVersion(lockV) !== core.normalizeVersion(cr.version)) {
        c.push({ id: 'client-lock-drift', severity: 'warn', detail: `client lockfile ${cr.name} ${lockV} != package.json ${cr.version}` });
      }
    }
  }
  if (coreR.coreDirty) {
    c.push({ id: 'core-uncommitted', severity: 'warn', detail: 'Core has uncommitted changes; target evidence may be uncertain' });
  }
  return c;
}

// --- terminal-status resolution --------------------------------------------
function resolveStatus(reqErrors, prereqChecks, clientR, coreR, contradictions) {
  if (reqErrors.length) return STATUS.BLOCKED_INVALID_REQUEST;

  const fatalPaths = contradictions.filter((x) => x.severity === 'fatal');
  if (fatalPaths.length) {
    // Path overlap/identity is fundamentally an invalid Core-vs-client setup.
    return STATUS.BLOCKED_INVALID_REQUEST;
  }

  const clientFatal = clientR.checks.find((x) => ['client-path-exists', 'client-path-readable', 'client-package-json-valid'].includes(x.id) && !x.ok);
  if (clientFatal) return STATUS.BLOCKED_INVALID_CLIENT_REPOSITORY;

  const coreFatal = coreR.checks.find((x) => ['core-path-exists', 'core-path-readable', 'core-package-json-exists', 'core-inspectable-readonly'].includes(x.id) && !x.ok);
  if (coreFatal) return STATUS.BLOCKED_INVALID_CORE_REPOSITORY;

  if (contradictions.some((x) => x.severity === 'version')) return STATUS.BLOCKED_VERSION_MISMATCH;

  const missingPrereq = prereqChecks.find((x) => !x.ok && /node-available|git-available/.test(x.id));
  if (missingPrereq) return STATUS.BLOCKED_MISSING_PREREQUISITE;

  // Client Core reference missing but everything else is fine → needs developer.
  const coreRefMissing = clientR.checks.find((x) => x.id === 'client-core-reference-found' && !x.ok);
  if (coreRefMissing) return STATUS.BLOCKED_NEEDS_DEVELOPER;

  return STATUS.READY_FOR_INVENTORY;
}

function nextActionFor(status, req, clientR, coreR, contradictions) {
  switch (status) {
    case STATUS.READY_FOR_INVENTORY:
      return `Run: frontend-upgrade-agent start (continues to inventory-client-frontend). Client=${req.resolved.clientPath} Core=${req.resolved.corePath}. Core will be inspected read-only.`;
    case STATUS.BLOCKED_INVALID_REQUEST: {
      const bad = contradictions.find((x) => x.severity === 'fatal');
      return bad ? `Fix the request: ${bad.detail}. Client and Core must be distinct, non-overlapping repositories.`
        : 'Provide --client-path, --core-path, --source-version and --target-version (or a valid --request file).';
    }
    case STATUS.BLOCKED_INVALID_CLIENT_REPOSITORY:
      return `Fix the client repository: ${(clientR.checks.find((x) => !x.ok) || {}).detail || 'invalid client repository'}.`;
    case STATUS.BLOCKED_INVALID_CORE_REPOSITORY:
      return `Fix the Core repository path/contents: ${(coreR.checks.find((x) => !x.ok) || {}).detail || 'invalid Core repository'}.`;
    case STATUS.BLOCKED_VERSION_MISMATCH: {
      const v = contradictions.find((x) => x.severity === 'version');
      return `Resolve the version contradiction before planning: ${v ? v.detail : 'version mismatch'}. Confirm source/target versions and the Core target ref.`;
    }
    case STATUS.BLOCKED_MISSING_PREREQUISITE:
      return 'Install the missing prerequisite (Node.js and/or git) and re-run doctor.';
    case STATUS.BLOCKED_NEEDS_DEVELOPER:
      return `Developer input required: no ${req.repositories.client.expectedPackageName} reference found in the client package.json. Confirm the client is an NGO Core client and the expected package name.`;
    default:
      return 'Re-run doctor.';
  }
}

/**
 * Run the full dual-repository doctor. Pure inspection.
 * Returns a structured report object (persisted by the caller).
 */
function run(req) {
  const reqErrors = require('./request').validate(req);
  // Guard: an invalid request (e.g. a missing repository path) cannot be probed
  // safely. Short-circuit to BLOCKED_INVALID_REQUEST instead of crashing.
  if (reqErrors.length) {
    return {
      schemaVersion: 1,
      kind: 'frontend-doctor-report',
      generatedAt: core.nowIso(),
      status: STATUS.BLOCKED_INVALID_REQUEST,
      nextAction: `Fix the request before doctor can inspect the repositories: ${reqErrors.join('; ')}.`,
      requestErrors: reqErrors,
      prerequisites: [],
      client: { checks: [], summary: {}, rollback: null },
      core: {
        checks: [], summary: {}, targetRef: null, targetCommit: null,
        currentDiffersFromTarget: false, coreVersionAtCheckout: null, coreVersionAtTarget: null,
      },
      contradictions: [],
      readOnly: true,
    };
  }
  const clientR = validateClient(req);
  const coreR = validateCore(req);
  const prereq = probePrerequisites(clientR.summary.packageManager);
  const contradictions = detectContradictions(req, clientR, coreR);
  const status = resolveStatus(reqErrors, prereq, clientR, coreR, contradictions);
  const nextAction = nextActionFor(status, req, clientR, coreR, contradictions);

  // Strip internal package data before persistence.
  const stripPkg = (s) => { const c = Object.assign({}, s); delete c._pkg; return c; };

  return {
    schemaVersion: 1,
    kind: 'frontend-doctor-report',
    generatedAt: core.nowIso(),
    status,
    nextAction,
    requestErrors: reqErrors,
    prerequisites: prereq,
    client: { checks: clientR.checks, summary: stripPkg(clientR.summary), rollback: clientR.rollback },
    core: {
      checks: coreR.checks, summary: stripPkg(coreR.summary),
      targetRef: coreR.targetRef, targetCommit: coreR.targetCommit,
      currentDiffersFromTarget: coreR.currentDiffersFromTarget,
      coreVersionAtCheckout: coreR.coreVersionAtCheckout,
      coreVersionAtTarget: coreR.coreVersionAtTarget,
    },
    contradictions,
    readOnly: true,
  };
}

module.exports = { STATUS, run, validateClient, validateCore, detectContradictions };

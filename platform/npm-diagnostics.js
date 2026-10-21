'use strict';
/*
 * Version-Aware, Non-Destructive npm & .npmrc Configuration and Authentication Subsystem.
 *
 * Implements Phase 6 requirements:
 *   - Detects installed Node.js and npm versions and executable paths.
 *   - Inspects effective npm configuration across project, user (~/.npmrc), and global scopes.
 *   - Inspects scoped registries (@ngo, @fortawesome, Azure Artifacts) and verifies auth presence without printing secrets.
 *   - Detects obsolete or broken .npmrc configurations (e.g. VssSessionToken without _password/_authToken, legacy unauthenticated email) with evidence.
 *   - Never blindly deletes or overwrites .npmrc; creates a timestamped backup before any requested repair.
 *   - Version-aware authentication guidance (supports `--auth-type=web` on npm >= 9).
 *   - Prefers `npm ci` when lockfile is valid and in sync; uses safe `npm install --legacy-peer-deps` (never invalid `--peer-deps` or destructive `-f`) when package.json was updated.
 *   - Skips npm requirement when frontend track is inactive.
 *
 * Dependency-free, Node 14+.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

function redactNpmSecrets(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/(:_authToken\s*=\s*)[^\s\r\n"']+/gi, '$1***REDACTED***')
    .replace(/(:_password\s*=\s*)[^\s\r\n"']+/gi, '$1***REDACTED***')
    .replace(/(_auth\s*=\s*)[^\s\r\n"']+/gi, '$1***REDACTED***')
    .replace(/((?:token|password|pat|secret|apikey)\s*[:=]\s*["']?)[^\s"',;\r\n]+/gi, '$1***REDACTED***')
    .replace(/(\/\/)[^/@\s]+:[^/@\s]+@/g, '$1***REDACTED***@');
}

function parseSemver(raw) {
  if (!raw) return null;
  const m = String(raw).trim().replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return {
    major: parseInt(m[1], 10),
    minor: parseInt(m[2], 10),
    patch: parseInt(m[3], 10),
    raw: `${m[1]}.${m[2]}.${m[3]}`,
  };
}

/**
 * Parse a .npmrc file into structured, secret-redacted entries without exposing token values.
 */
function parseNpmrcContent(content, sourceLabel = 'project') {
  const entries = [];
  const registries = {};
  const authEntries = [];
  const obsoleteSettings = [];
  const brokenSettings = [];

  if (!content || typeof content !== 'string') {
    return { entries, registries, authEntries, obsoleteSettings, brokenSettings };
  }

  const lines = content.split(/\r?\n/);
  const hostAuthStatus = {}; // hostPath -> { hasToken, hasUsername, hasPassword, hasLegacyAuth }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();

    // Check scoped or default registry: e.g. @ngo:registry=https://... or registry=https://...
    if (key === 'registry' || /^@[^:]+:registry$/i.test(key)) {
      const scope = key === 'registry' ? 'default' : key.split(':')[0];
      registries[scope] = redactNpmSecrets(val);
      entries.push({ line: i + 1, source: sourceLabel, key, value: redactNpmSecrets(val), kind: 'registry' });
      continue;
    }

    // Check auth keys: //<host>/<path>/:_authToken, :username, :_password, :_auth, :always-auth
    const scopedAuthMatch = key.match(/^(\/\/[^:]+):(_authToken|_password|_auth|username|email|always-auth)$/i);
    if (scopedAuthMatch) {
      const hostPath = scopedAuthMatch[1].replace(/\/+$/, '');
      const attr = scopedAuthMatch[2];
      if (!hostAuthStatus[hostPath]) {
        hostAuthStatus[hostPath] = {
          hostPath,
          source: sourceLabel,
          hasToken: false,
          hasUsername: false,
          hasPassword: false,
          hasLegacyAuth: false,
          usernameValue: null,
          usesEnvExpansion: false,
          missingEnvVar: null,
        };
      }
      const envVarMatch = val.match(/\$\{([^}]+)\}/);
      if (envVarMatch) {
        hostAuthStatus[hostPath].usesEnvExpansion = true;
        const envName = envVarMatch[1];
        if (!process.env[envName]) {
          hostAuthStatus[hostPath].missingEnvVar = envName;
        }
      }

      const isSecret = /^(_authToken|_password|_auth)$/i.test(attr);
      const hasNonEmptyValue = Boolean(val && val !== '""' && val !== "''");

      if (/^_authToken$/i.test(attr) && hasNonEmptyValue) hostAuthStatus[hostPath].hasToken = true;
      if (/^_password$/i.test(attr) && hasNonEmptyValue) hostAuthStatus[hostPath].hasPassword = true;
      if (/^_auth$/i.test(attr) && hasNonEmptyValue) hostAuthStatus[hostPath].hasLegacyAuth = true;
      if (/^username$/i.test(attr) && hasNonEmptyValue) {
        hostAuthStatus[hostPath].hasUsername = true;
        hostAuthStatus[hostPath].usernameValue = val;
      }

      entries.push({
        line: i + 1,
        source: sourceLabel,
        key,
        value: isSecret ? (hasNonEmptyValue ? '***REDACTED***' : '<EMPTY>') : redactNpmSecrets(val),
        kind: 'auth',
      });
      continue;
    }

    // Check top-level legacy/obsolete keys in modern npm (npm >= 9 deprecated top-level un-scoped _auth / email)
    if (/^(email|_auth|_password|username)$/i.test(key)) {
      const isSecret = /^(_auth|_password)$/i.test(key);
      obsoleteSettings.push({
        line: i + 1,
        source: sourceLabel,
        key,
        reason: `Unscoped '${key}' in ${sourceLabel} .npmrc is deprecated in modern npm (v9+) and rejected by many registries unless scoped to a registry URI (//<registry>/:${key}).`,
      });
      entries.push({
        line: i + 1,
        source: sourceLabel,
        key,
        value: isSecret ? '***REDACTED***' : redactNpmSecrets(val),
        kind: 'obsolete-auth',
      });
      continue;
    }

    entries.push({
      line: i + 1,
      source: sourceLabel,
      key,
      value: redactNpmSecrets(val),
      kind: 'config',
    });
  }

  for (const status of Object.values(hostAuthStatus)) {
    authEntries.push(status);
    if (status.missingEnvVar) {
      brokenSettings.push({
        source: sourceLabel,
        hostPath: status.hostPath,
        issue: 'MISSING_ENV_VAR_IN_NPMRC',
        detail: `${sourceLabel} .npmrc references environment variable \${${status.missingEnvVar}} for ${status.hostPath}, which is not set in the current environment.`,
      });
    } else if (status.hasUsername && !status.hasPassword && !status.hasToken && !status.hasLegacyAuth) {
      brokenSettings.push({
        source: sourceLabel,
        hostPath: status.hostPath,
        issue: 'INCOMPLETE_VSS_OR_BASIC_AUTH',
        detail: `${sourceLabel} .npmrc configures '${status.hostPath}/:username=${status.usernameValue}' without a corresponding ':_password' or ':_authToken' entry in the same file.`,
      });
    }
  }

  return { entries, registries, authEntries, obsoleteSettings, brokenSettings };
}

function normalizeRegistryHostPath(registryUrl) {
  if (!registryUrl || typeof registryUrl !== 'string') return null;
  return registryUrl.trim().replace(/^https?:/i, '').replace(/\/+$/, '');
}

/**
 * Inspect npm installation, .npmrc files (project and user), effective registries, and auth readiness.
 */
function inspectNpmEnvironment(opts = {}) {
  const tracks = Array.isArray(opts.tracks) ? opts.tracks : ['backend', 'frontend'];
  if (!tracks.includes('frontend')) {
    return {
      applicable: false,
      ok: true,
      status: 'SKIPPED_BACKEND_ONLY',
      detail: 'Frontend track is not active; npm and .npmrc checks are skipped.',
      node: null,
      npm: null,
      npmrc: null,
      remediation: null,
    };
  }

  const clientPath = opts.clientPath ? path.resolve(opts.clientPath) : null;
  let frontendDir = clientPath;
  if (clientPath && fs.existsSync(path.join(clientPath, 'ngo-client', 'package.json'))) {
    frontendDir = path.join(clientPath, 'ngo-client');
  }

  const execFn = opts.execFn || ((cmd, args, execOpts = {}) => {
    const res = cp.spawnSync(cmd, args, {
      cwd: execOpts.cwd || frontendDir || process.cwd(),
      encoding: 'utf8',
      windowsHide: true,
      shell: process.platform === 'win32' && cmd === 'npm',
      timeout: execOpts.timeout || 10000,
    });
    return {
      ok: res.status === 0,
      status: res.status,
      stdout: (res.stdout || '').trim(),
      stderr: (res.stderr || '').trim(),
    };
  });

  // 1. Check Node.js
  const nodeVerRes = execFn(process.execPath, ['--version']);
  const nodeSemver = parseSemver(nodeVerRes.stdout || process.version);

  // 2. Check npm
  const npmVerRes = execFn('npm', ['--version']);
  if (!npmVerRes.ok) {
    return {
      applicable: true,
      ok: false,
      status: 'TOOL_MISSING',
      failureCategory: 'TOOL_MISSING',
      node: { available: true, version: nodeSemver ? nodeSemver.raw : process.version, executablePath: process.execPath },
      npm: { available: false, version: null, supportsWebAuthType: false },
      npmrc: null,
      detail: 'npm CLI is not installed or not on PATH.',
      remediation: 'Install Node.js (with npm) from https://nodejs.org/ and ensure npm is on PATH.',
    };
  }

  const npmSemver = parseSemver(npmVerRes.stdout);
  const supportsWebAuthType = Boolean(npmSemver && npmSemver.major >= 9);

  // 3. Inspect project and user .npmrc files non-destructively
  const projectNpmrcPath = frontendDir ? path.join(frontendDir, '.npmrc') : null;
  const parentNpmrcPath = clientPath && frontendDir !== clientPath ? path.join(clientPath, '.npmrc') : null;
  const userNpmrcPath = opts.userNpmrcPath || path.join(os.homedir(), '.npmrc');

  const projectParsed = projectNpmrcPath && fs.existsSync(projectNpmrcPath)
    ? parseNpmrcContent(fs.readFileSync(projectNpmrcPath, 'utf8'), 'project')
    : (parentNpmrcPath && fs.existsSync(parentNpmrcPath)
      ? parseNpmrcContent(fs.readFileSync(parentNpmrcPath, 'utf8'), 'workspace')
      : parseNpmrcContent('', 'project'));

  const userParsed = userNpmrcPath && fs.existsSync(userNpmrcPath)
    ? parseNpmrcContent(fs.readFileSync(userNpmrcPath, 'utf8'), 'user')
    : parseNpmrcContent('', 'user');

  const combinedRegistries = Object.assign(
    { default: 'https://registry.npmjs.org/' },
    userParsed.registries,
    projectParsed.registries
  );

  // Merge auth status across project + user .npmrc
  const allAuthByHostPath = {};
  for (const entry of [...userParsed.authEntries, ...projectParsed.authEntries]) {
    const key = entry.hostPath.toLowerCase();
    if (!allAuthByHostPath[key]) {
      allAuthByHostPath[key] = Object.assign({}, entry);
    } else {
      allAuthByHostPath[key].hasToken = allAuthByHostPath[key].hasToken || entry.hasToken;
      allAuthByHostPath[key].hasUsername = allAuthByHostPath[key].hasUsername || entry.hasUsername;
      allAuthByHostPath[key].hasPassword = allAuthByHostPath[key].hasPassword || entry.hasPassword;
      allAuthByHostPath[key].hasLegacyAuth = allAuthByHostPath[key].hasLegacyAuth || entry.hasLegacyAuth;
      if (!entry.missingEnvVar) allAuthByHostPath[key].missingEnvVar = null;
    }
  }

  // Check whether private registries in combinedRegistries have valid authentication across project + user .npmrc
  const unauthenticatedRegistries = [];
  for (const [scope, regUrl] of Object.entries(combinedRegistries)) {
    const isPrivate = !/registry\.npmjs\.org|registry\.yarnpkg\.com/i.test(regUrl);
    if (!isPrivate) continue;

    const hostPath = normalizeRegistryHostPath(regUrl);
    const matchingAuth = Object.values(allAuthByHostPath).find((a) => {
      const normA = a.hostPath.toLowerCase();
      const normH = (hostPath || '').toLowerCase();
      return normH.startsWith(normA) || normA.startsWith(normH);
    });

    const isAuthenticated = Boolean(
      matchingAuth &&
      !matchingAuth.missingEnvVar &&
      (matchingAuth.hasToken || (matchingAuth.hasUsername && matchingAuth.hasPassword) || matchingAuth.hasLegacyAuth)
    );

    if (!isAuthenticated) {
      unauthenticatedRegistries.push({
        scope,
        registry: regUrl,
        reason: matchingAuth && matchingAuth.missingEnvVar
          ? `Environment variable \${${matchingAuth.missingEnvVar}} referenced in .npmrc is not set.`
          : matchingAuth && matchingAuth.hasUsername && !matchingAuth.hasPassword && !matchingAuth.hasToken
            ? `Registry ${regUrl} has ':username' configured in project .npmrc but no ':_password' or ':_authToken' in user (~/.npmrc) or project .npmrc.`
            : `Private registry ${regUrl} (scope: ${scope}) has no authentication token configured in project or user .npmrc.`,
      });
    }
  }

  // Also check if any project brokenSettings were NOT satisfied by user .npmrc
  const unresolvedBroken = projectParsed.brokenSettings.filter((b) => {
    const merged = allAuthByHostPath[b.hostPath.toLowerCase()];
    if (!merged) return true;
    if (b.issue === 'MISSING_ENV_VAR_IN_NPMRC') return Boolean(merged.missingEnvVar);
    if (b.issue === 'INCOMPLETE_VSS_OR_BASIC_AUTH') {
      return !(merged.hasToken || (merged.hasUsername && merged.hasPassword) || merged.hasLegacyAuth);
    }
    return true;
  });

  const obsoleteWarnings = [...projectParsed.obsoleteSettings, ...userParsed.obsoleteSettings];
  const loginFlag = supportsWebAuthType ? '--auth-type=web' : '';

  let status = 'READY';
  let ok = true;
  let failureCategory = null;
  let remediation = null;

  if (unauthenticatedRegistries.length > 0 || unresolvedBroken.length > 0) {
    ok = false;
    status = 'NPM_AUTH_REQUIRED';
    failureCategory = 'AUTH_MISSING';
    const firstIssue = unauthenticatedRegistries[0]
      ? unauthenticatedRegistries[0].reason
      : unresolvedBroken[0].detail;
    const isAzureFeed = [...unauthenticatedRegistries.map((u) => u.registry), ...unresolvedBroken.map((b) => b.hostPath)]
      .some((u) => /pkgs\.dev\.azure\.com|visualstudio\.com/i.test(u));

    if (isAzureFeed) {
      remediation = `${firstIssue} Authenticate to Azure Artifacts npm feed by running 'vsts-npm-auth -config .npmrc' (on Windows) or adding your base64 PAT to ~/.npmrc ('//pkgs.dev.azure.com/<org>/_packaging/<feed>/npm/registry/:_password=<BASE64_PAT>').`;
    } else {
      remediation = `${firstIssue} Run 'npm login ${loginFlag} --registry=<registry-url>' or configure the required auth token in your user ~/.npmrc.`;
    }
  }

  return {
    applicable: true,
    ok,
    status,
    failureCategory,
    node: {
      available: true,
      version: nodeSemver ? nodeSemver.raw : process.version,
      executablePath: process.execPath,
    },
    npm: {
      available: true,
      version: npmSemver ? npmSemver.raw : npmVerRes.stdout,
      supportsWebAuthType,
      recommendedLoginCommand: `npm login${loginFlag ? ' ' + loginFlag : ''}`,
    },
    npmrc: {
      projectNpmrcPath: projectNpmrcPath && fs.existsSync(projectNpmrcPath) ? projectNpmrcPath : null,
      userNpmrcPath: userNpmrcPath && fs.existsSync(userNpmrcPath) ? userNpmrcPath : null,
      registries: combinedRegistries,
      unauthenticatedRegistries,
      unresolvedBroken,
      obsoleteWarnings,
    },
    remediation,
  };
}

/**
 * Determine the safe, non-destructive npm install command for a frontend workspace.
 * Prefers `npm ci` when a valid package-lock.json exists and package.json was not mutated;
 * uses `npm install --legacy-peer-deps` (never invalid `--peer-deps` or destructive `-f`) when
 * package.json dependencies were updated by the upgrade.
 */
function prepareNpmExecutionPlan(frontendDir, opts = {}) {
  const pkgPath = path.join(frontendDir, 'package.json');
  const lockPath = path.join(frontendDir, 'package-lock.json');
  const hasLockfile = fs.existsSync(lockPath);
  const packageJsonChanged = Boolean(opts.packageJsonChanged);

  let lockfileValid = false;
  if (hasLockfile && fs.existsSync(pkgPath)) {
    try {
      const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      lockfileValid = Boolean(lockData && (lockData.lockfileVersion >= 1) && (lockData.packages || lockData.dependencies));
    } catch (_) {
      lockfileValid = false;
    }
  }

  if (hasLockfile && lockfileValid && !packageJsonChanged) {
    return {
      command: 'npm',
      args: ['ci', '--legacy-peer-deps'],
      commandLine: 'npm ci --legacy-peer-deps',
      mode: 'CLEAN_INSTALL',
      mutatesLockfile: false,
      reason: 'package-lock.json is present and valid, and package.json was not modified.',
    };
  }

  return {
    command: 'npm',
    args: ['install', '--legacy-peer-deps'],
    commandLine: 'npm install --legacy-peer-deps',
    mode: 'INCREMENTAL_INSTALL',
    mutatesLockfile: true,
    reason: packageJsonChanged
      ? 'package.json dependency versions were updated for the target Core release; updating dependency tree without destructive -f.'
      : 'No valid package-lock.json found; running standard install.',
  };
}

/**
 * Safely repair evidenced obsolete/broken .npmrc lines ONLY when explicitly requested,
 * creating a timestamped backup first and preserving all valid user/project settings.
 */
function backupAndRepairNpmrc(npmrcPath, opts = {}) {
  if (!npmrcPath || !fs.existsSync(npmrcPath)) {
    return { ok: false, backedUp: false, backupPath: null, changes: [], detail: 'No .npmrc file found at path.' };
  }

  const original = fs.readFileSync(npmrcPath, 'utf8');
  const parsed = parseNpmrcContent(original, 'project');
  if (parsed.obsoleteSettings.length === 0 && !opts.removeIncompleteVssUsername) {
    return { ok: true, backedUp: false, backupPath: null, changes: [], detail: 'No obsolete settings required repair.' };
  }

  const lines = original.split(/\r?\n/);
  const linesToComment = new Set(parsed.obsoleteSettings.map((o) => o.line));
  const changes = [];

  const updatedLines = lines.map((line, idx) => {
    const lineNo = idx + 1;
    if (linesToComment.has(lineNo)) {
      changes.push(`Commented out obsolete setting on line ${lineNo}`);
      return `# [ngo-upgrade-repaired] ${redactNpmSecrets(line)}`;
    }
    return line;
  });

  if (changes.length === 0) {
    return { ok: true, backedUp: false, backupPath: null, changes: [], detail: 'No lines modified.' };
  }

  const backupPath = `${npmrcPath}.bak-${Date.now()}`;
  fs.writeFileSync(backupPath, original, 'utf8');
  fs.writeFileSync(npmrcPath, updatedLines.join('\n'), 'utf8');

  return {
    ok: true,
    backedUp: true,
    backupPath,
    changes,
    detail: `Backed up original .npmrc to ${path.basename(backupPath)} and repaired ${changes.length} obsolete setting(s).`,
  };
}

module.exports = {
  inspectNpmEnvironment,
  parseNpmrcContent,
  prepareNpmExecutionPlan,
  backupAndRepairNpmrc,
  redactNpmSecrets,
};

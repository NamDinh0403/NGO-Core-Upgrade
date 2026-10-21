'use strict';
/*
 * GitHub CLI (gh) and Git Repository Access Diagnostics Subsystem.
 *
 * Implements Phase 3 requirements:
 *   1. Detects the authentication method currently used by the workflow (gh CLI, Git credential helper, SSH, env token).
 *   2. Verifies the relevant GitHub account, host, protocol, and token scopes without exposing tokens.
 *   3. Verifies actual access to the required repository via `git ls-remote` (non-interactive).
 *   4. Distinguishes GitHub CLI authentication (`gh auth status`) from Git's own credential handling (`credential.helper` / SSH).
 *   5. Provides official interactive login and Git credential helper setup guidance (`gh auth login`, `gh auth setup-git`).
 *   6. Handles expired credentials, missing permissions, organization SSO restrictions, and network failures.
 *
 * Security:
 *   - Never prints, logs, or returns access tokens or credential contents.
 *   - Never modifies Git remotes or overwrites existing credentials automatically.
 *
 * Dependency-free, Node 14+.
 */

const cp = require('child_process');
const fs = require('fs');
const path = require('path');

function redactSecrets(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/gh[pousr]_[A-Za-z0-9_]{16,255}/g, '***REDACTED_GH_TOKEN***')
    .replace(/github_pat_[A-Za-z0-9_]{16,255}/g, '***REDACTED_GH_PAT***')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, '$1***REDACTED***')
    .replace(/(Basic\s+)[A-Za-z0-9+/=]+/gi, '$1***REDACTED***')
    .replace(/((?:token|password|pat|secret|apikey)\s*[:=]\s*["']?)[^\s"',;]+/gi, '$1***REDACTED***')
    .replace(/(\/\/)[^/@\s]+:[^/@\s]+@/g, '$1***REDACTED***@');
}

function locateExecutable(cmd) {
  const probe = process.platform === 'win32' ? 'where' : 'which';
  const res = cp.spawnSync(probe, [cmd], { encoding: 'utf8', windowsHide: true, timeout: 5000 });
  if (res.status === 0 && res.stdout) {
    const first = res.stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)[0];
    if (first) return first;
  }
  return null;
}

function runCommand(cmd, args, opts = {}) {
  const res = cp.spawnSync(cmd, args, {
    cwd: opts.cwd || process.cwd(),
    encoding: 'utf8',
    windowsHide: true,
    timeout: opts.timeout || 10000,
    env: Object.assign({}, process.env, {
      GIT_TERMINAL_PROMPT: '0',
      GCM_INTERACTIVE: 'never',
      GH_PROMPT_DISABLED: '1',
    }, opts.env || {}),
  });
  return {
    ok: res.status === 0,
    exitCode: res.status,
    stdout: redactSecrets((res.stdout || '').trim()),
    stderr: redactSecrets((res.stderr || '').trim()),
    timedOut: Boolean(res.error && res.error.code === 'ETIMEDOUT'),
    error: res.error ? redactSecrets(res.error.message || String(res.error)) : null,
  };
}

/**
 * Parse remote URL into host, protocol, and owner/repo slug.
 */
function parseGitRemoteUrl(remoteUrl) {
  if (!remoteUrl || typeof remoteUrl !== 'string') return null;
  const clean = redactSecrets(remoteUrl.trim());

  // HTTPS: https://github.com/owner/repo.git or https://dev.azure.com/org/proj/_git/repo
  const httpsMatch = clean.match(/^(https?):\/\/(?:[^/@]+@)?([^/:]+)(?::\d+)?\/(.+?)(?:\.git)?$/i);
  if (httpsMatch) {
    return {
      raw: clean,
      protocol: httpsMatch[1].toLowerCase(),
      host: httpsMatch[2].toLowerCase(),
      repoPath: httpsMatch[3],
    };
  }

  // SSH SCP-like: git@github.com:owner/repo.git
  const sshScpMatch = clean.match(/^(?:([^@]+)@)?([^:]+):(.+?)(?:\.git)?$/);
  if (sshScpMatch && !clean.includes('://')) {
    return {
      raw: clean,
      protocol: 'ssh',
      host: sshScpMatch[2].toLowerCase(),
      repoPath: sshScpMatch[3],
    };
  }

  // SSH URL: ssh://git@github.com/owner/repo.git
  const sshUrlMatch = clean.match(/^ssh:\/\/(?:[^/@]+@)?([^/:]+)(?::\d+)?\/(.+?)(?:\.git)?$/i);
  if (sshUrlMatch) {
    return {
      raw: clean,
      protocol: 'ssh',
      host: sshUrlMatch[1].toLowerCase(),
      repoPath: sshUrlMatch[2],
    };
  }

  return { raw: clean, protocol: 'unknown', host: null, repoPath: null };
}

/**
 * Inspect GitHub CLI (`gh`) installation and authentication state.
 */
function inspectGhCli(opts = {}) {
  const execFn = opts.execFn || runCommand;
  const targetHost = opts.host || 'github.com';

  const verRes = execFn('gh', ['--version'], { timeout: 5000 });
  if (!verRes.ok) {
    return {
      installed: false,
      executablePath: null,
      version: null,
      authenticated: false,
      host: targetHost,
      activeAccount: null,
      protocol: null,
      scopes: [],
      status: 'TOOL_MISSING',
      detail: 'GitHub CLI (gh) is not installed or not on PATH.',
      remediation: 'Install GitHub CLI from https://cli.github.com/ (or winget install --id GitHub.cli), then run: gh auth login',
    };
  }

  const verMatch = verRes.stdout.match(/gh version\s+([^\s]+)/i);
  const version = verMatch ? verMatch[1] : verRes.stdout.split(/\r?\n/)[0];
  const executablePath = opts.locateFn ? opts.locateFn('gh') : locateExecutable('gh');

  const authRes = execFn('gh', ['auth', 'status', '--hostname', targetHost], { timeout: 8000 });
  const combined = `${authRes.stdout}\n${authRes.stderr}`.trim();

  // Extract account, protocol, and token scopes without ever exposing token values
  const accountMatch =
    combined.match(/Logged in to [^\s]+ account\s+([^\s(]+)/i) ||
    combined.match(/Logged in to [^\s]+ as\s+([^\s(]+)/i);
  const protocolMatch = combined.match(/Git operations protocol:\s*([^\s\r\n]+)/i);
  const scopesMatch = combined.match(/Token scopes:\s*([^\r\n]+)/i);

  const activeAccount = accountMatch ? accountMatch[1].replace(/['"]/g, '') : null;
  const protocol = protocolMatch ? protocolMatch[1].replace(/['"]/g, '').toLowerCase() : null;
  const scopes = scopesMatch
    ? scopesMatch[1].split(',').map((s) => s.replace(/['"\s]/g, '')).filter(Boolean)
    : [];

  if (authRes.ok) {
    return {
      installed: true,
      executablePath,
      version,
      authenticated: true,
      host: targetHost,
      activeAccount,
      protocol,
      scopes,
      status: 'AUTHENTICATED',
      detail: `GitHub CLI authenticated to ${targetHost}${activeAccount ? ` as ${activeAccount}` : ''}.`,
      remediation: null,
    };
  }

  const isExpiredOrInvalid = /expired|invalid|bad credentials|authentication failed|token.*no longer valid/i.test(combined);
  const isNetwork = /could not resolve|network|timeout|dial tcp|connectex|proxy|tls/i.test(combined);

  return {
    installed: true,
    executablePath,
    version,
    authenticated: false,
    host: targetHost,
    activeAccount,
    protocol,
    scopes,
    status: isNetwork ? 'NETWORK_ERROR' : (isExpiredOrInvalid ? 'CREDENTIALS_EXPIRED' : 'NOT_AUTHENTICATED'),
    detail: combined.split(/\r?\n/)[0] || `Not logged in to ${targetHost} via GitHub CLI.`,
    remediation: isNetwork
      ? `Verify network/proxy access to ${targetHost} and retry.`
      : `Authenticate GitHub CLI interactively by running: gh auth login --hostname ${targetHost} --web && gh auth setup-git`,
  };
}

/**
 * Inspect Git configuration (identity, credential helper, remotes) and verify actual remote access.
 */
function verifyGitAndGitHubAccess(opts = {}) {
  const execFn = opts.execFn || runCommand;
  const repoPath = opts.repoPath && fs.existsSync(opts.repoPath) ? path.resolve(opts.repoPath) : null;

  // 1. Check git binary
  const gitVerRes = execFn('git', ['--version'], { timeout: 5000 });
  if (!gitVerRes.ok) {
    return {
      ok: false,
      status: 'TOOL_MISSING',
      failureCategory: 'TOOL_MISSING',
      git: { installed: false, version: null, executablePath: null },
      gh: null,
      repositoryAccess: null,
      remediation: 'Install Git (>= 2.20.0) from https://git-scm.com/ and ensure it is on PATH.',
    };
  }

  const gitVerMatch = gitVerRes.stdout.match(/(\d+\.\d+\.\d+)/);
  const gitVersion = gitVerMatch ? gitVerMatch[1] : gitVerRes.stdout;
  const gitExe = opts.locateFn ? opts.locateFn('git') : locateExecutable('git');

  // 2. Check Git author identity & credential helper
  const gitArgsPrefix = repoPath ? ['-C', repoPath] : [];
  const nameRes = execFn('git', [...gitArgsPrefix, 'config', 'user.name']);
  const emailRes = execFn('git', [...gitArgsPrefix, 'config', 'user.email']);
  const helperRes = execFn('git', [...gitArgsPrefix, 'config', '--get-all', 'credential.helper']);
  const credentialHelpers = helperRes.ok && helperRes.stdout
    ? helperRes.stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
    : [];

  let remoteInfo = null;
  if (opts.remoteUrl) {
    remoteInfo = parseGitRemoteUrl(opts.remoteUrl);
  } else if (repoPath) {
    const remRes = execFn('git', ['-C', repoPath, 'config', '--get', 'remote.origin.url']);
    if (remRes.ok && remRes.stdout) {
      remoteInfo = parseGitRemoteUrl(remRes.stdout);
    }
  }

  const targetHost = (remoteInfo && remoteInfo.host && remoteInfo.host.includes('github'))
    ? remoteInfo.host
    : (opts.host || 'github.com');

  // 3. Check GitHub CLI status for targetHost
  const ghStatus = inspectGhCli({ execFn, locateFn: opts.locateFn, host: targetHost });

  // 4. Verify actual Git repository access (`git ls-remote`) if a remote URL or repo with remote is available
  let repositoryAccess = {
    checked: false,
    remoteUrl: remoteInfo ? remoteInfo.raw : null,
    protocol: remoteInfo ? remoteInfo.protocol : null,
    host: remoteInfo ? remoteInfo.host : null,
    accessible: null,
    status: 'NO_REMOTE_CONFIGURED',
    detail: 'No remote origin URL configured on repository; operating in local-only Git mode.',
    remediation: null,
  };

  if (remoteInfo && remoteInfo.raw && opts.probeRemote !== false) {
    const lsArgs = repoPath
      ? ['-C', repoPath, 'ls-remote', '--heads', 'origin']
      : ['ls-remote', '--heads', remoteInfo.raw];

    const lsRes = execFn('git', lsArgs, { timeout: opts.remoteTimeoutMs || 10000 });
    const combinedErr = `${lsRes.stderr}\n${lsRes.stdout}`.trim();

    if (lsRes.ok) {
      repositoryAccess = {
        checked: true,
        remoteUrl: remoteInfo.raw,
        protocol: remoteInfo.protocol,
        host: remoteInfo.host,
        accessible: true,
        status: 'ACCESS_VERIFIED',
        detail: `Verified Git remote access to ${remoteInfo.raw} via ${remoteInfo.protocol.toUpperCase()}.`,
        remediation: null,
      };
    } else {
      let status = 'REMOTE_ACCESS_FAILED';
      let remediation = 'Verify Git credentials and repository permissions.';

      if (lsRes.timedOut || /could not resolve host|unable to access.*couldn't connect|network is unreachable|connection timed out|proxy|ssl|tls/i.test(combinedErr)) {
        status = 'NETWORK_OR_PROXY_ERROR';
        remediation = `Network or proxy error reaching ${remoteInfo.host || remoteInfo.raw}. Check VPN, proxy settings (git config --get http.proxy), and DNS connectivity.`;
      } else if (remoteInfo.protocol === 'ssh' && /permission denied \(publickey\)|host key verification failed|could not read from remote repository/i.test(combinedErr)) {
        status = 'SSH_AUTH_FAILED';
        remediation = `Git remote uses SSH (${remoteInfo.raw}), but SSH authentication failed. Note: 'gh auth login' alone does not configure SSH keys unless an SSH key is uploaded. Either add your SSH key to the ssh-agent / GitHub account (gh ssh-key add) or switch to HTTPS with 'gh auth setup-git'.`;
      } else if (/SAML|SSO|organization.*enforced|resource protected by organization/i.test(combinedErr)) {
        status = 'ORG_SSO_AUTHORIZATION_REQUIRED';
        remediation = `Your account is authenticated, but organization SAML SSO authorization is required for ${remoteInfo.raw}. Run: gh auth refresh -h ${targetHost} -s read:org,repo and authorize SSO in the browser.`;
      } else if (/403|permission to .* denied|write access to repository not granted/i.test(combinedErr)) {
        status = 'INSUFFICIENT_PERMISSIONS';
        remediation = `Authenticated identity lacks permission to access ${remoteInfo.raw} (HTTP 403). Verify that account ${ghStatus.activeAccount || '(current Git user)'} has read access to the organization and repository.`;
      } else if (/repository not found|404/i.test(combinedErr)) {
        status = 'REPO_NOT_FOUND_OR_NO_ACCESS';
        remediation = `Repository ${remoteInfo.raw} returned Not Found (or private repo access denied). Verify the repository URL and that your authenticated account has access.`;
      } else if (/authentication failed|invalid username or token|could not read username|terminal prompts disabled|401/i.test(combinedErr)) {
        if (ghStatus.authenticated && remoteInfo.protocol.startsWith('http')) {
          status = 'GH_AUTH_OK_BUT_GIT_CREDENTIAL_MISSING';
          remediation = `GitHub CLI (gh) is logged in as ${ghStatus.activeAccount || 'active user'}, but Git HTTPS credential helper failed for ${remoteInfo.raw}. Run: gh auth setup-git --hostname ${targetHost}`;
        } else {
          status = 'GIT_AUTH_MISSING_OR_EXPIRED';
          remediation = `Git authentication failed for ${remoteInfo.raw}. Run: gh auth login --hostname ${targetHost} --web && gh auth setup-git`;
        }
      }

      repositoryAccess = {
        checked: true,
        remoteUrl: remoteInfo.raw,
        protocol: remoteInfo.protocol,
        host: remoteInfo.host,
        accessible: false,
        status,
        detail: combinedErr.split(/\r?\n/)[0] || 'Failed to access remote Git repository.',
        remediation,
      };
    }
  }

  const authorConfigured = Boolean(nameRes.ok && nameRes.stdout && emailRes.ok && emailRes.stdout);
  const usesGhCredentialHelper = credentialHelpers.some((h) => /gh\s+auth\s+git-credential/i.test(h));
  const usesGcm = credentialHelpers.some((h) => /manager|gcm|wincred|osxkeychain|store/i.test(h));

  // Determine overall status
  let overallOk = authorConfigured;
  let overallStatus = 'READY';
  let failureCategory = null;
  let primaryRemediation = null;

  if (!authorConfigured) {
    overallOk = false;
    overallStatus = 'GIT_IDENTITY_MISSING';
    failureCategory = 'CONFIG_INVALID';
    primaryRemediation = 'Configure Git author identity: git config --global user.name "Your Name" && git config --global user.email "you@example.com"';
  } else if (repositoryAccess.checked && !repositoryAccess.accessible && opts.requireRemoteAccess) {
    overallOk = false;
    overallStatus = repositoryAccess.status;
    failureCategory =
      repositoryAccess.status === 'NETWORK_OR_PROXY_ERROR' ? 'NETWORK_FAILURE' :
      repositoryAccess.status === 'INSUFFICIENT_PERMISSIONS' || repositoryAccess.status === 'ORG_SSO_AUTHORIZATION_REQUIRED' ? 'PERMISSION_DENIED' :
      'AUTH_MISSING';
    primaryRemediation = repositoryAccess.remediation;
  }

  return {
    ok: overallOk,
    status: overallStatus,
    failureCategory,
    git: {
      installed: true,
      executablePath: gitExe,
      version: gitVersion,
      userName: nameRes.ok ? nameRes.stdout : null,
      userEmail: emailRes.ok ? emailRes.stdout : null,
      authorConfigured,
      credentialHelpers,
      usesGhCredentialHelper,
      usesGcm,
    },
    gh: ghStatus,
    repositoryAccess,
    remediation: primaryRemediation || repositoryAccess.remediation || ghStatus.remediation || null,
  };
}

module.exports = {
  inspectGhCli,
  verifyGitAndGitHubAccess,
  parseGitRemoteUrl,
  redactSecrets,
  locateExecutable,
};

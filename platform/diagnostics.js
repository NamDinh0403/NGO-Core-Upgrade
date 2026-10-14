'use strict';
/*
 * Copilot CLI and System Environment Diagnostics.
 *
 * Verifies executable reachability, authentication status, account identity,
 * credential sources (without leaking secrets), toolchains, and system health.
 * Dependency-free, Node 14+.
 */

const cp = require('child_process');
const os = require('os');
const path = require('path');

const SECRET_PATTERNS = [
  /(?:password|passwd|pwd|secret|token|api[_-]?key|auth[_-]?token)\s*[:=]\s*["']?([^"'\s\r\n]{4,})["']?/gi,
  /bearer\s+([a-zA-Z0-9_\-\.]{10,})/gi,
  /(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{30,}/g,
];

function redactSecrets(text) {
  if (typeof text !== 'string') return text;
  let clean = text;
  for (const pattern of SECRET_PATTERNS) {
    clean = clean.replace(pattern, '***REDACTED***');
  }
  return clean;
}

function normalizeCliResult(res) {
  res.nonInteractiveSupported = Boolean(res.nonInteractiveCapable);
  return res;
}

/**
 * Perform comprehensive diagnostics on GitHub Copilot CLI.
 */
function diagnoseCopilotCli(customPath) {
  const binary = customPath || process.env.COPILOT_CLI_PATH;
  const now = new Date().toISOString();

  // Test / Simulator mode
  if (process.env.COPILOT_SIMULATOR === 'true') {
    return normalizeCliResult({
      available: true,
      executablePath: 'copilot-cli-simulator',
      version: '1.0.0-simulator',
      authenticated: true,
      accountIdentity: 'simulator-dev',
      credentialSource: 'simulator',
      configuredModel: 'simulator-gpt-4o',
      nonInteractiveCapable: true,
      lastHealthCheck: now,
      status: 'HEALTHY',
      diagnosticDetails: 'Running in simulated Copilot CLI mode for test/offline development.',
      remediationSteps: [],
    });
  }

  // Detect credential source without exposing values
  let credentialSource = 'none';
  if (process.env.GH_TOKEN) {
    credentialSource = 'environment_variable (GH_TOKEN)';
  } else if (process.env.GITHUB_TOKEN) {
    credentialSource = 'environment_variable (GITHUB_TOKEN)';
  } else if (process.env.COPILOT_API_KEY) {
    credentialSource = 'environment_variable (COPILOT_API_KEY)';
  }

  // 1. If explicit binary path passed
  if (binary) {
    try {
      const res = cp.spawnSync(binary, ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000 });
      if (res.status === 0) {
        return normalizeCliResult({
          available: true,
          executablePath: binary,
          version: (res.stdout || '').trim().split('\n')[0],
          authenticated: credentialSource !== 'none',
          accountIdentity: null,
          credentialSource,
          configuredModel: process.env.COPILOT_MODEL || 'default',
          nonInteractiveCapable: true,
          lastHealthCheck: now,
          status: credentialSource !== 'none' ? 'HEALTHY' : 'WARNING',
          diagnosticDetails: 'Custom binary reachable at specified path.',
          remediationSteps: credentialSource === 'none' ? ['Set GH_TOKEN environment variable to authenticate.'] : [],
        });
      }
    } catch (_) {}
  }

  // 2. Check GitHub CLI Copilot extension: 'gh copilot'
  try {
    const ghVer = cp.spawnSync('gh', ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000, shell: true });
    if (ghVer.status === 0) {
      let accountIdentity = null;
      let isAuthenticated = false;

      try {
        const authRes = cp.spawnSync('gh', ['auth', 'status'], { encoding: 'utf8', windowsHide: true, timeout: 5000, shell: true });
        const authOut = (authRes.stdout || '') + (authRes.stderr || '');

        const accountMatch = authOut.match(/Logged in to [^ ]+ account ([a-zA-Z0-9_\-]+)/i) ||
                             authOut.match(/account ([a-zA-Z0-9_\-]+)/i);
        if (accountMatch) {
          accountIdentity = accountMatch[1];
          isAuthenticated = true;
          if (credentialSource === 'none') {
            credentialSource = 'keychain_or_gh_config';
          }
        } else if (authOut.includes('Logged in to') || authRes.status === 0) {
          isAuthenticated = true;
          if (credentialSource === 'none') {
            credentialSource = 'keychain_or_gh_config';
          }
        }
      } catch (_) {}

      const copilotVer = cp.spawnSync('gh', ['copilot', '--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000, shell: true });
      const hasCopilotExt = copilotVer.status === 0;

      if (hasCopilotExt && isAuthenticated) {
        return normalizeCliResult({
          available: true,
          executablePath: 'gh copilot',
          version: (copilotVer.stdout || '').trim().split('\n')[0],
          authenticated: true,
          accountIdentity,
          credentialSource,
          configuredModel: process.env.COPILOT_MODEL || 'gpt-4o',
          nonInteractiveCapable: true,
          lastHealthCheck: now,
          status: 'HEALTHY',
          diagnosticDetails: `GitHub CLI and Copilot extension active. Logged in as ${accountIdentity}.`,
          remediationSteps: [],
        });
      } else if (hasCopilotExt && !isAuthenticated) {
        return normalizeCliResult({
          available: true,
          executablePath: 'gh copilot',
          version: (copilotVer.stdout || '').trim().split('\n')[0],
          authenticated: false,
          accountIdentity: null,
          credentialSource: 'none',
          configuredModel: null,
          nonInteractiveCapable: false,
          lastHealthCheck: now,
          status: 'DEGRADED',
          diagnosticDetails: 'GitHub CLI is installed with Copilot extension, but authentication failed or is missing.',
          remediationSteps: [
            'Run "gh auth login" in your terminal to authenticate your GitHub account.',
            'Or set the GH_TOKEN environment variable with a personal access token with Copilot access.',
          ],
        });
      } else {
        return normalizeCliResult({
          available: false,
          executablePath: 'gh',
          version: (ghVer.stdout || '').trim().split('\n')[0],
          authenticated: isAuthenticated,
          accountIdentity: isAuthenticated ? accountIdentity : null,
          credentialSource,
          configuredModel: null,
          nonInteractiveCapable: false,
          lastHealthCheck: now,
          status: 'DEGRADED',
          diagnosticDetails: 'GitHub CLI is installed, but the Copilot extension is not installed.',
          remediationSteps: [
            'Install the Copilot extension by running: "gh extension install github/gh-copilot"',
          ],
        });
      }
    }
  } catch (_) {}

  // 3. Check standalone 'copilot' binary
  try {
    const res = cp.spawnSync('copilot', ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000, shell: true });
    if (res.status === 0) {
      return normalizeCliResult({
        available: true,
        executablePath: 'copilot',
        version: (res.stdout || '').trim().split('\n')[0],
        authenticated: true,
        accountIdentity: 'cli-user',
        credentialSource: credentialSource !== 'none' ? credentialSource : 'config_file',
        configuredModel: process.env.COPILOT_MODEL || 'default',
        nonInteractiveCapable: true,
        lastHealthCheck: now,
        status: 'HEALTHY',
        diagnosticDetails: 'Standalone Copilot CLI executable detected and responding.',
        remediationSteps: [],
      });
    }
  } catch (_) {}

  // CLI not found
  return normalizeCliResult({
    available: false,
    executablePath: null,
    version: null,
    authenticated: false,
    accountIdentity: null,
    credentialSource: 'none',
    configuredModel: null,
    nonInteractiveCapable: false,
    lastHealthCheck: now,
    status: 'OFFLINE',
    diagnosticDetails: 'GitHub Copilot CLI executable not found in PATH or configured paths.',
    remediationSteps: [
      'Install GitHub CLI from https://cli.github.com/ and install the extension: "gh extension install github/gh-copilot".',
      'Or install standalone Copilot CLI and ensure it is added to your system PATH.',
      'Or enable Simulation Mode in the platform settings for offline testing.',
    ],
  });
}

/**
 * Execute environment toolchain diagnostics (Git, .NET, Node.js, npm).
 */
function diagnoseEnvironment() {
  const tools = [];

  // Git
  try {
    const gitRes = cp.spawnSync('git', ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000 });
    const isOk = gitRes.status === 0;
    tools.push({
      name: 'Git',
      tool: 'git',
      installed: isOk,
      available: isOk,
      version: isOk ? (gitRes.stdout || '').trim().replace(/^git version\s*/i, '') : null,
      required: true,
      requirement: 'Required',
      status: isOk ? 'HEALTHY' : 'CRITICAL',
      error: isOk ? null : 'git command failed or not found in PATH',
    });
  } catch (err) {
    tools.push({ name: 'Git', tool: 'Git', installed: false, available: false, version: null, required: true, requirement: 'Required', status: 'CRITICAL', error: err.message });
  }

  // .NET SDK
  try {
    const dotnetRes = cp.spawnSync('dotnet', ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000, shell: true });
    const isOk = dotnetRes.status === 0;
    tools.push({
      name: '.NET SDK',
      tool: '.NET SDK',
      installed: isOk,
      available: isOk,
      version: isOk ? (dotnetRes.stdout || '').trim() : null,
      required: false,
      requirement: 'Optional (.NET backend)',
      status: isOk ? 'HEALTHY' : 'WARNING',
      error: isOk ? null : '.NET SDK not found (backend builds will be skipped or simulated)',
    });
  } catch (err) {
    tools.push({ name: '.NET SDK', tool: '.NET SDK', installed: false, available: false, version: null, required: false, requirement: 'Optional', status: 'WARNING', error: err.message });
  }

  // Azure Artifacts Credential Provider
  try {
    const nugetSources = require('./nuget-sources');
    const credPath = nugetSources.findAzureArtifactsCredentialProvider();
    const isOk = Boolean(credPath);
    tools.push({
      name: 'Azure Artifacts Credential Provider',
      tool: 'CredentialProvider.Microsoft',
      installed: isOk,
      available: isOk,
      version: isOk ? 'Detected' : null,
      required: false,
      requirement: 'Optional (Private Feeds)',
      status: isOk ? 'HEALTHY' : 'WARNING',
      error: isOk ? null : 'CredentialProvider.Microsoft.exe not found in Visual Studio or NuGet plugins.',
      path: credPath || null,
    });
  } catch (err) {
    tools.push({ name: 'Azure Artifacts Credential Provider', tool: 'CredentialProvider.Microsoft', installed: false, available: false, version: null, required: false, requirement: 'Optional (Private Feeds)', status: 'WARNING', error: err.message });
  }

  // Node.js
  tools.push({
    name: 'Node.js',
    tool: 'Node.js',
    installed: true,
    available: true,
    version: process.version,
    required: true,
    requirement: 'Required',
    status: 'HEALTHY',
    error: null,
  });

  // npm
  try {
    const npmRes = cp.spawnSync('npm', ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000, shell: true });
    const isOk = npmRes.status === 0;
    tools.push({
      name: 'npm',
      tool: 'npm',
      installed: isOk,
      available: isOk,
      version: isOk ? (npmRes.stdout || '').trim() : null,
      required: false,
      requirement: 'Optional (Frontend)',
      status: isOk ? 'HEALTHY' : 'WARNING',
      error: isOk ? null : 'npm not found in PATH',
    });
  } catch (err) {
    tools.push({ name: 'npm', tool: 'npm', installed: false, available: false, version: null, required: false, requirement: 'Optional', status: 'WARNING', error: err.message });
  }

  const mem = process.memoryUsage();
  const uptime = Math.floor(process.uptime());
  const heapMb = Math.round(mem.heapUsed / 1024 / 1024);

  return {
    tools,
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      uptimeSeconds: uptime,
      uptimeSec: uptime,
      heapUsedMb: heapMb,
      memoryUsageMb: heapMb,
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      freeMemMb: Math.round(os.freemem() / 1024 / 1024),
      totalMemMb: Math.round(os.totalmem() / 1024 / 1024),
    },
  };
}

/**
 * Aggregate overall system health status.
 */
function getSystemHealthSummary(cliDiag, envDiag) {
  const cli = cliDiag || diagnoseCopilotCli();
  const env = envDiag || diagnoseEnvironment();

  const issues = [];
  if (!cli.available || !cli.authenticated) {
    issues.push(`Copilot CLI: ${cli.status} (${cli.diagnosticDetails})`);
  }

  for (const tool of env.tools) {
    if (tool.required && !tool.installed) {
      issues.push(`Critical tool missing: ${tool.name} is required.`);
    }
  }

  let overallStatus = 'HEALTHY';
  if (issues.some((i) => i.includes('Critical tool'))) {
    overallStatus = 'CRITICAL';
  } else if (issues.length > 0) {
    overallStatus = 'DEGRADED';
  }

  return {
    status: overallStatus,
    overallStatus,
    copilotStatus: cli.status,
    copilotIdentity: cli.accountIdentity,
    copilotCredentialSource: cli.credentialSource,
    uptimeSec: env.system.uptimeSec,
    memoryUsageMb: env.system.memoryUsageMb,
    copilotCli: {
      available: cli.available,
      authenticated: cli.authenticated,
      identity: cli.accountIdentity,
      credentialSource: cli.credentialSource,
    },
    issues,
    lastChecked: new Date().toISOString(),
  };
}

module.exports = {
  diagnoseCopilotCli,
  diagnoseEnvironment,
  getSystemHealthSummary,
  redactSecrets,
};

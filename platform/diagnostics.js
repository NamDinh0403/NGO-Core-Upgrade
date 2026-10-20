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
const fs = require('fs');

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
  cachedCliDiag = res;
  lastCliDiagTime = Date.now();
  return res;
}

/**
 * Locate executable path on system using where.exe on Windows.
 */
function findExecutablePath(cmd) {
  if (!cmd) return null;
  if (fs.existsSync(cmd) && fs.statSync(cmd).isFile()) {
    if (process.platform === 'win32' && !path.extname(cmd)) {
      if (fs.existsSync(`${cmd}.exe`)) return `${cmd}.exe`;
      if (fs.existsSync(`${cmd}.bat`)) return `${cmd}.bat`;
      if (fs.existsSync(`${cmd}.cmd`)) return `${cmd}.cmd`;
    }
    return cmd;
  }

  try {
    const isWindows = process.platform === 'win32';
    if (isWindows && (cmd === 'copilot' || cmd === 'copilot.exe')) {
      const homeDir = process.env.USERPROFILE || process.env.HOME || '';
      const localAppData = process.env.LOCALAPPDATA || (homeDir ? path.join(homeDir, 'AppData', 'Local') : '');
      const knownCopilotLocations = [
        path.join(localAppData, 'Microsoft', 'WinGet', 'Packages', 'GitHub.Copilot_Microsoft.Winget.Source_8wekyb3d8bbwe', 'copilot.exe'),
        path.join(localAppData, 'Microsoft', 'WinGet', 'Links', 'copilot.exe'),
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'GitHub Copilot', 'copilot.exe'),
        path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'GitHub Copilot', 'copilot.exe'),
      ];
      for (const loc of knownCopilotLocations) {
        if (fs.existsSync(loc)) return loc;
      }
    }

    const lookupCmd = isWindows ? 'where.exe' : 'which';
    const queryName = isWindows && !path.extname(cmd) ? `${cmd}.exe` : cmd;
    const res = cp.spawnSync(lookupCmd, [queryName], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 3000,
    });
    if (res.status === 0 && res.stdout) {
      const lines = res.stdout.trim().split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && fs.existsSync(trimmed)) {
          if (!isWindows || trimmed.toLowerCase().endsWith('.exe')) return trimmed;
        }
      }
    }

    const allRes = cp.spawnSync(lookupCmd, [cmd], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 3000,
    });
    if (allRes.status === 0 && allRes.stdout) {
      const lines = allRes.stdout.trim().split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && fs.existsSync(trimmed)) {
          if (!isWindows || trimmed.toLowerCase().endsWith('.exe') || trimmed.toLowerCase().endsWith('.bat') || trimmed.toLowerCase().endsWith('.cmd')) {
            return trimmed;
          }
        }
      }
    }
  } catch (_) {}

  return null;
}

let cachedCliDiag = null;
let lastCliDiagTime = 0;
const CLI_DIAG_TTL_MS = 60000;

let cachedEnvDiag = null;
let lastEnvDiagTime = 0;
const ENV_DIAG_TTL_MS = 60000;

function clearDiagnosticsCache() {
  cachedCliDiag = null;
  lastCliDiagTime = 0;
  cachedEnvDiag = null;
  lastEnvDiagTime = 0;
}

/**
 * Perform comprehensive diagnostics on GitHub Copilot CLI.
 */
function diagnoseCopilotCli(customPath, options) {
  options = options || {};
  if (!customPath && !options.bypassCache && !options.refresh && cachedCliDiag && (Date.now() - lastCliDiagTime < CLI_DIAG_TTL_MS)) {
    return cachedCliDiag;
  }

  let settingsLib = null;
  let appSettings = {};
  try {
    settingsLib = require('./settings');
    appSettings = settingsLib.loadSettings();
  } catch (_) {}

  const binary = customPath || process.env.COPILOT_CLI_PATH || appSettings.copilotCliPath;
  const now = new Date().toISOString();
  const chosenModel = appSettings.copilotModel || process.env.COPILOT_MODEL || 'gpt-4o';
  const isSimulation = process.env.COPILOT_SIMULATOR === 'true' || appSettings.simulationMode === true;

  // Test / Simulator mode
  if (isSimulation) {
    const simRes = normalizeCliResult({
      available: true,
      executablePath: 'copilot-cli-simulator',
      version: '1.0.0-simulator',
      authenticated: true,
      accountIdentity: 'simulator-dev',
      credentialSource: 'simulator',
      configuredModel: chosenModel,
      nonInteractiveCapable: true,
      lastHealthCheck: now,
      status: 'HEALTHY',
      diagnosticDetails: 'Running in simulated Copilot CLI mode for test/offline development.',
      remediationSteps: [],
      error: null,
    });
    cachedCliDiag = simRes;
    lastCliDiagTime = Date.now();
    return simRes;
  }

  // Detect credential source without exposing values
  let credentialSource = 'none';
  if (process.env.COPILOT_GITHUB_TOKEN) {
    credentialSource = 'environment_variable (COPILOT_GITHUB_TOKEN)';
  } else if (process.env.GH_TOKEN) {
    credentialSource = 'environment_variable (GH_TOKEN)';
  } else if (process.env.GITHUB_TOKEN) {
    credentialSource = 'environment_variable (GITHUB_TOKEN)';
  } else if (process.env.COPILOT_API_KEY) {
    credentialSource = 'environment_variable (COPILOT_API_KEY)';
  }

  // 1. If explicit binary path passed or configured
  if (binary) {
    try {
      const res = cp.spawnSync(binary, ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000 });
      if (res.status === 0 || (res.stdout && !res.error)) {
        const fullPath = findExecutablePath(binary) || binary;
        const verLine = (res.stdout || '').trim().split(/\r?\n/)[0];
        const isAuth = credentialSource !== 'none';
        return normalizeCliResult({
          available: true,
          executablePath: fullPath,
          version: verLine,
          authenticated: isAuth,
          accountIdentity: isAuth ? 'Configured Token' : null,
          credentialSource,
          configuredModel: chosenModel,
          nonInteractiveCapable: true,
          lastHealthCheck: now,
          status: isAuth ? 'HEALTHY' : 'SIGN_IN_REQUIRED',
          diagnosticDetails: isAuth
            ? 'Custom binary reachable at specified path and authenticated via token.'
            : 'Custom binary reachable, but no active token or credentials found.',
          remediationSteps: isAuth
            ? []
            : [
                'Set the COPILOT_GITHUB_TOKEN or GH_TOKEN environment variable in your session.',
                'Or run interactive login if supported by your custom binary.',
              ],
          error: isAuth ? null : 'Sign-in required for custom Copilot binary',
        });
      }
    } catch (_) {}

    if (customPath) {
      return normalizeCliResult({
        available: false,
        executablePath: customPath,
        version: null,
        authenticated: false,
        accountIdentity: null,
        credentialSource: 'none',
        configuredModel: chosenModel,
        nonInteractiveCapable: false,
        lastHealthCheck: now,
        status: 'OFFLINE',
        diagnosticDetails: `Configured Copilot binary at "${customPath}" was not found or failed to execute.`,
        remediationSteps: [
          'Verify the executable path in Platform Settings.',
          'Ensure the file has execution permissions and is an active Copilot executable.',
        ],
        error: 'BINARY_NOT_FOUND',
      });
    }
  }

  // 2. Check standalone 'copilot' binary
  try {
    const res = cp.spawnSync('copilot', ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000, shell: true });
    if (res.status === 0 && res.stdout) {
      const rawVer = (res.stdout || '').trim().split(/\r?\n/)[0];
      const execPath = findExecutablePath('copilot') || 'copilot';

      let isAuthenticated = false;
      let accountIdentity = null;
      let diagDetails = 'Standalone Copilot CLI executable detected and responding.';
      let remedSteps = [];

      if (credentialSource !== 'none') {
        isAuthenticated = true;
        accountIdentity = 'Environment Credential';
        diagDetails = 'Copilot CLI detected and authenticated via environment variable.';
      } else {
        // Safe read-only probe: run copilot with non-interactive ping and short timeout
        try {
          const probe = cp.spawnSync('copilot', ['-p', 'PING', '--no-custom-instructions'], {
            encoding: 'utf8',
            windowsHide: true,
            timeout: 3500,
            shell: true,
          });
          const probeOutput = ((probe.stdout || '') + (probe.stderr || '')).toLowerCase();
          if (
            probeOutput.includes('no authentication information found') ||
            probeOutput.includes('not authenticated') ||
            probeOutput.includes('error: no authentication')
          ) {
            isAuthenticated = false;
            diagDetails = `Copilot CLI is installed (${rawVer}), but not signed in to GitHub.`;
            remedSteps = [
              'Open a terminal and run: "copilot", then type "/login" to complete OAuth sign-in.',
              'Or set the COPILOT_GITHUB_TOKEN or GH_TOKEN environment variable in your system.',
              'Or enable Simulation Mode in platform settings for offline testing.',
            ];
          } else if (probe.status === 0 || !probeOutput.includes('authentication')) {
            isAuthenticated = true;
            accountIdentity = 'GitHub User';
            diagDetails = `Copilot CLI is installed (${rawVer}) and authenticated.`;
          } else {
            isAuthenticated = false;
            diagDetails = `Authentication check returned: ${redactSecrets(probeOutput.slice(0, 150))}`;
            remedSteps = ['Run "copilot" in terminal and use "/login" to sign in.'];
          }
        } catch (_) {
          isAuthenticated = false;
          diagDetails = 'Copilot CLI is installed, but status verification timed out or was blocked.';
          remedSteps = ['Run "copilot" in terminal and execute "/login".'];
        }
      }

      const status = isAuthenticated ? 'HEALTHY' : 'SIGN_IN_REQUIRED';

      return normalizeCliResult({
        available: true,
        executablePath: execPath,
        version: rawVer,
        authenticated: isAuthenticated,
        accountIdentity,
        credentialSource: isAuthenticated ? credentialSource : 'none',
        configuredModel: chosenModel,
        nonInteractiveCapable: true,
        lastHealthCheck: now,
        status,
        diagnosticDetails: diagDetails,
        remediationSteps: remedSteps,
        error: isAuthenticated ? null : 'AUTHENTICATION_REQUIRED',
      });
    }
  } catch (_) {}

  // 3. Check GitHub CLI Copilot extension: 'gh copilot'
  try {
    const ghVer = cp.spawnSync('gh', ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000, shell: true });
    if (ghVer.status === 0) {
      let accountIdentity = null;
      let isAuthenticated = false;

      try {
        const authRes = cp.spawnSync('gh', ['auth', 'status'], { encoding: 'utf8', windowsHide: true, timeout: 5000, shell: true });
        const authOut = (authRes.stdout || '') + (authRes.stderr || '');

        const accountMatch =
          authOut.match(/Logged in to [^ ]+ account ([a-zA-Z0-9_\-]+)/i) ||
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
      const ghPath = findExecutablePath('gh') || 'gh';

      if (hasCopilotExt && isAuthenticated) {
        return normalizeCliResult({
          available: true,
          executablePath: `${ghPath} copilot`,
          version: (copilotVer.stdout || '').trim().split(/\r?\n/)[0],
          authenticated: true,
          accountIdentity,
          credentialSource,
          configuredModel: chosenModel,
          nonInteractiveCapable: true,
          lastHealthCheck: now,
          status: 'HEALTHY',
          diagnosticDetails: `GitHub CLI and Copilot extension active. Logged in as ${accountIdentity}.`,
          remediationSteps: [],
          error: null,
        });
      } else if (hasCopilotExt && !isAuthenticated) {
        return normalizeCliResult({
          available: true,
          executablePath: `${ghPath} copilot`,
          version: (copilotVer.stdout || '').trim().split(/\r?\n/)[0],
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
          error: 'GH_AUTH_REQUIRED',
        });
      } else {
        return normalizeCliResult({
          available: false,
          executablePath: ghPath,
          version: (ghVer.stdout || '').trim().split(/\r?\n/)[0],
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
          error: 'COPILOT_EXTENSION_MISSING',
        });
      }
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
      'Install GitHub Copilot CLI via WinGet: "winget install GitHub.Copilot".',
      'Or install GitHub CLI from https://cli.github.com/ and install extension: "gh extension install github/gh-copilot".',
      'Or enable Simulation Mode in platform settings for offline testing.',
    ],
    error: 'CLI_NOT_INSTALLED',
  });
}

/**
 * Execute environment toolchain diagnostics (Git, .NET, Node.js, npm, Copilot, Azure CLI, Credential Provider).
 */
function diagnoseEnvironment(options) {
  options = options || {};
  if (!options.bypassCache && !options.refresh && cachedEnvDiag && (Date.now() - lastEnvDiagTime < ENV_DIAG_TTL_MS)) {
    return cachedEnvDiag;
  }

  const tools = [];

  // 1. Git
  try {
    const gitRes = cp.spawnSync('git', ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000 });
    const isOk = gitRes.status === 0;
    const gitPath = findExecutablePath('git');
    const version = isOk ? (gitRes.stdout || '').trim().replace(/^git version\s*/i, '') : null;
    tools.push({
      name: 'Git',
      tool: 'git',
      installed: isOk,
      available: isOk,
      version,
      path: gitPath,
      required: true,
      requirement: 'Required (>= 2.30)',
      status: isOk ? 'HEALTHY' : 'CRITICAL',
      diagnosticResult: isOk ? `Git v${version} installed at ${gitPath || 'PATH'}` : 'git command failed or not found in PATH',
      remediation: isOk ? null : 'Install Git for Windows and ensure it is included in your system PATH.',
      error: isOk ? null : 'git command failed or not found in PATH',
    });
  } catch (err) {
    tools.push({
      name: 'Git',
      tool: 'git',
      installed: false,
      available: false,
      version: null,
      path: null,
      required: true,
      requirement: 'Required (>= 2.30)',
      status: 'CRITICAL',
      diagnosticResult: `Git inspection error: ${err.message}`,
      remediation: 'Install Git for Windows from https://git-scm.com/.',
      error: err.message,
    });
  }

  // 2. .NET SDK
  try {
    const dotnetRes = cp.spawnSync('dotnet', ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000, shell: true });
    const isOk = dotnetRes.status === 0;
    const dotnetPath = findExecutablePath('dotnet');
    const version = isOk ? (dotnetRes.stdout || '').trim() : null;
    tools.push({
      name: '.NET SDK',
      tool: 'dotnet',
      installed: isOk,
      available: isOk,
      version,
      path: dotnetPath,
      required: false,
      requirement: 'Optional (.NET backend builds)',
      status: isOk ? 'HEALTHY' : 'WARNING',
      diagnosticResult: isOk ? `.NET SDK v${version} installed at ${dotnetPath || 'PATH'}` : '.NET SDK not found in PATH',
      remediation: isOk ? null : 'Install .NET SDK (>= 8.0) for backend solution builds and testing.',
      error: isOk ? null : '.NET SDK not found (backend builds will be skipped or simulated)',
    });
  } catch (err) {
    tools.push({
      name: '.NET SDK',
      tool: 'dotnet',
      installed: false,
      available: false,
      version: null,
      path: null,
      required: false,
      requirement: 'Optional',
      status: 'WARNING',
      diagnosticResult: `.NET inspection error: ${err.message}`,
      remediation: 'Install .NET 8 or 9 SDK.',
      error: err.message,
    });
  }

  // 3. Node.js
  const nodePath = process.execPath;
  tools.push({
    name: 'Node.js',
    tool: 'node',
    installed: true,
    available: true,
    version: process.version,
    path: nodePath,
    required: true,
    requirement: 'Required (>= 18.0)',
    status: 'HEALTHY',
    diagnosticResult: `Node.js runtime active at ${nodePath}`,
    remediation: null,
    error: null,
  });

  // 4. npm
  try {
    const npmRes = cp.spawnSync('npm', ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000, shell: true });
    const isOk = npmRes.status === 0;
    const npmPath = findExecutablePath('npm');
    const version = isOk ? (npmRes.stdout || '').trim() : null;
    tools.push({
      name: 'npm',
      tool: 'npm',
      installed: isOk,
      available: isOk,
      version,
      path: npmPath,
      required: false,
      requirement: 'Optional (Frontend builds)',
      status: isOk ? 'HEALTHY' : 'WARNING',
      diagnosticResult: isOk ? `npm v${version} installed at ${npmPath || 'PATH'}` : 'npm not found in PATH',
      remediation: isOk ? null : 'Install Node.js with bundled npm for frontend client builds.',
      error: isOk ? null : 'npm not found in PATH',
    });
  } catch (err) {
    tools.push({
      name: 'npm',
      tool: 'npm',
      installed: false,
      available: false,
      version: null,
      path: null,
      required: false,
      requirement: 'Optional',
      status: 'WARNING',
      diagnosticResult: `npm error: ${err.message}`,
      remediation: 'Install Node.js.',
      error: err.message,
    });
  }

  // 5. GitHub Copilot CLI
  try {
    const copilotDiag = diagnoseCopilotCli();
    const isOk = copilotDiag.available;
    tools.push({
      name: 'GitHub Copilot CLI',
      tool: 'copilot',
      installed: isOk,
      available: isOk,
      version: copilotDiag.version,
      path: copilotDiag.executablePath,
      required: false,
      requirement: 'Recommended (Semantic reasoning & repair)',
      status: isOk ? (copilotDiag.authenticated ? 'HEALTHY' : 'WARNING') : 'WARNING',
      diagnosticResult: isOk
        ? `Copilot CLI installed (${copilotDiag.version || 'unknown version'}, ${copilotDiag.status})`
        : 'Copilot CLI not detected in PATH',
      remediation: isOk
        ? (copilotDiag.authenticated ? null : 'Copilot CLI is installed but not authenticated. Run "copilot /login" or set GH_TOKEN.')
        : 'Install Copilot CLI or enable Simulation Mode in platform settings.',
      error: isOk ? null : 'Copilot CLI not found',
    });
  } catch (_) {}

  // 6. Azure CLI
  try {
    const azRes = cp.spawnSync('az', ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000, shell: true });
    const isOk = azRes.status === 0;
    const azPath = findExecutablePath('az');
    let azVer = null;
    if (isOk && azRes.stdout) {
      const match = azRes.stdout.match(/azure-cli\s+([0-9\.]+)/i);
      azVer = match ? match[1] : 'Installed';
    }
    tools.push({
      name: 'Azure CLI',
      tool: 'az',
      installed: isOk,
      available: isOk,
      version: azVer,
      path: azPath,
      required: false,
      requirement: 'Optional (Azure DevOps auth)',
      status: isOk ? 'HEALTHY' : 'WARNING',
      diagnosticResult: isOk ? `Azure CLI v${azVer} installed at ${azPath || 'PATH'}` : 'Azure CLI not found in PATH',
      remediation: isOk ? null : 'Install Azure CLI ("winget install Microsoft.AzureCLI") to authenticate private feeds automatically.',
      error: isOk ? null : 'Azure CLI not installed in PATH',
    });
  } catch (_) {}

  // 7. Azure Artifacts Credential Provider
  try {
    const nugetSources = require('./nuget-sources');
    const credPath = nugetSources.findAzureArtifactsCredentialProvider();
    const isOk = Boolean(credPath);
    tools.push({
      name: 'Azure Artifacts Credential Provider',
      tool: 'CredentialProvider.Microsoft',
      installed: isOk,
      available: isOk,
      version: isOk ? 'Installed' : null,
      path: credPath || null,
      required: false,
      requirement: 'Optional (Private NuGet feeds)',
      status: isOk ? 'HEALTHY' : 'WARNING',
      diagnosticResult: isOk ? `Credential provider plugin active at ${credPath}` : 'CredentialProvider.Microsoft.exe not found in Visual Studio or NuGet plugins',
      remediation: isOk ? null : 'Install Azure Artifacts Credential Provider or provide a Personal Access Token in platform settings.',
      error: isOk ? null : 'CredentialProvider.Microsoft.exe not found in Visual Studio or NuGet plugins.',
    });
  } catch (err) {
    tools.push({
      name: 'Azure Artifacts Credential Provider',
      tool: 'CredentialProvider.Microsoft',
      installed: false,
      available: false,
      version: null,
      path: null,
      required: false,
      requirement: 'Optional (Private Feeds)',
      status: 'WARNING',
      diagnosticResult: `Plugin check failed: ${err.message}`,
      remediation: 'Provide a Personal Access Token in platform settings.',
      error: err.message,
    });
  }

  const mem = process.memoryUsage();
  const uptime = Math.floor(process.uptime());
  const heapMb = Math.round(mem.heapUsed / 1024 / 1024);

  const envResult = {
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
      hostname: os.hostname(),
    },
  };

  cachedEnvDiag = envResult;
  lastEnvDiagTime = Date.now();
  return envResult;
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
    overallStatus = 'UNHEALTHY';
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
      path: cli.executablePath,
      version: cli.version,
      status: cli.status,
    },
    toolsCount: env.tools.length,
    healthyToolsCount: env.tools.filter((t) => t.status === 'HEALTHY').length,
    issues,
    lastChecked: new Date().toISOString(),
  };
}

module.exports = {
  diagnoseCopilotCli,
  diagnoseEnvironment,
  getSystemHealthSummary,
  findExecutablePath,
  redactSecrets,
  clearDiagnosticsCache,
};

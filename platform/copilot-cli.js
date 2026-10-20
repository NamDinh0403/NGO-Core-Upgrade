'use strict';
/*
 * GitHub Copilot CLI Adapter with Multi-Mode Authentication & Diagnostics.
 *
 * Dedicated subprocess adapter for GitHub Copilot CLI.
 * Handles invocation, real authentication verification, browser OAuth web flow,
 * device-code login flow, token credentials storage, timeouts, cancellation,
 * secret redaction, and execution metadata.
 * Dependency-free, Node 14+.
 */

const cp = require('child_process');
const path = require('path');
const fs = require('fs');

const SECRET_PATTERNS = [
  /(?:password|passwd|pwd|secret|token|api[_-]?key|auth[_-]?token)\s*[:=]\s*["']?([^"'\s\r\n]{4,})["']?/gi,
  /bearer\s+([a-zA-Z0-9_\-\.]{10,})/gi,
  /(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{30,}/g,
];

const AVAILABLE_MODELS = [
  { id: 'auto', name: 'Auto (Recommended)', description: 'Let GitHub Copilot dynamically select the optimal model for each step' },
  { id: 'gpt-5.4', name: 'GPT-5.4', description: 'Latest OpenAI reasoning model for code generation and refactoring' },
  { id: 'gpt-5.5', name: 'GPT-5.5', description: 'Advanced OpenAI reasoning model for deep architectural changes' },
  { id: 'gpt-6-sol', name: 'GPT-6 Sol', description: 'Frontier reasoning model for complex upgrade decisions' },
  { id: 'claude-sonnet-4.6', name: 'Claude 4.6 Sonnet', description: 'Anthropic coding model, strong for semantic code analysis' },
  { id: 'claude-opus-4.8', name: 'Claude 4.8 Opus', description: 'Anthropic deep reasoning model for complex repair' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', description: 'High-speed Google multi-modal model for fast diffs and checks' },
  { id: 'gpt-4o', name: 'GPT-4o (Legacy)', description: 'Omni model legacy fallback' },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Legacy)', description: 'Anthropic reasoning model legacy fallback' },
  { id: 'o1-preview', name: 'o1-preview (Legacy)', description: 'Advanced reasoning legacy fallback' },
  { id: 'o1-mini', name: 'o1-mini (Legacy)', description: 'Fast reasoning legacy fallback' },
  { id: 'gpt-4o-mini', name: 'GPT-4o mini (Legacy)', description: 'Lightweight legacy fallback' },
  { id: 'gpt-4', name: 'GPT-4 (Legacy)', description: 'Standard GPT-4 model' },
];

const CREDENTIALS_FILE = path.join(__dirname, 'config', '.credentials.json');

// In-memory active login sessions: loginId -> sessionData
const activeDeviceLogins = new Map();
const activeWebLogins = new Map();

/**
 * Load credentials from protected store.
 */
function loadProtectedCredentials() {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8')) || {};
    }
  } catch (_) {}
  return {};
}

/**
 * Save credentials to protected store.
 */
function saveProtectedCredentials(creds) {
  try {
    fs.mkdirSync(path.dirname(CREDENTIALS_FILE), { recursive: true });
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2), { mode: 0o600 });
  } catch (_) {}
}

/**
 * Get configured token from environment or credentials store.
 */
function getStoredCopilotToken() {
  if (process.env.COPILOT_GITHUB_TOKEN) return process.env.COPILOT_GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  const creds = loadProtectedCredentials();
  return creds.copilotToken || null;
}

/**
 * Save token into protected credentials store.
 */
function setAuthToken(token) {
  const clean = String(token || '').trim();
  const creds = loadProtectedCredentials();
  if (clean) {
    creds.copilotToken = clean;
    process.env.COPILOT_GITHUB_TOKEN = clean;
    try {
      const copilotBin = resolveExecutable('copilot');
      if (copilotBin && fs.existsSync(copilotBin)) {
        cp.spawnSync(copilotBin, ['login', '--with-token'], {
          input: clean + '\n',
          encoding: 'utf8',
          windowsHide: true,
          timeout: 5000,
          shell: false,
        });
      }
    } catch (_) {}
  } else {
    delete creds.copilotToken;
    delete process.env.COPILOT_GITHUB_TOKEN;
  }
  saveProtectedCredentials(creds);
  return { ok: true, authenticated: Boolean(clean) };
}

/**
 * Clear stored token.
 */
function clearAuthToken() {
  return setAuthToken(null);
}

/**
 * Redact secret-like patterns from strings.
 */
function redactSecrets(text) {
  if (typeof text !== 'string') return text;
  let clean = text;
  for (const pattern of SECRET_PATTERNS) {
    clean = clean.replace(pattern, (match, p1) => {
      if (p1 && match.includes(p1)) {
        return match.replace(p1, '***REDACTED***');
      }
      return '***REDACTED***';
    });
  }
  return clean;
}

function resolveExecutable(binName) {
  if (!binName) return binName;
  if (path.isAbsolute(binName)) {
    if (process.platform === 'win32' && !path.extname(binName)) {
      if (fs.existsSync(`${binName}.exe`)) return `${binName}.exe`;
      if (fs.existsSync(`${binName}.bat`)) return `${binName}.bat`;
      if (fs.existsSync(`${binName}.cmd`)) return `${binName}.cmd`;
    }
    return binName;
  }

  if (process.platform === 'win32') {
    const homeDir = process.env.USERPROFILE || process.env.HOME || '';
    const localAppData = process.env.LOCALAPPDATA || (homeDir ? path.join(homeDir, 'AppData', 'Local') : '');

    // Check known Windows installation locations for copilot
    if (binName === 'copilot' || binName === 'copilot.exe') {
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

    try {
      // First try resolving specifically as .exe
      const queryName = path.extname(binName) ? binName : `${binName}.exe`;
      const whereExeRes = cp.spawnSync('where.exe', [queryName], { encoding: 'utf8', windowsHide: true, timeout: 3000 });
      if (whereExeRes.status === 0 && whereExeRes.stdout) {
        const lines = whereExeRes.stdout.trim().split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && fs.existsSync(trimmed) && trimmed.toLowerCase().endsWith('.exe')) {
            return trimmed;
          }
        }
      }

      // Fallback query across PATHEXT
      const allRes = cp.spawnSync('where.exe', [binName], { encoding: 'utf8', windowsHide: true, timeout: 3000 });
      if (allRes.status === 0 && allRes.stdout) {
        const lines = allRes.stdout.trim().split(/\r?\n/);
        // Prefer .exe first
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && fs.existsSync(trimmed) && trimmed.toLowerCase().endsWith('.exe')) {
            return trimmed;
          }
        }
        // Then .bat or .cmd
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && fs.existsSync(trimmed) && (trimmed.toLowerCase().endsWith('.bat') || trimmed.toLowerCase().endsWith('.cmd'))) {
            return trimmed;
          }
        }
      }
    } catch (_) {}
  }

  return binName;
}

/**
 * Check whether Copilot CLI is available and authenticated.
 */
function checkCliAvailability(customBin) {
  const binary = customBin || process.env.COPILOT_CLI_PATH;

  if (process.env.COPILOT_SIMULATOR === 'true') {
    return {
      available: true,
      authenticated: true,
      command: 'simulator',
      type: 'simulator',
      accountIdentity: 'Simulator User (Offline)',
      version: '1.0.0-simulator',
    };
  }

  const storedToken = getStoredCopilotToken();
  if (storedToken) {
    process.env.COPILOT_GITHUB_TOKEN = storedToken;
  }

  // 1. If explicit custom binary provided
  if (customBin) {
    try {
      const res = cp.spawnSync(customBin, ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000 });
      if (res.status === 0 || (res.stdout && !res.error)) {
        const isAuth = Boolean(storedToken);
        return {
          available: true,
          authenticated: isAuth,
          command: customBin,
          type: 'custom',
          version: (res.stdout || '').trim(),
          accountIdentity: isAuth ? 'GitHub Token' : null,
          credentialSource: isAuth ? 'stored_token' : 'none',
        };
      }
    } catch (_) {}
    return {
      available: false,
      authenticated: false,
      command: null,
      type: 'none',
      guidance: `Configured Copilot CLI binary "${customBin}" was not found or failed to execute.`,
    };
  }

  // 1b. If COPILOT_CLI_PATH environment variable set
  if (process.env.COPILOT_CLI_PATH) {
    try {
      const envBin = process.env.COPILOT_CLI_PATH;
      const res = cp.spawnSync(envBin, ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000 });
      if (res.status === 0 || (res.stdout && !res.error)) {
        const isAuth = Boolean(storedToken);
        return {
          available: true,
          authenticated: isAuth,
          command: envBin,
          type: 'custom',
          version: (res.stdout || '').trim(),
          accountIdentity: isAuth ? 'GitHub Token' : null,
          credentialSource: isAuth ? 'stored_token' : 'none',
        };
      }
    } catch (_) {}
  }

  // 2. Check 'copilot' binary in PATH
  try {
    const copilotBin = resolveExecutable('copilot');
    const res = cp.spawnSync(copilotBin, ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000, shell: false });
    if (res.status === 0) {
      const ver = (res.stdout || '').trim().split(/\r?\n/)[0];
      let isAuth = false;
      let identity = null;
      let credSrc = 'none';

      if (storedToken) {
        isAuth = true;
        identity = 'Configured GitHub Token';
        credSrc = 'stored_token';
      } else {
        // Fast probe: check ~/.copilot/config.json for active user
        try {
          const homeDir = process.env.USERPROFILE || process.env.HOME || '';
          const copilotCfgPath = path.join(homeDir, '.copilot', 'config.json');
          if (fs.existsSync(copilotCfgPath)) {
            const raw = fs.readFileSync(copilotCfgPath, 'utf8').replace(/^\s*\/\/.*$/gm, '').trim();
            const cfg = JSON.parse(raw);
            if (cfg.lastLoggedInUser && cfg.lastLoggedInUser.login) {
              isAuth = true;
              identity = `${cfg.lastLoggedInUser.login} (GitHub Copilot CLI)`;
              credSrc = 'oauth_session';
            }
          }
        } catch (_) {}

        if (!isAuth) {
          // Fast non-interactive probe
          try {
            const probe = cp.spawnSync(copilotBin, ['-p', 'PING', '--no-custom-instructions'], {
              encoding: 'utf8',
              windowsHide: true,
              timeout: 3000,
              shell: false,
            });
            const probeOut = ((probe.stdout || '') + (probe.stderr || '')).toLowerCase();
            if (probeOut.includes('no authentication information found') || probeOut.includes('not authenticated')) {
              isAuth = false;
            } else if (probe.status === 0 || !probeOut.includes('authentication')) {
              isAuth = true;
              identity = 'GitHub Copilot OAuth';
              credSrc = 'oauth_session';
            }
          } catch (_) {
            isAuth = false;
          }
        }
      }

      return {
        available: true,
        authenticated: isAuth,
        command: copilotBin,
        type: 'standalone',
        version: ver,
        accountIdentity: identity,
        credentialSource: credSrc,
        storedTokenConfigured: Boolean(storedToken),
      };
    }
  } catch (_) {}

  // 3. Check 'gh copilot' via GitHub CLI
  try {
    const ghBin = resolveExecutable('gh');
    const res = cp.spawnSync(ghBin, ['copilot', '--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000, shell: false });
    if (res.status === 0) {
      return {
        available: true,
        authenticated: Boolean(storedToken),
        command: ghBin,
        type: 'gh-extension',
        version: (res.stdout || '').trim(),
        accountIdentity: storedToken ? 'GitHub Token' : null,
        credentialSource: storedToken ? 'stored_token' : 'none',
      };
    }
  } catch (_) {}

  return {
    available: false,
    authenticated: false,
    command: null,
    type: 'none',
    guidance: 'GitHub Copilot CLI was not found in PATH. Install via "winget install GitHub.Copilot" or set COPILOT_CLI_PATH.',
  };
}

/**
 * Start OAuth Device Code login flow.
 * Returns { loginId, userCode, verificationUri, status: 'PENDING' }
 */
function startDeviceCodeLogin() {
  const loginId = 'login-' + Date.now();
  const session = {
    id: loginId,
    status: 'PENDING',
    userCode: null,
    verificationUri: 'https://github.com/login/device',
    startedAt: new Date().toISOString(),
    error: null,
    child: null,
    rawOutput: '',
  };

  try {
    const copilotBin = resolveExecutable('copilot');
    if (!copilotBin || (path.isAbsolute(copilotBin) && !fs.existsSync(copilotBin))) {
      session.status = 'FAILED';
      session.error = 'Copilot CLI executable not found on system';
      return session;
    }

    const child = cp.spawn(copilotBin, ['login', '--device-code'], {
      windowsHide: true,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    session.child = child;

    const onData = (chunk) => {
      const text = chunk.toString('utf8');
      const cleanText = text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
      session.rawOutput = (session.rawOutput || '') + cleanText;

      const codeMatch = cleanText.match(/(?:code[:\s]+|enter code\s+)([A-Z0-9]{4,5}-[A-Z0-9]{4,5})/i) ||
                        cleanText.match(/\b([A-Z0-9]{4,5}-[A-Z0-9]{4,5})\b/i);
      if (codeMatch && !session.userCode) {
        session.userCode = codeMatch[1].toUpperCase();
      }
      const uriMatch = cleanText.match(/(https:\/\/github\.com\/login\/device[^\s]*)/i);
      if (uriMatch) {
        session.verificationUri = uriMatch[1];
      }
    };

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);

    child.on('close', (code) => {
      if (code === 0) {
        session.status = 'SUCCESS';
      } else if (session.status !== 'CANCELLED') {
        session.status = 'FAILED';
        session.error = (session.rawOutput || '').trim() || `Login process exited with code ${code}`;
      }
      session.child = null;
    });

    child.on('error', (err) => {
      session.status = 'FAILED';
      session.error = err.message;
      session.child = null;
    });

    activeDeviceLogins.set(loginId, session);
    return session;
  } catch (err) {
    session.status = 'FAILED';
    session.error = err.message;
    return session;
  }
}

/**
 * Poll status of device code login.
 */
function getDeviceCodeLoginStatus(loginId) {
  const session = activeDeviceLogins.get(loginId);
  if (!session) return { status: 'NOT_FOUND' };
  return {
    id: session.id,
    status: session.status,
    userCode: session.userCode,
    verificationUri: session.verificationUri,
    error: session.error,
  };
}

/**
 * Cancel active device code login.
 */
function cancelDeviceCodeLogin(loginId) {
  const session = activeDeviceLogins.get(loginId);
  if (session && session.child) {
    session.status = 'CANCELLED';
    try { session.child.kill('SIGTERM'); } catch (_) {}
  }
}

/**
 * Start OAuth Browser Web Flow login.
 * Spawns copilot with --web-flow, captures the OAuth URL, and tracks the session.
 */
function startWebFlowLogin() {
  const loginId = 'web-' + Date.now();
  const session = {
    id: loginId,
    type: 'web',
    status: 'PENDING',
    authUrl: null,
    startedAt: new Date().toISOString(),
    error: null,
    child: null,
    rawOutput: '',
  };

  try {
    const copilotBin = resolveExecutable('copilot');
    if (!copilotBin || (path.isAbsolute(copilotBin) && !fs.existsSync(copilotBin))) {
      session.status = 'FAILED';
      session.error = 'Copilot CLI executable not found on system';
      return session;
    }

    const child = cp.spawn(copilotBin, ['login', '--web-flow'], {
      windowsHide: true,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    session.child = child;

    const onData = (chunk) => {
      const text = chunk.toString('utf8');
      const cleanText = text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
      session.rawOutput = (session.rawOutput || '') + cleanText;

      const urlMatch = cleanText.match(/(https:\/\/github\.com\/login\/oauth\/authorize[^\s\r\n]+)/i);
      if (urlMatch && !session.authUrl) {
        session.authUrl = urlMatch[1];
      }
    };

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);

    child.on('close', (code) => {
      if (code === 0) {
        session.status = 'SUCCESS';
      } else if (session.status !== 'CANCELLED') {
        session.status = 'FAILED';
        session.error = (session.rawOutput || '').trim() || `Web login process exited with code ${code}`;
      }
      session.child = null;
    });

    child.on('error', (err) => {
      session.status = 'FAILED';
      session.error = err.message;
      session.child = null;
    });

    activeWebLogins.set(loginId, session);
    return session;
  } catch (err) {
    session.status = 'FAILED';
    session.error = err.message;
    return session;
  }
}

/**
 * Poll status of browser web-flow login.
 */
function getWebFlowLoginStatus(loginId) {
  const session = activeWebLogins.get(loginId);
  if (!session) return { status: 'NOT_FOUND' };
  return {
    id: session.id,
    status: session.status,
    authUrl: session.authUrl,
    error: session.error,
  };
}

/**
 * Cancel active browser web-flow login.
 */
function cancelWebFlowLogin(loginId) {
  const session = activeWebLogins.get(loginId);
  if (session && session.child) {
    session.status = 'CANCELLED';
    try { session.child.kill('SIGTERM'); } catch (_) {}
  }
}

/**
 * Backwards-compatible launcher for web flow login.
 */
function loginWebFlow() {
  const session = startWebFlowLogin();
  return {
    ok: session.status !== 'FAILED',
    loginId: session.id,
    authUrl: session.authUrl,
    message: 'Browser login flow initiated. Please complete authorization in your browser.',
  };
}

/**
 * Invoke Copilot CLI with a scoped task and context.
 */
function invoke(prompt, options) {
  options = options || {};
  const cwd = options.cwd || process.cwd();
  const timeoutMs = options.timeoutMs || 180000;
  const onLog = typeof options.onLog === 'function' ? options.onLog : () => {};
  const chosenModel = options.model || process.env.COPILOT_MODEL || 'auto';

  let cleanPrompt = redactSecrets(prompt);
  // Guard against Windows command-line argument length limits (CreateProcessW limit ~32k chars)
  const MAX_PROMPT_CHARS = 7500;
  if (cleanPrompt && cleanPrompt.length > MAX_PROMPT_CHARS) {
    const head = cleanPrompt.slice(0, 4800);
    const tail = cleanPrompt.slice(-2200);
    cleanPrompt = `${head}\n\n... [output truncated for command length limits] ...\n\n${tail}`;
  }

  const startTime = Date.now();

  // Test / simulated execution
  if (options.simulate || process.env.COPILOT_SIMULATOR === 'true') {
    return new Promise((resolve) => {
      onLog(`[Copilot CLI Simulator] Scoped task received for ${path.basename(cwd)} (model: ${chosenModel}).`);
      onLog(`[Copilot CLI Simulator] Executing semantic reasoning with ${chosenModel}...`);
      setTimeout(() => {
        const stdout = `Simulated Copilot response (${chosenModel}) for task: ${cleanPrompt.slice(0, 100)}...`;
        onLog(`[Copilot CLI Simulator] Completed successfully using model ${chosenModel}.`);
        resolve({
          ok: true,
          exitCode: 0,
          stdout,
          stderr: '',
          durationMs: Date.now() - startTime,
          timedOut: false,
          cancelled: false,
          simulated: true,
          model: chosenModel,
        });
      }, 50);
    });
  }

  const cliInfo = checkCliAvailability(options.cliPath);
  if (!cliInfo.available) {
    const errorMsg = cliInfo.guidance || 'Copilot CLI unavailable';
    onLog(`[Copilot CLI Error] ${errorMsg}`);
    return Promise.resolve({
      ok: false,
      exitCode: 127,
      stdout: '',
      stderr: errorMsg,
      durationMs: Date.now() - startTime,
      timedOut: false,
      cancelled: false,
      error: 'CLI_UNAVAILABLE',
      model: chosenModel,
    });
  }

  return new Promise((resolve) => {
    let command;
    let args;

    if (cliInfo.type === 'gh-extension') {
      command = resolveExecutable('gh');
      args = ['copilot', 'suggest', '-t', 'shell', cleanPrompt];
    } else {
      command = resolveExecutable(cliInfo.command);
      if (cliInfo.command === 'copilot' || (typeof cliInfo.command === 'string' && /copilot(\.exe)?$/i.test(cliInfo.command))) {
        const modelArgs = (chosenModel && chosenModel !== 'auto') ? ['--model', chosenModel] : [];
        args = ['-p', cleanPrompt, ...modelArgs, '--allow-all-tools', '--no-custom-instructions'];
      } else {
        args = chosenModel ? ['--model', chosenModel, cleanPrompt] : [cleanPrompt];
      }
    }

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let cancelled = false;

    onLog(`[Copilot CLI] Invoking (model: ${chosenModel}) in ${cwd}...`);

    const env = Object.assign({}, process.env);
    if (chosenModel) {
      env.COPILOT_MODEL = chosenModel;
    }
    const storedToken = getStoredCopilotToken();
    if (storedToken) {
      env.COPILOT_GITHUB_TOKEN = storedToken;
    }

    const child = cp.spawn(command, args, {
      cwd,
      shell: false,
      windowsHide: true,
      env,
    });

    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        cancelled = true;
        child.kill('SIGTERM');
      });
    }

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      onLog(`[Copilot CLI Error] Process timed out after ${timeoutMs}ms.`);
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      const text = redactSecrets(chunk.toString('utf8'));
      stdout += text;
      for (const line of text.split(/\r?\n/).filter(Boolean)) {
        onLog(`[Copilot] ${line}`);
      }
    });

    child.stderr.on('data', (chunk) => {
      const text = redactSecrets(chunk.toString('utf8'));
      stderr += text;
      for (const line of text.split(/\r?\n/).filter(Boolean)) {
        onLog(`[Copilot stderr] ${line}`);
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      const cleanErr = redactSecrets(err.message);
      onLog(`[Copilot CLI Error] Process spawn failed: ${cleanErr}`);
      resolve({
        ok: false,
        exitCode: 1,
        stdout,
        stderr: stderr || cleanErr,
        durationMs: Date.now() - startTime,
        timedOut: false,
        cancelled,
        error: cleanErr,
        model: chosenModel,
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      const hasErrorOutput = Boolean(stderr && /error:\s+/i.test(stderr));
      const ok = code === 0 && !timedOut && !cancelled && !hasErrorOutput;

      onLog(`[Copilot CLI] Exited with code ${code} (${durationMs}ms, model: ${chosenModel}).`);
      resolve({
        ok,
        exitCode: ok ? code : (code === 0 ? 1 : code),
        stdout,
        stderr,
        durationMs,
        timedOut,
        cancelled,
        model: chosenModel,
      });
    });
  });
}

module.exports = {
  checkCliAvailability,
  redactSecrets,
  invoke,
  AVAILABLE_MODELS,
  setAuthToken,
  clearAuthToken,
  getStoredCopilotToken,
  loginWebFlow,
  startWebFlowLogin,
  getWebFlowLoginStatus,
  cancelWebFlowLogin,
  startDeviceCodeLogin,
  getDeviceCodeLoginStatus,
  cancelDeviceCodeLogin,
};

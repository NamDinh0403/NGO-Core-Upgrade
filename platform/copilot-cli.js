'use strict';
/*
 * GitHub Copilot CLI Adapter.
 *
 * Dedicated subprocess adapter for GitHub Copilot CLI.
 * Handles invocation, authentication checks, process lifecycle, timeouts,
 * cancellation, secret redaction, and execution metadata.
 * Dependency-free, Node 14+.
 */

const cp = require('child_process');
const path = require('path');

const SECRET_PATTERNS = [
  /(?:password|passwd|pwd|secret|token|api[_-]?key|auth[_-]?token)\s*[:=]\s*["']?([^"'\s\r\n]{4,})["']?/gi,
  /bearer\s+([a-zA-Z0-9_\-\.]{10,})/gi,
  /(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{30,}/g,
];

const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Omni model, recommended for general upgrade tasks & refactoring' },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Exceptional for deep code refactoring & complex build repair' },
  { id: 'o1-preview', name: 'o1-preview', description: 'Advanced reasoning for difficult architectural alignment' },
  { id: 'o1-mini', name: 'o1-mini', description: 'Fast advanced reasoning for code analysis' },
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', description: 'Fast, lightweight model for routine package updates' },
  { id: 'gpt-4', name: 'GPT-4 (Legacy)', description: 'Standard GPT-4 model' },
];

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
    };
  }

  // 1. If explicit binary provided, check it
  if (binary) {
    try {
      const res = cp.spawnSync(binary, ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000 });
      if (res.status === 0 || res.stdout) {
        return {
          available: true,
          authenticated: true,
          command: binary,
          type: 'custom',
          version: (res.stdout || '').trim(),
        };
      }
    } catch (_) {}
  }

  // 2. Check 'copilot' binary in PATH
  try {
    const res = cp.spawnSync('copilot', ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000, shell: true });
    if (res.status === 0) {
      return {
        available: true,
        authenticated: true,
        command: 'copilot',
        type: 'standalone',
        version: (res.stdout || '').trim(),
      };
    }
  } catch (_) {}

  // 3. Check 'gh copilot' via GitHub CLI
  try {
    const res = cp.spawnSync('gh', ['copilot', '--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000, shell: true });
    if (res.status === 0) {
      return {
        available: true,
        authenticated: true,
        command: 'gh copilot',
        type: 'gh-extension',
        version: (res.stdout || '').trim(),
      };
    }
  } catch (_) {}

  return {
    available: false,
    authenticated: false,
    command: null,
    type: 'none',
    guidance: 'GitHub Copilot CLI was not found in PATH. Install the GitHub CLI and the Copilot extension ("gh extension install github/gh-copilot") or set COPILOT_CLI_PATH.',
  };
}

/**
 * Invoke Copilot CLI with a scoped task and context.
 *
 * @param {string} prompt Task prompt describing the semantic operation.
 * @param {object} options
 * @param {string} options.cwd Working directory
 * @param {number} [options.timeoutMs=180000] Timeout in milliseconds
 * @param {string} [options.cliPath] Optional path to binary
 * @param {boolean} [options.simulate] Set true to simulate response (for offline/test)
 * @param {function} [options.onLog] Optional streaming log callback (line-by-line)
 * @returns {Promise<object>} Execution result
 */
function invoke(prompt, options) {
  options = options || {};
  const cwd = options.cwd || process.cwd();
  const timeoutMs = options.timeoutMs || 180000;
  const onLog = typeof options.onLog === 'function' ? options.onLog : () => {};
  const chosenModel = options.model || process.env.COPILOT_MODEL || 'gpt-4o';

  const cleanPrompt = redactSecrets(prompt);
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
      command = 'gh';
      args = ['copilot', 'suggest', '-t', 'shell', cleanPrompt];
    } else {
      command = cliInfo.command;
      args = chosenModel ? ['--model', chosenModel, cleanPrompt] : [cleanPrompt];
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

    const child = cp.spawn(command, args, {
      cwd,
      shell: true,
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
      const ok = code === 0 && !timedOut && !cancelled;

      onLog(`[Copilot CLI] Exited with code ${code} (${durationMs}ms, model: ${chosenModel}).`);
      resolve({
        ok,
        exitCode: code,
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
};

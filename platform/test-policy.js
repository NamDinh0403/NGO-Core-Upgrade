'use strict';
/*
 * Centralized Regression Test Execution Policy & Result Caching Engine.
 *
 * Implements the Mandatory Regression Test Execution Policy:
 *   1. Test selection: Targeted vs Integration vs Regression vs BuildOnly
 *   2. Reuse successful results via input fingerprinting (source + test + config + deps)
 *   3. Prevent duplicate execution across workflow stages and loops
 *   4. Defined rerun conditions with bounded retry limits (max 1 retry for transient issues)
 *   5. Cryptographic result linkage between verification and review
 *   6. Comprehensive test decisions reporting (selected, skipped, reused, retries, invalidations)
 *
 * Dependency-free, Node 14+.
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const TEST_LEVELS = {
  BUILD_ONLY: 'BuildOnly',
  TARGETED: 'Targeted',
  INTEGRATION: 'Integration',
  REGRESSION: 'Regression',
};

// In-memory session cache: Map<clientPath, Map<fingerprintKey, CachedTestResult>>
const sessionTestCache = new Map();

/**
 * Compute SHA256 digest of text or buffer.
 */
function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Scan directory recursively for files matching extensions, excluding build/dependency artifacts.
 */
function scanFiles(dir, extensions, fileList) {
  fileList = fileList || [];
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (['bin', 'obj', '.vs', 'node_modules', '.git', 'dist', 'coverage'].includes(entry.name)) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanFiles(full, extensions, fileList);
    } else if (!extensions || extensions.some((ext) => entry.name.endsWith(ext))) {
      fileList.push(full);
    }
  }
  return fileList;
}

/**
 * Compute deterministic Input Fingerprint for test impact.
 * Hashes:
 *   - Client source code (.cs, .ts, .html)
 *   - Test project files (.csproj, package.json, test files)
 *   - Configuration (appsettings*.json, tsconfig*.json)
 *   - Git working tree state (clean vs dirty)
 */
function computeInputFingerprint(clientPath, options) {
  options = options || {};
  const hash = crypto.createHash('sha256');

  // 1. Scan client sources and test files
  const extensions = ['.cs', '.csproj', '.sln', '.slnx', '.json', '.ts', '.html'];
  const files = scanFiles(clientPath, extensions);
  files.sort();

  for (const f of files) {
    try {
      const rel = path.relative(clientPath, f).replace(/\\/g, '/');
      const stat = fs.statSync(f);
      hash.update(rel).update('\0').update(String(stat.size)).update('\0').update(String(stat.mtimeMs)).update('\0');
      // For manifests and configs, hash content directly
      if (/(\.csproj|package\.json|appsettings.*\.json|global\.json)$/i.test(f)) {
        hash.update(fs.readFileSync(f));
      }
    } catch (_) {}
  }

  // 2. Incorporate target version and tracks
  if (options.targetVersion) hash.update(`target:${options.targetVersion}\0`);
  if (options.tracks) hash.update(`tracks:${options.tracks.join(',')}\0`);

  // 3. Incorporate Git working tree status if client is in a Git repo
  try {
    const gitStatus = cp.spawnSync('git', ['status', '--porcelain'], {
      cwd: clientPath,
      encoding: 'utf8',
      windowsHide: true,
      timeout: 3000,
      shell: true,
    });
    if (gitStatus.status === 0) {
      hash.update(gitStatus.stdout || 'CLEAN_TREE');
    }
  } catch (_) {}

  return hash.digest('hex');
}

/**
 * Determine narrowest valid test scope based on change impact and policy.
 */
function resolveTestScope(options) {
  const { isPatch, upgradeMode, breakingChangesCount, clientPath, forceRegression } = options;

  if (forceRegression) {
    return {
      scope: TEST_LEVELS.REGRESSION,
      justification: 'Explicit policy or user request mandated full regression suite execution.',
      fullRegressionJustified: true,
    };
  }

  // 1. If Fast Patch mode is active and no breaking changes exist -> BuildOnly or Targeted
  if (upgradeMode === 'FAST_PATCH' || (isPatch && (!breakingChangesCount || breakingChangesCount === 0))) {
    return {
      scope: TEST_LEVELS.TARGETED,
      level: TEST_LEVELS.TARGETED,
      justification: 'Patch update with package alignment only; scope narrowed to targeted tests directly verifying Core components.',
      fullRegressionJustified: false,
      justificationRequired: false,
    };
  }

  // 2. If material breaking changes detected -> Regression
  if (breakingChangesCount && breakingChangesCount > 0) {
    return {
      scope: TEST_LEVELS.REGRESSION,
      level: TEST_LEVELS.REGRESSION,
      justification: `Material breaking changes (${breakingChangesCount}) detected in Core release; full regression suite is justified.`,
      fullRegressionJustified: true,
      justificationRequired: true,
    };
  }

  // 3. Default to Targeted scope for confined modifications
  return {
    scope: TEST_LEVELS.TARGETED,
    level: TEST_LEVELS.TARGETED,
    justification: 'Changes confined to standard package references; running targeted test scope to verify integration points.',
    fullRegressionJustified: false,
    justificationRequired: false,
  };
}

/**
 * Retrieve cached test result if input fingerprint and scope match.
 */
function getCachedResult(clientPath, scope, inputFingerprint) {
  if (typeof clientPath === 'object' && clientPath !== null) {
    const opts = clientPath;
    clientPath = opts.clientPath;
    scope = opts.scopeName || opts.scope;
    inputFingerprint = opts.fingerprint || opts.inputFingerprint;
  }
  const normPath = path.resolve(clientPath);
  const clientCache = sessionTestCache.get(normPath);
  if (!clientCache) return null;

  const cacheKey = `${scope}:${inputFingerprint}`;
  const entry = clientCache.get(cacheKey);
  if (entry && (entry.ok || entry.passed)) {
    return {
      ...entry,
      cacheHit: true,
      durationMs: 0,
    };
  }
  return null;
}

/**
 * Record successful test result into cache.
 */
function recordCachedResult(clientPath, scope, inputFingerprint, result) {
  if (typeof clientPath === 'object' && clientPath !== null) {
    const opts = clientPath;
    clientPath = opts.clientPath;
    scope = opts.scopeName || opts.scope;
    inputFingerprint = opts.fingerprint || opts.inputFingerprint;
    result = opts;
  }
  const normPath = path.resolve(clientPath);
  let clientCache = sessionTestCache.get(normPath);
  if (!clientCache) {
    clientCache = new Map();
    sessionTestCache.set(normPath, clientCache);
  }

  const cacheKey = `${scope}:${inputFingerprint}`;
  clientCache.set(cacheKey, {
    ...result,
    scope,
    inputFingerprint,
    ok: result && (result.ok !== undefined ? result.ok : result.passed),
    passed: result && (result.passed !== undefined ? result.passed : result.ok),
    cachedAt: new Date().toISOString(),
  });
}

/**
 * Invalidate cached results for a client repository.
 */
function invalidateCache(clientPath) {
  const normPath = path.resolve(clientPath);
  sessionTestCache.delete(normPath);
}

/**
 * Execute test runner with policy enforcement, fingerprint caching, and bounded retry.
 *
 * @param {object} options
 * @param {string} options.clientPath
 * @param {string} options.targetVersion
 * @param {string} [options.scope]
 * @param {string} [options.command='dotnet']
 * @param {string[]} [options.args=['test', '--no-build']]
 * @param {string} [options.cwd]
 * @param {number} [options.timeout=180000]
 * @param {number} [options.maxRetries=1]
 * @param {boolean} [options.forceRun=false]
 * @param {function} [options.onLog]
 * @returns {object} Verification result envelope with test decisions
 */
function executeWithPolicy(options) {
  const clientPath = options.clientPath;
  const cwd = options.cwd || clientPath;
  const log = typeof options.onLog === 'function' ? options.onLog : () => {};
  const maxRetries = options.maxRetries !== undefined ? options.maxRetries : 1;

  const scopeInfo = options.scopeInfo || resolveTestScope({
    isPatch: options.isPatch,
    upgradeMode: options.upgradeMode,
    breakingChangesCount: options.breakingChangesCount,
    clientPath,
    forceRegression: options.forceRegression,
  });

  const scope = options.scope || scopeInfo.scope;
  const inputFingerprint = computeInputFingerprint(clientPath, {
    targetVersion: options.targetVersion,
    tracks: options.tracks,
  });

  // Check result cache unless forced
  if (!options.forceRun) {
    const cached = getCachedResult(clientPath, scope, inputFingerprint);
    if (cached) {
      log(`[TEST_POLICY] [CACHE_HIT] Reusing valid ${scope} test result (fingerprint: ${inputFingerprint.slice(0, 8)}). Zero test subprocesses required.`);
      return {
        name: options.name || `${scope} Test Execution`,
        category: options.category || 'test',
        scope,
        status: 'PASSED',
        ok: true,
        durationMs: 0,
        exitCode: 0,
        reused: true,
        inputFingerprint,
        command: options.command ? `${options.command} ${(options.args || []).join(' ')}` : 'cached',
        details: `Reused successful ${scope} test results from cache (fingerprint: ${inputFingerprint.slice(0, 8)}).`,
        testDecisions: {
          scope,
          inputFingerprint,
          testsSelected: [`${scope} Suite`],
          testsSkipped: scope === TEST_LEVELS.TARGETED ? ['Broad regression suite (unnecessary for localized change)'] : [],
          testsReused: [`${scope} Result (fingerprint ${inputFingerprint.slice(0, 8)})`],
          testExecutionsCount: 0,
          retriesCount: 0,
          fullRegressionJustified: scopeInfo.fullRegressionJustified,
          justification: scopeInfo.justification,
        },
      };
    }
  }

  // If BuildOnly scope selected, skip test execution
  if (scope === TEST_LEVELS.BUILD_ONLY) {
    log(`[TEST_POLICY] [BUILD_ONLY] Test execution skipped per policy. Compilation verification sufficient.`);
    return {
      name: options.name || `${scope} Validation`,
      category: options.category || 'test',
      scope,
      status: 'SKIPPED',
      ok: true,
      durationMs: 0,
      exitCode: 0,
      reused: false,
      inputFingerprint,
      command: 'none (build-only mode)',
      details: 'Test execution skipped per policy; compilation verification sufficient.',
      testDecisions: {
        scope,
        inputFingerprint,
        testsSelected: [],
        testsSkipped: ['All tests (BuildOnly mode)'],
        testsReused: [],
        testExecutionsCount: 0,
        retriesCount: 0,
        fullRegressionJustified: false,
        justification: 'BuildOnly policy selected.',
      },
    };
  }

  // Construct command and args
  const command = options.command || 'dotnet';
  let args = options.args || ['test', '--no-build'];

  // Narrow args if Targeted scope
  if (scope === TEST_LEVELS.TARGETED && options.targetFilter) {
    args = [...args, '--filter', options.targetFilter];
  }

  log(`[TEST_POLICY] Executing ${scope} tests: ${command} ${args.join(' ')} (fingerprint: ${inputFingerprint.slice(0, 8)})...`);
  const started = Date.now();
  const execEnv = options.env ? Object.assign({}, process.env, options.env) : process.env;

  let res = cp.spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    timeout: options.timeout || 180000,
    shell: true,
    env: execEnv,
  });

  let durationMs = Date.now() - started;
  let exitCode = res.status !== null ? res.status : 1;
  let ok = exitCode === 0;
  let retriesCount = 0;

  // Bounded retry if failed and retry budget allows (max 1 retry for transient issues)
  if (!ok && maxRetries > 0) {
    const isTransient = /timeout|locked|file in use|access is denied/i.test((res.stderr || '') + (res.stdout || ''));
    if (isTransient) {
      retriesCount++;
      log(`[TEST_POLICY] Transient test failure detected. Retrying execution (attempt 1/${maxRetries})...`);
      const retryStart = Date.now();
      res = cp.spawnSync(command, args, {
        cwd,
        encoding: 'utf8',
        windowsHide: true,
        timeout: options.timeout || 180000,
        shell: true,
        env: execEnv,
      });
      durationMs += (Date.now() - retryStart);
      exitCode = res.status !== null ? res.status : 1;
      ok = exitCode === 0;
    } else {
      log(`[TEST_POLICY] Deterministic test failure encountered; refraining from blind reruns without code change.`);
    }
  }

  const result = {
    name: options.name || `${scope} Test Execution`,
    category: options.category || 'test',
    scope,
    status: ok ? 'PASSED' : 'FAILED',
    ok,
    durationMs,
    exitCode,
    reused: false,
    inputFingerprint,
    command: `${command} ${args.join(' ')}`,
    details: ok
      ? `${scope} tests passed successfully (${durationMs}ms).`
      : (res.stderr || res.stdout || 'Test execution failed.').trim(),
    testDecisions: {
      scope,
      inputFingerprint,
      testsSelected: [options.name || `${scope} Tests`],
      testsSkipped: scope === TEST_LEVELS.TARGETED ? ['Broad regression suite'] : [],
      testsReused: [],
      testExecutionsCount: 1 + retriesCount,
      retriesCount,
      fullRegressionJustified: scopeInfo.fullRegressionJustified,
      justification: scopeInfo.justification,
    },
  };

  // Cache successful result against fingerprint
  if (ok) {
    recordCachedResult(clientPath, scope, inputFingerprint, result);
  }

  return result;
}

module.exports = {
  TEST_LEVELS,
  computeInputFingerprint,
  resolveTestScope,
  getCachedResult,
  recordCachedResult,
  invalidateCache,
  executeWithPolicy,
  scanFiles,
};

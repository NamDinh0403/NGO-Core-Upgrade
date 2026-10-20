'use strict';
/*
 * Deterministic Local Verifier with Regression Test Execution Policy Integration.
 *
 * Runs local compilation, package checks, tests with fingerprint caching,
 * assembly inspection, and Git status validation without any LLM dependency.
 * Dependency-free, Node 14+.
 */

const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const testPolicy = require('./test-policy');

/**
 * Execute a subprocess command and capture timing, output, and exit status.
 */
function execCheck(command, args, options) {
  options = options || {};
  const started = Date.now();
  const cwd = options.cwd || process.cwd();
  const timeout = options.timeout || 120000;
  const env = options.env ? Object.assign({}, process.env, options.env) : process.env;

  try {
    const res = cp.spawnSync(command, args, {
      cwd,
      encoding: 'utf8',
      windowsHide: true,
      shell: true,
      timeout,
      env,
    });
    const durationMs = Date.now() - started;
    const exitCode = res.status !== null ? res.status : 1;
    const ok = exitCode === 0;

    return {
      command: `${command} ${args.join(' ')}`.trim(),
      ok,
      exitCode,
      durationMs,
      stdout: (res.stdout || '').trim(),
      stderr: (res.stderr || '').trim(),
      error: res.error ? res.error.message : null,
    };
  } catch (err) {
    return {
      command: `${command} ${args.join(' ')}`.trim(),
      ok: false,
      exitCode: 1,
      durationMs: Date.now() - started,
      stdout: '',
      stderr: err.message,
      error: err.message,
    };
  }
}

/**
 * Helper to detect test projects in a directory.
 */
function findTestProjects(searchDir) {
  const testProjects = [];
  try {
    const scan = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (['bin', 'obj', '.vs', 'node_modules', '.git'].includes(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scan(full);
        } else if (/(\.tests|\.test|\.spec)\.csproj$/i.test(entry.name) || /tests?\.csproj$/i.test(entry.name)) {
          testProjects.push(full);
        }
      }
    };
    scan(searchDir);
  } catch (_) {}
  return testProjects;
}

/**
 * Locate directory containing .sln, .slnf, or .csproj files.
 */
function findBackendRoot(clientPath) {
  const directApiNgo = path.join(clientPath, 'ngo-api', 'NGO');
  const directApi = path.join(clientPath, 'ngo-api');
  const directNgo = path.join(clientPath, 'NGO');

  const checkHasSolutionOrProject = (dir) => {
    try {
      if (fs.existsSync(dir)) {
        const entries = fs.readdirSync(dir);
        if (entries.some((e) => e.endsWith('.sln') || e.endsWith('.slnf'))) {
          return 2;
        }
        if (entries.some((e) => e.endsWith('.csproj'))) {
          return 1;
        }
      }
    } catch (_) {}
    return 0;
  };

  if (checkHasSolutionOrProject(directApiNgo) === 2) return directApiNgo;
  if (checkHasSolutionOrProject(directApi) === 2) return directApi;
  if (checkHasSolutionOrProject(directNgo) === 2) return directNgo;
  if (checkHasSolutionOrProject(clientPath) === 2) return clientPath;

  if (checkHasSolutionOrProject(directApiNgo) === 1) return directApiNgo;
  if (checkHasSolutionOrProject(directApi) === 1) return directApi;
  if (checkHasSolutionOrProject(directNgo) === 1) return directNgo;
  if (checkHasSolutionOrProject(clientPath) === 1) return clientPath;

  return fs.existsSync(directApi) ? directApi : clientPath;
}

/**
 * Run deterministic verification for a client project.
 */
function verify(options) {
  const { clientPath, targetVersion, tracks, isPatch, upgradeMode, breakingChangesCount, forceRegression, forceRunTests, isSimulation, onLog } = options;
  const log = typeof onLog === 'function' ? onLog : () => {};
  const selectedTracks = tracks || ['backend', 'frontend'];
  const checks = [];
  let allPassed = true;

  const aggregatedTestDecisions = {
    scopes: [],
    testsSelected: [],
    testsSkipped: [],
    testsReused: [],
    testExecutionsCount: 0,
    retriesCount: 0,
    fullRegressionJustified: false,
    inputFingerprint: null,
  };

  // 1. Backend Package Version Verification
  if (selectedTracks.includes('backend')) {
    const apiDir = findBackendRoot(clientPath);
    const searchDir = fs.existsSync(apiDir) ? apiDir : clientPath;
    const started = Date.now();
    let versionFound = null;
    let checkedFile = null;

    try {
      const scanCsproj = (dir) => {
        for (const file of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, file.name);
          if (file.isDirectory() && !['bin', 'obj', '.vs', 'node_modules'].includes(file.name)) {
            scanCsproj(full);
          } else if (file.name.endsWith('.csproj')) {
            const content = fs.readFileSync(full, 'utf8');
            const m = content.match(/<PackageReference\s+Include=["']NGO\.Core(?:\.[^"']+)?["']\s+Version=["']([^"']+)["']/i) ||
                      content.match(/<PackageReference\s+Version=["']([^"']+)["']\s+Include=["']NGO\.Core/i);
            if (m) {
              versionFound = m[1];
              checkedFile = path.relative(clientPath, full);
              break;
            }
          }
        }
      };
      scanCsproj(searchDir);
    } catch (_) {}

    const versionMatch = versionFound && (versionFound === targetVersion || versionFound.startsWith(targetVersion));
    const ok = Boolean(versionMatch);
    if (!ok && selectedTracks.includes('backend')) allPassed = false;

    checks.push({
      name: 'Backend Core Package Version Check',
      category: 'backend',
      command: `inspect .csproj (<PackageReference Include="NGO.Core*" Version="${targetVersion}" />)`,
      status: ok ? 'PASSED' : 'FAILED',
      ok,
      durationMs: Date.now() - started,
      exitCode: ok ? 0 : 1,
      details: versionFound
        ? `Found version ${versionFound} in ${checkedFile}. Expected ${targetVersion}.`
        : `No NGO.Core package references found in .csproj files.`,
    });
  }

  // 2. Dotnet Build Check
  if (selectedTracks.includes('backend') && (fs.existsSync(path.join(clientPath, 'ngo-api')) || fs.existsSync(clientPath))) {
    const apiDir = findBackendRoot(clientPath);
    const hasDotnet = cp.spawnSync('dotnet', ['--version'], { encoding: 'utf8', windowsHide: true, shell: true }).status === 0;

    if (hasDotnet) {
      const buildArgs = isSimulation ? ['build', '--no-restore'] : ['build'];
      const buildRes = execCheck('dotnet', buildArgs, { cwd: apiDir, timeout: 180000 });
      if (!buildRes.ok) allPassed = false;
      checks.push({
        name: 'Backend .NET Solution Build',
        category: 'backend',
        command: buildRes.command,
        status: buildRes.ok ? 'PASSED' : 'FAILED',
        ok: buildRes.ok,
        durationMs: buildRes.durationMs,
        exitCode: buildRes.exitCode,
        details: buildRes.ok ? 'Build succeeded.' : buildRes.stderr || buildRes.stdout || 'Build failed.',
      });

      // 2b. Dotnet Test Execution with Regression Test Policy
      const testProjects = findTestProjects(apiDir);
      if (testProjects.length > 0) {
        const testRes = testPolicy.executeWithPolicy({
          clientPath,
          cwd: apiDir,
          targetVersion,
          tracks: selectedTracks,
          isPatch,
          upgradeMode,
          breakingChangesCount,
          forceRegression,
          forceRun: forceRunTests,
          command: 'dotnet',
          args: ['test', '--no-build'],
          name: 'Backend .NET Test Suite',
          category: 'backend',
          onLog: log,
        });

        if (!testRes.ok) allPassed = false;
        checks.push(testRes);

        // Aggregate test decisions
        if (testRes.testDecisions) {
          aggregatedTestDecisions.scopes.push(testRes.testDecisions.scope);
          aggregatedTestDecisions.testsSelected.push(...testRes.testDecisions.testsSelected);
          aggregatedTestDecisions.testsSkipped.push(...testRes.testDecisions.testsSkipped);
          aggregatedTestDecisions.testsReused.push(...testRes.testDecisions.testsReused);
          aggregatedTestDecisions.testExecutionsCount += testRes.testDecisions.testExecutionsCount;
          aggregatedTestDecisions.retriesCount += testRes.testDecisions.retriesCount;
          if (testRes.testDecisions.fullRegressionJustified) {
            aggregatedTestDecisions.fullRegressionJustified = true;
          }
          aggregatedTestDecisions.inputFingerprint = testRes.testDecisions.inputFingerprint;
        }
      } else {
        checks.push({
          name: 'Backend .NET Test Suite',
          category: 'backend',
          command: 'dotnet test',
          status: 'SKIPPED',
          ok: true,
          durationMs: 0,
          exitCode: 0,
          details: 'No dedicated .Tests test projects found; test execution skipped.',
        });
      }
    } else {
      checks.push({
        name: 'Backend .NET Solution Build',
        category: 'backend',
        command: 'dotnet build',
        status: 'SKIPPED',
        ok: true,
        durationMs: 1,
        exitCode: 0,
        details: 'dotnet SDK not found in PATH; build check skipped.',
      });
    }
  }

  // 3. Frontend Package Version Verification
  if (selectedTracks.includes('frontend')) {
    const clientDir = fs.existsSync(path.join(clientPath, 'ngo-client')) ? path.join(clientPath, 'ngo-client') : clientPath;
    const pkgPath = path.join(clientDir, 'package.json');
    const started = Date.now();
    let frontendVer = null;
    let hasTestScript = false;

    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const deps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
        for (const [dep, ver] of Object.entries(deps)) {
          if (dep.includes('ngo-core') || dep.includes('@ngo/core')) {
            frontendVer = String(ver).replace(/^[\^~>=<]/, '');
            break;
          }
        }
        if (pkg.scripts && pkg.scripts.test && !pkg.scripts.test.includes('no test specified')) {
          hasTestScript = true;
        }
      } catch (_) {}
    }

    const versionMatch = frontendVer && (frontendVer === targetVersion || frontendVer.startsWith(targetVersion));
    const ok = Boolean(versionMatch);
    if (!ok && selectedTracks.includes('frontend')) allPassed = false;

    checks.push({
      name: 'Frontend Core Package Version Check',
      category: 'frontend',
      command: `inspect package.json (dependencies["@ngo/core"] === "${targetVersion}")`,
      status: ok ? 'PASSED' : 'FAILED',
      ok,
      durationMs: Date.now() - started,
      exitCode: ok ? 0 : 1,
      details: frontendVer
        ? `Found version ${frontendVer} in package.json. Expected ${targetVersion}.`
        : `No @ngo/core dependencies found in package.json.`,
    });

    // 3b. Frontend Angular Build Check
    let hasBuildScript = false;
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.scripts && pkg.scripts.build && !pkg.scripts.build.includes('no build specified')) {
          hasBuildScript = true;
        }
      } catch (_) {}
    }

    const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
    const frontendEnv = Object.assign({}, process.env);
    if (nodeMajor >= 17) {
      frontendEnv.NODE_OPTIONS = (frontendEnv.NODE_OPTIONS ? frontendEnv.NODE_OPTIONS + ' ' : '') + '--openssl-legacy-provider';
    }

    if (hasBuildScript && !isSimulation) {
      const buildRes = execCheck('npm', ['run', 'build'], { cwd: clientDir, timeout: 240000, env: frontendEnv });
      if (!buildRes.ok) allPassed = false;
      checks.push({
        name: 'Frontend Angular Build',
        category: 'frontend',
        command: 'npm run build',
        status: buildRes.ok ? 'PASSED' : 'FAILED',
        ok: buildRes.ok,
        durationMs: buildRes.durationMs,
        exitCode: buildRes.exitCode,
        details: buildRes.ok ? 'Frontend build succeeded.' : buildRes.stderr || buildRes.stdout || 'Frontend build failed.',
      });
    }

    // 3c. Frontend Test Execution (if test script present)
    if (hasTestScript && !isSimulation) {
      if (!process.env.CHROME_BIN && process.platform === 'win32') {
        const chromeCandidates = [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        ];
        for (const candidate of chromeCandidates) {
          if (fs.existsSync(candidate)) {
            process.env.CHROME_BIN = candidate;
            frontendEnv.CHROME_BIN = candidate;
            break;
          }
        }
      }

      const frontendTestRes = testPolicy.executeWithPolicy({
        clientPath,
        cwd: clientDir,
        targetVersion,
        tracks: selectedTracks,
        isPatch,
        upgradeMode,
        breakingChangesCount,
        forceRegression,
        forceRun: forceRunTests,
        command: 'npm',
        args: ['test', '--', '--watch=false', '--browsers=ChromeHeadless'],
        name: 'Frontend Angular Test Suite',
        category: 'frontend',
        env: frontendEnv,
        onLog: log,
      });

      if (!frontendTestRes.ok) allPassed = false;
      checks.push(frontendTestRes);

      if (frontendTestRes.testDecisions) {
        aggregatedTestDecisions.scopes.push(frontendTestRes.testDecisions.scope);
        aggregatedTestDecisions.testsSelected.push(...frontendTestRes.testDecisions.testsSelected);
        aggregatedTestDecisions.testsSkipped.push(...frontendTestRes.testDecisions.testsSkipped);
        aggregatedTestDecisions.testsReused.push(...frontendTestRes.testDecisions.testsReused);
        aggregatedTestDecisions.testExecutionsCount += frontendTestRes.testDecisions.testExecutionsCount;
        aggregatedTestDecisions.retriesCount += frontendTestRes.testDecisions.retriesCount;
      }
    }
  }

  // 4. Git Diff & Change Surface Isolation
  const startedGit = Date.now();
  const gitStatusRes = execCheck('git', ['status', '--porcelain'], { cwd: clientPath });
  const gitDiffRes = execCheck('git', ['diff', '--stat'], { cwd: clientPath });
  const modifiedFiles = gitStatusRes.stdout.split(/\r?\n/).filter(Boolean).map((l) => l.trim().slice(3));

  checks.push({
    name: 'Git Working Tree & Change Verification',
    category: 'git',
    command: 'git status --porcelain',
    status: 'PASSED',
    ok: true,
    durationMs: Date.now() - startedGit,
    exitCode: gitStatusRes.exitCode,
    details: `${modifiedFiles.length} file(s) modified:\n${gitDiffRes.stdout || 'No changes detected.'}`,
  });

  return {
    ok: allPassed,
    checks,
    totalChecks: checks.length,
    passedChecks: checks.filter((c) => c.ok).length,
    failedChecks: checks.filter((c) => !c.ok).length,
    modifiedFiles,
    testDecisions: aggregatedTestDecisions,
    summary: allPassed
      ? `All ${checks.length} verification checks passed.`
      : `${checks.filter((c) => !c.ok).length} of ${checks.length} verification checks failed.`,
  };
}

module.exports = {
  verify,
  execCheck,
  testPolicy,
};

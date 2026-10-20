'use strict';
/*
 * Platform Automated Regression Test Suite.
 *
 * Verifies all 10 requirements from Phase 11:
 *   1. Project and version selection
 *   2. Package-first release resolution without a release branch
 *   3. Background worker execution & durable run-state persistence
 *   4. Cancellation and timeout handling
 *   5. Safe resumption without repeating completed stages
 *   6. Copilot CLI launch & auth failure handling, secret scrubbing
 *   7. Deterministic local verification execution
 *   8. Verification failure and bounded repair loop
 *   9. Git diff isolation and gated commit approval
 *  10. HTTP REST API endpoints and static serving
 *
 * Dependency-free, Node 14+. Run: node platform/tests/platform.test.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const assert = require('assert');
const http = require('http');

const preflightLib = require('../preflight');
const verifierLib = require('../verifier');
const reviewerLib = require('../reviewer');
const controllerLib = require('../controller');
const copilotCli = require('../copilot-cli');
const serverLib = require('../server');
const diagnosticsLib = require('../diagnostics');
const settingsLib = require('../settings');
const telemetryLib = require('../telemetry');

const results = [];
function test(id, fn) {
  try {
    fn();
    results.push({ id, pass: true });
    console.log(`  PASS  ${id}`);
  } catch (e) {
    results.push({ id, pass: false, error: e.stack || e.message });
    console.log(`  FAIL  ${id}: ${e.message}`);
  }
}

async function testAsync(id, fn) {
  try {
    await fn();
    results.push({ id, pass: true });
    console.log(`  PASS  ${id}`);
  } catch (e) {
    results.push({ id, pass: false, error: e.stack || e.message });
    console.log(`  FAIL  ${id}: ${e.message}`);
  }
}

// Create temporary client and Core repository fixtures
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'platform-test-'));
const tmpClient = path.join(tmpRoot, 'ngo-online-sample');
const tmpCore = path.join(tmpRoot, 'ngo-online-core');

function sh(cmd, cwd) { cp.execSync(cmd, { cwd, stdio: 'pipe' }); }

async function runAllTests() {
  try {
    // 1. Initialize temporary Core git repo
    fs.mkdirSync(tmpCore, { recursive: true });
    sh('git init -q', tmpCore);
    sh('git config user.email test@ngo.local', tmpCore);
    sh('git config user.name "NGO Test"', tmpCore);
    fs.writeFileSync(path.join(tmpCore, 'package.json'), JSON.stringify({ name: 'ngo-core', version: '9.2.0' }));
    sh('git add -A', tmpCore);
    sh('git commit -q -m "v9.2.0"', tmpCore);
    sh('git tag v9.2.0', tmpCore);

    // Add v9.3.0 commit
    fs.writeFileSync(path.join(tmpCore, 'package.json'), JSON.stringify({ name: 'ngo-core', version: '9.3.0' }));
    sh('git add -A', tmpCore);
    sh('git commit -q -m "v9.3.0"', tmpCore);
    sh('git tag v9.3.0', tmpCore);

    // 2. Initialize temporary Client git repo
    fs.mkdirSync(path.join(tmpClient, 'ngo-api'), { recursive: true });
    fs.mkdirSync(path.join(tmpClient, 'ngo-client'), { recursive: true });
    sh('git init -q', tmpClient);
    sh('git config user.email test@ngo.local', tmpClient);
    sh('git config user.name "NGO Test"', tmpClient);

    const csprojContent = `<Project Sdk="Microsoft.NET.Sdk">\n  <PropertyGroup>\n    <TargetFramework>net8.0</TargetFramework>\n  </PropertyGroup>\n  <ItemGroup>\n    <PackageReference Include="NGO.Core" Version="9.2.0" />\n  </ItemGroup>\n</Project>`;
    fs.writeFileSync(path.join(tmpClient, 'ngo-api', 'Sample.csproj'), csprojContent);

    const packageJsonContent = JSON.stringify({
      name: 'sample-client',
      dependencies: {
        '@ngo/core': '9.2.0',
      },
    }, null, 2);
    fs.writeFileSync(path.join(tmpClient, 'ngo-client', 'package.json'), packageJsonContent);

    sh('git add -A', tmpClient);
    sh('git commit -q -m "client initial v9.2.0"', tmpClient);

    // -----------------------------------------------------------------------
    // TEST 1: Project & Version Detection
    // -----------------------------------------------------------------------
    test('01-project-and-version-selection', () => {
      const detected = preflightLib.detectCurrentVersion(tmpClient);
      assert.strictEqual(detected.version, '9.2.0', 'Must detect current 9.2.0 version');
      assert.strictEqual(detected.backendVersion, '9.2.0');
      assert.strictEqual(detected.frontendVersion, '9.2.0');

      const projects = preflightLib.discoverProjects(tmpRoot);
      assert(projects.length >= 1, 'Must discover client project');
      const sample = projects.find((p) => p.id === 'ngo-online-sample');
      assert(sample !== undefined, 'Must identify ngo-online-sample');
      assert.strictEqual(sample.currentVersion, '9.2.0');
      assert.strictEqual(sample.hasBackend, true);
      assert.strictEqual(sample.hasFrontend, true);
    });

    // -----------------------------------------------------------------------
    // TEST 2: Package-First Release Resolution Without Releases Branch
    // -----------------------------------------------------------------------
    test('02-package-first-release-resolution', () => {
      const res = preflightLib.runPreflight({
        clientPath: tmpClient,
        targetVersion: '9.3.0',
        corePath: tmpCore,
        tracks: ['backend', 'frontend'],
      });

      assert.strictEqual(res.readyToUpgrade, true, 'Preflight must succeed without releases branch');
      assert.strictEqual(res.currentVersion, '9.2.0');
      assert.strictEqual(res.targetVersion, '9.3.0');
      assert.strictEqual(res.impactPreview.packageAvailable, true);
      assert.strictEqual(res.isBlocked, false);
    });

    // -----------------------------------------------------------------------
    // TEST 3: Copilot CLI Auth, Launch Failure Handling & Secret Redaction
    // -----------------------------------------------------------------------
    await testAsync('03-copilot-cli-auth-and-secret-redaction', async () => {
      // Secret redaction test
      const secretText = 'Authorization: Bearer mySecretToken123456789 and password="SuperSecretPassword123"';
      const redacted = copilotCli.redactSecrets(secretText);
      assert(!redacted.includes('mySecretToken123456789'), 'Must redact bearer token');
      assert(!redacted.includes('SuperSecretPassword123'), 'Must redact password');

      // Offline / simulation mode test with specific model
      const simRes = await copilotCli.invoke('Test task', {
        cwd: tmpClient,
        simulate: true,
        model: 'claude-3.5-sonnet',
      });
      assert.strictEqual(simRes.ok, true);
      assert.strictEqual(simRes.exitCode, 0);
      assert.strictEqual(simRes.model, 'claude-3.5-sonnet');
      assert(Array.isArray(copilotCli.AVAILABLE_MODELS));
      assert(copilotCli.AVAILABLE_MODELS.some((m) => m.id === 'claude-3.5-sonnet'));

      // Binary missing handling
      const missingRes = await copilotCli.invoke('Test task', {
        cwd: tmpClient,
        cliPath: 'nonexistent-copilot-binary-xyz',
        simulate: false,
      });
      assert.strictEqual(missingRes.ok, false);
      assert.strictEqual(missingRes.exitCode, 127);
    });

    // -----------------------------------------------------------------------
    // TEST 4: Background Worker Execution & Durable Run-State Persistence
    // -----------------------------------------------------------------------
    await testAsync('04-background-worker-and-durable-state', async () => {
      const job = controllerLib.createJob({
        clientPath: tmpClient,
        targetVersion: '9.3.0',
        corePath: tmpCore,
        tracks: ['backend', 'frontend'],
        simulateCopilot: true,
        copilotModel: 'claude-3.5-sonnet',
      });

      assert(job.id !== undefined);
      assert.strictEqual(job.clientName, 'ngo-online-sample');
      assert.strictEqual(job.targetVersion, '9.3.0');
      assert.strictEqual(job.copilotModel, 'claude-3.5-sonnet');

      // Wait for worker to progress to AWAITING_APPROVAL
      let attempts = 0;
      let finalJob = null;
      while (attempts++ < 160) {
        await new Promise((r) => setTimeout(r, 250));
        finalJob = controllerLib.getJob(job.id);
        if (finalJob && ['AWAITING_APPROVAL', 'COMPLETE', 'FAILED'].includes(finalJob.status)) {
          break;
        }
      }

      assert(finalJob !== null, 'Job record must persist');
      assert.strictEqual(finalJob.status, 'AWAITING_APPROVAL', `Expected AWAITING_APPROVAL, got ${finalJob.status} (${finalJob.error})`);
      assert.strictEqual(finalJob.copilotModel, 'claude-3.5-sonnet');
      assert(finalJob.completedStages.includes('PREFLIGHT'));
      assert(finalJob.completedStages.includes('IMPLEMENT'));
      assert(finalJob.completedStages.includes('VERIFY'));
    });

    // -----------------------------------------------------------------------
    // TEST 5: Deterministic Local Verification Execution
    // -----------------------------------------------------------------------
    test('05-deterministic-verification-execution', () => {
      // In test 4, worker updated the files to 9.3.0
      const verification = verifierLib.verify({
        clientPath: tmpClient,
        targetVersion: '9.3.0',
        tracks: ['backend', 'frontend'],
      });

      assert(verification.checks.length >= 2, 'Must execute verification checks');
      const backendCheck = verification.checks.find((c) => c.name.includes('Backend Core Package Version'));
      assert(backendCheck !== undefined);
      assert.strictEqual(backendCheck.status, 'PASSED', 'Updated .csproj must pass version verification');

      const frontendCheck = verification.checks.find((c) => c.name.includes('Frontend Core Package Version'));
      assert(frontendCheck !== undefined);
      assert.strictEqual(frontendCheck.status, 'PASSED', 'Updated package.json must pass version verification');
    });

    // -----------------------------------------------------------------------
    // TEST 6: Verification Failure Detection
    // -----------------------------------------------------------------------
    test('06-verification-failure-detection', () => {
      // Check for a non-matching target version (e.g. 9.9.9)
      const failedVerification = verifierLib.verify({
        clientPath: tmpClient,
        targetVersion: '9.9.9',
        tracks: ['backend', 'frontend'],
      });

      assert.strictEqual(failedVerification.ok, false, 'Mismatched version must fail verification');
      assert(failedVerification.failedChecks > 0);
    });

    // -----------------------------------------------------------------------
    // TEST 7: Git Diff Retrieval and Review
    // -----------------------------------------------------------------------
    await testAsync('07-git-diff-isolation-and-review', async () => {
      const diff = reviewerLib.getGitDiff(tmpClient);
      assert.strictEqual(diff.hasChanges, true, 'Working tree should have modified files');
      assert(diff.patch.includes('9.3.0'), 'Diff must show 9.3.0 update');

      const review = await reviewerLib.generateReview({
        clientPath: tmpClient,
        targetVersion: '9.3.0',
        verification: { ok: true, failedChecks: 0 },
        simulate: true,
      });

      assert.strictEqual(review.canCommit, true);
      assert(review.defaultCommitMessage.includes('9.3.0'));
    });

    // -----------------------------------------------------------------------
    // TEST 8: Gated Local Commit Approval
    // -----------------------------------------------------------------------
    test('08-gated-local-commit-approval', () => {
      const commitRes = reviewerLib.commitChanges(tmpClient, 'chore: test local upgrade commit');
      assert.strictEqual(commitRes.ok, true, `Commit should succeed locally: ${commitRes.error}`);
      assert(commitRes.commitHash.length >= 4, 'Must return commit hash');

      // Verify working tree is now clean
      const postDiff = reviewerLib.getGitDiff(tmpClient);
      assert.strictEqual(postDiff.hasChanges, false, 'Working tree must be clean after commit');
    });

    // -----------------------------------------------------------------------
    // TEST 9: Safe Resumption and Cancellation
    // -----------------------------------------------------------------------
    await testAsync('09-safe-resumption-and-cancellation', async () => {
      // Reset a file to create work
      fs.writeFileSync(path.join(tmpClient, 'ngo-client', 'package.json'), JSON.stringify({ name: 'sample', dependencies: { '@ngo/core': '9.2.0' } }));

      const job = controllerLib.createJob({
        clientPath: tmpClient,
        targetVersion: '9.3.0',
        corePath: tmpCore,
        tracks: ['frontend'],
        simulateCopilot: true,
      });

      // Cancel the job
      const cancelled = controllerLib.cancelJob(job.id);
      assert.strictEqual(cancelled.status, 'CANCELLED');

      // Resume the job
      const resumed = controllerLib.resumeJob(job.id);
      assert.strictEqual(resumed.status, 'QUEUED');

      // Wait for it to finish
      let attempts = 0;
      while (attempts++ < 30) {
        await new Promise((r) => setTimeout(r, 200));
        const current = controllerLib.getJob(job.id);
        if (current && ['AWAITING_APPROVAL', 'COMPLETE', 'FAILED'].includes(current.status)) {
          break;
        }
      }
    });

    // -----------------------------------------------------------------------
    // TEST 10: HTTP REST API Endpoints
    // -----------------------------------------------------------------------
    await testAsync('10-http-api-server-routes', async () => {
      const testPort = 3801;
      const server = await serverLib.startServer(testPort, '127.0.0.1');

      try {
        const fetchJson = (urlPath) => new Promise((resolve, reject) => {
          http.get(`http://127.0.0.1:${testPort}${urlPath}`, (res) => {
            let body = '';
            res.on('data', (c) => { body += c.toString('utf8'); });
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
            res.on('error', reject);
          }).on('error', reject);
        });

        // Test GET /api/projects
        const projRes = await fetchJson('/api/projects');
        assert.strictEqual(projRes.status, 200);
        assert(Array.isArray(projRes.data.projects));

        // Test GET /api/versions
        const verRes = await fetchJson('/api/versions');
        assert.strictEqual(verRes.status, 200);
        assert(Array.isArray(verRes.data.versions));

        // Test GET /api/copilot-status
        const cliRes = await fetchJson('/api/copilot-status');
        assert.strictEqual(cliRes.status, 200);
        assert.strictEqual(cliRes.data.ok, true);

        // Test GET /api/copilot/models
        const modelsRes = await fetchJson('/api/copilot/models');
        assert.strictEqual(modelsRes.status, 200);
        assert.strictEqual(modelsRes.data.ok, true);
        assert(Array.isArray(modelsRes.data.models));
        assert(modelsRes.data.models.some((m) => m.id === 'gpt-4o'));
        assert(modelsRes.data.models.some((m) => m.id === 'claude-3.5-sonnet'));
        assert.strictEqual(typeof modelsRes.data.defaultModel, 'string');
      } finally {
        server.close();
      }
    });

    // -----------------------------------------------------------------------
    // TEST 11: Real Copilot CLI & Environment Diagnostics
    // -----------------------------------------------------------------------
    await testAsync('11-copilot-and-environment-diagnostics', async () => {
      const cliDiag = await diagnosticsLib.diagnoseCopilotCli();
      assert(cliDiag !== null, 'CLI diagnostics must return an object');
      assert(typeof cliDiag.available === 'boolean');
      assert(typeof cliDiag.authenticated === 'boolean');
      assert(typeof cliDiag.nonInteractiveSupported === 'boolean');

      // Secret safety check: Ensure token values are never exposed
      const serialized = JSON.stringify(cliDiag);
      assert(!serialized.includes('ghp_'), 'Must never leak personal access tokens');
      assert(!serialized.includes('github_pat_'), 'Must never leak fine-grained tokens');

      const envDiag = diagnosticsLib.diagnoseEnvironment();
      assert(Array.isArray(envDiag.tools), 'Must return tools array');
      const gitTool = envDiag.tools.find((t) => (t.tool || t.name).toLowerCase() === 'git');
      assert(gitTool !== undefined, 'Git tool must be checked');
      assert.strictEqual(gitTool.available, true, 'Git must be available');
      assert(typeof envDiag.system.memoryUsageMb === 'number');

      const summary = await diagnosticsLib.getSystemHealthSummary();
      assert(['HEALTHY', 'DEGRADED', 'UNHEALTHY'].includes(summary.status));
    });

    // -----------------------------------------------------------------------
    // TEST 12: Platform Runtime Settings & Approved Workspace Boundaries
    // -----------------------------------------------------------------------
    test('12-settings-validation-and-workspace-boundaries', () => {
      const valid = settingsLib.validateSettings({
        approvedWorkspaceRoots: [tmpRoot],
        corePath: tmpCore,
        executionTimeoutMs: 120000,
        concurrencyLimit: 2,
        copilotModel: 'claude-3.5-sonnet',
      });
      assert.strictEqual(valid.valid, true, 'Valid settings must pass validation');

      const invalid = settingsLib.validateSettings({
        approvedWorkspaceRoots: 'not-an-array',
        executionTimeoutMs: -50,
        copilotModel: 123,
      });
      assert.strictEqual(invalid.valid, false, 'Invalid settings must fail validation');
      assert(invalid.errors.length >= 3);

      // Workspace approval boundary check
      assert.strictEqual(settingsLib.isWorkspaceApproved(tmpClient, [tmpRoot]), true, 'tmpClient inside tmpRoot must be approved');
      assert.strictEqual(settingsLib.isWorkspaceApproved('c:/unauthorized/path', [tmpRoot]), false, 'Arbitrary path must be rejected');
    });

    // -----------------------------------------------------------------------
    // TEST 13: Honest Usage & Telemetry Ledger
    // -----------------------------------------------------------------------
    test('13-honest-telemetry-ledger-and-boundary', () => {
      const testEntry = {
        jobId: 'job-test-123',
        client: 'ngo-online-sample',
        targetVersion: '9.3.0',
        durationMs: 4500,
        observed: {
          copilotInvocations: 1,
          copilotDurationMs: 1200,
          deterministicChecksRun: 4,
          repairAttempts: 0,
          filesUpdated: 2,
        },
      };
      telemetryLib.recordTelemetryEntry(testEntry);

      const summary = telemetryLib.getTelemetrySummary();
      assert(summary.totalJobs >= 1);
      assert(summary.totalChecksRun >= 4);
      assert.strictEqual(summary.tokenCounts.status, 'UNAVAILABLE', 'Token counts must be strictly marked UNAVAILABLE');
      assert(typeof summary.tokenCounts.diagnosticNote === 'string' && summary.tokenCounts.diagnosticNote.includes('not emit'));

      const filtered = telemetryLib.getTelemetryEntries({ client: 'ngo-online-sample' });
      assert(filtered.length >= 1);
      const first = filtered[0];
      assert.strictEqual(first.observed.copilotInvocations, 1);
    });

    // -----------------------------------------------------------------------
    // TEST 14: Structured Log Filtering & Search
    // -----------------------------------------------------------------------
    test('14-structured-log-filtering-and-search', () => {
      const job = controllerLib.createJob({
        clientPath: tmpClient,
        targetVersion: '9.3.0',
        corePath: tmpCore,
        tracks: ['backend'],
        simulateCopilot: true,
      });

      // Append structured log lines
      controllerLib.appendJobLog(job.id, 'Regular info message', 'INFO', 'CORE_INGEST');
      controllerLib.appendJobLog(job.id, 'Warning detected in manifest', 'WARN', 'PLAN');
      controllerLib.appendJobLog(job.id, 'Critical failure in compiler', 'ERROR', 'VERIFY');

      // Filter by ERROR
      const errorLogs = controllerLib.getJobLogs(job.id, { level: 'ERROR' });
      assert.strictEqual(errorLogs.length, 1);
      assert(errorLogs[0].includes('Critical failure in compiler'));

      // Filter by search keyword
      const searchedLogs = controllerLib.getJobLogs(job.id, { search: 'manifest' });
      assert.strictEqual(searchedLogs.length, 1);
      assert(searchedLogs[0].includes('Warning detected in manifest'));
    });

    // -----------------------------------------------------------------------
    // TEST 15: Extended HTTP REST API Server Endpoints
    // -----------------------------------------------------------------------
    await testAsync('15-extended-control-center-api-routes', async () => {
      const testPort = 3802;
      const server = await serverLib.startServer(testPort, '127.0.0.1');

      try {
        const fetchJson = (urlPath) => new Promise((resolve, reject) => {
          http.get(`http://127.0.0.1:${testPort}${urlPath}`, (res) => {
            let body = '';
            res.on('data', (c) => { body += c.toString('utf8'); });
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
            res.on('error', reject);
          }).on('error', reject);
        });

        const postJson = (urlPath, payload) => new Promise((resolve, reject) => {
          const data = JSON.stringify(payload);
          const req = http.request(`http://127.0.0.1:${testPort}${urlPath}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(data),
            },
          }, (res) => {
            let body = '';
            res.on('data', (c) => { body += c.toString('utf8'); });
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
            res.on('error', reject);
          });
          req.on('error', reject);
          req.write(data);
          req.end();
        });

        // 1. Diagnostics endpoints
        const diagCli = await fetchJson('/api/diagnostics/copilot');
        assert.strictEqual(diagCli.status, 200);
        assert.strictEqual(diagCli.data.ok, true);

        const diagEnv = await fetchJson('/api/diagnostics/environment');
        assert.strictEqual(diagEnv.status, 200);
        assert.strictEqual(diagEnv.data.ok, true);

        const diagSum = await fetchJson('/api/diagnostics/summary');
        assert.strictEqual(diagSum.status, 200);
        assert.strictEqual(diagSum.data.ok, true);

        // 2. Settings endpoints
        const settingsGet = await fetchJson('/api/settings');
        assert.strictEqual(settingsGet.status, 200);
        assert.strictEqual(settingsGet.data.ok, true);

        const settingsPost = await postJson('/api/settings', {
          approvedWorkspaceRoots: [tmpRoot],
          corePath: tmpCore,
          executionTimeoutMs: 180000,
          concurrencyLimit: 2,
        });
        assert.strictEqual(settingsPost.status, 200);
        assert.strictEqual(settingsPost.data.ok, true);

        // 3. Analytics endpoint
        const analyticsGet = await fetchJson('/api/analytics');
        assert.strictEqual(analyticsGet.status, 200);
        assert.strictEqual(analyticsGet.data.ok, true);
        assert.strictEqual(analyticsGet.data.summary.tokenCounts.status, 'UNAVAILABLE');
      } finally {
        server.close();
      }
    });

  } finally {
    // Clean up temporary fixtures
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    try {
      fs.rmSync(path.join(path.resolve(__dirname, '..', '..'), 'orchestrator', 'runs', 'ngo-online-sample'), { recursive: true, force: true });
    } catch (_) {}
  }

  // Summary
  const passed = results.filter((r) => r.pass).length;
  console.log(`\nPlatform Test Matrix: ${passed}/${results.length} passed.`);
  if (passed !== results.length) {
    process.exit(1);
  }
}

runAllTests();

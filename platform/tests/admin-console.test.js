'use strict';
/**
 * Test Suite: Platform Administration Console & Integration Services
 *
 * Verifies:
 * 1. Automatic Workspace Discovery across approved roots
 * 2. Directory skipping rationale and candidate path validation
 * 3. 7-facet Azure DevOps & NuGet Authentication Matrix
 * 4. PAT isolation and security (never returned in responses or settings.json)
 * 5. Real Copilot CLI and Environment toolchain detection
 * 6. Server REST APIs for discovery, path validation, and auth status
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const http = require('http');

const discoveryLib = require('../discovery');
const settingsLib = require('../settings');
const diagnosticsLib = require('../diagnostics');
const nugetSourcesLib = require('../nuget-sources');
const serverLib = require('../server');

async function runAdminConsoleTests() {
  console.log('--- RUNNING PLATFORM ADMINISTRATION CONSOLE TEST SUITE ---');
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  PASS  ${name}`);
      passed++;
    } catch (err) {
      console.error(`  FAIL  ${name}: ${err.message}`);
      throw err;
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  PASS  ${name}`);
      passed++;
    } catch (err) {
      console.error(`  FAIL  ${name}: ${err.message}`);
      throw err;
    }
  }

  // 1. Workspace Discovery Service
  test('01-workspace-discovery-approved-roots', () => {
    const parentRoot = 'd:\\NGO Client';
    const result = discoveryLib.discoverWorkspaceProjects({
      approvedWorkspaceRoots: [parentRoot],
      corePath: 'd:\\NGO Client\\NGO Core Upgrade\\ingest\\test-corpus\\core-repo',
    });

    assert.strictEqual(result.ok, true);
    assert(Array.isArray(result.projects));
    assert(Array.isArray(result.skipped));
    assert(result.totalDiscovered > 0, 'Should discover sibling NGO client repositories');
    assert(result.totalSkipped >= 0);

    // Verify discovered project structure
    const sample = result.projects[0];
    assert(sample.id, 'Project must have an ID');
    assert(sample.path, 'Project must have a path');
    assert(sample.installedCoreVersion, 'Project must report installed Core version');
    assert(typeof sample.isGit === 'boolean', 'Project must report Git status');
    assert(['READY', 'VERSION_MISMATCH', 'DIRTY_GIT', 'NON_GIT'].includes(sample.status));
  });

  // 2. Candidate Workspace Path Validation
  test('02-validate-client-path-boundaries', () => {
    // Valid sibling project
    const validRes = discoveryLib.validateClientPath('d:\\NGO Client\\ngo-online-brc');
    assert.strictEqual(validRes.valid, true);
    assert.strictEqual(validRes.isApproved, true);
    assert.strictEqual(validRes.project.id, 'ngo-online-brc');

    // Invalid non-existent path
    const invalidRes = discoveryLib.validateClientPath('d:\\NGO Client\\does-not-exist-xyz');
    assert.strictEqual(invalidRes.valid, false);
    assert.strictEqual(invalidRes.reason, 'Directory does not exist');

    // Upstream core repo / platform engine should be skipped / invalid client
    const coreRes = discoveryLib.validateClientPath('d:\\NGO Client\\NGO Core Upgrade', ['d:\\NGO Client']);
    assert.strictEqual(coreRes.valid, false);
    assert(coreRes.reason.includes('Core') || coreRes.reason.includes('Upstream') || coreRes.reason.includes('non-client'));
  });

  // 3. Credential Storage & PAT Sanitization
  test('03-credential-isolation-and-security', () => {
    // Save a mock PAT
    const testPat = 'test-azure-pat-token-secret-12345';
    settingsLib.setStoredAzurePat(testPat);
    assert.strictEqual(settingsLib.hasStoredAzurePat(), true);

    // Verify sanitization
    const loaded = settingsLib.loadSettings();
    const sanitized = settingsLib.sanitizeSettingsForClient(loaded);

    assert.strictEqual(sanitized.hasAzureDevOpsPat, true);
    assert.strictEqual(sanitized.azureDevOpsPat, undefined, 'Secret PAT must NEVER be returned in sanitized client settings');

    // Verify public settings.json on disk does NOT contain the secret
    const settingsDisk = fs.readFileSync(path.join(__dirname, '../config/settings.json'), 'utf8');
    assert(!settingsDisk.includes(testPat), 'Secret PAT must NEVER be written to settings.json');

    // Clean up
    settingsLib.clearStoredAzurePat();
    assert.strictEqual(settingsLib.hasStoredAzurePat(), false);
  });

  // 4. Copilot CLI Real Diagnostics
  test('04-copilot-cli-diagnostics-real-executable', () => {
    const diag = diagnosticsLib.diagnoseCopilotCli();
    assert.strictEqual(diag.available, true, 'Copilot CLI should be detected');
    assert(diag.executablePath && diag.executablePath.includes('copilot'), 'Should resolve real executable path');
    assert(diag.version && diag.version.includes('.'), 'Should report actual CLI version');
    assert(['HEALTHY', 'SIGN_IN_REQUIRED'].includes(diag.status));
    assert.strictEqual(diag.nonInteractiveSupported, true);
    assert(Array.isArray(diag.remediationSteps));
  });

  // 5. 7-Facet Azure DevOps & NuGet Authentication Matrix
  await testAsync('05-comprehensive-7-facet-auth-diagnostics', async () => {
    const authStatus = await nugetSourcesLib.getComprehensiveAuthDiagnostics();
    assert.strictEqual(authStatus.ok, true);
    assert(['AUTHENTICATED', 'SIGN_IN_REQUIRED', 'ERROR'].includes(authStatus.overallStatus));
    assert(authStatus.feedUrl && authStatus.feedUrl.includes('preciofishbone'));

    // Check all 7 facets exist
    const facets = authStatus.facets;
    assert(facets.azureCli, 'Facet 1 (azureCli) must exist');
    assert(facets.azureCliLogin, 'Facet 2 (azureCliLogin) must exist');
    assert(facets.azureDevOpsOrg, 'Facet 3 (azureDevOpsOrg) must exist');
    assert(facets.feedReachability, 'Facet 4 (feedReachability) must exist');
    assert(facets.credentialProvider, 'Facet 5 (credentialProvider) must exist');
    assert(facets.feedAuthentication, 'Facet 6 (feedAuthentication) must exist');
    assert(facets.packageReadPermission, 'Facet 7 (packageReadPermission) must exist');

    // Facet 1: Azure CLI
    assert.strictEqual(typeof facets.azureCli.installed, 'boolean');
    // Facet 4: Reachability
    assert.strictEqual(facets.feedReachability.reachable, true);
    // Facet 5: Credential Provider
    assert.strictEqual(facets.credentialProvider.installed, true);
  });

  // 6. Server REST APIs
  await testAsync('06-admin-console-server-routes', async () => {
    const testPort = 3803;
    const server = await serverLib.startServer(testPort, '127.0.0.1');

    const fetchJson = (urlPath, opts = {}) => new Promise((resolve, reject) => {
      const parsed = new URL(`http://127.0.0.1:${testPort}${urlPath}`);
      const req = http.request(parsed, {
        method: opts.method || 'GET',
        headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }
      }, (res) => {
        let body = '';
        res.on('data', (c) => { body += c.toString('utf8'); });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (_) {
            resolve({ status: res.statusCode, body });
          }
        });
        res.on('error', reject);
      });
      req.on('error', reject);
      if (opts.body) req.write(JSON.stringify(opts.body));
      req.end();
    });

    try {
      // 1. GET /api/workspace/discover
      const discRes = await fetchJson('/api/workspace/discover');
      assert.strictEqual(discRes.status, 200);
      assert.strictEqual(discRes.data.ok, true);
      assert(discRes.data.totalDiscovered > 0);
      assert(Array.isArray(discRes.data.projects));

      // 2. POST /api/workspace/validate-path
      const valRes = await fetchJson('/api/workspace/validate-path', {
        method: 'POST',
        body: { path: 'd:\\NGO Client\\ngo-online-brc' }
      });
      assert.strictEqual(valRes.status, 200);
      assert.strictEqual(valRes.data.ok, true);
      assert.strictEqual(valRes.data.validation.valid, true);

      // 3. GET /api/nuget/auth-status
      const authRes = await fetchJson('/api/nuget/auth-status');
      assert.strictEqual(authRes.status, 200);
      assert.strictEqual(authRes.data.ok, true);
      assert(authRes.data.facets.azureCli);
      assert(authRes.data.facets.feedReachability);

      // 4. GET /api/settings (verify no PAT returned)
      const setRes = await fetchJson('/api/settings');
      assert.strictEqual(setRes.status, 200);
      assert.strictEqual(setRes.data.ok, true);
      assert.strictEqual(setRes.data.settings.azureDevOpsPat, undefined);
      assert(typeof setRes.data.settings.hasAzureDevOpsPat === 'boolean');
    } finally {
      server.close();
    }
  });

  console.log(`\nAdmin Console Test Matrix: ${passed}/${total} passed.\n`);
  return { passed, total };
}

if (require.main === module) {
  runAdminConsoleTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runAdminConsoleTests };

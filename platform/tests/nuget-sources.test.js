'use strict';
/*
 * NuGet Feed Authentication and Package Source Diagnostics Test Suite.
 *
 * Validates:
 *   1. Source discovery and classification (public vs private vs local).
 *   2. Provider-native credential acquisition (CredentialProvider.Microsoft, PAT, MSAL).
 *   3. Secret redaction and JWT identity extraction without credential leakage.
 *   4. Connectivity probing and status distinction (200, 401 UNAUTHENTICATED, 403 FORBIDDEN, timeout).
 *   5. Package availability verification distinguishing AUTH_FAILED from NOT_FOUND.
 *   6. In-memory cache invalidation and reauthentication.
 *   7. HTTP REST API endpoints on local server.
 *
 * Dependency-free, Node 14+. Run: node platform/tests/nuget-sources.test.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert');

const nugetSources = require('../nuget-sources');
const serverLib = require('../server');

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

async function runSuite() {
  console.log('\n--- NuGet Feed Authentication & Diagnostics Test Suite ---\n');

  // -------------------------------------------------------------------------
  // TEST 1: Source Type Classification
  // -------------------------------------------------------------------------
  test('01-classify-source-types', () => {
    assert.strictEqual(
      nugetSources.classifySourceType('https://api.nuget.org/v3/index.json'),
      'PUBLIC_NUGET_ORG'
    );
    assert.strictEqual(
      nugetSources.classifySourceType('https://pkgs.dev.azure.com/myorg/_packaging/myfeed/nuget/v3/index.json'),
      'AZURE_ARTIFACTS'
    );
    assert.strictEqual(
      nugetSources.classifySourceType('https://myorg.pkgs.visualstudio.com/_packaging/myfeed/nuget/v3/index.json'),
      'AZURE_ARTIFACTS'
    );
    assert.strictEqual(
      nugetSources.classifySourceType('https://nuget.pkg.github.com/myorg/index.json'),
      'GITHUB_PACKAGES'
    );
    assert.strictEqual(
      nugetSources.classifySourceType('https://custom.internal.feed/v3/index.json'),
      'PRIVATE_NUGET_V3'
    );
    assert.strictEqual(
      nugetSources.classifySourceType('C:\\Program Files (x86)\\Microsoft SDKs\\NuGetPackages\\'),
      'LOCAL_DIRECTORY'
    );
    assert.strictEqual(
      nugetSources.classifySourceType('file:///D:/LocalPackages'),
      'LOCAL_DIRECTORY'
    );
  });

  // -------------------------------------------------------------------------
  // TEST 2: Source Discovery
  // -------------------------------------------------------------------------
  test('02-discover-configured-package-sources', () => {
    const sources = nugetSources.discoverPackageSources();
    assert(Array.isArray(sources), 'Sources must be an array');
    assert(sources.length > 0, 'Must discover at least one source');

    // Must find public nuget.org
    const nugetOrg = sources.find((s) => s.type === 'PUBLIC_NUGET_ORG');
    assert(nugetOrg, 'Must discover nuget.org source');
    assert.strictEqual(nugetOrg.isPrivate, false, 'nuget.org must be marked public');

    // Must find or default NGO Online Azure Artifacts feed
    const ngoFeed = sources.find((s) => s.type === 'AZURE_ARTIFACTS');
    assert(ngoFeed, 'Must discover Azure Artifacts feed');
    assert.strictEqual(ngoFeed.isPrivate, true, 'Azure Artifacts must be marked private');
    assert.strictEqual(ngoFeed.authSupported, true, 'Azure Artifacts must support auth');
  });

  // -------------------------------------------------------------------------
  // TEST 3: Secret Redaction
  // -------------------------------------------------------------------------
  test('03-redact-secrets-from-diagnostic-output', () => {
    const rawWithBearer = 'Error calling https://feed: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ.eyJuYW1laWQiOiJ1c2VyMSJ9.signature123';
    const cleanBearer = nugetSources.redactSecrets(rawWithBearer);
    assert(!cleanBearer.includes('signature123'), 'JWT / Bearer token must be redacted');
    assert(cleanBearer.includes('***REDACTED***'), 'Redaction placeholder must be present');

    const rawWithBasic = 'Header: Basic dXNlcm5hbWU6cGFzc3dvcmQxMjM=';
    const cleanBasic = nugetSources.redactSecrets(rawWithBasic);
    assert(!cleanBasic.includes('dXNlcm5hbWU6cGFzc3dvcmQxMjM='), 'Basic credentials must be redacted');

    const rawWithPassword = 'password = "supersecrettoken123"';
    const cleanPassword = nugetSources.redactSecrets(rawWithPassword);
    assert(!cleanPassword.includes('supersecrettoken123'), 'Passwords must be redacted');
  });

  // -------------------------------------------------------------------------
  // TEST 4: JWT Identity Extraction
  // -------------------------------------------------------------------------
  test('04-extract-jwt-identity-without-leaking-signature', () => {
    // Generate valid base64 payload JWT structure
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(JSON.stringify({
      nameid: 'developer@example.com',
      upn: 'dev@example.com',
      iss: 'https://vsts.visualstudio.com/'
    })).toString('base64');
    const dummyJwt = `${header}.${payload}.secret_signature_not_to_be_read`;

    const identity = nugetSources.extractJwtIdentity(dummyJwt);
    assert.strictEqual(identity, 'developer@example.com', 'Must extract nameid claim safely');
  });

  // -------------------------------------------------------------------------
  // TEST 5: Credential Provider Detection & Azure Artifacts Credentials
  // -------------------------------------------------------------------------
  test('05-credential-provider-or-env-pat-resolution', () => {
    const credExe = nugetSources.findAzureArtifactsCredentialProvider();
    // Credential provider exists in Visual Studio 18 Enterprise on this system
    assert(credExe !== null, 'Visual Studio CredentialProvider.Microsoft.exe must be detected');
    assert(fs.existsSync(credExe), 'Detected CredentialProvider path must exist on disk');

    const creds = nugetSources.getAzureArtifactsCredentials(
      'https://pkgs.dev.azure.com/preciofishbone/_packaging/NGO_Online_feed/nuget/v3/index.json'
    );
    assert(creds.ok, 'Must acquire Azure Artifacts credentials');
    assert(creds.authHeader.startsWith('Basic ') || creds.authHeader.startsWith('Bearer '), 'Auth header must be Basic or Bearer authorization');
    assert(creds.accountIdentity !== null, 'Account identity must be resolved');
  });

  // -------------------------------------------------------------------------
  // TEST 6: Local Directory Source Connectivity
  // -------------------------------------------------------------------------
  await testAsync('06-local-directory-source-connectivity', async () => {
    const testDir = path.join(__dirname, '..');
    const diag = await nugetSources.testFeedConnection({
      name: 'Local Platform Dir',
      url: testDir
    });
    assert.strictEqual(diag.connectionStatus, 'CONNECTED');
    assert.strictEqual(diag.authStatus, 'NOT_REQUIRED');
    assert.strictEqual(diag.statusCode, 200);

    const nonExistentDir = path.join(__dirname, 'non_existent_dir_12345');
    const failDiag = await nugetSources.testFeedConnection({
      name: 'Missing Dir',
      url: nonExistentDir
    });
    assert.strictEqual(failDiag.connectionStatus, 'NETWORK_ERROR');
    assert.strictEqual(failDiag.statusCode, 404);
  });

  // -------------------------------------------------------------------------
  // TEST 7: Mock Private Feed Authentication Failures (401 & 403)
  // -------------------------------------------------------------------------
  await testAsync('07-mock-private-feed-auth-failures-401-and-403', async () => {
    // Spin up lightweight mock HTTP server
    const mockServer = http.createServer((req, res) => {
      if (req.url === '/401-feed/index.json') {
        res.writeHead(401, {
          'Content-Type': 'application/json',
          'WWW-Authenticate': 'Bearer authorization_uri="https://login.microsoftonline.com/tenant"'
        });
        res.end(JSON.stringify({ message: 'Unauthorized' }));
      } else if (req.url === '/403-feed/index.json') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Forbidden' }));
      } else if (req.url === '/200-feed/index.json') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ version: '3.0.0', resources: [] }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise((resolve) => mockServer.listen(0, '127.0.0.1', resolve));
    const port = mockServer.address().port;

    try {
      // 1. Test 401 handling
      const diag401 = await nugetSources.testFeedConnection({
        name: 'Mock 401 Feed',
        url: `http://127.0.0.1:${port}/401-feed/index.json`
      });
      assert.strictEqual(diag401.connectionStatus, 'UNAUTHENTICATED');
      assert.strictEqual(diag401.authStatus, 'AUTH_REQUIRED');
      assert.strictEqual(diag401.statusCode, 401);
      assert(diag401.remediation !== null, 'Must provide remediation for 401');

      // 2. Test 403 handling
      const diag403 = await nugetSources.testFeedConnection({
        name: 'Mock 403 Feed',
        url: `http://127.0.0.1:${port}/403-feed/index.json`
      });
      assert.strictEqual(diag403.connectionStatus, 'FORBIDDEN');
      assert.strictEqual(diag403.authStatus, 'FORBIDDEN');
      assert.strictEqual(diag403.statusCode, 403);
      assert(diag403.remediation.includes('permissions'), 'Must mention permissions in 403 remediation');

      // 3. Test 200 handling
      const diag200 = await nugetSources.testFeedConnection({
        name: 'Mock 200 Feed',
        url: `http://127.0.0.1:${port}/200-feed/index.json`
      });
      assert.strictEqual(diag200.connectionStatus, 'CONNECTED');
      assert.strictEqual(diag200.statusCode, 200);

    } finally {
      mockServer.close();
    }
  });

  // -------------------------------------------------------------------------
  // TEST 8: Package Availability Verification (Absence vs Auth Failure)
  // -------------------------------------------------------------------------
  await testAsync('08-distinguish-package-absence-from-auth-failure', async () => {
    // 1. Verify installed version exists in local cache
    const avail94 = await nugetSources.verifyPackageAvailability('9.4.0');
    assert.strictEqual(avail94.available, true);
    assert.strictEqual(avail94.status, 'CONFIRMED_AVAILABLE');

    // 2. Spin up a mock server with both an accessible feed and an unauthenticated private feed
    const mockServer = http.createServer((req, res) => {
      if (req.url.startsWith('/reachable-feed')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          version: '3.0.0',
          resources: [
            {
              '@id': `http://${req.headers.host}/search`,
              '@type': 'SearchQueryService',
            },
          ],
        }));
      } else if (req.url.startsWith('/search')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: [] }));
      } else if (req.url.startsWith('/unauth-feed')) {
        res.writeHead(401, { 'Www-Authenticate': 'Bearer error="invalid_token"' });
        res.end(JSON.stringify({ message: 'Unauthorized' }));
      }
    });

    await new Promise((resolve) => mockServer.listen(0, '127.0.0.1', resolve));
    const port = mockServer.address().port;

    try {
      // 2a. When feeds are reachable and package does not exist, return NOT_FOUND (never AUTH_FAILED)
      const availNotFound = await nugetSources.verifyPackageAvailability('999.888.777', {
        sources: [
          { name: 'Mock Reachable', url: `http://127.0.0.1:${port}/reachable-feed/index.json`, type: 'PUBLIC_NUGET_ORG' },
        ],
        bypassCache: true,
      });
      assert.strictEqual(availNotFound.available, false);
      assert.strictEqual(availNotFound.failureType, 'NOT_FOUND');
      assert.strictEqual(availNotFound.status, 'UNVERIFIED');

      // 2b. When a private feed fails auth, return AUTH_REQUIRED (never falsely report NOT_FOUND)
      const availAuthFail = await nugetSources.verifyPackageAvailability('999.888.777', {
        sources: [
          { name: 'Mock Private', url: `http://127.0.0.1:${port}/unauth-feed/index.json`, type: 'PRIVATE_NUGET_V3' },
        ],
        bypassCache: true,
      });
      assert.strictEqual(availAuthFail.available, false);
      assert.strictEqual(availAuthFail.failureType, 'AUTH_REQUIRED');
      assert.strictEqual(availAuthFail.status, 'AUTH_FAILED');
    } finally {
      mockServer.close();
    }
  });

  // -------------------------------------------------------------------------
  // TEST 9: In-Memory Cache Invalidation and Refresh
  // -------------------------------------------------------------------------
  test('09-refresh-package-metadata-cache', () => {
    const res = nugetSources.refreshPackageMetadataCache();
    assert.strictEqual(res.ok, true);
    assert(res.clearedAt !== undefined);
  });

  // -------------------------------------------------------------------------
  // TEST 10: HTTP REST API Endpoints
  // -------------------------------------------------------------------------
  await testAsync('10-http-rest-api-nuget-routes', async () => {
    const testPort = 3899;
    const server = await serverLib.startServer(testPort, '127.0.0.1');

    const fetchJson = (pathname, method = 'GET', body = null) => {
      return new Promise((resolve, reject) => {
        const req = http.request({
          hostname: '127.0.0.1',
          port: testPort,
          path: pathname,
          method,
          headers: { 'Content-Type': 'application/json' }
        }, (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => {
            try {
              resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
            } catch (_) {
              resolve({ statusCode: res.statusCode, raw: data });
            }
          });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
      });
    };

    try {
      // 1. GET /api/nuget/sources
      const resSources = await fetchJson('/api/nuget/sources');
      assert.strictEqual(resSources.statusCode, 200);
      assert.strictEqual(resSources.data.ok, true);
      assert(Array.isArray(resSources.data.sources));

      // 2. GET /api/nuget/diagnostics
      const resDiag = await fetchJson('/api/nuget/diagnostics');
      assert.strictEqual(resDiag.statusCode, 200);
      assert.strictEqual(resDiag.data.ok, true);
      assert.strictEqual(resDiag.data.hasCredentialProvider, true);

      // 3. POST /api/nuget/test-connection (single local)
      const resTest = await fetchJson('/api/nuget/test-connection', 'POST', {
        sourceUrl: 'https://api.nuget.org/v3/index.json'
      });
      assert.strictEqual(resTest.statusCode, 200);
      assert.strictEqual(resTest.data.ok, true);

      // 4. POST /api/nuget/refresh-metadata
      const resRefresh = await fetchJson('/api/nuget/refresh-metadata', 'POST');
      assert.strictEqual(resRefresh.statusCode, 200);
      assert.strictEqual(resRefresh.data.ok, true);

    } finally {
      server.close();
    }
  });

  // Summary
  const passed = results.filter((r) => r.pass).length;
  console.log(`\nNuGet Diagnostics Test Matrix: ${passed}/${results.length} passed.`);
  if (passed !== results.length) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

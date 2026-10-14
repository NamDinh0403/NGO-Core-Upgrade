'use strict';
/*
 * Local UI-Driven Upgrade Platform HTTP Server.
 *
 * Provides REST API and serves the single-page web UI.
 * Binds strictly to localhost (127.0.0.1).
 * Dependency-free, Node 14+.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const controller = require('./controller');
const preflight = require('./preflight');
const reviewer = require('./reviewer');
const copilotCli = require('./copilot-cli');
const diagnostics = require('./diagnostics');
const settings = require('./settings');
const telemetry = require('./telemetry');
const nugetSources = require('./nuget-sources');

const PORT = parseInt(process.env.PORT || '3800', 10);
const HOST = process.env.HOST || '127.0.0.1';
const STATIC_DIR = path.join(__dirname, 'static');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': `http://${HOST}:${PORT}`,
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString('utf8');
      if (body.length > 2 * 1024 * 1024) { // 2MB limit
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error(`Invalid JSON: ${err.message}`));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Handle static web UI files.
 */
function serveStatic(req, res, parsedUrl) {
  let reqPath = parsedUrl.pathname;
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const safePath = path.normalize(reqPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(STATIC_DIR, safePath);

  if (!filePath.startsWith(STATIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
}

/**
 * Main HTTP request dispatcher.
 */
async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  try {
    // -----------------------------------------------------------------------
    // REST API ROUTES
    // -----------------------------------------------------------------------

    // GET /api/projects
    if (method === 'GET' && pathname === '/api/projects') {
      const searchDir = parsedUrl.query.dir || undefined;
      const projects = preflight.discoverProjects(searchDir);
      return sendJson(res, 200, { ok: true, projects });
    }

    // GET /api/versions
    if (method === 'GET' && pathname === '/api/versions') {
      const corePath = parsedUrl.query.corePath || undefined;
      const versions = preflight.getAvailableVersions(corePath);
      return sendJson(res, 200, { ok: true, versions });
    }

    // GET /api/copilot-status
    if (method === 'GET' && pathname === '/api/copilot-status') {
      const status = copilotCli.checkCliAvailability();
      return sendJson(res, 200, { ok: true, status });
    }

    // GET /api/copilot/models
    if (method === 'GET' && pathname === '/api/copilot/models') {
      const currentSettings = settings.loadSettings();
      return sendJson(res, 200, {
        ok: true,
        models: copilotCli.AVAILABLE_MODELS,
        defaultModel: currentSettings.copilotModel || 'gpt-4o',
      });
    }

    // GET /api/diagnostics/copilot
    if (method === 'GET' && pathname === '/api/diagnostics/copilot') {
      const cliDiag = diagnostics.diagnoseCopilotCli(parsedUrl.query.path);
      return sendJson(res, 200, { ok: true, diagnostics: cliDiag });
    }

    // GET /api/diagnostics/environment
    if (method === 'GET' && pathname === '/api/diagnostics/environment') {
      const envDiag = diagnostics.diagnoseEnvironment();
      return sendJson(res, 200, { ok: true, environment: envDiag });
    }

    // GET /api/diagnostics/summary
    if (method === 'GET' && pathname === '/api/diagnostics/summary') {
      const summary = diagnostics.getSystemHealthSummary();
      return sendJson(res, 200, { ok: true, summary });
    }

    // GET /api/settings
    if (method === 'GET' && pathname === '/api/settings') {
      const currentSettings = settings.loadSettings();
      return sendJson(res, 200, { ok: true, settings: currentSettings });
    }

    // POST /api/settings
    if (method === 'POST' && pathname === '/api/settings') {
      const body = await parseJsonBody(req);
      const saved = settings.saveSettings(body);
      return sendJson(res, 200, { ok: true, settings: saved });
    }

    // GET /api/analytics
    if (method === 'GET' && pathname === '/api/analytics') {
      const summary = telemetry.getTelemetrySummary(parsedUrl.query);
      return sendJson(res, 200, { ok: true, summary, analytics: summary, entries: summary.recentRecords });
    }

    // -----------------------------------------------------------------------
    // NUGET PACKAGE SOURCES & AUTHENTICATION ROUTES
    // -----------------------------------------------------------------------

    // GET /api/nuget/sources
    if (method === 'GET' && pathname === '/api/nuget/sources') {
      const sources = nugetSources.discoverPackageSources();
      const shouldTest = parsedUrl.query.test === 'true';
      if (shouldTest) {
        const testedSources = [];
        for (const s of sources) {
          const testRes = await nugetSources.testFeedConnection(s);
          testedSources.push({ ...s, ...testRes });
        }
        return sendJson(res, 200, { ok: true, sources: testedSources });
      }
      return sendJson(res, 200, { ok: true, sources });
    }

    // POST /api/nuget/test-connection
    if (method === 'POST' && pathname === '/api/nuget/test-connection') {
      const body = await parseJsonBody(req);
      if (body.all) {
        const sources = nugetSources.discoverPackageSources();
        const results = [];
        for (const s of sources) {
          const testRes = await nugetSources.testFeedConnection(s, { bypassCache: true });
          results.push({ ...s, ...testRes });
        }
        return sendJson(res, 200, { ok: true, results });
      }
      if (!body.sourceUrl) {
        return sendJson(res, 400, { ok: false, error: 'sourceUrl or { all: true } required' });
      }
      const testRes = await nugetSources.testFeedConnection(body.sourceUrl, { bypassCache: true });
      return sendJson(res, 200, { ok: true, result: testRes });
    }

    // POST /api/nuget/reauthenticate
    if (method === 'POST' && pathname === '/api/nuget/reauthenticate') {
      const body = await parseJsonBody(req);
      if (!body.sourceUrl) {
        return sendJson(res, 400, { ok: false, error: 'sourceUrl required' });
      }
      const reauthRes = await nugetSources.reauthenticateSource(body.sourceUrl);
      return sendJson(res, 200, { ok: reauthRes.ok, ...reauthRes });
    }

    // POST /api/nuget/refresh-metadata
    if (method === 'POST' && pathname === '/api/nuget/refresh-metadata') {
      const refreshRes = nugetSources.refreshPackageMetadataCache();
      return sendJson(res, 200, { ok: true, ...refreshRes });
    }

    // GET /api/nuget/packages
    if (method === 'GET' && pathname === '/api/nuget/packages') {
      const pkgId = parsedUrl.query.packageId || 'NGO.Core.API';
      const pkgRes = await nugetSources.queryPackageVersions(pkgId);
      return sendJson(res, 200, { ok: true, ...pkgRes });
    }

    // GET /api/nuget/diagnostics
    if (method === 'GET' && pathname === '/api/nuget/diagnostics') {
      const credExe = nugetSources.findAzureArtifactsCredentialProvider();
      const sources = nugetSources.discoverPackageSources();
      const identity = nugetSources.detectActiveIdentity();
      return sendJson(res, 200, {
        ok: true,
        credentialProviderPath: credExe,
        hasCredentialProvider: Boolean(credExe),
        configuredSourcesCount: sources.length,
        sources,
        identity,
        envPluginPath: process.env.NUGET_CREDENTIALPROVIDERS_PATH || null,
        hasAzurePatEnv: Boolean(process.env.AZURE_DEVOPS_EXT_PAT || process.env.VSS_NUGET_ACCESSTOKEN),
      });
    }

    // GET /api/nuget/identity
    if (method === 'GET' && pathname === '/api/nuget/identity') {
      const identity = nugetSources.detectActiveIdentity();
      return sendJson(res, 200, { ok: true, ...identity });
    }

    // POST /api/nuget/auth
    if (method === 'POST' && pathname === '/api/nuget/auth') {
      const body = await parseJsonBody(req);
      const action = body.action || (body.pat ? 'set-pat' : 'detect');

      if (action === 'clear' || action === 'logout') {
        nugetSources.setAzureDevOpsPat(null);
        return sendJson(res, 200, { ok: true, message: 'Saved authentication cleared', identity: nugetSources.detectActiveIdentity() });
      }

      if (action === 'use-azure-cli') {
        nugetSources.setAzureDevOpsPat(null);
        const credRes = nugetSources.getAzureArtifactsCredentials('https://pkgs.dev.azure.com/preciofishbone/_packaging/NGO_Online_feed/nuget/v3/index.json', { bypassCache: true });
        if (credRes.ok && credRes.source === 'azure_cli') {
          return sendJson(res, 200, { ok: true, message: 'Connected using Azure CLI', identity: credRes.accountIdentity, source: 'azure_cli' });
        }
        return sendJson(res, 400, { ok: false, error: 'Azure CLI is not logged in or cannot acquire an Azure DevOps token. Please run "az login" in terminal or provide a PAT.' });
      }

      if (body.pat) {
        const testRes = await nugetSources.testFeedConnection({
          name: 'NGO Online',
          url: 'https://pkgs.dev.azure.com/preciofishbone/_packaging/NGO_Online_feed/nuget/v3/index.json',
          type: 'AZURE_ARTIFACTS',
        }, { pat: body.pat, bypassCache: true });

        if (testRes.connectionStatus === 'CONNECTED' || testRes.statusCode === 200) {
          nugetSources.setAzureDevOpsPat(body.pat);
          return sendJson(res, 200, {
            ok: true,
            message: 'Personal Access Token saved and verified',
            identity: testRes.accountIdentity || 'Personal Access Token',
            source: 'personal_access_token',
          });
        }
        return sendJson(res, 401, {
          ok: false,
          error: testRes.lastError || 'Authentication failed. Please verify the PAT token has Read packaging permissions.',
          statusCode: testRes.statusCode,
        });
      }

      return sendJson(res, 400, { ok: false, error: 'Either pat or action is required' });
    }

    // POST /api/preflight
    if (method === 'POST' && pathname === '/api/preflight') {
      const body = await parseJsonBody(req);
      if (!body.clientPath || !body.targetVersion) {
        return sendJson(res, 400, { ok: false, error: 'clientPath and targetVersion are required' });
      }
      let feedCheck = body.feedCheck;
      if (feedCheck === undefined && body.targetVersion) {
        try {
          feedCheck = await nugetSources.verifyPackageAvailability(body.targetVersion);
        } catch (_) {}
      }
      const result = preflight.runPreflight({ ...body, feedCheck });
      return sendJson(res, 200, {
        ok: result.ok,
        preflight: result,
        feedCheck,
        ...result,
      });
    }

    // GET /api/jobs
    if (method === 'GET' && pathname === '/api/jobs') {
      const jobs = controller.listJobs();
      return sendJson(res, 200, { ok: true, jobs });
    }

    // POST /api/jobs
    if (method === 'POST' && pathname === '/api/jobs') {
      const body = await parseJsonBody(req);
      if (!body.clientPath || !body.targetVersion) {
        return sendJson(res, 400, { ok: false, error: 'clientPath and targetVersion are required' });
      }
      const job = controller.createJob(body);
      return sendJson(res, 201, { ok: true, job });
    }

    // Parameterized job routes: /api/jobs/:id/*
    const jobMatch = pathname.match(/^\/api\/jobs\/([^/]+\/[^/]+)(?:\/(.*))?$/);
    if (jobMatch) {
      const jobId = jobMatch[1];
      const subAction = jobMatch[2] || '';

      // GET /api/jobs/:id
      if (method === 'GET' && subAction === '') {
        const job = controller.getJob(jobId);
        if (!job) return sendJson(res, 404, { ok: false, error: 'Job not found' });
        return sendJson(res, 200, { ok: true, job });
      }

      // GET /api/jobs/:id/logs
      if (method === 'GET' && subAction === 'logs') {
        const sinceLine = parsedUrl.query.since ? parseInt(parsedUrl.query.since, 10) : 0;
        const level = parsedUrl.query.level || null;
        const search = parsedUrl.query.search || null;
        const result = controller.getJobLogs(jobId, { sinceLine, level, search });
        return sendJson(res, 200, { ok: true, ...result });
      }

      // POST /api/jobs/:id/cancel
      if (method === 'POST' && subAction === 'cancel') {
        const job = controller.cancelJob(jobId);
        return sendJson(res, 200, { ok: true, job });
      }

      // POST /api/jobs/:id/resume
      if (method === 'POST' && subAction === 'resume') {
        const job = controller.resumeJob(jobId);
        return sendJson(res, 200, { ok: true, job });
      }

      // GET /api/jobs/:id/diff
      if (method === 'GET' && subAction === 'diff') {
        const job = controller.getJob(jobId);
        if (!job) return sendJson(res, 404, { ok: false, error: 'Job not found' });
        const diff = reviewer.getGitDiff(job.clientPath);
        return sendJson(res, 200, { ok: true, diff });
      }

      // POST /api/jobs/:id/commit
      if (method === 'POST' && subAction === 'commit') {
        const body = await parseJsonBody(req);
        const result = controller.approveAndCommit(jobId, body.message);
        return sendJson(res, 200, result);
      }
    }

    // Unmatched API routes return JSON 404
    if (pathname.startsWith('/api/')) {
      return sendJson(res, 404, { ok: false, error: `API route not found: ${method} ${pathname}` });
    }

    // Default: serve static web UI files
    return serveStatic(req, res, parsedUrl);

  } catch (err) {
    console.error('Server error:', err);
    return sendJson(res, 500, { ok: false, error: err.message });
  }
}

function startServer(port, host) {
  const p = port || PORT;
  const h = host || HOST;
  const server = http.createServer(handleRequest);

  return new Promise((resolve) => {
    server.listen(p, h, () => {
      console.log(`NGO Core Upgrade Platform running at http://${h}:${p}/`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  startServer,
  handleRequest,
  PORT,
  HOST,
};

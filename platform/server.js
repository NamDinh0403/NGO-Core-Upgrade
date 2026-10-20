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
const discovery = require('./discovery');

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

let cachedProjects = null;
let cachedProjectsTime = 0;
const PROJECTS_CACHE_TTL = 60000; // 60s

let cachedVersions = null;
let cachedVersionsTime = 0;
const VERSIONS_CACHE_TTL = 300000; // 5 minutes

function invalidateCaches() {
  cachedVersions = null;
  cachedProjects = null;
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

    // GET /api/workspace/discover
    if (method === 'GET' && pathname === '/api/workspace/discover') {
      const refresh = parsedUrl.query.refresh === 'true';
      const result = discovery.discoverWorkspaceProjects({ refresh });
      return sendJson(res, 200, result);
    }

    // POST /api/workspace/validate-path
    if (method === 'POST' && pathname === '/api/workspace/validate-path') {
      const body = await parseJsonBody(req);
      const result = discovery.validateClientPath(body.path);
      return sendJson(res, result.ok ? 200 : 400, { ok: result.ok, validation: result, ...result });
    }

    // GET /api/projects
    if (method === 'GET' && pathname === '/api/projects') {
      const searchDir = parsedUrl.query.dir || undefined;
      const forceRefresh = parsedUrl.query.refresh === 'true';
      if (!forceRefresh && !searchDir && cachedProjects && (Date.now() - cachedProjectsTime < PROJECTS_CACHE_TTL)) {
        return sendJson(res, 200, { ok: true, projects: cachedProjects });
      }
      const projects = preflight.discoverProjects(searchDir);
      if (!searchDir && projects.length > 0) {
        cachedProjects = projects;
        cachedProjectsTime = Date.now();
      }
      return sendJson(res, 200, { ok: true, projects });
    }

    // GET /api/versions
    if (method === 'GET' && pathname === '/api/versions') {
      const corePath = parsedUrl.query.corePath || undefined;
      const forceRefresh = parsedUrl.query.refresh === 'true';
      if (!forceRefresh && !corePath && cachedVersions && (Date.now() - cachedVersionsTime < VERSIONS_CACHE_TTL)) {
        return sendJson(res, 200, { ok: true, versions: cachedVersions });
      }

      let versions = preflight.getAvailableVersions(corePath);
      try {
        const pkgPromise = nugetSources.queryPackageVersions('NGO.Core.API', { bypassCache: forceRefresh });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
        const pkgRes = await Promise.race([pkgPromise, timeoutPromise]);
        if (pkgRes && Array.isArray(pkgRes.versions) && pkgRes.versions.length > 0) {
          const merged = new Set(versions);
          for (const v of pkgRes.versions) {
            merged.add(v);
          }
          versions = Array.from(merged).sort((a, b) => preflight.cmpVer(b, a));
        }
      } catch (_) {}

      if (!corePath && versions.length > 0) {
        cachedVersions = versions;
        cachedVersionsTime = Date.now();
      }
      return sendJson(res, 200, { ok: true, versions });
    }

    // GET /api/copilot-status & /api/copilot/auth-status
    if (method === 'GET' && (pathname === '/api/copilot-status' || pathname === '/api/copilot/auth-status')) {
      const status = copilotCli.checkCliAvailability();
      return sendJson(res, 200, { ok: true, status, authenticated: status.authenticated });
    }

    // POST /api/copilot/auth
    if (method === 'POST' && pathname === '/api/copilot/auth') {
      const body = await parseJsonBody(req);
      const action = body.action || (body.token ? 'set-token' : 'status');

      if (action === 'status') {
        const status = copilotCli.checkCliAvailability();
        return sendJson(res, 200, { ok: true, status, authenticated: status.authenticated });
      }

      if (action === 'clear' || action === 'logout') {
        copilotCli.clearAuthToken();
        const status = copilotCli.checkCliAvailability();
        return sendJson(res, 200, { ok: true, message: 'Copilot credentials cleared', status, authenticated: false });
      }

      if (action === 'set-token') {
        if (!body.token || typeof body.token !== 'string') {
          return sendJson(res, 400, { ok: false, error: 'GitHub token string is required' });
        }
        copilotCli.setAuthToken(body.token);
        const status = copilotCli.checkCliAvailability();
        return sendJson(res, 200, {
          ok: true,
          message: 'GitHub Copilot token saved and active',
          status,
          authenticated: status.authenticated,
          storedTokenConfigured: Boolean(status.storedTokenConfigured),
        });
      }

      if (action === 'login-web') {
        const session = copilotCli.startWebFlowLogin();
        // Wait up to 3 seconds for the auth URL to be captured from child process output
        for (let i = 0; i < 30; i++) {
          if (session.authUrl || session.status === 'FAILED') break;
          await new Promise((r) => setTimeout(r, 100));
        }
        return sendJson(res, 200, {
          ok: session.status !== 'FAILED',
          loginId: session.id,
          authUrl: session.authUrl,
          status: session.status,
          error: session.error,
          message: session.authUrl
            ? 'Browser login initiated. Please complete authorization in your browser.'
            : (session.error || 'Initiating browser login...'),
        });
      }

      if (action === 'web-poll') {
        const poll = copilotCli.getWebFlowLoginStatus(body.loginId);
        const cliStatus = copilotCli.checkCliAvailability();
        if (poll.status === 'SUCCESS' || cliStatus.authenticated) {
          return sendJson(res, 200, {
            ok: true,
            status: 'completed',
            authenticated: true,
            identity: cliStatus.accountIdentity,
          });
        }
        if (poll.status === 'FAILED') {
          return sendJson(res, 200, {
            ok: false,
            status: 'failed',
            error: poll.error || 'Web authorization ended or failed',
          });
        }
        return sendJson(res, 200, {
          ok: true,
          status: 'pending',
          authUrl: poll.authUrl,
        });
      }

      if (action === 'web-cancel') {
        copilotCli.cancelWebFlowLogin(body.loginId);
        return sendJson(res, 200, { ok: true, message: 'Web login cancelled' });
      }

      if (action === 'login-device') {
        const session = copilotCli.startDeviceCodeLogin();
        // Wait up to 3 seconds for subprocess to emit the device code
        for (let i = 0; i < 30; i++) {
          if (session.userCode || session.status === 'FAILED') break;
          await new Promise((r) => setTimeout(r, 100));
        }
        return sendJson(res, 200, {
          ok: session.status !== 'FAILED',
          loginId: session.id,
          userCode: session.userCode,
          verificationUri: session.verificationUri,
          status: session.status,
          error: session.error,
        });
      }

      if (action === 'device-poll') {
        const poll = copilotCli.getDeviceCodeLoginStatus(body.loginId);
        const cliStatus = copilotCli.checkCliAvailability();
        if (poll.status === 'SUCCESS' || cliStatus.authenticated) {
          return sendJson(res, 200, {
            ok: true,
            status: 'completed',
            authenticated: true,
            identity: cliStatus.accountIdentity,
          });
        }
        if (poll.status === 'FAILED') {
          return sendJson(res, 200, {
            ok: false,
            status: 'failed',
            error: poll.error || 'Device authorization ended',
          });
        }
        return sendJson(res, 200, {
          ok: true,
          status: 'pending',
          userCode: poll.userCode,
          verificationUri: poll.verificationUri,
        });
      }

      if (action === 'device-cancel') {
        copilotCli.cancelDeviceCodeLogin(body.loginId);
        return sendJson(res, 200, { ok: true, message: 'Device login cancelled' });
      }

      return sendJson(res, 400, { ok: false, error: `Unknown action "${action}"` });
    }

    // GET /api/copilot/models
    if (method === 'GET' && pathname === '/api/copilot/models') {
      const currentSettings = settings.loadSettings();
      return sendJson(res, 200, {
        ok: true,
        models: copilotCli.AVAILABLE_MODELS,
        defaultModel: currentSettings.copilotModel || 'auto',
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
      const safe = settings.sanitizeSettingsForClient(currentSettings);
      return sendJson(res, 200, { ok: true, settings: safe });
    }

    // POST /api/settings
    if (method === 'POST' && pathname === '/api/settings') {
      const body = await parseJsonBody(req);
      const saved = settings.saveSettings(body);
      const safe = settings.sanitizeSettingsForClient(saved);
      return sendJson(res, 200, { ok: true, settings: safe });
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
      invalidateCaches();
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

    // GET /api/nuget/auth-status
    if (method === 'GET' && pathname === '/api/nuget/auth-status') {
      const bypassCache = parsedUrl.query.refresh === 'true';
      const authDiag = await nugetSources.getComprehensiveAuthDiagnostics({ bypassCache });
      return sendJson(res, 200, authDiag);
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
        invalidateCaches();
        nugetSources.setAzureDevOpsPat(null);
        return sendJson(res, 200, { ok: true, message: 'Saved authentication cleared', identity: nugetSources.detectActiveIdentity() });
      }

      if (action === 'use-azure-cli') {
        nugetSources.setAzureDevOpsPat(null);
        const credRes = nugetSources.getAzureArtifactsCredentials('https://pkgs.dev.azure.com/preciofishbone/_packaging/NGO_Online_feed/nuget/v3/index.json', { bypassCache: true });
        if (credRes.ok && credRes.source === 'azure_cli') {
          invalidateCaches();
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
          invalidateCaches();
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

    // GET /api/release-notes
    if (method === 'GET' && pathname === '/api/release-notes') {
      const releaseNotesLib = require('./release-notes');
      const version = parsedUrl.query.version;
      if (version) {
        const notes = releaseNotesLib.getReleaseNotes(version);
        return sendJson(res, 200, { ok: true, ...notes });
      }
      const list = releaseNotesLib.listReleaseNotes();
      return sendJson(res, 200, { ok: true, releases: list });
    }

    // POST /api/release-notes
    if (method === 'POST' && pathname === '/api/release-notes') {
      const releaseNotesLib = require('./release-notes');
      const body = await parseJsonBody(req);
      if (!body.version || !body.content) {
        return sendJson(res, 400, { ok: false, error: 'version and content are required' });
      }
      const saved = releaseNotesLib.saveReleaseNotes(body.version, body.content, body.metadata);
      return sendJson(res, 200, { ok: true, ...saved });
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
      if (!body.releaseNotes) {
        try {
          const releaseNotesLib = require('./release-notes');
          const rn = releaseNotesLib.getReleaseNotes(body.targetVersion);
          if (rn && rn.exists) body.releaseNotes = rn.content;
        } catch (_) {}
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
        const logLines = Array.isArray(result) ? Array.from(result) : (result.lines || result.logs || []);
        return sendJson(res, 200, {
          ok: true,
          lines: logLines,
          logs: logLines,
          totalLines: result.totalLines !== undefined ? result.totalLines : logLines.length,
        });
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
        return sendJson(res, 200, {
          ok: true,
          diff,
          checks: (job.verification && job.verification.checks) || [],
          review: job.review || null,
          testDecisions: (job.verification && job.verification.testDecisions) || null,
          testFingerprint: (job.verification && job.verification.testFingerprint) || null,
          testLevel: (job.verification && job.verification.testLevel) || 'Targeted',
          cacheHit: (job.verification && job.verification.cacheHit) || false,
        });
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

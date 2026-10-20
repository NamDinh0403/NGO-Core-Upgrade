'use strict';
/*
 * Provider-Native NuGet Feed Authentication and Package Source Diagnostics.
 *
 * Discovers configured NuGet package sources (global, project, user), resolves
 * provider-native credentials (including Azure Artifacts Credential Provider via MSAL
 * silent token acquisition and Personal Access Tokens), runs safe read-only diagnostics,
 * queries package registries, and distinguishes authentication failures from package absence.
 *
 * Dependency-free, Node 14+.
 */

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const TOKEN_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const METADATA_CACHE_TTL_MS = 60 * 1000; // 60 seconds

// In-memory token and metadata caches (never written to disk in plaintext)
const tokenCache = new Map();
const metadataCache = new Map();

const SECRET_PATTERNS = [
  /(?:password|passwd|pwd|secret|token|api[_-]?key|auth[_-]?token)\s*[:=]\s*["']?([^"'\s\r\n]{4,})["']?/gi,
  /bearer\s+([a-zA-Z0-9_\-\.]{10,})/gi,
  /basic\s+([a-zA-Z0-9+/=]{10,})/gi,
  /(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{30,}/g,
  /eyJ[a-zA-Z0-9_\-]{20,}\.[a-zA-Z0-9_\-]{20,}\.[a-zA-Z0-9_\-]{20,}/g, // JWT tokens
];

/**
 * Redact passwords, bearer tokens, basic auth credentials, and JWTs from logs and output.
 */
function redactSecrets(text) {
  if (typeof text !== 'string') return text;
  let clean = text;
  for (const pattern of SECRET_PATTERNS) {
    clean = clean.replace(pattern, '***REDACTED***');
  }
  return clean;
}

/**
 * Remove sensitive query parameters (e.g. SAS signatures, tokens) from package source URLs.
 */
function sanitizeFeedUrl(feedUrl) {
  if (!feedUrl || typeof feedUrl !== 'string') return '';
  const clean = feedUrl.trim();
  try {
    const parsed = new url.URL(clean);
    parsed.search = '';
    return parsed.toString();
  } catch (_) {
    return clean.split('?')[0];
  }
}

/**
 * Classify the source type based on URL and endpoint patterns.
 */
function classifySourceType(sourceUrl) {
  if (!sourceUrl) return 'UNKNOWN';
  const norm = String(sourceUrl).trim().toLowerCase();
  if (norm.startsWith('http://') || norm.startsWith('https://')) {
    if (norm.includes('api.nuget.org')) return 'PUBLIC_NUGET_ORG';
    if (norm.includes('pkgs.dev.azure.com') || norm.includes('pkgs.visualstudio.com')) return 'AZURE_ARTIFACTS';
    if (norm.includes('github.com') || norm.includes('nuget.pkg.github.com')) return 'GITHUB_PACKAGES';
    return 'PRIVATE_NUGET_V3';
  }
  if (norm.startsWith('file://') || /^[a-z]:\\|^\\\\/i.test(norm)) {
    return 'LOCAL_DIRECTORY';
  }
  return 'UNKNOWN';
}

/**
 * Locate the Azure Artifacts Credential Provider executable.
 */
function findAzureArtifactsCredentialProvider() {
  // 1. Explicit environment path
  const custom = process.env.NUGET_CREDENTIALPROVIDERS_PATH;
  if (custom && fs.existsSync(custom)) {
    const candidate = path.join(custom, 'CredentialProvider.Microsoft', 'CredentialProvider.Microsoft.exe');
    if (fs.existsSync(candidate)) return candidate;
  }

  // 2. Visual Studio installation paths
  const vsYears = ['18', '2022', '17', '2019'];
  const editions = ['Enterprise', 'Professional', 'Community'];
  for (const yr of vsYears) {
    for (const ed of editions) {
      const p = path.join(
        'C:\\Program Files\\Microsoft Visual Studio',
        yr,
        ed,
        'Common7\\IDE\\CommonExtensions\\Microsoft\\NuGet\\Plugins\\CredentialProvider.Microsoft\\CredentialProvider.Microsoft.exe'
      );
      if (fs.existsSync(p)) return p;
    }
  }

  // 3. User NuGet plugins folder
  const home = process.env.USERPROFILE || process.env.HOME || '';
  if (home) {
    const userPlugin = path.join(
      home,
      '.nuget',
      'plugins',
      'netcore',
      'CredentialProvider.Microsoft',
      'CredentialProvider.Microsoft.exe'
    );
    if (fs.existsSync(userPlugin)) return userPlugin;
  }

  // 4. PATH lookup
  try {
    const whereRes = cp.spawnSync('where', ['CredentialProvider.Microsoft.exe'], { encoding: 'utf8', windowsHide: true });
    if (whereRes.status === 0 && whereRes.stdout) {
      const firstLine = whereRes.stdout.trim().split(/\r?\n/)[0];
      if (firstLine && fs.existsSync(firstLine)) return firstLine;
    }
  } catch (_) {}

  return null;
}

/**
 * Parse XML package sources from NuGet.Config content.
 */
function parseSourcesFromXml(xmlContent) {
  const sources = [];
  if (!xmlContent || typeof xmlContent !== 'string') return sources;

  const matches = xmlContent.match(/<add\s+[^>]*>/gi);
  if (matches) {
    for (const tag of matches) {
      const keyM = tag.match(/key=["']([^"']+)["']/i);
      const valM = tag.match(/value=["']([^"']+)["']/i);
      if (keyM && valM) {
        sources.push({
          name: keyM[1].trim(),
          url: valM[1].trim(),
        });
      }
    }
  }
  return sources;
}

/**
 * Discover configured NuGet package sources.
 */
function discoverPackageSources(options) {
  options = options || {};
  if (Array.isArray(options.sources)) {
    return options.sources;
  }
  const sourcesMap = new Map();

  const addSource = (name, rawUrl, origin) => {
    if (!name || !rawUrl) return;
    const cleanUrl = rawUrl.trim();
    if (sourcesMap.has(cleanUrl)) {
      const existing = sourcesMap.get(cleanUrl);
      if (!existing.origin.includes(origin)) existing.origin += `, ${origin}`;
      return;
    }
    const type = classifySourceType(cleanUrl);
    sourcesMap.set(cleanUrl, {
      name: name.trim(),
      url: cleanUrl,
      type,
      isPrivate: type !== 'PUBLIC_NUGET_ORG' && type !== 'LOCAL_DIRECTORY',
      origin,
      authSupported: type === 'AZURE_ARTIFACTS' || type === 'PRIVATE_NUGET_V3' || type === 'GITHUB_PACKAGES',
    });
  };

  // 1. Query dotnet nuget list source if available
  try {
    const res = cp.spawnSync('dotnet', ['nuget', 'list', 'source', '--format', 'json'], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 5000,
      shell: true,
    });
    if (res.status === 0 && res.stdout) {
      try {
        const parsed = JSON.parse(res.stdout);
        for (const s of parsed.sources || []) {
          if (s.enabled !== false && s.location) {
            addSource(s.name || 'dotnet-source', s.location, 'dotnet-nuget-config');
          }
        }
      } catch (_) {}
    }
  } catch (_) {}

  // 2. User Roaming NuGet.Config
  const appData = process.env.APPDATA || '';
  if (appData) {
    const userCfg = path.join(appData, 'NuGet', 'NuGet.Config');
    if (fs.existsSync(userCfg)) {
      try {
        const xml = fs.readFileSync(userCfg, 'utf8');
        for (const s of parseSourcesFromXml(xml)) {
          addSource(s.name, s.url, 'user-nuget-config');
        }
      } catch (_) {}
    }
  }

  // 3. Project / Solution specific NuGet.Config if path provided
  const searchDirs = [options.clientPath, options.corePath].filter(Boolean);
  for (const dir of searchDirs) {
    const projCfg = path.join(dir, 'NuGet.Config');
    if (fs.existsSync(projCfg)) {
      try {
        const xml = fs.readFileSync(projCfg, 'utf8');
        for (const s of parseSourcesFromXml(xml)) {
          addSource(s.name, s.url, `project-nuget-config (${path.basename(dir)})`);
        }
      } catch (_) {}
    }
  }

  // 4. Default well-known NGO sources if not already discovered
  if (!sourcesMap.has('https://api.nuget.org/v3/index.json')) {
    addSource('nuget.org', 'https://api.nuget.org/v3/index.json', 'default');
  }
  const ngoFeedUrl = 'https://pkgs.dev.azure.com/preciofishbone/_packaging/NGO_Online_feed/nuget/v3/index.json';
  if (!sourcesMap.has(ngoFeedUrl)) {
    addSource('NGO Online', ngoFeedUrl, 'ngo-default');
  }

  return Array.from(sourcesMap.values());
}

/**
 * Safely parse claims from JWT token without exposing the secret signature.
 */
function extractJwtIdentity(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);
    return payload.nameid || payload.upn || payload.email || payload.unique_name || payload.sid || null;
  } catch (_) {
    return null;
  }
}

/**
 * Acquire provider-native credentials for Azure Artifacts feed.
 */
function getAzureArtifactsCredentials(feedUrl, options) {
  options = options || {};
  const cacheKey = `azure:${feedUrl}`;

  // Check in-memory cache unless bypass requested
  if (!options.bypassCache && tokenCache.has(cacheKey)) {
    const cached = tokenCache.get(cacheKey);
    if (Date.now() < cached.expiresAt) {
      return { ok: true, ...cached.data };
    }
    tokenCache.delete(cacheKey);
  }

  // 1. Check user option, saved settings, or environment variables (e.g. CI / build agent credentials)
  let pat = options.pat || process.env.AZURE_DEVOPS_EXT_PAT || process.env.VSS_NUGET_ACCESSTOKEN || process.env.SYSTEM_ACCESSTOKEN;
  if (!pat) {
    try {
      const settingsLib = require('./settings');
      const s = settingsLib.loadSettings();
      if (s && s.azureDevOpsPat) pat = s.azureDevOpsPat;
    } catch (_) {}
  }

  if (pat) {
    const isJwt = typeof pat === 'string' && pat.split('.').length >= 2;
    const authHeader = isJwt ? `Bearer ${pat}` : 'Basic ' + Buffer.from(`PAT:${pat}`).toString('base64');
    const identity = extractJwtIdentity(pat) || 'Personal Access Token (Configured)';
    const credData = {
      username: 'PersonalAccessToken',
      password: pat,
      authHeader,
      source: 'personal_access_token',
      accountIdentity: identity,
    };
    tokenCache.set(cacheKey, { expiresAt: Date.now() + TOKEN_CACHE_TTL_MS, data: credData });
    return { ok: true, ...credData };
  }

  // 2. Check Azure CLI token (az account get-access-token)
  try {
    const azRes = cp.spawnSync('az', ['account', 'get-access-token', '--resource', '499b84ac-1321-427f-aa17-267ca6975798', '--query', 'accessToken', '-o', 'tsv'], {
      encoding: 'utf8',
      shell: true,
      windowsHide: true,
      timeout: 10000,
    });
    if (azRes.status === 0 && azRes.stdout) {
      const azToken = azRes.stdout.trim();
      if (azToken.length > 50) {
        const identity = extractJwtIdentity(azToken) || 'Azure CLI User';
        const credData = {
          username: 'AzureCLI',
          password: azToken,
          authHeader: `Bearer ${azToken}`,
          source: 'azure_cli',
          accountIdentity: identity,
        };
        // Token typically valid for 60m; cache for 45m
        tokenCache.set(cacheKey, { expiresAt: Date.now() + 45 * 60 * 1000, data: credData });
        return { ok: true, ...credData };
      }
    }
  } catch (_) {}

  // 3. Check Azure Artifacts Credential Provider executable
  const credExe = findAzureArtifactsCredentialProvider();
  if (!credExe) {
    return {
      ok: false,
      error: 'Azure Artifacts Credential Provider not found',
      remediation: 'Log in with Azure CLI ("az login"), install Azure Artifacts Credential Provider, or provide a Personal Access Token in Platform Settings.',
    };
  }

  try {
    let res = null;
    try {
      res = cp.spawnSync(credExe, ['-Uri', feedUrl, '-NonInteractive', '-OutputFormat', 'Json'], {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 10000,
      });
    } catch (_) {}

    if (!res || res.status !== 0 || !res.stdout || !res.stdout.includes('{')) {
      const cmd = `& "${credExe}" -Uri "${feedUrl}" -NonInteractive -OutputFormat Json`;
      res = cp.spawnSync('powershell', ['-NoProfile', '-Command', cmd], {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 15000,
      });
    }

    if (res.status === 0 && res.stdout) {
      const lines = res.stdout.split(/\r?\n/).map((s) => s.trim());
      const jsonLine = lines.find((s) => s.startsWith('{') && s.endsWith('}'));
      if (jsonLine) {
        const parsed = JSON.parse(jsonLine);
        if (parsed.Password) {
          const authHeader = 'Basic ' + Buffer.from(`${parsed.Username || 'VssSessionToken'}:${parsed.Password}`).toString('base64');
          const identity = extractJwtIdentity(parsed.Password) || parsed.Username || 'Azure DevOps User';

          const credData = {
            username: parsed.Username || 'VssSessionToken',
            password: parsed.Password,
            authHeader,
            source: 'credential_provider_msal',
            accountIdentity: identity,
            credentialProviderPath: credExe,
          };

          tokenCache.set(cacheKey, { expiresAt: Date.now() + TOKEN_CACHE_TTL_MS, data: credData });
          return { ok: true, ...credData };
        }
      }
    }

    const stderr = redactSecrets(res.stderr || res.stdout || 'Credential provider returned empty output');
    return {
      ok: false,
      error: `Credential provider execution failed: ${stderr.slice(0, 300)}`,
      remediation: 'Run "dotnet restore --interactive" once to complete interactive Microsoft device login.',
    };
  } catch (err) {
    return {
      ok: false,
      error: `Failed to invoke credential provider: ${err.message}`,
      remediation: 'Ensure PowerShell and .NET runtime are operational.',
    };
  }
}

/**
 * Execute HTTP GET request against a package source endpoint.
 */
function fetchHttp(targetUrl, headers, timeoutMs) {
  return new Promise((resolve, reject) => {
    const parsed = url.parse(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;

    const reqHeaders = Object.assign({
      'User-Agent': 'NGO-Core-Upgrade-Platform/1.0',
      'Accept': 'application/json, */*',
    }, headers || {});

    const req = client.get(targetUrl, {
      headers: reqHeaders,
      timeout: timeoutMs || 10000,
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const err = new Error(`Connection timed out after ${timeoutMs || 10000}ms`);
      err.code = 'ETIMEDOUT';
      reject(err);
    });

    req.on('error', reject);
  });
}

/**
 * Test connectivity and authentication to a configured package source.
 */
async function testFeedConnection(source, options) {
  options = options || {};
  const now = new Date().toISOString();
  const feedUrl = typeof source === 'string' ? source : source.url;
  const name = typeof source === 'string' ? path.basename(source) : source.name;
  const type = classifySourceType(feedUrl);

  const diag = {
    name,
    url: sanitizeFeedUrl(feedUrl),
    rawUrl: feedUrl,
    sanitizedUrl: sanitizeFeedUrl(feedUrl),
    type,
    connectionStatus: 'UNKNOWN',
    authStatus: 'UNKNOWN',
    accountIdentity: null,
    authMechanism: null,
    statusCode: null,
    lastTested: now,
    lastError: null,
    remediation: null,
    diagnosticOutput: null,
    isPrivate: type !== 'PUBLIC_NUGET_ORG' && type !== 'LOCAL_DIRECTORY',
    canReauthenticate: type === 'AZURE_ARTIFACTS',
  };

  // 1. Local directory sources
  if (type === 'LOCAL_DIRECTORY') {
    const dirPath = feedUrl.replace(/^file:\/\//i, '');
    if (fs.existsSync(dirPath)) {
      diag.connectionStatus = 'CONNECTED';
      diag.authStatus = 'NOT_REQUIRED';
      diag.statusCode = 200;
      diag.diagnosticOutput = `Local packages directory exists at: ${dirPath}`;
      return diag;
    } else {
      diag.connectionStatus = 'NETWORK_ERROR';
      diag.authStatus = 'NOT_REQUIRED';
      diag.statusCode = 404;
      diag.lastError = `Directory not found: ${dirPath}`;
      diag.remediation = 'Verify the offline package directory path exists on disk.';
      return diag;
    }
  }

  // 2. Resolve credentials if private source
  const reqHeaders = {};
  if (type === 'AZURE_ARTIFACTS') {
    diag.authMechanism = 'AZURE_ARTIFACTS_CREDENTIAL_PROVIDER';
    const credRes = getAzureArtifactsCredentials(feedUrl, options);
    if (credRes.ok && credRes.authHeader) {
      reqHeaders['Authorization'] = credRes.authHeader;
      diag.accountIdentity = credRes.accountIdentity;
    } else {
      diag.diagnosticOutput = `Credential provider failed: ${credRes.error}`;
    }
  } else if (type === 'PRIVATE_NUGET_V3') {
    diag.authMechanism = 'HTTP_BASIC_OR_TOKEN';
    if (options.authHeader) {
      reqHeaders['Authorization'] = options.authHeader;
    }
  } else {
    diag.authMechanism = 'ANONYMOUS_PUBLIC';
  }

  // 3. Send test probe to service index
  try {
    const resp = await fetchHttp(feedUrl, reqHeaders, options.timeoutMs || 8000);
    diag.statusCode = resp.statusCode;

    if (resp.statusCode === 200) {
      diag.connectionStatus = 'CONNECTED';
      diag.authStatus = diag.isPrivate ? 'AUTHENTICATED' : 'PUBLIC_ANONYMOUS';
      try {
        const parsed = JSON.parse(resp.body);
        diag.diagnosticOutput = `HTTP 200 OK: Service index v${parsed.version || '3.0'} loaded with ${parsed.resources?.length || 0} service endpoints.`;
      } catch (_) {
        diag.diagnosticOutput = 'HTTP 200 OK: Service index reached successfully.';
      }
      return diag;
    }

    if (resp.statusCode === 401) {
      diag.connectionStatus = 'UNAUTHENTICATED';
      diag.authStatus = 'AUTH_REQUIRED';
      diag.lastError = 'HTTP 401 Unauthorized: Valid credentials required to access this private feed.';
      diag.diagnosticOutput = `HTTP 401: Www-Authenticate = ${resp.headers['www-authenticate'] || 'None specified'}`;
      diag.remediation = type === 'AZURE_ARTIFACTS'
        ? 'Run "dotnet restore --interactive" once in a terminal or click Connect to authenticate with Microsoft account.'
        : 'Configure authentication credentials or Personal Access Token for this package source.';
      return diag;
    }

    if (resp.statusCode === 403) {
      diag.connectionStatus = 'FORBIDDEN';
      diag.authStatus = 'FORBIDDEN';
      diag.lastError = 'HTTP 403 Forbidden: Insufficient permissions to access this feed.';
      diag.diagnosticOutput = 'HTTP 403: The authenticated identity does not have Read access to the Azure Artifacts feed.';
      diag.remediation = 'Verify your Azure DevOps account has Reader permissions in Feed Settings -> Permissions.';
      return diag;
    }

    diag.connectionStatus = 'ERROR';
    diag.authStatus = 'ERROR';
    diag.lastError = `HTTP ${resp.statusCode} error returned by feed service index.`;
    diag.diagnosticOutput = redactSecrets(resp.body.slice(0, 200));
    diag.remediation = 'Check feed URL and service status.';
    return diag;
  } catch (err) {
    diag.connectionStatus = 'NETWORK_ERROR';
    diag.authStatus = 'UNREACHABLE';
    diag.lastError = `Network connectivity error: ${err.message}`;
    diag.diagnosticOutput = `Socket / DNS error: ${err.code || err.message}`;
    diag.remediation = 'Check network connection, corporate proxy settings, and firewall configuration.';
    return diag;
  }
}

/**
 * Query all available package versions for a given packageId across configured feeds.
 */
async function queryPackageVersions(packageId, options) {
  options = options || {};
  const normPkgId = String(packageId).trim().toLowerCase();
  const cacheKey = `versions:${normPkgId}`;

  if (!options.bypassCache && metadataCache.has(cacheKey)) {
    const cached = metadataCache.get(cacheKey);
    if (Date.now() < cached.expiresAt) return cached.data;
  }

  const sources = discoverPackageSources(options);
  const allVersions = new Set();
  const sourceResults = [];
  const authFailures = [];

  await Promise.all(sources.map(async (src) => {
    if (src.type === 'LOCAL_DIRECTORY') {
      const dirPath = src.url.replace(/^file:\/\//i, '');
      const pkgVerDir = path.join(dirPath, normPkgId);
      if (fs.existsSync(pkgVerDir)) {
        try {
          const files = fs.readdirSync(pkgVerDir);
          for (const f of files) {
            if (/^\d+\.\d+\.\d+/.test(f)) allVersions.add(f);
          }
          sourceResults.push({ source: src.name, available: true, versionsCount: files.length });
        } catch (_) {}
      }
      return;
    }

    // If querying an NGO-specific private package from public nuget.org, skip it
    if (normPkgId.startsWith('ngo.') && src.url.includes('api.nuget.org')) {
      sourceResults.push({ source: src.name, available: true, count: 0, skipped: true });
      return;
    }

    // Connect and resolve index
    const testRes = await testFeedConnection(src, options);
    if (testRes.connectionStatus === 'UNAUTHENTICATED' || testRes.connectionStatus === 'FORBIDDEN') {
      authFailures.push({
        source: src.name,
        url: src.url,
        status: testRes.connectionStatus,
        error: testRes.lastError,
      });
      sourceResults.push({ source: src.name, available: false, error: testRes.lastError, authFailed: true });
      return;
    }

    if (testRes.connectionStatus !== 'CONNECTED') {
      sourceResults.push({ source: src.name, available: false, error: testRes.lastError });
      return;
    }

    // Query package via PackageBaseAddress (fast flat index) or SearchQueryService
    try {
      const reqHeaders = {};
      if (src.type === 'AZURE_ARTIFACTS') {
        const creds = getAzureArtifactsCredentials(src.url, options);
        if (creds.ok) reqHeaders['Authorization'] = creds.authHeader;
      }

      const indexResp = await fetchHttp(src.url, reqHeaders, 6000);
      const indexJson = JSON.parse(indexResp.body);

      // 1. Try PackageBaseAddress (flat index) first for full, unpaginated version lists
      const flatEndpoint = (indexJson.resources || []).find((r) => r['@type'] && r['@type'].includes('PackageBaseAddress'))?.['@id'];
      let gotFlatVersions = false;
      if (flatEndpoint) {
        try {
          const flatUrl = flatEndpoint.endsWith('/') ? `${flatEndpoint}${normPkgId}/index.json` : `${flatEndpoint}/${normPkgId}/index.json`;
          const flatResp = await fetchHttp(flatUrl, reqHeaders, 8000);
          if (flatResp.statusCode === 200) {
            const flatJson = JSON.parse(flatResp.body);
            if (Array.isArray(flatJson.versions)) {
              for (const v of flatJson.versions) allVersions.add(v);
              sourceResults.push({ source: src.name, available: true, count: flatJson.versions.length, method: 'PackageBaseAddress' });
              gotFlatVersions = true;
            }
          }
        } catch (_) {}
      }

      // 2. Fallback to SearchQueryService if flat index was not available or empty
      if (!gotFlatVersions) {
        const searchEndpoint = (indexJson.resources || []).find((r) => r['@type'] && r['@type'].includes('SearchQueryService'))?.['@id'];
        if (searchEndpoint) {
          const queryUrl = `${searchEndpoint}?q=${encodeURIComponent(normPkgId)}&take=1000&prerelease=true`;
          const qResp = await fetchHttp(queryUrl, reqHeaders, 8000);
          if (qResp.statusCode === 200) {
            const qJson = JSON.parse(qResp.body);
            const matched = (qJson.data || []).find((d) => d.id?.toLowerCase() === normPkgId);
            if (matched && Array.isArray(matched.versions)) {
              for (const v of matched.versions) {
                if (v.version) allVersions.add(v.version);
              }
              sourceResults.push({ source: src.name, available: true, count: matched.versions.length, method: 'SearchQueryService' });
            }
          }
        }
      }
    } catch (err) {
      sourceResults.push({ source: src.name, available: false, error: err.message });
    }
  }));

  const result = {
    ok: true,
    packageId,
    versions: Array.from(allVersions).sort((a, b) => {
      // Sort semver descending
      const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
      const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
      for (let i = 0; i < 3; i++) {
        if ((pb[i] || 0) !== (pa[i] || 0)) return (pb[i] || 0) - (pa[i] || 0);
      }
      return 0;
    }),
    sourceResults,
    authFailures,
  };

  metadataCache.set(cacheKey, { expiresAt: Date.now() + METADATA_CACHE_TTL_MS, data: result });
  return result;
}

/**
 * Deterministically verify whether a target Core version is available in package sources.
 * Never reports package as missing if an authenticated request failed.
 */
async function verifyPackageAvailability(targetVersion, options) {
  options = options || {};
  const normTarget = String(targetVersion || '').trim().replace(/^v/i, '');
  if (!normTarget) {
    return {
      available: false,
      status: 'INVALID_VERSION',
      failureType: 'INVALID_INPUT',
      reason: 'No target version specified',
    };
  }

  // 1. Fast local cache check (~/.nuget/packages)
  const home = process.env.USERPROFILE || process.env.HOME || '';
  if (home) {
    const candidateNames = ['ngo.core.api', 'ngo.core', 'ngo.core.common'];
    for (const name of candidateNames) {
      const verDir = path.join(home, '.nuget', 'packages', name, normTarget);
      if (fs.existsSync(verDir)) {
        return {
          available: true,
          status: 'CONFIRMED_AVAILABLE',
          source: 'nuget-cache',
          identity: `NuGet Cache: ${name}@${normTarget}`,
          artifact: verDir,
        };
      }
    }
  }

  // 2. Query configured feeds
  const pkgRes = await queryPackageVersions('NGO.Core.API', options);

  // If found in feeds
  if (pkgRes.versions && pkgRes.versions.includes(normTarget)) {
    const matchedSource = pkgRes.sourceResults.find((s) => s.available)?.source || 'configured-feed';
    return {
      available: true,
      status: 'CONFIRMED_AVAILABLE',
      source: `nuget-feed (${matchedSource})`,
      identity: `NuGet Feed: NGO.Core.API@${normTarget}`,
    };
  }

  // 3. If any private feed failed due to authentication
  if (pkgRes.authFailures && pkgRes.authFailures.length > 0) {
    const primaryFailure = pkgRes.authFailures[0];
    return {
      available: false,
      status: primaryFailure.status === 'FORBIDDEN' ? 'FORBIDDEN' : 'AUTH_FAILED',
      failureType: primaryFailure.status === 'FORBIDDEN' ? 'FORBIDDEN' : 'AUTH_REQUIRED',
      source: `feed-auth (${primaryFailure.source})`,
      reason: `Authenticated feed request failed (${primaryFailure.status}): ${primaryFailure.error}`,
      remediation: 'Authenticate via Azure Artifacts Credential Provider or provide AZURE_DEVOPS_EXT_PAT.',
      authFailures: pkgRes.authFailures,
    };
  }

  // 4. If all feeds were queried and verified absent
  return {
    available: false,
    status: 'UNVERIFIED',
    failureType: 'NOT_FOUND',
    source: 'package-registries',
    reason: `Package version ${normTarget} not found in published package feeds or local caches.`,
  };
}

/**
 * Trigger provider-native reauthentication or token refresh for a feed.
 */
async function reauthenticateSource(sourceUrl, options) {
  options = options || {};
  const cacheKey = `azure:${sourceUrl}`;
  tokenCache.delete(cacheKey);

  const type = classifySourceType(sourceUrl);
  if (type !== 'AZURE_ARTIFACTS') {
    return testFeedConnection(sourceUrl, { bypassCache: true });
  }

  const credExe = findAzureArtifactsCredentialProvider();
  if (!credExe) {
    return {
      ok: false,
      error: 'Azure Artifacts Credential Provider executable not found',
      remediation: 'Install Azure Artifacts Credential Provider or Visual Studio.',
    };
  }

  try {
    // Attempt retry flag to refresh credentials
    const cmd = `& "${credExe}" -Uri "${sourceUrl}" -IsRetry -NonInteractive -OutputFormat Json`;
    const res = cp.spawnSync('powershell', ['-NoProfile', '-Command', cmd], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 15000,
    });

    // Test connection after refresh
    const testResult = await testFeedConnection(sourceUrl, { bypassCache: true });
    return {
      ok: testResult.connectionStatus === 'CONNECTED',
      testResult,
    };
  } catch (err) {
    return {
      ok: false,
      error: `Reauthentication command failed: ${err.message}`,
    };
  }
}

let cachedActiveIdentity = null;
let cachedActiveIdentityExpiresAt = 0;
const IDENTITY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Clear in-memory token, metadata, and identity caches.
 */
function refreshPackageMetadataCache() {
  tokenCache.clear();
  metadataCache.clear();
  cachedActiveIdentity = null;
  cachedActiveIdentityExpiresAt = 0;
  return { ok: true, clearedAt: new Date().toISOString() };
}

/**
 * Detect active identities for Azure Artifacts feed and Git across CLI, PAT, and environment.
 */
function detectActiveIdentity(options) {
  options = options || {};
  if (!options.bypassCache && cachedActiveIdentity && Date.now() < cachedActiveIdentityExpiresAt) {
    return Object.assign({}, cachedActiveIdentity);
  }

  const info = {
    azureAccount: null,
    azureAuthSource: 'none',
    gitUser: null,
    gitEmail: null,
    isAuthenticated: false,
    credentialDetails: null,
  };

  // Git identity
  try {
    const nameRes = cp.spawnSync('git', ['config', 'user.name'], { encoding: 'utf8', shell: true, windowsHide: true, timeout: 3000 });
    const emailRes = cp.spawnSync('git', ['config', 'user.email'], { encoding: 'utf8', shell: true, windowsHide: true, timeout: 3000 });
    if (nameRes.status === 0 && nameRes.stdout) info.gitUser = nameRes.stdout.trim();
    if (emailRes.status === 0 && emailRes.stdout) info.gitEmail = emailRes.stdout.trim();
  } catch (_) {}

  // Check saved PAT / env PAT
  let pat = process.env.AZURE_DEVOPS_EXT_PAT || process.env.VSS_NUGET_ACCESSTOKEN;
  if (!pat) {
    try {
      const settingsLib = require('./settings');
      const s = settingsLib.loadSettings();
      if (s && s.azureDevOpsPat) pat = s.azureDevOpsPat;
    } catch (_) {}
  }
  if (pat) {
    info.azureAccount = extractJwtIdentity(pat) || 'Personal Access Token (Configured)';
    info.azureAuthSource = 'personal_access_token';
    info.isAuthenticated = true;
    info.credentialDetails = 'Personal Access Token (PAT) configured in platform settings';
    cachedActiveIdentity = Object.assign({}, info);
    cachedActiveIdentityExpiresAt = Date.now() + IDENTITY_CACHE_TTL_MS;
    return info;
  }

  // Check Azure CLI
  try {
    const azRes = cp.spawnSync('az', ['account', 'show', '--query', 'user.name', '-o', 'tsv'], {
      encoding: 'utf8',
      shell: true,
      windowsHide: true,
      timeout: 5000,
    });
    if (azRes.status === 0 && azRes.stdout && azRes.stdout.trim()) {
      info.azureAccount = azRes.stdout.trim();
      info.azureAuthSource = 'azure_cli';
      info.isAuthenticated = true;
      info.credentialDetails = `Azure CLI active login (${azRes.stdout.trim()})`;
      cachedActiveIdentity = Object.assign({}, info);
      cachedActiveIdentityExpiresAt = Date.now() + IDENTITY_CACHE_TTL_MS;
      return info;
    }
  } catch (_) {}

  cachedActiveIdentity = Object.assign({}, info);
  cachedActiveIdentityExpiresAt = Date.now() + 30000; // cache unauthenticated for 30s
  return info;
}

let cachedComprehensiveAuth = null;
let lastComprehensiveAuthTime = 0;
const COMPREHENSIVE_AUTH_TTL_MS = 60000;

/**
 * Return detailed 7-dimension diagnostics separating CLI, Login, Org access,
 * Feed reachability, Credential Provider, Feed Auth, and Package Read permissions.
 */
async function getComprehensiveAuthDiagnostics(options) {
  options = options || {};
  if (!options.bypassCache && !options.refresh && cachedComprehensiveAuth && (Date.now() - lastComprehensiveAuthTime < COMPREHENSIVE_AUTH_TTL_MS)) {
    return cachedComprehensiveAuth;
  }
  const feedUrl = options.feedUrl || 'https://pkgs.dev.azure.com/preciofishbone/_packaging/NGO_Online_feed/nuget/v3/index.json';
  const now = new Date().toISOString();

  // 1. Azure CLI installation
  let azInstalled = false;
  let azVersion = null;
  try {
    const azVerRes = cp.spawnSync('az', ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000, shell: true });
    if (azVerRes.status === 0 && azVerRes.stdout) {
      azInstalled = true;
      const m = azVerRes.stdout.match(/azure-cli\s+([0-9\.]+)/i);
      azVersion = m ? m[1] : 'Installed';
    }
  } catch (_) {}

  // 2. Azure CLI login
  let azLoggedIn = false;
  let azAccountName = null;
  if (azInstalled) {
    try {
      const azShowRes = cp.spawnSync('az', ['account', 'show', '--query', '{user:user.name, tenant:tenantId}', '-o', 'json'], {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 5000,
        shell: true,
      });
      if (azShowRes.status === 0 && azShowRes.stdout) {
        const parsed = JSON.parse(azShowRes.stdout);
        if (parsed.user) {
          azLoggedIn = true;
          azAccountName = parsed.user;
        }
      }
    } catch (_) {}
  }

  // 3. Azure DevOps Account / Org access
  const orgName = 'preciofishbone';
  const feedName = 'NGO_Online_feed';

  // 4. Credential Provider executable
  const credExe = findAzureArtifactsCredentialProvider();
  const hasCredProvider = Boolean(credExe);

  // 5. Credential discovery (PAT vs Azure CLI vs Credential Provider)
  const creds = getAzureArtifactsCredentials(feedUrl, { bypassCache: options.bypassCache });

  // 6. Feed reachability & Effective Feed Authentication
  const feedTest = await testFeedConnection({
    name: 'NGO Online',
    url: feedUrl,
    type: 'AZURE_ARTIFACTS',
  }, { bypassCache: options.bypassCache });

  // 7. Package Read Permission (probe NGO.Core.API)
  let packageRead = {
    checked: false,
    canRead: false,
    versionCount: 0,
    latestVersion: null,
    status: 'UNTESTED',
    error: null,
  };

  if (feedTest.connectionStatus === 'CONNECTED' && feedTest.authStatus === 'AUTHENTICATED') {
    try {
      const pkgCheck = await queryPackageVersions('NGO.Core.API', { bypassCache: options.bypassCache });
      packageRead.checked = true;
      if (pkgCheck && Array.isArray(pkgCheck.versions) && pkgCheck.versions.length > 0) {
        packageRead.canRead = true;
        packageRead.versionCount = pkgCheck.versions.length;
        packageRead.latestVersion = pkgCheck.versions[0];
        packageRead.status = 'VERIFIED_READ';
      } else {
        packageRead.status = 'PACKAGE_NOT_FOUND_OR_EMPTY';
      }
    } catch (err) {
      packageRead.checked = true;
      packageRead.error = err.message;
      packageRead.status = 'READ_ERROR';
    }
  }

  const settingsLib = require('./settings');

  let overallStatus = 'UNAUTHENTICATED';
  if (feedTest.authStatus === 'AUTHENTICATED') {
    overallStatus = 'AUTHENTICATED';
  } else if (feedTest.connectionStatus === 'UNAUTHENTICATED' || !azLoggedIn) {
    overallStatus = 'SIGN_IN_REQUIRED';
  } else if (feedTest.connectionStatus === 'FORBIDDEN') {
    overallStatus = 'FORBIDDEN';
  } else if (feedTest.connectionStatus === 'NETWORK_ERROR' || feedTest.connectionStatus === 'ERROR') {
    overallStatus = 'ERROR';
  }

  const activeAccount = feedTest.accountIdentity || (azLoggedIn ? azAccountName : null);

  return {
    ok: true,
    overallStatus,
    activeAccount,
    hasStoredPat: settingsLib.hasStoredAzurePat(),
    checkedAt: now,
    lastTested: now,
    feedUrl: sanitizeFeedUrl(feedUrl),
    rawFeedUrl: feedUrl,
    organization: orgName,
    feedName,
    facets: {
      azureCli: {
        title: 'Azure CLI Installation',
        installed: azInstalled,
        version: azVersion,
        status: azInstalled ? 'READY' : 'NOT_INSTALLED',
        detail: azInstalled ? `Azure CLI v${azVersion} is installed.` : 'Azure CLI is not found in system PATH.',
      },
      azureCliLogin: {
        title: 'Azure CLI Login State',
        loggedIn: azLoggedIn,
        account: azAccountName,
        status: azLoggedIn ? 'LOGGED_IN' : (azInstalled ? 'NOT_LOGGED_IN' : 'NOT_APPLICABLE'),
        detail: azLoggedIn ? `Active Azure login: ${azAccountName}` : (azInstalled ? 'Azure CLI installed but not signed in. Run "az login".' : 'Install Azure CLI to enable interactive Microsoft login.'),
      },
      azureDevOpsOrg: {
        title: 'Target Organization & Feed',
        organization: orgName,
        feedName,
        status: 'CONFIGURED',
        detail: `Organization: ${orgName} • Feed: ${feedName}`,
      },
      feedReachability: {
        title: 'Feed Reachability',
        reachable: feedTest.connectionStatus !== 'NETWORK_ERROR',
        statusCode: feedTest.statusCode,
        status: feedTest.connectionStatus !== 'NETWORK_ERROR' ? 'REACHABLE' : 'UNREACHABLE',
        detail: feedTest.connectionStatus !== 'NETWORK_ERROR' ? `HTTP service endpoint responding (Status ${feedTest.statusCode || 200})` : `Cannot reach feed endpoint: ${feedTest.lastError}`,
      },
      credentialProvider: {
        title: 'NuGet Credential Provider',
        installed: hasCredProvider,
        path: credExe,
        status: hasCredProvider ? 'READY' : 'OPTIONAL_MISSING',
        detail: hasCredProvider ? `CredentialProvider.Microsoft active at ${credExe}` : 'Azure Artifacts Credential Provider not installed in VS or plugins.',
      },
      feedAuthentication: {
        title: 'Effective Package Feed Authentication',
        authenticated: feedTest.authStatus === 'AUTHENTICATED',
        authStatus: feedTest.authStatus,
        connectionStatus: feedTest.connectionStatus,
        identity: feedTest.accountIdentity,
        authMechanism: creds.source || feedTest.authMechanism || 'none',
        status: feedTest.authStatus === 'AUTHENTICATED' ? 'AUTHENTICATED' : (feedTest.connectionStatus === 'UNAUTHENTICATED' ? 'AUTH_REQUIRED' : (feedTest.connectionStatus === 'FORBIDDEN' ? 'FORBIDDEN' : 'UNAUTHENTICATED')),
        detail: feedTest.diagnosticOutput || feedTest.lastError || (feedTest.authStatus === 'AUTHENTICATED' ? 'Authenticated successfully against Azure Artifacts.' : 'Authentication required.'),
        remediation: feedTest.remediation,
      },
      packageReadPermission: {
        title: 'Package Read Permission',
        canRead: packageRead.canRead,
        testedPackage: 'NGO.Core.API',
        versionCount: packageRead.versionCount,
        latestVersion: packageRead.latestVersion,
        status: packageRead.status,
        detail: packageRead.canRead ? `Confirmed read permission: ${packageRead.versionCount} versions of NGO.Core.API accessible.` : (feedTest.authStatus === 'AUTHENTICATED' ? 'Authenticated, but package read check did not return packages.' : 'Requires feed authentication to verify package read permissions.'),
      },
    },
    sources: discoverPackageSources(options),
    hasPatConfigured: settingsLib.hasStoredAzurePat(),
  };

  cachedComprehensiveAuth = result;
  lastComprehensiveAuthTime = Date.now();
  return result;
}

/**
 * Configure and persist Azure DevOps Personal Access Token (PAT).
 */
function setAzureDevOpsPat(pat) {
  const settingsLib = require('./settings');
  const cleanPat = (pat && typeof pat === 'string') ? pat.trim() : null;
  settingsLib.setStoredAzurePat(cleanPat);
  cachedActiveIdentity = null;
  cachedActiveIdentityExpiresAt = 0;
  cachedComprehensiveAuth = null;
  lastComprehensiveAuthTime = 0;
  refreshPackageMetadataCache();
  return settingsLib.loadSettings();
}

module.exports = {
  discoverPackageSources,
  classifySourceType,
  findAzureArtifactsCredentialProvider,
  getAzureArtifactsCredentials,
  testFeedConnection,
  queryPackageVersions,
  verifyPackageAvailability,
  reauthenticateSource,
  refreshPackageMetadataCache,
  detectActiveIdentity,
  setAzureDevOpsPat,
  getComprehensiveAuthDiagnostics,
  redactSecrets,
  extractJwtIdentity,
  sanitizeFeedUrl,
};


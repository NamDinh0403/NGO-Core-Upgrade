'use strict';
/*
 * Provider-Native NuGet Feed Authentication and Package Source Diagnostics.
 *
 * Discovers configured NuGet package sources (global, project, user), inspects
 * hierarchical NuGet.Config / nuget.config files (including disabledPackageSources
 * and packageSourceMapping), resolves provider-native credentials (Azure Artifacts
 * Credential Provider, VSS_NUGET_EXTERNAL_FEED_ENDPOINTS, PAT, Azure CLI), runs
 * 5-stage separated preflight checks, and distinguishes authentication failures
 * from package absence.
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
  if (norm.startsWith('file://') || /^[a-z]:\\|^\\\\/i.test(norm) || norm.startsWith('/')) {
    return 'LOCAL_DIRECTORY';
  }
  return 'UNKNOWN';
}

/**
 * Locate the Azure Artifacts Credential Provider executable or plugin DLL across
 * environment overrides, user NuGet plugin folders, Visual Studio installations, and PATH.
 */
function findAzureArtifactsCredentialProvider() {
  // 1. Explicit NUGET_PLUGIN_PATHS
  const pluginPaths = process.env.NUGET_PLUGIN_PATHS;
  if (pluginPaths) {
    for (const p of pluginPaths.split(path.delimiter).map((s) => s.trim()).filter(Boolean)) {
      if (fs.existsSync(p)) return p;
    }
  }

  // 2. Explicit NUGET_CREDENTIALPROVIDERS_PATH
  const custom = process.env.NUGET_CREDENTIALPROVIDERS_PATH;
  if (custom) {
    for (const dir of custom.split(path.delimiter).map((s) => s.trim()).filter(Boolean)) {
      const candidates = [
        path.join(dir, 'CredentialProvider.Microsoft', 'CredentialProvider.Microsoft.exe'),
        path.join(dir, 'CredentialProvider.Microsoft.exe'),
        path.join(dir, 'netcore', 'CredentialProvider.Microsoft', 'CredentialProvider.Microsoft.exe'),
        path.join(dir, 'netcore', 'CredentialProvider.Microsoft', 'CredentialProvider.Microsoft.dll'),
      ];
      for (const c of candidates) {
        if (fs.existsSync(c)) return c;
      }
    }
  }

  // 3. User NuGet plugins & LocalAppData folders
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const localAppData = process.env.LOCALAPPDATA || (home ? path.join(home, 'AppData', 'Local') : '');
  const userCandidates = [];
  if (home) {
    userCandidates.push(
      path.join(home, '.nuget', 'plugins', 'netcore', 'CredentialProvider.Microsoft', 'CredentialProvider.Microsoft.exe'),
      path.join(home, '.nuget', 'plugins', 'netfx', 'CredentialProvider.Microsoft', 'CredentialProvider.Microsoft.exe'),
      path.join(home, '.nuget', 'plugins', 'netcore', 'CredentialProvider.Microsoft', 'CredentialProvider.Microsoft.dll')
    );
  }
  if (localAppData) {
    userCandidates.push(
      path.join(localAppData, 'Microsoft', 'CredentialProvider', 'CredentialProvider.Microsoft.exe'),
      path.join(localAppData, 'Microsoft', 'CredentialProvider', 'netcore', 'CredentialProvider.Microsoft', 'CredentialProvider.Microsoft.exe')
    );
  }
  for (const c of userCandidates) {
    if (fs.existsSync(c)) return c;
  }

  // 4. Visual Studio installation paths (Program Files & Program Files (x86))
  const progFilesRoots = [
    process.env.ProgramFiles || 'C:\\Program Files',
    process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
  ];
  const vsYears = ['18', '2022', '17', '2019'];
  const editions = ['Enterprise', 'Professional', 'Community', 'BuildTools', 'Preview'];
  for (const pf of progFilesRoots) {
    for (const yr of vsYears) {
      for (const ed of editions) {
        const p = path.join(
          pf,
          'Microsoft Visual Studio',
          yr,
          ed,
          'Common7', 'IDE', 'CommonExtensions', 'Microsoft', 'NuGet', 'Plugins', 'CredentialProvider.Microsoft', 'CredentialProvider.Microsoft.exe'
        );
        if (fs.existsSync(p)) return p;
      }
    }
  }

  // 5. PATH lookup
  try {
    const probe = process.platform === 'win32' ? 'where' : 'which';
    const whereRes = cp.spawnSync(probe, ['CredentialProvider.Microsoft.exe'], { encoding: 'utf8', windowsHide: true, timeout: 4000 });
    if (whereRes.status === 0 && whereRes.stdout) {
      const firstLine = whereRes.stdout.trim().split(/\r?\n/)[0];
      if (firstLine && fs.existsSync(firstLine)) return firstLine;
    }
  } catch (_) {}

  return null;
}

/**
 * Parse XML package sources, disabledPackageSources, and packageSourceMapping from NuGet.Config content.
 */
function parseNuGetConfigXml(xmlContent) {
  const result = {
    sources: [],
    disabledSources: [],
    clearsPackageSources: false,
    packageSourceMappings: [],
  };
  if (!xmlContent || typeof xmlContent !== 'string') return result;

  // Strip XML comments so commented-out sections are never treated as active
  const cleanXml = xmlContent.replace(/<!--[\s\S]*?-->/g, '');

  // 1. Parse <packageSources>
  const pkgSourcesBlockMatch = cleanXml.match(/<packageSources\b[^>]*>([\s\S]*?)<\/packageSources>/i);
  const pkgSourcesBody = pkgSourcesBlockMatch ? pkgSourcesBlockMatch[1] : cleanXml;
  if (/<clear\s*\/?>/i.test(pkgSourcesBody)) {
    result.clearsPackageSources = true;
  }
  const addTags = pkgSourcesBody.match(/<add\s+[^>]*>/gi) || [];
  for (const tag of addTags) {
    const keyM = tag.match(/key=["']([^"']+)["']/i);
    const valM = tag.match(/value=["']([^"']+)["']/i);
    if (keyM && valM) {
      result.sources.push({
        name: keyM[1].trim(),
        url: valM[1].trim(),
      });
    }
  }

  // 2. Parse <disabledPackageSources>
  const disabledBlockMatch = cleanXml.match(/<disabledPackageSources\b[^>]*>([\s\S]*?)<\/disabledPackageSources>/i);
  if (disabledBlockMatch) {
    const disTags = disabledBlockMatch[1].match(/<add\s+[^>]*>/gi) || [];
    for (const tag of disTags) {
      const keyM = tag.match(/key=["']([^"']+)["']/i);
      const valM = tag.match(/value=["']([^"']+)["']/i);
      if (keyM && valM && /^(true|1)$/i.test(valM[1].trim())) {
        result.disabledSources.push(keyM[1].trim());
      }
    }
  }

  // 3. Parse <packageSourceMapping>
  const mappingBlockMatch = cleanXml.match(/<packageSourceMapping\b[^>]*>([\s\S]*?)<\/packageSourceMapping>/i);
  if (mappingBlockMatch) {
    const sourceBlockRegex = /<packageSource\s+[^>]*key=["']([^"']+)["'][^>]*>([\s\S]*?)<\/packageSource>/gi;
    let match;
    while ((match = sourceBlockRegex.exec(mappingBlockMatch[1])) !== null) {
      const sourceKey = match[1].trim();
      const body = match[2];
      const patterns = [];
      const pkgTags = body.match(/<package\s+[^>]*>/gi) || [];
      for (const pTag of pkgTags) {
        const patM = pTag.match(/pattern=["']([^"']+)["']/i);
        if (patM) patterns.push(patM[1].trim());
      }
      result.packageSourceMappings.push({ sourceKey, patterns });
    }
  }

  return result;
}

/**
 * Backwards-compatible helper returning only the <packageSources> array.
 */
function parseSourcesFromXml(xmlContent) {
  return parseNuGetConfigXml(xmlContent).sources;
}

/**
 * Walk directory hierarchy from startDir up to filesystem root plus user-level NuGet.Config,
 * matching both NuGet.Config and nuget.config case-insensitively.
 */
function inspectNuGetConfigHierarchy(startDir) {
  const configFiles = [];
  const seenFiles = new Set();

  const addConfigFile = (filePath, scope) => {
    const norm = process.platform === 'win32' ? path.resolve(filePath).toLowerCase() : path.resolve(filePath);
    if (seenFiles.has(norm)) return;
    seenFiles.add(norm);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = parseNuGetConfigXml(content);
      configFiles.push({
        path: path.resolve(filePath),
        scope,
        ...parsed,
      });
    } catch (_) {}
  };

  if (startDir && fs.existsSync(startDir)) {
    let curr = fs.statSync(startDir).isDirectory() ? path.resolve(startDir) : path.dirname(path.resolve(startDir));
    // Also check immediate ngo-api subdirectory if present
    const apiSub = path.join(curr, 'ngo-api');
    if (fs.existsSync(apiSub) && fs.statSync(apiSub).isDirectory()) {
      try {
        for (const entry of fs.readdirSync(apiSub)) {
          if (/^nuget\.config$/i.test(entry)) addConfigFile(path.join(apiSub, entry), 'project-api');
        }
      } catch (_) {}
    }

    let depth = 0;
    while (curr && depth < 15) {
      try {
        for (const entry of fs.readdirSync(curr)) {
          if (/^nuget\.config$/i.test(entry)) {
            addConfigFile(path.join(curr, entry), depth === 0 ? 'project' : 'parent-directory');
          }
        }
      } catch (_) {}
      const parent = path.dirname(curr);
      if (!parent || parent === curr) break;
      curr = parent;
      depth++;
    }
  }

  // User-level NuGet.Config
  const appData = process.env.APPDATA || '';
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const userCandidates = [];
  if (appData) userCandidates.push(path.join(appData, 'NuGet', 'NuGet.Config'));
  if (home) {
    userCandidates.push(
      path.join(home, '.nuget', 'NuGet', 'NuGet.Config'),
      path.join(home, '.nuget', 'NuGet', 'nuget.config')
    );
  }
  for (const uc of userCandidates) {
    if (fs.existsSync(uc)) addConfigFile(uc, 'user');
  }

  // Aggregate disabled sources & package source mappings
  const disabledSources = new Set();
  const packageSourceMappings = [];
  for (const cfg of configFiles) {
    for (const d of cfg.disabledSources) disabledSources.add(d);
    for (const m of cfg.packageSourceMappings) {
      packageSourceMappings.push({ ...m, configPath: cfg.path });
    }
  }

  return {
    configFiles,
    disabledSources: Array.from(disabledSources),
    packageSourceMappings,
  };
}

/**
 * Evaluate whether packageSourceMapping allows restoring a given packageId (e.g. NGO.Core.API).
 */
function checkPackageSourceMappingForPackage(packageId, mappings, enabledSourceNames) {
  if (!Array.isArray(mappings) || mappings.length === 0) {
    return { mapped: true, active: false, matchingSources: [], reason: 'packageSourceMapping is not active.' };
  }

  const pkgLower = String(packageId || 'NGO.Core.API').toLowerCase();
  const matchingSources = [];

  for (const m of mappings) {
    for (const pat of m.patterns || []) {
      const regexStr = '^' + pat.toLowerCase().split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$';
      if (new RegExp(regexStr, 'i').test(pkgLower)) {
        matchingSources.push(m.sourceKey);
      }
    }
  }

  if (matchingSources.length === 0) {
    return {
      mapped: false,
      active: true,
      matchingSources: [],
      reason: `packageSourceMapping is active, but no pattern matches '${packageId}'. Restore will fail unless a <package pattern="NGO.Core*" /> or <package pattern="*" /> mapping is added.`,
    };
  }

  if (Array.isArray(enabledSourceNames) && enabledSourceNames.length > 0) {
    const enabledSet = new Set(enabledSourceNames.map((n) => n.toLowerCase()));
    const enabledMatches = matchingSources.filter((s) => enabledSet.has(s.toLowerCase()));
    if (enabledMatches.length === 0) {
      return {
        mapped: false,
        active: true,
        matchingSources,
        reason: `packageSourceMapping maps '${packageId}' to source(s) [${matchingSources.join(', ')}], which are disabled or missing from enabled packageSources.`,
      };
    }
  }

  return {
    mapped: true,
    active: true,
    matchingSources: Array.from(new Set(matchingSources)),
    reason: `packageSourceMapping maps '${packageId}' to [${Array.from(new Set(matchingSources)).join(', ')}].`,
  };
}

/**
 * Discover configured NuGet package sources.
 */
function discoverPackageSources(options) {
  options = options || {};
  if (Array.isArray(options.sources)) {
    return options.sources.map((s) => {
      const type = s.type || classifySourceType(s.url);
      return Object.assign({
        type,
        isPrivate: s.isPrivate !== undefined ? s.isPrivate : (s.isPrivateFeed !== undefined ? s.isPrivateFeed : (type !== 'PUBLIC_NUGET_ORG' && type !== 'LOCAL_DIRECTORY')),
      }, s);
    });
  }
  const sourcesMap = new Map();

  const hierarchy = inspectNuGetConfigHierarchy(options.clientPath || options.corePath || process.cwd());
  const disabledLower = new Set(hierarchy.disabledSources.map((s) => s.toLowerCase()));

  const addSource = (name, rawUrl, origin, enabled = true) => {
    if (!name || !rawUrl) return;
    if (!enabled || disabledLower.has(name.trim().toLowerCase())) return;
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

  // 1. Hierarchical NuGet.Config files (project -> parent -> user)
  for (const cfg of hierarchy.configFiles) {
    for (const s of cfg.sources) {
      addSource(s.name, s.url, `${cfg.scope}-nuget-config (${path.basename(cfg.path)})`);
    }
  }

  // 2. Query dotnet nuget list source if available
  try {
    const res = cp.spawnSync('dotnet', ['nuget', 'list', 'source', '--format', 'json'], {
      cwd: options.clientPath && fs.existsSync(options.clientPath) ? options.clientPath : process.cwd(),
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
            addSource(s.name || 'dotnet-source', s.location, 'dotnet-nuget-config', true);
          }
        }
      } catch (_) {}
    }
  } catch (_) {}

  // 3. Default well-known NGO sources if not already discovered
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
 * Check VSS_NUGET_EXTERNAL_FEED_ENDPOINTS environment variable for matching feed credentials.
 */
function getVssExternalEndpointCredentials(feedUrl) {
  const raw = process.env.VSS_NUGET_EXTERNAL_FEED_ENDPOINTS;
  if (!raw || typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw);
    const endpoints = parsed && Array.isArray(parsed.endpointCredentials) ? parsed.endpointCredentials : [];
    const normTarget = sanitizeFeedUrl(feedUrl).toLowerCase();
    for (const ep of endpoints) {
      if (ep && ep.endpoint && ep.password) {
        const normEp = sanitizeFeedUrl(ep.endpoint).toLowerCase();
        if (normTarget === normEp || normTarget.startsWith(normEp) || normEp.startsWith(normTarget)) {
          const username = ep.username || 'VssSessionToken';
          const authHeader = 'Basic ' + Buffer.from(`${username}:${ep.password}`).toString('base64');
          return {
            username,
            password: ep.password,
            authHeader,
            source: 'vss_external_feed_endpoints',
            accountIdentity: extractJwtIdentity(ep.password) || username,
          };
        }
      }
    }
  } catch (_) {}
  return null;
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

  // 0. Check VSS_NUGET_EXTERNAL_FEED_ENDPOINTS
  const vssEp = getVssExternalEndpointCredentials(feedUrl);
  if (vssEp) {
    tokenCache.set(cacheKey, { expiresAt: Date.now() + TOKEN_CACHE_TTL_MS, data: vssEp });
    return { ok: true, ...vssEp };
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
        tokenCache.set(cacheKey, { expiresAt: Date.now() + 45 * 60 * 1000, data: credData });
        return { ok: true, ...credData };
      }
    }
  } catch (_) {}

  // 3. Check Azure Artifacts Credential Provider executable or DLL
  const credExe = options.credentialProviderPath !== undefined
    ? options.credentialProviderPath
    : findAzureArtifactsCredentialProvider();
  if (!credExe) {
    return {
      ok: false,
      error: 'Azure Artifacts Credential Provider not found',
      remediation: 'Install Azure Artifacts Credential Provider (https://github.com/microsoft/artifacts-credprovider), sign in with Azure CLI ("az login"), or set AZURE_DEVOPS_EXT_PAT.',
    };
  }

  try {
    let res = null;
    const isDll = credExe.toLowerCase().endsWith('.dll');
    try {
      const invokeCmd = isDll ? 'dotnet' : credExe;
      const invokeArgs = isDll
        ? [credExe, '-Uri', feedUrl, '-NonInteractive', '-OutputFormat', 'Json']
        : ['-Uri', feedUrl, '-NonInteractive', '-OutputFormat', 'Json'];
      res = cp.spawnSync(invokeCmd, invokeArgs, {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 10000,
      });
    } catch (_) {}

    if ((!res || res.status !== 0 || !res.stdout || !res.stdout.includes('{')) && !isDll && process.platform === 'win32') {
      const cmd = `& "${credExe}" -Uri "${feedUrl}" -NonInteractive -OutputFormat Json`;
      res = cp.spawnSync('powershell', ['-NoProfile', '-Command', cmd], {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 15000,
      });
    }

    if (res && res.status === 0 && res.stdout) {
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

    const stderr = redactSecrets((res && (res.stderr || res.stdout)) || 'Credential provider returned empty output');
    return {
      ok: false,
      error: `Credential provider execution failed: ${stderr.slice(0, 300)}`,
      remediation: 'Run "dotnet restore --interactive" once in the client backend directory to complete interactive Microsoft device/browser login.',
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
      diag.authMechanism = credRes.source || diag.authMechanism;
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
    const httpFetcher = options.fetchFn || fetchHttp;
    const resp = await httpFetcher(feedUrl, reqHeaders, options.timeoutMs || 8000);
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
      diag.diagnosticOutput = `HTTP 401: Www-Authenticate = ${(resp.headers && resp.headers['www-authenticate']) || 'None specified'}`;
      diag.remediation = type === 'AZURE_ARTIFACTS'
        ? 'Run "dotnet restore --interactive" once in a terminal or sign in via Azure CLI ("az login") to authenticate with your Microsoft account.'
        : 'Configure authentication credentials or Personal Access Token for this package source.';
      return diag;
    }

    if (resp.statusCode === 403) {
      diag.connectionStatus = 'FORBIDDEN';
      diag.authStatus = 'FORBIDDEN';
      diag.lastError = 'HTTP 403 Forbidden: Insufficient permissions to access this feed.';
      diag.diagnosticOutput = 'HTTP 403: The authenticated identity does not have Read access to the Azure Artifacts feed.';
      diag.remediation = 'Verify your Azure DevOps account has Reader/Collaborator permissions in Feed Settings -> Permissions (do not retry login repeatedly for 403).';
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

      const httpFetcher = options.fetchFn || fetchHttp;
      const indexResp = await httpFetcher(src.url, reqHeaders, 6000);
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

  // 1. Fast local cache check (~/.nuget/packages or custom NUGET_PACKAGES)
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const globalPackagesRoot = options.nugetPackagesDir || process.env.NUGET_PACKAGES || (home ? path.join(home, '.nuget', 'packages') : '');
  if (globalPackagesRoot && fs.existsSync(globalPackagesRoot)) {
    const candidateNames = ['ngo.core.api', 'ngo.core', 'ngo.core.common'];
    for (const name of candidateNames) {
      const verDir = path.join(globalPackagesRoot, name, normTarget);
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
 * Execute the 5 separated Phase 5 NuGet & Azure Artifacts preflight checks:
 *   1. Feed URL and source configuration (including packageSourceMapping) are valid.
 *   2. Required credential provider is installed and discoverable (when required).
 *   3. Appropriate authentication mechanism is available.
 *   4. Identity can access the target private feed (200 vs 401 vs 403 vs network).
 *   5. Required package and version can actually be restored/resolved.
 */
async function runNuGetPreflightChecks(options = {}) {
  const clientPath = options.clientPath || process.cwd();
  const targetVersion = options.targetVersion || null;
  const packageId = options.packageId || 'NGO.Core.API';

  const hierarchy = inspectNuGetConfigHierarchy(clientPath);
  const sources = discoverPackageSources(options);
  const privateSources = sources.filter((s) => s.isPrivate);
  const azureSources = sources.filter((s) => s.type === 'AZURE_ARTIFACTS');

  // Stage 1: Feed URL & Source Configuration
  const mappingCheck = checkPackageSourceMappingForPackage(
    packageId,
    hierarchy.packageSourceMappings,
    sources.map((s) => s.name)
  );
  const hasPrivateOrLocalSource = privateSources.length > 0 || sources.some((s) => s.type === 'LOCAL_DIRECTORY');
  const stage1Ok = sources.length > 0 && hasPrivateOrLocalSource && mappingCheck.mapped;

  const stage1_feedConfig = {
    ok: stage1Ok,
    status: !hasPrivateOrLocalSource
      ? 'PRIVATE_FEED_MISSING'
      : (!mappingCheck.mapped ? 'SOURCE_MAPPING_BLOCKED' : 'VALID'),
    configFiles: hierarchy.configFiles.map((c) => c.path),
    enabledSources: sources.map((s) => ({ name: s.name, url: sanitizeFeedUrl(s.url), type: s.type })),
    disabledSources: hierarchy.disabledSources,
    packageSourceMapping: mappingCheck,
    detail: !hasPrivateOrLocalSource
      ? 'Only public nuget.org is configured; private Azure Artifacts feed for NGO.Core is missing or disabled.'
      : (!mappingCheck.mapped ? mappingCheck.reason : `${sources.length} source(s) configured (${privateSources.length} private).`),
    remediation: !hasPrivateOrLocalSource
      ? 'Add or enable the NGO Online Azure Artifacts feed in NuGet.Config.'
      : (!mappingCheck.mapped ? mappingCheck.reason : null),
  };

  // Stage 2: Credential Provider Installation & Discoverability
  const credExe = options.credentialProviderPath !== undefined
    ? options.credentialProviderPath
    : findAzureArtifactsCredentialProvider();
  const credProviderRequired = azureSources.length > 0;
  const stage2_credentialProvider = {
    required: credProviderRequired,
    installed: Boolean(credExe),
    executablePath: credExe ? redactSecrets(credExe) : null,
    status: !credProviderRequired
      ? 'NOT_REQUIRED'
      : (credExe ? 'DISCOVERED' : 'NOT_INSTALLED'),
    detail: !credProviderRequired
      ? 'No Azure Artifacts feeds configured.'
      : (credExe ? `Azure Artifacts Credential Provider discovered at ${credExe}` : 'CredentialProvider.Microsoft not found in user plugins, Visual Studio, or NUGET_CREDENTIALPROVIDERS_PATH.'),
    remediation: credProviderRequired && !credExe
      ? 'Install Azure Artifacts Credential Provider (https://github.com/microsoft/artifacts-credprovider) or authenticate via AZURE_DEVOPS_EXT_PAT / Azure CLI.'
      : null,
  };

  // Stage 3: Authentication Mechanism Availability
  let primaryCreds = { ok: false, source: 'none', accountIdentity: null, error: null, remediation: null };
  if (azureSources.length > 0) {
    primaryCreds = getAzureArtifactsCredentials(azureSources[0].url, options);
  }
  const stage3_authMechanism = {
    ok: azureSources.length === 0 ? true : Boolean(primaryCreds.ok),
    mechanism: primaryCreds.source || (azureSources.length === 0 ? 'not_required' : 'none'),
    identity: primaryCreds.accountIdentity || null,
    status: azureSources.length === 0
      ? 'NOT_REQUIRED'
      : (primaryCreds.ok ? 'AVAILABLE' : 'AUTH_MECHANISM_UNAVAILABLE'),
    detail: azureSources.length === 0
      ? 'No Azure Artifacts authentication required.'
      : (primaryCreds.ok
        ? `Authentication mechanism ready: ${primaryCreds.source} (${primaryCreds.accountIdentity || 'configured'})`
        : `No active authentication token acquired: ${primaryCreds.error}`),
    remediation: primaryCreds.ok ? null : primaryCreds.remediation,
  };

  // Stage 4: Feed Reachability & Identity Access
  let feedProbes = [];
  if (options.probeFeeds !== false) {
    feedProbes = await Promise.all(
      (privateSources.length > 0 ? privateSources : sources).map((src) => testFeedConnection(src, options))
    );
  }
  const failedProbe = feedProbes.find((p) => p.connectionStatus !== 'CONNECTED');
  const stage4_feedAccess = {
    ok: feedProbes.length === 0 ? true : !failedProbe,
    status: !failedProbe
      ? 'ACCESS_VERIFIED'
      : failedProbe.connectionStatus, // UNAUTHENTICATED (401), FORBIDDEN (403), NETWORK_ERROR
    feeds: feedProbes.map((p) => ({
      name: p.name,
      url: p.url,
      statusCode: p.statusCode,
      connectionStatus: p.connectionStatus,
      authStatus: p.authStatus,
      identity: p.accountIdentity,
      remediation: p.remediation,
    })),
    detail: !failedProbe
      ? `Verified access to ${feedProbes.length} package feed(s).`
      : `Feed '${failedProbe.name}' failed with ${failedProbe.connectionStatus} (HTTP ${failedProbe.statusCode || 'ERR'}): ${failedProbe.lastError}`,
    remediation: failedProbe ? failedProbe.remediation : null,
  };

  // Stage 5: Target Package & Version Restore Readiness
  let stage5_packageRestore = {
    checked: false,
    ok: true,
    status: 'SKIPPED_NO_TARGET_VERSION',
    targetVersion: null,
    source: null,
    detail: 'No target version specified for package availability probe.',
    remediation: null,
  };

  if (targetVersion) {
    const avail = await verifyPackageAvailability(targetVersion, options);
    stage5_packageRestore = {
      checked: true,
      ok: Boolean(avail.available),
      status: avail.status,
      failureType: avail.failureType || null,
      targetVersion,
      source: avail.source || null,
      identity: avail.identity || null,
      detail: avail.available
        ? `Confirmed target package ${avail.identity} is available via ${avail.source}.`
        : (avail.reason || `Target package version ${targetVersion} could not be verified.`),
      remediation: avail.remediation || (avail.available ? null : `Verify that NGO.Core ${targetVersion} is published to the feed and that your account has read access.`),
    };
  }

  // Overall classification
  // Note: If the package is already confirmed in the local ~/.nuget/packages cache, offline restore can proceed with a warning
  const availableInLocalCache = stage5_packageRestore.checked && stage5_packageRestore.ok && stage5_packageRestore.source === 'nuget-cache';
  const overallOk = stage1_feedConfig.ok && (stage4_feedAccess.ok || availableInLocalCache) && (!targetVersion || stage5_packageRestore.ok);

  let failureCategory = null;
  if (!overallOk) {
    if (!stage1_feedConfig.ok) failureCategory = 'CONFIG_INVALID';
    else if (stage4_feedAccess.status === 'FORBIDDEN' || stage5_packageRestore.failureType === 'FORBIDDEN') failureCategory = 'PERMISSION_DENIED';
    else if (stage4_feedAccess.status === 'NETWORK_ERROR') failureCategory = 'NETWORK_FAILURE';
    else if (stage4_feedAccess.status === 'UNAUTHENTICATED' || stage5_packageRestore.failureType === 'AUTH_REQUIRED' || !stage3_authMechanism.ok) failureCategory = 'AUTH_MISSING';
    else if (stage5_packageRestore.failureType === 'NOT_FOUND') failureCategory = 'PACKAGE_UNAVAILABLE';
    else failureCategory = 'CONFIG_INVALID';
  }

  return {
    ok: overallOk,
    failureCategory,
    stages: {
      feedConfig: stage1_feedConfig,
      credentialProvider: stage2_credentialProvider,
      authMechanism: stage3_authMechanism,
      feedAccess: stage4_feedAccess,
      packageRestore: stage5_packageRestore,
    },
    remediation:
      stage1_feedConfig.remediation ||
      stage4_feedAccess.remediation ||
      stage5_packageRestore.remediation ||
      stage3_authMechanism.remediation ||
      stage2_credentialProvider.remediation ||
      null,
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
    const cmd = `& "${credExe}" -Uri "${sourceUrl}" -IsRetry -NonInteractive -OutputFormat Json`;
    cp.spawnSync('powershell', ['-NoProfile', '-Command', cmd], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 15000,
    });

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
  cachedActiveIdentityExpiresAt = Date.now() + 30000;
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

  const result = {
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
  getVssExternalEndpointCredentials,
  parseNuGetConfigXml,
  inspectNuGetConfigHierarchy,
  checkPackageSourceMappingForPackage,
  runNuGetPreflightChecks,
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

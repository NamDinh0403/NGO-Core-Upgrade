'use strict';
/*
 * Platform Runtime Settings and Configuration Management.
 *
 * Persists and validates configuration for workspace roots, Core path, CLI binary,
 * timeouts, verification policies, and Git safety gates.
 *
 * Security: Personal Access Tokens and secrets are isolated from general settings,
 * protected on disk, and never transmitted to the frontend client.
 *
 * Dependency-free, Node 14+.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, 'config');
const SETTINGS_FILE = path.join(CONFIG_DIR, 'settings.json');
const CREDENTIALS_FILE = path.join(CONFIG_DIR, '.credentials.json');
const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_CLIENTS_DIR = path.resolve(REPO_ROOT, '..');
const DEFAULT_CORE_DIR = path.join(DEFAULT_CLIENTS_DIR, 'ngo-online-core');

const DEFAULT_SETTINGS = {
  approvedWorkspaceRoots: [
    DEFAULT_CLIENTS_DIR,
    REPO_ROOT,
  ],
  corePath: DEFAULT_CORE_DIR,
  copilotCliPath: null,
  copilotModel: 'auto',
  azureDevOpsPat: null,
  defaultUpgradeMode: 'AUTO',
  executionTimeoutMs: 180000,
  concurrencyLimit: 1,
  defaultTracks: ['backend', 'frontend'],
  simulationMode: false,
  verification: {
    runBuild: true,
    runTests: true,
    checkPublicApi: true,
  },
  logging: {
    verbosity: 'INFO', // 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
    retentionDays: 30,
  },
  gitSafety: {
    requireCommitApproval: true,
    preventAutoPush: true,
  },
};

/**
 * Load credentials from protected store.
 */
function loadCredentials() {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
      return data || {};
    }
  } catch (_) {}
  return {};
}

/**
 * Save credentials to protected store with restricted mode (0o600).
 */
function saveCredentials(creds) {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2), { mode: 0o600 });
  } catch (_) {}
}

/**
 * Retrieve stored Azure DevOps PAT.
 * Checks .credentials.json first, falls back to legacy settings.json and migrates it.
 */
function getStoredAzurePat() {
  const creds = loadCredentials();
  if (creds.azureDevOpsPat && typeof creds.azureDevOpsPat === 'string' && creds.azureDevOpsPat.trim()) {
    return creds.azureDevOpsPat.trim();
  }

  // Check legacy settings.json and migrate
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      if (parsed.azureDevOpsPat && typeof parsed.azureDevOpsPat === 'string' && parsed.azureDevOpsPat.trim()) {
        const pat = parsed.azureDevOpsPat.trim();
        creds.azureDevOpsPat = pat;
        creds.migratedAt = new Date().toISOString();
        saveCredentials(creds);

        // Remove plaintext secret from settings.json
        delete parsed.azureDevOpsPat;
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(parsed, null, 2));
        return pat;
      }
    }
  } catch (_) {}

  return process.env.AZURE_DEVOPS_EXT_PAT || process.env.VSS_NUGET_ACCESSTOKEN || null;
}

/**
 * Persist or update Azure DevOps PAT in protected credentials store.
 */
function setStoredAzurePat(pat) {
  const creds = loadCredentials();
  if (pat && typeof pat === 'string' && pat.trim()) {
    creds.azureDevOpsPat = pat.trim();
    creds.updatedAt = new Date().toISOString();
  } else {
    delete creds.azureDevOpsPat;
    creds.updatedAt = new Date().toISOString();
  }
  saveCredentials(creds);
}

/**
 * Clear stored Azure DevOps PAT.
 */
function clearStoredAzurePat() {
  setStoredAzurePat(null);
}

/**
 * Return whether an Azure DevOps PAT is currently stored.
 */
function hasStoredAzurePat() {
  return Boolean(getStoredAzurePat());
}

/**
 * Sanitize settings object before returning to client (strip secrets).
 */
function sanitizeSettingsForClient(rawSettings) {
  const safe = Object.assign({}, rawSettings);
  safe.hasAzureDevOpsPat = hasStoredAzurePat();
  safe.azureDevOpsPatConfigured = safe.hasAzureDevOpsPat;
  // NEVER return raw PAT or authorization headers to frontend
  delete safe.azureDevOpsPat;
  return safe;
}

/**
 * Validate proposed settings against schema and safety constraints.
 */
function validateSettings(settings) {
  const errors = [];

  if (!settings || typeof settings !== 'object') {
    return { ok: false, valid: false, errors: ['Settings must be an object'] };
  }

  // 1. Approved Workspace Roots
  if (settings.approvedWorkspaceRoots !== undefined) {
    if (!Array.isArray(settings.approvedWorkspaceRoots) || settings.approvedWorkspaceRoots.length === 0) {
      errors.push('approvedWorkspaceRoots must be a non-empty array of directory paths');
    } else {
      for (const root of settings.approvedWorkspaceRoots) {
        if (typeof root !== 'string' || root.trim() === '') {
          errors.push(`Invalid workspace root: ${root}`);
        } else if (root.includes('..')) {
          errors.push(`Directory traversal not permitted in workspace root: ${root}`);
        }
      }
    }
  }

  // 2. Core Path
  if (settings.corePath !== undefined) {
    if (typeof settings.corePath !== 'string' || settings.corePath.trim() === '') {
      errors.push('corePath must be a valid directory path string');
    } else if (settings.corePath.includes('..')) {
      errors.push('Directory traversal not permitted in corePath');
    }
  }

  // 3. Execution Timeout
  if (settings.executionTimeoutMs !== undefined) {
    const t = Number(settings.executionTimeoutMs);
    if (isNaN(t) || t < 5000 || t > 900000) {
      errors.push('executionTimeoutMs must be a number between 5000 (5s) and 900000 (15m)');
    }
  }

  // 4. Concurrency Limit
  if (settings.concurrencyLimit !== undefined) {
    const c = Number(settings.concurrencyLimit);
    if (!Number.isInteger(c) || c < 1 || c > 4) {
      errors.push('concurrencyLimit must be an integer between 1 and 4');
    }
  }

  // 5. Default Tracks
  if (settings.defaultTracks !== undefined) {
    if (!Array.isArray(settings.defaultTracks) || settings.defaultTracks.length === 0) {
      errors.push('defaultTracks must be a non-empty array');
    } else if (settings.defaultTracks.some((t) => !['backend', 'frontend'].includes(t))) {
      errors.push('defaultTracks entries must be "backend" or "frontend"');
    }
  }

  // 6. Copilot Model
  if (settings.copilotModel !== undefined) {
    if (typeof settings.copilotModel !== 'string' || settings.copilotModel.trim() === '') {
      errors.push('copilotModel must be a valid non-empty string');
    }
  }

  // 7. Azure DevOps PAT
  if (settings.azureDevOpsPat !== undefined && settings.azureDevOpsPat !== null) {
    if (typeof settings.azureDevOpsPat !== 'string') {
      errors.push('azureDevOpsPat must be a string or null');
    }
  }

  // 8. Upgrade Mode
  if (settings.defaultUpgradeMode !== undefined) {
    if (!['AUTO', 'FAST_PATCH', 'FULL_SEMANTIC'].includes(settings.defaultUpgradeMode)) {
      errors.push('defaultUpgradeMode must be "AUTO", "FAST_PATCH", or "FULL_SEMANTIC"');
    }
  }

  // 9. Git Safety
  if (settings.gitSafety !== undefined) {
    if (typeof settings.gitSafety !== 'object') {
      errors.push('gitSafety must be an object');
    } else if (settings.gitSafety.requireCommitApproval !== true) {
      errors.push('gitSafety.requireCommitApproval must remain true; automated unapproved commits are not permitted');
    }
  }

  return {
    ok: errors.length === 0,
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Load settings, falling back to defaults if not present or corrupt.
 * Cross-machine safety: if persisted approvedWorkspaceRoots or corePath come from
 * another machine and do not exist on disk, dynamically fall back to portable defaults
 * and environment variables without failing workspace boundary checks.
 */
function loadSettings(opts = {}) {
  let loaded = Object.assign({}, DEFAULT_SETTINGS);

  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      loaded = Object.assign({}, DEFAULT_SETTINGS, parsed, {
        gitSafety: Object.assign({}, DEFAULT_SETTINGS.gitSafety, parsed.gitSafety || {}),
        verification: Object.assign({}, DEFAULT_SETTINGS.verification, parsed.verification || {}),
        logging: Object.assign({}, DEFAULT_SETTINGS.logging, parsed.logging || {}),
      });
    }
  } catch (_) {}

  // Cross-machine workspace root resolution:
  const envRoots = (process.env.NGO_WORKSPACE_ROOTS || process.env.NGO_WORKSPACE_ROOT || '')
    .split(path.delimiter)
    .map((s) => s.trim())
    .filter(Boolean);
  const configuredRoots = Array.isArray(loaded.approvedWorkspaceRoots) ? loaded.approvedWorkspaceRoots : [];
  const existingConfiguredRoots = configuredRoots.filter((r) => {
    try { return typeof r === 'string' && fs.existsSync(r); } catch (_) { return false; }
  });
  if (existingConfiguredRoots.length === 0) {
    loaded.approvedWorkspaceRoots = Array.from(new Set([...DEFAULT_SETTINGS.approvedWorkspaceRoots, ...envRoots, ...configuredRoots]));
  } else if (envRoots.length > 0) {
    loaded.approvedWorkspaceRoots = Array.from(new Set([...configuredRoots, ...envRoots]));
  }

  // Cross-machine Core path resolution:
  if (process.env.NGO_CORE_PATH && process.env.NGO_CORE_PATH.trim()) {
    loaded.corePath = path.resolve(process.env.NGO_CORE_PATH.trim());
  } else if (loaded.corePath && !fs.existsSync(loaded.corePath) && opts.resolveCore !== false) {
    if (fs.existsSync(DEFAULT_CORE_DIR)) {
      loaded.corePath = DEFAULT_CORE_DIR;
    }
  }

  // Attach stored PAT in memory for backend operations
  loaded.azureDevOpsPat = getStoredAzurePat();
  return loaded;
}

/**
 * Save settings after validation.
 */
function saveSettings(newSettings) {
  const current = loadSettings();

  // If newSettings explicitly provides a PAT, update protected storage
  if (newSettings && newSettings.azureDevOpsPat !== undefined) {
    if (newSettings.azureDevOpsPat === null || newSettings.azureDevOpsPat === '') {
      clearStoredAzurePat();
    } else if (typeof newSettings.azureDevOpsPat === 'string' && newSettings.azureDevOpsPat.trim()) {
      setStoredAzurePat(newSettings.azureDevOpsPat.trim());
    }
  }

  const merged = Object.assign({}, current, newSettings, {
    gitSafety: Object.assign({}, current.gitSafety, newSettings.gitSafety || {}),
    verification: Object.assign({}, current.verification, newSettings.verification || {}),
    logging: Object.assign({}, current.logging, newSettings.logging || {}),
  });

  const val = validateSettings(merged);
  if (!val.ok) {
    throw new Error(`Settings validation failed: ${val.errors.join('; ')}`);
  }

  // Never write secrets into public settings.json
  const fileToSave = Object.assign({}, merged);
  delete fileToSave.azureDevOpsPat;

  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(fileToSave, null, 2));

  return loadSettings();
}

/**
 * Check if a client workspace path falls within approved roots.
 */
function isWorkspaceApproved(clientPath, approvedRoots) {
  if (!clientPath) return false;
  const roots = approvedRoots || (loadSettings().approvedWorkspaceRoots || []);
  const isWindows = process.platform === 'win32';
  const normalized = isWindows ? path.resolve(clientPath).toLowerCase() : path.resolve(clientPath);
  for (const root of roots) {
    const normRoot = isWindows ? path.resolve(root).toLowerCase() : path.resolve(root);
    const sep = isWindows ? '\\' : path.sep;
    if (normalized === normRoot || normalized.startsWith(normRoot + sep)) {
      return true;
    }
  }
  return false;
}

module.exports = {
  loadSettings,
  saveSettings,
  validateSettings,
  isWorkspaceApproved,
  getStoredAzurePat,
  setStoredAzurePat,
  clearStoredAzurePat,
  hasStoredAzurePat,
  sanitizeSettingsForClient,
  DEFAULT_SETTINGS,
  DEFAULT_CLIENTS_DIR,
  DEFAULT_CORE_DIR,
};

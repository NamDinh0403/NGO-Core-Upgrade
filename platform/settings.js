'use strict';
/*
 * Platform Runtime Settings and Configuration Management.
 *
 * Persists and validates configuration for workspace roots, Core path, CLI binary,
 * timeouts, verification policies, and Git safety gates.
 * Dependency-free, Node 14+.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, 'config');
const SETTINGS_FILE = path.join(CONFIG_DIR, 'settings.json');
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
  copilotModel: 'gpt-4o',
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
 * Validate proposed settings against schema and safety constraints.
 */
function validateSettings(settings) {
  const errors = [];

  if (!settings || typeof settings !== 'object') {
    return { ok: false, errors: ['Settings must be an object'] };
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
 */
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      return Object.assign({}, DEFAULT_SETTINGS, parsed, {
        gitSafety: Object.assign({}, DEFAULT_SETTINGS.gitSafety, parsed.gitSafety || {}),
        verification: Object.assign({}, DEFAULT_SETTINGS.verification, parsed.verification || {}),
        logging: Object.assign({}, DEFAULT_SETTINGS.logging, parsed.logging || {}),
      });
    }
  } catch (_) {}

  return Object.assign({}, DEFAULT_SETTINGS);
}

/**
 * Save settings after validation.
 */
function saveSettings(newSettings) {
  const current = loadSettings();
  const merged = Object.assign({}, current, newSettings, {
    gitSafety: Object.assign({}, current.gitSafety, newSettings.gitSafety || {}),
    verification: Object.assign({}, current.verification, newSettings.verification || {}),
    logging: Object.assign({}, current.logging, newSettings.logging || {}),
  });

  const val = validateSettings(merged);
  if (!val.ok) {
    throw new Error(`Settings validation failed: ${val.errors.join('; ')}`);
  }

  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2));
  return merged;
}

/**
 * Check if a client workspace path falls within approved roots.
 */
function isWorkspaceApproved(clientPath, approvedRoots) {
  if (!clientPath) return false;
  const roots = approvedRoots || (loadSettings().approvedWorkspaceRoots || []);
  const normalized = path.resolve(clientPath);
  for (const root of roots) {
    const normRoot = path.resolve(root);
    if (normalized === normRoot || normalized.startsWith(normRoot + path.sep)) {
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
  DEFAULT_SETTINGS,
};

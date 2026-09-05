'use strict';
/*
 * AppSettings inventory and mapper (IAppSettingsInventory + mapper).
 * Discovers backend configuration surfaces (API / WebJob / Tool / deployment)
 * and maps canonical AppSettings requirements onto them: identifies owning
 * process, file section/key and Azure key, preserves existing client values,
 * prevents secret leakage, and assigns manual deployment ownership.
 * Dependency-free, Node 14+.
 */
const fs = require('fs');
const path = require('path');
const core = require('./core');

function classifyProcess(filePath) {
  const p = String(filePath).toLowerCase();
  if (p.indexOf('webjob') !== -1) return 'WEBJOB';
  if (p.indexOf('tool') !== -1) return 'TOOL';
  if (p.indexOf('deploy') !== -1 || p.indexOf('release') !== -1) return 'DEPLOYMENT';
  if (p.indexOf('api') !== -1) return 'API';
  return 'API';
}

// Flatten nested config JSON into "Section:Key" style keys.
function flattenKeys(obj, prefix, out) {
  out = out || {};
  for (const k of Object.keys(obj || {})) {
    const full = prefix ? `${prefix}:${k}` : k;
    const v = obj[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) flattenKeys(v, full, out);
    else out[full] = v;
  }
  return out;
}

// files: [{ path, json }]  (json already parsed). Or call discover(root).
function analyze(files) {
  const inventory = [];
  for (const f of files) {
    const flat = flattenKeys(f.json || {}, '', {});
    inventory.push({
      path: f.path,
      process: f.process || classifyProcess(f.path),
      keys: Object.keys(flat),
      values: flat,
    });
  }
  return { files: inventory };
}

function discover(root) {
  const files = [];
  if (!core.exists(root)) return analyze(files);
  for (const abs of core.walk(root)) {
    const base = path.basename(abs).toLowerCase();
    if (/^appsettings.*\.json$/.test(base)) {
      let json = {};
      try { json = JSON.parse(fs.readFileSync(abs, 'utf8')); } catch (e) { json = {}; }
      files.push({ path: path.relative(root, abs), json });
    }
  }
  return analyze(files);
}

function isPlaceholder(v) {
  return typeof v === 'string' && /^<[A-Z_]+>$/.test(v.trim());
}

// A concrete, non-placeholder value on a sensitive key is a secret leak.
function isSecretLeak(req, value) {
  if (!req.sensitive) return false;
  if (value == null) return false;
  if (isPlaceholder(value)) return false;
  return String(value).length > 0;
}

function processMatches(reqProcess, fileProcess) {
  if (reqProcess === 'ALL') return true;
  return reqProcess === fileProcess;
}

// A requirement key may be stored unqualified (key + section) or already
// section-qualified. Match against the flattened "Section:Key" inventory keys.
function keyCandidates(req) {
  const c = [req.key];
  if (req.section) c.push(`${req.section}:${req.key}`);
  return c;
}
function matchInventoryKey(req, inventoryKeys) {
  const cands = keyCandidates(req);
  for (const k of inventoryKeys) {
    if (cands.indexOf(k) !== -1) return k;
    if (k === req.key || k.endsWith(':' + req.key)) return k;
  }
  return null;
}

// Map canonical appsettings requirements against a discovered inventory.
function mapRequirements(inventory, requirements) {
  const coverage = [];
  const missing = [];
  const azureChecklist = [];
  const secretRejections = [];

  for (const req of requirements) {
    const relevantFiles = inventory.files.filter((f) => processMatches(req.owningProcess, f.process));
    let presentIn = [];
    let existingValue;
    for (const f of relevantFiles) {
      const matched = matchInventoryKey(req, f.keys);
      if (matched) {
        presentIn.push(f.path);
        if (existingValue === undefined) existingValue = f.values[matched];
      }
    }
    const present = presentIn.length > 0;

    if (present && isSecretLeak(req, existingValue)) {
      secretRejections.push({ id: req.id, key: req.key, reason: 'concrete secret value must come from the secret provider, not committed config' });
    }

    let status;
    if (present) {
      status = req.sensitive ? 'MANUAL_ACTION_PENDING' : 'VERIFIED';
    } else {
      status = req.automation === 'AUTO_AFTER_MAPPING' && !req.sensitive ? 'PLANNED' : 'MANUAL_ACTION_PENDING';
      missing.push({
        id: req.id, key: req.key, owningProcess: req.owningProcess,
        azureKey: req.azureKey || null, owner: req.owner || 'deployment-owner',
        preserveClientValue: !!req.preserveClientValue, sensitive: !!req.sensitive,
      });
    }

    coverage.push({
      id: req.id, key: req.key, owningProcess: req.owningProcess,
      present, presentIn, preservedValue: present && req.preserveClientValue ? '(existing client value preserved)' : null,
      sensitive: !!req.sensitive, status,
    });

    if (req.azureKey) {
      azureChecklist.push({
        azureKey: req.azureKey, owner: req.owner || 'deployment-owner',
        dataType: req.dataType || 'string', sensitive: !!req.sensitive,
        timing: req.timing, valueSource: req.sensitive ? '<FROM_SECRET_PROVIDER>' : (req.defaultValue == null ? '<CLIENT_SPECIFIC_VALUE>' : req.defaultValue),
      });
    }
  }

  return { coverage, missing, azureChecklist, secretRejections };
}

module.exports = {
  analyze, discover, classifyProcess, flattenKeys,
  isPlaceholder, isSecretLeak, mapRequirements,
};

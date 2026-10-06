'use strict';
const fs = require('fs');
const path = require('path');

function classifyProcess(filePath) {
  const lower = String(filePath).toLowerCase();
  if (lower.includes('webjob')) return 'WEBJOB';
  if (lower.includes('tool')) return 'TOOL';
  if (lower.includes('deploy') || lower.includes('release')) return 'DEPLOYMENT';
  return 'API';
}

function flattenKeys(object, prefix, output) {
  output = output || {};
  for (const key of Object.keys(object || {})) {
    const full = prefix ? `${prefix}:${key}` : key;
    const value = object[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) flattenKeys(value, full, output);
    else output[full] = value;
  }
  return output;
}

function analyze(files) {
  return { files: files.map((file) => {
    const flat = flattenKeys(file.json || {}, '', {});
    return { path: file.path, process: file.process || classifyProcess(file.path), keys: Object.keys(flat), values: flat };
  }) };
}

function discover(root) {
  const files = [];
  if (!root || !fs.existsSync(root)) return analyze(files);
  if (!fs.statSync(root).isDirectory()) root = path.dirname(root);
  const skip = new Set(['.git', 'node_modules', 'bin', 'obj', 'dist', 'runs']);
  function visit(directory, depth) {
    if (depth > 12) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (skip.has(entry.name) || entry.isSymbolicLink()) continue;
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file, depth + 1);
      else if (/^appsettings.*\.json$/i.test(entry.name)) {
        let json = {};
        try { json = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { json = {}; }
        files.push({ path: path.relative(root, file), json });
      }
    }
  }
  visit(root, 0);
  return analyze(files);
}

function isPlaceholder(value) { return typeof value === 'string' && /^<[A-Z_]+>$/.test(value.trim()); }
function isSecretLeak(requirement, value) { return !!requirement.sensitive && value != null && !isPlaceholder(value) && String(value).length > 0; }

function mapRequirements(inventory, requirements) {
  const coverage = [], missing = [], azureChecklist = [], secretRejections = [];
  for (const requirement of requirements) {
    const relevant = inventory.files.filter((file) => requirement.owningProcess === 'ALL' || requirement.owningProcess === file.process);
    const presentIn = [];
    for (const file of relevant) {
      const matched = file.keys.find((key) => key === requirement.key || key === `${requirement.section}:${requirement.key}` || key.endsWith(':' + requirement.key));
      if (!matched) continue;
      presentIn.push(file.path);
      if (isSecretLeak(requirement, file.values[matched])) secretRejections.push({ id: requirement.id, key: requirement.key, reason: 'concrete secret value must come from the secret provider, not committed config' });
    }
    const present = presentIn.length > 0;
    const status = present ? (requirement.sensitive ? 'MANUAL_ACTION_PENDING' : 'VERIFIED') : (requirement.automation === 'AUTO_AFTER_MAPPING' && !requirement.sensitive ? 'PLANNED' : 'MANUAL_ACTION_PENDING');
    if (!present) missing.push({ id: requirement.id, key: requirement.key, owningProcess: requirement.owningProcess,
      azureKey: requirement.azureKey || null, owner: requirement.owner || 'deployment-owner',
      preserveClientValue: !!requirement.preserveClientValue, sensitive: !!requirement.sensitive });
    coverage.push({ id: requirement.id, key: requirement.key, owningProcess: requirement.owningProcess,
      present, presentIn, preservedValue: present && requirement.preserveClientValue ? '(existing client value preserved)' : null, sensitive: !!requirement.sensitive, status });
    if (requirement.azureKey) azureChecklist.push({ azureKey: requirement.azureKey, owner: requirement.owner || 'deployment-owner',
      dataType: requirement.dataType || 'string', sensitive: !!requirement.sensitive, timing: requirement.timing,
      valueSource: requirement.sensitive ? '<FROM_SECRET_PROVIDER>' : (requirement.defaultValue == null ? '<CLIENT_SPECIFIC_VALUE>' : requirement.defaultValue) });
  }
  return { coverage, missing, azureChecklist, secretRejections };
}

function inspect(root, requirements) {
  const inventory = discover(root);
  const result = mapRequirements(inventory, requirements);
  return Object.assign({ inventory: { files: inventory.files.map((file) => ({ path: file.path, process: file.process, keys: file.keys })) } }, result);
}

module.exports = { analyze, discover, classifyProcess, flattenKeys, isPlaceholder, isSecretLeak, mapRequirements, inspect };
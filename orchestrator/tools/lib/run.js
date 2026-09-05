'use strict';
/*
 * Shared-run scaffolding: one run-id, one runs/<client>/<run-id>/ tree,
 * owned by this module (see config/artifact-ownership.yaml). Never writes
 * into backend/runs/ or frontend/runs/ — those remain each track's own.
 */
const fs = require('fs');
const path = require('path');

const RUNS_ROOT = path.resolve(__dirname, '..', '..', 'runs');

function sanitizeClientId(clientId) {
  return String(clientId).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
}

// Mirrors the run-id shape already used by both tracks, e.g.
// "ngo-online-cbm-2026-09-04T04-05-31Z": <clientId>-<compact-ISO-timestamp>.
function newRunId(clientId, now) {
  now = now || new Date();
  const iso = now.toISOString().replace(/\.\d+Z$/, 'Z').replace(/:/g, '-');
  return `${sanitizeClientId(clientId)}-${iso}`;
}

function runDir(clientId, runId) {
  return path.join(RUNS_ROOT, sanitizeClientId(clientId), runId);
}

function ensureRunLayout(clientId, runId) {
  const base = runDir(clientId, runId);
  for (const sub of ['requirements', 'plans', 'results', 'artifacts/shared', 'artifacts/backend', 'artifacts/frontend']) {
    fs.mkdirSync(path.join(base, sub), { recursive: true });
  }
  return base;
}

function writeJson(filePath, obj) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n');
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

module.exports = { RUNS_ROOT, sanitizeClientId, newRunId, runDir, ensureRunLayout, writeJson, readJson };

'use strict';
/*
 * Core utilities for the tool bootstrap: paths, config loading, process
 * execution, secret redaction, hashing, semver comparison, evidence detection.
 * Dependency-free, Node 14+.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const yaml = require('./yaml');

const ROOT = path.resolve(__dirname, '..', '..', '..'); // backend
const P = (...parts) => require('../../../../engine/tools/lib/locations').resolve(ROOT, ...parts);

function readYaml(rel) { return yaml.parse(fs.readFileSync(P(rel), 'utf8')); }
function readJson(rel) { return JSON.parse(fs.readFileSync(P(rel), 'utf8')); }
function nowIso() { return new Date().toISOString().replace(/\.\d+Z$/, 'Z'); }
function ensureDir(rel) { fs.mkdirSync(P(rel), { recursive: true }); }

function loadConfig() {
  return {
    requirements: readYaml('config/tool-requirements.yaml'),
    policy: readYaml('config/tool-installation-policy.yaml'),
    capabilities: readYaml('config/tool-capabilities.yaml'),
  };
}

// --- secret redaction -------------------------------------------------------
function redactor(policy) {
  const pats = ((policy.secrets && policy.secrets.redactPatterns) || []).map((p) => {
    try { return new RegExp(p, 'gi'); } catch (e) { return null; }
  }).filter(Boolean);
  return (text) => {
    if (text == null) return text;
    let out = String(text);
    for (const re of pats) out = out.replace(re, '[REDACTED]');
    return out;
  };
}

// --- process execution ------------------------------------------------------
function runExec(command, argv, opts) {
  opts = opts || {};
  // With shell:true Node does not quote the command token; quote it if it
  // contains spaces (e.g. "C:\Program Files\dotnet\dotnet.exe"). argv is joined
  // as-is to preserve caller-provided quoting.
  const cmdTok = /\s/.test(command) ? `"${command}"` : command;
  const line = [cmdTok].concat(argv || []).join(' ');
  const res = cp.spawnSync(line, {
    cwd: opts.cwd ? P(opts.cwd) : ROOT,
    timeout: opts.timeout || 120000,
    encoding: 'utf8',
    shell: true,
    windowsHide: true,
  });
  return {
    code: res.status,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
    timedOut: res.error && res.error.code === 'ETIMEDOUT',
    error: res.error ? String(res.error.message || res.error) : null,
  };
}

// --- hashing ----------------------------------------------------------------
function sha256File(absPath) {
  const buf = fs.readFileSync(absPath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}
function sha256Text(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

// --- semver-ish comparison --------------------------------------------------
function parseVersion(raw) {
  if (!raw) return null;
  const m = String(raw).match(/(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!m) return null;
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3] || '0', 10)];
}
function normalizeVersion(raw) {
  const v = parseVersion(raw);
  return v ? v.join('.') : null;
}
function meetsMinimum(rawVersion, minimum) {
  if (!minimum) return true;
  const a = parseVersion(rawVersion), b = parseVersion(minimum);
  if (!a || !b) return null;
  for (let i = 0; i < 3; i++) { if (a[i] > b[i]) return true; if (a[i] < b[i]) return false; }
  return true;
}

// --- repository evidence + applicability ------------------------------------
// Exact version a client repository declares for a tooling package, used to install a
// compatible isolated copy (`versionSource: client-compatible`). Range prefixes are
// stripped; an unresolvable range (e.g. "*", "latest", a git URL) yields no version so
// the installer blocks instead of installing an arbitrary release.
function exactVersionFromRange(range) {
  if (!range || typeof range !== 'string') return null;
  const m = range.trim().match(/^[\^~>=<\s v]*(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/);
  return m ? m[1] : null;
}

function gatherEvidence(clientPath) {
  return require('../../../../engine/tools/lib/discovery').backendEvidence(clientPath);
}

function appliesWhen(tool, evidence) {
  const aw = tool.appliesWhen;
  if (!aw) return true;
  for (const [k, v] of Object.entries(aw)) {
    if (k === 'repositoryContains') continue; // handled by evidence flags above
    if (Boolean(evidence[k]) !== Boolean(v)) return false;
  }
  return true;
}

function platform() {
  return {
    os: `${process.platform} ${require('os').release()}`,
    architecture: process.arch,
    shell: process.env.ComSpec ? 'powershell/cmd' : (process.env.SHELL || 'unknown'),
  };
}

module.exports = {
  ROOT, P, readYaml, readJson, nowIso, ensureDir, loadConfig,
  redactor, runExec, sha256File, sha256Text,
  parseVersion, normalizeVersion, meetsMinimum,
  gatherEvidence, appliesWhen, platform, exactVersionFromRange,
};

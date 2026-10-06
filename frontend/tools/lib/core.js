'use strict';
/*
 * Core utilities: paths, config loading, process execution, secret redaction,
 * hashing, semver comparison, JSON/YAML IO, and small filesystem helpers.
 * Dependency-free, Node 14+.
 *
 * ROOT is the frontend agent repository. Client and Core repositories
 * live OUTSIDE ROOT and are addressed by absolute paths supplied in the request.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const cp = require('child_process');
const yaml = require('./yaml');

const ROOT = path.resolve(__dirname, '..', '..'); // frontend
const P = (...parts) => require('../../../engine/tools/lib/locations').resolve(ROOT, ...parts);

function readText(abs) { return fs.readFileSync(abs, 'utf8'); }
function readYaml(rel) { return yaml.parse(fs.readFileSync(P(rel), 'utf8')); }
function readYamlAbs(abs) { return yaml.parse(fs.readFileSync(abs, 'utf8')); }
function readJson(rel) { return JSON.parse(fs.readFileSync(P(rel), 'utf8')); }
function readJsonAbs(abs) { return JSON.parse(fs.readFileSync(abs, 'utf8')); }
function nowIso() { return new Date().toISOString().replace(/\.\d+Z$/, 'Z'); }
function ensureDir(abs) { fs.mkdirSync(abs, { recursive: true }); }
function exists(abs) { try { fs.accessSync(abs); return true; } catch (e) { return false; } }
function isDir(abs) { try { return fs.statSync(abs).isDirectory(); } catch (e) { return false; } }
function isReadable(abs) { try { fs.accessSync(abs, fs.constants.R_OK); return true; } catch (e) { return false; } }
function isWritable(abs) { try { fs.accessSync(abs, fs.constants.W_OK); return true; } catch (e) { return false; } }

function writeJson(abs, obj) {
  ensureDir(path.dirname(abs));
  fs.writeFileSync(abs, JSON.stringify(obj, null, 2) + '\n');
}
function writeYaml(abs, obj) {
  ensureDir(path.dirname(abs));
  fs.writeFileSync(abs, yaml.stringify(obj));
}
function writeText(abs, text) {
  ensureDir(path.dirname(abs));
  fs.writeFileSync(abs, text);
}
function appendJsonl(abs, obj) {
  ensureDir(path.dirname(abs));
  fs.appendFileSync(abs, JSON.stringify(obj) + '\n');
}

function loadConfig() {
  return {
    agent: Object.assign({}, exists(P('config/agent-policy.yaml')) ? readYaml('config/agent-policy.yaml') : {}, { allowReadyWithAssumptions: require('../../../engine/config/execution-policy.json').allowReadyWithAssumptions }),
    escalation: Object.assign({}, exists(P('config/escalation-policy.yaml')) ? readYaml('config/escalation-policy.yaml') : {}, { budgets: require('../../../engine/config/execution-policy.json').budgets }),
    quality: exists(P('config/quality-gates.yaml')) ? readYaml('config/quality-gates.yaml') : {},
    packageAlignment: exists(P('config/package-alignment-policy.yaml')) ? readYaml('config/package-alignment-policy.yaml') : {},
    repoSafety: exists(P('config/repository-safety-policy.yaml')) ? readYaml('config/repository-safety-policy.yaml') : {},
    rules: exists(P('config/rules.yaml')) ? readYaml('config/rules.yaml') : {},
  };
}

// --- secret redaction -------------------------------------------------------
const DEFAULT_REDACT = [
  '(?:password|passwd|pwd)\\s*[=:]\\s*\\S+',
  '(?:api[_-]?key|apikey|secret|token)\\s*[=:]\\s*\\S+',
  '(?:AccountKey|SharedAccessKey|InstrumentationKey)=[^;\\s]+',
  'Bearer\\s+[A-Za-z0-9\\-_.]+',
];
function redactor(policy) {
  const patterns = ((policy && policy.secrets && policy.secrets.redactPatterns) || DEFAULT_REDACT)
    .map((p) => { try { return new RegExp(p, 'gi'); } catch (e) { return null; } })
    .filter(Boolean);
  return (text) => {
    if (text == null) return text;
    let out = String(text);
    for (const re of patterns) out = out.replace(re, '[REDACTED]');
    return out;
  };
}

// --- process execution ------------------------------------------------------
function runExec(command, argv, opts) {
  opts = opts || {};
  const cmdTok = /\s/.test(command) ? `"${command}"` : command;
  const line = [cmdTok].concat(argv || []).join(' ');
  const res = cp.spawnSync(line, {
    cwd: opts.cwd || ROOT,
    timeout: opts.timeout || 120000,
    encoding: 'utf8',
    shell: true,
    windowsHide: true,
    env: Object.assign({}, process.env, {
      // Prevent git from spawning a lingering fsmonitor daemon that would inherit
      // and hold this process's stdout pipe open past completion.
      GIT_OPTIONAL_LOCKS: '0',
    }, opts.env || {}),
    maxBuffer: opts.maxBuffer || 32 * 1024 * 1024,
  });
  return {
    code: res.status,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
    timedOut: !!(res.error && res.error.code === 'ETIMEDOUT'),
    error: res.error ? String(res.error.message || res.error) : null,
  };
}

// --- hashing ----------------------------------------------------------------
function sha256File(abs) {
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}
function sha256Text(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}
function sha256Maybe(abs) { return exists(abs) ? sha256File(abs) : null; }

// --- semver-ish comparison --------------------------------------------------
function parseVersion(raw) {
  if (!raw) return null;
  const m = String(raw).replace(/^[\^~>=<\s]+/, '').match(/(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!m) return null;
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3] || '0', 10)];
}
function normalizeVersion(raw) {
  const v = parseVersion(raw);
  return v ? v.join('.') : null;
}
function compareVersions(a, b) {
  const x = parseVersion(a), y = parseVersion(b);
  if (!x || !y) return null;
  for (let i = 0; i < 3; i++) { if (x[i] > y[i]) return 1; if (x[i] < y[i]) return -1; }
  return 0;
}
function meetsMinimum(rawVersion, minimum) {
  if (!minimum) return true;
  const c = compareVersions(rawVersion, minimum);
  return c === null ? null : c >= 0;
}
function versionsEqual(a, b) {
  const na = normalizeVersion(a), nb = normalizeVersion(b);
  return na !== null && na === nb;
}
function isExactVersion(raw) {
  return typeof raw === 'string' && /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(raw.trim());
}

// --- small recursive file walk ---------------------------------------------
const DEFAULT_SKIP = new Set(['node_modules', '.git', 'dist', 'out-tsc', 'coverage', '.angular', '.nx', 'runs']);
function walk(dir, opts) {
  opts = opts || {};
  const skip = opts.skip || DEFAULT_SKIP;
  const maxDepth = opts.maxDepth == null ? 12 : opts.maxDepth;
  const acc = [];
  (function rec(d, depth) {
    if (depth > maxDepth) return;
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const e of entries) {
      if (skip.has(e.name)) continue;
      const full = path.join(d, e.name);
      if (e.isDirectory()) rec(full, depth + 1);
      else acc.push(full);
    }
  })(dir, 0);
  return acc;
}

function platform() {
  return {
    os: `${process.platform} ${os.release()}`,
    architecture: process.arch,
    shell: process.env.ComSpec ? 'powershell/cmd' : (process.env.SHELL || 'unknown'),
    node: process.version,
  };
}

function pathsOverlap(a, b) {
  const na = path.resolve(a) + path.sep;
  const nb = path.resolve(b) + path.sep;
  return na === nb || na.startsWith(nb) || nb.startsWith(na);
}

module.exports = {
  ROOT, P, path, os,
  readText, readYaml, readYamlAbs, readJson, readJsonAbs,
  writeJson, writeYaml, writeText, appendJsonl,
  nowIso, ensureDir, exists, isDir, isReadable, isWritable,
  loadConfig, redactor, runExec,
  sha256File, sha256Text, sha256Maybe,
  parseVersion, normalizeVersion, compareVersions, meetsMinimum, versionsEqual, isExactVersion,
  walk, platform, pathsOverlap,
};

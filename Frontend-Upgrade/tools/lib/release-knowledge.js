'use strict';
/*
 * Release knowledge store (IReleaseKnowledgeStore).
 * Loads canonical structured release requirements, reusable migrations,
 * AppSettings requirements, and the version manifest from knowledge/canonical/.
 * Read-only; never loads raw release notes. Dependency-free, Node 14+.
 */
const fs = require('fs');
const path = require('path');
const core = require('./core');

const CANON = core.P('knowledge', 'canonical');
const RELEASES_DIR = path.join(CANON, 'releases');
const MIGRATIONS_DIR = path.join(CANON, 'migrations');
const APPSETTINGS_DIR = path.join(CANON, 'appsettings');
const VERSIONS_DIR = path.join(CANON, 'versions');

const SCOPE_FILES = ['frontend', 'backend', 'database', 'deployment', 'decisions'];

// The version manifest carries leading '#' comment lines (documentation) that
// are not valid JSON; strip full-line comments before parsing.
function parseJsonWithComments(text) {
  const cleaned = text.split(/\r?\n/).filter((l) => !/^\s*#/.test(l)).join('\n');
  try { return JSON.parse(cleaned); } catch (e) { return null; }
}

let _cache = null;

function listVersions() {
  if (!core.exists(RELEASES_DIR)) return [];
  return fs.readdirSync(RELEASES_DIR)
    .filter((n) => core.isDir(path.join(RELEASES_DIR, n)) && core.parseVersion(n))
    .sort((a, b) => core.compareVersions(a, b));
}

function loadReleaseManifest(version) {
  const f = path.join(RELEASES_DIR, version, 'release.yaml');
  return core.exists(f) ? core.readYamlAbs(f) : null;
}

function loadScopeRequirements(version) {
  const out = [];
  for (const scope of SCOPE_FILES) {
    const f = path.join(RELEASES_DIR, version, `${scope}.yaml`);
    if (!core.exists(f)) continue;
    const doc = core.readYamlAbs(f) || {};
    const reqs = Array.isArray(doc.requirements) ? doc.requirements : [];
    for (const r of reqs) out.push(r);
  }
  return out;
}

function load() {
  if (_cache) return _cache;
  const versions = listVersions();
  const requirements = [];
  const manifests = {};
  for (const v of versions) {
    manifests[v] = loadReleaseManifest(v);
    for (const r of loadScopeRequirements(v)) requirements.push(r);
  }
  const migrations = [];
  if (core.exists(MIGRATIONS_DIR)) {
    for (const n of fs.readdirSync(MIGRATIONS_DIR)) {
      if (!n.endsWith('.yaml')) continue;
      migrations.push(core.readYamlAbs(path.join(MIGRATIONS_DIR, n)));
    }
  }
  const appsettings = [];
  if (core.exists(APPSETTINGS_DIR)) {
    for (const n of fs.readdirSync(APPSETTINGS_DIR)) {
      if (!n.endsWith('.yaml')) continue;
      const doc = core.readYamlAbs(path.join(APPSETTINGS_DIR, n)) || {};
      for (const s of (doc.settings || [])) appsettings.push(s);
    }
  }
  let versionManifest = null;
  const vmf = path.join(VERSIONS_DIR, 'version-manifest.json');
  if (core.exists(vmf)) versionManifest = parseJsonWithComments(fs.readFileSync(vmf, 'utf8'));

  _cache = { versions, manifests, requirements, migrations, appsettings, versionManifest };
  return _cache;
}

function reset() { _cache = null; }

// Angular major that the client is on AFTER a given Core version (from the
// release manifest frameworkTransition.angularTo).
function angularMajorAt(version) {
  const store = load();
  const m = store.manifests[core.normalizeVersion(version)] || store.manifests[version];
  if (m && m.frameworkTransition && m.frameworkTransition.angularTo) {
    const p = core.parseVersion(m.frameworkTransition.angularTo + '.0');
    return p ? p[0] : null;
  }
  // Fallback: scan manifest matrix by major.
  return null;
}

function allRequirements() { return load().requirements.slice(); }
function migrations() { return load().migrations.slice(); }
function appSettings() { return load().appsettings.slice(); }
function requirementById(id) { return load().requirements.find((r) => r.id === id) || null; }

module.exports = {
  RELEASES_DIR, MIGRATIONS_DIR, APPSETTINGS_DIR, VERSIONS_DIR,
  load, reset, listVersions, loadReleaseManifest, loadScopeRequirements,
  angularMajorAt, allRequirements, migrations, appSettings, requirementById,
};

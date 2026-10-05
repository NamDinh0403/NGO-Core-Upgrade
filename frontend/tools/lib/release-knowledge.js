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

const _cache = new Map();
const _manifests = new Map();
let _ancillary = null;

function listVersions() {
  if (!core.exists(RELEASES_DIR)) return [];
  return fs.readdirSync(RELEASES_DIR)
    .filter((n) => core.isDir(path.join(RELEASES_DIR, n)) && core.parseVersion(n))
    .sort((a, b) => core.compareVersions(a, b));
}

function loadReleaseManifest(version) {
  if (_manifests.has(version)) return _manifests.get(version);
  const f = path.join(RELEASES_DIR, version, 'release.yaml');
  const manifest = core.exists(f) ? core.readYamlAbs(f) : null;
  _manifests.set(version, manifest);
  return manifest;
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

function load(source, target) {
  const key = JSON.stringify([source || null, target || null]);
  if (_cache.has(key)) return _cache.get(key);
  const versions = listVersions().filter((version) => (!source || core.compareVersions(version, source) > 0) && (!target || core.compareVersions(version, target) <= 0));
  const requirements = [];
  const manifests = {};
  for (const v of versions) {
    manifests[v] = loadReleaseManifest(v);
    for (const r of loadScopeRequirements(v)) requirements.push(r);
  }
  const data = Object.assign({ versions, manifests, requirements }, ancillary());
  _cache.set(key, data);
  return data;
}

function ancillary() {
  if (_ancillary) return _ancillary;
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

  _ancillary = { migrations, appsettings, versionManifest };
  return _ancillary;
}

function reset() { _cache.clear(); _manifests.clear(); _ancillary = null; }

// Angular major that the client is on AFTER a given Core version (from the
// release manifest frameworkTransition.angularTo).
function angularMajorAt(version) {
  const norm = core.normalizeVersion(version) || version;
  const candidates = listVersions().filter((known) => core.compareVersions(known, norm) <= 0);
  const best = candidates[candidates.length - 1];
  const m = best ? loadReleaseManifest(best) : null;
  if (m && m.frameworkTransition && m.frameworkTransition.angularTo) {
    const p = core.parseVersion(m.frameworkTransition.angularTo + '.0');
    return p ? p[0] : null;
  }
  // Fallback: scan manifest matrix by major.
  return null;
}

function allRequirements(source, target) { return load(source, target).requirements.slice(); }
function migrations() { return ancillary().migrations.slice(); }
function appSettings() { return ancillary().appsettings.slice(); }
function requirementById(id) { return load().requirements.find((r) => r.id === id) || null; }

module.exports = {
  RELEASES_DIR, MIGRATIONS_DIR, APPSETTINGS_DIR, VERSIONS_DIR,
  load, reset, listVersions, loadReleaseManifest, loadScopeRequirements,
  angularMajorAt, allRequirements, migrations, appSettings, requirementById,
};

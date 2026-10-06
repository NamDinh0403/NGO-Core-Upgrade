'use strict';
const fs = require('fs');
const path = require('path');
const yaml = require('./yaml');

function createStore(core) {
  const RELEASES_DIR = core.P('knowledge', 'canonical', 'releases');
  const MIGRATIONS_DIR = core.P('knowledge', 'canonical', 'migrations');
  const APPSETTINGS_DIR = core.P('knowledge', 'canonical', 'appsettings');
  const VERSIONS_DIR = core.P('knowledge', 'canonical', 'versions');
  const cache = new Map();
  const manifests = new Map();
  let ancillaryCache = null;

  function listVersions() {
    if (!core.exists(RELEASES_DIR)) return [];
    return fs.readdirSync(RELEASES_DIR).filter((name) => core.isDir(path.join(RELEASES_DIR, name)) && core.parseVersion(name)).sort(core.compareVersions);
  }
  function loadReleaseManifest(version) {
    if (!manifests.has(version)) {
      const file = path.join(RELEASES_DIR, version, 'release.yaml');
      manifests.set(version, core.exists(file) ? core.readYamlAbs(file) : null);
    }
    return manifests.get(version);
  }
  function loadScopeRequirements(version, track) {
    const scopes = track === 'frontend' ? ['frontend'] : track === 'backend' ? ['backend', 'database', 'deployment', 'decisions'] : ['frontend', 'backend', 'database', 'deployment', 'decisions'];
    const requirements = [];
    for (const scope of scopes) {
      const file = path.join(RELEASES_DIR, version, `${scope}.yaml`);
      if (!core.exists(file)) continue;
      const doc = core.readYamlAbs(file) || {};
      for (const requirement of doc.requirements || []) requirements.push(requirement);
    }
    return requirements;
  }
  function ancillary() {
    if (ancillaryCache) return ancillaryCache;
    const migrationRecords = migrations();
    const appsettings = [];
    if (core.exists(APPSETTINGS_DIR)) for (const name of fs.readdirSync(APPSETTINGS_DIR).filter((name) => name.endsWith('.yaml'))) {
      const doc = core.readYamlAbs(path.join(APPSETTINGS_DIR, name)) || {};
      appsettings.push(...doc.settings || []);
    }
    const file = path.join(VERSIONS_DIR, 'version-manifest.json');
    let versionManifest = null;
    if (core.exists(file)) {
      try { versionManifest = JSON.parse(fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((line) => !/^\s*#/.test(line)).join('\n')); } catch (_) { versionManifest = null; }
    }
    ancillaryCache = { migrations: migrationRecords, appsettings, versionManifest };
    return ancillaryCache;
  }
  function load(source, target, track) {
    const key = JSON.stringify([source || null, target || null, track || null]);
    if (cache.has(key)) return cache.get(key);
    const versions = listVersions().filter((version) => (!source || core.compareVersions(version, source) > 0) && (!target || core.compareVersions(version, target) <= 0));
    const requirements = [];
    const selectedManifests = {};
    for (const version of versions) {
      selectedManifests[version] = loadReleaseManifest(version);
      requirements.push(...loadScopeRequirements(version, track));
    }
    const extra = track === 'frontend' ? { migrations: migrations(), versionManifest: null } : ancillary();
    const result = Object.assign({ versions, manifests: selectedManifests, requirements }, extra);
    cache.set(key, result);
    return result;
  }
  function angularMajorAt(version) {
    const normalized = core.normalizeVersion(version) || version;
    const candidates = listVersions().filter((known) => core.compareVersions(known, normalized) <= 0);
    const manifest = candidates.length ? loadReleaseManifest(candidates[candidates.length - 1]) : null;
    const parsed = manifest && manifest.frameworkTransition && core.parseVersion(`${manifest.frameworkTransition.angularTo}.0`);
    return parsed ? parsed[0] : null;
  }
  function migrations() {
    return core.exists(MIGRATIONS_DIR) ? fs.readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith('.yaml')).map((name) => core.readYamlAbs(path.join(MIGRATIONS_DIR, name))) : [];
  }
  return { RELEASES_DIR, MIGRATIONS_DIR, APPSETTINGS_DIR, VERSIONS_DIR,
    listVersions, loadReleaseManifest, loadScopeRequirements, load, angularMajorAt,
    allRequirements: (source, target, track) => load(source, target, track).requirements.slice(),
    migrations, appSettings: () => ancillary().appsettings.slice(),
    requirementById: (id) => load().requirements.find((requirement) => requirement.id === id) || null,
    reset: () => { cache.clear(); manifests.clear(); ancillaryCache = null; }
  };
}

function defaultStore() {
  const root = path.resolve(__dirname, '..', '..', '..', 'ingest');
  const parseVersion = (raw) => { const match = String(raw || '').match(/(\d+)\.(\d+)(?:\.(\d+))?/); return match ? [+match[1], +match[2], +(match[3] || 0)] : null; };
  const compareVersions = (left, right) => { const first = parseVersion(left); const second = parseVersion(right); if (!first || !second) return null; for (let index = 0; index < 3; index++) if (first[index] !== second[index]) return first[index] - second[index]; return 0; };
  return createStore({ P: (...parts) => path.join(root, ...parts), exists: fs.existsSync,
    isDir: (file) => fs.statSync(file).isDirectory(), parseVersion, compareVersions,
    normalizeVersion: (raw) => parseVersion(raw) ? parseVersion(raw).join('.') : null,
    readYamlAbs: (file) => yaml.parse(fs.readFileSync(file, 'utf8')) });
}

module.exports = { createStore, defaultStore };
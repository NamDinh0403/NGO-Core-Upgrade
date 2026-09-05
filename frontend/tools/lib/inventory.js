'use strict';
/*
 * Recursive, read-only inventory of a client Angular/NGO front-end repository.
 * Discovers key files by convention + pattern, classifies the Angular workspace
 * (NGMODULE / STANDALONE / HYBRID) and bootstrap style, and computes semantic
 * coverage. Produces the three run artifacts:
 *   frontend-file-inventory.json, frontend-semantic-graph.json, frontend-coverage.yaml
 *
 * This module discovers WHERE things are; the derive/map skills decide meaning.
 */
const path = require('path');
const core = require('./core');

// Semantic roles the agent must cover for a complete plan.
const SEMANTIC_ROLES = [
  'packageManifest', 'lockfile', 'packageManagerConfig', 'angularWorkspace',
  'mainBootstrap', 'appModule', 'standaloneConfig', 'routing', 'routeService',
  'environmentFiles', 'environmentService', 'runtimeConfigJson', 'appInitializer',
  'tsconfig', 'polyfills', 'indexHtml', 'globalStyles', 'assets', 'fonts',
  'skinsThemes', 'scripts', 'webManifest', 'testConfig', 'serviceWorker',
  'proxyConfig', 'ciPipeline', 'clientExtensions',
];

function rel(root, abs) { return path.relative(root, abs).split(path.sep).join('/'); }
function baseName(abs) { return path.basename(abs); }

function classify(files, root) {
  const R = (abs) => rel(root, abs);
  const byName = (re) => files.filter((f) => re.test(baseName(f)));
  const byPath = (re) => files.filter((f) => re.test(R(f)));

  const roles = {};
  const add = (role, list) => { roles[role] = (roles[role] || []).concat(list.map((f) => R(f))); };

  add('packageManifest', byName(/^package\.json$/));
  add('lockfile', byName(/^(package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml)$/));
  add('packageManagerConfig', byName(/^(\.npmrc|\.yarnrc(\.yml)?|\.pnpmrc)$/));
  add('angularWorkspace', byName(/^(angular\.json|workspace\.json|project\.json)$/));
  add('mainBootstrap', byName(/^main(\.\w+)?\.ts$/));
  add('appModule', byName(/app\.module(\.\w+)?\.ts$/));
  add('standaloneConfig', byName(/^app\.config(\.\w+)?\.ts$/).concat(byPath(/bootstrapApplication/)));
  add('routing', byName(/(app-)?routing(\.module)?\.ts$/));
  add('routeService', byName(/(app-)?route(s)?(\.service)?\.ts$/).filter((f) => !/routing\.module/.test(baseName(f))));
  add('environmentFiles', byPath(/environments?\//).filter((f) => /environment.*\.ts$/.test(baseName(f))));
  add('environmentService', byName(/(app-)?environment(\.service)?\.ts$/).concat(byName(/config(uration)?\.service\.ts$/)));
  add('runtimeConfigJson', byPath(/assets\/config/).filter((f) => /\.json$/.test(baseName(f))).concat(byName(/^(app\.config|runtime-config|settings)\.json$/)));
  add('appInitializer', byPath(/initializer|app-init/i));
  add('tsconfig', byName(/^tsconfig.*\.json$/));
  add('polyfills', byName(/^polyfills(\.\w+)?\.ts$/));
  add('indexHtml', byName(/^index\.html$/));
  add('globalStyles', byName(/^styles(\.\w+)?\.(css|scss|sass|less)$/));
  add('assets', byPath(/(^|\/)(src\/)?assets\//));
  add('fonts', byPath(/fonts?\//).concat(byName(/\.(woff2?|ttf|eot|otf)$/)));
  add('skinsThemes', byPath(/(skins?|themes?)\//));
  add('scripts', byName(/^(scripts?|deploy).*\.(js|sh|ps1)$/));
  add('webManifest', byName(/^(manifest\.webmanifest|manifest\.json|browserconfig\.xml)$/));
  add('testConfig', byName(/^(karma\.conf\.js|jest\.config\.(js|ts)|test\.ts|test-setup\.ts|vitest\.config\.ts)$/));
  add('serviceWorker', byName(/^(ngsw-config\.json|service-worker\.ts|sw\.ts)$/));
  add('proxyConfig', byName(/^proxy\.conf\.(json|js|mjs)$/));
  add('ciPipeline', byPath(/(\.github\/workflows|\.gitlab-ci|azure-pipelines|Jenkinsfile|bitbucket-pipelines)/i));
  add('clientExtensions', byName(/-ext(\.\w+)?\.(ts|html|scss|css)$/));

  // De-duplicate.
  for (const k of Object.keys(roles)) roles[k] = [...new Set(roles[k])];
  return roles;
}

function detectWorkspaceType(root, files, roles) {
  const readMaybe = (relPath) => { try { return core.readText(path.join(root, relPath)); } catch (e) { return ''; } };
  let ngModule = (roles.appModule || []).length > 0;
  let standalone = false;
  for (const relPath of (roles.mainBootstrap || []).concat(roles.standaloneConfig || [])) {
    const txt = readMaybe(relPath);
    if (/bootstrapApplication\s*\(/.test(txt)) standalone = true;
    if (/bootstrapModule\s*\(/.test(txt)) ngModule = true;
  }
  // Any standalone components alongside an AppModule → hybrid.
  const anyStandaloneComponent = files.some((f) => {
    if (!/\.ts$/.test(f) || /\.spec\.ts$/.test(f)) return false;
    try { return /standalone:\s*true/.test(core.readText(f)); } catch (e) { return false; }
  });
  if (standalone && ngModule) return 'HYBRID';
  if (standalone && anyStandaloneComponent && !ngModule) return 'STANDALONE';
  if (standalone) return 'STANDALONE';
  if (ngModule) return anyStandaloneComponent ? 'HYBRID' : 'NGMODULE';
  return 'UNKNOWN';
}

function detectBootstrapStyle(root, roles) {
  const readMaybe = (relPath) => { try { return core.readText(path.join(root, relPath)); } catch (e) { return ''; } };
  for (const relPath of (roles.mainBootstrap || [])) {
    const txt = readMaybe(relPath);
    if (/bootstrapApplication\s*\(/.test(txt)) return 'bootstrapApplication';
    if (/bootstrapModule\s*\(/.test(txt)) return 'bootstrapModule';
  }
  return (roles.appModule || []).length ? 'bootstrapModule' : 'unknown';
}

function detectConfigSources(root, roles) {
  // Classify configuration sources by evidence.
  const sources = [];
  const readMaybe = (relPath) => { try { return core.readText(path.join(root, relPath)); } catch (e) { return ''; } };
  for (const f of roles.environmentFiles || []) sources.push({ ref: f, kind: 'COMPILE_TIME' });
  for (const f of roles.runtimeConfigJson || []) sources.push({ ref: f, kind: 'RUNTIME_STATIC_ASSET' });
  for (const f of roles.environmentService || []) {
    const txt = readMaybe(f);
    let kind = 'UNKNOWN';
    if (/HttpClient|fetch\(|\.get\(/.test(txt)) kind = 'RUNTIME_REMOTE';
    else if (/window\.|globalThis\./.test(txt)) kind = 'RUNTIME_STATIC_ASSET';
    sources.push({ ref: f, kind });
  }
  // Angular fileReplacements (build-time) from angular.json.
  const ng = (roles.angularWorkspace || [])[0];
  if (ng) {
    try {
      const data = JSON.parse(readMaybe(ng));
      const projects = data.projects || {};
      for (const p of Object.keys(projects)) {
        const configs = (((projects[p].architect || projects[p].targets || {}).build || {}).configurations) || {};
        for (const c of Object.keys(configs)) {
          for (const frp of (configs[c].fileReplacements || [])) {
            sources.push({ ref: frp.replace || frp.with, kind: 'BUILD_TIME_REPLACEMENT', project: p, configuration: c });
          }
        }
      }
    } catch (e) { /* ignore malformed angular.json */ }
  }
  return sources;
}

function computeCoverage(roles) {
  const covered = [];
  const uncovered = [];
  for (const role of SEMANTIC_ROLES) {
    if ((roles[role] || []).length > 0) covered.push(role);
    else uncovered.push(role);
  }
  return {
    schemaVersion: 1,
    summary: `${covered.length}/${SEMANTIC_ROLES.length} roles present`,
    coveredRoles: covered,
    absentRoles: uncovered,
    // Absent roles are "inspected and not present", not "unknown".
    roleStatus: SEMANTIC_ROLES.reduce((acc, r) => { acc[r] = (roles[r] || []).length ? 'PRESENT' : 'ABSENT_WITH_EVIDENCE'; return acc; }, {}),
  };
}

function run(clientPath) {
  const files = core.walk(clientPath, {});
  const roles = classify(files, clientPath);
  const workspaceType = detectWorkspaceType(clientPath, files, roles);
  const bootstrapStyle = detectBootstrapStyle(clientPath, roles);
  const configSources = detectConfigSources(clientPath, roles);

  const fileInventory = {
    schemaVersion: 1,
    root: path.resolve(clientPath),
    generatedAt: core.nowIso(),
    fileCount: files.length,
    files: files.map((f) => rel(clientPath, f)),
    roles,
  };
  const semanticGraph = {
    schemaVersion: 1,
    workspaceType,
    bootstrapStyle,
    angularProjects: (roles.angularWorkspace || []).length ? readProjects(clientPath, roles.angularWorkspace[0]) : [],
    configurationSources: configSources,
    extensions: roles.clientExtensions || [],
    roleIndex: roles,
  };
  const coverage = computeCoverage(roles);
  return { fileInventory, semanticGraph, coverage };
}

function readProjects(root, ngRel) {
  try {
    const data = JSON.parse(core.readText(path.join(root, ngRel)));
    const projects = data.projects || {};
    return Object.keys(projects).map((name) => ({
      name,
      projectType: projects[name].projectType || null,
      root: projects[name].root || null,
      sourceRoot: projects[name].sourceRoot || null,
    }));
  } catch (e) { return []; }
}

module.exports = { SEMANTIC_ROLES, run, classify, detectWorkspaceType, detectBootstrapStyle };

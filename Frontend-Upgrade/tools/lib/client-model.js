'use strict';
/*
 * Client model + evidence builder.
 * Turns the read-only inventory (roleIndex + file list) into (a) the normalized
 * client model the requirement mapper needs, and (b) the structured evidence the
 * applicability evaluator needs. This is how a release note like "edit
 * app.module.ts" is resolved to the client's ACTUAL implementation point.
 * Dependency-free, Node 14+.
 */
const fs = require('fs');
const path = require('path');
const core = require('./core');

function firstFile(roles, role) { const l = roles[role] || []; return l.length ? l[0] : null; }
function allFiles(roles, role) { return roles[role] || []; }

function orderTsconfig(list) {
  // Base tsconfig.json first, more-specific levels after.
  return list.slice().sort((a, b) => {
    const ab = /tsconfig\.json$/.test(a) ? 0 : 1;
    const bb = /tsconfig\.json$/.test(b) ? 0 : 1;
    return ab - bb || a.localeCompare(b);
  });
}

function buildModel(inv) {
  const roles = (inv.fileInventory && inv.fileInventory.roles) || (inv.semanticGraph && inv.semanticGraph.roleIndex) || {};
  const bootstrapStyle = (inv.semanticGraph && inv.semanticGraph.bootstrapStyle) || 'NGMODULE';

  const configLayers = [];
  for (const f of allFiles(roles, 'environmentService')) configLayers.push({ type: 'runtimeService', file: f, precedence: 0 });
  for (const f of allFiles(roles, 'runtimeConfigJson')) configLayers.push({ type: 'assetsJson', file: f, precedence: 1 });
  for (const f of allFiles(roles, 'environmentFiles')) configLayers.push({ type: 'environmentFile', file: f, precedence: 2 });

  const routerComposition = [];
  for (const f of allFiles(roles, 'routeService')) routerComposition.push({ type: 'routeService', file: f });
  for (const f of allFiles(roles, 'routing')) routerComposition.push({ type: 'routingModule', file: f });
  for (const f of allFiles(roles, 'standaloneConfig')) routerComposition.push({ type: 'provideRouter', file: f });

  const moduleRegistration = [];
  if (bootstrapStyle === 'STANDALONE') {
    for (const f of allFiles(roles, 'standaloneConfig')) moduleRegistration.push({ type: 'standaloneProviders', file: f });
    for (const f of allFiles(roles, 'mainBootstrap')) moduleRegistration.push({ type: 'standaloneProviders', file: f });
  } else {
    for (const f of allFiles(roles, 'appModule')) moduleRegistration.push({ type: 'ngModule', file: f });
  }

  return {
    bootstrapStyle,
    configLayers,
    routerComposition,
    moduleRegistration,
    tsconfigChain: orderTsconfig(allFiles(roles, 'tsconfig')),
    roleFiles: {
      iconRegistration: (moduleRegistration.map((m) => m.file)),
      styles: allFiles(roles, 'globalStyles'),
    },
    packageJson: firstFile(roles, 'packageManifest') || 'package.json',
    files: (inv.fileInventory && inv.fileInventory.files) || [],
  };
}

function readIfExists(abs) { try { return fs.readFileSync(abs, 'utf8'); } catch (e) { return ''; } }

function buildEvidence(inv, clientPath) {
  const roles = (inv.fileInventory && inv.fileInventory.roles) || {};
  const files = (inv.fileInventory && inv.fileInventory.files) || [];
  const tokens = [];
  const packages = [];
  const configKeys = [];
  const customizedTokens = [];

  // packages from package.json
  const pkgRel = (roles.packageManifest || [])[0];
  if (pkgRel) {
    try {
      const pkg = JSON.parse(readIfExists(path.join(clientPath, pkgRel)) || '{}');
      for (const d of [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies]) {
        if (d) for (const k of Object.keys(d)) packages.push(k);
      }
    } catch (e) { /* ignore */ }
  }

  // config keys from environment files, runtime service, runtime config json
  const cfgRoles = ['environmentFiles', 'environmentService', 'runtimeConfigJson'];
  for (const role of cfgRoles) {
    for (const rel of (roles[role] || [])) {
      const text = readIfExists(path.join(clientPath, rel));
      const m = text.match(/([A-Za-z_][A-Za-z0-9_]*)\s*:/g) || [];
      for (const k of m) configKeys.push(k.replace(/\s*:$/, ''));
    }
  }

  // tokens: imports/symbols from a bounded set of source files
  const tokenRoles = ['appModule', 'mainBootstrap', 'routeService', 'routing', 'standaloneConfig'];
  for (const role of tokenRoles) {
    for (const rel of (roles[role] || [])) {
      const text = readIfExists(path.join(clientPath, rel));
      const imp = text.match(/from\s+['"][^'"]+['"]/g) || [];
      for (const i of imp) tokens.push(i.replace(/from\s+['"]|['"]/g, ''));
      const sym = text.match(/\b(faLock|faExternalLink|context-menu|ngx-contextmenu|@Effect|entryComponents|getComponentFactory|getCurrentConfiguration|createEffect)\b/g) || [];
      for (const s of sym) tokens.push(s);
    }
  }

  // customization evidence: -ext files
  for (const f of (roles.clientExtensions || [])) { customizedTokens.push('-ext'); tokens.push(f); }

  // file basenames become tokens too (helps IF_FILE_EXISTS discovery matching)
  for (const f of files) tokens.push(path.basename(f));

  return {
    files,
    tokens: Array.from(new Set(tokens)),
    packages: Array.from(new Set(packages)),
    configKeys: Array.from(new Set(configKeys)),
    customizedTokens: Array.from(new Set(customizedTokens)),
    enabledFeatures: [],
  };
}

function fromInventory(inv, clientPath) {
  return { model: buildModel(inv), evidence: buildEvidence(inv, clientPath) };
}

module.exports = { fromInventory, buildModel, buildEvidence };

'use strict';
/*
 * Requirement-to-client mapper (IRequirementToClientMapper).
 * Resolves a semantic release requirement to the client's ACTUAL implementation
 * point using a normalized client model derived from the inventory. Honors
 * config precedence, module/provider registration style, router composition,
 * and tsconfig inheritance. A release note that says "edit app.module.ts" never
 * becomes a blind edit: it resolves to whatever the client really uses.
 * Dependency-free, Node 14+.
 */

function firstPresent(list) { return Array.isArray(list) && list.length ? list[0] : null; }

// Build a normalized client model from the inventory.run() output. Tests may
// also pass a hand-built model with the same shape.
function fromInventory(inv) {
  const sg = (inv && inv.semanticGraph) || {};
  const roleFiles = (inv && inv.roleFiles) || {};
  const files = (inv && inv.fileInventory && inv.fileInventory.files) || (inv && inv.files) || [];
  return {
    bootstrapStyle: sg.bootstrapStyle || sg.workspaceType || 'NGMODULE',
    configLayers: inv && inv.configLayers ? inv.configLayers : [],
    routerComposition: inv && inv.routerComposition ? inv.routerComposition : [],
    moduleRegistration: inv && inv.moduleRegistration ? inv.moduleRegistration : [],
    tsconfigChain: inv && inv.tsconfigChain ? inv.tsconfigChain : [],
    roleFiles,
    packageJson: (inv && inv.packageJson) || 'package.json',
    files,
  };
}

function resolveConfigLayer(model) {
  // Precedence: runtime service overrides build-time environment files.
  const layers = model.configLayers || [];
  const runtime = layers.find((l) => l.type === 'runtimeService');
  const assets = layers.find((l) => l.type === 'assetsJson');
  const envFile = layers.find((l) => l.type === 'environmentFile');
  const chosen = runtime || assets || envFile || null;
  const order = layers.map((l) => l.type);
  return { chosen, precedence: order };
}

function resolveRouter(model) {
  const rc = model.routerComposition || [];
  return rc.find((r) => r.type === 'routeService')
    || rc.find((r) => r.type === 'routingModule')
    || rc.find((r) => r.type === 'provideRouter')
    || null;
}

function resolveModuleReg(model) {
  const mr = model.moduleRegistration || [];
  if (model.bootstrapStyle === 'STANDALONE') {
    return mr.find((m) => m.type === 'standaloneProviders') || mr[0] || null;
  }
  return mr.find((m) => m.type === 'ngModule') || mr[0] || null;
}

function resolveTsconfig(model) {
  const chain = model.tsconfigChain || [];
  // Most specific level that carries compiler options is the last in the chain.
  return chain.length ? chain[chain.length - 1] : null;
}

function byRole(model, role) {
  const rf = model.roleFiles || {};
  if (rf[role] && rf[role].length) return rf[role];
  return [];
}

function fileLike(model, names) {
  const files = model.files || [];
  const hits = [];
  for (const n of names) {
    const f = files.find((x) => String(x).toLowerCase().endsWith(n.toLowerCase()) || String(x).toLowerCase().indexOf('/' + n.toLowerCase()) !== -1 || String(x).toLowerCase() === n.toLowerCase());
    if (f) hits.push(f);
  }
  return hits;
}

function map(req, model) {
  const roles = Array.isArray(req.semanticRoles) ? req.semanticRoles : [];
  const targets = [];
  let note = '';
  let precedence = null;

  for (const role of roles) {
    switch (role) {
      case 'environmentConfig':
      case 'runtimeConfigService': {
        const { chosen, precedence: pr } = resolveConfigLayer(model);
        precedence = pr;
        if (chosen) { targets.push(chosen.file); note = `config resolved to ${chosen.type} (precedence: ${pr.join(' > ') || 'n/a'})`; }
        break;
      }
      case 'routerComposition':
      case 'dynamicRouteService': {
        const r = resolveRouter(model);
        if (r) { targets.push(r.file); note = `router resolved to ${r.type}`; }
        break;
      }
      case 'ngModuleMetadata':
      case 'provider':
      case 'iconRegistration': {
        const m = resolveModuleReg(model);
        if (m) { targets.push(m.file); note = `registration resolved to ${m.type}`; }
        else { const rf = byRole(model, 'iconRegistration'); if (rf.length) targets.push(rf[0]); }
        break;
      }
      case 'tsconfigChain': {
        const t = resolveTsconfig(model);
        if (t) { targets.push(t); note = 'tsconfig resolved to most-specific level'; }
        break;
      }
      case 'packageManifest':
        targets.push(model.packageJson);
        break;
      case 'polyfills':
        targets.push.apply(targets, fileLike(model, ['polyfills.ts', 'polyfills.js']));
        break;
      case 'indexHtml':
        targets.push.apply(targets, fileLike(model, ['index.html']));
        break;
      case 'angularWorkspace':
        targets.push.apply(targets, fileLike(model, ['angular.json']));
        break;
      case 'styles':
        targets.push.apply(targets, fileLike(model, ['styles.scss', 'styles.css']));
        break;
      default: {
        const rf = byRole(model, role);
        if (rf.length) targets.push.apply(targets, rf);
      }
    }
  }

  const unique = Array.from(new Set(targets.filter(Boolean)));
  return {
    requirementId: req.id,
    mapped: unique.length > 0,
    targets: unique,
    resolvedRoles: roles,
    precedence,
    note: note || (unique.length ? 'mapped by role' : 'no client implementation point found'),
  };
}

function mapAll(requirements, model) {
  return requirements.map((r) => map(r, model));
}

module.exports = { map, mapAll, fromInventory, resolveConfigLayer, resolveRouter, resolveModuleReg, resolveTsconfig };

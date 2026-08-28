'use strict';
/*
 * Scoped, read-only inspection of the local NGO Core repository (or a read-only
 * target worktree). Scoped BY the client inventory so Core is inspected only
 * where the client actually integrates — never a blind full-tree scan into LLM
 * context.
 *
 * Produces: core-file-inventory.json, core-semantic-graph.json,
 * and a core-target-requirements.yaml scaffold (semantic, not direct patches).
 */
const path = require('path');
const core = require('./core');

function rel(root, abs) { return path.relative(root, abs).split(path.sep).join('/'); }

// Map a client semantic role to the Core file patterns worth inspecting for it.
const CORE_SCOPE = {
  packageManifest: [/^package\.json$/],
  angularWorkspace: [/^(angular\.json|workspace\.json)$/],
  mainBootstrap: [/main(\.\w+)?\.ts$/],
  appModule: [/app\.module(\.\w+)?\.ts$/, /\.module\.ts$/],
  standaloneConfig: [/app\.config(\.\w+)?\.ts$/],
  routing: [/routing(\.module)?\.ts$/, /routes?\.ts$/],
  routeService: [/route(s)?(\.service)?\.ts$/],
  environmentFiles: [/environment.*\.ts$/],
  environmentService: [/(environment|config(uration)?)\.service\.ts$/],
  runtimeConfigJson: [/assets\/config\/.*\.json$/],
  tsconfig: [/^tsconfig.*\.json$/],
  indexHtml: [/index\.html$/],
  globalStyles: [/styles(\.\w+)?\.(css|scss|sass|less)$/],
  skinsThemes: [/(skins?|themes?)\//],
  assets: [/assets\//],
  clientExtensions: [/\.component\.ts$/, /\.ts$/], // base classes clients extend
};

function findPublicExports(corePath, files) {
  // Public API surface (barrel/index/public-api) is the integration contract.
  return files
    .filter((f) => /(public[-_]?api|index)\.ts$/.test(path.basename(f)))
    .map((f) => rel(corePath, f));
}

function run(corePath, clientInventory, opts) {
  opts = opts || {};
  const roles = (clientInventory.semanticGraph && clientInventory.semanticGraph.roleIndex) || {};
  const allFiles = core.walk(corePath, {});

  // Only inspect Core files whose patterns correspond to a role the client uses.
  const activeRoles = Object.keys(CORE_SCOPE).filter((r) => (roles[r] || []).length > 0);
  const scopedSet = new Set();
  const scopedByRole = {};
  for (const role of activeRoles) {
    const pats = CORE_SCOPE[role];
    const matches = allFiles.filter((f) => pats.some((re) => re.test(rel(corePath, f)) || re.test(path.basename(f))));
    scopedByRole[role] = matches.map((f) => rel(corePath, f)).slice(0, 200);
    matches.forEach((f) => scopedSet.add(f));
  }

  const publicExports = findPublicExports(corePath, allFiles);
  const requirementsScaffold = deriveRequirementScaffold(corePath, scopedByRole, activeRoles, opts);

  const fileInventory = {
    schemaVersion: 1,
    root: path.resolve(corePath),
    generatedAt: core.nowIso(),
    targetCommit: opts.targetCommit || null,
    totalFiles: allFiles.length,
    scopedFileCount: scopedSet.size,
    files: [...scopedSet].map((f) => rel(corePath, f)),
    publicExports,
  };
  const semanticGraph = {
    schemaVersion: 1,
    scopedByRole,
    activeRoles,
    publicExports,
    note: 'Core inspection is scoped by the client inventory; unused Core features are intentionally excluded.',
  };
  return { fileInventory, semanticGraph, requirementsScaffold };
}

/**
 * Produce a SCAFFOLD of semantic requirements (not direct patches). Package
 * requirements are grounded in Core package.json; other categories are seeded as
 * REQUIRES_RESEARCH placeholders for the derive/map skills to complete with
 * evidence. This keeps the plan honest: nothing is asserted without evidence.
 */
function deriveRequirementScaffold(corePath, scopedByRole, activeRoles, opts) {
  const requirements = [];
  let seq = 0;
  const nextId = (cat) => `REQ-${cat}-${String(++seq).padStart(3, '0')}`;

  // Package requirements from Core package.json direct dependencies.
  try {
    const pkg = core.readJsonAbs(path.join(corePath, 'package.json'));
    const deps = Object.assign({}, pkg.dependencies || {});
    for (const [name, version] of Object.entries(deps)) {
      requirements.push({
        id: nextId('PKG'), category: 'package', targetVersion: opts.targetVersion || pkg.version || null,
        description: `Core declares direct dependency ${name}@${version}`,
        packageOrSymbol: name, selectedTargetVersion: version,
        applicability: 'client-uses-or-shares-package',
        evidenceSource: 'core:package.json#dependencies',
        verification: 'client package.json aligned + install resolves', risk: 'MEDIUM', confidence: 'HIGH',
      });
    }
  } catch (e) { /* handled elsewhere */ }

  // Seed one research placeholder per active integration role (evidence pending).
  const roleCategory = {
    environmentFiles: 'environment key', environmentService: 'runtime configuration key',
    runtimeConfigJson: 'runtime configuration key', appModule: 'module', standaloneConfig: 'provider',
    routing: 'route', routeService: 'route', tsconfig: 'compiler option',
    globalStyles: 'style', skinsThemes: 'skin', assets: 'asset', indexHtml: 'HTML structure',
  };
  for (const role of activeRoles) {
    const cat = roleCategory[role];
    if (!cat) continue;
    requirements.push({
      id: nextId('SEM'), category: cat, targetVersion: opts.targetVersion || null,
      description: `Inspect Core ${role} for target integration requirements applicable to the client`,
      possibleImplementationRoles: [role],
      evidenceSource: `core:${(scopedByRole[role] || [])[0] || role}`,
      verification: 'requirement mapped to exact client file with evidence',
      risk: 'MEDIUM', confidence: 'LOW', status: 'REQUIRES_RESEARCH',
    });
  }

  return { schemaVersion: 1, generatedAt: core.nowIso(), requirements };
}

module.exports = { run, CORE_SCOPE };

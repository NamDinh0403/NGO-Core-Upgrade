'use strict';
/*
 * Release planning orchestrator.
 * Ties the release-range resolver, applicability evaluator, requirement->client
 * mapper, AppSettings inventory, and requirement-coverage validator into the
 * per-run planning artifacts and gates. Read-only; produces plain objects the
 * CLI writes under runs/<client>/<run-id>/.
 * Dependency-free, Node 14+.
 */
const range = require('./release-range');
const applic = require('./applicability');
const rmap = require('./requirement-map');
const cov = require('./requirement-coverage');
const appset = require('./appsettings-inventory');
const store = require('./release-knowledge');
const clientModel = require('./client-model');

// Build the full read-only planning picture for a release range.
function plan(opts) {
  const sourceVersion = opts.sourceVersion;
  const targetVersion = opts.targetVersion;
  const inv = opts.inventory;
  const clientPath = opts.clientPath;
  const backendPath = opts.backendPath || clientPath; // appsettings may live in the client or a sibling

  const resolved = range.resolve(sourceVersion, targetVersion);
  const requirements = resolved.requirements.concat(resolved.migrationRequirements);

  const { model, evidence } = clientModel.fromInventory(inv, clientPath);

  // Applicability + mapping per requirement.
  const applicabilityById = {};
  const mappingById = {};
  const applicable = [];
  const notApplicable = [];
  const ambiguous = [];
  for (const req of requirements) {
    const a = applic.evaluate(req, evidence);
    applicabilityById[req.id] = a;
    if (a.status === 'APPLICABLE') {
      const m = rmap.map(req, model);
      mappingById[req.id] = m;
      applicable.push({ id: req.id, scope: req.scope, timing: req.timing, automation: req.automation, mapped: m.mapped, targets: m.targets, evidence: a.evidence });
    } else if (a.status === 'NOT_APPLICABLE_WITH_EVIDENCE') {
      notApplicable.push({ id: req.id, scope: req.scope, evidence: a.evidence });
    } else {
      ambiguous.push({ id: req.id, scope: req.scope, status: a.status, evidence: a.evidence, owner: a.owner || null });
    }
  }

  // AppSettings coverage (backend config surface).
  const appInventory = appset.discover(backendPath);
  const appReqs = store.appSettings();
  const appCoverage = appset.mapRequirements(appInventory, appReqs);

  // Requirement coverage at planning time (nothing changed/verified yet).
  const planned = new Set(applicable.filter((a) => a.mapped).map((a) => a.id));
  const coverage = cov.buildCoverage(opts.runId || 'plan', sourceVersion, targetVersion, requirements, {
    applicability: applicabilityById,
    mapping: mappingById,
    planned,
  });
  const missingSteps = cov.missingSteps(coverage);
  const deploymentChecklist = cov.deploymentChecklist(requirements, coverage);
  const planReady = cov.planReady(coverage);

  return {
    releaseRange: {
      sourceVersion, targetVersion,
      versions: resolved.versions,
      reusableMigrations: resolved.reusableMigrations,
      droppedRequirements: resolved.droppedRequirements,
      sourceAngularMajor: resolved.sourceAngularMajor,
      targetAngularMajor: resolved.targetAngularMajor,
    },
    applicableRequirements: { applicable, notApplicable, ambiguous },
    requirementCoverage: coverage,
    missingSteps,
    deploymentChecklist,
    appsettings: {
      inventory: appInventory,
      coverage: appCoverage.coverage,
      missing: appCoverage.missing,
      azureChecklist: appCoverage.azureChecklist,
      secretRejections: appCoverage.secretRejections,
    },
    planReady,
    clientModelSummary: {
      bootstrapStyle: model.bootstrapStyle,
      configLayers: model.configLayers.map((l) => l.type),
      routerComposition: model.routerComposition.map((r) => r.type),
      tsconfigLevels: model.tsconfigChain.length,
    },
  };
}

module.exports = { plan };

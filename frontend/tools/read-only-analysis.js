'use strict';
const fs = require('fs');
const path = require('path');
const core = require('./lib/core');
const request = require('./lib/request');
const doctor = require('./lib/doctor');
const runStore = require('./lib/run');
const engine = require('./lib/engine');
const git = require('./lib/git');
const repos = require('./lib/repos');
const inventory = require('./lib/inventory');
const inspectCore = require('./lib/inspect-core');
const resolvePackages = require('./lib/resolve-packages');
const planningRelease = require('./lib/planning-release');

function line(value) { process.stdout.write(value + '\n'); }
function err(value) { process.stderr.write(value + '\n'); }
function buildRequestOrDie(flags) {
  let req;
  try { req = request.build(flags); }
  catch (e) { err(`request error: ${e.message}`); process.exit(2); }
  return req;
}

function printDoctor(report) {
  line('frontend-upgrade-agent doctor (dual-repository preflight, read-only)');
  line('');
  line('  request:');
  if (report.requestErrors.length) report.requestErrors.forEach((e) => line(`    ! ${e}`));
  else line('    ok');
  const printChecks = (label, checks) => {
    line(`  ${label}:`);
    for (const c of checks) {
      const mark = c.ok ? '.' : (c.severity === 'warn' ? '~' : '!');
      line(`    [${mark}] ${c.id}: ${c.detail || (c.ok ? 'ok' : 'failed')}`);
    }
  };
  printChecks('prerequisites', report.prerequisites);
  printChecks('client repository', report.client.checks);
  printChecks('core repository (read-only)', report.core.checks);
  if (report.contradictions.length) {
    line('  contradictions:');
    for (const x of report.contradictions) line(`    ! [${x.severity}] ${x.id}: ${x.detail}`);
  }
  line('');
  line(`  status:      ${report.status}`);
  line(`  next action: ${report.nextAction}`);
}

function startCmd(flags) {
  const req = buildRequestOrDie(flags);
  const clientId = request.clientId(req);
  const runId = flags.run || runStore.newRunId(clientId);
  const dir = runStore.ensure(clientId, runId);

  // Persist request.
  core.writeYaml(path.join(dir, 'request.yaml'), stripInternal(req));
  const state = runStore.initState(dir, {
    runId, clientId,
    clientPath: req.resolved.clientPath, corePath: req.resolved.corePath,
    sourceVersion: req.upgrade.sourceVersion, targetVersion: req.upgrade.targetVersion,
    currentPhase: 'DOCTOR', currentSkill: 'validate-local-repositories',
  });
  runStore.event(dir, { phase: 'REQUEST', type: 'run-started', clientId, runId });

  // 1) Doctor.
  const report = doctor.run(req);
  core.writeJson(path.join(dir, 'doctor-report.json'), report);
  core.writeJson(path.join(dir, 'client-repository.json'), report.client.summary);
  core.writeJson(path.join(dir, 'core-repository.json'), report.core.summary);
  runStore.updateState(dir, {
    doctorStatus: report.status,
    coreTargetCommit: report.core.targetCommit,
    coreSourceCommit: report.core.summary.git ? report.core.summary.git.headCommit : null,
  });
  runStore.event(dir, { phase: 'DOCTOR', type: 'doctor-complete', status: report.status });
  printDoctor(report);
  line('');

  if (report.status !== doctor.STATUS.READY_FOR_INVENTORY) {
    runStore.updateState(dir, {
      status: 'BLOCKED', currentPhase: 'HANDOVER', currentSkill: 'developer-escalation',
      nextAction: report.nextAction,
      safeResumeInstruction: `Resolve doctor blocker (${report.status}), then re-run: frontend-upgrade-agent start ...`,
    });
    line(`Run recorded at runs/${clientId}/${runId}/. Blocked at doctor: ${report.status}.`);
    return 1;
  }

  let sharedContext = null;
  try {
    sharedContext = require('../../engine/tools/lib/execution').attach(dir, 'frontend', {
      contextRef: flags.context, clientId, runId,
      clientPath: req.resolved.clientPath, corePath: req.resolved.corePath,
      sourceVersion: req.upgrade.sourceVersion, targetVersion: req.upgrade.targetVersion,
      releaseNotesPath: flags['release-notes']
    });
  } catch (error) {
    runStore.updateState(dir, { status: 'BLOCKED', nextAction: `Revalidate shared context: ${error.message}`, safeResumeInstruction: 'Resume the orchestrator run before frontend planning.' });
    err(`BLOCKED: ${error.message}`);
    return 1;
  }

  // 2) Capture Core baseline fingerprint BEFORE inspection (read-only proof).
  const coreFpBefore = git.fingerprint(req.resolved.corePath, repos.CORE_KEY_FILES);
  core.writeJson(path.join(dir, 'artifacts', 'core-fingerprint-before.json'), coreFpBefore);

  // 3) Optional read-only Core target worktree when target ref differs.
  let coreInspectPath = req.resolved.corePath;
  let worktree = null;
  if (report.core.currentDiffersFromTarget && report.core.targetCommit) {
    const dest = path.join(dir, 'research', 'core-target');
    worktree = git.addReadonlyWorktree(req.resolved.corePath, report.core.targetCommit, dest);
    if (worktree.ok) {
      coreInspectPath = worktree.inspectPath || worktree.worktreePath;
      runStore.event(dir, { phase: 'INSPECT_CORE', type: 'readonly-worktree-created', commit: worktree.commit, path: 'research/core-target' });
      line(`  Core target ref differs from checkout — created read-only worktree at research/core-target/ (${worktree.commit.slice(0, 12)}).`);
    } else {
      runStore.event(dir, { phase: 'INSPECT_CORE', type: 'worktree-failed', error: worktree.error });
      line(`  ~ could not create read-only Core worktree (${worktree.error}); inspecting current Core checkout without switching branches.`);
    }
  }

  // 4) Client inventory (read-only, deterministic).
  const inv = inventory.run(req.resolved.clientPath);
  core.writeJson(path.join(dir, 'frontend-file-inventory.json'), inv.fileInventory);
  core.writeJson(path.join(dir, 'frontend-semantic-graph.json'), inv.semanticGraph);
  core.writeYaml(path.join(dir, 'frontend-coverage.yaml'), inv.coverage);
  runStore.updateState(dir, { semanticCoverage: inv.coverage.summary, currentPhase: 'INSPECT_CORE' });
  runStore.event(dir, { phase: 'INVENTORY_CLIENT', type: 'inventory-complete', files: inv.fileInventory.files.length, workspaceType: inv.semanticGraph.workspaceType });

  // 5) Scoped Core inspection (read-only), scoped by the client inventory.
  const coreInv = inspectCore.run(coreInspectPath, inv, { targetCommit: report.core.targetCommit });
  core.writeJson(path.join(dir, 'core-file-inventory.json'), coreInv.fileInventory);
  core.writeJson(path.join(dir, 'core-semantic-graph.json'), coreInv.semanticGraph);
  core.writeYaml(path.join(dir, 'core-target-requirements.yaml'), coreInv.requirementsScaffold);
  runStore.event(dir, { phase: 'INSPECT_CORE', type: 'core-inspection-complete', files: coreInv.fileInventory.files.length });

  // 6) Exact target package resolution from Core.
  const pkgRes = resolvePackages.run({
    clientSummary: report.client.summary,
    clientPath: req.resolved.clientPath,
    corePath: coreInspectPath,
    coreSummary: report.core.summary,
    targetVersion: req.upgrade.targetVersion,
    policy: core.loadConfig().packageAlignment,
  });
  core.writeYaml(path.join(dir, 'target-package-manifest.yaml'), pkgRes.manifest);
  core.writeYaml(path.join(dir, 'package-alignment-map.yaml'), pkgRes.alignmentMap);
  runStore.updateState(dir, { packageAlignmentStatus: pkgRes.status });
  runStore.event(dir, { phase: 'RESOLVE_PACKAGES', type: 'packages-resolved', status: pkgRes.status, entries: pkgRes.alignmentMap.packages.length });

  // 6b) Release-knowledge planning: resolve the release range, load only the
  // applicable requirements, map them to the client, and build coverage.
  const rel = planningRelease.plan({
    sourceVersion: req.upgrade.sourceVersion,
    targetVersion: req.upgrade.targetVersion,
    inventory: inv,
    clientPath: req.resolved.clientPath,
    backendValidation: sharedContext && sharedContext.upgrade.integration && sharedContext.upgrade.integration.backendValidation,
    runId,
  });
  core.writeYaml(path.join(dir, 'release-range.yaml'), rel.releaseRange);
  core.writeYaml(path.join(dir, 'applicable-requirements.yaml'), rel.applicableRequirements);
  core.writeYaml(path.join(dir, 'requirement-coverage.yaml'), rel.requirementCoverage);
  core.writeYaml(path.join(dir, 'missing-steps.yaml'), { schemaVersion: 1, missingSteps: rel.missingSteps });
  core.writeYaml(path.join(dir, 'deployment-checklist.yaml'), { schemaVersion: 1, items: rel.deploymentChecklist });
  core.writeJson(path.join(dir, 'appsettings-inventory.json'), rel.appsettings.inventory);
  core.writeYaml(path.join(dir, 'appsettings-coverage.yaml'), { schemaVersion: 1, coverage: rel.appsettings.coverage });
  core.writeYaml(path.join(dir, 'missing-appsettings.yaml'), { schemaVersion: 1, missing: rel.appsettings.missing });
  core.writeYaml(path.join(dir, 'azure-app-settings-checklist.yaml'), { schemaVersion: 1, items: rel.appsettings.azureChecklist });
  runStore.updateState(dir, {
    releaseRange: rel.releaseRange.versions,
    reusableMigrations: rel.releaseRange.reusableMigrations,
    applicableRequirementCount: rel.applicableRequirements.applicable.length,
    releasePlanReady: rel.planReady.ready,
  });
  runStore.event(dir, {
    phase: 'RESOLVE_PACKAGES', type: 'release-requirements-resolved',
    versions: rel.releaseRange.versions.length, applicable: rel.applicableRequirements.applicable.length,
    migrations: rel.releaseRange.reusableMigrations, missingSteps: rel.missingSteps.length,
  });
  if (rel.appsettings.secretRejections.length) {
    runStore.failure(dir, { phase: 'RESOLVE_PACKAGES', type: 'appsettings-secret-rejected', ids: rel.appsettings.secretRejections.map((s) => s.id) });
  }

  // 7) Verify Core is unchanged after inspection.
  const coreFpAfter = git.fingerprint(req.resolved.corePath, repos.CORE_KEY_FILES);
  core.writeJson(path.join(dir, 'artifacts', 'core-fingerprint-after.json'), coreFpAfter);
  const unchanged = engine.coreUnchanged(coreFpBefore, coreFpAfter);
  if (worktree && worktree.ok) { git.removeWorktree(req.resolved.corePath, worktree.worktreePath); }
  if (!unchanged.unchanged) {
    runStore.failure(dir, { phase: 'INSPECT_CORE', type: 'core-mutated', differences: unchanged.differences });
    line(`  ! WARNING: Core repository changed during inspection: ${unchanged.differences.join('; ')}`);
  } else {
    runStore.event(dir, { phase: 'INSPECT_CORE', type: 'core-verified-unchanged' });
    line('  Core repository verified unchanged after inspection.');
  }

  // 8) Scaffold read-only planning artifacts and record next actions.
  scaffoldPlanningArtifacts(dir, req, clientId, runId, pkgRes, inv, coreInv);
  runStore.updateState(dir, {
    currentPhase: 'PLAN', currentSkill: 'plan-frontend-upgrade', planStatus: 'DRAFT',
    nextAction: 'Complete skills/plan-frontend-upgrade/SKILL.md to map every Core requirement to exact client files, then set plan status to READY.',
    safeResumeInstruction: `Resume planning from runs/${clientId}/${runId}/plan.yaml (read-only). No client mutation until plan is READY.`,
  });
  runStore.checkpoint(dir, 'read-only-pipeline-complete');

  line('');
  line(`Read-only pipeline complete. Run: runs/${clientId}/${runId}/`);
  line(`  doctor:            ${report.status}`);
  line(`  client workspace:  ${inv.semanticGraph.workspaceType} (bootstrap: ${inv.semanticGraph.bootstrapStyle})`);
  line(`  package alignment: ${pkgRes.status} (${pkgRes.alignmentMap.packages.length} packages)`);
  line(`  core requirements: ${coreInv.requirementsScaffold.requirements.length} candidate(s)`);
  line(`  release range:     ${rel.releaseRange.versions.join(', ') || '(none)'}${rel.releaseRange.reusableMigrations.length ? ' + migration: ' + rel.releaseRange.reusableMigrations.join(', ') : ''}`);
  line(`  applicable reqs:   ${rel.applicableRequirements.applicable.length} applicable, ${rel.applicableRequirements.ambiguous.length} need decision/research, ${rel.applicableRequirements.notApplicable.length} not applicable`);
  line(`  missing steps:     ${rel.missingSteps.length}; deployment items: ${rel.deploymentChecklist.length}; release plan ready: ${rel.planReady.ready ? 'yes' : 'no'}`);
  if (rel.appsettings.secretRejections.length) line(`  ! secret rejected: ${rel.appsettings.secretRejections.map((s) => s.id).join(', ')} (use the secret provider; rotate exposed values)`);
  line('');
  line('  Next: complete skills/plan-frontend-upgrade/SKILL.md (read-only). Client mutation is gated until the plan is READY.');

  if (flags.execute) {
    line('');
    line('  --execute requested: the mutation gate is enforced. Execution proceeds only after the plan is READY');
    line('  and every mutation-gate condition passes. Complete planning, then run:');
    line(`    frontend-upgrade-agent run --client ${clientId} --run ${runId}`);
  }
  return 0;
}

function stripInternal(req) {
  const clone = JSON.parse(JSON.stringify(req));
  return clone;
}

function scaffoldPlanningArtifacts(dir, req, clientId, runId, pkgRes, inv, coreInv) {
  if (!core.exists(path.join(dir, 'assumptions.yaml'))) {
    core.writeYaml(path.join(dir, 'assumptions.yaml'), { schemaVersion: 1, assumptions: [] });
  }
  if (!core.exists(path.join(dir, 'uncertainty-register.yaml'))) {
    core.writeYaml(path.join(dir, 'uncertainty-register.yaml'), { schemaVersion: 1, uncertainties: pkgRes.uncertainties || [] });
  }
  if (!core.exists(path.join(dir, 'frontend-requirement-map.yaml'))) {
    core.writeYaml(path.join(dir, 'frontend-requirement-map.yaml'), { schemaVersion: 1, mappings: [] });
  }
  if (!core.exists(path.join(dir, 'frontend-impact-map.yaml'))) {
    core.writeYaml(path.join(dir, 'frontend-impact-map.yaml'), { schemaVersion: 1, impacts: [] });
  }
  if (!core.exists(path.join(dir, 'plan.yaml'))) {
    core.writeYaml(path.join(dir, 'plan.yaml'), {
      schemaVersion: 1, status: 'DRAFT', clientId, runId,
      sourceVersion: req.upgrade.sourceVersion, targetVersion: req.upgrade.targetVersion,
      workspaceClassification: inv.semanticGraph.workspaceType,
      bootstrapStyle: inv.semanticGraph.bootstrapStyle,
      packageAlignmentStatus: pkgRes.status,
      coreRequirementCount: coreInv.requirementsScaffold.requirements.length,
      changes: [],
      nextAction: 'Complete skills/plan-frontend-upgrade/SKILL.md.',
    });
  }
}


module.exports = { startCmd, buildRequestOrDie, printDoctor };

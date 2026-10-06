#!/usr/bin/env node
'use strict';
/*
 * frontend-upgrade-agent — stable developer entry point for the dual-repository
 * front-end Core upgrade workflow.
 *
 * One process inspects BOTH repositories in a single run:
 *   - the client front-end repository (the only mutable repository), and
 *   - the local NGO Core repository (read-only source of truth).
 *
 * Commands: start | doctor | plan | run | resume | status | audit | learn
 */
const fs = require('fs');
const path = require('path');
const core = require('./lib/core');
const request = require('./lib/request');
const doctor = require('./lib/doctor');
const runStore = require('./lib/run');
const engine = require('./lib/engine');

function usage() {
  process.stdout.write([
    'frontend-upgrade-agent — dual-repository Angular/NGO Core front-end upgrade',
    '',
    'usage:',
    '  frontend-upgrade-agent start   --client-path <p> --core-path <p> --source-version <v> --target-version <v> [--execute]',
    '  frontend-upgrade-agent start   --request <file.yaml> [--execute]',
    '  frontend-upgrade-agent doctor  --client-path <p> --core-path <p> --source-version <v> --target-version <v>',
    '  frontend-upgrade-agent plan    --client <id> --run <id>',
    '  frontend-upgrade-agent run     --client <id> --run <id>',
    '  frontend-upgrade-agent resume  --client <id> --run <id>',
    '  frontend-upgrade-agent status  --client <id> --run <id>',
    '  frontend-upgrade-agent audit   --client <id> --run <id>',
    '  frontend-upgrade-agent learn   --client <id> --run <id>',
    '',
    'the client repository is the only mutable repository; Core is inspected read-only.',
    '',
  ].join('\n'));
}

function parseFlags(argv) {
  const f = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      f[key] = next !== undefined && !String(next).startsWith('--') ? argv[++i] : true;
    }
  }
  return f;
}

function line(s) { process.stdout.write(s + '\n'); }
function err(s) { process.stderr.write(s + '\n'); }

// --- doctor (standalone) -----------------------------------------------------
const { buildRequestOrDie, printDoctor } = require('./read-only-analysis');

function doctorCmd(flags) {
  const req = buildRequestOrDie(flags);
  const report = doctor.run(req);
  printDoctor(report);
  return report.status === doctor.STATUS.READY_FOR_INVENTORY || report.status === doctor.STATUS.READY_FOR_PLANNING ? 0 : 1;
}

// --- start (orchestrated read-only pipeline) ---------------------------------
function startCmd(flags) { return require('./executor').inspectRequest(flags).exitCode; }

// --- state-based commands ----------------------------------------------------
function loadRunState(flags) {
  if (!flags.client || !flags.run) { err('specify --client <id> --run <id>'); return null; }
  const dir = runStore.runDirAbs(flags.client, flags.run);
  const st = runStore.readState(dir);
  if (!st) { err(`no run state at runs/${flags.client}/${flags.run}/state.json`); return null; }
  let packet;
  try { packet = require('../../engine/tools/lib/execution').guard(dir, 'frontend', { runId: st.runId, targetVersion: st.targetVersion, clientPath: st.clientPath }); }
  catch (error) { err(`BLOCKED: ${error.message}. Resume the shared run before execution.`); return null; }
  return { dir, st, packet };
}

function statusCmd(flags) {
  const r = loadRunState(flags); if (!r) return 1;
  const { st } = r;
  const g = (k) => (st[k] === undefined || st[k] === null ? '-' : (typeof st[k] === 'object' ? JSON.stringify(st[k]) : st[k]));
  const rows = [
    ['run id', 'runId'], ['client path', 'clientPath'], ['core path', 'corePath'],
    ['source version', 'sourceVersion'], ['target version', 'targetVersion'],
    ['core source commit', 'coreSourceCommit'], ['core target commit', 'coreTargetCommit'],
    ['status', 'status'], ['current phase', 'currentPhase'], ['current skill', 'currentSkill'],
    ['doctor status', 'doctorStatus'], ['package alignment', 'packageAlignmentStatus'],
    ['semantic coverage', 'semanticCoverage'], ['requirement mapping', 'requirementMappingStatus'],
    ['plan status', 'planStatus'], ['audit status', 'auditStatus'],
    ['build status', 'buildStatus'], ['test status', 'testStatus'],
    ['last checkpoint', 'lastCheckpoint'], ['next action', 'nextAction'],
  ];
  line(`frontend-upgrade-agent status - ${st.clientId}/${st.runId}`);
  for (const [label, key] of rows) line(`  ${label.padEnd(20)} ${g(key)}`);
  line(`  assumptions          ${(st.assumptions || []).length}`);
  line(`  blocking uncertainty ${(st.blockingUncertainty || []).length}`);
  line(`  changed files        ${(st.changedFiles || []).length}`);
  const docDone = Object.values(st.documentationStatus || {}).filter(Boolean).length;
  line(`  documentation        ${docDone}/${runStore.REQUIRED_DOC_ITEMS.length}`);
  return 0;
}

function resumeCmd(flags) {
  const r = loadRunState(flags); if (!r) return 1;
  line(`Resume: ${r.st.safeResumeInstruction || r.st.nextAction || 'no resume instruction recorded'}`);
  line(`Next action: ${r.st.nextAction || '-'}`);
  return 0;
}

function planCmd(flags) {
  const r = loadRunState(flags); if (!r) return 1;
  const planPath = path.join(r.dir, 'plan.yaml');
  if (!core.exists(planPath)) { err('no plan.yaml for this run; run `start` first'); return 1; }
  line('plan-frontend-upgrade is read-only. Follow skills/plan-frontend-upgrade/SKILL.md.');
  line('Every planned change must cite exact client files, Core evidence, and validation.');
  line('Client mutation stays gated until plan.yaml status is READY.');
  return 0;
}

function runCmd(flags) {
  const r = loadRunState(flags); if (!r) return 1;
  const { dir, st } = r;
  const planPath = path.join(dir, 'plan.yaml');
  if (!core.exists(planPath)) { err('no plan.yaml; run `start` then complete planning'); return 1; }
  const plan = core.readYamlAbs(planPath);
  const uncReg = core.exists(path.join(dir, 'uncertainty-register.yaml')) ? (core.readYamlAbs(path.join(dir, 'uncertainty-register.yaml')).uncertainties || []) : [];
  const gate = engine.mutationGate({
    planExists: true, planStatus: plan.status,
    policyPermitsAssumptions: (core.loadConfig().agent.allowReadyWithAssumptions === true),
    uncertaintyRegister: uncReg,
    baselineRecorded: st.buildStatus != null || false,
    rollbackCheckpointExists: !!st.lastCheckpoint,
    clientStatusKnown: true,
    coreFingerprintRecorded: core.exists(path.join(dir, 'artifacts', 'core-fingerprint-before.json')),
    requiredCapabilitiesAvailable: true,
    actionInPlan: true,
  });
  line('frontend-upgrade-agent run — mutation gate');
  line(`  plan status: ${plan.status}`);
  if (!gate.permitted) {
    line(`  gate: CLOSED`);
    gate.reasons.forEach((x) => line(`    - ${x}`));
    line('  Client mutation refused. Resolve the above, ensure plan is READY, then re-run.');
    return 1;
  }
  line('  gate: OPEN');
  try {
    if (!r.packet) throw new Error('Execution requires a shared owner; migrate the legacy plan before mutation');
    const shared = r.packet.upgrade.run;
    const result = require('../../engine/tools/lib/coordinator').dispatch(shared.clientId, shared.runId, 'frontend', 'execute');
    line(JSON.stringify(result, null, 2));
  } catch (error) { err(`BLOCKED: ${error.message}`); return 1; }
  line('  Follow skills/execute-frontend-upgrade/SKILL.md. Only the client repository may be modified.');
  line('  Create the client rollback checkpoint first, then apply changes exactly as planned.');
  return 0;
}

function auditCmd(flags) {
  const r = loadRunState(flags); if (!r) return 1;
  line('frontend-upgrade-agent audit — follow skills/audit-frontend-integration/SKILL.md.');
  line('The audit blocks completion when any relevant Core requirement is unmapped, configuration');
  line('authority is unresolved, a required config key is missing, route/module/provider composition');
  line('is unresolved, the production build did not run, or completion-blocking uncertainty remains open.');
  return 0;
}

function learnCmd(flags) {
  const r = loadRunState(flags); if (!r) return 1;
  line('frontend-upgrade-agent learn — follow skills/learn-from-frontend-run/SKILL.md.');
  line('Learning produces CANDIDATES only (memory/candidates/); nothing is auto-approved.');
  return 0;
}

function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const flags = parseFlags(argv.slice(1));
  switch (cmd) {
    case 'start': process.exit(startCmd(flags));
    case 'doctor': process.exit(doctorCmd(flags));
    case 'plan': process.exit(planCmd(flags));
    case 'run': process.exit(runCmd(flags));
    case 'resume': process.exit(resumeCmd(flags));
    case 'status': process.exit(statusCmd(flags));
    case 'audit': process.exit(auditCmd(flags));
    case 'learn': process.exit(learnCmd(flags));
    case '-h': case '--help': case 'help': usage(); process.exit(0);
    default: usage(); process.exit(2);
  }
}
main();

#!/usr/bin/env node
'use strict';
/* upgrade-agent CLI. Stable entry point for tools + skill operations. */
const fs = require('fs');
const bootstrap = require('./bootstrap/lib/bootstrap');
const core = require('./bootstrap/lib/core');
const engine = require('./skills/lib/engine');

function usage() {
  process.stdout.write([
    'usage: upgrade-agent <command> [--client <id>] [--run <id>]',
    '',
    'developer commands:',
    '  doctor    check prerequisites; report READY_FOR_PLANNING (optional tools may be absent)',
    '  plan      scaffold a run and run plan-upgrade (read-only)',
    '  research  run research-version for approved uncertainty (isolated, no client change)',
    '  run       require a ready plan and run execution skills (mutation gate enforced)',
    '  resume    resume from the exact valid checkpoint',
    '  status    show phase, skill, uncertainty, capabilities, checkpoint, next action',
    '  learn     run learn-from-run after completion or terminal blockage',
    '',
    '  tools <bootstrap|check|install-missing|validate|manifest|doctor>',
    '',
  ].join('\n'));
}

function parseFlags(argv) {
  const f = {};
  for (let i = 0; i < argv.length; i++) { if (argv[i].startsWith('--')) { f[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; } }
  return f;
}
const runDirRel = (client, run) => `runs/${client}/${run}`;
const nowCompact = () => engine.nowIso().replace(/[:.]/g, '-');

function availableCapabilities() {
  const p = core.P('runs', bootstrap.BOOTSTRAP_CLIENT, 'tool-manifest.json');
  const caps = new Set(['read-repository', 'search-repository', 'inspect-configuration', 'inspect-approved-knowledge', 'create-plan', 'create-uncertainty-records', 'validate-json-schema']);
  if (fs.existsSync(p)) {
    const m = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const t of m.tools) if (t.status === 'AVAILABLE') for (const cap of (t.capabilities || [])) caps.add(cap);
  }
  return [...caps];
}

function doctor() {
  bootstrap.run('doctor'); // refresh env manifest (no install, no client change)
  const evidence = core.gatherEvidence();
  const available = availableCapabilities();
  const readiness = engine.planningReadiness(evidence, available);
  const line = (s) => process.stdout.write(s + '\n');
  line('upgrade-agent doctor');
  line('  required prerequisites (per detected technology):');
  line(`    git .................. ${available.includes('repository-version-control') ? 'available' : 'MISSING'}`);
  if (evidence.domainDotnet) line(`    .NET SDK ............. ${available.includes('build-dotnet') ? 'available' : 'MISSING'}`);
  if (evidence.frontendPresent) line(`    npm .................. ${available.includes('acquire-npm-package') ? 'available' : 'MISSING'}`);
  line('  optional capabilities (Level 2/3, lazily activated — absence does not block planning):');
  line('    compare-dotnet-public-api, selectively-decompile-dotnet, typecheck-typescript, inspect-angular-workspace');
  line(`  planning readiness: ${readiness.status}`);
  if (readiness.missingPrerequisites.length) line(`  missing prerequisites: ${readiness.missingPrerequisites.join(', ')}`);
  return readiness.status === 'READY_FOR_PLANNING' ? 0 : 1;
}

function ensureRun(flags) {
  const client = flags.client || '_unspecified-client';
  const run = flags.run || `${client}-${nowCompact()}`;
  const rel = runDirRel(client, run);
  fs.mkdirSync(core.P(rel, 'checkpoints'), { recursive: true });
  fs.mkdirSync(core.P(rel, 'artifacts'), { recursive: true });
  return { client, run, rel };
}

function scaffoldIfMissing(rel, name, content) {
  const p = core.P(rel, name);
  if (!fs.existsSync(p)) fs.writeFileSync(p, content);
}

function plan(flags) {
  const { client, run, rel } = ensureRun(flags);
  scaffoldIfMissing(rel, 'plan.yaml', `schemaVersion: 1\nstatus: DRAFT\nclientId: ${client}\nrunId: ${run}\nobjective: null\nsourceVersion: null\ntargetVersion: null\nrequiredCapabilities: []\ndeferredCapabilities: []\nnextAction: "Run skills/plan-upgrade/SKILL.md to complete the plan."\n`);
  scaffoldIfMissing(rel, 'uncertainty-register.yaml', 'schemaVersion: 1\nuncertainties: []\n');
  scaffoldIfMissing(rel, 'assumptions.yaml', 'schemaVersion: 1\nassumptions: []\n');
  scaffoldIfMissing(rel, 'state.json', JSON.stringify({ schemaVersion: 1, runId: run, clientId: client, status: 'PLAN', currentPhase: 'PLAN', currentSkill: 'plan-upgrade', nextAction: 'Execute skills/plan-upgrade/SKILL.md (read-only).', safeResumeInstruction: 'Resume planning from plan.yaml.', updatedAt: engine.nowIso() }, null, 2) + '\n');
  engine.recordInvocation(rel, { skillId: 'plan-upgrade', reason: 'planning requested via CLI', workflowPhase: 'PLAN', result: 'SCAFFOLDED', nextAction: 'Complete skills/plan-upgrade/SKILL.md' });
  process.stdout.write(`Scaffolded ${rel}/ (read-only planning). Next: run skills/plan-upgrade/SKILL.md.\nplan-upgrade is read-only; client mutation is impossible until the plan is READY.\n`);
  return 0;
}

function readState(flags) {
  if (!flags.client || !flags.run) { process.stderr.write('specify --client <id> --run <id>\n'); return null; }
  const p = core.P(runDirRel(flags.client, flags.run), 'state.json');
  if (!fs.existsSync(p)) { process.stderr.write(`no run state at ${p}\n`); return null; }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function status(flags) {
  const st = readState(flags); if (!st) return 1;
  const g = (k) => (st[k] === undefined ? '-' : (typeof st[k] === 'object' ? JSON.stringify(st[k]) : st[k]));
  ['status', 'currentPhase', 'currentSkill', 'nextAction', 'safeResumeInstruction', 'lastCheckpoint'].forEach((k) => process.stdout.write(`  ${k}: ${g(k)}\n`));
  return 0;
}

function resume(flags) {
  const st = readState(flags); if (!st) return 1;
  process.stdout.write(`Resume: ${st.safeResumeInstruction || st.nextAction || 'no resume instruction recorded'}\nNext action: ${st.nextAction || '-'}\n`);
  return 0;
}

function needPlan(flags, label) {
  if (!flags.client || !flags.run) { process.stderr.write('specify --client <id> --run <id>\n'); return 1; }
  const planPath = core.P(runDirRel(flags.client, flags.run), 'plan.yaml');
  if (!fs.existsSync(planPath)) { process.stderr.write(`no plan for this run; run: upgrade-agent plan --client ${flags.client} --run ${flags.run}\n`); return 1; }
  process.stdout.write(`${label}: a plan exists. Follow the corresponding SKILL.md. Client mutation stays gated by the mutation gate until the plan is READY.\n`);
  return 0;
}

function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const flags = parseFlags(argv.slice(1));
  switch (cmd) {
    case 'doctor': process.exit(doctor());
    case 'plan': process.exit(plan(flags));
    case 'research': process.exit(needPlan(flags, 'research'));
    case 'run': process.exit(needPlan(flags, 'run'));
    case 'status': process.exit(status(flags));
    case 'resume': process.exit(resume(flags));
    case 'learn': process.exit(needPlan(flags, 'learn'));
    case 'tools': {
      const sub = argv[1];
      if (sub === 'bootstrap' || sub === 'install-missing') { const o = bootstrap.run('bootstrap'); bootstrap.summarize(o); process.exit(o.result.exitCode); }
      if (sub === 'check' || sub === 'validate') { const o = bootstrap.run('check'); bootstrap.summarize(o); process.exit(o.result.exitCode); }
      if (sub === 'doctor') { const o = bootstrap.run('doctor'); bootstrap.summarize(o); process.exit(o.result.exitCode); }
      if (sub === 'manifest') {
        const p = core.P('runs', bootstrap.BOOTSTRAP_CLIENT, 'tool-manifest.json');
        if (!fs.existsSync(p)) { process.stderr.write('no manifest yet; run: upgrade-agent tools bootstrap\n'); process.exit(1); }
        process.stdout.write(fs.readFileSync(p, 'utf8') + '\n'); process.exit(0);
      }
      usage(); process.exit(2); break;
    }
    default: usage(); process.exit(2);
  }
}
main();

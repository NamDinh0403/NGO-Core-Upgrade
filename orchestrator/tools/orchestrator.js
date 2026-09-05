#!/usr/bin/env node
'use strict';
/*
 * orchestrator CLI — owns exactly one shared run per client engagement.
 * Subcommands: create-run | compose-results | verify-coverage |
 * prepare-handover | final-report | status.
 *
 * Never mutates a client repository and never writes into backend/runs/ or
 * frontend/runs/ — those remain each track's own (see
 * docs/refactor/unified-agent-decisions.md, DEC-1).
 *
 * Usage:
 *   node orchestrator.js create-run --client <id> --tracks backend,frontend
 *       --core-path <path> [--release-notes <path>] [--source-version <v>]
 *       --target-version <v> [--feature-decisions <path>]
 *   node orchestrator.js compose-results --run <client>/<runId>
 *       [--backend-run <backend/runs/.../run-id dir>] [--frontend-run <frontend/runs/.../run-id dir>]
 *   node orchestrator.js verify-coverage --run <client>/<runId>
 *   node orchestrator.js prepare-handover --run <client>/<runId>
 *   node orchestrator.js final-report --run <client>/<runId>
 *   node orchestrator.js status --run <client>/<runId>
 */
const fs = require('fs');
const path = require('path');
const yaml = require('./lib/yaml');
const runLib = require('./lib/run');
const requirementsLib = require('./lib/requirements');
const coverageLib = require('./lib/coverage');
const handoverLib = require('./lib/handover');

const MODULE_ROOT = path.resolve(__dirname, '..'); // orchestrator/
const REPO_ROOT = path.resolve(MODULE_ROOT, '..');
const INGEST_ROOT = path.join(REPO_ROOT, 'ingest');
const TEMPLATES_DIR = path.join(MODULE_ROOT, 'templates');

function parseFlags(argv) {
  const f = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) f[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return f;
}

function splitRunFlag(runFlag) {
  const idx = runFlag.lastIndexOf('/');
  if (idx === -1) throw new Error(`--run must be "<clientId>/<runId>", got: ${runFlag}`);
  return { clientId: runFlag.slice(0, idx), runId: runFlag.slice(idx + 1) };
}

function loadState(base) { return runLib.readJson(path.join(base, 'state.json')); }
function saveState(base, state) {
  state.updatedAt = new Date().toISOString();
  runLib.writeJson(path.join(base, 'state.json'), state);
}

// Reuse the shared candidate record the same way each track's own
// ingest-core-release skill already does: reuse if fresh, else invoke the
// shared tool once. Never re-implements ingest's own git-diff/notes logic.
function ensureIngested({ corePath, releaseNotesPath, targetVersion, ingestRoot }) {
  ingestRoot = ingestRoot || INGEST_ROOT;
  const candidatePath = path.join(ingestRoot, 'knowledge', 'candidates', 'releases', `${targetVersion}.json`);
  if (fs.existsSync(candidatePath)) {
    return { reused: true, path: candidatePath };
  }
  // eslint-disable-next-line global-require
  const ingest = require(path.join(ingestRoot, 'tools', 'ingest.js'));
  const code = ingest.cmdIngest({
    'core-path': corePath,
    'release-notes': releaseNotesPath,
    target: targetVersion,
    out: path.join(ingestRoot, 'knowledge', 'candidates', 'releases')
  });
  if (code !== 0) return { reused: false, path: null, failed: true };
  return { reused: false, path: fs.existsSync(candidatePath) ? candidatePath : null };
}

function cmdCreateRun(flags) {
  const clientId = flags.client;
  if (!clientId) { process.stderr.write('specify --client <id>\n'); return 2; }
  const tracks = String(flags.tracks || 'backend,frontend').split(',').map((t) => t.trim()).filter(Boolean);
  const targetVersion = flags['target-version'];
  if (!targetVersion) { process.stderr.write('specify --target-version <x.y.z>\n'); return 2; }
  const corePath = flags['core-path'];
  // Test seam only — production callers never set this; defaults to the
  // real sibling ingest/ module.
  const ingestRoot = flags['ingest-root'] || INGEST_ROOT;

  const runId = runLib.newRunId(clientId);
  const base = runLib.ensureRunLayout(clientId, runId);

  const request = {
    schemaVersion: 1, clientId, tracks,
    backendClientPath: flags['backend-client-path'] || null,
    frontendClientPath: flags['frontend-client-path'] || null,
    corePath: corePath || null,
    releaseNotesPath: flags['release-notes'] || null,
    sourceVersion: flags['source-version'] || null,
    targetVersion,
    featureDecisionsPath: flags['feature-decisions'] || null
  };
  fs.writeFileSync(path.join(base, 'request.yaml'), yaml.stringify(request));

  let ingestResult = { reused: false, path: null };
  if (corePath) {
    ingestResult = ensureIngested({ corePath, releaseNotesPath: request.releaseNotesPath, targetVersion, ingestRoot });
  }

  const split = requirementsLib.splitRequirements({
    ingestRoot, version: targetVersion,
    featureDecisionsPath: request.featureDecisionsPath, runId
  });
  requirementsLib.writeRequirements(path.join(base, 'requirements'), split);

  const state = {
    schemaVersion: 1, runId, clientId, tracks,
    sourceVersion: request.sourceVersion, targetVersion,
    status: 'REQUIREMENTS_READY',
    trackStatus: { backend: null, frontend: null },
    backendRunRef: null, frontendRunRef: null,
    ingestCandidateRef: ingestResult.path,
    nextAction: `Delegate to ${tracks.join(' and ')}, passing run-id ${runId} and requirements/{${tracks.join(',')}}.yaml as an additional seed. Then run: orchestrator.js compose-results --run ${clientId}/${runId}`,
    startedAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  saveState(base, state);

  process.stdout.write(JSON.stringify({
    runId, runDir: base,
    requirementsDir: path.join(base, 'requirements'),
    ingestCandidateRef: ingestResult.path,
    ingestReused: ingestResult.reused,
    nextAction: state.nextAction
  }, null, 2) + '\n');
  return 0;
}

function cmdComposeResults(flags) {
  const { clientId, runId } = splitRunFlag(flags.run);
  const base = runLib.runDir(clientId, runId);
  const state = loadState(base);
  if (!state) { process.stderr.write(`no shared run found at ${base}\n`); return 1; }

  if (flags['backend-run']) {
    const backendState = runLib.readJson(path.join(flags['backend-run'], 'state.json'));
    if (!backendState) { process.stderr.write(`no state.json under --backend-run ${flags['backend-run']}\n`); return 1; }
    fs.writeFileSync(path.join(base, 'results', 'backend-result.yaml'), yaml.stringify(backendState));
    state.backendRunRef = flags['backend-run'];
    state.trackStatus.backend = backendState.status || null;
  }
  if (flags['frontend-run']) {
    const frontendState = runLib.readJson(path.join(flags['frontend-run'], 'state.json'));
    if (!frontendState) { process.stderr.write(`no state.json under --frontend-run ${flags['frontend-run']}\n`); return 1; }
    fs.writeFileSync(path.join(base, 'results', 'frontend-result.yaml'), yaml.stringify(frontendState));
    state.frontendRunRef = flags['frontend-run'];
    state.trackStatus.frontend = frontendState.status || null;
  }

  state.status = 'RESULTS_COMPOSED';
  state.nextAction = `orchestrator.js verify-coverage --run ${clientId}/${runId}`;
  saveState(base, state);
  process.stdout.write(JSON.stringify({ runId, trackStatus: state.trackStatus, nextAction: state.nextAction }, null, 2) + '\n');
  return 0;
}

function cmdVerifyCoverage(flags) {
  const { clientId, runId } = splitRunFlag(flags.run);
  const base = runLib.runDir(clientId, runId);
  const state = loadState(base);
  if (!state) { process.stderr.write(`no shared run found at ${base}\n`); return 1; }

  const backendState = state.backendRunRef ? runLib.readJson(path.join(state.backendRunRef, 'state.json')) : null;
  const { coverage, missingSteps } = coverageLib.verifyCoverage({
    runId, frontendRunDir: state.frontendRunRef, backendState
  });

  fs.writeFileSync(path.join(base, 'requirement-coverage.yaml'), yaml.stringify(coverage));
  fs.writeFileSync(path.join(base, 'missing-steps.yaml'), yaml.stringify(missingSteps));

  state.status = 'COVERAGE_VERIFIED';
  state.nextAction = missingSteps.items.length > 0
    ? `${missingSteps.items.length} outstanding item(s) in missing-steps.yaml — resolve or assign an owner before prepare-handover/final-report.`
    : `orchestrator.js prepare-handover --run ${clientId}/${runId}`;
  saveState(base, state);
  process.stdout.write(JSON.stringify({ runId, summary: coverage.summary, outstanding: missingSteps.items.length, nextAction: state.nextAction }, null, 2) + '\n');
  return 0;
}

function cmdPrepareHandover(flags) {
  const { clientId, runId } = splitRunFlag(flags.run);
  const base = runLib.runDir(clientId, runId);
  const state = loadState(base);
  if (!state) { process.stderr.write(`no shared run found at ${base}\n`); return 1; }
  if (state.status !== 'COVERAGE_VERIFIED' && state.status !== 'HANDOVER_READY') {
    process.stderr.write(`prepare-handover requires verify-coverage to have run first (current status: ${state.status})\n`);
    return 1;
  }

  const backendState = state.backendRunRef ? runLib.readJson(path.join(state.backendRunRef, 'state.json')) : null;
  const { checklist, beforeMd, afterMd } = handoverLib.prepareHandover({
    runId, clientId, sourceVersion: state.sourceVersion, targetVersion: state.targetVersion,
    frontendRunDir: state.frontendRunRef, backendState,
    backendRunRef: state.backendRunRef, frontendRunRef: state.frontendRunRef,
    templatesDir: TEMPLATES_DIR
  });

  fs.writeFileSync(path.join(base, 'deployment-checklist.yaml'), yaml.stringify(checklist));
  fs.writeFileSync(path.join(base, 'before-deployment.md'), beforeMd);
  fs.writeFileSync(path.join(base, 'after-deployment.md'), afterMd);

  state.status = 'HANDOVER_READY';
  state.nextAction = `orchestrator.js final-report --run ${clientId}/${runId}`;
  saveState(base, state);
  process.stdout.write(JSON.stringify({ runId, items: checklist.items.length, nextAction: state.nextAction }, null, 2) + '\n');
  return 0;
}

function cmdFinalReport(flags) {
  const { clientId, runId } = splitRunFlag(flags.run);
  const base = runLib.runDir(clientId, runId);
  const state = loadState(base);
  if (!state) { process.stderr.write(`no shared run found at ${base}\n`); return 1; }

  const coverage = fs.existsSync(path.join(base, 'requirement-coverage.yaml'))
    ? yaml.parse(fs.readFileSync(path.join(base, 'requirement-coverage.yaml'), 'utf8')) : null;
  const checklist = fs.existsSync(path.join(base, 'deployment-checklist.yaml'))
    ? yaml.parse(fs.readFileSync(path.join(base, 'deployment-checklist.yaml'), 'utf8')) : null;

  const trackStatusLines = state.tracks.map((t) => `- ${t}: ${state.trackStatus[t] || 'NOT_RUN'} (run ref: ${t === 'backend' ? state.backendRunRef : state.frontendRunRef || 'n/a'})`).join('\n');
  const coverageSummaryLine = coverage
    ? `${coverage.summary.verifiedOrNotApplicable}/${coverage.summary.total} requirements verified or not-applicable-with-evidence; ${coverage.summary.outstanding} outstanding.`
    : 'verify-coverage has not run yet.';
  const handoverSummaryLine = checklist
    ? `${checklist.items.length} deployment item(s) in deployment-checklist.yaml.`
    : 'prepare-handover has not run yet.';
  const allClear = coverage && coverage.summary.outstanding === 0 && checklist;
  const nextAction = allClear
    ? 'All requirements verified or not-applicable-with-evidence and a deployment handover exists. Run is COMPLETE.'
    : 'Resolve outstanding items in missing-steps.yaml, then re-run verify-coverage and prepare-handover before declaring COMPLETE.';

  const tpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'final-report.template.md'), 'utf8');
  const fill = (s, vars) => Object.keys(vars).reduce((acc, k) => acc.split(`{{${k}}}`).join(vars[k]), s);
  const report = fill(tpl, {
    clientId, sourceVersion: state.sourceVersion || 'unknown', targetVersion: state.targetVersion, runId,
    trackStatusLines, coverageSummaryLine, handoverSummaryLine, nextAction
  });
  fs.writeFileSync(path.join(base, 'final-report.md'), report);

  state.status = allClear ? 'COMPLETE' : 'BLOCKED';
  state.nextAction = nextAction;
  saveState(base, state);
  process.stdout.write(JSON.stringify({ runId, status: state.status, nextAction }, null, 2) + '\n');
  return 0;
}

function cmdStatus(flags) {
  const { clientId, runId } = splitRunFlag(flags.run);
  const base = runLib.runDir(clientId, runId);
  const state = loadState(base);
  if (!state) { process.stderr.write(`no shared run found at ${base}\n`); return 1; }
  process.stdout.write(JSON.stringify(state, null, 2) + '\n');
  return 0;
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const flags = parseFlags(rest);
  const commands = {
    'create-run': cmdCreateRun,
    'compose-results': cmdComposeResults,
    'verify-coverage': cmdVerifyCoverage,
    'prepare-handover': cmdPrepareHandover,
    'final-report': cmdFinalReport,
    status: cmdStatus
  };
  if (!commands[cmd]) {
    process.stderr.write(`unknown command: ${cmd}\nUsage: node orchestrator.js <create-run|compose-results|verify-coverage|prepare-handover|final-report|status> [--flags]\n`);
    process.exit(2);
  }
  process.exit(commands[cmd](flags));
}

if (require.main === module) main();
module.exports = { cmdCreateRun, cmdComposeResults, cmdVerifyCoverage, cmdPrepareHandover, cmdFinalReport, cmdStatus, ensureIngested, parseFlags, splitRunFlag };

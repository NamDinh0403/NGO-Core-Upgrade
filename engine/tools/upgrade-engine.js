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
const crypto = require('crypto');
const yaml = require('./lib/yaml');
const runLib = require('./lib/run');
const requirementsLib = require('./lib/requirements');
const coverageLib = require('./lib/coverage');
const handoverLib = require('./lib/handover');
const contextLib = require('./lib/context');
const lifecycle = require('./lib/lifecycle');

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
  state.lifecyclePhase = require('./lib/lifecycle').phase(state);
  runLib.writeJson(path.join(base, 'state.json'), state);
}

// Reuse the shared candidate record the same way each track's own
// ingest-core-release skill already does: reuse if fresh, else invoke the
// shared tool once. Never re-implements ingest's own git-diff/notes logic.
function ensureIngested({ corePath, releaseNotesPath, sourceVersion, targetVersion, ingestRoot }) {
  return contextLib.ensureCoreChangeSet({ corePath, releaseNotesPath, sourceVersion, targetVersion, ingestRoot });
}

function cmdCreateRun(flags) {
  const clientId = flags.client;
  if (!clientId) { process.stderr.write('specify --client <id>\n'); return 2; }
  const tracks = String(flags.tracks || 'backend,frontend').split(',').map((t) => t.trim()).filter(Boolean);
  if (!tracks.length || tracks.some((track) => !['backend', 'frontend'].includes(track)) || new Set(tracks).size !== tracks.length) return 2;
  const rawTarget = String(flags['target-version'] || '');
  const targetVersion = /^\d+\.\d+$/.test(rawTarget) ? `${rawTarget}.0` : rawTarget;
  if (!targetVersion) { process.stderr.write('specify --target-version <x.y.z>\n'); return 2; }
  const corePath = flags['core-path'];
  // Test seam only — production callers never set this; defaults to the
  // real sibling ingest/ module.
  const ingestRoot = flags['ingest-root'] || INGEST_ROOT;

  const runId = flags['run-id'] || runLib.newRunId(clientId);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(runId) || runId === '..') { process.stderr.write('Invalid run id.\n'); return 2; }
  const previous = loadState(runLib.runDir(clientId, runId));
  if (previous) {
    const original = yaml.parse(fs.readFileSync(path.join(runLib.runDir(clientId, runId), 'request.yaml'), 'utf8'));
    const paths = { 'core-path': 'corePath', 'release-notes': 'releaseNotesPath', 'feature-decisions': 'featureDecisionsPath', 'backend-client-path': 'backendClientPath', 'frontend-client-path': 'frontendClientPath' };
    for (const flag of Object.keys(paths)) {
      if (flags[flag] && (!original[paths[flag]] || !contextLib.samePath(flags[flag], original[paths[flag]]))) {
        process.stderr.write(`Existing shared run has a different ${flag}; create a new run.\n`);
        return 1;
      }
    }
    if (previous.targetVersion !== targetVersion || contextLib.normalizeVersion(previous.sourceVersion) !== contextLib.normalizeVersion(String(flags['source-version'] || '')) || tracks.some((track) => !previous.tracks.includes(track))) {
      process.stderr.write('Existing shared run has different inputs; create a new run instead of overwriting evidence.\n');
      return 1;
    }
    for (const track of tracks) if (cmdContext({ run: `${clientId}/${runId}`, track }) !== 0) return 1;
    return 0;
  }
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

  const progress = lifecycle.initialize({ runId, clientId, tracks, status: 'CREATED' });
  lifecycle.advance(progress, 'CORE_ANALYSIS');

  let ingestResult = { reused: false, path: null, entries: [], failed: true, error: 'Core path is required to verify release evidence' };
  if (corePath && request.sourceVersion) {
    ingestResult = ensureIngested({ corePath, releaseNotesPath: request.releaseNotesPath,
      sourceVersion: request.sourceVersion, targetVersion, ingestRoot });
  }
  if (!request.sourceVersion) ingestResult = { reused: false, path: null, entries: [], failed: true, error: 'source version is required; discover it from client metadata before create-run' };

  const split = requirementsLib.splitRequirements({
    ingestRoot, version: targetVersion, records: ingestResult.entries,
    featureDecisionsPath: request.featureDecisionsPath, runId
  });
  if (!ingestResult.failed) lifecycle.advance(progress, 'IMPACT_ANALYSIS');
  let contexts = {};
  try {
    if (!ingestResult.failed) requirementsLib.appendCanonical(split, request.sourceVersion, targetVersion);
    requirementsLib.writeRequirements(path.join(base, 'requirements'), split);
    if (!ingestResult.failed) contexts = contextLib.persistContexts(base, request, runId, ingestResult.changeSet, split);
  } catch (error) { ingestResult.failed = true; ingestResult.error = `Context preparation failed: ${error.message}`; }
  if (!ingestResult.failed) lifecycle.advance(progress, 'PLAN');

  const state = {
    schemaVersion: 1, runId, clientId, tracks,
    sourceVersion: request.sourceVersion, targetVersion,
    status: ingestResult.failed ? 'BLOCKED' : 'REQUIREMENTS_READY',
    trackStatus: { backend: null, frontend: null },
    backendRunRef: null, frontendRunRef: null,
    ingestCandidateRef: ingestResult.path,
    ingestCandidateRefs: ingestResult.entries.map((entry) => entry.path),
    ingestEvidenceHash: releaseSnapshot(ingestResult.entries),
    ...contexts,
    contextEvidenceHash: ingestResult.failed ? null : fileSnapshot(contextLib.contextFiles(contexts)),
    contextRequired: true,
    executionContract: 'ENGINE',
    executorStatus: Object.fromEntries(tracks.map((track) => [track, 'READY'])),
    lifecyclePhase: progress.lifecyclePhase, lifecycleHistory: progress.lifecycleHistory,
    nextAction: ingestResult.failed
      ? `Ingestion blocked: ${ingestResult.error}. Correct Core path/release boundaries and rerun create-run; do not delegate this run.`
      : `Delegate to ${tracks.join(' and ')}, passing run-id ${runId} and contexts/<track>.json. Consume the context; do not ingest again. Then run: orchestrator.js compose-results --run ${clientId}/${runId}`,
    startedAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  state.safeResumeInstruction = state.nextAction;
  saveState(base, state);

  process.stdout.write(JSON.stringify({
    runId, runDir: base, lifecyclePhase: state.lifecyclePhase,
    requirementsDir: path.join(base, 'requirements'),
    ingestCandidateRef: ingestResult.path,
    ingestReused: ingestResult.reused,
    trackContextRefs: state.trackContextRefs || {},
    nextAction: state.nextAction
  }, null, 2) + '\n');
  return ingestResult.failed ? 1 : 0;
}

function releaseSnapshot(entries) {
  if (!entries.length) return null;
  const hash = crypto.createHash('sha256');
  for (const entry of entries) hash.update(entry.path).update('\0').update(JSON.stringify(entry.record));
  return hash.digest('hex');
}

function fileSnapshot(files) {
  if (!files.length) return null;
  try {
    return contextLib.snapshot(files);
  } catch (_) { return null; }
}

function coverageSnapshot(base, state) {
  const files = [path.join(base, 'requirements', 'all.yaml'), path.join(base, 'requirement-coverage.yaml'), path.join(base, 'missing-steps.yaml')];
  files.push(...contextLib.contextFiles(state));
  for (const track of state.tracks) {
    const reference = state[`${track}RunRef`];
    if (!reference) return null;
    files.push(path.join(reference, 'state.json'), path.join(base, 'requirements', `${track}.yaml`));
    if (track === 'frontend') files.push(path.join(reference, 'requirement-coverage.yaml'));
    const disposition = path.join(reference, 'release-finding-dispositions.yaml');
    if (fs.existsSync(disposition)) files.push(disposition);
    for (const artifact of ['deployment-checklist.yaml', 'before-deployment.md', 'after-deployment.md']) {
      const file = path.join(reference, artifact);
      if (fs.existsSync(file)) files.push(file);
    }
  }
  return fileSnapshot(files);
}

function seedIssues(base, state) {
  const issues = [];
  for (const track of state.tracks) {
    let seed;
    try {
      seed = yaml.parse(fs.readFileSync(path.join(base, 'requirements', `${track}.yaml`), 'utf8'));
      if (!seed || !Array.isArray(seed.requirements)) throw new Error('invalid seed');
    } catch (_) { issues.push(`${track}: missing or invalid release seed; recreate requirements before coverage`); continue; }
    const reference = state[`${track}RunRef`];
    const file = reference && path.join(reference, 'release-finding-dispositions.yaml');
    let entries = [];
    try {
      if (file && fs.existsSync(file)) {
        entries = yaml.parse(fs.readFileSync(file, 'utf8')).findings;
        if (!Array.isArray(entries)) throw new Error('invalid dispositions');
      }
    } catch (_) { issues.push(`${track}: invalid release-finding-dispositions.yaml; provide structured findings`); continue; }
    const coverageFile = reference && path.join(reference, 'requirement-coverage.yaml');
    let coverage = [];
    try {
      if (coverageFile && fs.existsSync(coverageFile)) {
        coverage = yaml.parse(fs.readFileSync(coverageFile, 'utf8')).requirements;
        if (!Array.isArray(coverage)) throw new Error('invalid coverage');
      }
    } catch (_) { issues.push(`${track}: invalid requirement-coverage.yaml; provide structured requirements`); continue; }
    for (const finding of seed.requirements || []) {
      const disposition = entries.find((entry) => entry.id === finding.id);
      const linked = coverage.some((entry) => Array.isArray(entry.sourceCandidateIds) && entry.sourceCandidateIds.includes(finding.id) && ['VERIFIED', 'NOT_APPLICABLE_WITH_EVIDENCE'].includes(entry.status) && typeof entry.evidence === 'string' && entry.evidence.trim());
      if (!linked && !(disposition && ['VERIFIED', 'NOT_APPLICABLE_WITH_EVIDENCE'].includes(disposition.status) && typeof disposition.evidence === 'string' && disposition.evidence.trim())) {
        issues.push(`${track}: disposition ${finding.id} in release-finding-dispositions.yaml with verification/not-applicable evidence; a filename hint is not automatically applicable`);
      }
    }
  }
  return issues;
}

function requestedTrackIssues(state, successfulOnly) {
  const issues = [];
  if ((state.executionContract === 'ENGINE' || state.executorPlans) && (successfulOnly || state.tracks.every((track) => state.executorStatus[track] === 'PASSED'))) {
    try { issues.push(...require('./lib/coordinator').verifyEvidence(state)); }
    catch (error) { issues.push(`Engine validation evidence unavailable: ${error.message}`); }
  }
  if (state.contextRequired && !state.coreChangeSetRef) issues.push('shared context preparation did not succeed; recreate the shared run before delegation');
  if (state.coreChangeSetRef) {
    try {
      if (fileSnapshot(contextLib.contextFiles(state)) !== state.contextEvidenceHash) throw new Error('shared context evidence changed');
      for (const track of state.tracks) contextLib.consumeTrackContext(state.trackContextRefs[track], track, { targetVersion: state.targetVersion, runId: state.runId });
    } catch (error) { issues.push(`${error.message}; revalidate shared context before delegation/coverage`); }
  }
  if (!state.ingestCandidateRef) issues.push('release evidence was not verified; correct ingestion and recreate the shared run');
  let currentIngest = null;
  try {
    const files = state.ingestCandidateRefs || (state.ingestCandidateRef ? [state.ingestCandidateRef] : []);
    currentIngest = releaseSnapshot(files.map((file) => ({ path: file, record: JSON.parse(fs.readFileSync(file, 'utf8')) })));
  } catch (_) { currentIngest = null; }
  if (!state.ingestEvidenceHash || currentIngest !== state.ingestEvidenceHash) issues.push('release evidence is missing or changed; revalidate ingestion before coverage');
  for (const track of state.tracks) {
    const reference = state[`${track}RunRef`];
    const result = reference && runLib.readJson(path.join(reference, 'state.json'));
    const success = result && ['COMPLETE', 'SUCCEEDED', 'PASSED'].includes(result.status);
    const terminal = success || (result && /^(BLOCKED|FAILED|CANCELLED)/.test(result.status || ''));
    if (!terminal || (successfulOnly && !success)) issues.push(`${track}: ${result ? result.status : 'NOT_RUN'}; ${result && (result.safeResumeInstruction || result.resumeCommand || result.nextAction) || 'compose the requested terminal track result'}`);
    else if (result.targetVersion && result.targetVersion !== state.targetVersion) issues.push(`${track}: target version does not match shared run`);
    else if (track === 'backend' && successfulOnly && result.status !== 'PASSED' && result.currentPhase && !['HANDOVER', 'COMPLETE'].includes(result.currentPhase)) issues.push('backend: workflow has not reached handover');
    if (success && track === 'frontend' && !fs.existsSync(path.join(reference, 'requirement-coverage.yaml'))) issues.push('frontend: structured coverage evidence is missing');
  }
  return issues;
}

function cmdComposeResults(flags) {
  const { clientId, runId } = splitRunFlag(flags.run);
  const base = runLib.runDir(clientId, runId);
  const state = loadState(base);
  if (!state) { process.stderr.write(`no shared run found at ${base}\n`); return 1; }

  if (state.executionContract === 'ENGINE') {
    for (const track of state.tracks) {
      const supplied = flags[`${track}-run`];
      const expected = path.join(base, 'results', track);
      if (supplied && !contextLib.samePath(supplied, expected)) { process.stderr.write('New engine runs cannot compose unrelated historical executor results.\n'); return 1; }
    }
  }
  if (flags['backend-run']) {
    const backendState = runLib.readJson(path.join(flags['backend-run'], 'state.json'));
    if (!backendState) { process.stderr.write(`no state.json under --backend-run ${flags['backend-run']}\n`); return 1; }
    fs.writeFileSync(path.join(base, 'results', 'backend-result.yaml'), yaml.stringify(backendState));
    state.backendRunRef = flags['backend-run'];
    state.trackStatus.backend = backendState.status || null;
    if (state.executorStatus && state.executionContract !== 'ENGINE' && !state.executorPlans) state.executorStatus.backend = contextLib.trackStatus(backendState);
  }
  if (flags['frontend-run']) {
    const frontendState = runLib.readJson(path.join(flags['frontend-run'], 'state.json'));
    if (!frontendState) { process.stderr.write(`no state.json under --frontend-run ${flags['frontend-run']}\n`); return 1; }
    fs.writeFileSync(path.join(base, 'results', 'frontend-result.yaml'), yaml.stringify(frontendState));
    state.frontendRunRef = flags['frontend-run'];
    state.trackStatus.frontend = frontendState.status || null;
    if (state.executorStatus && state.executionContract !== 'ENGINE' && !state.executorPlans) state.executorStatus.frontend = contextLib.trackStatus(frontendState);
  }

  state.status = 'RESULTS_COMPOSED';
  if (state.lifecycleHistory && state.lifecyclePhase === 'PLAN') lifecycle.advance(state, 'EXECUTE');
  if (state.lifecycleHistory && state.lifecyclePhase === 'EXECUTE' && state.tracks.every((track) => ['PASSED', 'FAILED', 'BLOCKED'].includes(state.executorStatus[track]))) lifecycle.advance(state, 'VALIDATE');
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
  const issues = requestedTrackIssues(state, false).concat(seedIssues(base, state));
  if (issues.length) {
    state.status = 'BLOCKED';
    state.nextAction = issues.join('\n');
    state.safeResumeInstruction = state.nextAction;
    saveState(base, state);
    process.stderr.write(state.nextAction + '\n');
    return 1;
  }

  const backendState = state.backendRunRef ? runLib.readJson(path.join(state.backendRunRef, 'state.json')) : null;
  if (state.domainEvidenceRefs && state.domainEvidenceRefs.length) {
    try {
      contextLib.refreshDomainEvidence(state);
      state.contextEvidenceHash = fileSnapshot(contextLib.contextFiles(state));
    } catch (error) {
      state.status = 'BLOCKED'; state.nextAction = `Backend validation failed: ${error.message}`; state.safeResumeInstruction = state.nextAction;
      saveState(base, state); process.stderr.write(state.nextAction + '\n'); return 1;
    }
  }
  const { coverage, missingSteps } = coverageLib.verifyCoverage({
    runId, frontendRunDir: state.frontendRunRef, backendRunDir: state.backendRunRef, backendState,
    domainEvidenceRefs: state.domainEvidenceRefs
  });

  fs.writeFileSync(path.join(base, 'requirement-coverage.yaml'), yaml.stringify(coverage));
  fs.writeFileSync(path.join(base, 'missing-steps.yaml'), yaml.stringify(missingSteps));
  state.coverageEvidenceHash = coverageSnapshot(base, state);

  state.status = 'COVERAGE_VERIFIED';
  if (state.lifecycleHistory && state.lifecyclePhase === 'VALIDATE') lifecycle.advance(state, 'REPORT');
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
  if (!state.coverageEvidenceHash || state.coverageEvidenceHash !== coverageSnapshot(base, state)) {
    state.status = 'BLOCKED';
    state.nextAction = `Coverage evidence changed; rerun verify-coverage --run ${clientId}/${runId} before handover.`;
    state.safeResumeInstruction = state.nextAction;
    saveState(base, state);
    return 1;
  }

  const backendState = state.backendRunRef ? runLib.readJson(path.join(state.backendRunRef, 'state.json')) : null;
  const { checklist, beforeMd, afterMd } = handoverLib.prepareHandover({
    runId, clientId, sourceVersion: state.sourceVersion, targetVersion: state.targetVersion,
    frontendRunDir: state.frontendRunRef, backendState,
    backendRunRef: state.backendRunRef, frontendRunRef: state.frontendRunRef,
    domainEvidenceRefs: state.domainEvidenceRefs,
    templatesDir: TEMPLATES_DIR
  });

  fs.writeFileSync(path.join(base, 'deployment-checklist.yaml'), yaml.stringify(checklist));
  fs.writeFileSync(path.join(base, 'before-deployment.md'), beforeMd);
  fs.writeFileSync(path.join(base, 'after-deployment.md'), afterMd);
  state.handoverEvidenceHash = fileSnapshot(['deployment-checklist.yaml', 'before-deployment.md', 'after-deployment.md'].map((file) => path.join(base, file)));

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

  const artifact = (name) => {
    try { return yaml.parse(fs.readFileSync(path.join(base, name), 'utf8')) || null; }
    catch (_) { return null; }
  };
  const coverage = artifact('requirement-coverage.yaml');
  const checklist = artifact('deployment-checklist.yaml');

  const trackStatusLines = state.tracks.map((t) => `- ${t}: ${state.trackStatus[t] || 'NOT_RUN'} (run ref: ${t === 'backend' ? state.backendRunRef : state.frontendRunRef || 'n/a'})`).join('\n');
  const coverageSummaryLine = coverage && coverage.summary
    ? `${coverage.summary.verifiedOrNotApplicable}/${coverage.summary.total} requirements verified or not-applicable-with-evidence; ${coverage.summary.outstanding} outstanding.`
    : 'verify-coverage has not run yet.';
  const handoverSummaryLine = checklist && Array.isArray(checklist.items)
    ? `${checklist.items.length} deployment item(s) in deployment-checklist.yaml.`
    : 'prepare-handover has not run yet.';
  const issues = requestedTrackIssues(state, true);
  if (state.executionContract === 'ENGINE' && checklist && Array.isArray(checklist.items)) {
    for (const item of checklist.items) if (['MANUAL_ACTION_PENDING', 'DECISION_PENDING', 'BLOCKED'].includes(item.status) && (typeof item.owner !== 'string' || !item.owner.trim())) issues.push(`Deployment item ${item.id || 'unknown'} has no owner; assign an exact handover action before completion`);
  }
  if (!state.coverageEvidenceHash || state.coverageEvidenceHash !== coverageSnapshot(base, state)) issues.push('coverage evidence changed or is missing; rerun verify-coverage and prepare-handover');
  const handoverHash = fileSnapshot(['deployment-checklist.yaml', 'before-deployment.md', 'after-deployment.md'].map((file) => path.join(base, file)));
  if (!state.handoverEvidenceHash || state.handoverEvidenceHash !== handoverHash) issues.push('deployment handover changed or is missing; rerun verify-coverage and prepare-handover');
  const allClear = issues.length === 0 && ['HANDOVER_READY', 'COMPLETE'].includes(state.status) && coverage && coverage.summary && coverage.summary.outstanding === 0 && checklist && Array.isArray(checklist.items);
  const nextAction = allClear
    ? 'All requirements verified or not-applicable-with-evidence and a deployment handover exists. Run is COMPLETE.'
    : issues.length ? issues.join('\n') : 'Resolve outstanding items in missing-steps.yaml, then re-run verify-coverage and prepare-handover before declaring COMPLETE.';

  const tpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'final-report.template.md'), 'utf8');
  const fill = (s, vars) => Object.keys(vars).reduce((acc, k) => acc.split(`{{${k}}}`).join(vars[k]), s);
  const report = fill(tpl, {
    clientId, sourceVersion: state.sourceVersion || 'unknown', targetVersion: state.targetVersion, runId,
    trackStatusLines, coverageSummaryLine, handoverSummaryLine, nextAction
  });
  fs.writeFileSync(path.join(base, 'final-report.md'), report);

  state.status = allClear ? 'COMPLETE' : 'BLOCKED';
  state.nextAction = nextAction;
  state.safeResumeInstruction = nextAction;
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

function cmdContext(flags) {
  try {
    const { clientId, runId } = splitRunFlag(flags.run);
    const state = loadState(runLib.runDir(clientId, runId));
    if (!state || !state.trackContextRefs || !state.trackContextRefs[flags.track]) throw new Error('No verified track context; create/resume the shared run first');
    const result = flags['evidence-version']
      ? { evidence: contextLib.readTrackEvidence(runLib.readJson(state.trackContextRefs[flags.track]), flags['evidence-version']) }
      : { context: contextLib.consumeTrackContext(state.trackContextRefs[flags.track], flags.track, { runId }) };
    process.stdout.write(JSON.stringify({ status: 'READY', ...result, nextAction: 'Execute domain planning; do not repeat Core ingestion.' }, null, 2) + '\n');
    return 0;
  } catch (error) {
    process.stderr.write(JSON.stringify({ status: 'BLOCKED', nextAction: error.message }) + '\n');
    return 1;
  }
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
    context: cmdContext,
    dispatch: cmdDispatch,
    'register-plan': cmdRegisterPlan,
    'record-validation': cmdRecordValidation,
    diagnose: cmdDiagnose,
    replan: cmdReplan,
    learn: cmdLearn,
    status: cmdStatus
  };
  if (!commands[cmd]) {
    process.stderr.write(`unknown command: ${cmd}\nUsage: node orchestrator.js <create-run|compose-results|verify-coverage|prepare-handover|final-report|status> [--flags]\n`);
    process.exit(2);
  }
  process.exit(commands[cmd](flags));
}

function cmdDispatch(flags) {
  try {
    const ids = splitRunFlag(flags.run);
    const result = require('./lib/coordinator').dispatch(ids.clientId, ids.runId, flags.track, flags.operation || 'plan');
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return 0;
  } catch (error) { process.stderr.write(`BLOCKED: ${error.message}\n`); return 1; }
}

function cmdRegisterPlan(flags) {
  try {
    const ids = splitRunFlag(flags.run);
    const input = JSON.parse(fs.readFileSync(flags.file, 'utf8'));
    const result = require('./lib/coordinator').registerPlan(ids.clientId, ids.runId, flags.track, input.plan, input.gateFacts);
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return result.permitted ? 0 : 1;
  } catch (error) { process.stderr.write(`BLOCKED: ${error.message}\n`); return 1; }
}

function cmdRecordValidation(flags) {
  try {
    const ids = splitRunFlag(flags.run);
    const input = JSON.parse(fs.readFileSync(flags.file, 'utf8'));
    const result = require('./lib/coordinator').recordValidation(ids.clientId, ids.runId, flags.track, input);
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return result.passed ? 0 : 1;
  } catch (error) { process.stderr.write(`BLOCKED: ${error.message}\n`); return 1; }
}

function cmdDiagnose(flags) {
  try {
    const ids = splitRunFlag(flags.run);
    const result = require('./lib/coordinator').diagnose(ids.clientId, ids.runId, flags.track, JSON.parse(fs.readFileSync(flags.file, 'utf8')));
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return result.budget.permitted ? 0 : 1;
  } catch (error) { process.stderr.write(`BLOCKED: ${error.message}\n`); return 1; }
}

function cmdLearn(flags) {
  try {
    const ids = splitRunFlag(flags.run);
    const current = require('./lib/coordinator').owner(ids.clientId, ids.runId, flags.track);
    if (!['PASSED', 'FAILED', 'BLOCKED'].includes(current.state.executorStatus[flags.track])) throw new Error('Learning requires a terminal executor outcome');
    const input = JSON.parse(fs.readFileSync(flags.file, 'utf8'));
    if (!input || Object.keys(input).some((key) => !['record', 'redactionReview'].includes(key))) throw new Error('Learning requires a record and explicit redactionReview');
    const result = require('./lib/memory').capture(flags.track, input.record, { candidate: flags.candidate === true, id: flags.id, redactionReview: input.redactionReview });
    process.stdout.write(JSON.stringify({ status: 'SUCCEEDED', ...result, nextAction: 'Candidate-only capture completed; developer review is required for promotion.' }, null, 2) + '\n');
    return 0;
  } catch (error) { process.stderr.write(`BLOCKED: ${error.message}\n`); return 1; }
}

function cmdReplan(flags) {
  try {
    const ids = splitRunFlag(flags.run);
    const result = require('./lib/coordinator').replan(ids.clientId, ids.runId, flags.track, flags.file);
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return 0;
  } catch (error) { process.stderr.write(`BLOCKED: ${error.message}\n`); return 1; }
}

if (require.main === module) main();
module.exports = { cmdCreateRun, cmdComposeResults, cmdVerifyCoverage, cmdPrepareHandover, cmdFinalReport, cmdStatus, cmdContext, cmdDispatch, cmdRegisterPlan, cmdRecordValidation, cmdDiagnose, cmdReplan, cmdLearn, ensureIngested, parseFlags, splitRunFlag, main };

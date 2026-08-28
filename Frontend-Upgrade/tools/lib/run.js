'use strict';
/*
 * Durable run store. Owns the on-disk layout under runs/<client>/<run-id>/ and
 * the authoritative state.json, append-only logs, checkpoints, and artifacts.
 * All run artifacts live inside the AGENT repository (never in client or Core).
 */
const fs = require('fs');
const path = require('path');
const core = require('./core');
const sm = require('./state-machine');

const nowCompact = () => core.nowIso().replace(/[:.]/g, '-');

function runDirAbs(clientId, runId) {
  return core.P('runs', clientId, runId);
}

function ensure(clientId, runId) {
  const dir = runDirAbs(clientId, runId);
  for (const sub of ['', 'checkpoints', 'artifacts', 'research']) {
    fs.mkdirSync(path.join(dir, sub), { recursive: true });
  }
  return dir;
}

function newRunId(clientId) { return `${clientId}-${nowCompact()}`; }

// --- state.json --------------------------------------------------------------
function initState(dir, opts) {
  const state = {
    schemaVersion: 1,
    runId: opts.runId,
    clientId: opts.clientId,
    status: 'IN_PROGRESS',
    currentPhase: opts.currentPhase || 'REQUEST',
    currentSkill: opts.currentSkill || 'validate-local-repositories',
    completedPhases: [],
    clientPath: opts.clientPath || null,
    corePath: opts.corePath || null,
    sourceVersion: opts.sourceVersion || null,
    targetVersion: opts.targetVersion || null,
    coreSourceCommit: null,
    coreTargetCommit: null,
    doctorStatus: null,
    planStatus: null,
    auditStatus: null,
    packageAlignmentStatus: null,
    semanticCoverage: null,
    requirementMappingStatus: null,
    assumptions: [],
    blockingUncertainty: [],
    changedFiles: [],
    buildStatus: null,
    testStatus: null,
    documentationStatus: {},
    implementationComplete: false,
    auditPassed: false,
    lastCheckpoint: null,
    lastAction: null,
    nextAction: opts.nextAction || 'Run validate-local-repositories (doctor).',
    safeResumeInstruction: opts.safeResumeInstruction || 'Re-run doctor and re-establish read-only inspection.',
    idempotency: {},
    startedAt: core.nowIso(),
    updatedAt: core.nowIso(),
  };
  writeState(dir, state);
  return state;
}

function statePath(dir) { return path.join(dir, 'state.json'); }
function readState(dir) {
  const p = statePath(dir);
  return core.exists(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}
function writeState(dir, state) {
  state.updatedAt = core.nowIso();
  core.writeJson(statePath(dir), state);
  return state;
}
function updateState(dir, patch) {
  const state = readState(dir) || {};
  Object.assign(state, patch);
  return writeState(dir, state);
}

// --- append-only logs --------------------------------------------------------
function event(dir, evt) {
  core.appendJsonl(path.join(dir, 'events.jsonl'), Object.assign({ ts: core.nowIso() }, evt));
}
function observation(dir, obs) {
  core.appendJsonl(path.join(dir, 'observations.jsonl'), Object.assign({ ts: core.nowIso() }, obs));
}
function decision(dir, dec) {
  core.appendJsonl(path.join(dir, 'decisions.jsonl'), Object.assign({ ts: core.nowIso() }, dec));
}
function failure(dir, fail) {
  core.appendJsonl(path.join(dir, 'failures.jsonl'), Object.assign({ ts: core.nowIso() }, fail));
}

// --- checkpoints -------------------------------------------------------------
function checkpoint(dir, label) {
  const state = readState(dir) || {};
  const files = fs.readdirSync(path.join(dir, 'checkpoints')).filter((f) => /^\d+\.json$/.test(f));
  const n = files.length + 1;
  const cpPath = path.join(dir, 'checkpoints', `${n}.json`);
  const snapshot = Object.assign({ checkpointNumber: n, label: label || null, valid: true, at: core.nowIso() }, state);
  core.writeJson(cpPath, snapshot);
  updateState(dir, { lastCheckpoint: `checkpoints/${n}.json` });
  return cpPath;
}

// --- artifact writers --------------------------------------------------------
function writeArtifactJson(dir, name, obj) { core.writeJson(path.join(dir, name), obj); return name; }
function writeArtifactYaml(dir, name, obj) { core.writeYaml(path.join(dir, name), obj); return name; }
function writeArtifactText(dir, name, text) { core.writeText(path.join(dir, name), text); return name; }

module.exports = {
  nowCompact, runDirAbs, ensure, newRunId,
  initState, statePath, readState, writeState, updateState,
  event, observation, decision, failure, checkpoint,
  writeArtifactJson, writeArtifactYaml, writeArtifactText,
  REQUIRED_DOC_ITEMS: sm.REQUIRED_DOC_ITEMS,
};

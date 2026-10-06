'use strict';
const fs = require('fs');
const path = require('path');
const nowIso = require('./skill-engine').nowIso;
const runs = require('./run');

function create(options) {
  function runDirAbs(clientId, runId) {
    for (const id of [clientId, runId]) if (!id || id === '..' || /[/\\]/.test(id)) throw new Error('Invalid artifact run identity');
    return path.join(options.root, 'runs', clientId, runId);
  }
  function ensure(clientId, runId) {
    const dir = runDirAbs(clientId, runId);
    for (const sub of ['checkpoints', 'artifacts', 'research']) fs.mkdirSync(path.join(dir, sub), { recursive: true });
    return dir;
  }
  const statePath = (dir) => path.join(dir, 'state.json');
  const readState = (dir) => runs.readJson(statePath(dir));
  function writeState(dir, state) {
    state.updatedAt = nowIso();
    runs.writeJson(statePath(dir), state);
    return state;
  }
  function initState(dir, opts) {
    return writeState(dir, Object.assign({ schemaVersion: 1, status: 'READY', completedPhases: [],
      assumptions: [], blockingUncertainty: [], changedFiles: [], documentationStatus: {},
      implementationComplete: false, lastCheckpoint: null, lastAction: null, idempotency: {},
      startedAt: nowIso(), nextAction: 'Complete domain inspection and register the plan with the engine.',
      safeResumeInstruction: 'Resume through the shared owner and verify context before executing.' }, options.defaults || {}, opts));
  }
  function updateState(dir, patch) { return writeState(dir, Object.assign(readState(dir) || {}, patch)); }
  function append(dir, file, value) {
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, file), JSON.stringify(Object.assign({ ts: nowIso() }, value)) + '\n');
  }
  function checkpoint(dir, label) {
    const directory = path.join(dir, 'checkpoints');
    fs.mkdirSync(directory, { recursive: true });
    const numbers = fs.readdirSync(directory).filter((name) => /^\d+\.json$/.test(name)).map((name) => Number(name.replace('.json', '')));
    const number = Math.max(0, ...numbers) + 1;
    const file = path.join(directory, `${number}.json`);
    runs.writeJson(file, Object.assign({}, readState(dir), { checkpointNumber: number, label: label || null, valid: true, at: nowIso() }));
    updateState(dir, { lastCheckpoint: `checkpoints/${number}.json` });
    return file;
  }
  return {
    nowCompact: () => nowIso().replace(/[:.]/g, '-'), newRunId: (client) => runs.newRunId(client),
    runDirAbs, ensure, statePath, readState, writeState, updateState, initState, checkpoint,
    event: (dir, value) => append(dir, 'events.jsonl', value),
    observation: (dir, value) => append(dir, 'observations.jsonl', value),
    decision: (dir, value) => append(dir, 'decisions.jsonl', value),
    failure: (dir, value) => append(dir, 'failures.jsonl', value),
    writeArtifactJson: (dir, name, value) => { runs.writeJson(path.join(dir, name), value); return name; },
    writeArtifactYaml: (dir, name, value) => { fs.writeFileSync(path.join(dir, name), require('./yaml').stringify(value)); return name; },
    writeArtifactText: (dir, name, value) => { fs.writeFileSync(path.join(dir, name), value); return name; },
    REQUIRED_DOC_ITEMS: options.requiredDocItems || [],
  };
}

module.exports = { create };
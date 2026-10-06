'use strict';
const fs = require('fs');
const path = require('path');
const context = require('./context');
const runs = require('./run');

function acquire(track, input) {
  if (input.contextRef) return context.consumeTrackContext(input.contextRef, track, input);
  if (!input.corePath || !input.sourceVersion || !input.targetVersion) return null;
  const code = require('../upgrade-engine').cmdCreateRun({
    client: input.clientId, tracks: track, 'run-id': input.runId,
    'core-path': input.corePath, 'release-notes': input.releaseNotesPath,
    'source-version': input.sourceVersion, 'target-version': input.targetVersion,
    [`${track}-client-path`]: input.clientPath
  });
  if (code !== 0) throw new Error('Shared ingestion blocked; inspect engine run state before proceeding');
  const state = runs.readJson(path.join(runs.runDir(input.clientId, input.runId), 'state.json'));
  return context.consumeTrackContext(state.trackContextRefs[track], track, input);
}

function attach(dir, track, input) {
  const packet = acquire(track, input);
  if (packet) fs.writeFileSync(path.join(dir, 'shared-context-ref.json'), JSON.stringify({
    track, ref: path.join(path.dirname(packet.upgrade.coreChangeSet.ref), 'contexts', `${track}.json`)
  }, null, 2) + '\n');
  return packet;
}

function guard(dir, track, expected) {
  const file = path.join(dir, 'shared-context-ref.json');
  if (!fs.existsSync(file)) {
    const clientId = path.basename(path.dirname(dir));
    const runId = path.basename(dir);
    if (fs.existsSync(path.join(runs.runDir(clientId, runId), 'core-change-set.json'))) throw new Error('Shared context binding is missing; reattach the verified context before resuming');
    return null;
  }
  const reference = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (reference.track !== track) throw new Error('Shared execution track does not match run');
  return context.consumeTrackContext(reference.ref, track, expected);
}

module.exports = { acquire, attach, guard };
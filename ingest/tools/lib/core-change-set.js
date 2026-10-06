'use strict';
const crypto = require('crypto');
const digest = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

function produce(entries, input) {
  if (!entries.length) throw new Error('no verified release candidates');
  const changeSet = {
    schemaVersion: 1, status: 'CANDIDATE',
    source: { corePath: input.corePath, releaseNotesPath: input.releaseNotesPath || null,
      fromVersion: input.sourceVersion, toVersion: input.targetVersion,
      fromRevision: entries[0].record.identity ? entries[0].record.identity.fromCommit : null,
      toRevision: entries[entries.length - 1].record.identity ? entries[entries.length - 1].record.identity.toCommit : null },
    releases: entries.map((entry) => ({ version: entry.record.version, evidence: entry.path, identity: entry.record.identity || null, recordHash: digest(entry.record) })),
    shared: [], backend: [], frontend: [],
  };
  for (const entry of entries) for (const scope of ['shared', 'backend', 'frontend']) {
    changeSet[scope].push({ version: entry.record.version, evidence: entry.path, findingCount: ((entry.record.findings || {})[scope] || []).length });
  }
  changeSet.fingerprint = digest(changeSet);
  return changeSet;
}

module.exports = { produce };
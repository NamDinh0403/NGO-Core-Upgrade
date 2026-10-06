'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const INGEST_ROOT = path.resolve(__dirname, '..', '..', '..', 'ingest');
const digest = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const normalizeVersion = (value) => /^\d+\.\d+$/.test(String(value)) ? `${value}.0` : value;
const samePath = (left, right) => {
  const first = path.resolve(left), second = path.resolve(right);
  return process.platform === 'win32' ? first.toLowerCase() === second.toLowerCase() : first === second;
};
function snapshot(files) {
  const hash = crypto.createHash('sha256');
  for (const file of files) hash.update(file).update('\0').update(fs.readFileSync(file));
  return hash.digest('hex');
}
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
};

function ensureCoreChangeSet({ corePath, releaseNotesPath, sourceVersion, targetVersion, ingestRoot }) {
  ingestRoot = ingestRoot || INGEST_ROOT;
  try {
    const result = require(path.join(ingestRoot, 'tools', 'ingest.js')).ensureReleases({
      'core-path': corePath, 'release-notes': releaseNotesPath,
      since: sourceVersion, target: targetVersion,
      out: path.join(ingestRoot, 'knowledge', 'candidates', 'releases')
    });
    if (!result.entries.length) throw new Error('no verified release candidates');
    const changeSet = {
      schemaVersion: 1, status: 'CANDIDATE',
      source: { corePath, releaseNotesPath: releaseNotesPath || null, fromVersion: sourceVersion, toVersion: targetVersion,
        fromRevision: result.entries[0].record.identity ? result.entries[0].record.identity.fromCommit : null,
        toRevision: result.entries[result.entries.length - 1].record.identity ? result.entries[result.entries.length - 1].record.identity.toCommit : null },
      releases: result.entries.map((entry) => ({
        version: entry.record.version, evidence: entry.path,
        identity: entry.record.identity || null, recordHash: digest(entry.record)
      }))
    };
    changeSet.fingerprint = digest(changeSet);
    return { reused: result.reused, path: result.entries[result.entries.length - 1].path,
      entries: result.entries, changeSet };
  } catch (error) {
    return { reused: false, path: null, entries: [], failed: true, error: error.message };
  }
}

function verifyCoreChangeSet(changeSet) {
  if (!changeSet || changeSet.schemaVersion !== 1 || changeSet.status !== 'CANDIDATE' || !changeSet.source || !Array.isArray(changeSet.releases) || !changeSet.releases.length) throw new Error('invalid CoreChangeSet');
  const unsigned = Object.assign({}, changeSet);
  delete unsigned.fingerprint;
  if (digest(unsigned) !== changeSet.fingerprint) throw new Error('CoreChangeSet fingerprint changed');
  for (const release of changeSet.releases) {
    const record = read(release.evidence);
    if (record.version !== release.version || digest(record) !== release.recordHash) throw new Error(`Core release evidence changed: ${release.version}`);
    if (release.identity) {
      const ingest = require(path.join(INGEST_ROOT, 'tools', 'ingest.js'));
      const notesFile = changeSet.source.releaseNotesPath;
      const text = notesFile && fs.existsSync(notesFile) ? fs.readFileSync(notesFile, 'utf8') : null;
      const current = ingest.releaseIdentity(changeSet.source.corePath, text, record.sources.tagRange.from, record.sources.tagRange.to, record.version);
      if (current.key !== release.identity.key || release.identity.analyzerVersion !== ingest.ANALYZER_VERSION) throw new Error(`Core release identity changed: ${release.version}; resume shared ingestion`);
    }
  }
  return changeSet;
}

function persistContexts(base, request, runId, changeSet, split) {
  const changeSetRef = path.join(base, 'core-change-set.json');
  write(changeSetRef, changeSet);
  const discovery = require('./discovery').discover(request);
  const clientDiscoveryRef = path.join(base, 'client-discovery.json');
  write(clientDiscoveryRef, discovery);
  const domainEvidenceRefs = [];
  let backendValidation = { owner: 'backend', status: 'NOT_INSPECTED' };
  const configurationRoot = request.backendClientPath || request.frontendClientPath;
  if (configurationRoot) {
    const store = require('./knowledge').defaultStore();
    const result = require('./executors').capability('backend', 'configuration').inspect(configurationRoot, store.appSettings());
    result.input = { root: configurationRoot, requirements: store.appSettings() };
    const file = path.join(base, 'backend-configuration-evidence.json');
    write(file, result);
    domainEvidenceRefs.push(file);
    backendValidation = { owner: 'backend', status: result.secretRejections.length ? 'BLOCKED' : result.missing.length ? 'PENDING' : 'VERIFIED',
      outstanding: result.coverage.filter((entry) => entry.status !== 'VERIFIED').length };
  }
  const common = {
    schemaVersion: 1, run: { runId, clientId: request.clientId },
    client: { id: request.clientId },
    coreChangeSet: { ref: changeSetRef, fingerprint: changeSet.fingerprint },
    target: { sourceVersion: request.sourceVersion, targetVersion: request.targetVersion },
    sharedRequirements: split.shared.requirements,
    integration: { backendValidation, apiHints: changeSet.releases.reduce((hints, release) => {
      const record = read(release.evidence);
      return hints.concat((record.facts || []).filter((fact) => fact.kind === 'api-declaration-change-hint' && /(^|\/)(Controllers?|Contracts?|Dtos?|Models?|interfaces)(\/|\.)/i.test(fact.path) && !/\/Migrations\//i.test(fact.path)).map((fact) => ({
        version: release.version, path: fact.path, added: fact.added, removed: fact.removed, requiresSemanticReview: true
      })));
    }, []) },
    policies: { coreReadOnly: true, readyPlanBeforeMutation: true, candidatesNeverCanonical: true },
    evidence: { requirementsRef: path.join(base, 'requirements', 'shared.yaml') }
  };
  write(path.join(base, 'upgrade-context.json'), common);
  const refs = {};
  const sharedIds = new Set(common.sharedRequirements.map((requirement) => requirement.id));
  for (const track of request.tracks) {
    const context = {
      schemaVersion: 1, track, upgrade: common,
      client: { path: request[`${track}ClientPath`] || null, facts: discovery[track] },
      requirements: split[track].requirements.filter((requirement) => !sharedIds.has(requirement.id)),
      excluded: split[track].excluded,
      policies: { ref: path.resolve(__dirname, '..', '..', '..', track, 'AGENTS.md') },
      evidence: { requirementsRef: path.join(base, 'requirements', `${track}.yaml`) }
    };
    context.fingerprint = digest(context);
    refs[track] = path.join(base, 'contexts', `${track}.json`);
    write(refs[track], context);
  }
  return { coreChangeSetRef: changeSetRef, coreChangeSetFingerprint: changeSet.fingerprint,
    upgradeContextRef: path.join(base, 'upgrade-context.json'), trackContextRefs: refs, domainEvidenceRefs, clientDiscoveryRef,
    inputEvidenceRefs: request.featureDecisionsPath && fs.existsSync(request.featureDecisionsPath) ? [request.featureDecisionsPath] : [] };
}

function consumeTrackContext(file, track, expected) {
  if (!['backend', 'frontend'].includes(track)) throw new Error('invalid executor track');
  const context = read(file);
  const unsigned = Object.assign({}, context);
  delete unsigned.fingerprint;
  if (context.schemaVersion !== 1 || context.track !== track || digest(unsigned) !== context.fingerprint) throw new Error('invalid or changed track context');
  if (!context.upgrade || !context.upgrade.run || !context.upgrade.target) throw new Error('missing UpgradeContext');
  const ownerStateFile = path.join(path.dirname(path.dirname(file)), 'state.json');
  if (!fs.existsSync(ownerStateFile)) throw new Error('missing shared owner state; do not use detached contexts');
  {
    const state = read(ownerStateFile);
    if (!state.trackContextRefs || !samePath(state.trackContextRefs[track] || '', file) || state.contextEvidenceHash !== snapshot(contextFiles(state))) throw new Error('context no longer matches shared run evidence');
  }
  const allowed = ['schemaVersion', 'track', 'upgrade', 'client', 'requirements', 'excluded', 'policies', 'evidence', 'fingerprint'];
  if (Object.keys(context).some((key) => !allowed.includes(key)) || Object.keys(context.client || {}).some((key) => !['path', 'facts'].includes(key))) throw new Error('unexpected implementation metadata in track context');
  const upgradeKeys = ['schemaVersion', 'run', 'client', 'coreChangeSet', 'target', 'sharedRequirements', 'integration', 'policies', 'evidence'];
  const factKeys = track === 'backend' ? ['path', 'manifests', 'present', 'sdk'] : ['path', 'manifests', 'present', 'package', 'angular', 'typescript'];
  if (Object.keys(context.upgrade).some((key) => !upgradeKeys.includes(key)) || Object.keys(context.client.facts || {}).some((key) => !factKeys.includes(key))) throw new Error('opposite-domain implementation metadata in context');
  if (Object.keys(context.upgrade.integration || {}).some((key) => !['backendValidation', 'apiHints'].includes(key))) throw new Error('invalid integration boundary');
  expected = expected || {};
  for (const key of ['sourceVersion', 'targetVersion']) {
    if (expected[key] && normalizeVersion(expected[key]) !== normalizeVersion(context.upgrade.target[key])) throw new Error(`${key} does not match shared context`);
  }
  if (expected.clientPath && !samePath(expected.clientPath, context.client.path || '')) throw new Error('client path does not match shared context');
  if (expected.runId && context.upgrade.run.runId !== expected.runId) throw new Error('run id does not match shared context');
  const changeSet = verifyCoreChangeSet(read(context.upgrade.coreChangeSet.ref));
  if (expected.corePath && !samePath(expected.corePath, changeSet.source.corePath)) throw new Error('Core path does not match shared context');
  if (changeSet.fingerprint !== context.upgrade.coreChangeSet.fingerprint) throw new Error('CoreChangeSet does not match track context');
  if (!Array.isArray(context.requirements) || context.requirements.some((finding) => ![track, 'shared'].includes(finding.scope))) throw new Error('opposite-track finding in context');
  return context;
}

function contextFiles(state) {
  return state.coreChangeSetRef ? [state.coreChangeSetRef, state.upgradeContextRef, state.clientDiscoveryRef].filter(Boolean).concat(Object.values(state.trackContextRefs || {}), state.domainEvidenceRefs || [], state.inputEvidenceRefs || []) : [];
}

function refreshDomainEvidence(state) {
  for (const file of state.domainEvidenceRefs || []) {
    const previous = read(file);
    if (!previous.input) throw new Error('missing backend validation input');
    const result = require('./executors').capability('backend', 'configuration').inspect(previous.input.root, previous.input.requirements);
    result.input = previous.input;
    write(file, result);
    const validation = { owner: 'backend', status: result.secretRejections.length ? 'BLOCKED' : result.missing.length ? 'PENDING' : 'VERIFIED',
      outstanding: result.coverage.filter((entry) => entry.status !== 'VERIFIED').length };
    const upgrade = read(state.upgradeContextRef);
    upgrade.integration.backendValidation = validation;
    write(state.upgradeContextRef, upgrade);
    for (const contextFile of Object.values(state.trackContextRefs || {})) {
      const packet = read(contextFile);
      packet.upgrade = upgrade;
      delete packet.fingerprint;
      packet.fingerprint = digest(packet);
      write(contextFile, packet);
    }
  }
}

function readTrackEvidence(context, version) {
  context = consumeTrackContext(path.join(path.dirname(context.upgrade.coreChangeSet.ref), 'contexts', `${context.track}.json`), context.track);
  const changeSet = read(context.upgrade.coreChangeSet.ref);
  const release = changeSet.releases.find((entry) => entry.version === version);
  if (!release) throw new Error('requested evidence is outside the shared release range');
  const record = read(release.evidence);
  const classify = require(path.join(INGEST_ROOT, 'tools', 'lib', 'classify')).classify;
  const visible = (item) => {
    const scope = item.scope || (item.path && classify(item.path).scope);
    return scope === context.track || (scope === 'shared' && !(context.track === 'frontend' && /\.sql$|\/Migrations\/|appsettings/i.test(item.path || '')));
  };
  return { version, findings: (record.findings[context.track] || []).concat((record.findings.shared || []).filter(visible)),
    changes: (record.changes || []).filter(visible), facts: (record.facts || []).filter(visible),
    apiHints: (context.upgrade.integration.apiHints || []).filter((hint) => hint.version === version) };
}

function trackStatus(state) {
  if (!state) return 'READY';
  if (['COMPLETE', 'SUCCEEDED'].includes(state.status)) return 'PASSED';
  if (/^FAILED/.test(state.status || '')) return 'FAILED';
  if (/^(BLOCKED|CANCELLED)/.test(state.status || '')) return 'BLOCKED';
  return 'RUNNING';
}

module.exports = { digest, snapshot, normalizeVersion, samePath, ensureCoreChangeSet, verifyCoreChangeSet, persistContexts, consumeTrackContext, contextFiles, trackStatus, refreshDomainEvidence, readTrackEvidence };
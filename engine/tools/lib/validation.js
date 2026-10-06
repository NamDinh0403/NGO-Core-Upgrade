'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const context = require('./context');
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const commandKinds = new Set(['restore', 'build', 'tests', 'toolchain', 'development-build', 'production-build', 'installed-dependencies', 'installed-core-assemblies', 'installed-public-api']);
const structured = { 'requirement-coverage': 'requirements', 'finding-dispositions': 'findings', 'deployment-checklist': 'items', uncertainty: 'uncertainties', capabilities: 'capabilities' };

function gitFingerprint(root) {
  const cp = require('child_process');
  const commands = [['status', '--porcelain'], ['rev-parse', '--verify', 'HEAD'], ['symbolic-ref', '--quiet', 'HEAD'], ['diff', '--no-ext-diff', '--no-textconv', 'HEAD']];
  const values = [];
  for (const args of commands) {
    const result = cp.spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
    if (result.status !== 0 && args[0] === 'status') throw new Error('Repository status cannot be verified');
    if (result.error) throw new Error('Repository fingerprint failed');
    values.push(result.status === 0 ? context.digest(result.stdout) : 'UNBORN_HEAD');
  }
  return context.digest(values);
}

function coreFingerprint(packet) {
  const source = JSON.parse(fs.readFileSync(packet.upgrade.coreChangeSet.ref, 'utf8')).source;
  return gitFingerprint(source.corePath);
}

function planningIdentity(packet) {
  const copy = JSON.parse(JSON.stringify(packet));
  delete copy.fingerprint;
  if (copy.upgrade.integration && copy.upgrade.integration.backendValidation) copy.upgrade.integration.backendValidation = { owner: copy.upgrade.integration.backendValidation.owner };
  return context.digest(copy);
}

function clientRoot(packet) {
  return fs.statSync(packet.client.path).isDirectory() ? packet.client.path : path.dirname(packet.client.path);
}

function head(root) {
  const result = require('child_process').spawnSync('git', ['-C', root, 'rev-parse', '--verify', 'HEAD'], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error('A real rollback commit is required before execution');
  return result.stdout.trim();
}

function runScoped(packet, ref) {
  const base = path.dirname(packet.upgrade.coreChangeSet.ref);
  const legacy = path.resolve(__dirname, '..', '..', '..', packet.track, 'runs', packet.upgrade.run.clientId, packet.upgrade.run.runId);
  const file = fs.realpathSync(ref);
  return [path.join(base, 'artifacts', packet.track), path.join(base, 'results', packet.track), legacy].some((root) => {
    if (!fs.existsSync(root)) return false;
    const relative = path.relative(fs.realpathSync(root), file);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  });
}

function envelope(packet, kind, proof) {
  const artifacts = (proof.artifacts || []).map((ref) => ({ ref, hash: hash(ref) }));
  return Object.assign({}, proof, { schemaVersion: 1, runId: packet.upgrade.run.runId, clientId: packet.upgrade.run.clientId,
    track: packet.track, targetVersion: packet.upgrade.target.targetVersion, kind, status: proof.status || 'PASSED', artifacts });
}

function read(packet, entry) {
  if (!entry || typeof entry.kind !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(entry.kind)) throw new Error('Invalid evidence kind');
  if (!entry || !entry.ref || !fs.existsSync(entry.ref) || !fs.statSync(entry.ref).isFile()) throw new Error('Missing evidence file');
  if (!runScoped(packet, entry.ref)) throw new Error('Evidence envelope must belong to this run and executor');
  const document = JSON.parse(fs.readFileSync(entry.ref, 'utf8'));
  const allowed = ['schemaVersion', 'runId', 'clientId', 'track', 'targetVersion', 'kind', 'status', 'summary', 'artifacts', 'command', 'exitCode', 'requirements', 'findings', 'items', 'capabilities', 'missingCapabilities', 'uncertainties', 'clientFingerprint', 'coreFingerprint', 'commit', 'documentationStatus'];
  if (Object.keys(document).some((key) => !allowed.includes(key))) throw new Error('Evidence contains unexpected metadata');
  for (const [key, expected] of Object.entries({ schemaVersion: 1, runId: packet.upgrade.run.runId, clientId: packet.upgrade.run.clientId, track: packet.track, targetVersion: packet.upgrade.target.targetVersion, kind: entry.kind, status: entry.status })) {
    if (document[key] !== expected) throw new Error(`Evidence ${entry.kind} has a different ${key}`);
  }
  if (document.status !== 'PASSED') return document;
  if (entry.kind === 'documentation' && !require('./execution-primitives').documentationComplete(document.documentationStatus, require('./checkpoint-compatibility').forTrack(packet.track).REQUIRED_DOC_ITEMS)) throw new Error('Documentation completion gate has outstanding items');
  if (typeof document.summary !== 'string' || !document.summary.trim()) throw new Error(`Evidence ${entry.kind} lacks a verification summary`);
  if (commandKinds.has(entry.kind) && (typeof document.command !== 'string' || !document.command.trim() || document.exitCode !== 0)) throw new Error(`Evidence ${entry.kind} requires the exact successful command/result`);
  if (structured[entry.kind] && !Array.isArray(document[structured[entry.kind]])) throw new Error(`Evidence ${entry.kind} requires structured ${structured[entry.kind]}`);
  if (!structured[entry.kind] && (!Array.isArray(document.artifacts) || !document.artifacts.length)) throw new Error(`Evidence ${entry.kind} requires concrete artifacts`);
  for (const artifact of document.artifacts || []) {
    if (!artifact || Object.keys(artifact).some((key) => !['ref', 'hash'].includes(key))) throw new Error('Unexpected artifact metadata');
    if (!artifact.ref || !fs.existsSync(artifact.ref) || !fs.statSync(artifact.ref).isFile() || fs.statSync(artifact.ref).size === 0 || hash(artifact.ref) !== artifact.hash) throw new Error(`Evidence ${entry.kind} artifact is missing, empty or changed`);
  }
  return document;
}

function inspect(packet, entries) {
  const documents = {}, files = [], issues = [];
  for (const entry of entries || []) {
    try {
      const document = read(packet, entry);
      documents[entry.kind] = document;
      files.push(entry.ref, ...(document.artifacts || []).map((artifact) => artifact.ref));
      if (document.status !== 'PASSED') issues.push(`${entry.kind}: ${document.status}`);
    } catch (error) { issues.push(`${entry.kind || 'unknown'}: ${error.message}`); }
  }
  return { documents, files: [...new Set(files)], issues };
}

function fingerprint(packet, plan) {
  const facts = require('./executors').executor(packet.track).inspect(packet);
  const root = fs.realpathSync(fs.statSync(packet.client.path).isDirectory() ? packet.client.path : path.dirname(packet.client.path));
  const corePath = JSON.parse(fs.readFileSync(packet.upgrade.coreChangeSet.ref, 'utf8')).source.corePath;
  const coreRoot = fs.realpathSync(corePath);
  const relativeCore = path.relative(root, coreRoot), relativeClient = path.relative(coreRoot, root);
  if (!relativeCore || (!relativeCore.startsWith('..') && !path.isAbsolute(relativeCore)) || (!relativeClient.startsWith('..') && !path.isAbsolute(relativeClient))) throw new Error('Client mutation root must not overlap the read-only Core repository');
  const files = new Set(facts.manifests || []);
  for (const change of plan.changes) {
    const file = path.resolve(root, change.file);
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Planned mutation escapes the domain repository');
    let existing = file;
    while (!fs.existsSync(existing)) existing = path.dirname(existing);
    const resolved = path.relative(root, fs.realpathSync(existing));
    if (resolved.startsWith('..') || path.isAbsolute(resolved)) throw new Error('Planned mutation follows a symlink outside the domain repository');
    files.add(file);
  }
  const values = [...files].sort().map((file) => ({ file, hash: fs.existsSync(file) ? hash(file) : null }));
  return context.digest({ root, values, git: gitFingerprint(root) });
}

function gateProofs(packet, facts, plan) {
  const expected = ['baseline', 'rollback-checkpoint', 'repository-status', 'capabilities', 'uncertainty'];
  if (packet.track === 'frontend') expected.push('core-fingerprint');
  const entries = (facts.proofRefs || []).map((entry) => ({ kind: entry.kind, ref: entry.ref, status: entry.status || 'PASSED' }));
  const checked = inspect(packet, entries);
  const missing = expected.filter((kind) => !checked.documents[kind]);
  const reasons = checked.issues.concat(missing.map((kind) => `missing safety proof: ${kind}`));
  const uncertainty = checked.documents.uncertainty;
  if (uncertainty && !Array.isArray(uncertainty.uncertainties)) reasons.push('invalid uncertainty proof');
  const capabilities = checked.documents.capabilities;
  if (capabilities && (!Array.isArray(capabilities.missingCapabilities) || capabilities.missingCapabilities.length)) reasons.push('required capabilities have not been verified');
  const derived = { baselineRecorded: false, rollbackCheckpointExists: false, repositoryStatusKnown: false,
    clientStatusKnown: false, coreFingerprintRecorded: packet.track === 'backend', requiredCapabilitiesAvailable: false,
    actionInPlan: true, policyPermitsAssumptions: require('../../config/execution-policy.json').allowReadyWithAssumptions };
  if (!missing.length && !checked.issues.length) {
    try {
      const current = fingerprint(packet, plan);
      derived.baselineRecorded = checked.documents.baseline.clientFingerprint === current && checked.documents.baseline.command && checked.documents.baseline.exitCode === 0;
      derived.rollbackCheckpointExists = checked.documents['rollback-checkpoint'].commit === head(clientRoot(packet));
      derived.repositoryStatusKnown = checked.documents['repository-status'].clientFingerprint === current;
      derived.clientStatusKnown = derived.repositoryStatusKnown;
      if (packet.track === 'frontend') derived.coreFingerprintRecorded = checked.documents['core-fingerprint'].coreFingerprint === coreFingerprint(packet);
      const prerequisites = require('./executors').executor(packet.track).prerequisites(packet);
      derived.requiredCapabilitiesAvailable = prerequisites.ready && capabilities && capabilities.capabilities.length > 0;
      if (!prerequisites.ready) reasons.push(...prerequisites.missing.map((tool) => `missing live prerequisite: ${tool}`));
    } catch (error) { reasons.push(error.message); }
  }
  return { permitted: reasons.length === 0, reasons, files: checked.files,
    derived, uncertaintyRegister: uncertainty ? uncertainty.uncertainties : [] };
}

module.exports = { envelope, read, inspect, fingerprint, coreFingerprint, planningIdentity, head, gateProofs, hash };
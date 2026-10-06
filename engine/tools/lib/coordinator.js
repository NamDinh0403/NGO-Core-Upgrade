'use strict';
const fs = require('fs');
const path = require('path');
const runs = require('./run');
const context = require('./context');
const lifecycle = require('./lifecycle');
const policy = require('./policy');
const schema = require('./schema');
const contracts = require('../../schemas/executor-contract.schema.json').definitions;
const validation = require('./validation');

function owner(clientId, runId, track) {
  const base = runs.runDir(clientId, runId);
  const state = runs.readJson(path.join(base, 'state.json'));
  if (!state || !state.tracks.includes(track)) throw new Error('Executor is not part of this shared run');
  const packet = context.consumeTrackContext(state.trackContextRefs[track], track, { runId });
  return { base, state, packet };
}

function save(base, state) {
  state.updatedAt = new Date().toISOString();
  runs.writeJson(path.join(base, 'state.json'), state);
}

function registerPlan(clientId, runId, track, plan, gateFacts) {
  const errors = schema.validate(plan, contracts.Plan, 'Plan');
  if (errors.length) throw new Error(errors.join('; '));
  const current = owner(clientId, runId, track);
  if (current.state.lifecyclePhase !== 'PLAN') throw new Error('Plans may be registered only during PLAN');
  gateFacts = gateFacts || {};
  const allowedFacts = ['proofRefs', 'baselineRecorded', 'rollbackCheckpointExists', 'repositoryStatusKnown', 'clientStatusKnown', 'coreFingerprintRecorded', 'requiredCapabilitiesAvailable', 'actionInPlan', 'policyPermitsAssumptions', 'uncertaintyRegister', 'planningFingerprintsMatch'];
  if (Object.keys(gateFacts).some((key) => !allowedFacts.includes(key))) throw new Error('Unexpected gate metadata; do not persist secrets or unrelated inputs');
  const proofs = validation.gateProofs(current.packet, gateFacts, plan);
  const derivedFacts = Object.assign({}, proofs.derived, { uncertaintyRegister: proofs.uncertaintyRegister,
    proofRefs: (gateFacts.proofRefs || []).map((entry) => ({ kind: entry.kind, ref: entry.ref, status: entry.status || 'PASSED' })) });
  const gate = require('./executors').executor(track).mutationGate(Object.assign({}, derivedFacts, { planExists: true, planStatus: plan.status }));
  gate.reasons.push(...proofs.reasons);
  gate.permitted = gate.reasons.length === 0;
  if (!Array.isArray(plan.changes) || plan.changes.some((change) => !change.file || !change.evidence || !change.validation)) throw new Error('Every planned change requires a file, evidence and validation');
  const file = path.join(current.base, 'plans', `${track}.json`);
  const record = { schemaVersion: 1, track, plan, gate, gateFacts: derivedFacts, contextFingerprint: validation.planningIdentity(current.packet),
    proofFiles: proofs.files, proofHash: proofs.files.length ? context.snapshot(proofs.files) : null,
    clientFingerprint: gate.permitted ? validation.fingerprint(current.packet, plan) : null,
    coreFingerprint: gate.permitted ? validation.coreFingerprint(current.packet) : null };
  runs.writeJson(file, record);
  current.state.executorPlans = current.state.executorPlans || {};
  current.state.executorPlans[track] = { ref: file, hash: context.snapshot([file]) };
  save(current.base, current.state);
  return gate;
}

function loadPlan(current, track) {
  const binding = (current.state.executorPlans || {})[track];
  if (!binding || context.snapshot([binding.ref]) !== binding.hash) throw new Error('Missing or changed engine plan; replan before execution');
  const record = runs.readJson(binding.ref);
  if (!record.gate.permitted) throw new Error('Plan is not READY against the current context and safety gate');
  if (validation.coreFingerprint(current.packet) !== record.coreFingerprint) throw new Error('Core working tree changed since planning; stop and revalidate without mutating Core');
  if (!record.proofHash || context.snapshot(record.proofFiles) !== record.proofHash) throw new Error('Safety proof is missing or changed; replan before execution');
  const gate = require('./executors').executor(track).mutationGate(Object.assign({}, record.gateFacts, { planExists: true, planStatus: record.plan.status }));
  if (record.contextFingerprint !== validation.planningIdentity(current.packet) || !record.gate.permitted || !gate.permitted) throw new Error('Plan is not READY against the current context and safety gate');
  return record;
}

function dispatch(clientId, runId, track, operation) {
  const current = owner(clientId, runId, track);
  const adapter = require('./executors').executor(track);
  if (!['inspect', 'plan', 'execute'].includes(operation)) throw new Error('Unsupported executor operation');
  let plan = null;
  if (operation === 'execute') {
    plan = loadPlan(current, track);
    if (!adapter.inspect(current.packet).present) throw new Error('Execution requires an inspected domain repository');
    if (current.state.lifecyclePhase === 'PLAN') lifecycle.advance(current.state, 'EXECUTE');
    if (current.state.lifecyclePhase !== 'EXECUTE') throw new Error('Execution is not the current engine phase');
    const status = current.state.executorStatus[track];
    const authorizedRetry = status === 'RUNNING' && current.state.retryAuthorizations && current.state.retryAuthorizations[track];
    const expectedFingerprint = authorizedRetry ? authorizedRetry.clientFingerprint : plan.clientFingerprint;
    if (validation.fingerprint(current.packet, plan.plan) !== expectedFingerprint) throw new Error('Client repository changed since planning/diagnosis; replan before mutation');
    if (status !== 'READY' && !authorizedRetry) throw new Error('Executor already dispatched or terminal; retry requires engine diagnosis authorization');
    if (current.state.retryAuthorizations) delete current.state.retryAuthorizations[track];
    lifecycle.executor(current.state, track, 'RUNNING');
    save(current.base, current.state);
  } else if (current.state.lifecyclePhase !== 'PLAN') throw new Error('Read-only implementation planning requires PLAN');
  const result = operation === 'inspect' && adapter.inspectDetailed ? adapter.inspectDetailed(current.packet) : adapter[operation](current.packet, plan && plan.plan);
  if (result.status === 'BLOCKED') {
    lifecycle.executor(current.state, track, 'BLOCKED');
    current.state.nextAction = result.nextAction;
    current.state.safeResumeInstruction = result.nextAction;
  }
  else if (operation === 'inspect' && result.status === 'READY' && current.state.executorStatus[track] === 'BLOCKED') lifecycle.executor(current.state, track, 'READY');
  const file = path.join(current.base, 'artifacts', track, `${operation}.json`);
  runs.writeJson(file, result);
  save(current.base, current.state);
  return { track, operation, status: current.state.executorStatus[track], result, evidenceRef: file };
}

function recordValidation(clientId, runId, track, evidence) {
  const errors = schema.validate(evidence, contracts.Evidence, 'Evidence');
  if (errors.length) throw new Error(errors.join('; '));
  const current = owner(clientId, runId, track);
  if (current.state.lifecyclePhase !== 'EXECUTE' || current.state.executorStatus[track] !== 'RUNNING') throw new Error('Validation requires a dispatched RUNNING executor');
  loadPlan(current, track);
  const result = require('./executors').executor(track).validate(current.packet, evidence);
  const checked = validation.inspect(current.packet, evidence);
  result.missing.push(...checked.issues);
  result.passed = result.passed && checked.issues.length === 0;
  if (!result.passed) result.nextAction = `Validation evidence incomplete: ${result.missing.join('; ')}. Preserve artifacts and diagnose through the engine.`;
  const references = checked.files;
  const file = path.join(current.base, 'results', `${track}-validation.json`);
  runs.writeJson(file, { schemaVersion: 1, track, result, evidence, contextFingerprint: validation.planningIdentity(current.packet) });
  current.state.executorEvidence = current.state.executorEvidence || {};
  current.state.executorEvidence[track] = { ref: file, files: references, hash: context.snapshot([file, ...references]) };
  lifecycle.executor(current.state, track, result.passed ? 'PASSED' : 'FAILED');
  const resultDir = path.join(current.base, 'results', track);
  const status = current.state.executorStatus[track];
  runs.writeJson(path.join(resultDir, 'state.json'), { schemaVersion: 1, track, status, targetVersion: current.state.targetVersion,
    evidence: references, nextAction: result.nextAction, safeResumeInstruction: result.nextAction });
  const artifacts = { 'requirement-coverage': 'requirement-coverage.yaml', 'finding-dispositions': 'release-finding-dispositions.yaml',
    'deployment-checklist': 'deployment-checklist.yaml', 'before-deployment': 'before-deployment.md', 'after-deployment': 'after-deployment.md' };
  for (const entry of evidence) if (artifacts[entry.kind] && checked.documents[entry.kind]) {
    const document = checked.documents[entry.kind];
    const text = /\.yaml$/.test(artifacts[entry.kind]) ? require('./yaml').stringify(document) : document.summary;
    fs.writeFileSync(path.join(resultDir, artifacts[entry.kind]), text);
  }
  const projections = fs.readdirSync(resultDir).map((name) => path.join(resultDir, name));
  current.state.executorEvidence[track].files = [...new Set(references.concat(projections))];
  current.state.executorEvidence[track].hash = context.snapshot([file, ...current.state.executorEvidence[track].files]);
  current.state[`${track}RunRef`] = resultDir;
  current.state.trackStatus[track] = status;
  current.state.nextAction = result.passed ? 'Validate remaining executors, then verify coverage and prepare shared handover.' : result.nextAction;
  current.state.safeResumeInstruction = current.state.nextAction;
  if (current.state.tracks.every((requested) => ['PASSED', 'FAILED', 'BLOCKED'].includes(current.state.executorStatus[requested]))) lifecycle.advance(current.state, 'VALIDATE');
  save(current.base, current.state);
  return result;
}

function verifyEvidence(state) {
  const issues = [];
  for (const track of state.tracks) {
    const binding = (state.executorEvidence || {})[track];
    if (state.executorStatus[track] !== 'PASSED') issues.push(`${track}: engine executor has not PASSED validation`);
    if (!binding || context.snapshot([binding.ref, ...binding.files]) !== binding.hash) issues.push(`${track}: engine validation evidence is missing or changed`);
    else {
      const record = runs.readJson(binding.ref);
      if (!record.result.passed) issues.push(`${track}: domain validation failed`);
      const plan = (state.executorPlans || {})[track];
      if (!plan || context.snapshot([plan.ref]) !== plan.hash) issues.push(`${track}: registered plan is missing or changed`);
      if (!state.trackContextRefs || record.contextFingerprint !== validation.planningIdentity(runs.readJson(state.trackContextRefs[track]))) issues.push(`${track}: validation context changed; revalidate`);
    }
  }
  return issues;
}

function diagnose(clientId, runId, track, failure) {
  const current = owner(clientId, runId, track);
  if (!['EXECUTE', 'VALIDATE'].includes(current.state.lifecyclePhase) || !['RUNNING', 'FAILED'].includes(current.state.executorStatus[track])) throw new Error('Diagnosis requires a running or failed executor');
  if (!failure || !failure.signature || !failure.ref || !fs.existsSync(failure.ref)) throw new Error('Diagnosis requires exact failure signature and evidence');
  const budget = policy.retry(current.state, failure.signature, track);
  const result = { track, failure: { signature: failure.signature, ref: failure.ref }, budget,
    domain: require('./executors').executor(track).diagnose(current.packet, failure) };
  runs.writeJson(path.join(current.base, 'artifacts', track, `diagnosis-${budget.attempts}.json`), result);
  current.state.retryAuthorizations = current.state.retryAuthorizations || {};
  if (!budget.permitted) {
    delete current.state.retryAuthorizations[track];
    lifecycle.executor(current.state, track, 'BLOCKED');
  }
  else {
    loadPlan(current, track);
    if (current.state.lifecyclePhase === 'VALIDATE') lifecycle.advance(current.state, 'EXECUTE');
    lifecycle.executor(current.state, track, 'RUNNING');
    current.state.retryAuthorizations[track] = { signature: failure.signature, attempt: budget.attempts, clientFingerprint: validation.fingerprint(current.packet, runs.readJson(current.state.executorPlans[track].ref).plan) };
  }
  current.state.nextAction = budget.nextAction;
  current.state.safeResumeInstruction = budget.nextAction;
  save(current.base, current.state);
  return result;
}

function replan(clientId, runId, track, approvalRef) {
  const current = owner(clientId, runId, track);
  if (!approvalRef || !fs.existsSync(approvalRef)) throw new Error('Explicit developer approval is required to replan after execution');
  const approval = runs.readJson(approvalRef);
  const fields = ['decision', 'reviewer', 'runId', 'track', 'targetVersion'];
  if (Object.keys(approval).some((key) => !fields.includes(key)) || approval.decision !== 'APPROVED_FOR_REPLAN' || approval.reviewer !== 'Developer' || approval.runId !== runId || approval.track !== track || approval.targetVersion !== current.state.targetVersion) throw new Error('Replan approval does not match this run/track/target');
  if (!['EXECUTE', 'VALIDATE'].includes(current.state.lifecyclePhase) || Object.values(current.state.executorStatus).includes('RUNNING')) throw new Error('Pause running executors and preserve checkpoints before approved replanning');
  current.state.replanApproval = Object.assign({}, approval, { ref: approvalRef, hash: context.snapshot([approvalRef]) });
  lifecycle.advance(current.state, 'PLAN');
  lifecycle.executor(current.state, track, 'READY');
  if (current.state.executorPlans) delete current.state.executorPlans[track];
  if (current.state.executorEvidence) delete current.state.executorEvidence[track];
  if (current.state.retryAuthorizations) delete current.state.retryAuthorizations[track];
  current.state.status = 'REQUIREMENTS_READY';
  current.state.nextAction = `Reinspect ${track}, refresh safety proofs and register the approved replacement plan; prior retry/failure history is preserved.`;
  current.state.safeResumeInstruction = current.state.nextAction;
  save(current.base, current.state);
  return { status: 'READY', track, nextAction: current.state.nextAction };
}

module.exports = { owner, registerPlan, dispatch, recordValidation, verifyEvidence, diagnose, replan };
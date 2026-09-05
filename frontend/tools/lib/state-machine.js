'use strict';
/*
 * Deterministic workflow state machine for the dual-repository front-end Core
 * upgrade. Pure, dependency-free. Encodes the operating model:
 *
 *   REQUEST -> DOCTOR -> VALIDATE_REPOS -> INVENTORY_CLIENT -> INSPECT_CORE
 *   -> RESOLVE_PACKAGES -> DERIVE_REQUIREMENTS -> MAP_REQUIREMENTS -> PLAN
 *   -> CHECKPOINT -> EXECUTE -> BUILD_AND_FIX -> AUDIT -> VALIDATE -> REPORT
 *   -> LEARN -> COMPLETE   (with HANDOVER reachable from any phase)
 */

const STATES = [
  'REQUEST', 'DOCTOR', 'VALIDATE_REPOS', 'INVENTORY_CLIENT', 'INSPECT_CORE',
  'RESOLVE_PACKAGES', 'DERIVE_REQUIREMENTS', 'MAP_REQUIREMENTS', 'PLAN',
  'CHECKPOINT', 'EXECUTE', 'BUILD_AND_FIX', 'AUDIT', 'VALIDATE', 'REPORT',
  'LEARN', 'COMPLETE', 'HANDOVER',
];

const TRANSITIONS = {
  REQUEST: ['DOCTOR', 'HANDOVER'],
  DOCTOR: ['VALIDATE_REPOS', 'HANDOVER'],
  VALIDATE_REPOS: ['INVENTORY_CLIENT', 'HANDOVER'],
  INVENTORY_CLIENT: ['INSPECT_CORE', 'HANDOVER'],
  INSPECT_CORE: ['RESOLVE_PACKAGES', 'HANDOVER'],
  RESOLVE_PACKAGES: ['DERIVE_REQUIREMENTS', 'HANDOVER'],
  DERIVE_REQUIREMENTS: ['MAP_REQUIREMENTS', 'HANDOVER'],
  MAP_REQUIREMENTS: ['PLAN', 'HANDOVER'],
  PLAN: ['CHECKPOINT', 'HANDOVER'],           // mutation gate sits between PLAN and CHECKPOINT
  CHECKPOINT: ['EXECUTE', 'HANDOVER'],
  EXECUTE: ['BUILD_AND_FIX', 'HANDOVER'],
  BUILD_AND_FIX: ['AUDIT', 'EXECUTE', 'HANDOVER'],
  AUDIT: ['VALIDATE', 'BUILD_AND_FIX', 'HANDOVER'],
  VALIDATE: ['REPORT', 'BUILD_AND_FIX', 'HANDOVER'],
  REPORT: ['LEARN', 'HANDOVER'],
  LEARN: ['COMPLETE', 'HANDOVER'],
  HANDOVER: ['COMPLETE', 'REPORT'],
  COMPLETE: [],
};

// Phases that only inspect; client mutation is impossible here.
const READ_ONLY_PHASES = new Set([
  'REQUEST', 'DOCTOR', 'VALIDATE_REPOS', 'INVENTORY_CLIENT', 'INSPECT_CORE',
  'RESOLVE_PACKAGES', 'DERIVE_REQUIREMENTS', 'MAP_REQUIREMENTS', 'PLAN',
]);
// Phases where the CLIENT repository may be modified (Core never is).
const MUTATION_PHASES = new Set(['CHECKPOINT', 'EXECUTE', 'BUILD_AND_FIX']);

const STEP_STATUS = new Set([
  'SUCCEEDED', 'SUCCEEDED_WITH_WARNINGS', 'RETRYABLE_FAILURE',
  'BLOCKED_NEEDS_CONTEXT', 'BLOCKED_NEEDS_DEVELOPER', 'BLOCKED_NEEDS_APPROVAL',
  'FAILED_POLICY', 'FAILED_BUDGET', 'CANCELLED',
]);
const BLOCKED_STATUSES = new Set([
  'BLOCKED_NEEDS_CONTEXT', 'BLOCKED_NEEDS_DEVELOPER', 'BLOCKED_NEEDS_APPROVAL',
  'FAILED_POLICY', 'FAILED_BUDGET', 'CANCELLED',
]);

const REQUIRED_DOC_ITEMS = [
  'planCompleted', 'packageAlignmentResolved', 'clientInventoryCompleted',
  'coreInspectionCompleted', 'coreRemainedUnchanged', 'changesApplied',
  'baselineBuildsRecorded', 'targetDevelopmentBuildCompleted',
  'targetProductionBuildCompleted', 'testsCompleted', 'integrationAuditCompleted',
  'changedFilesRecorded', 'uncertaintyResolvedOrDeferred', 'finalReportGenerated',
];

function isValidTransition(from, to) {
  return Array.isArray(TRANSITIONS[from]) && TRANSITIONS[from].includes(to);
}
function nextAllowed(state) { return TRANSITIONS[state] || []; }
function isReadOnlyPhase(state) { return READ_ONLY_PHASES.has(state); }
function isMutationPhase(state) { return MUTATION_PHASES.has(state); }

/** A blocked step never silently stops: it routes to HANDOVER. */
function routeOnStepStatus(currentState, stepStatus) {
  if (!STEP_STATUS.has(stepStatus)) throw new Error('Unknown step status: ' + stepStatus);
  if (stepStatus === 'SUCCEEDED' || stepStatus === 'SUCCEEDED_WITH_WARNINGS') return { next: null, escalate: false };
  if (stepStatus === 'RETRYABLE_FAILURE') return { next: currentState, escalate: false };
  return { next: 'HANDOVER', escalate: true };
}

function documentationComplete(docStatus) {
  if (!docStatus || typeof docStatus !== 'object') return false;
  return REQUIRED_DOC_ITEMS.every((k) => docStatus[k] === true);
}

function completionStatus(runState) {
  const impl = runState.implementationComplete === true;
  const audit = runState.auditPassed === true;
  const docs = documentationComplete(runState.documentationStatus);
  if (impl && audit && docs) return 'COMPLETE';
  if (impl && !docs) return 'DOCUMENTATION_PENDING';
  if (impl && !audit) return 'AUDIT_PENDING';
  return runState.status;
}

function applyAction(runState, action) {
  runState.idempotency = runState.idempotency || {};
  if (action.idempotencyKey && runState.idempotency[action.idempotencyKey]) {
    return { applied: false, reason: 'already-applied', runState };
  }
  if (action.idempotencyKey) runState.idempotency[action.idempotencyKey] = true;
  runState.lastAction = action.name;
  return { applied: true, runState };
}

function resume(checkpoints) {
  if (!Array.isArray(checkpoints) || checkpoints.length === 0) return null;
  const valid = checkpoints.filter((c) => c && c.valid !== false);
  return valid.length ? valid[valid.length - 1] : null;
}

function shouldEscalateRepeat(attempts, maxAttemptsPerIdenticalFix) {
  return attempts >= maxAttemptsPerIdenticalFix;
}

function hasClosureInstruction(runState) {
  if (runState.status === 'COMPLETE') return true;
  return typeof runState.safeResumeInstruction === 'string' && runState.safeResumeInstruction.trim().length > 0;
}

module.exports = {
  STATES, TRANSITIONS, READ_ONLY_PHASES, MUTATION_PHASES, STEP_STATUS,
  BLOCKED_STATUSES, REQUIRED_DOC_ITEMS,
  isValidTransition, nextAllowed, isReadOnlyPhase, isMutationPhase,
  routeOnStepStatus, documentationComplete, completionStatus, applyAction,
  resume, shouldEscalateRepeat, hasClosureInstruction,
};

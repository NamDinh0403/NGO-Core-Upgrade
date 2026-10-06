'use strict';

const BLOCKED_STATUSES = new Set([
  'BLOCKED_NEEDS_CONTEXT', 'BLOCKED_NEEDS_DEVELOPER', 'BLOCKED_NEEDS_APPROVAL',
  'FAILED_POLICY', 'FAILED_BUDGET', 'CANCELLED',
]);
const STEP_STATUS = new Set(['SUCCEEDED', 'SUCCEEDED_WITH_WARNINGS', 'RETRYABLE_FAILURE', ...BLOCKED_STATUSES]);

function routeOnStepStatus(currentState, stepStatus) {
  if (!STEP_STATUS.has(stepStatus)) throw new Error('Unknown step status: ' + stepStatus);
  if (stepStatus === 'SUCCEEDED' || stepStatus === 'SUCCEEDED_WITH_WARNINGS') return { next: null, escalate: false };
  if (stepStatus === 'RETRYABLE_FAILURE') return { next: currentState, escalate: false };
  return { next: 'HANDOVER', escalate: true };
}

function documentationComplete(docStatus, requiredItems) {
  return !!docStatus && typeof docStatus === 'object' && requiredItems.every((item) => docStatus[item] === true);
}

function completionStatus(runState, requiredItems, auditRequired) {
  const implementation = runState.implementationComplete === true;
  const docs = documentationComplete(runState.documentationStatus, requiredItems);
  const audit = !auditRequired || runState.auditPassed === true;
  if (implementation && docs && audit) return 'COMPLETE';
  if (implementation && !docs) return 'DOCUMENTATION_PENDING';
  if (implementation && !audit) return 'AUDIT_PENDING';
  return runState.status;
}

function applyAction(runState, action) {
  runState.idempotency = runState.idempotency || {};
  if (action.idempotencyKey && runState.idempotency[action.idempotencyKey]) return { applied: false, reason: 'already-applied', runState };
  if (action.idempotencyKey) runState.idempotency[action.idempotencyKey] = true;
  runState.lastAction = action.name;
  return { applied: true, runState };
}

function resume(checkpoints) {
  if (!Array.isArray(checkpoints)) return null;
  const valid = checkpoints.filter((checkpoint) => checkpoint && checkpoint.valid !== false);
  return valid.length ? valid[valid.length - 1] : null;
}

function shouldEscalateRepeat(attempts, maximum) { return attempts >= maximum; }
function hasClosureInstruction(runState) {
  return runState.status === 'COMPLETE' || (typeof runState.safeResumeInstruction === 'string' && runState.safeResumeInstruction.trim().length > 0);
}

module.exports = { BLOCKED_STATUSES, STEP_STATUS, routeOnStepStatus, documentationComplete, completionStatus, applyAction, resume, shouldEscalateRepeat, hasClosureInstruction };
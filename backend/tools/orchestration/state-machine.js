'use strict';
/*
 * Deterministic workflow state machine for the Core upgrade workflow.
 * Pure, dependency-free. The orchestration authority for progression, resume,
 * idempotency, escalation, and the documentation completion gate.
 *
 * This module encodes config/agent-policy.yaml + workflows/core-upgrade/workflow.yaml
 * as executable logic so behaviour is testable (see tools/run-evals.js).
 */

const STATES = ['DISCOVERY', 'TOOL_BOOTSTRAP', 'BASELINE', 'PLAN', 'UPGRADE', 'BUILD_AND_FIX', 'TEST', 'DOCUMENT', 'HANDOVER', 'COMPLETE'];

const TRANSITIONS = {
  DISCOVERY: ['TOOL_BOOTSTRAP', 'HANDOVER'],
  TOOL_BOOTSTRAP: ['BASELINE', 'HANDOVER'],
  BASELINE: ['PLAN', 'HANDOVER'],
  PLAN: ['UPGRADE', 'HANDOVER'],
  UPGRADE: ['BUILD_AND_FIX', 'HANDOVER'],
  BUILD_AND_FIX: ['TEST', 'UPGRADE', 'HANDOVER'],
  TEST: ['DOCUMENT', 'BUILD_AND_FIX', 'HANDOVER'],
  DOCUMENT: ['HANDOVER', 'COMPLETE'],
  HANDOVER: ['COMPLETE', 'DOCUMENT'],
  COMPLETE: [],
};

const STEP_STATUS = new Set([
  'SUCCEEDED', 'RETRYABLE_FAILURE', 'BLOCKED_NEEDS_CONTEXT', 'BLOCKED_NEEDS_DEVELOPER',
  'BLOCKED_NEEDS_APPROVAL', 'FAILED_POLICY', 'FAILED_BUDGET', 'CANCELLED',
]);

const BLOCKED_STATUSES = new Set([
  'BLOCKED_NEEDS_CONTEXT', 'BLOCKED_NEEDS_DEVELOPER', 'BLOCKED_NEEDS_APPROVAL',
  'FAILED_POLICY', 'FAILED_BUDGET', 'CANCELLED',
]);

const REQUIRED_DOC_ITEMS = [
  'upgradePlanCompleted', 'changesApplied', 'restoreCompleted', 'buildCompleted',
  'testsCompleted', 'changedFilesRecorded', 'configChangesDocumented',
  'breakingChangesDocumented', 'deploymentImplicationsDocumented',
  'unresolvedIssuesDocumented', 'developerDecisionsRecorded', 'upgradeReportGenerated',
];

function isValidTransition(from, to) {
  return Array.isArray(TRANSITIONS[from]) && TRANSITIONS[from].includes(to);
}

function nextAllowed(state) {
  return TRANSITIONS[state] || [];
}

/** A blocked step never silently stops: it must route to HANDOVER. */
function routeOnStepStatus(currentState, stepStatus) {
  if (!STEP_STATUS.has(stepStatus)) {
    throw new Error('Unknown step status: ' + stepStatus);
  }
  if (stepStatus === 'SUCCEEDED') return { next: null, escalate: false }; // caller picks forward transition
  if (stepStatus === 'RETRYABLE_FAILURE') return { next: currentState, escalate: false }; // retry within budget
  // any BLOCKED_* / FAILED_* / CANCELLED
  return { next: 'HANDOVER', escalate: true };
}

/** Documentation gate: COMPLETE is impossible while any required doc item is falsy. */
function documentationComplete(docStatus) {
  if (!docStatus || typeof docStatus !== 'object') return false;
  return REQUIRED_DOC_ITEMS.every((k) => docStatus[k] === true);
}

/** Final completion gate. Returns the status the run should take. */
function completionStatus(runState) {
  const impl = runState.implementationComplete === true;
  const docs = documentationComplete(runState.documentationStatus);
  if (impl && docs) return 'COMPLETE';
  if (impl && !docs) return 'DOCUMENTATION_PENDING';
  return runState.status; // unchanged
}

/**
 * Idempotent action application. A mutating action whose idempotencyKey is
 * already recorded as applied is skipped on resume.
 */
function applyAction(runState, action) {
  runState.idempotency = runState.idempotency || {};
  if (action.idempotencyKey && runState.idempotency[action.idempotencyKey]) {
    return { applied: false, reason: 'already-applied', runState };
  }
  if (action.idempotencyKey) runState.idempotency[action.idempotencyKey] = true;
  runState.lastAction = action.name;
  return { applied: true, runState };
}

/** Resume from the most recent valid checkpoint. */
function resume(checkpoints) {
  if (!Array.isArray(checkpoints) || checkpoints.length === 0) return null;
  const valid = checkpoints.filter((c) => c && c.valid !== false);
  if (valid.length === 0) return null;
  return valid[valid.length - 1];
}

/**
 * Escalation decision for a repeated error. Prevents infinite loops:
 * once attempts for the same fix reach the budget, escalate instead of retrying.
 */
function shouldEscalateRepeat(attempts, maxAttemptsPerIdenticalFix) {
  return attempts >= maxAttemptsPerIdenticalFix;
}

/** Invariant: a blocked/terminal state must carry a resume/closure instruction. */
function hasClosureInstruction(runState) {
  if (runState.status === 'COMPLETE') return true;
  return typeof runState.safeResumeInstruction === 'string' && runState.safeResumeInstruction.trim().length > 0;
}

module.exports = {
  STATES, TRANSITIONS, STEP_STATUS, BLOCKED_STATUSES, REQUIRED_DOC_ITEMS,
  isValidTransition, nextAllowed, routeOnStepStatus, documentationComplete,
  completionStatus, applyAction, resume, shouldEscalateRepeat, hasClosureInstruction,
};

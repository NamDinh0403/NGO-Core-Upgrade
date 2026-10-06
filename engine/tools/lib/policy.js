'use strict';

const SKILL_RESULTS = new Set(['SUCCEEDED', 'SUCCEEDED_WITH_WARNINGS', 'RESEARCH_REQUIRED', 'RETRYABLE_FAILURE', 'BLOCKED_NEEDS_CONTEXT', 'BLOCKED_NEEDS_DEVELOPER', 'BLOCKED_NEEDS_APPROVAL', 'FAILED_POLICY', 'FAILED_BUDGET', 'CANCELLED']);
const PLAN_STATUSES = new Set(['READY', 'READY_WITH_ASSUMPTIONS', 'RESEARCH_REQUIRED', 'BLOCKED_NEEDS_CONTEXT', 'BLOCKED_NEEDS_DEVELOPER', 'FAILED_POLICY']);
const UNCERTAINTY_STATUS = new Set(['OPEN', 'RESEARCHING', 'RESOLVED', 'ACCEPTED_RISK', 'DEFERRED', 'REQUIRES_DEVELOPER', 'NOT_APPLICABLE']);
const IMPACTS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const executionPolicy = require('../../config/execution-policy.json');

function retry(state, signature, scope) {
  scope = scope || 'shared';
  signature = `${scope}:${signature}`;
  const attempts = Object.assign({}, state.retryAttempts || {});
  attempts[signature] = (attempts[signature] || 0) + 1;
  state.retryAttempts = attempts;
  state.retryIterations = Object.assign({}, state.retryIterations || {});
  state.retryIterations[scope] = (state.retryIterations[scope] || 0) + 1;
  const permitted = attempts[signature] <= executionPolicy.budgets.maxAttemptsPerIdenticalFix && state.retryIterations[scope] <= executionPolicy.budgets.maxBuildFixIterations;
  return { permitted, attempts: attempts[signature], nextAction: permitted ? 'Diagnose the captured failure; retry only a changed, evidenced fix.' : 'Retry budget exhausted; preserve evidence and escalate to the developer.' };
}

function blockingUncertainty(register) {
  return (register || []).filter((entry) => entry.status === 'OPEN' && ['HIGH', 'CRITICAL'].includes(entry.impact));
}
function uncertaintyBlocksMutation(register) { return blockingUncertainty(register).length > 0; }
function uncertaintyBlocksCompletion(register) { return (register || []).some((entry) => entry.status === 'OPEN' && entry.blocksCompletion === true); }
function canAcceptRisk(entry) { return !['HIGH', 'CRITICAL'].includes(entry.impact); }

function mutationGate(ctx, domainReasons) {
  ctx = ctx || {};
  const reasons = [];
  const ready = ctx.planStatus === 'READY' || (ctx.planStatus === 'READY_WITH_ASSUMPTIONS' && ctx.policyPermitsAssumptions === true);
  if (!ctx.planExists) reasons.push('no valid plan');
  if (!ready) reasons.push(`plan status '${ctx.planStatus}' does not permit mutation`);
  if (uncertaintyBlocksMutation(ctx.uncertaintyRegister)) reasons.push('unresolved HIGH/CRITICAL uncertainty');
  if (ctx.requiredCapabilitiesAvailable === false) reasons.push('required capabilities unavailable');
  if (ctx.baselineRecorded !== true) reasons.push('baseline state not recorded');
  if (ctx.rollbackCheckpointExists !== true) reasons.push('no rollback checkpoint');
  if (ctx.actionInPlan === false) reasons.push('requested action is not part of the approved plan');
  if (ctx.usingCandidateAsAuthoritative === true) reasons.push('candidate knowledge treated as authoritative');
  if (ctx.retriesExceeded === true) reasons.push('retry policy exceeded');
  if (ctx.targetInstallDuringResearch === true) reasons.push('target package installation during research');
  if (domainReasons) reasons.push(...domainReasons(ctx));
  return { permitted: reasons.length === 0, reasons };
}

module.exports = { executionPolicy, retry, SKILL_RESULTS, PLAN_STATUSES, UNCERTAINTY_STATUS, IMPACTS, blockingUncertainty, uncertaintyBlocksMutation, uncertaintyBlocksCompletion, canAcceptRisk, mutationGate };
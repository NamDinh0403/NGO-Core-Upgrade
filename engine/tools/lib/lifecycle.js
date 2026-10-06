'use strict';

const PHASES = ['DISCOVER', 'CORE_ANALYSIS', 'IMPACT_ANALYSIS', 'PLAN', 'EXECUTE', 'VALIDATE', 'REPORT'];
const EXECUTOR_STATES = ['READY', 'RUNNING', 'PASSED', 'FAILED', 'BLOCKED'];

function initialize(state) {
  state.lifecyclePhase = 'DISCOVER';
  state.lifecycleHistory = [{ phase: 'DISCOVER', at: new Date().toISOString() }];
  state.executorStatus = Object.fromEntries(state.tracks.map((track) => [track, 'READY']));
  return state;
}

function advance(state, target) {
  if (!PHASES.includes(target)) throw new Error(`Unknown lifecycle phase: ${target}`);
  const current = state.lifecyclePhase || phase(state);
  if (target === current) return state;
  const index = PHASES.indexOf(current);
  const next = PHASES.indexOf(target);
  const approvedReplan = target === 'PLAN' && ['EXECUTE', 'VALIDATE'].includes(current) && state.replanApproval && state.replanApproval.decision === 'APPROVED_FOR_REPLAN';
  if (next !== index + 1 && !(current === 'VALIDATE' && target === 'EXECUTE') && !approvedReplan) throw new Error(`Invalid lifecycle transition: ${current} -> ${target}`);
  if (target === 'EXECUTE' && !state.coreChangeSetRef) throw new Error('Execution requires a verified CoreChangeSet');
  if (target === 'VALIDATE' && state.tracks.some((track) => !['PASSED', 'FAILED', 'BLOCKED'].includes(state.executorStatus[track]))) throw new Error('Validation requires every requested executor result');
  state.lifecyclePhase = target;
  state.lifecycleHistory = state.lifecycleHistory || [];
  state.lifecycleHistory.push({ phase: target, at: new Date().toISOString() });
  return state;
}

function executor(state, track, status) {
  if (!state.tracks.includes(track) || !EXECUTOR_STATES.includes(status)) throw new Error('Invalid executor result');
  const previous = state.executorStatus[track];
  if (previous === 'PASSED' && status === 'RUNNING' && state.lifecyclePhase !== 'EXECUTE') throw new Error('Re-execution requires the engine retry transition');
  state.executorStatus[track] = status;
  return state;
}

function phase(state) {
  if (state.lifecycleHistory && state.lifecycleHistory.length) return state.lifecyclePhase;
  if (state.status === 'CREATED') return 'DISCOVER';
  if (state.status === 'BLOCKED') return 'BLOCKED';
  if (state.status === 'COMPLETE') return 'REPORT';
  if (['COVERAGE_VERIFIED', 'HANDOVER_READY'].includes(state.status)) return 'REPORT';
  const statuses = Object.values(state.executorStatus || {});
  if (statuses.includes('RUNNING')) return 'EXECUTE';
  if (state.status === 'RESULTS_COMPOSED') return 'VALIDATE';
  if (state.status === 'DELEGATED') return 'EXECUTE';
  if (state.status === 'REQUIREMENTS_READY') return 'PLAN';
  return 'CORE_ANALYSIS';
}

module.exports = { PHASES, EXECUTOR_STATES, initialize, advance, executor, phase };
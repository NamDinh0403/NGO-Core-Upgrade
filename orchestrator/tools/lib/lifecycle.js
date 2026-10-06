'use strict';

function phase(state) {
  if (state.status === 'CREATED') return 'DISCOVER';
  if (state.status === 'BLOCKED') return 'BLOCKED';
  if (state.status === 'COMPLETE') return 'REPORT';
  if (['COVERAGE_VERIFIED', 'HANDOVER_READY'].includes(state.status)) return 'REPORT';
  const statuses = Object.values(state.executorStatus || {});
  if (statuses.includes('RUNNING')) return 'EXECUTE';
  if (state.status === 'RESULTS_COMPOSED') return 'VALIDATE';
  if (state.status === 'DELEGATED') return 'EXECUTE';
  if (state.status === 'REQUIREMENTS_READY') return 'PLAN';
  return 'INGEST';
}

module.exports = { phase };
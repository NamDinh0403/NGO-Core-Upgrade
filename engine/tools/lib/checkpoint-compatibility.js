'use strict';
const shared = require('./execution-primitives');

const profiles = {
  backend: {
    phases: ['DISCOVERY', 'TOOL_BOOTSTRAP', 'BASELINE', 'PLAN', 'UPGRADE', 'BUILD_AND_FIX', 'TEST', 'DOCUMENT', 'HANDOVER', 'COMPLETE'],
    documentation: ['upgradePlanCompleted', 'changesApplied', 'restoreCompleted', 'buildCompleted', 'testsCompleted', 'changedFilesRecorded', 'configChangesDocumented', 'breakingChangesDocumented', 'deploymentImplicationsDocumented', 'unresolvedIssuesDocumented', 'developerDecisionsRecorded', 'upgradeReportGenerated'],
    extra: { BUILD_AND_FIX: ['UPGRADE'], TEST: ['BUILD_AND_FIX'], DOCUMENT: ['COMPLETE'], HANDOVER: ['DOCUMENT'] },
  },
  frontend: {
    phases: ['REQUEST', 'DOCTOR', 'VALIDATE_REPOS', 'INVENTORY_CLIENT', 'INSPECT_CORE', 'RESOLVE_PACKAGES', 'DERIVE_REQUIREMENTS', 'MAP_REQUIREMENTS', 'PLAN', 'CHECKPOINT', 'EXECUTE', 'BUILD_AND_FIX', 'AUDIT', 'VALIDATE', 'REPORT', 'LEARN', 'COMPLETE', 'HANDOVER'],
    documentation: ['planCompleted', 'packageAlignmentResolved', 'clientInventoryCompleted', 'coreInspectionCompleted', 'coreRemainedUnchanged', 'changesApplied', 'baselineBuildsRecorded', 'targetDevelopmentBuildCompleted', 'targetProductionBuildCompleted', 'testsCompleted', 'integrationAuditCompleted', 'changedFilesRecorded', 'uncertaintyResolvedOrDeferred', 'finalReportGenerated'],
    extra: { BUILD_AND_FIX: ['EXECUTE'], AUDIT: ['BUILD_AND_FIX'], VALIDATE: ['BUILD_AND_FIX'], HANDOVER: ['COMPLETE', 'REPORT'] },
    readOnly: ['REQUEST', 'DOCTOR', 'VALIDATE_REPOS', 'INVENTORY_CLIENT', 'INSPECT_CORE', 'RESOLVE_PACKAGES', 'DERIVE_REQUIREMENTS', 'MAP_REQUIREMENTS', 'PLAN'],
    mutation: ['CHECKPOINT', 'EXECUTE', 'BUILD_AND_FIX'],
  },
};

function forTrack(track) {
  const profile = profiles[track];
  if (!profile) throw new Error('Unknown checkpoint profile');
  const transitions = {};
  profile.phases.forEach((current, index) => {
    const forward = profile.phases[index + 1];
    transitions[current] = current === 'COMPLETE' ? [] : [...new Set([forward, 'HANDOVER', ...(profile.extra[current] || [])].filter((value) => value && value !== current))];
  });
  const readOnly = new Set(profile.readOnly || []), mutation = new Set(profile.mutation || []);
  return Object.assign({}, shared, {
    STATES: profile.phases, TRANSITIONS: transitions, REQUIRED_DOC_ITEMS: profile.documentation,
    READ_ONLY_PHASES: readOnly, MUTATION_PHASES: mutation,
    isValidTransition: (from, to) => (transitions[from] || []).includes(to),
    nextAllowed: (state) => transitions[state] || [],
    isReadOnlyPhase: (state) => readOnly.has(state), isMutationPhase: (state) => mutation.has(state),
    documentationComplete: (status) => shared.documentationComplete(status, profile.documentation),
    completionStatus: (state) => shared.completionStatus(state, profile.documentation, track === 'frontend'),
  });
}

module.exports = { forTrack };
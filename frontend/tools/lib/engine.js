'use strict';
const core = require('./core');
const capabilities = {
  'read-client-repository': 0, 'read-core-repository': 0, 'search-repository': 0,
  'inspect-configuration': 0, 'inspect-approved-knowledge': 0,
  'parse-package-json': 0, 'parse-lockfile': 0, 'parse-angular-workspace': 0,
  'resolve-typescript-inheritance': 0, 'create-plan': 0,
  'create-uncertainty-records': 0, 'validate-json-schema': 0, 'inspect-npm-registry-metadata': 0,
  'repository-version-control': 1, 'create-client-checkpoint': 1,
  'create-client-worktree': 1, 'install-client-dependencies': 1, 'run-package-manager': 1, 'run-tests': 1,
  'create-readonly-core-worktree': 2, 'build-angular-development': 2,
  'build-angular-production': 2, 'typecheck-typescript': 2,
  'scan-typescript-symbols': 2, 'probe-dependency-resolution': 2, 'runtime-config-trace': 3,
};

function select(ctx, gate) {
  if (ctx.requestedOperation === 'escalate' || ctx.blocked) return { skillId: 'developer-escalation', reason: 'explicit escalation or blocked state' };
  if (ctx.requestedOperation === 'learn' || ctx.workflowPhase === 'HANDOVER') return { skillId: 'learn-from-frontend-run', reason: 'run reached learning/handover' };
  if (!ctx.doctorStatus || ctx.requestedOperation === 'doctor') return { skillId: 'validate-local-repositories', reason: 'doctor / repository validation required' };
  if (String(ctx.doctorStatus).startsWith('BLOCKED')) return { skillId: 'developer-escalation', reason: `doctor blocked: ${ctx.doctorStatus}` };
  if (!ctx.clientInventoryDone) return { skillId: 'inventory-client-frontend', reason: 'client inventory required' };
  if (!ctx.coreInspectionDone) return { skillId: 'inspect-local-core', reason: 'core inspection required' };
  if (!ctx.packagesResolved) return { skillId: 'resolve-target-packages', reason: 'target package resolution required' };
  if (!ctx.requirementsDerived) return { skillId: 'derive-release-requirements', reason: 'core requirement derivation required' };
  if (!ctx.requirementsMapped) return { skillId: 'map-core-to-client', reason: 'requirement-to-client mapping required' };
  if (!ctx.planStatus || ctx.requestedOperation === 'plan') return { skillId: 'plan-frontend-upgrade', reason: 'planning required' };
  if (ctx.buildFailure) return { skillId: 'investigate-frontend-failure', reason: 'build failure signature present' };
  if (ctx.requestedOperation === 'audit') return { skillId: 'audit-frontend-integration', reason: 'integration audit requested' };
  if (ctx.requestedOperation === 'run') {
    const result = gate(ctx);
    if (result.permitted) return { skillId: 'execute-frontend-upgrade', reason: 'ready plan + mutation gate open' };
    return { skillId: 'plan-frontend-upgrade', reason: 'mutation gate closed: ' + result.reasons.join('; ') };
  }
  return { skillId: 'plan-frontend-upgrade', reason: 'default: plan before acting' };
}

const engine = require('../../../engine/tools/lib/skill-engine').create({
  root: core.ROOT, yaml: require('./yaml'), capabilities, select,
  resolve: require('../../../engine/tools/lib/locations').resolve,
  domainReasons: (ctx) => {
    const reasons = [];
    if (ctx.clientStatusKnown !== true) reasons.push('client repository status unknown');
    if (ctx.coreFingerprintRecorded !== true) reasons.push('core baseline fingerprint not recorded');
    if (ctx.planningFingerprintsMatch === false) reasons.push('client/core changed since planning fingerprints');
    return reasons;
  },
});
engine.DOCTOR_STATUSES = new Set(['READY_FOR_INVENTORY', 'READY_FOR_PLANNING', 'BLOCKED_INVALID_REQUEST', 'BLOCKED_INVALID_CLIENT_REPOSITORY', 'BLOCKED_INVALID_CORE_REPOSITORY', 'BLOCKED_VERSION_MISMATCH', 'BLOCKED_MISSING_PREREQUISITE', 'BLOCKED_NEEDS_DEVELOPER']);
engine.UNCERTAINTY_CATEGORY = new Set(['KNOWN', 'ASSUMED', 'UNCERTAIN', 'CONTRADICTORY', 'NOT_APPLICABLE']);
engine.coreUnchanged = (before, after) => {
  const differences = require('./git').diffFingerprints(before, after);
  return { unchanged: differences.length === 0, differences };
};
module.exports = engine;
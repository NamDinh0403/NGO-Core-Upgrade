'use strict';
const path = require('path');
const capabilities = {
  'read-repository': 0, 'search-repository': 0, 'search-source': 0,
  'inspect-configuration': 0, 'inspect-approved-knowledge': 0,
  'create-plan': 0, 'create-uncertainty-records': 0, 'validate-json-schema': 0,
  'inspect-npm-registry-metadata': 0, 'inspect-nuget-metadata': 0,
  'repository-version-control': 1, 'create-git-checkpoint': 1, 'create-git-worktree': 1,
  'restore-nuget-dependency-graph': 1, 'build-dotnet': 1, 'test-dotnet': 1, 'run-tests': 1,
  'run-local-dotnet-tools': 1, 'acquire-npm-package': 1, 'install-isolated-npm-dependencies': 1,
  'acquire-nuget-package': 2, 'compare-package-content': 2, 'compare-npm-package-content': 2,
  'inspect-dotnet-public-api': 2, 'compare-dotnet-public-api': 2, 'scan-csharp-symbols': 2,
  'typecheck-typescript': 2, 'scan-typescript-symbols': 2, 'inspect-angular-workspace': 2,
  'build-angular-development': 2, 'build-angular-production': 2,
  'selectively-decompile-dotnet': 3, 'inspect-dotnet-assembly-metadata': 3,
  'container-isolation': 3, 'runtime-trace': 3,
};

function select(ctx, gate) {
  if (ctx.requestedOperation === 'escalate' || ctx.blocked) return { skillId: 'developer-escalation', reason: 'explicit escalation or blocked state' };
  if (ctx.requestedOperation === 'learn' || ctx.workflowPhase === 'HANDOVER') return { skillId: 'learn-from-run', reason: 'run reached learning/handover' };
  if (!ctx.planStatus || ctx.requestedOperation === 'plan') return { skillId: 'plan-upgrade', reason: 'no valid plan or planning requested' };
  if (ctx.planStatus === 'RESEARCH_REQUIRED' || ['missing', 'contradictory', 'insufficient'].includes(ctx.versionKnowledgeStatus)) return { skillId: 'research-version', reason: 'version knowledge insufficient' };
  if (ctx.buildFailure) return { skillId: 'investigate-build-failure', reason: 'build failure signature present' };
  if (ctx.requestedOperation === 'audit-frontend' && ctx.frontendPresent) return { skillId: 'audit-frontend-integration', reason: 'front-end integration audit requested' };
  if (ctx.requestedOperation === 'analyze') return { skillId: 'analyze-client-impact', reason: 'client-impact analysis requested' };
  if (ctx.requestedOperation === 'run') {
    const result = gate(ctx);
    if (result.permitted) return { skillId: 'execute-upgrade', reason: 'ready plan + mutation gate open' };
    return { skillId: 'plan-upgrade', reason: 'mutation gate closed: ' + result.reasons.join('; ') };
  }
  return { skillId: 'plan-upgrade', reason: 'default: plan before acting' };
}

const engine = require('../../../../engine/tools/lib/skill-engine').create({
  root: path.resolve(__dirname, '..', '..', '..'),
  resolve: require('../../../../engine/tools/lib/locations').resolve,
  yaml: require('../../bootstrap/lib/yaml'), capabilities, select,
  domainReasons: (ctx) => ctx.repositoryStatusKnown === true ? [] : ['repository status unknown'],
});
engine.planningReadiness = (evidence, available) => {
  const have = new Set(available || []), missing = [];
  if (!have.has('repository-version-control')) missing.push('git');
  if (evidence && evidence.domainDotnet && !have.has('build-dotnet')) missing.push('.NET SDK');
  if (evidence && evidence.frontendPresent && !have.has('acquire-npm-package')) missing.push('npm');
  return { status: missing.length ? 'PREREQUISITES_MISSING' : 'READY_FOR_PLANNING', missingPrerequisites: missing };
};
module.exports = engine;
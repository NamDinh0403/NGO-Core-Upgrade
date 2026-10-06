'use strict';
const fs = require('fs');
const path = require('path');

function inspect(packet) {
  const clientPath = packet.client.path;
  const facts = { path: clientPath || null, manifests: [], present: false };
  if (!clientPath || !fs.existsSync(clientPath)) return facts;
  const root = fs.statSync(clientPath).isDirectory() ? clientPath : path.dirname(clientPath);
  const names = fs.readdirSync(root);
  facts.manifests = names.filter((name) => /^(package\.json|angular\.json|tsconfig(?:\.[^.]+)?\.json)$/i.test(name)).map((name) => path.join(root, name));
  facts.present = names.includes('package.json');
  if (facts.present) {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const versions = require('../../engine/tools/lib/discovery').versionFacts;
    facts.package = { engines: versions(pkg.engines), dependencies: versions(Object.assign({}, pkg.devDependencies, pkg.dependencies)) };
    facts.angular = names.includes('angular.json');
    facts.typescript = names.some((name) => /^tsconfig.*\.json$/i.test(name));
  }
  return facts;
}

function plan(packet) {
  return { track: 'frontend', requiresSemanticReview: true, facts: inspect(packet), requirements: packet.requirements,
    shared: packet.upgrade.sharedRequirements, api: packet.upgrade.integration.apiHints,
    skill: 'frontend/skills/plan-frontend-upgrade/SKILL.md',
    verification: ['installed-dependencies', 'toolchain', 'development-build', 'production-build', 'tests', 'integration-audit', 'core-unchanged', 'requirement-coverage', 'finding-dispositions', 'deployment-checklist', 'documentation'] };
}

function execute(packet, implementationPlan) {
  return { track: 'frontend', status: 'RUNNING', changes: implementationPlan.changes,
    skill: 'frontend/skills/execute-frontend-upgrade/SKILL.md',
    nextAction: 'Apply only the registered client changes; preserve custom routes/providers, validate exact installed dependencies, development/production builds and integration, then return evidence to the engine.' };
}

function validate(packet, evidence) {
  const required = plan(packet).verification;
  const issues = required.filter((kind) => !(evidence || []).some((entry) => entry.kind === kind && entry.status === 'PASSED' && entry.ref && fs.existsSync(entry.ref)));
  for (const entry of evidence || []) if (entry.status === 'FAILED') issues.push(entry.kind);
  return { passed: issues.length === 0, missing: [...new Set(issues)],
    nextAction: issues.length ? `Frontend verification incomplete: ${issues.join(', ')}. Diagnose within the shared retry policy; Core remains read-only.` : 'Frontend evidence passed; return to engine validation.' };
}

function diagnose(packet, failure) {
  return { skill: 'frontend/skills/investigate-frontend-failure/SKILL.md', signature: failure.signature,
    requiredEvidence: ['installed dependency graph', 'development/production/typecheck log', 'smallest affected route/provider/template slice'],
    nextAction: 'Interpret dependency or integration compatibility; apply only an evidenced in-plan fix, otherwise return to shared planning.' };
}

function inspectRequest(flags) {
  const exitCode = require('./read-only-analysis').startCmd(flags);
  return { track: 'frontend', status: exitCode === 0 ? 'READY' : 'BLOCKED', exitCode,
    nextAction: exitCode === 0 ? 'Complete frontend implementation mapping and register the plan with the engine.' : 'Resolve the recorded frontend inspection blocker and resume through the engine.' };
}

function inspectDetailed(packet) {
  const changeSet = JSON.parse(fs.readFileSync(packet.upgrade.coreChangeSet.ref, 'utf8'));
  return inspectRequest({ context: path.join(path.dirname(packet.upgrade.coreChangeSet.ref), 'contexts', 'frontend.json'),
    'client-id': packet.upgrade.run.clientId, run: packet.upgrade.run.runId,
    'client-path': packet.client.path, 'core-path': changeSet.source.corePath,
    'source-version': packet.upgrade.target.sourceVersion, 'target-version': packet.upgrade.target.targetVersion });
}

function prerequisites() {
  const cp = require('child_process');
  const missing = [];
  if (cp.spawnSync(process.execPath, ['--version'], { encoding: 'utf8', timeout: 30000 }).status !== 0) missing.push('node');
  for (const command of ['git', 'npm']) if (cp.spawnSync(command, ['--version'], { encoding: 'utf8', windowsHide: true, shell: process.platform === 'win32', timeout: 30000 }).status !== 0) missing.push(command);
  return { ready: missing.length === 0, missing };
}

module.exports = { inspect, inspectRequest, inspectDetailed, plan, execute, validate, diagnose, prerequisites, mutationGate: (facts) => require('./lib/engine').mutationGate(facts) };
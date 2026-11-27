'use strict';
const fs = require('fs');
const path = require('path');
const { acceptableStatus } = require('../../engine/tools/lib/validation');

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
    consumerCompatibility: require('./lib/browse-filter-layout').forPacket(packet),
    skill: 'frontend/skills/plan-frontend-upgrade/SKILL.md',
    testPolicy: 'Skip unit/browser/regression suites by default; record tests as SKIPPED with the reason. Run existing targeted tests only when explicitly requested or needed to diagnose a concrete regression. Do not create test/probe projects.',
    verification: ['installed-dependencies', 'toolchain', 'development-build', 'production-build', 'tests', 'integration-audit', 'core-unchanged', 'requirement-coverage', 'finding-dispositions', 'deployment-checklist', 'documentation'] };
}

function execute(packet, implementationPlan) {
  return { track: 'frontend', status: 'RUNNING', changes: implementationPlan.changes,
    skill: 'frontend/skills/execute-frontend-upgrade/SKILL.md',
    nextAction: 'Apply only the registered client changes; preserve custom routes/providers, validate exact installed dependencies, development/production builds and integration, record optional tests as SKIPPED with the reason, then return evidence to the engine.' };
}

function validate(packet, evidence) {
  const inspection = plan(packet);
  const required = inspection.verification;
  const issues = required.filter((kind) => !(evidence || []).some((entry) => entry.kind === kind && acceptableStatus(entry) && entry.ref && fs.existsSync(entry.ref)));
  issues.push(...inspection.consumerCompatibility.issues);
  for (const entry of evidence || []) if (entry.status === 'FAILED') issues.push(entry.kind);
  return { passed: issues.length === 0, missing: [...new Set(issues)],
    nextAction: issues.length ? `Frontend verification incomplete: ${issues.join(', ')}. Diagnose within the shared retry policy; Core remains read-only.` : 'Frontend evidence passed; return to engine validation.' };
}

function planIssues(packet, implementationPlan) {
  return require('./lib/browse-filter-layout').forPacket(packet).consumers
    .filter((consumer) => consumer.issues.length && !implementationPlan.changes.some((change) => change.file.replace(/\\/g, '/') === consumer.file))
    .map((consumer) => `${consumer.file}: required browse-filter migration is absent from the plan`);
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
  const root = changeSet.source.corePath;
  const frontendCorePath = fs.existsSync(path.join(root, 'ngo-client-core', 'package.json'))
    ? path.join(root, 'ngo-client-core') : root;
  const mappingsPath = path.resolve(__dirname, '..', '..', 'ingest', 'config', 'approved-release-ref-mappings.json');
  let targetRef = null;
  if (fs.existsSync(mappingsPath)) {
    const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
    const approved = mappings.mappings && mappings.mappings[packet.upgrade.target.targetVersion];
    if (approved && approved.decision === 'APPROVED') targetRef = approved.ref;
  }
  return inspectRequest({ context: path.join(path.dirname(packet.upgrade.coreChangeSet.ref), 'contexts', 'frontend.json'),
    'client-id': packet.upgrade.run.clientId, run: packet.upgrade.run.runId,
    'client-path': packet.client.path, 'core-path': frontendCorePath,
    'shared-core-path': root,
    'target-ref': targetRef,
    'source-version': packet.upgrade.target.sourceVersion, 'target-version': packet.upgrade.target.targetVersion });
}

function prerequisites() {
  const cp = require('child_process');
  const missing = [];
  if (cp.spawnSync(process.execPath, ['--version'], { encoding: 'utf8', timeout: 30000 }).status !== 0) missing.push('node');
  for (const command of ['git', 'npm']) if (cp.spawnSync(command, ['--version'], { encoding: 'utf8', windowsHide: true, shell: process.platform === 'win32', timeout: 30000 }).status !== 0) missing.push(command);
  return { ready: missing.length === 0, missing };
}

module.exports = { inspect, inspectRequest, inspectDetailed, plan, planIssues, execute, validate, diagnose, prerequisites, mutationGate: (facts) => require('./lib/engine').mutationGate(facts) };
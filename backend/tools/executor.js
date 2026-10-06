'use strict';
const fs = require('fs');
const path = require('path');

function inspect(packet) {
  const clientPath = packet.client.path;
  const facts = { path: clientPath || null, manifests: [], present: false };
  if (!clientPath || !fs.existsSync(clientPath)) return facts;
  const root = fs.statSync(clientPath).isDirectory() ? clientPath : path.dirname(clientPath);
  const names = fs.readdirSync(root);
  facts.manifests = names.filter((name) => /\.(sln|slnx|csproj|fsproj)$|^global\.json$|^Directory\.(Packages|Build)\.props$/i.test(name)).map((name) => path.join(root, name));
  facts.present = facts.manifests.some((name) => /\.(sln|slnx|csproj|fsproj)$/i.test(name));
  if (names.includes('global.json')) {
    const sdk = JSON.parse(fs.readFileSync(path.join(root, 'global.json'), 'utf8')).sdk;
    const modes = ['disable', 'patch', 'feature', 'minor', 'major', 'latestPatch', 'latestFeature', 'latestMinor', 'latestMajor'];
    facts.sdk = sdk ? { version: require('../../engine/tools/lib/discovery').versionFacts({ version: sdk.version }).version, rollForward: modes.includes(sdk.rollForward) ? sdk.rollForward : null, allowPrerelease: sdk.allowPrerelease === true } : {};
  }
  return facts;
}

function plan(packet) {
  return { track: 'backend', requiresSemanticReview: true, facts: inspect(packet), requirements: packet.requirements,
    shared: packet.upgrade.sharedRequirements, api: packet.upgrade.integration.apiHints,
    skill: 'backend/skills/plan-upgrade/SKILL.md',
    verification: ['installed-core-assemblies', 'installed-public-api', 'restore', 'build', 'tests', 'configuration', 'requirement-coverage', 'finding-dispositions', 'deployment-checklist', 'documentation'] };
}

function execute(packet, implementationPlan) {
  return { track: 'backend', status: 'RUNNING', changes: implementationPlan.changes,
    skill: 'backend/skills/execute-upgrade/SKILL.md',
    nextAction: 'Inspect actual installed NGO.Core assemblies/public API, apply only the registered backend changes, then restore/build/test and return evidence to the engine.' };
}

function validate(packet, evidence) {
  const required = plan(packet).verification;
  const issues = required.filter((kind) => !(evidence || []).some((entry) => entry.kind === kind && entry.status === 'PASSED' && entry.ref && fs.existsSync(entry.ref)));
  for (const entry of evidence || []) if (entry.status === 'FAILED') issues.push(entry.kind);
  return { passed: issues.length === 0, missing: [...new Set(issues)],
    nextAction: issues.length ? `Backend verification incomplete: ${issues.join(', ')}. Preserve installed-surface/build evidence; diagnose within the shared retry policy.` : 'Backend evidence passed; return to engine validation.' };
}

function diagnose(packet, failure) {
  return { skill: 'backend/skills/investigate-build-failure/SKILL.md', signature: failure.signature,
    requiredEvidence: ['installed Core public API', 'restore/build/test log', 'smallest affected C# or EF/configuration slice'],
    nextAction: 'Interpret installed-surface compatibility; apply only an evidenced in-plan fix, otherwise return to shared planning.' };
}

function prerequisites() {
  const missing = ['git', 'dotnet'].filter((command) => require('child_process').spawnSync(command, ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 30000 }).status !== 0);
  return { ready: missing.length === 0, missing };
}

module.exports = { inspect, plan, execute, validate, diagnose, prerequisites, mutationGate: (facts) => require('./skills/lib/engine').mutationGate(facts) };
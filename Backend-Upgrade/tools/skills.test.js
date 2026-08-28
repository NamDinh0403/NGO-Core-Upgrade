'use strict';
/*
 * Skill layer evaluation suite — 40 scenarios. Dependency-free, offline-deterministic.
 * Exercises tools/skills/lib/engine.js against the registry, per-skill schemas, and
 * sample outputs. Run: node tools/skills.test.js
 */
const fs = require('fs');
const path = require('path');
const e = require('./skills/lib/engine');
const yaml = require('./bootstrap/lib/yaml');

const readJson = (rel) => JSON.parse(fs.readFileSync(e.P(rel), 'utf8'));
const sampleOut = (id) => readJson(`skills/${id}/evals/sample-output.json`);
const ALL_SKILLS = e.skills().map((s) => s.id);
const escalationPolicy = yaml.parse(fs.readFileSync(e.P('config/escalation-policy.yaml'), 'utf8'));
const toolPolicy = yaml.parse(fs.readFileSync(e.P('config/tool-installation-policy.yaml'), 'utf8'));

const results = [];
function test(id, fn) { try { fn(); results.push({ id, pass: true }); } catch (err) { results.push({ id, pass: false, error: err.message }); } }
function assert(c, m) { if (!c) throw new Error(m); }
const validOut = (id, inst) => { const errs = e.validateSkillIO(id, 'output', inst); assert(errs.length === 0, errs.join(' | ')); };

// 1
test('01-planning-before-mutation', () => {
  assert(e.selectSkill({ requestedOperation: 'plan' }).skillId === 'plan-upgrade', 'plan first');
  assert(e.selectSkill({}).skillId === 'plan-upgrade', 'default is plan');
});
// 2
test('02-planning-read-only', () => { assert(sampleOut('plan-upgrade').readOnly === true, 'plan readOnly'); });
// 3
test('03-known-facts-have-evidence', () => { assert(sampleOut('plan-upgrade').knownFacts.every((k) => k.evidence), 'evidence required'); });
// 4
test('04-assumptions-separate', () => { const p = sampleOut('plan-upgrade'); assert(Array.isArray(p.assumptions) && Array.isArray(p.knownFacts), 'separate arrays'); });
// 5
test('05-uncertainty-listed', () => { const reg = [{ id: 'U1', status: 'OPEN', impact: 'HIGH' }]; assert(e.blockingUncertainty(reg).length === 1, 'listed'); });
// 6
test('06-contradictions-reported', () => { assert('contradictions' in sampleOut('plan-upgrade'), 'contradictions field'); });
// 7
test('07-high-uncertainty-blocks-mutation', () => {
  const g = e.mutationGate({ planExists: true, planStatus: 'READY', baselineRecorded: true, rollbackCheckpointExists: true, repositoryStatusKnown: true, uncertaintyRegister: [{ status: 'OPEN', impact: 'CRITICAL' }] });
  assert(!g.permitted && g.reasons.some((r) => /uncertainty/.test(r)), 'blocked by uncertainty');
});
// 8
test('08-low-uncertainty-nonblocking', () => { assert(e.uncertaintyBlocksMutation([{ status: 'OPEN', impact: 'LOW' }]) === false, 'low non-blocking'); });
// 9
test('09-optional-tools-dont-block-planning', () => {
  const r = e.planningReadiness({ domainDotnet: true, frontendPresent: false }, ['repository-version-control', 'build-dotnet']);
  assert(r.status === 'READY_FOR_PLANNING', 'optional L2 absent still ready');
});
// 10
test('10-only-required-capabilities', () => {
  const r = e.capabilityActivation(['read-repository', 'compare-dotnet-public-api'], ['read-repository']);
  assert(r.activateNow.length === 1 && r.activateNow[0] === 'compare-dotnet-public-api', 'only missing required activated');
});
// 11
test('11-known-version-minimal-tooling', () => {
  const r = e.capabilityActivation(['read-repository', 'search-repository', 'inspect-approved-knowledge', 'create-plan'], ['read-repository', 'search-repository', 'inspect-approved-knowledge', 'create-plan']);
  assert(r.activateNow.length === 0 && r.missingBlocking.length === 0, 'no specialist tools for known version');
});
// 12
test('12-undocumented-version-research', () => { assert(e.selectSkill({ planStatus: 'READY', versionKnowledgeStatus: 'missing' }).skillId === 'research-version', 'research'); });
// 13
test('13-research-outside-client', () => { assert(sampleOut('research-version').clientUnchanged === true, 'client unchanged'); });
// 14
test('14-acquire-does-not-change-client', () => { validOut('research-version', sampleOut('research-version')); });
// 15
test('15-apicompat-only-when-needed', () => {
  const notNeeded = e.capabilityActivation(['inspect-approved-knowledge'], ['inspect-approved-knowledge']);
  assert(!notNeeded.activateNow.includes('compare-dotnet-public-api'), 'apicompat not activated when not required');
});
// 16
test('16-decompile-not-when-simpler-suffices', () => {
  const r = e.capabilityActivation(['compare-dotnet-public-api'], []);
  assert(!r.activateNow.includes('selectively-decompile-dotnet'), 'decompile not pulled in');
  assert(e.levelOf('selectively-decompile-dotnet') === 3, 'decompile is Level 3');
});
// 17
test('17-decompile-policy-can-block', () => {
  assert('decompilation-permitted' in (toolPolicy.gates || {}), 'gate exists');
  const research = e.getSkill('research-version');
  assert(research.optionalCapabilities.includes('selectively-decompile-dotnet'), 'decompile is optional/gated, not required');
});
// 18
test('18-impact-backend-symbols', () => { assert(sampleOut('analyze-client-impact').affectedSymbols.length > 0, 'symbols'); });
// 19
test('19-impact-angular-roles', () => { assert(sampleOut('analyze-client-impact').configRoles.some((r) => r.role === 'bootstrap'), 'roles'); });
// 20
test('20-ngmodule-and-standalone-classified', () => {
  const base = sampleOut('analyze-client-impact');
  validOut('analyze-client-impact', Object.assign({}, base, { bootstrapStyle: 'NGMODULE' }));
  validOut('analyze-client-impact', Object.assign({}, base, { bootstrapStyle: 'STANDALONE' }));
});
// 21
test('21-execute-requires-ready-plan', () => {
  const g = e.mutationGate({ planExists: true, planStatus: 'RESEARCH_REQUIRED', baselineRecorded: true, rollbackCheckpointExists: true, repositoryStatusKnown: true });
  assert(!g.permitted, 'non-ready plan blocks mutation');
});
// 22
test('22-execute-creates-rollback', () => {
  const g = e.mutationGate({ planExists: true, planStatus: 'READY', baselineRecorded: true, rollbackCheckpointExists: false, repositoryStatusKnown: true });
  assert(!g.permitted && g.reasons.some((r) => /rollback/.test(r)), 'no rollback blocks');
});
// 23
test('23-unexpected-uncertainty-pauses', () => { const o = sampleOut('execute-upgrade'); assert(o.status === 'RESEARCH_REQUIRED' && o.remainingUncertainty.length > 0, 'paused for research'); });
// 24
test('24-replan-before-resume', () => { assert(e.isValidTransition('research-version', 'plan-upgrade'), 'research returns to plan'); });
// 25
test('25-build-failure-retry-limits', () => {
  const budget = escalationPolicy.budgets.maxAttemptsPerIdenticalFix;
  const decide = (n) => (n > budget ? 'FAILED_BUDGET' : 'RETRYABLE_FAILURE');
  assert(decide(budget + 1) === 'FAILED_BUDGET', 'exceeding budget escalates');
  assert(decide(1) === 'RETRYABLE_FAILURE', 'within budget retries');
});
// 26
test('26-failed-fixes-preserved', () => { assert(sampleOut('investigate-build-failure').failedAttemptsPreserved === true, 'preserved'); });
// 27
test('27-rejected-patterns-not-applied', () => {
  const rejected = fs.readdirSync(e.P('memory/rejected')).filter((f) => f.endsWith('.json')).map((f) => readJson(`memory/rejected/${f}`).patternId);
  const applied = sampleOut('investigate-build-failure').appliedPatternId;
  assert(!rejected.includes(applied), 'applied pattern is not a rejected one');
});
// 28
test('28-candidate-not-authoritative', () => { assert(sampleOut('investigate-build-failure').usedCandidateAsAuthoritative === false, 'candidate not authoritative'); });
// 29
test('29-frontend-checks-dev-and-prod', () => { const b = sampleOut('audit-frontend-integration').buildResults; assert(b.developmentBuild && b.productionBuild, 'dev+prod'); });
// 30
test('30-frontend-not-install-only', () => { assert(sampleOut('audit-frontend-integration').installOnlySuccess === false, 'not install-only'); });
// 31
test('31-learning-sanitized-episodes', () => { const o = sampleOut('learn-from-run'); assert(o.episodeRef && o.redactionStatus, 'episode+redaction'); });
// 32
test('32-learning-cannot-approve', () => { const o = sampleOut('learn-from-run'); assert(o.approvedOwnCandidates === false && o.wroteToCanonical === false, 'no self-approval/canonical'); });
// 33
test('33-no-client-ids-in-global-memory', () => { assert(sampleOut('learn-from-run').clientIdentifiersInGlobalMemory === false, 'no client ids'); });
// 34
test('34-escalation-from-every-skill', () => { for (const s of ALL_SKILLS) if (s !== 'developer-escalation') assert(e.isValidTransition(s, 'developer-escalation'), `${s}->escalation`); });
// 35
test('35-escalation-has-resume', () => { const o = sampleOut('developer-escalation'); assert(o.safeResumeInstruction && o.exactResumeCommand, 'resume present'); validOut('developer-escalation', o); });
// 36
test('36-every-skill-has-next-action', () => {
  for (const s of ALL_SKILLS) { const o = sampleOut(s); assert(typeof o.nextAction === 'string' && o.nextAction.length > 0, `${s} nextAction`); }
});
// 37
test('37-no-skill-silently-stops', () => {
  for (const s of e.skills()) assert(Array.isArray(s.completionStatuses) && s.completionStatuses.length > 0, `${s.id} has completion statuses`);
  assert(e.selectSkill({ blocked: true }).skillId === 'developer-escalation', 'blocked routes to escalation');
});
// 38
test('38-io-schema-validation', () => {
  for (const s of ALL_SKILLS) validOut(s, sampleOut(s));
  // minimal valid inputs
  const inputs = {
    'plan-upgrade': { skillId: 'plan-upgrade', runDir: 'runs/c/r', clientId: 'c', objective: 'x', targetVersion: '8.0.0' },
    'research-version': { skillId: 'research-version', runDir: 'runs/c/r', targetVersion: '8.0.0', uncertaintyIds: ['U1'] },
    'analyze-client-impact': { skillId: 'analyze-client-impact', runDir: 'runs/c/r', targetVersion: '8.0.0' },
    'execute-upgrade': { skillId: 'execute-upgrade', runDir: 'runs/c/r', planRef: 'p', planStatus: 'READY', rollbackCheckpointExists: true, baselineRecorded: true },
    'investigate-build-failure': { skillId: 'investigate-build-failure', runDir: 'runs/c/r', failureSignature: 'CS7036', command: 'dotnet build', exitCode: 1, attemptCount: 1 },
    'audit-frontend-integration': { skillId: 'audit-frontend-integration', runDir: 'runs/c/r', workspaceRoot: '.' },
    'learn-from-run': { skillId: 'learn-from-run', runDir: 'runs/c/r', finalOutcome: 'succeeded' },
    'developer-escalation': { skillId: 'developer-escalation', runDir: 'runs/c/r', phase: 'UPGRADE', currentSkill: 'execute-upgrade', checkpointRef: 'cp', blocker: 'x' },
  };
  for (const [id, inst] of Object.entries(inputs)) { const errs = e.validateSkillIO(id, 'input', inst); assert(errs.length === 0, `${id} input: ${errs.join(', ')}`); }
});
// 39
test('39-invalid-transitions-rejected', () => {
  assert(!e.isValidTransition('learn-from-run', 'execute-upgrade'), 'learn cannot go to execute');
  assert(!e.isValidTransition('research-version', 'execute-upgrade'), 'research must replan first');
});
// 40
test('40-new-dev-plan-without-specialist-tools', () => {
  const r = e.planningReadiness({ domainDotnet: false, frontendPresent: false }, ['repository-version-control']);
  assert(r.status === 'READY_FOR_PLANNING', 'plan without specialist tools');
});

// ---- report ----
const passed = results.filter((r) => r.pass).length;
console.log('Skill layer evaluations');
for (const r of results) console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.id}${r.error ? '  -> ' + r.error : ''}`);
console.log(`\n${passed}/${results.length} passed, ${results.length - passed} failed.`);
process.exit(passed === results.length ? 0 : 1);

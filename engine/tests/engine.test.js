'use strict';
const assert = require('assert');
const lifecycle = require('../tools/lib/lifecycle');
const policy = require('../tools/lib/policy');
const schema = require('../tools/lib/schema');
const state = lifecycle.initialize({ tracks: ['backend', 'frontend'], status: 'CREATED' });
assert.throws(() => lifecycle.advance(state, 'EXECUTE'), /Invalid lifecycle transition/);
for (const phase of ['CORE_ANALYSIS', 'IMPACT_ANALYSIS', 'PLAN']) lifecycle.advance(state, phase);
assert.throws(() => lifecycle.advance(state, 'EXECUTE'), /CoreChangeSet/);
state.coreChangeSetRef = 'verified';
lifecycle.advance(state, 'EXECUTE');
assert.throws(() => lifecycle.advance(state, 'VALIDATE'), /every requested executor/);
lifecycle.executor(state, 'backend', 'PASSED');
lifecycle.executor(state, 'frontend', 'BLOCKED');
lifecycle.advance(state, 'VALIDATE');
lifecycle.advance(state, 'REPORT');
assert.deepStrictEqual(state.lifecycleHistory.map((entry) => entry.phase), lifecycle.PHASES);
assert.throws(() => lifecycle.executor(state, 'database', 'PASSED'), /Invalid executor/);
assert.strictEqual(policy.mutationGate({ planExists: true, planStatus: 'READY' }).permitted, false);
assert(schema.validate({ inner: {} }, { type: 'object', properties: { inner: { required: ['evidence'] } } }).length > 0);
assert.strictEqual(require('../../orchestrator/tools/lib/lifecycle'), lifecycle);
console.log('PASS engine lifecycle, executor states, safety, nested schema and compatibility ownership');
const fs = require('fs'), os = require('os'), path = require('path');
const memory = require('../tools/lib/memory');
const memoryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'engine-memory-'));
try {
	assert.throws(() => memory.capture('frontend', { summary: 'unreviewed personal content' }, { root: memoryRoot }), /redaction review/);
	const candidate = memory.capture('frontend', { clientId: 'private-client', description: 'token=private', evidence: ['redacted build proof'] }, { root: memoryRoot, candidate: true, id: 'candidate',
		redactionReview: { reviewer: 'Agent', personalDataRemoved: true, clientBusinessRulesRemoved: true, sourceBodiesRemoved: true, evidence: 'synthetic redaction assessment' } });
	const content = fs.readFileSync(candidate.ref, 'utf8');
	assert(!content.includes('private-client') && !content.includes('token=private'));
	assert.deepStrictEqual(memory.approved('backend', memoryRoot), []);
	assert.throws(() => memory.review('frontend', 'candidate', 'APPROVE', {}, memoryRoot), /developer review/);
	memory.review('frontend', 'candidate', 'REJECT', { reviewer: 'Developer', evidenceReviewed: true, redactionVerified: true }, memoryRoot);
	assert.strictEqual(fs.existsSync(candidate.ref), false);
	assert.strictEqual(memory.approved('frontend', memoryRoot).length, 0);
} finally { fs.rmSync(memoryRoot, { recursive: true, force: true }); }
const retries = {};
assert(policy.retry(retries, 'error').permitted);
assert(policy.retry(retries, 'error').permitted);
assert.strictEqual(policy.retry(retries, 'error').permitted, false);
console.log('PASS scoped memory, redaction, developer review and shared retry budget');
const coordinator = require('../tools/lib/coordinator');
const context = require('../tools/lib/context');
const runs = require('../tools/lib/run');
const engine = require('../tools/upgrade-engine');
const executors = require('../tools/lib/executors');
const verification = require('../tools/lib/validation');
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'engine-contract-'));
const client = `engine-contract-${process.pid}`;
const runId = 'synthetic';
const write = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value)); };
const originalOutput = process.stdout.write;
const knowledge = require('../tools/lib/knowledge');
const originalStore = knowledge.defaultStore;
const originalPrerequisites = Object.fromEntries(['backend', 'frontend'].map((track) => [track, executors.executor(track).prerequisites]));
try {
	knowledge.defaultStore = () => Object.assign({}, originalStore(), { appSettings: () => [] });
	for (const track of ['backend', 'frontend']) executors.executor(track).prerequisites = () => ({ ready: true, missing: [] });
	const ingestRoot = path.join(fixture, 'ingest');
	const recordFile = path.join(ingestRoot, 'knowledge', 'candidates', 'releases', '9.2.1.json');
	write(recordFile, { version: '9.2.1', status: 'CANDIDATE', findings: { shared: [], backend: [], frontend: [] }, changes: [], facts: [], unresolvedItems: [] });
	const stub = path.join(ingestRoot, 'tools', 'ingest.js');
	write(stub, "let count=0;exports.count=()=>count;exports.ensureReleases=(flags)=>{count++;const path=require('path'),fs=require('fs');const file=path.join(flags.out,'9.2.1.json');return {reused:true,entries:[{path:file,record:JSON.parse(fs.readFileSync(file,'utf8'))}]};};");
	const backend = path.join(fixture, 'backend'), frontend = path.join(fixture, 'frontend'), coreRoot = path.join(fixture, 'core');
	fs.mkdirSync(coreRoot);
	write(path.join(backend, 'project.csproj'), '<Project Sdk="Microsoft.NET.Sdk" />');
	write(path.join(frontend, 'package.json'), { dependencies: { 'ngo-core': '9.2.0', '@angular/core': '15.2.10' } });
	for (const directory of [backend, frontend, coreRoot]) {
		const initialized = require('child_process').spawnSync('git', ['init', directory], { encoding: 'utf8' });
		assert.strictEqual(initialized.status, 0);
		const cp = require('child_process');
		assert.strictEqual(cp.spawnSync('git', ['-C', directory, 'add', '.'], { encoding: 'utf8' }).status, 0);
		assert.strictEqual(cp.spawnSync('git', ['-C', directory, '-c', 'user.name=Synthetic Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-m', 'synthetic baseline'], { encoding: 'utf8' }).status, 0);
	}
	process.stdout.write = () => true;
	assert.strictEqual(engine.cmdCreateRun({ client, tracks: 'backend,frontend', 'run-id': runId, 'core-path': coreRoot, 'ingest-root': ingestRoot, 'source-version': '9.2.0', 'target-version': '9.2.1', 'backend-client-path': backend, 'frontend-client-path': frontend }), 0);
	const base = runs.runDir(client, runId);
	const initial = runs.readJson(path.join(base, 'state.json'));
	assert.strictEqual(initial.executionContract, 'ENGINE');
	assert(coordinator.verifyEvidence(initial).some((issue) => /missing/.test(issue)), 'new run cannot complete through legacy result composition');
	assert.deepStrictEqual(initial.lifecycleHistory.map((entry) => entry.phase), lifecycle.PHASES.slice(0, 4));
	assert.throws(() => coordinator.dispatch(client, runId, 'backend', 'execute'), /plan/);
	const facts = { baselineRecorded: true, rollbackCheckpointExists: true, repositoryStatusKnown: true, clientStatusKnown: true, coreFingerprintRecorded: true, actionInPlan: true, requiredCapabilitiesAvailable: true };
	assert.strictEqual(coordinator.registerPlan(client, runId, 'frontend', { status: 'READY', changes: [] }, Object.assign({}, facts, { coreFingerprintRecorded: false })).permitted, false);
	assert.throws(() => coordinator.dispatch(client, runId, 'frontend', 'execute'), /READY|Safety proof/);
	for (const track of ['backend', 'frontend']) {
		const packet = context.consumeTrackContext(initial.trackContextRefs[track], track);
		const proofRefs = ['baseline', 'rollback-checkpoint', 'repository-status', 'capabilities', 'uncertainty'].concat(track === 'frontend' ? ['core-fingerprint'] : []).map((kind) => {
			const log = path.join(base, 'artifacts', track, 'proofs', `${kind}.log`);
			const ref = path.join(base, 'artifacts', track, 'proofs', `${kind}.json`);
			write(log, `synthetic ${kind} proof`);
			write(ref, verification.envelope(packet, kind, { summary: `synthetic ${kind} proof`, command: 'synthetic baseline check', exitCode: 0, artifacts: [log], capabilities: ['synthetic-verified-capability'], missingCapabilities: [], uncertainties: [],
				clientFingerprint: verification.fingerprint(packet, { changes: [] }), coreFingerprint: verification.coreFingerprint(packet), commit: verification.head(track === 'backend' ? backend : frontend) }));
			return { kind, ref };
		});
		const registered = coordinator.registerPlan(client, runId, track, { status: 'READY', changes: [] }, Object.assign({}, facts, { proofRefs }));
		assert.strictEqual(registered.permitted, true, registered.reasons.join('; '));
		const result = coordinator.dispatch(client, runId, track, 'plan');
		assert.strictEqual(result.result.track, track);
		assert(!JSON.stringify(result.result.facts).includes(track === 'backend' ? '@angular' : 'csproj'));
	}
	const planFile = path.join(base, 'plans', 'backend.json');
	const originalPlan = fs.readFileSync(planFile);
	fs.appendFileSync(planFile, ' ');
	assert.throws(() => coordinator.dispatch(client, runId, 'backend', 'execute'), /changed engine plan/);
	fs.writeFileSync(planFile, originalPlan);
	const projectFile = path.join(backend, 'project.csproj');
	const originalProject = fs.readFileSync(projectFile);
	fs.appendFileSync(projectFile, ' drift');
	assert.throws(() => coordinator.dispatch(client, runId, 'backend', 'execute'), /changed since planning/);
	fs.writeFileSync(projectFile, originalProject);
	const oldHead = verification.head(coreRoot);
	const changedHead = require('child_process').spawnSync('git', ['-C', coreRoot, '-c', 'user.name=Synthetic Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-m', 'synthetic revision drift'], { encoding: 'utf8' });
	assert.strictEqual(changedHead.status, 0);
	assert.throws(() => coordinator.dispatch(client, runId, 'backend', 'execute'), /Core working tree changed/);
	assert.strictEqual(require('child_process').spawnSync('git', ['-C', coreRoot, 'update-ref', 'HEAD', oldHead], { encoding: 'utf8' }).status, 0);
	const cp = require('child_process');
	const originalBranch = cp.spawnSync('git', ['-C', coreRoot, 'symbolic-ref', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
	assert.strictEqual(cp.spawnSync('git', ['-C', coreRoot, 'update-ref', 'refs/heads/synthetic-other', oldHead], { encoding: 'utf8' }).status, 0);
	assert.strictEqual(cp.spawnSync('git', ['-C', coreRoot, 'symbolic-ref', 'HEAD', 'refs/heads/synthetic-other'], { encoding: 'utf8' }).status, 0);
	assert.throws(() => coordinator.dispatch(client, runId, 'backend', 'execute'), /Core working tree changed/);
	assert.strictEqual(cp.spawnSync('git', ['-C', coreRoot, 'symbolic-ref', 'HEAD', originalBranch], { encoding: 'utf8' }).status, 0);
	for (const track of ['backend', 'frontend']) assert.strictEqual(coordinator.dispatch(client, runId, track, 'execute').status, 'RUNNING');
	assert.throws(() => coordinator.dispatch(client, runId, 'backend', 'execute'), /already dispatched/);
	assert.strictEqual(engine.cmdComposeResults({ run: `${client}/${runId}`, 'backend-run': backend }), 1);
	assert.strictEqual(require(stub).count(), 1, 'dispatch must not repeat ingestion');
	const ownerState = runs.readJson(path.join(base, 'state.json'));
	for (const track of ['backend', 'frontend']) {
		const packet = context.consumeTrackContext(ownerState.trackContextRefs[track], track);
		assert.strictEqual(executors.executor(track).validate(packet, []).passed, false);
		const evidence = executors.executor(track).plan(packet).verification.map((kind) => {
			const ref = path.join(base, 'artifacts', track, 'verification', `${kind}.json`);
			const log = path.join(base, 'artifacts', track, 'verification', `${kind}.log`);
			write(log, `synthetic ${kind} verification`);
			const documentationStatus = Object.fromEntries(require('../tools/lib/checkpoint-compatibility').forTrack(track).REQUIRED_DOC_ITEMS.map((item) => [item, true]));
			write(ref, verification.envelope(packet, kind, { summary: `synthetic ${kind} verification`, command: `synthetic-check ${kind}`, exitCode: 0, artifacts: [log], requirements: [], findings: [], items: [], documentationStatus }));
			return { kind, ref, status: 'PASSED' };
		});
		const invalid = { kind: 'build', ref: path.join(fixture, 'unrelated.log'), status: 'PASSED' };
		write(invalid.ref, 'unrelated nonempty file');
		assert(verification.inspect(packet, [invalid]).issues.length > 0);
		const docs = evidence.find((entry) => entry.kind === 'documentation');
		const originalDocs = fs.readFileSync(docs.ref);
		const pendingDocs = JSON.parse(originalDocs.toString());
		pendingDocs.documentationStatus = {};
		write(docs.ref, pendingDocs);
		assert(verification.inspect(packet, [docs]).issues.some((issue) => /Documentation completion/.test(issue)));
		fs.writeFileSync(docs.ref, originalDocs);
		assert.strictEqual(coordinator.recordValidation(client, runId, track, evidence).passed, true);
	}
	const passed = runs.readJson(path.join(base, 'state.json'));
	assert.strictEqual(passed.lifecyclePhase, 'VALIDATE');
	assert.deepStrictEqual(coordinator.verifyEvidence(passed), []);
	const projection = path.join(passed.backendRunRef, 'requirement-coverage.yaml');
	const originalProjection = fs.readFileSync(projection);
	fs.appendFileSync(projection, 'tampered: true\n');
	assert(coordinator.verifyEvidence(passed).some((issue) => /changed/.test(issue)), 'projections must be bound before coverage consumes them');
	assert.strictEqual(engine.cmdVerifyCoverage({ run: `${client}/${runId}` }), 1);
	fs.writeFileSync(projection, originalProjection);
	assert.strictEqual(engine.cmdComposeResults({ run: `${client}/${runId}` }), 0);
	assert.strictEqual(engine.cmdVerifyCoverage({ run: `${client}/${runId}` }), 0);
	assert.strictEqual(engine.cmdPrepareHandover({ run: `${client}/${runId}` }), 0);
	assert.strictEqual(engine.cmdFinalReport({ run: `${client}/${runId}` }), 0);
	const reported = runs.readJson(path.join(base, 'state.json'));
	assert.strictEqual(reported.status, 'COMPLETE', reported.nextAction);
	const installed = passed.executorEvidence.backend.files[0];
	fs.appendFileSync(installed, ' drift');
	assert(coordinator.verifyEvidence(passed).some((issue) => /changed/.test(issue)));
	assert.throws(() => coordinator.dispatch(client, runId, 'frontend', 'execute'), /current engine phase/);
	const failed = runs.readJson(path.join(base, 'state.json'));
	failed.lifecyclePhase = 'VALIDATE';
	failed.executorStatus.backend = 'FAILED';
	runs.writeJson(path.join(base, 'state.json'), failed);
	const failure = { signature: 'SYNTHETIC_BUILD_ERROR', ref: installed };
	assert.strictEqual(coordinator.diagnose(client, runId, 'backend', failure).budget.permitted, true);
	assert.strictEqual(coordinator.dispatch(client, runId, 'backend', 'execute').status, 'RUNNING');
	assert.throws(() => coordinator.dispatch(client, runId, 'backend', 'execute'), /already dispatched/);
	assert.strictEqual(coordinator.diagnose(client, runId, 'backend', failure).budget.permitted, true);
	assert.strictEqual(coordinator.diagnose(client, runId, 'backend', failure).budget.permitted, false);
	const blocked = runs.readJson(path.join(base, 'state.json'));
	assert.strictEqual(blocked.executorStatus.backend, 'BLOCKED');
	assert.throws(() => coordinator.dispatch(client, runId, 'backend', 'execute'), /already dispatched/);
	assert(coordinator.verifyEvidence(blocked).some((issue) => /not PASSED/.test(issue)));
	assert.throws(() => coordinator.replan(client, runId, 'backend'), /Explicit developer approval/);
	const approvalRef = path.join(base, 'artifacts', 'backend', 'replan-approval.json');
	write(approvalRef, { decision: 'APPROVED_FOR_REPLAN', reviewer: 'Developer', runId, track: 'backend', targetVersion: '9.2.1' });
	assert.strictEqual(coordinator.replan(client, runId, 'backend', approvalRef).status, 'READY');
	const replanned = runs.readJson(path.join(base, 'state.json'));
	assert.strictEqual(replanned.lifecyclePhase, 'PLAN');
	assert.deepStrictEqual(replanned.retryAttempts, blocked.retryAttempts);
	assert.throws(() => coordinator.dispatch(client, runId, 'backend', 'execute'), /plan/);
} finally {
	for (const track of ['backend', 'frontend']) executors.executor(track).prerequisites = originalPrerequisites[track];
	knowledge.defaultStore = originalStore;
	process.stdout.write = originalOutput;
	fs.rmSync(path.join(runs.RUNS_ROOT, client), { recursive: true, force: true });
	fs.rmSync(fixture, { recursive: true, force: true });
}
console.log('PASS one-ingestion engine dispatch, registered plans, domain isolation, strong verification and evidence drift');
const repository = path.resolve(__dirname, '..', '..');
function runtimeFiles(directory) {
	const result = [];
	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		if (['tests', 'runs', 'node_modules'].includes(entry.name)) continue;
		const file = path.join(directory, entry.name);
		if (entry.isDirectory()) result.push(...runtimeFiles(file));
		else if (entry.name.endsWith('.js') && !/\.test\.js$/.test(entry.name)) result.push(file);
	}
	return result;
}
for (const track of ['backend', 'frontend']) {
	const other = track === 'backend' ? 'frontend' : 'backend';
	for (const file of runtimeFiles(path.join(repository, track, 'tools'))) {
		const text = fs.readFileSync(file, 'utf8');
		assert(!new RegExp("require\\(['\"][^'\"]*(?:" + other + "|orchestrator)/").test(text), `${file}: forbidden runtime dependency`);
	}
	const skillFile = path.join(repository, track, 'tools', track === 'backend' ? 'skills/lib/engine.js' : 'lib/engine.js');
	const source = fs.readFileSync(skillFile, 'utf8');
	assert(source.includes('engine/tools/lib/skill-engine'));
	assert(!/function (mutationGate|blockingUncertainty|capabilityActivation|validate)\(/.test(source));
	const checkpoint = path.join(repository, track, 'tools', track === 'backend' ? 'orchestration/state-machine.js' : 'lib/state-machine.js');
	assert(!fs.readFileSync(checkpoint, 'utf8').includes('TRANSITIONS'), 'track must not own a state machine');
}
const yamlOwner = require('../tools/lib/yaml');
assert.strictEqual(require('../../backend/tools/bootstrap/lib/yaml'), yamlOwner);
assert.strictEqual(require('../../frontend/tools/lib/yaml'), yamlOwner);
assert.strictEqual(require('../../orchestrator/tools/lib/yaml'), yamlOwner);
assert(fs.readdirSync(require('../tools/lib/knowledge').defaultStore().RELEASES_DIR).length > 0, 'shared canonical release store must not be empty');
assert.strictEqual(require('../../backend/tools/bootstrap/lib/core').P('memory/episodes'), path.join(repository, 'engine/memory/episodes/backend'));
console.log('PASS dependency direction, one generic skill mechanism, compatibility-only FSMs, one parser and shared knowledge/memory ownership');
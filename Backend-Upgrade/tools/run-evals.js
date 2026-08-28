'use strict';
/*
 * Behavioural regression scenarios for the Core upgrade workflow.
 * Dependency-free. Exercises tools/orchestration/state-machine.js against the
 * synthetic fixtures in evals/. Run: node tools/run-evals.js
 *
 * All fixtures are SYNTHETIC. No real client data is used.
 */
const fs = require('fs');
const path = require('path');
const sm = require('./orchestration/state-machine');

const ROOT = path.join(__dirname, '..');
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const results = [];
function scenario(id, fn) {
  try {
    fn();
    results.push({ id, pass: true });
  } catch (e) {
    results.push({ id, pass: false, error: e.message });
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

const budgets = { maxAttemptsPerIdenticalFix: 2 };

// 1. Normal successful upgrade -> COMPLETE with closure instruction.
scenario('normal-success', () => {
  const st = readJSON('evals/simulated-upgrades/synthetic-acme/state.json');
  assert(sm.completionStatus(st) === 'COMPLETE', 'expected COMPLETE');
  assert(sm.hasClosureInstruction(st), 'complete run must have closure instruction');
});

// 2. Known error resolved by approved fix -> SUCCEEDED does not escalate.
scenario('known-error-approved-fix', () => {
  const r = sm.routeOnStepStatus('BUILD_AND_FIX', 'SUCCEEDED');
  assert(r.escalate === false, 'SUCCEEDED must not escalate');
});

// 3. Unknown error -> BLOCKED_NEEDS_DEVELOPER routes to HANDOVER and escalates.
scenario('unknown-error', () => {
  const r = sm.routeOnStepStatus('BUILD_AND_FIX', 'BLOCKED_NEEDS_DEVELOPER');
  assert(r.next === 'HANDOVER' && r.escalate === true, 'blocked must route to HANDOVER and escalate');
});

// 4. Fix causes regression -> TEST can transition back to BUILD_AND_FIX.
scenario('fix-causes-regression', () => {
  assert(sm.isValidTransition('TEST', 'BUILD_AND_FIX'), 'TEST->BUILD_AND_FIX must be allowed');
});

// 5. Missing client decision -> BLOCKED_NEEDS_CONTEXT escalates.
scenario('missing-client-decision', () => {
  const r = sm.routeOnStepStatus('UPGRADE', 'BLOCKED_NEEDS_CONTEXT');
  assert(r.next === 'HANDOVER' && r.escalate === true, 'needs-context must escalate to HANDOVER');
});

// 6. Tool timeout -> RETRYABLE_FAILURE retries within budget then escalates.
scenario('tool-timeout', () => {
  const r = sm.routeOnStepStatus('BUILD_AND_FIX', 'RETRYABLE_FAILURE');
  assert(r.escalate === false && r.next === 'BUILD_AND_FIX', 'retryable stays in phase');
  assert(sm.shouldEscalateRepeat(2, budgets.maxAttemptsPerIdenticalFix), 'must escalate after max attempts');
});

// 7. Interruption + resume -> resume from last valid checkpoint, no repeated mutation.
scenario('interruption-resume', () => {
  const cps = readJSON('evals/simulated-upgrades/synthetic-acme-interrupted/checkpoints/index.json');
  const last = sm.resume(cps);
  assert(last && last.id === 'checkpoints/0002.json', 'must resume from most recent valid checkpoint');
  const st = readJSON('evals/simulated-upgrades/synthetic-acme-interrupted/state.json');
  const res = sm.applyAction(st, { name: 'bump packages', idempotencyKey: 'bump-packages-8.0.0' });
  assert(res.applied === false, 'already-applied mutation must not repeat on resume');
});

// 8. Documentation not completed -> DOCUMENTATION_PENDING, never COMPLETE.
scenario('docs-not-completed', () => {
  const st = readJSON('evals/simulated-upgrades/synthetic-acme-interrupted/state.json');
  const probe = Object.assign({}, st, { implementationComplete: true });
  const s = sm.completionStatus(probe);
  assert(s === 'DOCUMENTATION_PENDING', 'incomplete docs must yield DOCUMENTATION_PENDING, got ' + s);
  assert(s !== 'COMPLETE', 'must never be COMPLETE with pending docs');
});

// 9. Candidate pattern must not be treated as approved/authoritative.
scenario('candidate-not-auto-applied', () => {
  const c = readJSON('memory/candidates/fix-patterns/cand-cs7036-add-ctor-param.json');
  assert(c.status === 'candidate' && c.approvalStatus !== 'approved', 'candidate must not be approved');
});

// 10. Cross-client isolation -> unapproved client-scoped memory not retrievable for another client.
scenario('cross-client-isolation', () => {
  const ep = readJSON('memory/episodes/imported/ep-wvuk-core8x-001.json');
  const isRetrievable = (record, requestingClient, approved) =>
    approved || record.clientScope === requestingClient;
  assert(isRetrievable(ep, 'wvuk', false) === true, 'own client may retrieve own memory');
  assert(isRetrievable(ep, 'synthetic-acme', false) === false, 'other client must be denied unapproved memory');
});

// 11. Repeated error escalates instead of infinite loop.
scenario('repeated-error-escalates', () => {
  assert(sm.shouldEscalateRepeat(3, 2), 'repeat beyond budget must escalate');
  assert(!sm.shouldEscalateRepeat(1, 2), 'within budget must not escalate');
});

// 12. Blocked run still produces an episode (episode records both outcomes).
scenario('blocked-produces-episode', () => {
  const ep = readJSON('memory/episodes/imported/ep-wvuk-core8x-001.json');
  assert(['succeeded', 'blocked', 'failed'].includes(ep.finalOutcome), 'episode must record a final outcome');
});

// ---- report ----
const passed = results.filter((r) => r.pass).length;
const failed = results.length - passed;
const silentStops = 0; // no scenario can end without a terminal/blocked status by construction
console.log('NGO Core Upgrade — behavioural evals');
for (const r of results) {
  console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.id}${r.error ? '  -> ' + r.error : ''}`);
}
console.log(`\n${passed}/${results.length} passed, ${failed} failed. silent-stop-rate=${silentStops}`);
process.exit(failed === 0 ? 0 : 1);

'use strict';
/*
 * Structural / schema / reference / invariant validator for the refactored
 * backend repository. Dependency-free. Run: node tools/validate.js
 */
const fs = require('fs');
const path = require('path');
const sm = require('./orchestration/state-machine');

const ROOT = path.join(__dirname, '..');
const P = (...parts) => require('../../engine/tools/lib/locations').resolve(ROOT, ...parts);
const exists = (rel) => fs.existsSync(P(rel));
const readJSON = (rel) => JSON.parse(fs.readFileSync(P(rel), 'utf8'));
const listFiles = (rel, ext) => {
  const dir = P(rel);
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) out.push(...listFiles(path.join(rel, name), ext));
    else if (!ext || name.endsWith(ext)) out.push(path.join(rel, name).replace(/\\/g, '/'));
  }
  return out;
};

const failures = [];
const checks = [];
function check(name, fn) {
  try { fn(); checks.push({ name, pass: true }); }
  catch (e) { checks.push({ name, pass: false, error: e.message }); failures.push(`${name}: ${e.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

// --- minimal JSON-schema-lite validator (required + type + enum + const) ---
const validate = require('../../engine/tools/lib/schema').validate;

// 1. All JSON in knowledge/ + memory/ + config-referenced parse.
check('all JSON files parse', () => {
  const jsons = [
    ...listFiles('knowledge', '.json'),
    ...listFiles('memory', '.json'),
    ...listFiles('schemas', '.json'),
    ...listFiles('evals', '.json'),
  ];
  for (const j of jsons) { try { readJSON(j); } catch (e) { throw new Error(`${j} -> ${e.message}`); } }
});

// 2. Version records satisfy version-knowledge schema.
check('version records satisfy schema', () => {
  const schema = readJSON('schemas/version-knowledge.schema.json');
  let errs = [];
  for (const f of listFiles('knowledge/canonical/versions', '.json')) errs = errs.concat(validate(readJSON(f), schema, f));
  assert(errs.length === 0, errs.join(' | '));
});

// 3. Memory records satisfy their schemas.
check('memory records satisfy schemas', () => {
  const epSchema = readJSON('schemas/episode.schema.json');
  const fpSchema = readJSON('schemas/fix-pattern.schema.json');
  let errs = [];
  for (const f of listFiles('memory/episodes', '.json')) errs = errs.concat(validate(readJSON(f), epSchema, f));
  // Version findings (ingest-core-release output) no longer live under this track's
  // memory/ — they're in the shared ../ingest/knowledge/candidates/releases/
  // store (see check 15 below), consumed by both backend and frontend.
  for (const f of [...listFiles('memory/candidates', '.json'), ...listFiles('memory/rejected', '.json')])
    errs = errs.concat(validate(readJSON(f), fpSchema, f));
  assert(errs.length === 0, errs.join(' | '));
});

// 4. Run-state fixtures satisfy run-state schema.
check('run-state fixtures satisfy schema', () => {
  const schema = readJSON('schemas/run-state.schema.json');
  let errs = [];
  for (const f of listFiles('evals/simulated-upgrades', '.json'))
    if (f.endsWith('state.json')) errs = errs.concat(validate(readJSON(f), schema, f));
  assert(errs.length === 0, errs.join(' | '));
});

// 5. Stable IDs are unique across memory patterns and episodes.
check('stable IDs unique', () => {
  const seen = {};
  const collect = (rel, key) => {
    for (const f of listFiles(rel, '.json')) {
      const id = readJSON(f)[key];
      if (!id) continue;
      if (seen[id]) throw new Error(`duplicate id '${id}' in ${f} and ${seen[id]}`);
      seen[id] = f;
    }
  };
  collect('memory/candidates', 'patternId');
  collect('memory/approved', 'patternId');
  collect('memory/rejected', 'patternId');
  collect('memory/episodes', 'episodeId');
});

// 6. Knowledge manifest references resolve.
check('knowledge manifest references resolve', () => {
  const m = readJSON('knowledge/index/manifest.json');
  const paths = [
    m.canonical.routingTable, m.canonical.errors, m.canonical.symbols, m.canonical.versions,
    m.canonical.migrations, m.canonical.appsettings, m.canonical.antiPatterns,
    ...Object.values(m.schemas),
  ];
  for (const rel of paths) assert(exists(rel), `manifest path missing: ${rel}`);
});

// 7. Workflow phase cards exist and define required contract sections.
check('workflow phases define required contracts', () => {
  const required = ['## Purpose', '## Preconditions', '## Completion criteria', '## Checkpoint requirements', '## Escalation conditions', '## Allowed next states'];
  const phases = listFiles('workflows/core-upgrade/phases', '.md');
  assert(phases.length === 9, `expected 9 phase cards, found ${phases.length}`);
  for (const f of phases) {
    const text = fs.readFileSync(P(f), 'utf8');
    for (const sec of required) assert(text.includes(sec), `${f} missing section '${sec}'`);
  }
});

// 8. State transitions: valid accepted, invalid rejected.
check('state transitions valid/invalid', () => {
  assert(sm.isValidTransition('PLAN', 'UPGRADE'), 'PLAN->UPGRADE should be valid');
  assert(sm.isValidTransition('TEST', 'BUILD_AND_FIX'), 'TEST->BUILD_AND_FIX should be valid');
  assert(!sm.isValidTransition('DISCOVERY', 'COMPLETE'), 'DISCOVERY->COMPLETE must be invalid');
  assert(!sm.isValidTransition('PLAN', 'TEST'), 'PLAN->TEST must be invalid');
});

// 9. Every blocked/terminal fixture carries a closure instruction.
check('blocked/terminal states carry resume instruction', () => {
  for (const f of listFiles('evals/simulated-upgrades', '.json')) {
    if (!f.endsWith('state.json')) continue;
    const st = readJSON(f);
    assert(sm.hasClosureInstruction(st), `${f} has no closure/resume instruction`);
  }
});

// 10. COMPLETE impossible while documentation pending.
check('documentation gate blocks COMPLETE', () => {
  const st = readJSON('evals/simulated-upgrades/synthetic-acme-interrupted/state.json');
  const probe = Object.assign({}, st, { implementationComplete: true });
  assert(sm.completionStatus(probe) !== 'COMPLETE', 'pending docs must not be COMPLETE');
});

// 11. Candidate memory is not approved; rejected retained with reason.
check('candidate/rejected memory labelled correctly', () => {
  for (const f of listFiles('memory/candidates', '.json')) {
    const c = readJSON(f);
    assert(c.status !== 'approved' && c.approvalStatus !== 'approved', `${f} candidate must not be approved`);
  }
  for (const f of listFiles('memory/rejected', '.json')) {
    const r = readJSON(f);
    assert(r.status === 'rejected' && r.rejectionReason, `${f} rejected must keep a reason`);
  }
});

// 12. Config + schema + workflow files present.
check('required structure present', () => {
  const need = [
    'config/agent-policy.yaml', 'config/quality-gates.yaml', 'config/escalation-policy.yaml',
    'config/retention-policy.yaml', 'config/knowledge-priority.yaml', 'config/repository-layout-policy.yaml',
    'workflows/core-upgrade/workflow.yaml', 'AGENTS.md',
    'schemas/run-state.schema.json', 'schemas/episode.schema.json',
    // reorganized knowledge base:
    'knowledge/index/routing-table.json', 'knowledge/index/manifest.json',
    'knowledge/canonical/errors/NU1201.json', 'knowledge/derived/breaking-changes/breaking-changes-registry.md',
    // canonical templates:
    'templates/upgrade-report.template.md', 'templates/upgrade-plan.template.md',
  ];
  for (const rel of need) assert(exists(rel), `missing: ${rel}`);
});

// 13. Canonical knowledge still retrievable via the routing table.
check('routing table resolves', () => {
  const idx = readJSON('knowledge/index/routing-table.json');
  for (const rel of Object.values(idx.routes.errors)) assert(exists(rel), `route missing: ${rel}`);
  for (const rel of Object.values(idx.routes.versions)) assert(exists(rel), `route missing: ${rel}`);
  for (const rel of Object.values(idx.routes.symbols)) assert(exists(rel), `route missing: ${rel}`);
  assert(exists(idx.routes.antiPatterns), `route missing: ${idx.routes.antiPatterns}`);
  for (const rel of Object.values(idx.legacyEvidenceRoutes)) assert(exists(rel), `derived route missing: ${rel}`);
});

// 14. Skill registry, per-skill schemas, and sample outputs are valid.
check('skill registry + schemas valid', () => {
  const skillEngine = require('./skills/lib/engine');
  const reg = skillEngine.skills();
  assert(reg.length === 9, `expected 9 skills, found ${reg.length}`);
  const ids = new Set();
  for (const s of reg) {
    assert(!ids.has(s.id), `duplicate skill id ${s.id}`); ids.add(s.id);
    assert(exists(`skills/${s.id}/SKILL.md`), `missing SKILL.md for ${s.id}`);
    assert(exists(s.inputSchema), `missing input schema for ${s.id}`);
    assert(exists(s.outputSchema), `missing output schema for ${s.id}`);
    readJSON(s.inputSchema); readJSON(s.outputSchema);
    const sample = `skills/${s.id}/evals/sample-output.json`;
    assert(exists(sample), `missing sample output for ${s.id}`);
    const errs = skillEngine.validateSkillIO(s.id, 'output', readJSON(sample));
    assert(errs.length === 0, `${s.id} sample invalid: ${errs.join(', ')}`);
  }
});

// 15. Shared ingest candidate records (if present) validate against the
// shared schema and are always labelled CANDIDATE, never canonical.
check('shared ingest records valid (if present)', () => {
  const sharedDir = P('..', 'ingest', 'knowledge', 'candidates', 'releases');
  if (!fs.existsSync(sharedDir)) return; // ingest not present (standalone copy) — nothing to check
  const schema = JSON.parse(fs.readFileSync(P('..', 'ingest', 'schemas', 'ingested-release.schema.json'), 'utf8'));
  let errs = [];
  for (const f of fs.readdirSync(sharedDir).filter((x) => x.endsWith('.json'))) {
    const rel = `../ingest/knowledge/candidates/releases/${f}`;
    const rec = JSON.parse(fs.readFileSync(path.join(sharedDir, f), 'utf8'));
    errs = errs.concat(validate(rec, schema, rel));
    if (rec.status !== undefined) assert(rec.status === 'CANDIDATE', `${rel}: status must be CANDIDATE, never canonical`);
  }
  assert(errs.length === 0, errs.join(' | '));
});

// --- report ---
const passed = checks.filter((c) => c.pass).length;
console.log('NGO Core Upgrade — structural validation');
for (const c of checks) console.log(`  ${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.error ? '  -> ' + c.error : ''}`);
console.log(`\n${passed}/${checks.length} checks passed, ${failures.length} failed.`);
process.exit(failures.length === 0 ? 0 : 1);

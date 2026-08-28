'use strict';
/*
 * Structural / reference validator for the Frontend-Upgrade agent repository.
 * Dependency-free, offline, deterministic. Node 14+.
 * Run: node tools/validate.js
 *
 * Checks:
 *   - every schemas/*.json parses and is a draft-07 object schema
 *   - every config/*.yaml parses
 *   - skills/registry.yaml parses, is internally consistent, and every referenced
 *     input schema, output schema, and evals directory exists
 *   - every skill folder has SKILL.md + input/output schemas + at least one eval
 *   - referential integrity of allowedNextSkills / allowedPrecedingSkills
 */
const fs = require('fs');
const path = require('path');
const core = require('./lib/core');
const yaml = require('./lib/yaml');
const engine = require('./lib/engine');

const P = core.P || ((...p) => path.join(core.ROOT, ...p));
const problems = [];
const fail = (m) => problems.push(m);
const readJson = (rel) => JSON.parse(fs.readFileSync(P(rel), 'utf8'));

// 1) schemas ----------------------------------------------------------------
const schemaDir = P('schemas');
for (const f of fs.readdirSync(schemaDir).filter((x) => x.endsWith('.json'))) {
  try {
    const s = JSON.parse(fs.readFileSync(path.join(schemaDir, f), 'utf8'));
    if (s.$schema && !/draft-07/.test(s.$schema)) fail(`schemas/${f}: unexpected $schema ${s.$schema}`);
    if (s.type !== 'object') fail(`schemas/${f}: top-level type should be object`);
  } catch (e) { fail(`schemas/${f}: parse error ${e.message}`); }
}

// 2) config -----------------------------------------------------------------
const configDir = P('config');
for (const f of fs.readdirSync(configDir).filter((x) => x.endsWith('.yaml'))) {
  try {
    const c = yaml.parse(fs.readFileSync(path.join(configDir, f), 'utf8'));
    if (!c || typeof c !== 'object') fail(`config/${f}: did not parse to an object`);
  } catch (e) { fail(`config/${f}: parse error ${e.message}`); }
}

// 3) registry + skills ------------------------------------------------------
let skills = [];
try { skills = engine.skills(); } catch (e) { fail(`registry: ${e.message}`); }
if (skills.length !== 12) fail(`registry: expected 12 skills, found ${skills.length}`);

const ids = skills.map((s) => s.id);
const seen = new Set();
for (const s of skills) {
  if (seen.has(s.id)) fail(`registry: duplicate skill id ${s.id}`);
  seen.add(s.id);
  const dir = `skills/${s.id}`;
  if (!core.exists(P(`${dir}/SKILL.md`))) fail(`${s.id}: missing SKILL.md`);
  for (const key of ['inputSchema', 'outputSchema']) {
    const rel = s[key];
    if (!rel) { fail(`${s.id}: registry missing ${key}`); continue; }
    if (!core.exists(P(rel))) { fail(`${s.id}: ${key} file '${rel}' missing`); continue; }
    try {
      const sc = readJson(rel);
      if (!sc.properties || !sc.properties.skillId || sc.properties.skillId.const !== s.id) {
        fail(`${s.id}: ${key} skillId const mismatch`);
      }
    } catch (e) { fail(`${s.id}: ${key} parse error ${e.message}`); }
  }
  // evals
  const evalsRel = s.evals || `${dir}/evals`;
  if (!core.exists(P(evalsRel))) fail(`${s.id}: evals directory '${evalsRel}' missing`);
  else {
    const outs = fs.readdirSync(P(evalsRel)).filter((x) => x.endsWith('.output.json'));
    if (outs.length === 0) fail(`${s.id}: no eval outputs`);
    for (const f of outs) {
      const errs = engine.validateSkillIO(s.id, 'output', readJson(`${evalsRel}/${f}`));
      if (errs.length) fail(`${s.id}/${f}: ${errs.join(' | ')}`);
    }
  }
  // completionStatuses subset of output enum
  try {
    const enumv = (readJson(s.outputSchema).properties.status || {}).enum || [];
    for (const cs of s.completionStatuses || []) {
      if (!enumv.includes(cs)) fail(`${s.id}: completionStatus '${cs}' not in output status enum`);
    }
  } catch (_) { /* reported above */ }
  // referential integrity
  for (const nx of s.allowedNextSkills || []) if (!ids.includes(nx)) fail(`${s.id}: allowedNextSkills '${nx}' unknown`);
  for (const pv of s.allowedPrecedingSkills || []) if (!ids.includes(pv)) fail(`${s.id}: allowedPrecedingSkills '${pv}' unknown`);
  if (s.id !== 'developer-escalation' && !engine.isValidTransition(s.id, 'developer-escalation')) {
    fail(`${s.id}: cannot reach developer-escalation`);
  }
}

// 4) report -----------------------------------------------------------------
if (problems.length) {
  for (const p of problems) process.stdout.write(`INVALID  ${p}\n`);
  process.stdout.write(`\n${problems.length} problem(s) found\n`);
  process.exit(1);
}
process.stdout.write('VALID  schemas, config, registry, and all 12 skills are structurally consistent\n');
process.exit(0);

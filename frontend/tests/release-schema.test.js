'use strict';
/*
 * Schema validation for canonical release knowledge.
 * Validates every release requirement, migration requirement, appsettings
 * requirement, and per-version release manifest against the JSON schemas using
 * a dependency-free schema-lite validator (required/type/enum/const/pattern/
 * items/additionalProperties). Node 14+. Run: node tests/release-schema.test.js
 */
const fs = require('fs');
const path = require('path');
const core = require('../tools/lib/core');
const store = require('../tools/lib/release-knowledge');

const schemaDir = core.P('schemas');
const load = (n) => JSON.parse(fs.readFileSync(path.join(schemaDir, n), 'utf8'));
const reqSchema = load('release-requirement.schema.json');
const appSchema = load('appsettings-requirement.schema.json');
const manSchema = load('release-manifest.schema.json');

function validate(obj, schema, pathStr, errs) {
  errs.push(...require('../../engine/tools/lib/schema').validate(obj, schema, pathStr));
}

const errs = [];
let counts = { requirements: 0, migrations: 0, appsettings: 0, manifests: 0 };

for (const r of store.allRequirements()) { counts.requirements++; validate(r, reqSchema, r.id || 'req', errs); }
for (const mig of store.migrations()) {
  for (const mr of (mig.requirements || [])) { counts.migrations++; validate(mr, reqSchema, mr.id || 'mig', errs); }
}
for (const s of store.appSettings()) { counts.appsettings++; validate(s, appSchema, s.id || 'appset', errs); }
for (const v of store.listVersions()) {
  const m = store.loadReleaseManifest(v);
  if (m) { counts.manifests++; validate(m, manSchema, `release/${v}`, errs); }
}

process.stdout.write(`validated: ${counts.requirements} requirements, ${counts.migrations} migration reqs, ${counts.appsettings} appsettings, ${counts.manifests} manifests\n`);
if (errs.length) {
  for (const e of errs.slice(0, 60)) process.stdout.write(`FAIL  ${e}\n`);
  process.stdout.write(`\n${errs.length} schema violation(s)\n`);
  process.exit(1);
}
process.stdout.write('VALID  all canonical release records conform to their schemas\n');
process.exit(0);

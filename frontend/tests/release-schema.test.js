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

function typeOk(v, t) {
  if (Array.isArray(t)) return t.some((x) => typeOk(v, x));
  switch (t) {
    case 'string': return typeof v === 'string';
    case 'integer': return Number.isInteger(v);
    case 'number': return typeof v === 'number';
    case 'boolean': return typeof v === 'boolean';
    case 'object': return v && typeof v === 'object' && !Array.isArray(v);
    case 'array': return Array.isArray(v);
    case 'null': return v === null;
    default: return true;
  }
}

function validate(obj, schema, pathStr, errs) {
  if (schema.const !== undefined && obj !== schema.const) errs.push(`${pathStr}: expected const ${JSON.stringify(schema.const)}`);
  if (schema.enum && schema.enum.indexOf(obj) === -1) errs.push(`${pathStr}: '${obj}' not in enum`);
  if (schema.type && !typeOk(obj, schema.type)) errs.push(`${pathStr}: type != ${schema.type}`);
  if (schema.pattern && typeof obj === 'string' && !new RegExp(schema.pattern).test(obj)) errs.push(`${pathStr}: '${obj}' fails pattern ${schema.pattern}`);
  if (schema.type === 'object' && obj && typeof obj === 'object') {
    for (const r of (schema.required || [])) if (!(r in obj)) errs.push(`${pathStr}: missing required '${r}'`);
    const props = schema.properties || {};
    if (schema.additionalProperties === false) {
      for (const k of Object.keys(obj)) if (!(k in props)) errs.push(`${pathStr}: unexpected property '${k}'`);
    }
    for (const k of Object.keys(props)) if (k in obj) validate(obj[k], props[k], `${pathStr}.${k}`, errs);
  }
  if (schema.type === 'array' && Array.isArray(obj) && schema.items) {
    obj.forEach((it, i) => validate(it, schema.items, `${pathStr}[${i}]`, errs));
  }
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

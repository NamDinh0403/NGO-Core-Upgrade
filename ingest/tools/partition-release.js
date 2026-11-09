#!/usr/bin/env node
'use strict';

/*
 * Partition a legacy release candidate JSON into the versioned, partitioned
 * Schema v2 directory model (manifest.json, changes/, evidence/, release-notes.md).
 *
 * Usage:
 *   node partition-release.js --version 9.4.1 [--out <dir>] [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const partitionLib = require('./lib/partition');
const schemaLib = require('../../engine/tools/lib/schema');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_CANDIDATES = path.join(ROOT, 'knowledge', 'candidates', 'releases');
const SCHEMAS_DIR = path.join(ROOT, 'schemas');

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      flags[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    }
  }
  return flags;
}

function run() {
  const flags = parseFlags(process.argv.slice(2));
  const version = flags.version;
  if (!version) {
    process.stderr.write('Usage: node partition-release.js --version <version> [--out <dir>] [--dry-run]\n');
    process.exit(1);
  }

  const outDir = flags.out || DEFAULT_CANDIDATES;
  const legacyFile = path.join(DEFAULT_CANDIDATES, `${version}.json`);
  if (!fs.existsSync(legacyFile)) {
    process.stderr.write(`Error: legacy release file not found: ${legacyFile}\n`);
    process.exit(1);
  }

  const legacyRaw = fs.readFileSync(legacyFile, 'utf8');
  const legacyRecord = JSON.parse(legacyRaw);

  const dryRun = Boolean(flags['dry-run']);
  const result = partitionLib.partitionCandidate(legacyRecord, dryRun ? null : outDir);

  // Validate manifest schema
  const manifestSchema = JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, 'release-manifest-v2.schema.json'), 'utf8'));
  const manifestErrors = schemaLib.validate(result.manifest, manifestSchema, 'manifest.json');
  if (manifestErrors.length > 0) {
    process.stderr.write(`Manifest schema validation failed:\n  ${manifestErrors.join('\n  ')}\n`);
    process.exit(1);
  }

  const targetDir = path.join(outDir, version);
  const legacySize = Buffer.byteLength(legacyRaw, 'utf8');
  const manifestSize = result.manifest.partitions.backend.size +
    result.manifest.partitions.frontend.size +
    result.manifest.partitions.shared.size +
    result.manifest.partitions.database.size +
    result.manifest.partitions.evidence.size +
    result.manifest.partitions.releaseNotes.size;

  process.stdout.write(`Partitioned release ${version} successfully:\n`);
  process.stdout.write(`  Target directory: ${targetDir}\n`);
  process.stdout.write(`  Legacy file size: ${(legacySize / 1024).toFixed(1)} KB (${legacyRecord.changes ? legacyRecord.changes.length : 0} changes, ${legacyRecord.facts ? legacyRecord.facts.length : 0} facts)\n`);
  process.stdout.write(`  Total partitioned size: ${(manifestSize / 1024).toFixed(1)} KB\n`);
  process.stdout.write(`  Backend partition: ${(result.manifest.partitions.backend.size / 1024).toFixed(1)} KB (${result.manifest.partitions.backend.recordCount} items)\n`);
  process.stdout.write(`  Frontend partition: ${(result.manifest.partitions.frontend.size / 1024).toFixed(1)} KB (${result.manifest.partitions.frontend.recordCount} items)\n`);
  process.stdout.write(`  Database partition: ${(result.manifest.partitions.database.size / 1024).toFixed(1)} KB (${result.manifest.partitions.database.recordCount} items)\n`);
  process.stdout.write(`  Evidence size: ${(result.manifest.partitions.evidence.size / 1024).toFixed(1)} KB (${result.manifest.partitions.evidence.recordCount} raw changes)\n`);
  process.stdout.write(`  Lifecycle status: ${result.manifest.lifecycle.status}\n`);
}

if (require.main === module) {
  run();
}

module.exports = { run };

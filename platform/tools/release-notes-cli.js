#!/usr/bin/env node
'use strict';

const path = require('path');
const releaseNotes = require('../release-notes');
const catalog = require('../release-notes/catalog');

function parseFlags(argv) {
  const flags = {};
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    flags[key] = next && !next.startsWith('--') ? argv[++index] : true;
  }
  return flags;
}

function outputJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function commandHelp() {
  return [
    'Release Notes Bot deterministic CLI',
    '',
    '  single --version <version> [--json]',
    '  range --from <source> --to <target> [--json]',
    '  search --query <text> [--from <source>] [--to <target>] [--module <name>] [--json]',
    '  client --version <version> --client-path <path> [--json]',
    '',
    'The CLI reads only local structured release sources. It never invents or edits release evidence.',
  ].join('\n');
}

function run(argv) {
  const command = argv[0];
  const flags = parseFlags(argv.slice(1));
  const rootDir = path.resolve(__dirname, '..', '..');
  const options = { rootDir };

  if (!command || command === '--help' || command === 'help') {
    process.stdout.write(`${commandHelp()}\n`);
    return 0;
  }

  if (command === 'single') {
    if (!flags.version) throw new Error('--version is required');
    const notes = releaseNotes.getReleaseNotes(flags.version, options);
    if (!notes || !notes.exists) throw new Error(`No release notes found for ${flags.version}`);
    if (flags.json) outputJson(notes.report);
    else process.stdout.write(`${notes.content}\n`);
    return 0;
  }

  if (command === 'range') {
    if (!flags.from || !flags.to) throw new Error('--from and --to are required');
    const range = releaseNotes.getReleaseNotesForRange(flags.from, flags.to, options);
    if (!range.exists) throw new Error(`No releases found in ${flags.from} -> ${flags.to}`);
    if (flags.json) outputJson(range.range);
    else process.stdout.write(`${range.content}\n`);
    return 0;
  }

  if (command === 'search') {
    if (!flags.query) throw new Error('--query is required');
    const matches = catalog.search(flags.query, {
      rootDir,
      sourceVersion: flags.from,
      targetVersion: flags.to,
      module: flags.module,
    });
    outputJson({
      query: flags.query,
      sourceVersion: flags.from || null,
      targetVersion: flags.to || null,
      module: flags.module || null,
      matches,
    });
    return 0;
  }

  if (command === 'client') {
    if (!flags.version || !flags['client-path']) throw new Error('--version and --client-path are required');
    const result = releaseNotes.filterReleaseNotesForClient(
      flags.version,
      path.resolve(flags['client-path']),
      options,
    );
    if (!result) throw new Error(`No release notes found for ${flags.version}`);
    outputJson(result);
    return 0;
  }

  throw new Error(`Unknown command: ${command}`);
}

if (require.main === module) {
  try {
    process.exitCode = run(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`release-notes-cli: ${error.message}\n\n${commandHelp()}\n`);
    process.exitCode = 1;
  }
}

module.exports = { parseFlags, run };

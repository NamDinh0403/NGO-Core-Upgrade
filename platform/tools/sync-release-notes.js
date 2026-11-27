#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const parser = require('../release-notes/parser');
const catalog = require('../release-notes/catalog');
const report = require('../release-notes/report');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

function parseFlags(argv) {
  const flags = {};
  for (let index = 0; index < argv.length; index++) {
    if (!argv[index].startsWith('--')) continue;
    const key = argv[index].slice(2);
    const next = argv[index + 1];
    flags[key] = next && !next.startsWith('--') ? argv[++index] : true;
  }
  return flags;
}

function git(corePath, args) {
  const result = cp.spawnSync('git', ['-C', corePath, ...args], {
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `git ${args.join(' ')} failed`).trim());
  }
  return (result.stdout || '').trim();
}

function normalizeVersionOrThrow(value) {
  const version = parser.normalizeBaseVersion(value);
  if (!version) throw new Error(`Invalid target version: ${value}`);
  return version;
}

function resolveGitBase(corePath, targetRef, explicitBase) {
  if (explicitBase) return explicitBase;
  const describe = git(corePath, ['describe', '--tags', '--abbrev=0', targetRef]);
  if (!describe) throw new Error(`No base ref supplied and no tag is reachable from ${targetRef}`);
  return describe;
}

function collectGitDiff(flags) {
  if (!flags['core-path']) return null;
  const corePath = path.resolve(flags['core-path']);
  if (!fs.existsSync(corePath)) throw new Error(`Core repository path does not exist: ${corePath}`);
  if (!flags['target-version']) {
    throw new Error('--target-version is required when --core-path is supplied');
  }
  const targetRef = flags['core-ref'] || 'HEAD';
  const baseRef = resolveGitBase(corePath, targetRef, flags['base-ref']);
  const baseCommit = git(corePath, ['rev-parse', `${baseRef}^{commit}`]);
  const targetCommit = git(corePath, ['rev-parse', `${targetRef}^{commit}`]);
  const output = git(corePath, ['diff', '--name-status', '--find-renames', `${baseCommit}..${targetCommit}`]);
  const changes = output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const fields = line.split('\t');
      if (fields[0].startsWith('R') || fields[0].startsWith('C')) {
        return {
          status: fields[0],
          oldPath: fields[1],
          path: fields[2],
          scope: inferScope(fields[2]),
          category: 'git-diff',
        };
      }
      return {
        status: fields[0],
        oldPath: null,
        path: fields[1],
        scope: inferScope(fields[1]),
        category: 'git-diff',
      };
    })
    .filter((change) => change.path);
  const baseVersion = normalizeVersionOrThrow(flags['target-version']);
  return {
    version: `${baseVersion}-draft`,
    status: 'CANDIDATE',
    releaseStatus: parser.DRAFT_STATUS,
    ingestedAt: null,
    identity: {
      fromCommit: baseCommit,
      toCommit: targetCommit,
      baseRef,
      targetRef,
      key: crypto.createHash('sha256').update(`${baseCommit}:${targetCommit}`).digest('hex'),
    },
    changes,
    facts: [],
    findings: { backend: [], frontend: [], shared: [] },
    unresolvedItems: [],
    nextAction: 'Review the generated draft report and confirm Needs Review rows.',
    __sourcePath: `git:${baseRef}..${targetRef}`,
  };
}

function inferScope(filePath) {
  const value = String(filePath || '').toLowerCase();
  if (/\b(?:ngo-api|backend)\b|\.cs(?:proj)?$/.test(value)) return 'backend';
  if (/\b(?:ngo-client|frontend)\b|\.(?:ts|html|scss|css)$/.test(value)) return 'frontend';
  return 'shared';
}

function writeIfChanged(filePath, content) {
  const normalized = String(content);
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8') === normalized) return false;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, normalized, 'utf8');
  return true;
}

function safeOutputVersion(version) {
  if (!/^[0-9A-Za-z][0-9A-Za-z._-]*$/.test(version)) {
    throw new Error(`Unsafe output version: ${version}`);
  }
  return version;
}

function sync(flags) {
  const rootDir = path.resolve(flags['root-dir'] || ROOT_DIR);
  const outputDir = path.resolve(flags['output-dir'] || path.join(rootDir, 'release-notes', 'generated'));
  const additionalDiffRecord = collectGitDiff(flags);
  const reports = catalog.buildReports({
    rootDir,
    targetVersion: flags['target-version'],
    onenotePath: flags['onenote-path'] ? path.resolve(flags['onenote-path']) : undefined,
    sanitizedNotesPath: flags['sanitized-notes-path'] ? path.resolve(flags['sanitized-notes-path']) : undefined,
    rawInputDir: flags['raw-input-dir'] ? path.resolve(flags['raw-input-dir']) : undefined,
    candidateDir: flags['candidate-dir'] ? path.resolve(flags['candidate-dir']) : undefined,
    additionalDiffRecord,
  });

  let selected = reports;
  if (flags['target-version']) {
    const resolved = parser.resolveVersionQuery(flags['target-version'], reports.map((item) => item.version));
    if (!resolved) throw new Error(`No report could be generated for ${flags['target-version']}`);
    selected = reports.filter((item) => item.version === resolved);
  }

  const indexReportEntries = (flags['target-version'] ? selected : reports)
    .slice()
    .sort((left, right) => parser.compareVersions(left.version, right.version))
    .map((item) => ({
      version: item.version,
      status: item.status,
      releaseDate: item.releaseDate,
      summary: item.summary,
      json: `${safeOutputVersion(item.version)}/release-notes.json`,
      markdown: `${safeOutputVersion(item.version)}/release-notes.md`,
    }));
  const existingIndexPath = path.join(outputDir, 'index.json');
  let indexEntries = indexReportEntries;
  if (flags['target-version'] && fs.existsSync(existingIndexPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(existingIndexPath, 'utf8'));
      const selectedVersions = new Set(indexEntries.map((entry) => entry.version));
      const retained = (existing.releases || []).filter((entry) =>
        !selectedVersions.has(entry.version)
        && fs.existsSync(path.join(outputDir, entry.json || ''))
        && fs.existsSync(path.join(outputDir, entry.markdown || '')));
      indexEntries = retained.concat(indexEntries).sort((left, right) => parser.compareVersions(left.version, right.version));
    } catch (error) {
      throw new Error(`Cannot read existing generated index ${existingIndexPath}: ${error.message}`);
    }
  }
  const index = {
    schemaVersion: 1,
    source: 'platform/tools/sync-release-notes.js',
    releases: indexEntries,
  };
  const changedFiles = [];

  if (!flags['dry-run']) {
    if (writeIfChanged(path.join(outputDir, 'index.json'), `${JSON.stringify(index, null, 2)}\n`)) {
      changedFiles.push(path.join(outputDir, 'index.json'));
    }
    for (const item of selected) {
      const versionDir = path.join(outputDir, safeOutputVersion(item.version));
      const jsonPath = path.join(versionDir, 'release-notes.json');
      const markdownPath = path.join(versionDir, 'release-notes.md');
      if (writeIfChanged(jsonPath, `${JSON.stringify(item, null, 2)}\n`)) changedFiles.push(jsonPath);
      if (writeIfChanged(markdownPath, report.renderMarkdown(item))) changedFiles.push(markdownPath);
    }
  }

  return {
    ok: true,
    selectedVersions: selected.map((item) => item.version),
    reportCount: reports.length,
    outputDir,
    changedFiles: changedFiles.map((filePath) => path.relative(rootDir, filePath).replace(/\\/g, '/')),
    dryRun: Boolean(flags['dry-run']),
  };
}

function help() {
  return [
    'node platform/tools/sync-release-notes.js [options]',
    '',
    '  --target-version <version>    Generate one release (major/minor aliases such as 10 or 10.0 are supported).',
    '  --onenote-path <file>         Raw OneNote HTML or sanitized Markdown.',
    '  --raw-input-dir <dir>         cards/ and git-diffs/ raw inputs.',
    '  --candidate-dir <dir>         Existing deterministic ingest candidate records.',
    '  --core-path <dir>             Optional Core checkout used for an active-branch name-status diff.',
    '  --core-ref <ref>              Development ref, default HEAD.',
    '  --base-ref <ref>              Diff base; defaults to the nearest reachable tag.',
    '  --output-dir <dir>            Generated report directory.',
    '  --dry-run                     Parse and classify without writing files.',
  ].join('\n');
}

if (require.main === module) {
  try {
    const flags = parseFlags(process.argv.slice(2));
    if (flags.help) {
      process.stdout.write(`${help()}\n`);
      process.exit(0);
    }
    const result = sync(flags);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`sync-release-notes: ${error.message}\n`);
    process.exit(1);
  }
}

module.exports = { collectGitDiff, inferScope, parseFlags, sync };

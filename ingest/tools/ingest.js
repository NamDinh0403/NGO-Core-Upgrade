#!/usr/bin/env node
'use strict';
/*
 * ingest CLI — the single shared ingestion phase for a new NGO Core
 * release. Combines the local NGO.Core git history (what changed) with the
 * shared release-notes.md (why/scope/risk); neither is sufficient alone.
 * Writes ONE candidate record per version under knowledge/candidates/releases/,
 * read by both backend's and frontend's ingest-core-release
 * skill — so a version is only ever diffed/parsed once, not once per track.
 *
 * Usage:
 *   node ingest.js check  --core-path <path> [--since <x.y.z>] [--tag-prefix v]
 *   node ingest.js ingest --core-path <path> [--release-notes <path>]
 *                         [--since <x.y.z>] [--target <x.y.z>] [--tag-prefix v]
 *                         [--out <dir>]
 */
const fs = require('fs');
const path = require('path');
const git = require('./lib/git');
const notes = require('./lib/notes');
const classify = require('./lib/classify');

const ROOT = path.resolve(__dirname, '..'); // ingest/
const BACKEND_VERSIONS_DIR = path.resolve(ROOT, '..', 'backend', 'knowledge', 'canonical', 'versions');
const FRONTEND_RELEASES_DIR = path.resolve(ROOT, '..', 'frontend', 'knowledge', 'canonical', 'releases');
const DEFAULT_OUT = path.join(ROOT, 'knowledge', 'candidates', 'releases');

function parseFlags(argv) {
  const f = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) f[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return f;
}
const parseVer = (v) => { const m = String(v || '').match(/^(\d+)\.(\d+)\.(\d+)$/); return m ? [+m[1], +m[2], +m[3]] : null; };
const cmpVer = (a, b) => { for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };
const gtVer = (a, b) => cmpVer(parseVer(a), parseVer(b)) > 0;

function highestKnownVersion() {
  const versions = [];
  if (fs.existsSync(BACKEND_VERSIONS_DIR)) {
    for (const f of fs.readdirSync(BACKEND_VERSIONS_DIR)) {
      const v = f.replace(/\.json$/, '');
      if (parseVer(v)) versions.push(v);
    }
  }
  if (fs.existsSync(FRONTEND_RELEASES_DIR)) {
    for (const d of fs.readdirSync(FRONTEND_RELEASES_DIR)) {
      if (parseVer(d)) versions.push(d);
    }
  }
  if (versions.length === 0) return null;
  return versions.reduce((best, v) => (gtVer(v, best) ? v : best), versions[0]);
}

function newerTags(corePath, since, tagPrefix) {
  const listed = git.listTags(corePath);
  if (!listed.ok) return { ok: false, error: listed.error, versions: [] };
  const escapedPrefix = tagPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^${escapedPrefix}(\\d+\\.\\d+\\.\\d+)$`);
  const versions = [];
  for (const tag of listed.tags) {
    const m = tag.match(re);
    if (!m) continue;
    const v = m[1];
    if (!since || (v !== since && gtVer(v, since))) versions.push(v);
  }
  versions.sort((a, b) => cmpVer(parseVer(a), parseVer(b)));
  return { ok: true, error: null, versions };
}

function cmdCheck(flags) {
  const corePath = flags['core-path'];
  if (!corePath) { process.stderr.write('specify --core-path <local NGO.Core checkout>\n'); return 2; }
  if (!git.isGitRepo(corePath)) { process.stderr.write(`not a git repository: ${corePath}\n`); return 1; }
  const since = flags.since || highestKnownVersion();
  const tagPrefix = flags['tag-prefix'] || 'v';
  const r = newerTags(corePath, since, tagPrefix);
  if (!r.ok) { process.stderr.write(`git tag failed: ${r.error}\n`); return 1; }
  process.stdout.write(`Highest version known to either track: ${since || '(none found)'}\n`);
  if (r.versions.length === 0) { process.stdout.write('No newer Core releases found.\n'); return 0; }
  process.stdout.write('Newer Core release(s) found:\n');
  for (const v of r.versions) process.stdout.write(`  - ${v}\n`);
  process.stdout.write('\nNext: node ingest/tools/ingest.js ingest --core-path <path> --release-notes <path> --target <version>\n');
  return 0;
}

// Lightweight secret redaction: never persist an obvious credential/secret value.
function redact(text) {
  if (text == null) return text;
  let s = String(text);
  s = s.replace(/((?:api|subscription)[-_]?key|password|secret|connectionstring)\s*[:=]\s*\S+/gi, '$1=<FROM_SECRET_PROVIDER>');
  s = s.replace(/[A-Za-z0-9+/]{40,}={0,2}/g, '<REDACTED_LONG_TOKEN>');
  return s;
}

const BACKEND_KEYWORDS = /appsettings|nuget|\.cs\b|core\.tools|ef migration|entityframework|\.sql\b|migration/i;
const FRONTEND_KEYWORDS = /\.ts\b|environment|angular|route|component|module\.ts|package\.json/i;

function guessCardScope(cardText) {
  if (BACKEND_KEYWORDS.test(cardText)) return 'backend';
  if (FRONTEND_KEYWORDS.test(cardText)) return 'frontend';
  return 'shared';
}

function basenameNoExt(p) {
  const base = path.basename(p);
  return base.replace(/\.[^.]+$/, '');
}

function ingestOneVersion(corePath, releaseNotesText, fromTag, toTag, version) {
  const diff = git.diffNameStatus(corePath, fromTag, toTag);
  const diffFindings = { backend: [], frontend: [], shared: [] };
  const changes = diff.ok ? diff.changes : [];
  const cards = releaseNotesText ? notes.cardsFor(releaseNotesText, version) : [];
  const cardsLower = cards.map((c) => c.toLowerCase());

  for (const change of changes) {
    const { scope, category } = classify.classify(change.path);
    const base = basenameNoExt(change.path).toLowerCase();
    const matchedCardIdx = base.length >= 3 ? cardsLower.findIndex((c) => c.includes(base)) : -1;
    const finding = {
      scope, category, path: change.path,
      statement: `${change.status === 'A' ? 'Added' : change.status === 'D' ? 'Deleted' : change.status.startsWith('R') ? 'Renamed to' : 'Modified'} ${change.path}`,
      source: matchedCardIdx !== -1 ? 'both' : 'git-diff',
      crossCheck: matchedCardIdx !== -1 ? 'CONFIRMED_BY_DIFF_AND_NOTES' : 'OBSERVED_IN_DIFF_NOT_MENTIONED_IN_NOTES',
      evidence: redact(`git diff --name-status ${fromTag}..${toTag}` + (matchedCardIdx !== -1 ? ` | release-notes.md#${version} card ${matchedCardIdx + 1}` : '')),
    };
    diffFindings[scope].push(finding);
  }

  const noteFindings = { backend: [], frontend: [], shared: [] };
  const allBasenames = changes.map((c) => basenameNoExt(c.path).toLowerCase());
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const matchedDiff = allBasenames.some((b) => b.length >= 3 && card.toLowerCase().includes(b));
    const scope = guessCardScope(card);
    noteFindings[scope].push({
      scope,
      category: 'release-note-card',
      path: null,
      statement: redact(card.split('\n')[0].slice(0, 200)),
      source: matchedDiff ? 'both' : 'release-notes',
      crossCheck: matchedDiff ? 'CONFIRMED_BY_DIFF_AND_NOTES' : 'NOTED_BUT_UNCONFIRMED_BY_DIFF',
      evidence: redact(`release-notes.md#${version} card ${i + 1}`),
    });
  }

  const findings = {
    backend: diffFindings.backend.concat(noteFindings.backend.filter((n) => n.crossCheck !== 'CONFIRMED_BY_DIFF_AND_NOTES')),
    frontend: diffFindings.frontend.concat(noteFindings.frontend.filter((n) => n.crossCheck !== 'CONFIRMED_BY_DIFF_AND_NOTES')),
    shared: diffFindings.shared.concat(noteFindings.shared.filter((n) => n.crossCheck !== 'CONFIRMED_BY_DIFF_AND_NOTES')),
  };

  const unresolvedItems = [];
  for (const scope of ['backend', 'frontend', 'shared']) {
    for (const f of findings[scope]) {
      if (f.crossCheck === 'OBSERVED_IN_DIFF_NOT_MENTIONED_IN_NOTES') unresolvedItems.push(`${version} [${scope}] ${f.path}: observed in diff, no matching release-notes card`);
      if (f.crossCheck === 'NOTED_BUT_UNCONFIRMED_BY_DIFF') unresolvedItems.push(`${version} [${scope}] note card unconfirmed by diff: "${f.statement}"`);
    }
  }
  if (!diff.ok) unresolvedItems.push(`${version}: git diff failed (${diff.error}) — findings are release-notes-only for this version`);
  if (!releaseNotesText) unresolvedItems.push(`${version}: no release-notes.md provided — findings are git-diff-only for this version`);

  return {
    schemaVersion: 1,
    version,
    status: 'CANDIDATE',
    ingestedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    sources: { coreRepoPath: corePath, releaseNotesPath: releaseNotesText ? 'provided' : null, tagRange: { from: fromTag, to: toTag } },
    findings,
    unresolvedItems,
    nextAction: `Developer: review ingest/knowledge/candidates/releases/${version}.json, resolve unresolvedItems, then promote applicable findings into backend/knowledge/canonical/versions/${version}.json and/or frontend/knowledge/canonical/releases/${version}/.`,
  };
}

function cmdIngest(flags) {
  const corePath = flags['core-path'];
  if (!corePath) { process.stderr.write('specify --core-path <local NGO.Core checkout>\n'); return 2; }
  if (!git.isGitRepo(corePath)) { process.stderr.write(`not a git repository: ${corePath}\n`); return 1; }

  const before = git.fingerprint(corePath);
  const since = flags.since || highestKnownVersion();
  const tagPrefix = flags['tag-prefix'] || 'v';
  const outDir = flags.out || DEFAULT_OUT;
  const releaseNotesText = flags['release-notes'] && fs.existsSync(flags['release-notes']) ? fs.readFileSync(flags['release-notes'], 'utf8') : null;

  const r = newerTags(corePath, since, tagPrefix);
  if (!r.ok) { process.stderr.write(`git tag failed: ${r.error}\n`); return 1; }
  let versions = r.versions;
  if (flags.target) versions = r.versions.filter((v) => cmpVer(parseVer(v), parseVer(flags.target)) <= 0);
  if (versions.length === 0) { process.stdout.write('No versions to ingest.\n'); return 0; }

  fs.mkdirSync(outDir, { recursive: true });
  let prevTag = since ? `${tagPrefix}${since}` : (versions.length ? null : null);
  // If `since` isn't itself a real tag (e.g. no prior canonical version at all), fall back to the first ancestor commit of the earliest discovered tag.
  const written = [];
  for (const v of versions) {
    const toTag = `${tagPrefix}${v}`;
    const fromTag = prevTag || `${toTag}^`; // first-parent of the earliest tag when there's no known predecessor
    const record = ingestOneVersion(corePath, releaseNotesText, fromTag, toTag, v);
    const outPath = path.join(outDir, `${v}.json`);
    fs.writeFileSync(outPath, JSON.stringify(record, null, 2) + '\n');
    written.push(outPath);
    prevTag = toTag;
  }

  const after = git.fingerprint(corePath);
  const drift = git.diffFingerprints(before, after);
  if (drift.length) {
    process.stderr.write(`Core repository changed during ingestion — discarding results: ${drift.join('; ')}\n`);
    for (const p of written) fs.unlinkSync(p);
    return 1;
  }

  process.stdout.write(`Ingested ${written.length} version(s):\n`);
  for (const p of written) process.stdout.write(`  - ${path.relative(ROOT, p)}\n`);
  return 0;
}

function usage() {
  process.stdout.write([
    'usage: ingest.js <check|ingest> --core-path <path> [options]',
    '  check  --core-path <path> [--since <x.y.z>] [--tag-prefix v]',
    '  ingest --core-path <path> [--release-notes <path>] [--since <x.y.z>] [--target <x.y.z>] [--tag-prefix v] [--out <dir>]',
    '',
  ].join('\n'));
}

function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const flags = parseFlags(argv.slice(1));
  if (cmd === 'check') process.exit(cmdCheck(flags));
  else if (cmd === 'ingest') process.exit(cmdIngest(flags));
  else { usage(); process.exit(2); }
}

if (require.main === module) main();

module.exports = { highestKnownVersion, newerTags, ingestOneVersion, cmdCheck, cmdIngest };

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
const crypto = require('crypto');
const git = require('./lib/git');
const notes = require('./lib/notes');
const classify = require('./lib/classify');

const ROOT = path.resolve(__dirname, '..'); // ingest/
const BACKEND_VERSIONS_DIR = path.resolve(ROOT, '..', 'backend', 'knowledge', 'canonical', 'versions');
const FRONTEND_RELEASES_DIR = path.resolve(ROOT, '..', 'frontend', 'knowledge', 'canonical', 'releases');
const DEFAULT_OUT = path.join(ROOT, 'knowledge', 'candidates', 'releases');
const ANALYZER_VERSION = '2';
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const normalizeVersion = (value) => /^\d+\.\d+$/.test(String(value)) ? `${value}.0` : String(value || '');

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
  if (since && !parseVer(since)) return { ok: false, error: 'invalid source version', versions: [] };
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
  const since = flags.since ? normalizeVersion(flags.since) : highestKnownVersion();
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
  s = s.replace(/((?:https?|git|ssh):\/\/)[^/@\s]+@/gi, '$1<REDACTED>@');
  s = s.replace(/([?&](?:token|access_token|api_key|key|secret|password|sig|signature|credential|auth)=)[^&#\s]*/gi, '$1<FROM_SECRET_PROVIDER>');
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
  const identity = releaseIdentity(corePath, releaseNotesText, fromTag, toTag, version);
  const diff = git.diffNameStatus(corePath, identity.fromCommit, identity.toCommit);
  if (!diff.ok) throw new Error(diff.error);
  const diffFindings = { backend: [], frontend: [], shared: [] };
  const changes = diff.ok ? diff.changes : [];
  const cards = releaseNotesText ? notes.cardsFor(releaseNotesText, version) : [];
  const cardsLower = cards.map((c) => c.toLowerCase());

  for (const change of changes) {
    const { scope, category } = classify.classify(change.path);
    const base = basenameNoExt(change.path).toLowerCase();
    const matchedCardIdx = base.length >= 3 ? cardsLower.findIndex((c) => c.includes(base)) : -1;
    const finding = {
      scope, category, path: change.path, status: change.status, oldPath: change.oldPath,
      statement: `${change.status === 'A' ? 'Added' : change.status === 'D' ? 'Deleted' : change.status.startsWith('R') ? 'Renamed to' : 'Modified'} ${change.path}`,
      source: matchedCardIdx !== -1 ? 'both' : 'git-diff',
      crossCheck: matchedCardIdx !== -1 ? 'CONFIRMED_BY_DIFF_AND_NOTES' : 'OBSERVED_IN_DIFF_NOT_MENTIONED_IN_NOTES',
      correlationOnly: matchedCardIdx !== -1,
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
    identity,
    changes: changes.map((change) => Object.assign({}, change, classify.classify(change.path))),
    facts: extractFacts(corePath, identity, changes),
    ingestedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    sources: { coreRepoPath: corePath, releaseNotesPath: releaseNotesText ? 'provided' : null, tagRange: { from: fromTag, to: toTag } },
    findings,
    unresolvedItems,
    nextAction: `Developer: review ingest/knowledge/candidates/releases/${version}.json, resolve unresolvedItems, then promote applicable findings into backend/knowledge/canonical/versions/${version}.json and/or frontend/knowledge/canonical/releases/${version}/.`,
  };
}

function releaseIdentity(corePath, text, fromTag, toTag, version) {
  const fromCommit = git.resolveRef(corePath, fromTag);
  const toCommit = git.resolveRef(corePath, toTag);
  if (!fromCommit || !toCommit) throw new Error(`unresolved release boundary: ${fromTag}..${toTag}`);
  const identity = { analyzerVersion: ANALYZER_VERSION, version, fromCommit, toCommit,
    notesHash: hash(JSON.stringify(text == null ? null : notes.cardsFor(text, version))) };
  identity.key = hash(JSON.stringify(identity));
  return identity;
}

function flattenedKeys(value, prefix, result) {
  result = result || Object.create(null);
  for (const key of Object.keys(value || {})) {
    const full = prefix ? `${prefix}.${key}` : key;
    const child = value[key];
    if (child && typeof child === 'object' && !Array.isArray(child)) flattenedKeys(child, full, result);
    else result[full] = JSON.stringify(child);
  }
  return result;
}

function extractFacts(corePath, identity, changes) {
  const facts = [];
  for (const change of changes) {
    const file = change.path;
    if (/\.json$/i.test(file) && /package(?:-lock)?\.json$|appsettings|config/i.test(file)) {
      try {
        const before = change.status === 'A' ? {} : JSON.parse(git.showFile(corePath, identity.fromCommit, change.oldPath || file));
        const after = change.status === 'D' ? {} : JSON.parse(git.showFile(corePath, identity.toCommit, file));
        if (/(^|\/)package\.json$/.test(file)) {
          if (before.version !== after.version) facts.push({ kind: 'package-version', path: file, before: redact(before.version || null), after: redact(after.version || null) });
          for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies', 'engines']) {
            for (const name of new Set(Object.keys(before[section] || {}).concat(Object.keys(after[section] || {})))) {
              const oldValue = (before[section] || {})[name];
              const newValue = (after[section] || {})[name];
              if (oldValue !== newValue) facts.push({ kind: 'dependency', path: file, section, name, before: redact(oldValue || null), after: redact(newValue || null) });
            }
          }
        } else {
          const oldKeys = flattenedKeys(before);
          const newKeys = flattenedKeys(after);
          for (const key of new Set(Object.keys(oldKeys).concat(Object.keys(newKeys)))) {
            if (oldKeys[key] !== newKeys[key]) facts.push({ kind: 'json-key', path: file, key,
              change: !(key in oldKeys) ? 'ADDED' : !(key in newKeys) ? 'DELETED' : 'MODIFIED' });
          }
        }
      } catch (_) { facts.push({ kind: 'extraction-incomplete', path: file, reason: 'JSON could not be parsed; inspect immutable source' }); }
    }
    const category = classify.classify(file).category;
    if (category === 'ef-migration' || category === 'sql-script') facts.push({ kind: category, path: file, status: change.status, requiresReview: true });
    if (/\.csproj$|Directory\.(Packages|Build)\.props$/i.test(file)) facts.push({ kind: 'project-reference-or-package-change', path: file, requiresStructuredInspection: true });
    if (/\.(cs|ts)$/i.test(file)) {
      const delta = git.git(corePath, ['diff', '--unified=0', identity.fromCommit, identity.toCommit, '--', file]);
      if (delta.code !== 0) throw new Error(`cannot inspect API change evidence: ${file}`);
      const declarations = delta.stdout.split(/\r?\n/).filter((line) => /^[+-](?![+-])/.test(line) && /\b(public|protected|export|interface)\b/.test(line));
      if (declarations.length) facts.push({ kind: 'api-declaration-change-hint', path: file,
        added: declarations.filter((line) => line[0] === '+').length,
        removed: declarations.filter((line) => line[0] === '-').length, requiresSemanticReview: true });
    }
  }
  return facts;
}

function cachedRecord(file, identity) {
  try {
    const record = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (record.schemaVersion !== 1 || record.status !== 'CANDIDATE' || record.version !== identity.version || !record.identity || !Object.keys(identity).every((key) => record.identity[key] === identity[key])) return null;
    if (!record.sources || !record.sources.tagRange || typeof record.sources.tagRange.from !== 'string' || typeof record.sources.tagRange.to !== 'string' || typeof record.ingestedAt !== 'string' || typeof record.nextAction !== 'string') return null;
    if (!record.findings || !['backend', 'frontend', 'shared'].every((scope) => Array.isArray(record.findings[scope]))) return null;
    if (!Array.isArray(record.changes) || !Array.isArray(record.facts) || !Array.isArray(record.unresolvedItems)) return null;
    const integrity = hash(JSON.stringify(Object.assign({}, record, { contentHash: undefined })));
    return record.contentHash === integrity ? record : null;
  } catch (_) { return null; }
}

function ensureReleases(flags) {
  const corePath = flags['core-path'];
  if (!corePath || !git.isGitRepo(corePath)) throw new Error('specify a valid read-only --core-path');
  const before = git.fingerprint(corePath);
  if (!before.valid) throw new Error('cannot verify Core baseline');
  const since = flags.since ? normalizeVersion(flags.since) : null;
  const target = flags.target ? normalizeVersion(flags.target) : null;
  if ((since && !parseVer(since)) || (target && !parseVer(target))) throw new Error('versions must be x.y or x.y.z');
  if (since && target && cmpVer(parseVer(since), parseVer(target)) >= 0) throw new Error('source must precede target');
  const tagPrefix = flags['tag-prefix'] || 'v';
  if (typeof tagPrefix !== 'string') throw new Error('invalid tag prefix');
  const listed = newerTags(corePath, null, tagPrefix);
  if (!listed.ok) throw new Error(listed.error);
  const all = listed.versions;
  if (target && !all.includes(target)) throw new Error(`target release tag missing: ${tagPrefix}${target}`);
  const source = since || (target ? all[all.indexOf(target) - 1] : null);
  if (source && !git.resolveRef(corePath, `${tagPrefix}${source}`)) throw new Error(`source release tag missing: ${tagPrefix}${source}`);
  const versions = all.filter((version) => (!source || gtVer(version, source)) && (!target || !gtVer(version, target)));
  const text = flags['release-notes'] && fs.existsSync(flags['release-notes']) ? fs.readFileSync(flags['release-notes'], 'utf8') : null;
  const outDir = flags.out || DEFAULT_OUT;
  const entries = [];
  let previous = source;
  for (const version of versions) {
    if (!previous) { previous = version; continue; }
    const fromTag = `${tagPrefix}${previous}`;
    const toTag = `${tagPrefix}${version}`;
    const identity = releaseIdentity(corePath, text, fromTag, toTag, version);
    const file = path.join(outDir, `${version}.json`);
    const cached = cachedRecord(file, identity);
    const record = cached || ingestOneVersion(corePath, text, fromTag, toTag, version);
    if (!cached) record.contentHash = hash(JSON.stringify(record));
    entries.push({ path: file, reused: !!cached, record });
    previous = version;
  }
  if (target && !entries.some((entry) => entry.record.version === target)) throw new Error('no preceding release; supply --since with a valid source tag');
  for (const entry of entries) {
    const range = entry.record.sources.tagRange;
    const current = releaseIdentity(corePath, text, range.from, range.to, entry.record.version);
    if (current.key !== entry.record.identity.key) throw new Error('release tags changed during ingestion');
  }
  const drift = git.diffFingerprints(before, git.fingerprint(corePath));
  if (drift.length) throw new Error(`Core changed during ingestion: ${drift.join('; ')}`);
  fs.mkdirSync(outDir, { recursive: true });
  for (const entry of entries.filter((item) => !item.reused)) {
    const temporary = `${entry.path}.${process.pid}.tmp`;
    try {
      fs.writeFileSync(temporary, JSON.stringify(entry.record, null, 2) + '\n');
      fs.renameSync(temporary, entry.path);
    } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  }
  return { entries, reused: entries.length > 0 && entries.every((entry) => entry.reused) };
}

function cmdIngest(flags) {
  try {
    const result = ensureReleases(flags);
    process.stdout.write(`Releases: ${result.entries.length}; reused: ${result.entries.filter((entry) => entry.reused).length}\n`);
    for (const entry of result.entries) process.stdout.write(`  - ${entry.path}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
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

module.exports = { highestKnownVersion, newerTags, ingestOneVersion, cmdCheck, cmdIngest, ensureReleases, releaseIdentity, ANALYZER_VERSION };

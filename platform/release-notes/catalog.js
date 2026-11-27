'use strict';

const fs = require('fs');
const path = require('path');
const parser = require('./parser');
const report = require('./report');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const RAW_ONENOTE_FILE = path.join(ROOT_DIR, 'docs', 'onenote-core-release-notes.html');
const SANITIZED_NOTES_FILE = path.join(ROOT_DIR, 'frontend', 'knowledge', 'raw', 'release-note-import', 'release-notes-sanitized.md');
const MANUAL_NOTES_DIR = path.join(ROOT_DIR, 'orchestrator', 'release-notes');
const CANDIDATE_DIR = path.join(ROOT_DIR, 'ingest', 'knowledge', 'candidates', 'releases');
const RAW_INPUT_DIR = path.join(ROOT_DIR, 'release-notes', 'raw');

function relativePath(rootDir, filePath) {
  const relative = path.relative(rootDir, filePath);
  return relative ? relative.replace(/\\/g, '/') : path.basename(filePath);
}

function listFiles(rootDir, predicate) {
  const results = [];
  function walk(current) {
    if (!fs.existsSync(current)) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (!predicate || predicate(fullPath)) results.push(fullPath);
    }
  }
  walk(rootDir);
  return results.sort();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseMetadata(content) {
  const match = String(content || '').match(/<!--\s*NGO_RELEASE_NOTES_META:\s*({[^>]+})\s*-->/);
  if (!match) return { metadata: {}, content: String(content || '') };
  try {
    return { metadata: JSON.parse(match[1]), content: String(content).replace(match[0], '').trim() };
  } catch (_) {
    return { metadata: {}, content: String(content) };
  }
}

function mergeSection(target, version, section, cards, sourceRef) {
  const key = String(version);
  const existing = target.get(key) || {
    version: key,
    status: section.status || parser.RELEASED_STATUS,
    cards: [],
    sourceSections: [],
    sourceRefs: [],
    releaseDate: section.releaseDate || null,
  };
  if (section.status === parser.RELEASED_STATUS) existing.status = parser.RELEASED_STATUS;
  for (const card of cards || section.cards || []) {
    const text = typeof card === 'string' ? card : JSON.stringify(card);
    if (!existing.cards.some((candidate) => (typeof candidate === 'string' ? candidate : JSON.stringify(candidate)) === text)) {
      existing.cards.push(card);
    }
  }
  for (const value of section.sourceSections || [section.label].filter(Boolean)) {
    if (!existing.sourceSections.includes(value)) existing.sourceSections.push(value);
  }
  if (section.releaseDate) existing.releaseDate = section.releaseDate;
  if (sourceRef && !existing.sourceRefs.some((ref) => ref.value === sourceRef.value)) existing.sourceRefs.push(sourceRef);
  target.set(key, existing);
}

function parseInputText(sections, content, sourceRef, options, forcedVersion) {
  const parsed = parser.parseText(content, options);
  if (parsed.size > 0) {
    for (const [version, section] of parsed) {
      const resolvedVersion = options.forceStatus && forcedVersion && parsed.size === 1 ? forcedVersion : version;
      mergeSection(
        sections,
        resolvedVersion,
        Object.assign({}, section, options.forceStatus ? { status: options.forceStatus } : {}),
        null,
        sourceRef,
      );
    }
    return;
  }
  if (forcedVersion) {
    const draft = /-draft$|beta|draft|upcoming/i.test(forcedVersion);
    mergeSection(sections, forcedVersion, {
      version: forcedVersion,
      status: draft ? parser.DRAFT_STATUS : parser.RELEASED_STATUS,
      cards: parser.splitCards(content.replace(/\r/g, '').split('\n')),
      sourceSections: [path.basename(sourceRef.value || '')],
    }, null, sourceRef);
  }
}

function sourceRef(rootDir, type, label, filePath) {
  return { type, label, value: relativePath(rootDir, filePath) };
}

function loadMainNoteSources(rootDir, sections, options) {
  const onenotePath = options.onenotePath || path.join(rootDir, 'docs', 'onenote-core-release-notes.html');
  const sanitizedPath = options.sanitizedNotesPath || path.join(rootDir, 'frontend', 'knowledge', 'raw', 'release-note-import', 'release-notes-sanitized.md');

  if (onenotePath && fs.existsSync(onenotePath)) {
    parseInputText(
      sections,
      fs.readFileSync(onenotePath, 'utf8'),
      sourceRef(rootDir, 'onenote', 'OneNote export', onenotePath),
      options,
    );
  } else if (sanitizedPath && fs.existsSync(sanitizedPath)) {
    parseInputText(
      sections,
      fs.readFileSync(sanitizedPath, 'utf8'),
      sourceRef(rootDir, 'release-notes', 'Sanitized release notes', sanitizedPath),
      options,
    );
  }
}

function loadManualSources(rootDir, sections, options) {
  const manualDir = options.manualNotesDir || path.join(rootDir, 'orchestrator', 'release-notes');
  for (const filePath of listFiles(manualDir, (name) => /\.(md|txt)$/i.test(name))) {
    const { metadata, content } = parseMetadata(fs.readFileSync(filePath, 'utf8'));
    const forcedVersion = metadata.version || path.basename(filePath).replace(/\.(md|txt)$/i, '').replace(/^v/i, '');
    const isDraft = metadata.status === parser.DRAFT_STATUS || /-draft$/i.test(forcedVersion);
    const status = isDraft ? parser.DRAFT_STATUS : parser.RELEASED_STATUS;
    parseInputText(
      sections,
      content,
      sourceRef(rootDir, 'manual', metadata.source || 'Saved release notes', filePath),
      Object.assign({}, options, { forceStatus: status }),
      forcedVersion,
    );
  }
}

function normalizeRawCards(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value.cards)) return value.cards;
  if (Array.isArray(value.items)) return value.items;
  if (value.text || value.title || value.description || value.action) return [value];
  return [];
}

function loadRawCardSources(rootDir, sections, options) {
  const rawDir = options.rawInputDir || path.join(rootDir, 'release-notes', 'raw');
  const cardsDir = path.join(rawDir, 'cards');
  for (const filePath of listFiles(cardsDir)) {
    if (/^README(?:\.[^.]+)?$/i.test(path.basename(filePath)) || entryIsPlaceholder(filePath)) continue;
    const extension = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, 'utf8');
    if (extension === '.json') {
      const value = readJson(filePath);
      const version = value && value.version ? String(value.version) : path.basename(filePath, extension);
      mergeSection(sections, version, {
        version,
        status: /draft|upcoming/i.test(value.status || version) ? parser.DRAFT_STATUS : parser.RELEASED_STATUS,
        sourceSections: [path.basename(filePath)],
      }, normalizeRawCards(value), sourceRef(rootDir, 'cards', 'Release cards', filePath));
    } else if (/\.(md|txt)$/i.test(filePath)) {
      parseInputText(
        sections,
        content,
        sourceRef(rootDir, 'cards', 'Release cards', filePath),
        options,
        path.basename(filePath, extension),
      );
    }
  }
}

function entryIsPlaceholder(filePath) {
  return path.basename(filePath).startsWith('.gitkeep');
}

function loadCandidates(rootDir, options) {
  const candidateDir = options.candidateDir || path.join(rootDir, 'ingest', 'knowledge', 'candidates', 'releases');
  const records = new Map();
  for (const filePath of listFiles(candidateDir, (name) => /\.json$/i.test(name))) {
    try {
      const record = readJson(filePath);
      if (!record || !record.version) continue;
      record.__sourcePath = relativePath(rootDir, filePath);
      records.set(String(record.version), record);
    } catch (error) {
      throw new Error(`Cannot parse release candidate ${filePath}: ${error.message}`);
    }
  }

  const rawDir = options.rawInputDir || path.join(rootDir, 'release-notes', 'raw');
  const diffDir = path.join(rawDir, 'git-diffs');
  for (const filePath of listFiles(diffDir, (name) => /\.json$/i.test(name))) {
    const parsed = readJson(filePath);
    const values = Array.isArray(parsed) ? parsed : [parsed];
    for (const item of values) {
      if (!item || !item.version) continue;
      const existing = records.get(String(item.version)) || { version: String(item.version), changes: [] };
      const merged = Object.assign({}, existing, item);
      merged.changes = Array.isArray(item.changes) ? item.changes : existing.changes || [];
      merged.__sourcePath = relativePath(rootDir, filePath);
      records.set(String(item.version), merged);
    }
  }
  return records;
}

function buildReports(options) {
  options = options || {};
  const rootDir = options.rootDir || ROOT_DIR;
  const sections = new Map();
  loadMainNoteSources(rootDir, sections, options);
  loadManualSources(rootDir, sections, options);
  loadRawCardSources(rootDir, sections, options);
  const candidates = loadCandidates(rootDir, options);

  if (options.additionalDiffRecord) {
    const version = String(options.additionalDiffRecord.version);
    candidates.set(version, Object.assign({}, candidates.get(version) || {}, options.additionalDiffRecord));
  }

  for (const [version, candidate] of candidates) {
    if (!sections.has(version)) {
      sections.set(version, {
        version,
        status: parser.DRAFT_STATUS,
        cards: [],
        sourceSections: ['git-diff-only'],
        sourceRefs: [],
        releaseDate: null,
      });
    }
  }

  const reports = [];
  for (const section of Array.from(sections.values()).sort((a, b) => parser.compareVersions(a.version, b.version))) {
    const candidate = candidates.get(parser.normalizeBaseVersion(section.version))
      || candidates.get(section.version)
      || null;
    reports.push(report.buildReport(Object.assign({}, section, {
      diffRecord: candidate,
      sourceRefs: section.sourceRefs || [],
    })));
  }
  return reports;
}

function getReport(version, options) {
  const reports = buildReports(options);
  const resolved = parser.resolveVersionQuery(version, reports.map((item) => item.version));
  if (!resolved) return null;
  return reports.find((item) => item.version === resolved) || null;
}

function getRange(sourceVersion, targetVersion, options) {
  return report.aggregateRange(buildReports(options), sourceVersion, targetVersion);
}

function search(query, options) {
  return report.searchReports(buildReports(options), Object.assign({}, options, { query }));
}

module.exports = {
  CANDIDATE_DIR,
  MANUAL_NOTES_DIR,
  RAW_INPUT_DIR,
  RAW_ONENOTE_FILE,
  SANITIZED_NOTES_FILE,
  buildReports,
  getRange,
  getReport,
  listFiles,
  loadCandidates,
  parseInputText,
  relativePath,
  search,
};

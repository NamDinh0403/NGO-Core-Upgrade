'use strict';
/*
 * Team Release Notes & Migration Notes Manager.
 *
 * Stores and retrieves OneNote/Markdown release notes for NGO Core releases.
 * Ingests team notes into the upgrade pipeline so Copilot CLI and repair/review
 * reasoning can inspect exact breaking changes, migrations, and notes.
 * Dependency-free, Node 14+.
 */

const fs = require('fs');
const path = require('path');
const notesParser = require('../ingest/tools/lib/notes');
const knowledgeLib = require('../engine/tools/lib/knowledge');
const releaseCatalog = require('./release-notes/catalog');
const releaseReport = require('./release-notes/report');
const clientFilter = require('./release-notes/client-filter');

const ROOT_DIR = path.resolve(__dirname, '..');
const NOTES_DIR = path.join(ROOT_DIR, 'orchestrator', 'release-notes');
const SANITIZED_NOTES_FILE = path.join(ROOT_DIR, 'frontend', 'knowledge', 'raw', 'release-note-import', 'release-notes-sanitized.md');

function ensureNotesDir() {
  if (!fs.existsSync(NOTES_DIR)) {
    fs.mkdirSync(NOTES_DIR, { recursive: true });
  }
}

/**
 * Save or update release notes for a target Core version.
 */
function saveReleaseNotes(version, content, metadata) {
  if (!version || typeof version !== 'string') {
    throw new Error('Valid Core version string is required');
  }
  const cleanVer = version.trim().replace(/^v/i, '');
  ensureNotesDir();

  const filePath = path.join(NOTES_DIR, `${cleanVer}.md`);
  const meta = Object.assign({
    version: cleanVer,
    savedAt: new Date().toISOString(),
    source: 'team_onenote',
  }, metadata || {});

  const header = `<!-- NGO_RELEASE_NOTES_META: ${JSON.stringify(meta)} -->\n`;
  const body = String(content || '').trim();
  fs.writeFileSync(filePath, header + body, 'utf8');

  return {
    ok: true,
    version: cleanVer,
    filePath,
    savedAt: meta.savedAt,
    contentLength: body.length,
  };
}

/**
 * Get release notes for a Core version.
 */
function getRawReleaseNotes(version) {
  if (!version) return null;
  const cleanVer = String(version).trim().replace(/^v/i, '');
  const candidateFiles = [
    path.join(NOTES_DIR, `${cleanVer}.md`),
    path.join(NOTES_DIR, `${cleanVer}.txt`),
    path.join(NOTES_DIR, `v${cleanVer}.md`),
  ];

  for (const fp of candidateFiles) {
    if (fs.existsSync(fp)) {
      try {
        const raw = fs.readFileSync(fp, 'utf8');
        let content = raw;
        let metadata = { version: cleanVer, source: 'file' };
        const metaMatch = raw.match(/<!--\s*NGO_RELEASE_NOTES_META:\s*({[^>]+})\s*-->/);
        if (metaMatch) {
          try {
            metadata = JSON.parse(metaMatch[1]);
            content = raw.replace(metaMatch[0], '').trim();
          } catch (_) {}
        }
        return {
          exists: true,
          version: cleanVer,
          filePath: fp,
          content,
          metadata,
          source: metadata.source || 'orchestrator/release-notes',
        };
      } catch (_) {}
    }
  }

  // Fallback to sanitized team release notes (frontend/knowledge/raw/release-note-import/release-notes-sanitized.md)
  if (fs.existsSync(SANITIZED_NOTES_FILE)) {
    try {
      const rawSanitized = fs.readFileSync(SANITIZED_NOTES_FILE, 'utf8');
      const cards = notesParser.cardsFor(rawSanitized, cleanVer);
      if (cards && cards.length > 0) {
        return {
          exists: true,
          version: cleanVer,
          filePath: SANITIZED_NOTES_FILE,
          content: cards.join('\n\n'),
          metadata: { version: cleanVer, source: 'release-notes-sanitized' },
          source: 'release-notes-sanitized',
        };
      }
    } catch (_) {}
  }

  // Fallback to canonical release YAML store
  try {
    const store = knowledgeLib.defaultStore();
    const reqs = store.loadScopeRequirements ? store.loadScopeRequirements(cleanVer) : [];
    if (reqs && reqs.length > 0) {
      const formatted = reqs.map((r) => `[${r.id}] (${r.scope}) ${r.title}: ${r.action || r.description || ''}`).join('\n');
      return {
        exists: true,
        version: cleanVer,
        filePath: path.join(store.RELEASES_DIR, cleanVer, 'release.yaml'),
        content: formatted,
        metadata: { version: cleanVer, source: 'canonical_knowledge' },
        source: 'canonical_knowledge',
      };
    }
  } catch (_) {}

  // Fallback to ingest knowledge candidate if available
  const candidateJson = path.join(ROOT_DIR, 'ingest', 'knowledge', 'candidates', 'releases', `${cleanVer}.json`);
  if (fs.existsSync(candidateJson)) {
    try {
      const data = JSON.parse(fs.readFileSync(candidateJson, 'utf8'));
      if (data.releaseNotes || data.notes || data.summary) {
        return {
          exists: true,
          version: cleanVer,
          filePath: candidateJson,
          content: data.releaseNotes || data.notes || data.summary,
          metadata: { version: cleanVer, source: 'ingest_knowledge' },
          source: 'ingest_knowledge',
        };
      }
    } catch (_) {}
  }

  return {
    exists: false,
    version: cleanVer,
    content: null,
    source: null,
  };
}

/**
 * Get a release as the structured four-table PM/Developer/Deployer report.
 * Raw source content remains available for compatibility and deterministic
 * ingest consumers through rawContent and getRawReleaseNotes().
 */
function getReleaseNotes(version, options) {
  if (!version) return null;
  const report = releaseCatalog.getReport(version, options);
  if (!report) {
    return {
      exists: false,
      version: String(version).replace(/^v/i, ''),
      content: null,
      source: null,
    };
  }
  const raw = getRawReleaseNotes(report.version);
  const content = releaseReport.renderMarkdown(report);
  return {
    exists: true,
    version: report.version,
    status: report.status,
    filePath: raw && raw.exists ? raw.filePath : null,
    content,
    rawContent: raw && raw.exists ? raw.content : null,
    report,
    metadata: Object.assign({ version: report.version }, raw && raw.metadata ? raw.metadata : {}, {
      status: report.status,
    }),
    source: raw && raw.source ? raw.source : (report.sourceRefs[0] && report.sourceRefs[0].type) || 'release-report',
  };
}

/**
 * Get cumulative release notes across all releases in (sourceVersion, targetVersion].
 */
function getReleaseNotesForRange(sourceVersion, targetVersion, options) {
  const range = releaseCatalog.getRange(sourceVersion, targetVersion, options);
  return {
    exists: range.reports.length > 0,
    versions: range.versions,
    content: range.reports.length > 0 ? releaseReport.renderRangeMarkdown(range) : null,
    range,
  };
}

function searchReleaseNotes(query, options) {
  return releaseCatalog.search(query, options);
}

function filterReleaseNotesForClient(version, clientPath, options) {
  const report = releaseCatalog.getReport(version, options);
  if (!report) return null;
  return clientFilter.filterForClient(report, clientPath);
}

/**
 * List all versions with stored release notes.
 */
function listReleaseNotes() {
  return releaseCatalog.buildReports()
    .map((report) => ({
      version: report.version,
      status: report.status,
      filePath: report.sourceRefs[0] && report.sourceRefs[0].value || null,
      source: report.sourceRefs[0] && report.sourceRefs[0].type || 'release-report',
      preview: releaseReport.renderMarkdown(report).slice(0, 160),
      savedAt: report.releaseDate || null,
      summary: report.summary,
    }))
    .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
}

module.exports = {
  saveReleaseNotes,
  getReleaseNotes,
  getRawReleaseNotes,
  getReleaseNotesForRange,
  searchReleaseNotes,
  filterReleaseNotesForClient,
  listReleaseNotes,
  NOTES_DIR,
  SANITIZED_NOTES_FILE,
  GENERATED_NOTES_DIR: path.join(ROOT_DIR, 'release-notes', 'generated'),
};

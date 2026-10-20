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

const ROOT_DIR = path.resolve(__dirname, '..');
const NOTES_DIR = path.join(ROOT_DIR, 'orchestrator', 'release-notes');

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
function getReleaseNotes(version) {
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
 * List all versions with stored release notes.
 */
function listReleaseNotes() {
  ensureNotesDir();
  const results = [];
  try {
    for (const file of fs.readdirSync(NOTES_DIR)) {
      if (file.endsWith('.md') || file.endsWith('.txt')) {
        const ver = file.replace(/\.(md|txt)$/i, '').replace(/^v/i, '');
        const data = getReleaseNotes(ver);
        if (data && data.exists) {
          results.push({
            version: ver,
            filePath: data.filePath,
            source: data.source,
            preview: (data.content || '').slice(0, 160),
            savedAt: data.metadata?.savedAt || null,
          });
        }
      }
    }
  } catch (_) {}
  return results.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
}

module.exports = {
  saveReleaseNotes,
  getReleaseNotes,
  listReleaseNotes,
  NOTES_DIR,
};

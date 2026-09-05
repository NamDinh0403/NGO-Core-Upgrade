'use strict';
/*
 * release-notes.md splitter. The real file's observed format (see
 * frontend/knowledge/raw/release-note-import/release-notes-sanitized.md):
 * a bare version-number line ("9.2.0") starts a new section; everything until
 * the next bare version-number line belongs to that version; individual
 * "cards" within a version are separated by blank lines. Content is NOT
 * pre-separated by backend/frontend — a single card can mix both, which is
 * exactly why one shared parse (not two independent ones) is more accurate.
 */

const VERSION_LINE_RE = /^\s*(\d+\.\d+\.\d+)\s*$/;

/** Returns Map<version, string[]> — each string is one blank-line-delimited "card". */
function parse(text) {
  const lines = (text || '').split(/\r?\n/);
  const sections = new Map();
  let current = null;
  let buf = [];
  const flushSection = () => {
    if (current == null) return;
    const raw = buf.join('\n');
    const cards = raw.split(/\n\s*\n+/).map((s) => s.trim()).filter(Boolean);
    sections.set(current, cards);
  };
  for (const line of lines) {
    const m = line.match(VERSION_LINE_RE);
    if (m) {
      flushSection();
      current = m[1];
      buf = [];
    } else if (current != null) {
      buf.push(line);
    }
  }
  flushSection();
  return sections;
}

/** Cards for a single version, or [] if the version has no section. */
function cardsFor(text, version) {
  const sections = parse(text);
  return sections.get(version) || [];
}

module.exports = { parse, cardsFor, VERSION_LINE_RE };

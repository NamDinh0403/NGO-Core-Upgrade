'use strict';

const DRAFT_STATUS = 'DRAFT / IN PROGRESS';
const RELEASED_STATUS = 'RELEASED';

const CONDITIONAL_DRAFT_HEADINGS = [
  { type: 'waiting', pattern: /^waiting list(?:\s*\([^)]*\))?\s*:?$/i },
  { type: 'next-major', pattern: /^next major version(?:\s*\([^)]*\))?\s*:?$/i },
  { type: 'next', pattern: /^next version(?:\s*\([^)]*\))?\s*:?$/i },
];

function normalizeBaseVersion(value) {
  const raw = String(value || '').trim().replace(/^v/i, '').replace(/\s*\((?:beta|draft|rc[^)]*)\)\s*$/i, '');
  const match = raw.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  return `${Number(match[1])}.${Number(match[2] || 0)}.${Number(match[3] || 0)}`;
}

function versionParts(value) {
  const normalized = normalizeBaseVersion(value);
  if (!normalized) return null;
  return normalized.split('.').map(Number);
}

function compareVersions(left, right) {
  const a = versionParts(left);
  const b = versionParts(right);
  if (!a && !b) return String(left).localeCompare(String(right));
  if (!a) return -1;
  if (!b) return 1;
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

function decodeHtmlEntities(value) {
  const named = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
    ndash: '\u2013',
    mdash: '\u2014',
    ensp: ' ',
    emsp: ' ',
  };
  return String(value || '')
    .replace(/&#(\d+);/g, (all, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (all, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (all, name) => named[name.toLowerCase()] || all);
}

function stripTags(value) {
  return decodeHtmlEntities(String(value || '').replace(/<[^>]*>/g, ' '));
}

function htmlToText(html) {
  let text = String(html || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/>\s+</g, '><');

  text = text.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (all, href, label) => {
    const visible = stripTags(label).replace(/\s+/g, ' ').trim();
    const decodedHref = decodeHtmlEntities(href).trim();
    if (!visible) return decodedHref;
    return visible.includes(decodedHref) ? visible : `${visible} ${decodedHref}`;
  });

  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:h[1-6]|p|div|li|ul|ol|table|tr)>/gi, '\n')
    .replace(/<(?:h[1-6])\b[^>]*>/gi, '\n\n')
    .replace(/<li\b[^>]*>/gi, '\n- ')
    .replace(/<[^>]*>/g, ' ');

  text = decodeHtmlEntities(text)
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line
      .replace(/\s+(?:width|height|src|data-[a-z0-9-]+)=["'][^"']*["']/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

function headingFor(line) {
  let text = String(line || '')
    .replace(/^\s*#{1,6}\s+/, '')
    .replace(/\*\*|__/g, '')
    .trim()
    .replace(/\s*\.\s*$/, '');

  for (const heading of CONDITIONAL_DRAFT_HEADINGS) {
    if (heading.pattern.test(text)) return { type: heading.type, draft: true, label: text };
  }

  const match = text.match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:\s*[-(]\s*(beta|draft|preview|upcoming|release candidate|rc\d*)\s*\)?)?\s*$/i);
  if (!match) return null;
  const version = `${Number(match[1])}.${Number(match[2] || 0)}.${Number(match[3] || 0)}`;
  const draft = Boolean(match[4]);
  return {
    type: draft ? 'explicit-draft' : 'released',
    version,
    draft,
    label: text,
  };
}

function splitCards(lines) {
  const normalized = lines.join('\n').trim();
  if (!normalized) return [];
  return normalized
    .split(/\n\s*\n+/)
    .map((card) => card.trim())
    .filter((card) => card && !/^[-\s]*$/.test(card));
}

function draftVersionFor(type, latestReleased, explicitDrafts, options) {
  const requested = normalizeBaseVersion(options.targetVersion);
  const requestedNumber = requested ? versionParts(requested) : null;
  const latestNumber = latestReleased ? versionParts(latestReleased) : null;

  if (requested && (!latestReleased || compareVersions(requested, latestReleased) > 0)) {
    return requested;
  }
  if (explicitDrafts.length > 0) {
    return explicitDrafts.slice().sort(compareVersions).pop();
  }
  if (!latestNumber) return requested || 'upcoming';
  if (type === 'next-major') {
    return `${latestNumber[0] + 1}.0.0`;
  }
  if (type === 'waiting') {
    return requested || `${latestNumber[0] + 1}.0.0`;
  }
  return `${latestNumber[0]}.${latestNumber[1]}.${latestNumber[2] + 1}`;
}

function parseText(text, options) {
  options = options || {};
  const sourceText = /<html\b|<body\b|<h[1-6]\b|<p\b/i.test(String(text || ''))
    ? htmlToText(text)
    : String(text || '').replace(/\r/g, '').trim();
  const rawLines = sourceText.split('\n').map((line) => line.trimEnd());
  const rawSections = [];
  let current = null;

  function flush() {
    if (!current) return;
    const cards = splitCards(current.lines);
    rawSections.push(Object.assign({}, current, { cards }));
    current = null;
  }

  for (const line of rawLines) {
    const trimmed = line.trim();
    const heading = headingFor(trimmed);
    if (heading) {
      flush();
      current = Object.assign({ lines: [], label: trimmed }, heading);
    } else if (current) {
      current.lines.push(line);
    }
  }
  flush();

  const releasedVersions = rawSections
    .filter((section) => section.type === 'released')
    .map((section) => section.version)
    .sort(compareVersions);
  const explicitDrafts = rawSections
    .filter((section) => section.type === 'explicit-draft')
    .map((section) => section.version);
  const latestReleased = releasedVersions[releasedVersions.length - 1] || null;
  const parsed = new Map();

  function add(section, version, status) {
    const existing = parsed.get(version) || {
      version,
      status,
      cards: [],
      sourceSections: [],
      releaseDate: null,
      isDraft: status === DRAFT_STATUS,
    };
    if (status === RELEASED_STATUS) existing.status = RELEASED_STATUS;
    existing.isDraft = existing.status === DRAFT_STATUS;
    existing.cards.push(...section.cards);
    existing.sourceSections.push(section.label || section.type);
    const dateLine = section.cards
      .flatMap((card) => card.split('\n'))
      .find((line) => /^\s*release date\s*:/i.test(line));
    if (dateLine) existing.releaseDate = dateLine.replace(/^\s*release date\s*:\s*/i, '').trim();
    parsed.set(version, existing);
  }

  for (const section of rawSections) {
    if (section.type === 'released') {
      add(section, section.version, RELEASED_STATUS);
    } else if (section.type === 'explicit-draft') {
      add(section, `${section.version}-draft`, DRAFT_STATUS);
    } else if (section.type === 'waiting' || section.type === 'next' || section.type === 'next-major') {
      const draftBase = draftVersionFor(section.type, latestReleased, explicitDrafts, options);
      const draftVersion = draftBase === 'upcoming' ? 'upcoming' : `${draftBase}-draft`;
      add(section, draftVersion, DRAFT_STATUS);
    }
  }

  return parsed;
}

function parseInputFile(filePath, content, options) {
  return parseText(content, options);
}

function resolveVersionQuery(query, versions) {
  const raw = String(query || '').trim().replace(/^v/i, '');
  const explicitDraft = /(?:-draft|beta|draft|upcoming)$/i.test(raw);
  const normalized = normalizeBaseVersion(raw);
  const available = Array.from(versions);
  if (available.includes(raw)) return raw;
  if (!normalized) return null;
  const numericPart = raw.replace(/(?:-draft|beta|draft|upcoming)$/i, '');
  const segmentCount = numericPart.split('.').filter(Boolean).length;
  if (segmentCount >= 3) {
    if (available.includes(normalized)) return normalized;
    if (available.includes(`${normalized}-draft`)) return `${normalized}-draft`;
  }

  const matches = available.filter((version) => {
    const parts = versionParts(version);
    const normalizedParts = versionParts(normalized);
    if (!parts || !normalizedParts) return false;
    const segments = raw.split('.').filter(Boolean).length;
    for (let i = 0; i < Math.max(1, Math.min(segments, 3)); i++) {
      if (parts[i] !== normalizedParts[i]) return false;
    }
    return explicitDraft ? /draft$/i.test(version) : true;
  });
  if (matches.length === 0) return null;
  return matches.sort((a, b) => {
    const versionOrder = compareVersions(a, b);
    if (versionOrder !== 0) return versionOrder;
    return /draft$/i.test(a) ? -1 : 1;
  }).pop();
}

module.exports = {
  DRAFT_STATUS,
  RELEASED_STATUS,
  compareVersions,
  decodeHtmlEntities,
  headingFor,
  htmlToText,
  normalizeBaseVersion,
  parseInputFile,
  parseText,
  resolveVersionQuery,
  splitCards,
  versionParts,
};

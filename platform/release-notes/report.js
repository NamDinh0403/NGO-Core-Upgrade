'use strict';

const path = require('path');
const crypto = require('crypto');
const classifier = require('./classifier');
const parser = require('./parser');

const TIMING_ORDER = {
  'Before Deploy': 0,
  'During Upgrade': 1,
  'After Deploy': 2,
};

function compact(value) {
  return String(value || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
}

function markdownCell(value) {
  return compact(value).replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function markdownRef(ref) {
  const value = ref && (ref.url || ref.value || ref);
  if (!value) return '';
  const label = ref && ref.label
    ? ref.label
    : /trello\.com/i.test(value)
      ? 'Card'
      : /pullrequest|\/pull\/|\/pr\//i.test(value)
        ? 'PR'
        : 'Source';
  return `[${label}](${String(value).replace(/\)/g, '%29')})`;
}

function refsFor(card, text) {
  const urls = classifier.extractUrls(text);
  const structured = [];
  const supplied = card && (card.cardOrPr || card.refs || card.references);
  for (const ref of Array.isArray(supplied) ? supplied : supplied ? [supplied] : []) {
    if (typeof ref === 'string') {
      structured.push({ label: /trello\.com/i.test(ref) ? 'Card' : 'PR', value: ref });
    } else if (ref && (ref.url || ref.value)) {
      structured.push({ label: ref.label || (/trello\.com/i.test(ref.url || ref.value) ? 'Card' : 'Source'), value: ref.url || ref.value });
    }
  }
  for (const url of urls) {
    if (!structured.some((ref) => ref.value === url)) {
      structured.push({ label: /trello\.com/i.test(url) ? 'Card' : /pullrequest|\/pull\/|\/pr\//i.test(url) ? 'PR' : 'Ref', value: url });
    }
  }
  return structured;
}

function stripUrls(text) {
  return String(text || '').replace(/https?:\/\/\S+/gi, '').replace(/\s+\n/g, '\n').trim();
}

function firstLine(text) {
  const line = stripUrls(text).split(/\n/).map((item) => item.trim()).find(Boolean);
  return line ? line.replace(/^[-*]\s*/, '') : 'Release note';
}

function cardText(card) {
  if (typeof card === 'string') return card;
  if (!card) return '';
  return compactCardParts([
    card.title,
    card.description,
    card.summary,
    card.instructions,
    card.notes,
    card.action,
    card.text,
  ]);
}

function compactCardParts(parts) {
  const values = parts.filter((value) => value != null && String(value).trim());
  return redactSensitiveValues(Array.from(new Set(values.map(String))).join('\n').trim());
}

function redactSensitiveValues(value) {
  return String(value || '')
    .replace(/\bBearer\s+[A-Za-z0-9._~-]+/gi, 'Bearer <FROM_SECRET_PROVIDER>')
    .replace(
      /((?:api[-_]?key|subscription[-_]?key|client[-_]?secret|secret[-_]?key|access[-_]?token|token|password|signature|credential|connectionstring)\s*["']?\s*[:=]\s*["']?)([^"'`,;\s}<]+)/gi,
      '$1<FROM_SECRET_PROVIDER>',
    )
    .replace(/((?:https?|git|ssh):\/\/)[^/@\s]+@/gi, '$1<REDACTED>@');
}

function redactObject(value) {
  if (typeof value === 'string') return redactSensitiveValues(value);
  if (Array.isArray(value)) return value.map(redactObject);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redactObject(item)]));
}

function moduleScope(text, changes, metadata) {
  if (metadata && metadata.moduleScope) return String(metadata.moduleScope);
  if (metadata && metadata.scope) return String(metadata.scope);
  const ignored = /^(?:s|m|l|xl|t|upgrade|deployment|for deployment(?: person)?|before deployment|after deployment|afterdeployment|beforedeployment)$/i;
  const labels = [];
  const scopeText = String(text || '').replace(/\[\[[^\]]+]]/g, ' ');
  for (const match of scopeText.matchAll(/\[([^\]]+)]/g)) {
    const label = match[1].trim();
    if (!ignored.test(label) && !labels.includes(label)) labels.push(label);
  }
  if (labels.length) return labels.join(' / ');

  const paths = (changes || []).map((change) => change.path || '').join('\n').toLowerCase();
  if (paths && /frontend|ngo-client|\.ts\b|\.html\b/.test(paths)) return 'Frontend';
  if (paths && /ngo-api|\.cs\b|\.csproj\b/.test(paths)) return 'Backend';
  if (paths && /\.sql\b|migration/.test(paths)) return 'Database / Deployment';
  if (/\b(?:angular|component|environment|route|frontend|package\.json)\b/i.test(text)) return 'Frontend';
  if (/\b(?:controller|entity|repository|appsettings|backend|dotnet|nuget|EF migration)\b/i.test(text)) return 'Backend';
  if (/\b(?:sql|datafix|sharepoint|deployment)\b/i.test(text)) return 'Database / Deployment';
  return 'Shared / Cross-track';
}

function matchingChanges(text, changes) {
  const normalized = String(text || '').toLowerCase();
  return (changes || []).filter((change) => {
    const fullPath = String(change.path || '');
    const base = path.basename(fullPath).replace(/\.[^.]+$/, '').toLowerCase();
    return fullPath && ((base.length >= 4 && normalized.includes(base)) || normalized.includes(fullPath.toLowerCase()));
  });
}

function scopeSummary(changes) {
  const counts = { backend: 0, frontend: 0, shared: 0 };
  for (const change of changes || []) {
    if (counts[change.scope] == null) counts[change.scope] = 0;
    counts[change.scope]++;
  }
  return Object.entries(counts)
    .filter((entry) => entry[1] > 0)
    .map(([scope, count]) => `${scope}: ${count}`)
    .join(', ');
}

function diffSummary(text, diffRecord) {
  const changes = diffRecord && Array.isArray(diffRecord.changes) ? diffRecord.changes : [];
  if (changes.length === 0) return 'No deterministic git-diff evidence was supplied for this note.';
  const matched = matchingChanges(text, changes);
  const selected = matched.length > 0 ? matched : changes.slice(0, 6);
  const summary = selected
    .map((change) => `${change.status || 'M'} \`${change.path}\``)
    .join(', ');
  if (matched.length > 0) return `Matched key changes: ${summary}`;
  return `No deterministic note-to-file match. Release diff covers ${changes.length} files (${scopeSummary(changes)}); representative changes: ${summary}.`;
}

function evidenceId(version, index, suffix) {
  return crypto.createHash('sha1').update(`${version}:${index}:${suffix}`).digest('hex').slice(0, 12);
}

function normalizedMetadata(card) {
  if (!card || typeof card !== 'object') return {};
  return Object.assign({}, card.metadata || {}, card);
}

function appendUniqueAction(target, action) {
  const key = `${action.applicability}|${action.action}|${action.instructionsAndNotes}|${action.cardOrPr.map((ref) => ref.value).join(',')}`;
  if (!target.some((item) => item._key === key)) target.push(Object.assign(action, { _key: key }));
}

function actionFromCard(version, card, index, diffRecord) {
  const text = cardText(card);
  const metadata = normalizedMetadata(card);
  const classified = classifier.classifyItem(text, metadata);
  const refs = refsFor(card, text);
  const action = {
    id: `action-${evidenceId(version, index, classified.action)}`,
    version,
    applicability: classified.applicability,
    condition: classified.applicability === 'conditional'
      ? classified.condition || 'Client-specific condition must be confirmed.'
      : classified.applicability === 'needs_review'
        ? 'Confirm whether every client or only matching clients must run this item.'
        : null,
    timing: classified.timing,
    owner: classified.owner,
    action: metadata.tool || metadata.action || classified.action,
    instructionsAndNotes: stripUrls(text) || classified.action,
    cardOrPr: refs,
    category: 'upgrade_action',
    needsReview: classified.applicability === 'needs_review',
    classificationReason: classified.classificationReason,
    sourceSection: metadata.sourceSection || null,
    gitDiffSummary: diffSummary(text, diffRecord),
  };
  return action;
}

function trackingFromCard(version, card, index, category, diffRecord, action) {
  const text = cardText(card);
  const metadata = normalizedMetadata(card);
  const refs = refsFor(card, text);
  const common = {
    id: `${category}-${evidenceId(version, index, firstLine(text))}`,
    version,
    moduleScope: moduleScope(text, matchingChanges(text, diffRecord && diffRecord.changes), metadata),
    cardOrPr: refs,
    category,
    needsReview: false,
    sourceSection: metadata.sourceSection || null,
  };

  if (category === 'feature') {
    return Object.assign(common, {
      featureOrChange: metadata.title || firstLine(text),
      technicalSummary: diffSummary(text, diffRecord),
      clientImpact: action
        ? `${action.applicability === 'needs_review' ? 'Needs Review: ' : ''}${action.condition || 'Action applies during the upgrade.'} ${action.action}`
        : 'No explicit client action was stated in the release source.',
    });
  }

  return Object.assign(common, {
    bugDescription: metadata.title || firstLine(text),
    rootCauseOrKeyFiles: diffSummary(text, diffRecord),
    extraClientAction: action
      ? `${action.applicability === 'needs_review' ? 'Needs Review: ' : ''}${action.condition ? `${action.condition}. ` : ''}${action.action}`
      : 'None stated in the release source.',
  });
}

function buildReport(input) {
  input = input || {};
  const version = input.version;
  if (!version) throw new Error('Release report version is required');
  const cards = Array.isArray(input.cards) ? input.cards : [];
  const diffRecord = input.diffRecord || null;
  const mandatoryActions = [];
  const conditionalActions = [];
  const needsReviewActions = [];
  const newFeatures = [];
  const bugFixes = [];

  cards.forEach((card, index) => {
    const text = cardText(card);
    if (!text) return;
    const metadata = normalizedMetadata(card);
    const category = classifier.classifyCategory(text, metadata);
    const hasAction = classifier.isAction(text, metadata);
    const action = hasAction ? actionFromCard(version, card, index, diffRecord) : null;

    if (action) {
      if (action.applicability === 'mandatory') appendUniqueAction(mandatoryActions, action);
      else if (action.applicability === 'conditional') appendUniqueAction(conditionalActions, action);
      else appendUniqueAction(needsReviewActions, action);
    }

    if (category === 'feature') {
      newFeatures.push(trackingFromCard(version, card, index, 'feature', diffRecord, action));
    } else if (category === 'bugfix') {
      bugFixes.push(trackingFromCard(version, card, index, 'bugfix', diffRecord, action));
    } else if (!action) {
      appendUniqueAction(needsReviewActions, actionFromCard(version, card, index, diffRecord));
    }
  });

  if (diffRecord && cards.length === 0) {
    const changes = Array.isArray(diffRecord.changes) ? diffRecord.changes : [];
    if (changes.length > 0) {
      const synthetic = {
        title: `Review release ${version} git-diff evidence`,
        instructions: `The candidate contains ${changes.length} changed files (${scopeSummary(changes)}) but no matching release-note cards. Review the complete diff before classifying client actions: ${changes.slice(0, 20).map((change) => change.path).join(', ')}`,
        applicability: 'needs_review',
        category: 'upgrade_action',
        sourceSection: 'git-diff-only',
      };
      appendUniqueAction(needsReviewActions, actionFromCard(version, synthetic, 0, diffRecord));
    }
  }

  const unresolved = diffRecord && Array.isArray(diffRecord.unresolvedItems) ? diffRecord.unresolvedItems : [];
  if (unresolved.length > 0) {
    const existingReviewText = needsReviewActions.map((item) => item.instructionsAndNotes).join('\n');
    if (!existingReviewText.includes(unresolved[0])) {
      const synthetic = {
        title: `Resolve ingestion uncertainty for ${version}`,
        instructions: `${unresolved.length} unresolved candidate item(s) require review. The complete list is retained in the structured report metadata and source candidate. Examples: ${unresolved.slice(0, 3).join(' | ')}`,
        applicability: 'needs_review',
        category: 'upgrade_action',
        sourceSection: 'candidate-unresolved-items',
      };
      appendUniqueAction(needsReviewActions, actionFromCard(version, synthetic, cards.length, diffRecord));
    }
  }

  for (const collection of [mandatoryActions, conditionalActions, needsReviewActions]) {
    for (const item of collection) delete item._key;
  }

  const sourceRefs = Array.isArray(input.sourceRefs) ? input.sourceRefs : [];
  if (diffRecord && diffRecord.__sourcePath && !sourceRefs.some((ref) => ref.value === diffRecord.__sourcePath)) {
    sourceRefs.push({ type: 'git-diff', label: 'Candidate record', value: diffRecord.__sourcePath });
  }

  return redactObject({
    schemaVersion: 1,
    version,
    status: input.status || parser.RELEASED_STATUS,
    releaseDate: input.releaseDate || null,
    sourceRefs,
    summary: {
      mandatoryActions: mandatoryActions.length,
      conditionalActions: conditionalActions.length,
      needsReviewActions: needsReviewActions.length,
      newFeatures: newFeatures.length,
      bugFixes: bugFixes.length,
    },
    sections: {
      upgradeAndDeployment: {
        mandatoryActions,
        conditionalActions,
        needsReviewActions,
      },
      releaseTracking: {
        newFeatures,
        bugFixes,
      },
    },
    metadata: {
      sourceSections: input.sourceSections || [],
      rawCardCount: cards.length,
      gitDiffFileCount: diffRecord && Array.isArray(diffRecord.changes) ? diffRecord.changes.length : 0,
      unresolvedItems: unresolved,
    },
  });
}

function actionOrder(action) {
  return TIMING_ORDER[action.timing] == null ? 1 : TIMING_ORDER[action.timing];
}

function sortActions(actions) {
  return actions.slice().sort((left, right) => {
    const versionOrder = parser.compareVersions(left.version, right.version);
    if (versionOrder !== 0) return versionOrder;
    const timingOrder = actionOrder(left) - actionOrder(right);
    if (timingOrder !== 0) return timingOrder;
    return left.action.localeCompare(right.action);
  });
}

function renderRefCell(refs) {
  if (!refs || refs.length === 0) return '-';
  return refs.map(markdownRef).join('<br>');
}

function renderTable(headers, rows) {
  const lines = [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
  ];
  if (rows.length === 0) {
    lines.push(`| ${['None identified.', ...headers.slice(1).map(() => '-')].join(' | ')} |`);
  } else {
    for (const row of rows) lines.push(`| ${row.map(markdownCell).join(' | ')} |`);
  }
  return lines.join('\n');
}

function renderMarkdown(report) {
  const summary = report.summary || {};
  const upgrade = report.sections.upgradeAndDeployment;
  const tracking = report.sections.releaseTracking;
  const sourceRefs = (report.sourceRefs || [])
    .map((ref) => markdownRef(Object.assign({ label: ref.label || ref.type || 'Source' }, ref)))
    .join(', ') || 'None recorded';
  const conditionalRows = upgrade.conditionalActions
    .concat(upgrade.needsReviewActions)
    .sort((a, b) => actionOrder(a) - actionOrder(b));

  const mandatoryTable = renderTable(
    ['Tool / Action', 'Timing (Before Deploy / During Upgrade / After Deploy)', 'Owner (Client Dev / Deployer)', 'Instructions & Notes', 'Card / PR'],
    upgrade.mandatoryActions.map((item) => [
      item.action,
      item.timing,
      item.owner,
      item.instructionsAndNotes,
      renderRefCell(item.cardOrPr),
    ]),
  );
  const conditionalTable = renderTable(
    ['Applicability Condition (When to Run)', 'Tool / Action', 'Timing', 'Owner', 'Instructions & Notes', 'Card / PR'],
    conditionalRows.map((item) => [
      item.needsReview ? `⚠ Needs Review - ${item.condition}` : item.condition,
      item.action,
      item.timing,
      item.owner,
      item.instructionsAndNotes,
      renderRefCell(item.cardOrPr),
    ]),
  );
  const featureTable = renderTable(
    ['Module / Scope', 'Feature / Change', 'Technical Summary (from Git Diff)', 'Client Impact', 'Card / PR'],
    tracking.newFeatures.map((item) => [
      item.moduleScope,
      item.featureOrChange,
      item.technicalSummary,
      item.clientImpact,
      renderRefCell(item.cardOrPr),
    ]),
  );
  const bugFixTable = renderTable(
    ['Module / Scope', 'Bug Description', 'Root Cause / Key Files Changed (from Git Diff)', 'Extra Client Action?', 'Card / PR'],
    tracking.bugFixes.map((item) => [
      item.moduleScope,
      item.bugDescription,
      item.rootCauseOrKeyFiles,
      item.extraClientAction,
      renderRefCell(item.cardOrPr),
    ]),
  );

  return [
    `# NGO Core ${report.version} Release Notes`,
    '',
    `- **Version:** ${report.version}`,
    `- **Status:** ${report.status}`,
    `- **Release Date:** ${report.releaseDate || 'Not specified'}`,
    `- **Source Refs:** ${sourceRefs}`,
    `- **Quick Summary:** Mandatory Actions **${summary.mandatoryActions || 0}** | Conditional Actions **${summary.conditionalActions || 0}** | New Features **${summary.newFeatures || 0}** | Bug Fixes **${summary.bugFixes || 0}**${summary.needsReviewActions ? ` | Needs Review **${summary.needsReviewActions}**` : ''}`,
    '',
    '## Section A - Upgrade & Deployment Guide (Actionable)',
    '',
    '### Table 1: Mandatory Actions (Default - Run for ALL Clients)',
    '',
    mandatoryTable,
    '',
    '### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)',
    '',
    '> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.',
    '',
    conditionalTable,
    '',
    '## Section B - Release Tracking & Lookup (Features & Bug Fixes)',
    '',
    '### Table 3: New Features & Enhancements',
    '',
    featureTable,
    '',
    '### Table 4: Bug Fixes',
    '',
    bugFixTable,
    '',
  ].join('\n');
}

function rangeVersions(reports, sourceVersion, targetVersion) {
  const versions = reports.map((report) => report.version);
  const sourceBase = parser.normalizeBaseVersion(sourceVersion);
  const targetResolved = parser.resolveVersionQuery(targetVersion, versions)
    || parser.normalizeBaseVersion(targetVersion);
  return reports
    .filter((report) => {
      if (sourceBase && parser.compareVersions(report.version, sourceBase) <= 0) return false;
      if (targetResolved && parser.compareVersions(report.version, targetResolved) > 0) return false;
      return Boolean(report.version);
    })
    .sort((left, right) => parser.compareVersions(left.version, right.version));
}

function aggregateRange(reports, sourceVersion, targetVersion) {
  const included = rangeVersions(reports, sourceVersion, targetVersion);
  const mandatory = [];
  const conditional = [];
  const needsReview = [];
  for (const report of included) {
    mandatory.push(...report.sections.upgradeAndDeployment.mandatoryActions);
    conditional.push(...report.sections.upgradeAndDeployment.conditionalActions);
    needsReview.push(...report.sections.upgradeAndDeployment.needsReviewActions);
  }
  return {
    schemaVersion: 1,
    sourceVersion: parser.normalizeBaseVersion(sourceVersion),
    targetVersion: targetVersion,
    versions: included.map((report) => report.version),
    mandatoryActions: sortActions(mandatory),
    conditionalActions: sortActions(conditional),
    needsReviewActions: sortActions(needsReview),
    reports: included,
  };
}

function renderRangeMarkdown(range) {
  const mandatory = renderTable(
    ['Version', 'Tool / Action', 'Timing', 'Owner', 'Instructions & Notes', 'Card / PR'],
    range.mandatoryActions.map((item) => [
      item.version,
      item.action,
      item.timing,
      item.owner,
      item.instructionsAndNotes,
      renderRefCell(item.cardOrPr),
    ]),
  );
  const conditionalRows = range.conditionalActions.concat(range.needsReviewActions);
  const conditional = renderTable(
    ['Version', 'Applicability Condition (When to Run)', 'Tool / Action', 'Timing', 'Owner', 'Instructions & Notes', 'Card / PR'],
    sortActions(conditionalRows).map((item) => [
      item.version,
      item.needsReview ? `⚠ Needs Review - ${item.condition}` : item.condition,
      item.action,
      item.timing,
      item.owner,
      item.instructionsAndNotes,
      renderRefCell(item.cardOrPr),
    ]),
  );

  return [
    `# NGO Core Upgrade Actions: ${range.sourceVersion} -> ${range.targetVersion}`,
    '',
    `- **Included releases:** ${range.versions.join(', ') || 'None found'}`,
    '- **Execution order:** version ascending, then Before Deploy, During Upgrade, After Deploy.',
    '',
    '## Mandatory Actions',
    '',
    mandatory,
    '',
    '## Conditional Actions',
    '',
    '> Needs Review items remain visible and must be confirmed by an owner.',
    '',
    conditional,
    '',
  ].join('\n');
}

function searchableText(value) {
  return JSON.stringify(value).toLowerCase();
}

function searchReports(reports, options) {
  options = options || {};
  const narrowed = options.sourceVersion || options.targetVersion
    ? rangeVersions(reports, options.sourceVersion, options.targetVersion)
    : reports.slice().sort((left, right) => parser.compareVersions(left.version, right.version));
  const terms = String(options.query || '').toLowerCase().split(/\s+/).filter(Boolean);
  const matches = [];

  for (const report of narrowed) {
    if (options.module && !searchableText(report).includes(String(options.module).toLowerCase())) continue;
    const groups = [
      ...report.sections.upgradeAndDeployment.mandatoryActions,
      ...report.sections.upgradeAndDeployment.conditionalActions,
      ...report.sections.upgradeAndDeployment.needsReviewActions,
      ...report.sections.releaseTracking.newFeatures,
      ...report.sections.releaseTracking.bugFixes,
    ];
    for (const item of groups) {
      const haystack = searchableText(item);
      if (terms.every((term) => haystack.includes(term))) {
        matches.push({ version: report.version, status: report.status, category: item.category, item });
      }
    }
  }
  return matches;
}

module.exports = {
  aggregateRange,
  buildReport,
  diffSummary,
  markdownCell,
  rangeVersions,
  refsFor,
  renderMarkdown,
  renderRangeMarkdown,
  searchReports,
  sortActions,
};

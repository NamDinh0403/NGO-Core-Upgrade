'use strict';

const fs = require('fs');
const path = require('path');

const IGNORED_DIRECTORIES = new Set([
  '.angular',
  '.git',
  '.vs',
  'bin',
  'coverage',
  'dist',
  'node_modules',
  'obj',
  'out-tsc',
  'packages',
]);
const CODE_EXTENSIONS = new Set([
  '.cs',
  '.cshtml',
  '.csproj',
  '.css',
  '.html',
  '.js',
  '.json',
  '.props',
  '.resx',
  '.scss',
  '.sql',
  '.ts',
  '.tsx',
  '.txt',
  '.xml',
  '.yaml',
  '.yml',
]);
const STOP_WORDS = new Set([
  'after',
  'always',
  'application',
  'client',
  'clients',
  'condition',
  'custom',
  'customization',
  'customizations',
  'deployment',
  'does',
  'enabled',
  'feature',
  'files',
  'following',
  'having',
  'project',
  'projects',
  'related',
  'should',
  'specific',
  'system',
  'table',
  'using',
  'value',
  'whether',
  'with',
]);
const EXTERNAL_DECISION_PATTERN = /\b(?:azure|database|db|PM|AM|customer|subscription|costs?|data flag|system config|sharepoint|feature enabled|module enabled)\b/i;

function walkFiles(rootDir, files) {
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) walkFiles(fullPath, files);
    else if (CODE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(fullPath);
  }
}

function extractSignals(condition) {
  const text = String(condition || '');
  const quoted = Array.from(text.matchAll(/["']([^"']{3,120})["']/g)).map((match) => match[1]);
  const tokens = Array.from(text.matchAll(/\b[A-Za-z][A-Za-z0-9_.:]{3,100}\b/g))
    .map((match) => match[0])
    .filter((token) => !STOP_WORDS.has(token.toLowerCase()));
  const specific = tokens.filter((token) =>
    token.includes('.')
    || token.includes(':')
    || /^[A-Z][A-Za-z]+[A-Z][A-Za-z0-9]+$/.test(token)
    || /\d/.test(token));
  return Array.from(new Set(quoted.concat(specific))).slice(0, 12);
}

function inspectSignalInClient(clientPath, condition) {
  const signals = extractSignals(condition);
  if (signals.length === 0) {
    return {
      disposition: 'needs_review',
      reason: EXTERNAL_DECISION_PATTERN.test(condition)
        ? 'Condition depends on an external environment or data value; inspect the target environment/database.'
        : 'No deterministic code/config identifier could be extracted from the condition.',
      signals: [],
      matchedFiles: [],
    };
  }

  const files = [];
  walkFiles(clientPath, files);
  const lowerSignals = signals.map((signal) => signal.toLowerCase());
  const matchedFiles = [];
  const matchedSignals = new Set();

  for (const filePath of files) {
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
      if (content.length > 2 * 1024 * 1024) continue;
    } catch (_) {
      continue;
    }
    const lower = content.toLowerCase();
    const matched = lowerSignals.filter((signal) => lower.includes(signal));
    if (matched.length > 0) {
      matchedFiles.push(path.relative(clientPath, filePath).replace(/\\/g, '/'));
      for (const signal of matched) matchedSignals.add(signal);
      if (matchedFiles.length >= 30) break;
    }
  }

  if (matchedSignals.size > 0) {
    return {
      disposition: 'applies',
      reason: `Found ${matchedSignals.size} condition signal(s) in client code/config.`,
      signals,
      matchedSignals: Array.from(matchedSignals),
      matchedFiles,
    };
  }
  if (EXTERNAL_DECISION_PATTERN.test(condition)) {
    return {
      disposition: 'needs_review',
      reason: 'No code/config match was found, but the condition also depends on environment/database state.',
      signals,
      matchedSignals: [],
      matchedFiles: [],
    };
  }
  return {
    disposition: 'can_skip',
    reason: 'No extracted condition signal was found in the client code/config. Verify module ownership if the feature is configured outside the repository.',
    signals,
    matchedSignals: [],
    matchedFiles: [],
  };
}

function filterForClient(report, clientPath) {
  if (!clientPath || !fs.existsSync(clientPath) || !fs.statSync(clientPath).isDirectory()) {
    throw new Error(`Client path is not a directory: ${clientPath}`);
  }
  const upgrade = report.sections.upgradeAndDeployment;
  const evaluated = upgrade.conditionalActions.concat(upgrade.needsReviewActions).map((action) => {
    const result = action.needsReview
      ? {
          disposition: 'needs_review',
          reason: 'Release note is already marked Needs Review; client applicability is not safely known.',
          signals: [],
          matchedFiles: [],
        }
      : inspectSignalInClient(clientPath, action.condition || action.instructionsAndNotes);
    return Object.assign({ action }, result);
  });
  return {
    version: report.version,
    clientPath,
    applies: evaluated.filter((item) => item.disposition === 'applies'),
    canSkip: evaluated.filter((item) => item.disposition === 'can_skip'),
    needsReview: evaluated.filter((item) => item.disposition === 'needs_review'),
  };
}

module.exports = {
  extractSignals,
  filterForClient,
  inspectSignalInClient,
};

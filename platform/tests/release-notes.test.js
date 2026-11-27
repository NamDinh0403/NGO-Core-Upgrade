'use strict';

const assert = require('assert');
const cp = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const classifier = require('../release-notes/classifier');
const parser = require('../release-notes/parser');
const report = require('../release-notes/report');
const clientFilter = require('../release-notes/client-filter');
const schemaLib = require('../../engine/tools/lib/schema');
const reportSchema = require('../schemas/release-note-report.schema.json');
const syncTool = require('../tools/sync-release-notes');

function testClassification() {
  const conditionalCases = [
    'If the client uses a customized payment flow, adapt the existing method.',
    'Only if the client enabled Logframe2, run the saved query migration tool.',
    'Check whether the client project contains CoreAnalyseLogframeObjectiveView customizations.',
    'Client developers: If system config "LogframeSetting" has AlwaysUpdate = 1: update objectiveLevelsWithInputOnly manually.',
  ];
  for (const text of conditionalCases) {
    const result = classifier.classifyItem(text);
    assert.strictEqual(result.applicability, 'conditional', text);
    assert(result.condition, `expected extracted condition for: ${text}`);
  }

  const mandatoryCases = [
    '[After Deployment] Run NGO.Core.Tools.CompareSiteCount.',
    '[Before Deployment] Check in client code scripts and remove obsolete keys.',
    'Add the setting Core:CspAdditionalFrameSrc to all appsettings.json files and Azure App Settings.',
  ];
  for (const text of mandatoryCases) {
    assert.strictEqual(classifier.classifyItem(text).applicability, 'mandatory', text);
  }
  assert.strictEqual(
    classifier.classifyCategory('Add Core:CspAdditionalFrameSrc to all appsettings.json files.'),
    'upgrade_action',
  );
  assert.strictEqual(
    classifier.classifyCategory('Add new Users & Roles interface https://trello.com/c/AbC123'),
    'feature',
  );
  assert.strictEqual(
    classifier.classifyCategory('[S] Update the inactive-user configuration https://trello.com/c/AbC124'),
    'feature',
  );

  const ambiguous = classifier.classifyItem('Consider the product decision for this release note.', {
    category: 'upgrade_action',
  });
  assert.strictEqual(ambiguous.applicability, 'needs_review');
}

function makeReport(version, mandatory, conditional) {
  return report.buildReport({
    version,
    status: /draft$/.test(version) ? parser.DRAFT_STATUS : parser.RELEASED_STATUS,
    cards: [
      mandatory,
      conditional,
    ],
  });
}

function testRangeAggregation() {
  const releases = [
    makeReport(
      '9.3.0',
      '[Before Deployment] Run migration A.',
      'If the client uses CustomizedMethod, update it.',
    ),
    makeReport(
      '9.4.0',
      '[After Deployment] Run tool B.',
      'Only if FeatureFlag = 1, run data fix C.',
    ),
    makeReport(
      '10.0.0-draft',
      '[During Upgrade] Add global config D.',
      'Check whether the client has custom templates.',
    ),
  ];

  const range = report.aggregateRange(releases, '9.2', '10.0');
  assert.deepStrictEqual(range.versions, ['9.3.0', '9.4.0', '10.0.0-draft']);
  assert.strictEqual(range.mandatoryActions.length, 3);
  assert.strictEqual(range.conditionalActions.length, 3);
  assert.deepStrictEqual(
    range.mandatoryActions.map((item) => item.version),
    ['9.3.0', '9.4.0', '10.0.0-draft'],
  );
  const markdown = report.renderRangeMarkdown(range);
  assert(markdown.indexOf('**9.3.0') >= 0 || markdown.indexOf('9.3.0') >= 0);
  assert(markdown.includes('## Mandatory Actions'));
  assert(markdown.includes('## Conditional Actions'));
}

function testDraftSections() {
  const text = [
    'Waiting list',
    'If client customizes BaseConfigurationRepository, update its entityViewDefinitions.',
    '',
    'Next major version (Add here)',
    'Add Recaptcha to appsettings.json in every client.',
    '',
    'Next version (Add here)',
    '[After Deployment] Run NGO.Core.Tools.EnsureApprovalFileLinkPreviewMode.',
    '',
    '10.0.0 (Beta)',
    'Add new Users & Roles administration interface.',
  ].join('\n');
  const sections = parser.parseText(text);
  const draft = sections.get('10.0.0-draft');
  assert(draft, 'expected a 10.0.0-draft section');
  assert.strictEqual(draft.status, parser.DRAFT_STATUS);
  assert(draft.cards.some((card) => card.includes('Recaptcha')));
  assert(draft.cards.some((card) => card.includes('EnsureApprovalFileLinkPreviewMode')));
  assert(draft.cards.some((card) => card.includes('BaseConfigurationRepository')));
  assert.strictEqual(parser.resolveVersionQuery('v10', sections.keys()), '10.0.0-draft');
  assert.strictEqual(
    parser.resolveVersionQuery('9.4', ['9.4.0', '9.4.1', '9.5.0']),
    '9.4.1',
  );

  const html = [
    '<h1>Next version</h1>',
    '<p>Add the Recaptcha setting:</p>',
    '<p>"SiteKey": "client-specific-value"</p>',
    '<p>"SecretKey": "from-secret-provider"</p>',
    '<br><br>',
    '<p>[After Deployment] Run NGO.Core.Tools.Test.</p>',
  ].join('\n');
  const htmlSections = parser.parseText(html);
  const cards = htmlSections.values().next().value.cards;
  assert.strictEqual(cards.length, 2, 'HTML whitespace must not split one instruction from its config values');
  assert(cards[0].includes('"SiteKey"') && cards[0].includes('"SecretKey"'));
}

function testFourTableRenderer() {
  const release = makeReport(
    '10.0.0-draft',
    '[After Deployment] Run NGO.Core.Tools.Test.',
    'If client customizes UserMapper, adapt it.',
  );
  const markdown = report.renderMarkdown(release);
  assert(markdown.includes('**Status:** DRAFT / IN PROGRESS'));
  for (const heading of ['### Table 1:', '### Table 2:', '### Table 3:', '### Table 4:']) {
    assert(markdown.includes(heading), `missing ${heading}`);
  }
  assert(markdown.includes('| Applicability Condition (When to Run) |'));
}

function testClientFilterAndSchema() {
  const release = makeReport(
    '10.0.0-draft',
    '[After Deployment] Run NGO.Core.Tools.Test.',
    'If GetLogframe2IndicatorTrackers is customized in the client project, adapt it.',
  );
  const errors = schemaLib.validate(release, reportSchema, 'release-note-report');
  assert.deepStrictEqual(errors, [], errors.join('\n'));
  assert.deepStrictEqual(
    classifier.extractUrls('https://www.onenote.com/api/v1.0/site/image?publicAuth=true https://trello.com/c/AbC123'),
    ['https://trello.com/c/AbC123'],
  );
  const redacted = report.buildReport({
    version: '10.0.0-draft',
    status: parser.DRAFT_STATUS,
    cards: [{ text: '[After Deployment] Set ClientSecret = super-secret-value-12345', category: 'upgrade_action' }],
  });
  assert(JSON.stringify(redacted).includes('<FROM_SECRET_PROVIDER>'));
  assert(!JSON.stringify(redacted).includes('super-secret-value-12345'));

  const clientPath = fs.mkdtempSync(path.join(os.tmpdir(), 'release-notes-client-'));
  try {
    fs.mkdirSync(path.join(clientPath, 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(clientPath, 'src', 'CustomMapper.cs'),
      'public class CustomMapper : GetLogframe2IndicatorTrackers { }',
      'utf8',
    );
    const filtered = clientFilter.filterForClient(release, clientPath);
    assert.strictEqual(filtered.applies.length, 1);
    assert.strictEqual(filtered.needsReview.length, 0);
    assert(filtered.applies[0].matchedFiles.includes('src/CustomMapper.cs'));
  } finally {
    fs.rmSync(clientPath, { recursive: true, force: true });
  }
}

function testActiveBranchDiffCollection() {
  const corePath = fs.mkdtempSync(path.join(os.tmpdir(), 'release-notes-core-'));
  try {
    cp.execFileSync('git', ['init', '-q'], { cwd: corePath });
    cp.execFileSync('git', ['config', 'user.email', 'release-notes@test.local'], { cwd: corePath });
    cp.execFileSync('git', ['config', 'user.name', 'Release Notes Test'], { cwd: corePath });
    fs.writeFileSync(path.join(corePath, 'feature.txt'), 'base\n', 'utf8');
    cp.execFileSync('git', ['add', '.'], { cwd: corePath });
    cp.execFileSync('git', ['commit', '-q', '-m', 'base'], { cwd: corePath });
    cp.execFileSync('git', ['tag', 'v9.2.0'], { cwd: corePath });
    fs.writeFileSync(path.join(corePath, 'feature.txt'), 'draft change\n', 'utf8');
    cp.execFileSync('git', ['add', '.'], { cwd: corePath });
    cp.execFileSync('git', ['commit', '-q', '-m', 'draft change'], { cwd: corePath });

    const candidate = syncTool.collectGitDiff({
      'core-path': corePath,
      'target-version': '10.0',
      'base-ref': 'v9.2.0',
      'core-ref': 'HEAD',
    });
    assert.strictEqual(candidate.version, '10.0.0-draft');
    assert(candidate.changes.some((change) => change.path === 'feature.txt' && change.status === 'M'));
  } finally {
    fs.rmSync(corePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
  }
}

function runReleaseNotesTests() {
  testClassification();
  testRangeAggregation();
  testDraftSections();
  testFourTableRenderer();
  testClientFilterAndSchema();
  testActiveBranchDiffCollection();
  console.log('  PASS  release-notes-classification-range-drafts-format-schema-client-filter-git-diff');
}

if (require.main === module) {
  try {
    runReleaseNotesTests();
  } catch (error) {
    console.error(error.stack || error.message);
    process.exit(1);
  }
}

module.exports = { runReleaseNotesTests };

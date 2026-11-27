'use strict';
/*
 * Deterministic release-knowledge integration tests (30 cases).
 * Dependency-free, Node 14+. Run: node tests/run.js  (or node tests/release-knowledge.test.js)
 */
const fs = require('fs');
const path = require('path');
const core = require('../tools/lib/core');
const store = require('../tools/lib/release-knowledge');
const range = require('../tools/lib/release-range');
const applic = require('../tools/lib/applicability');
const rmap = require('../tools/lib/requirement-map');
const cov = require('../tools/lib/requirement-coverage');
const appset = require('../tools/lib/appsettings-inventory');
const candidate = require('../tools/lib/knowledge-candidate');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) { pass++; process.stdout.write(`PASS  ${name}\n`); }
  else { fail++; fails.push(name + (detail ? ' :: ' + detail : '')); process.stdout.write(`FAIL  ${name}${detail ? ' :: ' + detail : ''}\n`); }
}
const has = (arr, id) => arr.some((r) => (r.id || r) === id);

// 1
const r8392 = range.resolve('8.3.0', '9.2.0');
ok('1-range-8.3.0-to-9.2.0', JSON.stringify(r8392.versions) === JSON.stringify(['8.4.0', '8.6.0', '9.0.0', '9.1.0', '9.2.0']), JSON.stringify(r8392.versions));

// 2
const r7080 = range.resolve('7.0.0', '8.0.0');
ok('2-range-7.0.0-to-8.0.0', r7080.versions.indexOf('7.1.0') !== -1 && r7080.versions.indexOf('8.0.0') !== -1 && r7080.versions.indexOf('7.0.0') === -1, JSON.stringify(r7080.versions));

// 3
ok('3-angular-migration-triggered-10-to-15', r7080.reusableMigrations.indexOf('angular-10-to-15') !== -1 && r7080.migrationRequirements.length > 0);

// 4
ok('4-migration-not-triggered-15-to-15', r8392.reusableMigrations.length === 0, JSON.stringify(r8392.reusableMigrations));

// 5
ok('5-duplicate-detected', has(r8392.droppedRequirements, 'REQ-9.1.0-BACKEND-01') && !has(r8392.requirements, 'REQ-9.1.0-BACKEND-01') && has(r8392.requirements, 'REQ-8.6.0-BACKEND-01'));

// 6
const backport = store.requirementById('REQ-9.1.0-BACKEND-01');
ok('6-backport-represented', backport && backport.duplicateOf === 'REQ-8.6.0-BACKEND-01' && /backport|repeat/i.test(backport.notes || ''));

// 7
const rSup = range.resolve('7.5.0', '8.2.0');
ok('7-superseded-handled', has(rSup.droppedRequirements, 'REQ-7.6.0-DEPLOYMENT-01') && has(rSup.requirements, 'REQ-8.2.0-DEPLOYMENT-01') && !has(rSup.requirements, 'REQ-7.6.0-DEPLOYMENT-01'));

// Shared client models -------------------------------------------------------
const ngModuleModel = {
  bootstrapStyle: 'NGMODULE',
  configLayers: [{ type: 'environmentFile', file: 'src/environments/environment.ts', precedence: 2 }],
  routerComposition: [{ type: 'routingModule', file: 'src/app/app-routing.module.ts' }],
  moduleRegistration: [{ type: 'ngModule', file: 'src/app/app.module.ts' }],
  tsconfigChain: ['tsconfig.json', 'tsconfig.app.json'],
  roleFiles: { iconRegistration: ['src/app/app.module.ts'] },
  packageJson: 'package.json',
  files: ['src/index.html', 'src/polyfills.ts', 'angular.json', 'src/styles.scss', 'src/app/app.module.ts'],
};
const runtimeCfgModel = JSON.parse(JSON.stringify(ngModuleModel));
runtimeCfgModel.configLayers = [
  { type: 'runtimeService', file: 'src/app/app-environment.service.ts', precedence: 0 },
  { type: 'environmentFile', file: 'src/environments/environment.ts', precedence: 2 },
];
runtimeCfgModel.routerComposition = [
  { type: 'routeService', file: 'src/app/app-route.service.ts' },
  { type: 'routingModule', file: 'src/app/app-routing.module.ts' },
];
const standaloneModel = JSON.parse(JSON.stringify(ngModuleModel));
standaloneModel.bootstrapStyle = 'STANDALONE';
standaloneModel.moduleRegistration = [{ type: 'standaloneProviders', file: 'src/main.ts' }];

const routeReq = store.requirementById('REQ-7.7.0-FRONTEND-01');
const cfgReq = store.requirementById('REQ-9.0.0-FRONTEND-06'); // aiwriter env key
const iconReq = store.requirementById('REQ-8.0.0-FRONTEND-03'); // faLock icon
const providerReq = store.requirementById('REQ-8.0.0-FRONTEND-02'); // module + env

// 8
const m8 = rmap.map(routeReq, ngModuleModel);
ok('8-frontend-requirement-mapped', m8.mapped && m8.targets.indexOf('src/app/app-routing.module.ts') !== -1, JSON.stringify(m8.targets));

// 9
const m9 = rmap.map(cfgReq, runtimeCfgModel);
ok('9-runtime-config-over-environment', m9.mapped && m9.targets.indexOf('src/app/app-environment.service.ts') !== -1 && m9.targets.indexOf('src/environments/environment.ts') === -1, JSON.stringify(m9.targets));

// 10
const m10 = rmap.map(routeReq, runtimeCfgModel);
ok('10-dynamic-routing-preferred', m10.mapped && m10.targets.indexOf('src/app/app-route.service.ts') !== -1, JSON.stringify(m10.targets));

// 11 - module satisfied transitively (registration resolves to the shared ngModule)
const m11 = rmap.map(providerReq, ngModuleModel);
ok('11-module-satisfied-via-registration', m11.mapped && m11.targets.indexOf('src/app/app.module.ts') !== -1, JSON.stringify(m11.targets));

// 12 - standalone provider mapping
const m12 = rmap.map(providerReq, standaloneModel);
ok('12-standalone-provider-mapping', m12.mapped && m12.targets.indexOf('src/main.ts') !== -1, JSON.stringify(m12.targets));

// AppSettings fixtures -------------------------------------------------------
const apiSettings = { path: 'api/appsettings.json', json: { Core: { MaxEmailAttachmentFileSizeMb: 20, IATISubscriptionKey: 'REALKEY-SHOULD-NOT-BE-HERE' } } };
const webjobSettings = { path: 'webjob/appsettings.json', json: { Core: { ADSyncGroupsSchedule: '0 */4 * * *' }, Queue: { ADSyncGroupsQueue: 'adsyncgroupqueue' } } };
const inv = appset.analyze([apiSettings, webjobSettings]);

// 13
ok('13-appsettings-discovery', inv.files.length === 2 && inv.files[0].keys.indexOf('Core:MaxEmailAttachmentFileSizeMb') !== -1, JSON.stringify(inv.files.map((f) => f.process)));

const appReqs = store.appSettings();
const byId = (id) => appReqs.find((s) => s.id === id);
const mapWJ = appset.mapRequirements(inv, [byId('APPSET-ADSYNC-GROUPS-SCHEDULE')]);
const mapAPI = appset.mapRequirements(inv, [byId('APPSET-MAXEMAILATTACH')]);

// 14 - webjob-only setting satisfied in webjob file, not expected in API
ok('14-webjob-only-setting', mapWJ.coverage[0].present && mapWJ.coverage[0].owningProcess === 'WEBJOB' && mapWJ.coverage[0].presentIn.indexOf('webjob/appsettings.json') !== -1);

// 15 - API/ALL setting present in api file
ok('15-api-setting', mapAPI.coverage[0].present && mapAPI.coverage[0].presentIn.indexOf('api/appsettings.json') !== -1);

// 16 - file setting and azure setting represented separately
ok('16-file-and-azure-separate', mapAPI.coverage[0].key === 'MaxEmailAttachmentFileSizeMb' && mapAPI.azureChecklist[0] && mapAPI.azureChecklist[0].azureKey === 'Core:MaxEmailAttachmentFileSizeMb');

// 17 - existing client value preserved
ok('17-existing-value-preserved', mapAPI.coverage[0].present && mapAPI.coverage[0].preservedValue !== null);

// 18 - missing required key detected
const mapMissing = appset.mapRequirements(inv, [byId('APPSET-CSP-FRAMESRC')]);
ok('18-missing-key-detected', mapMissing.missing.some((m) => m.key === 'Core:CspAdditionalFrameSrc'));

// 19 - secret value rejected
const mapSecret = appset.mapRequirements(inv, [byId('APPSET-IATI-SUBSCRIPTIONKEY')]);
ok('19-secret-value-rejected', mapSecret.secretRejections.length > 0 && mapSecret.secretRejections[0].id === 'APPSET-IATI-SUBSCRIPTIONKEY');
const configuration = require('../../engine/tools/lib/executors').capability('backend', 'configuration');
ok('37-configuration-owner-is-backend-adapter', configuration === appset);
const planSource = fs.readFileSync(core.P('tools/lib/planning-release.js'), 'utf8');
ok('38-frontend-planning-does-not-inventory-backend', !planSource.includes('appset.discover') && !planSource.includes('store.appSettings'));

// 20 - PM decision blocks optional feature mutation
const pmReq = store.requirementById('REQ-9.0.0-FRONTEND-06'); // IF_PM_APPROVES
const pmAppl = applic.evaluate(pmReq, {});
const pmStatus = cov.deriveStatus(pmReq, { applicability: { [pmReq.id]: pmAppl } });
ok('20-pm-decision-blocks-mutation', pmAppl.status === 'DECISION_PENDING' && pmStatus === 'DECISION_PENDING');

// 21 & 22 - deployment ownership (before/after)
const depReqs = [store.requirementById('REQ-9.0.0-DEPLOYMENT-01'), store.requirementById('REQ-9.2.0-DEPLOYMENT-01')];
const depAppl = {}; depReqs.forEach((q) => { depAppl[q.id] = { status: 'APPLICABLE', evidence: 'x' }; });
const depCov = cov.buildCoverage('t', '8.3.0', '9.2.0', depReqs, { applicability: depAppl, owners: {} });
const depList = cov.deploymentChecklist(depReqs, depCov);
ok('21-before-deployment-assigned', depList.some((d) => d.timing === 'BEFORE_UPGRADE' || d.timing === 'BEFORE_DEPLOYMENT') && depList.every((d) => !!d.owner));
ok('22-after-deployment-assigned', depList.some((d) => d.timing === 'AFTER_DEPLOYMENT') && depList.every((d) => !!d.owner));

// 23 - SQL/DB action remains manual
const sqlReq = store.requirementById('REQ-9.2.0-DATABASE-01');
const sqlStatus = cov.deriveStatus(sqlReq, { applicability: { [sqlReq.id]: { status: 'APPLICABLE' } }, planned: new Set([sqlReq.id]) });
ok('23-sql-remains-manual', sqlReq.automation === 'MANUAL_EXECUTION' && sqlStatus === 'MANUAL_ACTION_PENDING');

// 24 - tool review mode before update mode
const toolReq = store.requirementById('REQ-8.6.0-BACKEND-02');
ok('24-tool-review-before-update', /review/i.test(toolReq.action) && /review/i.test(toolReq.validation) && /review-before-update|review.*then.*update/i.test(toolReq.notes || toolReq.action));

// 25 - plan missing an applicable requirement is rejected
const autoReq = store.requirementById('REQ-8.4.0-FRONTEND-01'); // AUTO_AFTER_MAPPING
const cov25 = cov.buildCoverage('t', '8.3.0', '9.2.0', [autoReq], {
  applicability: { [autoReq.id]: { status: 'APPLICABLE' } },
  mapping: { [autoReq.id]: { mapped: true, targets: ['src/index.html'] } },
  planned: new Set(), // NOT planned
});
ok('25-plan-missing-requirement-rejected', cov.planReady(cov25).ready === false && cov.planReady(cov25).blocking.indexOf(autoReq.id) !== -1);

// 26 - implemented but unverified blocks completion
const cov26 = cov.buildCoverage('t', '8.3.0', '9.2.0', [autoReq], {
  applicability: { [autoReq.id]: { status: 'APPLICABLE' } },
  mapping: { [autoReq.id]: { mapped: true, targets: ['src/index.html'] } },
  planned: new Set([autoReq.id]),
  changed: { [autoReq.id]: ['src/index.html'] }, // implemented, not verified
});
ok('26-implemented-unverified-blocks-completion', cov.completionReady(cov26).complete === false);

// 27 - manual item without owner blocks completion
const manualReq = store.requirementById('REQ-9.2.0-DEPLOYMENT-01');
const cov27 = cov.buildCoverage('t', '8.3.0', '9.2.0', [manualReq], {
  applicability: { [manualReq.id]: { status: 'APPLICABLE' } }, owners: {},
});
// force-remove owner to simulate missing owner
cov27.requirements[0].owner = null; if (cov27.requirements[0].manualHandover) cov27.requirements[0].manualHandover.owner = null;
ok('27-manual-without-owner-blocks-completion', cov.completionReady(cov27).complete === false);

// 28 - requirement coverage succeeds
const cov28 = cov.buildCoverage('t', '8.3.0', '9.2.0', [autoReq, manualReq], {
  applicability: { [autoReq.id]: { status: 'APPLICABLE' }, [manualReq.id]: { status: 'APPLICABLE' } },
  mapping: { [autoReq.id]: { mapped: true, targets: ['src/index.html'] } },
  planned: new Set([autoReq.id]),
  verified: new Set([autoReq.id]),
  owners: { [manualReq.id]: 'deployment-owner' },
});
ok('28-requirement-coverage-succeeds', cov.completionReady(cov28).complete === true, JSON.stringify(cov.completionReady(cov28).blockingReasons));

// 29 - candidate knowledge generated after a discrepancy
const cand = candidate.generate({ requirementId: 'REQ-9.0.0-FRONTEND-07', summary: 'release note omitted a required file', observed: 'client also needs main.ts nonce', expected: 'index.html only' });
ok('29-candidate-generated', cand.status === 'CANDIDATE' && cand.approved === false && cand.requirementId === 'REQ-9.0.0-FRONTEND-07');

// 30 - raw release-notes.md not read at runtime
const libDir = core.P('tools', 'lib');
let readsRaw = false;
for (const f of fs.readdirSync(libDir)) {
  if (!f.endsWith('.js')) continue;
  const txt = fs.readFileSync(path.join(libDir, f), 'utf8');
  if (/release-notes\.md/i.test(txt)) readsRaw = true;
}
ok('30-no-runtime-raw-release-notes', readsRaw === false);

store.reset();
const frontendOnly = store.load('8.3.0', '9.2.0', 'frontend');
ok('35-frontend-view-excludes-backend-knowledge', frontendOnly.requirements.every((requirement) => requirement.scope === 'FRONTEND') && !('appsettings' in frontendOnly));
const frontendRange = range.resolve('8.3.0', '9.2.0', { track: 'frontend' });
ok('36-frontend-view-keeps-all-frontend-requirements', JSON.stringify(frontendRange.requirements) === JSON.stringify(r8392.requirements.filter((requirement) => requirement.scope === 'FRONTEND')));
store.reset();
const readYaml = core.readYamlAbs;
let reads = 0;
core.readYamlAbs = (file) => { if (file.startsWith(store.RELEASES_DIR)) reads++; return readYaml(file); };
try {
  const all = store.allRequirements();
  const fullReads = reads;
  store.reset(); reads = 0;
  const scoped = store.allRequirements('9.1.0', '9.2.0');
  const scopedReads = reads;
  const expected = all.filter((requirement) => range.inRange(requirement.releaseVersion, '9.1.0', '9.2.0'));
  ok('31-scoped-equivalent-to-full-filter', JSON.stringify(scoped) === JSON.stringify(expected));
  ok('32-scoped-loader-reduces-release-reads', scopedReads < fullReads, `${fullReads} -> ${scopedReads}`);
  store.allRequirements('9.1.0', '9.2.0');
  ok('33-same-range-cache-avoids-repeated-reads', reads === scopedReads);
  ok('34-framework-patch-fallback-preserved', store.angularMajorAt('7.6.3') === store.angularMajorAt('7.6.0'));
  process.stdout.write(`Release YAML reads (9.1.0 -> 9.2.0): full=${fullReads}, scoped=${scopedReads}\n`);
} finally { core.readYamlAbs = readYaml; store.reset(); }

const layout = require('../tools/lib/browse-filter-layout');
const legacyLayout = '<div class="col-md-10"><ngo-list-filter></ngo-list-filter><div class="browse-filter pull-right"><ngo-search-box></ngo-search-box></div></div>';
const migratedLayout = '<div class="col-md-10"><div class="browse-filter-layout"><ngo-list-filter [flattenIntoParentFlow]="true"></ngo-list-filter><div class="browse-filter"><ngo-search-box></ngo-search-box></div></div></div>';
ok('39-legacy-shared-column-requires-all-layout-adaptations', layout.inspectTemplate(legacyLayout).issues.length === 3);
ok('40-migrated-layout-is-compatible', layout.inspectTemplate(migratedLayout).applicable && layout.inspectTemplate(migratedLayout).issues.length === 0);
ok('41-filter-in-separate-column-is-not-affected', !layout.inspectTemplate('<div class="row"><div class="col-md-6"><ngo-list-filter></ngo-list-filter></div><div class="col-md-6"><ngo-search-box></ngo-search-box></div></div>').applicable);
ok('42-wrapper-must-include-sibling-search', layout.inspectTemplate('<div class="col"><div class="browse-filter-layout"><ngo-list-filter [flattenIntoParentFlow]="true"></ngo-list-filter></div><ngo-search-box></ngo-search-box></div>').issues.length === 1);
ok('43-dynamic-template-values-do-not-break-tag-discovery', layout.inspectTemplate(migratedLayout.replace('<ngo-search-box>', '<ngo-search-box *ngIf="count > 0">')).issues.length === 0);
const consumerRoot = fs.mkdtempSync(path.join(require('os').tmpdir(), 'frontend-consumers-'));
try {
  const legacyFile = 'custom-list.component.html', inlineFile = 'inline-list.component.ts';
  fs.writeFileSync(path.join(consumerRoot, legacyFile), legacyLayout);
  fs.writeFileSync(path.join(consumerRoot, inlineFile), '@Component({template: `' + legacyLayout + '`})');
  fs.writeFileSync(path.join(consumerRoot, 'ignored.component.html'), '<!--' + legacyLayout + '-->');
  const inventory = { fileInventory: { roles: {}, files: [legacyFile, inlineFile, 'ignored.component.html'] } };
  const client = require('../tools/lib/client-model').fromInventory(inventory, consumerRoot);
  const filterReq = store.requirementById('REQ-9.3.0-FRONTEND-01');
  const mapping = rmap.map(filterReq, client.model);
  ok('44-discover-and-map-all-external-and-inline-consumers', applic.evaluate(filterReq, client.evidence).status === 'APPLICABLE'
    && mapping.targets.length === 2 && mapping.targets.includes(inlineFile));
  const adapter = require('../tools/executor');
  const packet = { client: { path: consumerRoot }, requirements: [], upgrade: { target: { sourceVersion: '9.4.1', targetVersion: '9.5.0' }, sharedRequirements: [], integration: {} } };
  ok('45-package-only-plan-rejected-even-for-inherited-debt', adapter.planIssues(packet, { changes: [{ file: 'package.json' }] }).length === 2);
  ok('46-every-affected-consumer-must-be-planned', adapter.planIssues(packet, { changes: [{ file: legacyFile }] }).length === 1
    && adapter.planIssues(packet, { changes: [{ file: legacyFile }, { file: inlineFile }] }).length === 0);
  const evidenceFile = path.join(consumerRoot, 'evidence.json');
  fs.writeFileSync(evidenceFile, '{}');
  const checks = adapter.plan(packet).verification.map((kind) => ({ kind, status: 'PASSED', ref: evidenceFile }));
  ok('47-passing-build-evidence-cannot-hide-unmigrated-consumers', adapter.validate(packet, checks).passed === false);
  fs.writeFileSync(path.join(consumerRoot, legacyFile), migratedLayout);
  fs.writeFileSync(path.join(consumerRoot, inlineFile), '@Component({template: `' + migratedLayout + '`})');
  ok('48-migrated-consumers-pass-without-redundant-edits', adapter.validate(packet, checks).passed
    && adapter.planIssues(packet, { changes: [] }).length === 0);
  fs.writeFileSync(path.join(consumerRoot, inlineFile), '@Component({template: "' + migratedLayout.replace(/"/g, '\\"') + '"})');
  ok('49-quoted-inline-templates-preserve-attribute-values', layout.inspect(consumerRoot).issues.length === 0);

  const migratedTpl = layout.migrateTemplate(legacyLayout);
  ok('50-migrate-template-rewrites-legacy-shared-column-and-strips-pull',
    migratedTpl.changed === true && layout.inspectTemplate(migratedTpl.content).issues.length === 0);

  fs.writeFileSync(path.join(consumerRoot, legacyFile), legacyLayout);
  fs.writeFileSync(path.join(consumerRoot, inlineFile), '@Component({template: `' + legacyLayout + '`})');
  const migratedDisk = layout.migrate(consumerRoot);
  ok('51-migrate-rewrites-disk-html-and-inline-ts-to-zero-issues',
    migratedDisk.migratedFiles.length >= 2 && layout.inspect(consumerRoot).issues.length === 0);
} finally { fs.rmSync(consumerRoot, { recursive: true, force: true }); }

process.stdout.write(`\n${pass}/${pass + fail} release-knowledge tests passed\n`);
if (fail) { for (const f of fails) process.stdout.write(`  - ${f}\n`); process.exit(1); }
process.exit(0);

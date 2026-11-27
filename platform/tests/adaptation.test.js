'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const adaptation = require('../adaptation');

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
  } catch (err) {
    console.error(`  FAIL  ${name}: ${err.message}`);
    throw err;
  }
}

console.log('Running adaptation.test.js...\n');

// 1. Test setNestedKey preserving values
test('setNestedKey handles deep paths and preserves values', () => {
  const obj = {
    Core: {
      ExistingKey: 'KeepMe',
    },
    TopLevel: 123,
  };

  const added1 = adaptation.setNestedKey(obj, 'Core:CspAdditionalFrameSrc', 'https://frame.com');
  assert.strictEqual(added1, true);
  assert.strictEqual(obj.Core.CspAdditionalFrameSrc, 'https://frame.com');
  assert.strictEqual(obj.Core.ExistingKey, 'KeepMe');

  const added2 = adaptation.setNestedKey(obj, 'Core:ExistingKey', 'OverwriteAttempt');
  assert.strictEqual(added2, false);
  assert.strictEqual(obj.Core.ExistingKey, 'KeepMe', 'Must preserve existing value');

  const added3 = adaptation.setNestedKey(obj, 'Core:Deep:Nested:Flag', true);
  assert.strictEqual(added3, true);
  assert.strictEqual(obj.Core.Deep.Nested.Flag, true);
});

// 2. Test release requirements derivation
test('deriveReleaseRequirements returns release range and canonical appsettings', () => {
  const result = adaptation.deriveReleaseRequirements({
    sourceVersion: '9.0.0',
    targetVersion: '9.4.1',
    tracks: ['backend', 'frontend'],
  });

  assert(Array.isArray(result.versions));
  assert(result.versions.length >= 1);
  assert.strictEqual(result.targetAngularMajor, 15);
  assert(Array.isArray(result.appSettings));
  assert(result.appSettings.length > 0);
  assert(result.appSettings.some((s) => s.key && s.key.includes('CspAdditionalFrameSrc')));
});

// 3. Test AppSettings adaptation in temporary directory
test('adaptBackendConfiguration merges missing keys while preserving client keys', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ngo-test-adapt-'));
  const apiDir = path.join(tmpDir, 'ngo-api');
  fs.mkdirSync(apiDir, { recursive: true });

  const appsettingsPath = path.join(apiDir, 'appsettings.json');
  fs.writeFileSync(appsettingsPath, JSON.stringify({
    ConnectionStrings: {
      DefaultConnection: 'Server=my-db;Database=client_db;'
    },
    Core: {
      ExistingSetting: 'ClientCustomValue'
    }
  }, null, 2));

  const sampleAppSettings = [
    {
      id: 'APPSET-CSP',
      key: 'Core:CspAdditionalFrameSrc',
      owningProcess: 'ALL',
      defaultValue: '',
      sensitive: false,
    },
    {
      id: 'APPSET-AI-KEY',
      key: 'Core:AzureOpenAISettings:ApiKey',
      owningProcess: 'API',
      sensitive: true,
    }
  ];

  const logs = [];
  const res = adaptation.adaptBackendConfiguration(tmpDir, sampleAppSettings, (l) => logs.push(l));

  assert(res.modifiedFiles.length >= 1);
  const updated = JSON.parse(fs.readFileSync(appsettingsPath, 'utf8'));
  assert.strictEqual(updated.ConnectionStrings.DefaultConnection, 'Server=my-db;Database=client_db;');
  assert.strictEqual(updated.Core.ExistingSetting, 'ClientCustomValue');
  assert.strictEqual(updated.Core.CspAdditionalFrameSrc, '');
  assert.strictEqual(updated.Core.AzureOpenAISettings.ApiKey, '<FROM_SECRET_PROVIDER>');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// 4. Test handover checklist generation
test('generateHandoverChecklist produces deployment checklist and markdown', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ngo-test-handover-'));
  const handover = adaptation.generateHandoverChecklist({
    runId: 'test-run-1',
    clientId: 'test-client',
    sourceVersion: '9.2.0',
    targetVersion: '9.4.1',
    backendConfigResult: {
      azureChecklist: [
        { azureKey: 'Core:CspAdditionalFrameSrc', timing: 'BEFORE_DEPLOYMENT', owner: 'dba' }
      ]
    },
    jobDir: tmpDir,
  });

  assert(handover.checklist !== undefined);
  assert(typeof handover.beforeMd === 'string');
  assert(typeof handover.afterMd === 'string');
  assert(fs.existsSync(path.join(tmpDir, 'deployment-checklist.yaml')));
  assert(fs.existsSync(path.join(tmpDir, 'before-deployment.md')));
  assert(fs.existsSync(path.join(tmpDir, 'after-deployment.md')));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// 5. Test FormFieldFactoryExt 7th parameter adaptation
test('adaptKnownSourceMigrations adapts FormFieldFactoryExt constructor and super call', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ngo-test-source-'));
  const formsDir = path.join(tmpDir, 'ngo-client', 'src', 'app', 'shared', 'forms');
  fs.mkdirSync(formsDir, { recursive: true });

  const factoryFile = path.join(formsDir, 'form-field-factory-ext.service.ts');
  const initialContent = `import { Injectable } from '@angular/core';
import {
    FormFieldFactory,
    GenericItem,
    NGODatePipe,
    NGOValidators,
    SelectOptionsTranslatePipe,
} from 'ngo-core';

export class FormFieldFactoryExt extends FormFieldFactory {
    constructor(protected dateParser: NgbDateParserFormatter, protected ngoValidators: NGOValidators,
        protected ngoDatePipe: NGODatePipe,
        protected translatePipe: SelectOptionsTranslatePipe,
        protected translateService: TranslateService,
        protected store: Store<AppState>,
        protected configurationService: ConfigurationService) {
        super(dateParser, ngoValidators, ngoDatePipe, translatePipe, translateService, store);
    }
}
`;
  fs.writeFileSync(factoryFile, initialContent, 'utf8');

  const logs = [];
  const res = adaptation.adaptKnownSourceMigrations(tmpDir, '9.4.1', '9.2.0', (l) => logs.push(l));
  assert.strictEqual(res.adaptedFilesCount, 1);

  const updatedContent = fs.readFileSync(factoryFile, 'utf8');
  assert(updatedContent.includes('NGOTruncateHtml'), 'Must import NGOTruncateHtml');
  assert(updatedContent.includes('protected ngoTruncate: NGOTruncateHtml'), 'Must add ngoTruncate to constructor');
  assert(updatedContent.includes('super(dateParser, ngoValidators, ngoDatePipe, translatePipe, translateService, store, ngoTruncate);'), 'Must pass 7 arguments to super');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('parseJsonc and adaptBackendConfiguration handle commented appsettings.json and skip MANUAL_DECISION keys', () => {
  const tmpJsonc = fs.mkdtempSync(path.join(os.tmpdir(), 'ngo-adapt-jsonc-'));
  try {
    const apiDir = path.join(tmpJsonc, 'ngo-api', 'NGO.API');
    fs.mkdirSync(apiDir, { recursive: true });
    const commentedAppsettings = [
      '{',
      '  // Client logging configuration',
      '  "Logging": {',
      '    "LogLevel": "Warning", // trailing comma below',
      '  },',
      '  "ConnectionStrings": { "Default": "Server=." }',
      '}',
    ].join('\n');
    fs.writeFileSync(path.join(apiDir, 'appsettings.json'), commentedAppsettings, 'utf8');

    const cfgLib = require('../../backend/tools/configuration');
    const parsedJsonc = cfgLib.parseJsonc(commentedAppsettings);
    assert.strictEqual(parsedJsonc.Logging.LogLevel, 'Warning');

    const sampleSettings = [
      { id: 'APPSET-AUTO-1', key: 'Core:NewAutoKey', defaultValue: 'enabled', dataType: 'string', owningProcess: 'API', automation: 'AUTO_AFTER_MAPPING' },
      { id: 'APPSET-MANUAL-1', key: 'Core:ManualDecisionKey', defaultValue: '', dataType: 'string', owningProcess: 'API', automation: 'MANUAL_DECISION', sensitive: true },
    ];
    const cfgRes = adaptation.adaptBackendConfiguration(tmpJsonc, sampleSettings, null, { sourceVersion: '8.1.0', targetVersion: '9.5.0' });
    assert(cfgRes.modifiedFiles.length >= 1, 'Expected appsettings.json to be updated cleanly despite JSON comments');
    const updatedJson = JSON.parse(fs.readFileSync(path.join(apiDir, 'appsettings.json'), 'utf8'));
    assert.strictEqual(updatedJson.Core.NewAutoKey, 'enabled');
    assert.strictEqual(updatedJson.Core.ManualDecisionKey, undefined, 'MANUAL_DECISION keys must not be auto-injected');
  } finally {
    fs.rmSync(tmpJsonc, { recursive: true, force: true });
  }
});

test('adaptFrontendEnvironment preserves nested appInsightsConfig and removes deprecated logframes2', () => {
  const tmpEnvDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ngo-adapt-env-'));
  try {
    const feEnv = path.join(tmpEnvDir, 'client', 'ngo-client', 'src', 'environments');
    const coreEnv = path.join(tmpEnvDir, 'core', 'ngo-client-core', 'src', 'environments');
    fs.mkdirSync(feEnv, { recursive: true });
    fs.mkdirSync(coreEnv, { recursive: true });

    fs.writeFileSync(
      path.join(feEnv, 'environment.ts'),
      `export const environment = {\n  production: false,\n  logframes2: true,\n  appInsightsConfig: {\n    instrumentationKey: 'client-key-123',\n    enableDebug: true,\n  },\n};\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(coreEnv, 'environment.ts'),
      `export const environment = {\n  production: true,\n  aiwriter: { enabled: false },\n  appInsightsConfig: {\n    instrumentationKey: '',\n  },\n  newFeatureUrl: 'https://core.example/api',\n};\n`,
      'utf8'
    );

    const envRes = adaptation.adaptFrontendEnvironment(path.join(tmpEnvDir, 'client'), path.join(tmpEnvDir, 'core'), null, { targetVersion: '9.4.1' });
    assert(envRes.modifiedFiles.some((f) => f.includes('environment.ts')));
    const adaptedText = fs.readFileSync(path.join(feEnv, 'environment.ts'), 'utf8');
    assert(adaptedText.includes("instrumentationKey: 'client-key-123'"), 'Nested appInsightsConfig must be preserved');
    assert(!adaptedText.includes('logframes2'), 'Deprecated logframes2 must be removed for Core >= 9.2.0');
    assert(!adaptedText.includes('aiwriter'), 'Optional aiwriter must not be injected blindly');
    assert(adaptedText.includes("newFeatureUrl: 'https://core.example/api'"), 'Missing top-level non-optional key must be added cleanly');
  } finally {
    fs.rmSync(tmpEnvDir, { recursive: true, force: true });
  }
});

test('adaptKnownSourceMigrations migrates browse-filter-layout, cleans _in_email SQL, and audits requirements', () => {
  const tmpMigDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ngo-adapt-mig-'));
  try {
    const htmlFile = path.join(tmpMigDir, 'ngo-client', 'src', 'app', 'sample-browse.component.html');
    const tsFile = path.join(tmpMigDir, 'ngo-client', 'src', 'app', 'inline-browse.component.ts');
    const sqlFile = path.join(tmpMigDir, 'ngo-api', 'NGO.Database', 'dbo', 'Stored Procedures', 'spSendMail.sql');
    fs.mkdirSync(path.dirname(htmlFile), { recursive: true });
    fs.mkdirSync(path.dirname(sqlFile), { recursive: true });

    fs.writeFileSync(
      htmlFile,
      `<div class="col-md-10"><ngo-list-filter></ngo-list-filter><div class="browse-filter pull-right"><ngo-search-box></ngo-search-box></div></div>\n`,
      'utf8'
    );
    fs.writeFileSync(
      tsFile,
      `@Component({\n  template: \`<div class="col-12"><ngo-list-filter></ngo-list-filter><ngo-search-box class="pull-left"></ngo-search-box></div>\`\n})\nexport class InlineBrowseComponent {}\n`,
      'utf8'
    );
    fs.writeFileSync(
      sqlFile,
      `INSERT INTO [dbo].[ResourceStrings] ([Key], [Value]) VALUES\n  ('active_key', 'Active'),\n  ('mail_subject_in_email', 'Obsolete');\n`,
      'utf8'
    );

    const migRes = adaptation.adaptKnownSourceMigrations(tmpMigDir, '9.5.0', '8.1.0');
    const updatedHtml = fs.readFileSync(htmlFile, 'utf8');
    const updatedTs = fs.readFileSync(tsFile, 'utf8');
    const updatedSql = fs.readFileSync(sqlFile, 'utf8');
    assert(updatedHtml.includes('browse-filter-layout') && updatedHtml.includes('[flattenIntoParentFlow]="true"'), 'HTML browse filter should migrate');
    assert(!updatedHtml.includes('pull-right'), 'HTML pull-right should be stripped');
    assert(updatedTs.includes('browse-filter-layout') && updatedTs.includes('[flattenIntoParentFlow]="true"'), 'Inline TS browse filter should migrate');
    assert(!updatedTs.includes('pull-left'), 'Inline TS pull-left should be stripped');
    assert(!updatedSql.includes('mail_subject_in_email') && updatedSql.includes("'active_key'") && !updatedSql.includes(',;'), '_in_email SQL seed row should be cleaned cleanly for Core >= 9.5.0');

    const auditRes = adaptation.auditReleaseRequirements(
      tmpMigDir,
      {
        split: {
          all: {
            requirements: [
              { id: 'REQ-9.3.0-FRONTEND-01', release: '9.3.0', scope: 'FRONTEND', title: 'Browse filter layout', action: 'Wrap in browse-filter-layout', timing: 'DURING_UPGRADE', automation: 'AUTOMATED_CODE_MOD' },
              { id: 'REQ-9.2.0-DB-AFTER', release: '9.2.0', scope: 'BACKEND', title: 'Run SQL seed', action: 'Execute seed script post-deploy', timing: 'AFTER_DEPLOYMENT', automation: 'MANUAL_DECISION' },
            ],
          },
        },
      },
      migRes,
      ['backend', 'frontend']
    );
    assert.strictEqual(auditRes.semanticMigrationsRequired.length, 0, 'Migrated browse filter should pass deterministic audit');
    assert.strictEqual(auditRes.manualHandoverItems.length, 1, 'After-deployment manual item should be queued for handover');
  } finally {
    fs.rmSync(tmpMigDir, { recursive: true, force: true });
  }
});

console.log('\nAll adaptation tests passed successfully!');

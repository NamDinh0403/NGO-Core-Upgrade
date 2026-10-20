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

console.log('\nAll adaptation tests passed successfully!');

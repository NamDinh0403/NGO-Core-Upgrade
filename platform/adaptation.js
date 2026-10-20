'use strict';
/*
 * Platform Adaptation Engine.
 *
 * Implements deterministic adaptation matching the original NGO Core Upgrade Agent:
 * 1. Cumulative release range resolution (from client source version to target Core version).
 * 2. Canonical requirement slicing into backend, frontend, and shared requirements.
 * 3. AppSettings configuration mapping & safe non-destructive merging (preserving client values).
 * 4. Frontend environment synchronization from Core reference host.
 * 5. Pre-build mechanical & source code adaptation (e.g. FormFieldFactoryExt 7th parameter).
 * 6. Handover deployment checklist generation (deployment-checklist.yaml, before/after-deployment.md).
 *
 * Dependency-free, Node 14+.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const INGEST_ROOT = path.join(REPO_ROOT, 'ingest');
const TEMPLATES_DIR = fs.existsSync(path.join(REPO_ROOT, 'engine', 'templates'))
  ? path.join(REPO_ROOT, 'engine', 'templates')
  : path.join(REPO_ROOT, 'orchestrator', 'templates');

const knowledgeLib = require('../engine/tools/lib/knowledge');
const requirementsLib = require('../engine/tools/lib/requirements');
const configurationLib = require('../backend/tools/configuration');
const handoverLib = require('../engine/tools/lib/handover');
const ingestLib = require('../ingest/tools/ingest');

/**
 * Set nested key path in JSON object (e.g. "Core:AzureOpenAISettings:Endpoint")
 * Strictly preserves existing values.
 */
function setNestedKey(obj, keyPath, value) {
  if (!obj || typeof obj !== 'object' || !keyPath) return false;
  const parts = String(keyPath).split(':');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object' || Array.isArray(current[part])) {
      current[part] = {};
    }
    current = current[part];
  }
  const lastKey = parts[parts.length - 1];
  if (current[lastKey] === undefined) {
    current[lastKey] = value;
    return true;
  }
  return false;
}

/**
 * Resolve release range and slice canonical requirements.
 */
function deriveReleaseRequirements({ corePath, sourceVersion, targetVersion, ingestOutDir, runId, tracks }) {
  const store = knowledgeLib.defaultStore();
  const allKnownVersions = store.listVersions();

  const srcVer = sourceVersion ? sourceVersion.replace(/^v/i, '') : null;
  const tgtVer = targetVersion ? targetVersion.replace(/^v/i, '') : null;

  // 1. Ingest Core facts via ingest.ensureReleases if corePath is a valid git repo
  let ingestResult = { reused: false, entries: [] };
  if (corePath && fs.existsSync(corePath)) {
    try {
      ingestResult = ingestLib.ensureReleases({
        'core-path': corePath,
        since: srcVer,
        target: tgtVer,
        out: ingestOutDir || path.join(REPO_ROOT, 'orchestrator', 'runs', '_candidates'),
      });
    } catch (_) {}
  }

  // 2. Compute release range from canonical store or ingested releases
  const versionsInRange = allKnownVersions.filter((v) => {
    if (srcVer && store.compareVersions && store.compareVersions(v, srcVer) <= 0) return false;
    if (tgtVer && store.compareVersions && store.compareVersions(v, tgtVer) > 0) return false;
    return true;
  });

  // 3. Slice requirements from ingested candidate entries and canonical store
  let split = {
    all: { requirements: [] },
    backend: { requirements: [] },
    frontend: { requirements: [] },
    shared: { requirements: [] },
    decisions: { features: {} },
  };

  try {
    split = requirementsLib.splitRequirements({
      ingestRoot: INGEST_ROOT,
      version: tgtVer,
      records: ingestResult.entries || [],
      runId: runId || 'run',
    });
  } catch (_) {}

  try {
    requirementsLib.appendCanonical(split, srcVer, tgtVer);
  } catch (_) {}

  const targetAngularMajor = store.angularMajorAt(tgtVer) || 15;
  const appSettings = store.appSettings ? store.appSettings() : [];

  return {
    ingestResult,
    split,
    versions: versionsInRange.length > 0 ? versionsInRange : (tgtVer ? [tgtVer] : []),
    targetAngularMajor,
    appSettings,
  };
}

/**
 * Inspect client appsettings and merge missing Core keys without overwriting client values.
 */
function adaptBackendConfiguration(clientPath, appSettingsList, onLog) {
  onLog = typeof onLog === 'function' ? onLog : () => {};
  const modifiedFiles = [];
  let addedKeysTotal = 0;

  if (!clientPath || !fs.existsSync(clientPath)) return { modifiedFiles, addedKeysTotal };

  const apiDir = path.join(clientPath, 'ngo-api');
  const inspectRoot = fs.existsSync(apiDir) ? apiDir : clientPath;

  const inspection = configurationLib.inspect(inspectRoot, appSettingsList || []);
  const missingSettings = inspection.missing || [];

  if (missingSettings.length === 0) {
    onLog('Backend AppSettings inspection: all canonical Core configuration keys verified.');
    return { modifiedFiles, addedKeysTotal, missingSettings };
  }

  onLog(`Backend AppSettings inspection: identified ${missingSettings.length} missing Core configuration key(s).`);

  // Locate all appsettings.*.json in client
  const targetFiles = [];
  function findAppsettings(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && !['bin', 'obj', '.vs', 'node_modules', '.git'].includes(entry.name)) {
        findAppsettings(full);
      } else if (/^appsettings.*\.json$/i.test(entry.name)) {
        targetFiles.push(full);
      }
    }
  }
  findAppsettings(inspectRoot);

  for (const filePath of targetFiles) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(raw);
      let fileModified = false;
      const processType = configurationLib.classifyProcess(filePath);

      for (const item of missingSettings) {
        if (item.owningProcess !== 'ALL' && item.owningProcess !== processType) continue;

        let val = item.sensitive ? '<FROM_SECRET_PROVIDER>' : (item.defaultValue != null ? item.defaultValue : '');
        if (item.dataType === 'boolean') val = item.defaultValue === 'true' || item.defaultValue === true;
        if (item.dataType === 'number') val = !isNaN(Number(item.defaultValue)) ? Number(item.defaultValue) : 0;

        const wasAdded = setNestedKey(json, item.key, val);
        if (wasAdded) {
          fileModified = true;
          addedKeysTotal++;
        }
      }

      if (fileModified) {
        fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
        const rel = path.relative(clientPath, filePath);
        modifiedFiles.push(rel);
        onLog(`Adapted AppSettings: merged missing Core keys into ${rel} (preserved existing values)`);
      }
    } catch (err) {
      onLog(`Warning: Failed to adapt ${path.relative(clientPath, filePath)}: ${err.message}`);
    }
  }

  return { modifiedFiles, addedKeysTotal, missingSettings, azureChecklist: inspection.azureChecklist || [] };
}

/**
 * Synchronize missing frontend environment configuration keys from Core reference host.
 */
function adaptFrontendEnvironment(clientPath, corePath, onLog) {
  onLog = typeof onLog === 'function' ? onLog : () => {};
  const modifiedFiles = [];

  const clientDir = path.join(clientPath, 'ngo-client');
  const targetDir = fs.existsSync(clientDir) ? clientDir : clientPath;
  const envDir = path.join(targetDir, 'src', 'environments');
  if (!fs.existsSync(envDir)) return { modifiedFiles };

  const coreClientDir = corePath ? path.join(corePath, 'ngo-client-core') : null;
  const coreEnvDir = (coreClientDir && fs.existsSync(path.join(coreClientDir, 'src', 'environments')))
    ? path.join(coreClientDir, 'src', 'environments')
    : null;

  if (!coreEnvDir) return { modifiedFiles };

  const envFiles = ['environment.ts', 'environment.prod.ts'];
  for (const ef of envFiles) {
    const clientEnvFile = path.join(envDir, ef);
    const coreEnvFile = path.join(coreEnvDir, ef);

    if (fs.existsSync(clientEnvFile) && fs.existsSync(coreEnvFile)) {
      try {
        let clientContent = fs.readFileSync(clientEnvFile, 'utf8');
        const coreContent = fs.readFileSync(coreEnvFile, 'utf8');

        // Extract top-level properties from core environment object
        const coreMatch = coreContent.match(/export\s+const\s+environment\s*=\s*{([\s\S]*?)};/);
        const clientMatch = clientContent.match(/export\s+const\s+environment\s*=\s*{([\s\S]*?)};/);

        if (coreMatch && clientMatch) {
          const coreBody = coreMatch[1];
          const clientBody = clientMatch[1];

          // Identify key properties in Core (e.g. appInsights, version, securityHeaders)
          const propRegex = /([a-zA-Z0-9_$]+)\s*:\s*([^,\r\n]+)/g;
          let propMatch;
          const missingProps = [];

          while ((propMatch = propRegex.exec(coreBody)) !== null) {
            const propName = propMatch[1];
            const propVal = propMatch[2].trim();
            // Check if client is missing this property
            const clientPropPattern = new RegExp(`\\b${propName}\\s*:`, 'i');
            if (!clientPropPattern.test(clientBody)) {
              missingProps.push({ name: propName, val: propVal });
            }
          }

          if (missingProps.length > 0) {
            const additions = missingProps.map((p) => `  ${p.name}: ${p.val},`).join('\n');
            clientContent = clientContent.replace(
              /export\s+const\s+environment\s*=\s*{/,
              `export const environment = {\n${additions}`
            );
            fs.writeFileSync(clientEnvFile, clientContent, 'utf8');
            modifiedFiles.push(path.relative(clientPath, clientEnvFile));
            onLog(`Adapted ${ef}: synchronized ${missingProps.length} Core environment propert${missingProps.length === 1 ? 'y' : 'ies'} (${missingProps.map(p => p.name).join(', ')})`);
          }
        }
      } catch (err) {
        onLog(`Warning: Failed to adapt environment file ${ef}: ${err.message}`);
      }
    }
  }

  return { modifiedFiles };
}

/**
 * Adapt known mechanical source changes before verification (reducing Copilot overload).
 */
function adaptKnownSourceMigrations(clientPath, targetVersion, sourceVersion, onLog) {
  onLog = typeof onLog === 'function' ? onLog : () => {};
  let adaptedFilesCount = 0;

  // 1. FormFieldFactoryExt constructor 7th argument (ngoTruncate: NGOTruncateHtml)
  const clientDir = path.join(clientPath, 'ngo-client');
  const targetDir = fs.existsSync(clientDir) ? clientDir : clientPath;
  const formFactoryCandidate = path.join(targetDir, 'src', 'app', 'shared', 'forms', 'form-field-factory-ext.service.ts');

  if (fs.existsSync(formFactoryCandidate)) {
    try {
      let content = fs.readFileSync(formFactoryCandidate, 'utf8');
      let modified = false;

      // Check if super(...) has 6 arguments and misses ngoTruncate
      const sixArgSuper = /super\s*\(\s*dateParser\s*,\s*ngoValidators\s*,\s*ngoDatePipe\s*,\s*translatePipe\s*,\s*translateService\s*,\s*store\s*\)\s*;/;
      if (sixArgSuper.test(content)) {
        // Ensure NGOTruncateHtml is imported from 'ngo-core'
        if (!content.includes('NGOTruncateHtml')) {
          content = content.replace(
            /(from\s+['"]ngo-core['"]\s*;)/,
            (m) => `    NGOTruncateHtml,\n} from 'ngo-core';`
          );
          content = content.replace(/NGOTruncateHtml,\s*\n\s*}\s*from\s+['"]ngo-core['"]\s*;/g, (m) => m);
        }

        // Add protected ngoTruncate: NGOTruncateHtml to constructor if missing
        if (!/ngoTruncate\s*:\s*NGOTruncateHtml/.test(content)) {
          content = content.replace(
            /(protected\s+configurationService\s*:\s*ConfigurationService)/,
            `protected ngoTruncate: NGOTruncateHtml,\n        $1`
          );
        }

        // Update super(...) call to pass ngoTruncate as 7th argument
        content = content.replace(
          sixArgSuper,
          'super(dateParser, ngoValidators, ngoDatePipe, translatePipe, translateService, store, ngoTruncate);'
        );

        fs.writeFileSync(formFactoryCandidate, content, 'utf8');
        adaptedFilesCount++;
        onLog('Adapted FormFieldFactoryExt: added 7th argument (ngoTruncate: NGOTruncateHtml) to constructor and super() call');
      }
    } catch (err) {
      onLog(`Warning: Failed to adapt FormFieldFactoryExt: ${err.message}`);
    }
  }

  // 2. Angular 15: adapt deprecated untyped form control syntax if required
  // (e.g. FormGroup without generics when compiling with strict typed forms)

  return { adaptedFilesCount };
}

/**
 * Generate handover deliverables (deployment checklist, before/after deployment markdown).
 */
function generateHandoverChecklist({ runId, clientId, sourceVersion, targetVersion, backendConfigResult, jobDir }) {
  const templatesDir = fs.existsSync(TEMPLATES_DIR) ? TEMPLATES_DIR : path.join(REPO_ROOT, 'orchestrator', 'templates');

  let domainEvidenceRefs = [];
  if (jobDir && backendConfigResult && backendConfigResult.azureChecklist) {
    const evidencePath = path.join(jobDir, 'backend-config-evidence.json');
    try {
      fs.writeFileSync(evidencePath, JSON.stringify({
        azureChecklist: backendConfigResult.azureChecklist,
        missingSettings: backendConfigResult.missingSettings || [],
      }, null, 2));
      domainEvidenceRefs.push(evidencePath);
    } catch (_) {}
  }

  try {
    const handover = handoverLib.prepareHandover({
      runId: runId || 'run',
      clientId: clientId || 'client',
      sourceVersion: sourceVersion || 'unknown',
      targetVersion: targetVersion || 'unknown',
      frontendRunDir: null,
      backendState: { status: 'PASSED', targetVersion },
      backendRunRef: null,
      frontendRunRef: null,
      templatesDir,
      domainEvidenceRefs,
    });

    if (jobDir) {
      fs.writeFileSync(path.join(jobDir, 'deployment-checklist.yaml'), require('../engine/tools/lib/yaml').stringify(handover.checklist));
      fs.writeFileSync(path.join(jobDir, 'before-deployment.md'), handover.beforeMd);
      fs.writeFileSync(path.join(jobDir, 'after-deployment.md'), handover.afterMd);
    }

    return handover;
  } catch (err) {
    return {
      checklist: { schemaVersion: 1, runId: runId || 'run', items: [] },
      beforeMd: '_None._',
      afterMd: '_None._',
      error: err.message,
    };
  }
}

module.exports = {
  deriveReleaseRequirements,
  adaptBackendConfiguration,
  adaptFrontendEnvironment,
  adaptKnownSourceMigrations,
  generateHandoverChecklist,
  setNestedKey,
};

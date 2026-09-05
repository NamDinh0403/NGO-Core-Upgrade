'use strict';
/*
 * Request construction + validation. A request may come from CLI flags or a
 * request YAML/JSON file. The normalized request drives the whole run.
 */
const path = require('path');
const core = require('./core');

const CORE_PACKAGE_NAME = 'ngo-core';

function fromFile(abs) {
  const text = core.readText(abs);
  const data = /\.ya?ml$/i.test(abs) ? require('./yaml').parse(text) : JSON.parse(text);
  return data;
}

/** Normalize either a --request file or discrete flags into one request shape. */
function build(flags, baseDir) {
  baseDir = baseDir || process.cwd();
  let raw;
  if (flags.request) {
    const abs = path.resolve(baseDir, flags.request);
    if (!core.exists(abs)) throw new Error(`request file not found: ${abs}`);
    raw = fromFile(abs);
    // A request file's relative repo paths resolve against the file's directory.
    baseDir = path.dirname(abs);
  } else {
    raw = {
      schemaVersion: 1,
      request: { clientId: flags['client-id'] || null },
      repositories: {
        client: { path: flags['client-path'], expectedPackageName: flags['expected-package-name'] || CORE_PACKAGE_NAME, mutable: true },
        core: { path: flags['core-path'], targetRef: flags['target-ref'] || null, readOnly: true },
      },
      upgrade: { sourceVersion: flags['source-version'] || null, targetVersion: flags['target-version'] || null },
      execution: {
        mode: flags.mode || 'standard',
        allowClientMutationAfterReadyPlan: true,
        requireApprovalForHighRiskChanges: true,
        allowRunLocalToolInstallation: flags['allow-tool-install'] !== false,
        allowSelectiveImplementationInspection: !!flags['allow-impl-inspection'],
      },
      validation: {
        baselineDevelopmentBuild: true, baselineProductionBuild: true,
        targetDevelopmentBuild: true, targetProductionBuild: true,
        runTests: true, bootstrapSmokeTest: true, routeSmokeTest: true,
      },
    };
  }

  const repos = raw.repositories || {};
  const clientPath = repos.client && repos.client.path;
  const corePath = repos.core && repos.core.path;
  const normalized = {
    schemaVersion: raw.schemaVersion || 1,
    request: raw.request || {},
    repositories: {
      client: Object.assign({ expectedPackageName: CORE_PACKAGE_NAME, mutable: true }, repos.client || {}),
      core: Object.assign({ readOnly: true, targetRef: null }, repos.core || {}),
    },
    upgrade: raw.upgrade || {},
    execution: raw.execution || {},
    validation: raw.validation || {},
    // Absolute, resolved repo paths for all downstream skills.
    resolved: {
      clientPath: clientPath ? path.resolve(baseDir, clientPath) : null,
      corePath: corePath ? path.resolve(baseDir, corePath) : null,
      baseDir,
    },
  };
  // Derive/echo target ref: fall back to a `v<targetVersion>` tag convention.
  if (!normalized.repositories.core.targetRef && normalized.upgrade.targetVersion) {
    normalized.repositories.core.targetRef = `v${normalized.upgrade.targetVersion}`;
  }
  return normalized;
}

/** Structural validation independent of filesystem state. */
function validate(req) {
  const errs = [];
  if (!req.repositories || !req.repositories.client || !req.resolved.clientPath) errs.push('missing client repository path');
  if (!req.repositories || !req.repositories.core || !req.resolved.corePath) errs.push('missing Core repository path');
  if (!req.upgrade || !req.upgrade.sourceVersion) errs.push('missing upgrade.sourceVersion');
  if (!req.upgrade || (!req.upgrade.targetVersion && !(req.repositories.core && req.repositories.core.targetRef))) {
    errs.push('missing upgrade.targetVersion or repositories.core.targetRef');
  }
  if (req.upgrade && req.upgrade.targetVersion && !core.isExactVersion(req.upgrade.targetVersion)) {
    errs.push(`targetVersion '${req.upgrade.targetVersion}' is not an exact version`);
  }
  return errs;
}

/** Derive a stable, sanitized client id for run directory scoping. */
function clientId(req) {
  const explicit = req.request && req.request.clientId;
  if (explicit) return String(explicit).replace(/[^A-Za-z0-9._-]+/g, '-');
  const base = req.resolved.clientPath ? path.basename(req.resolved.clientPath) : 'client';
  return String(base).replace(/[^A-Za-z0-9._-]+/g, '-') || 'client';
}

module.exports = { CORE_PACKAGE_NAME, build, validate, clientId, fromFile };

'use strict';
const fs = require('fs');
const path = require('path');

function versionFacts(entries) {
  const result = {};
  for (const name of Object.keys(entries || {})) {
    const value = entries[name];
    result[name] = typeof value === 'string' && value.length <= 160 && /^[\s\d.vxX*~^<>=|+\-]+$/.test(value) ? value : '<RESOLVE_LOCALLY>';
  }
  return result;
}

function inspect(clientPath, track) {
  return require('./executors').executor(track).inspect({ client: { path: clientPath } });
}

function discover(request) {
  const result = {};
  for (const track of request.tracks) result[track] = inspect(request[`${track}ClientPath`], track);
  return result;
}

function backendEvidence(clientPath) {
  const facts = inspect(clientPath, 'backend');
  return { domainDotnet: true, dotnetClientPresent: facts.present,
    frontendPresent: false, typescriptDetected: false, angularDetected: false, clientToolVersions: {},
    managedPackageComparison: facts.present, selectiveDecompilationApproved: facts.present, containerRequested: false };
}

module.exports = { versionFacts, inspect, discover, backendEvidence };
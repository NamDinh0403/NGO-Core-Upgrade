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
  const facts = { path: clientPath || null, manifests: [], present: false };
  if (!clientPath || !fs.existsSync(clientPath)) return facts;
  const root = fs.statSync(clientPath).isDirectory() ? clientPath : path.dirname(clientPath);
  const names = fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => entry.name);
  const relevant = track === 'backend' ? /\.(sln|slnx|csproj|fsproj)$|^global\.json$|^Directory\.(Packages|Build)\.props$/i : /^(package\.json|angular\.json|tsconfig(?:\.[^.]+)?\.json)$/i;
  facts.manifests = names.filter((name) => relevant.test(name)).map((name) => path.join(root, name));
  facts.present = track === 'backend' ? names.some((name) => /\.(sln|slnx|csproj|fsproj)$/i.test(name)) : names.includes('package.json');
  if (track === 'frontend' && names.includes('package.json')) {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    facts.package = { engines: versionFacts(pkg.engines), dependencies: versionFacts(Object.assign({}, pkg.devDependencies, pkg.dependencies)) };
    facts.angular = names.includes('angular.json');
    facts.typescript = names.some((name) => /^tsconfig.*\.json$/i.test(name));
  }
  if (track === 'backend' && names.includes('global.json')) {
    const sdk = JSON.parse(fs.readFileSync(path.join(root, 'global.json'), 'utf8'));
    const rollForwardModes = ['disable', 'patch', 'feature', 'minor', 'major', 'latestPatch', 'latestFeature', 'latestMinor', 'latestMajor'];
    facts.sdk = sdk.sdk ? { version: versionFacts({ version: sdk.sdk.version }).version, rollForward: rollForwardModes.includes(sdk.sdk.rollForward) ? sdk.sdk.rollForward : null, allowPrerelease: sdk.sdk.allowPrerelease === true } : {};
  }
  return facts;
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

module.exports = { inspect, discover, backendEvidence };
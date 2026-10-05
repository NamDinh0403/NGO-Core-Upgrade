'use strict';
/*
 * TOOL_BOOTSTRAP test suite — 24 scenarios. Dependency-free, offline-deterministic.
 * Process execution is stubbed where a real install/network call would otherwise
 * be required, so the tests validate logic, policy, and safety without side effects.
 *
 * Run: node tools/bootstrap/tests/bootstrap.test.js
 */
const path = require('path');
const core = require('../lib/core');
const tools = require('../lib/tools');
const { runWrapper } = require('../../wrappers/lib/wrapper');

const policy = core.loadConfig().policy;
const results = [];
const realExec = core.runExec;
function stubExec(fn) { core.runExec = fn; }
function restoreExec() { core.runExec = realExec; }
function test(id, fn) {
  try { fn(); results.push({ id, pass: true }); }
  catch (e) { results.push({ id, pass: false, error: e.message }); }
  finally { restoreExec(); }
}
function assert(c, m) { if (!c) throw new Error(m); }

// Isolated tooling target for install tests. Lives under runs/ which is git-ignored,
// so no test can ever delete or dirty a tracked file (see test 21).
const TEST_TOOLING_DIR = 'runs/_bootstrap-test-tooling';

// Snapshot of the working tree, captured before any test runs, so test 24 can prove the
// suite itself changed nothing tracked (a previous version silently deleted files).
function gitStatus() {
  const res = require('child_process').spawnSync('git', ['status', '--porcelain'], {
    cwd: core.ROOT, encoding: 'utf8', shell: true, windowsHide: true,
  });
  return res.status === 0 ? (res.stdout || '').trim() : null;
}
function diffLines(before, after) {
  const b = new Set(before.split(/\r?\n/));
  return after.split(/\r?\n/).filter((l) => l && !b.has(l)).join('\n') || '(entries disappeared)';
}
const TREE_BASELINE = gitStatus();

const ev = (over) => Object.assign({
  domainDotnet: true, dotnetClientPresent: false, frontendPresent: false,
  typescriptDetected: false, angularDetected: false, managedPackageComparison: false,
  selectiveDecompilationApproved: false, containerRequested: false, clientToolVersions: {},
}, over || {});

// 1. All required tools already available (node is really present).
test('01-required-available', () => {
  const c = tools.checkTool({ id: 'node', classification: 'REQUIRED', detect: ['node', '--version'], capabilities: ['x'] }, ev(), policy);
  assert(c.status === 'AVAILABLE', 'node should be AVAILABLE, got ' + c.status);
});

// 2. Repository-local .NET tool missing then installed successfully (stubbed).
test('02-dotnet-local-install', () => {
  stubExec(() => ({ code: 0, stdout: '', stderr: '', timedOut: false, error: null }));
  const tool = { id: 'x-apicompat', classification: 'REQUIRED_IF_APPLICABLE', autoInstall: true, installation: { type: 'dotnet-local-tool', package: 'Microsoft.DotNet.ApiCompat.Tool', pinnedVersion: null } };
  const check = { status: 'INSTALLATION_REQUIRED' };
  const out = tools.installTool(tool, policy, check, []);
  assert(out.status === 'AVAILABLE' && out.selectedScope === 'REPOSITORY_LOCAL', 'expected REPOSITORY_LOCAL AVAILABLE, got ' + out.status);
});

// 3. Run-local npm tool missing then installed successfully (stubbed).
//    The isolated tooling dir is redirected under runs/ (git-ignored) so the test can
//    never delete or dirty tracked repository files.
test('03-npm-runlocal-install', () => {
  const fs = require('fs');
  const testPolicy = JSON.parse(JSON.stringify(policy));
  testPolicy.npmTools.isolatedToolingDir = TEST_TOOLING_DIR;
  stubExec(() => ({ code: 0, stdout: '', stderr: '', timedOut: false, error: null }));
  const tool = { id: 'x-ts', classification: 'REQUIRED_IF_APPLICABLE', autoInstall: true, installation: { type: 'isolated-npm-dev-dependency', package: 'typescript', pinnedVersion: '5.4.5', binary: 'tsc' } };
  const out = tools.installTool(tool, testPolicy, { status: 'INSTALLATION_REQUIRED' }, [], ev());
  try {
    assert(out.status === 'AVAILABLE' && out.selectedScope === 'RUN_LOCAL', 'expected RUN_LOCAL AVAILABLE, got ' + out.status);
    assert(/[\\/]node_modules[\\/]\.bin[\\/]tsc/.test(out.executable), 'executable must be the installed tsc binary, got ' + out.executable);
  } finally {
    try { fs.rmSync(core.P(TEST_TOOLING_DIR), { recursive: true, force: true }); } catch (e) { /* best effort */ }
  }
});

// 4. Required SDK missing and auto-install forbidden -> MISSING (not INSTALLATION_REQUIRED).
test('04-sdk-missing-no-autoinstall', () => {
  const c = tools.checkTool({ id: 'fake-sdk', classification: 'REQUIRED_IF_APPLICABLE', appliesWhen: { domainDotnet: true }, detect: ['nonexistent-cmd-xyz', '--version'], autoInstall: false, capabilities: ['y'] }, ev(), policy);
  assert(c.status === 'MISSING', 'expected MISSING, got ' + c.status);
});

// 5. Installed tool version below minimum.
test('05-version-too-old', () => {
  const c = tools.checkTool({ id: 'node-old', classification: 'REQUIRED', detect: ['node', '--version'], minimumVersion: '999.0.0', capabilities: ['z'] }, ev(), policy);
  assert(c.status === 'VERSION_TOO_OLD', 'expected VERSION_TOO_OLD, got ' + c.status);
});

// 6. Pinned version is passed to the installer (repository-pinned selection).
test('06-pinned-version-used', () => {
  let captured = null;
  stubExec((cmd, argv) => { captured = argv; return { code: 0, stdout: '', stderr: '', timedOut: false, error: null }; });
  const tool = { id: 'x', autoInstall: true, installation: { type: 'dotnet-local-tool', package: 'ilspycmd', pinnedVersion: '9.1.0' } };
  tools.installTool(tool, policy, { status: 'INSTALLATION_REQUIRED' }, []);
  assert(captured && captured.join(' ').includes('--version 9.1.0'), 'pinned version not passed: ' + JSON.stringify(captured));
});

// 7. Version command succeeds but smoke test fails -> VALIDATION_FAILED.
test('07-smoke-fails', () => {
  const reqs = { tools: [{ id: 'node', classification: 'REQUIRED', detect: ['node', '--version'], capabilities: ['c'], smoke: 'always-fail' }] };
  // inject a failing smoke id
  const built = tools.buildManifest(reqs, ev(), policy, 'test', 'check');
  const t = built.manifest.tools[0];
  // 'always-fail' is unknown => SKIPPED, so assert instead using a known-fail smoke:
  const reqs2 = { tools: [{ id: 'angular-cli', classification: 'REQUIRED_IF_APPLICABLE', appliesWhen: { angularDetected: true }, detect: ['node', '--version'], capabilities: ['c'], smoke: 'tsc-noemit-fixture' }] };
  const built2 = tools.buildManifest(reqs2, ev({ angularDetected: true }), policy, 'test', 'check');
  assert(built2.manifest.tools[0].status === 'VALIDATION_FAILED', 'expected VALIDATION_FAILED, got ' + built2.manifest.tools[0].status);
});

// 8. Installation requires administrator access -> INSTALLATION_BLOCKED.
test('08-admin-required', () => {
  stubExec(() => ({ code: 1, stdout: '', stderr: 'Access is denied. Administrator permission required.', timedOut: false, error: null }));
  const tool = { id: 'x', autoInstall: true, installation: { type: 'dotnet-local-tool', package: 'p', pinnedVersion: null } };
  const out = tools.installTool(tool, policy, { status: 'INSTALLATION_REQUIRED' }, []);
  assert(out.status === 'INSTALLATION_BLOCKED', 'expected INSTALLATION_BLOCKED, got ' + out.status);
});

// 9. Private feed credentials unavailable -> INSTALLATION_BLOCKED.
test('09-feed-creds-unavailable', () => {
  stubExec(() => ({ code: 1, stdout: '', stderr: 'error NU1301: Unable to load the service index. 401 Unauthorized', timedOut: false, error: null }));
  const tool = { id: 'x', autoInstall: true, installation: { type: 'dotnet-local-tool', package: 'p', pinnedVersion: null } };
  const out = tools.installTool(tool, policy, { status: 'INSTALLATION_REQUIRED' }, []);
  assert(out.status === 'INSTALLATION_BLOCKED', 'expected INSTALLATION_BLOCKED, got ' + out.status);
});

// 10. Tool output containing a token is redacted.
test('10-token-redacted', () => {
  const redact = core.redactor(policy);
  const out = redact('npm config: //registry.npmjs.org/:_authToken=abcd1234SECRET token=zzz');
  assert(!out.includes('abcd1234SECRET') && !out.includes('zzz'), 'token not redacted: ' + out);
});

// 11. Angular not detected -> Angular tools NOT_APPLICABLE.
test('11-angular-not-applicable', () => {
  const c = tools.checkTool({ id: 'angular-cli', classification: 'REQUIRED_IF_APPLICABLE', appliesWhen: { angularDetected: true }, capabilities: ['a'] }, ev(), policy);
  assert(c.status === 'NOT_APPLICABLE', 'expected NOT_APPLICABLE, got ' + c.status);
});

// 12. .NET package comparison not applicable -> apicompat NOT_APPLICABLE.
test('12-dotnet-analysis-not-applicable', () => {
  const c = tools.checkTool({ id: 'apicompat', classification: 'REQUIRED_IF_APPLICABLE', appliesWhen: { managedPackageComparison: true }, capabilities: ['a'] }, ev(), policy);
  assert(c.status === 'NOT_APPLICABLE', 'expected NOT_APPLICABLE, got ' + c.status);
});

// 13. Decompilation forbidden by policy -> POLICY_BLOCKED.
test('13-decompilation-forbidden', () => {
  const noDecompile = JSON.parse(JSON.stringify(policy));
  noDecompile.gates['decompilation-permitted'] = false;
  const c = tools.checkTool({ id: 'ilspycmd', classification: 'REQUIRED_IF_APPLICABLE', appliesWhen: { selectiveDecompilationApproved: true }, policyGate: ['decompilation-permitted'], capabilities: ['d'] }, ev({ selectiveDecompilationApproved: true }), noDecompile);
  assert(c.status === 'POLICY_BLOCKED', 'expected POLICY_BLOCKED, got ' + c.status);
});

// 14. Required capability unavailable -> workflow blocked (missing capability listed).
test('14-required-capability-missing', () => {
  const reqs = { tools: [{ id: 'fake', classification: 'REQUIRED', detect: ['nonexistent-cmd-xyz', '-v'], autoInstall: false, capabilities: ['critical-cap'] }] };
  const built = tools.buildManifest(reqs, ev(), policy, 'test', 'check');
  assert(built.manifest.missingRequiredCapabilities.includes('critical-cap'), 'missing capability not reported');
});

// 15. Tool becomes available after manual install; re-run resolves AVAILABLE.
test('15-resume-after-manual-install', () => {
  // Before: detect fails. After (simulated present): detect succeeds.
  let present = false;
  stubExec((cmd) => present ? { code: 0, stdout: '1.0.0', stderr: '', timedOut: false } : { code: 1, stdout: '', stderr: '', timedOut: false });
  const spec = { id: 'x', classification: 'REQUIRED', detect: ['x', '--version'], autoInstall: false, capabilities: ['c'] };
  assert(tools.checkTool(spec, ev(), policy).status === 'MISSING', 'expected MISSING before');
  present = true;
  assert(tools.checkTool(spec, ev(), policy).status === 'AVAILABLE', 'expected AVAILABLE after manual install');
});

// 16. Research wrapper refuses to mutate the client project.
test('16-wrapper-refuses-mutation', () => {
  const r = runWrapper({ toolId: 'npm', capability: 'acquire-npm-package', argsPrefix: [], userArgs: ['install', 'left-pad'], mutatingVerbs: ['install', 'ci'] });
  assert(r.status === 'REFUSED_CLIENT_MUTATION', 'expected REFUSED_CLIENT_MUTATION, got ' + r.status);
});

// 17. Bypass attempt targeting a protected client file is rejected.
test('17-protected-file-rejected', () => {
  const r = runWrapper({ toolId: 'dotnet', capability: 'restore-nuget-dependency-graph', argsPrefix: [], userArgs: ['restore', 'Client.csproj'], mutatingVerbs: [] });
  assert(r.status === 'REFUSED_CLIENT_MUTATION', 'expected REFUSED_CLIENT_MUTATION for .csproj, got ' + r.status);
});

// 18. Isolated npm install does not touch the client package.json.
test('18-no-client-manifest-mutation', () => {
  assert(policy.npmTools.addToClientPackageJson === false, 'policy must forbid client package.json mutation');
  assert(policy.npmTools.isolatedToolingDir && policy.npmTools.isolatedToolingDir.indexOf('tools/') === 0, 'tooling must be isolated under tools/');
});

// 19. Re-run is safe: an already-AVAILABLE tool is not reinstalled.
test('19-rerun-safe', () => {
  const c = tools.checkTool({ id: 'node', classification: 'REQUIRED', detect: ['node', '--version'], installation: { type: 'dotnet-local-tool', package: 'p' }, autoInstall: true, capabilities: ['c'] }, ev(), policy);
  assert(c.status === 'AVAILABLE' && c.selectedScope === 'EXISTING_APPROVED', 'found tool must not trigger install');
});

// 20. Generated tool manifest satisfies its schema (required fields present).
test('20-manifest-schema', () => {
  const fs = require('fs');
  const schema = JSON.parse(fs.readFileSync(core.P('schemas/tool-manifest.schema.json'), 'utf8'));
  const built = tools.buildManifest(core.loadConfig().requirements, ev(), policy, 'test', 'check');
  for (const k of schema.required) assert(k in built.manifest, 'manifest missing ' + k);
  for (const t of built.manifest.tools) {
    assert(t.id && t.status && t.classification && t.validation, 'tool record incomplete: ' + t.id);
    assert(schema.properties.tools.items.properties.status.enum.includes(t.status), 'invalid status ' + t.status);
  }
});

// 21. `versionSource: client-compatible` installs the exact version the client declares.
test('21-client-compatible-version-resolved', () => {
  const fs = require('fs');
  const testPolicy = JSON.parse(JSON.stringify(policy));
  testPolicy.npmTools.isolatedToolingDir = TEST_TOOLING_DIR;
  let captured = null;
  stubExec((cmd, argv) => { captured = argv; return { code: 0, stdout: '', stderr: '', timedOut: false, error: null }; });
  const tool = { id: 'x-ng', autoInstall: true, installation: { type: 'isolated-npm-dev-dependency', package: '@angular/cli', versionSource: 'client-compatible', binary: 'ng' } };
  const out = tools.installTool(tool, testPolicy, { status: 'INSTALLATION_REQUIRED' }, [], ev({ angularDetected: true, clientToolVersions: { '@angular/cli': '17.3.8' } }));
  try {
    assert(out.status === 'AVAILABLE', 'expected AVAILABLE, got ' + out.status);
    assert(captured && captured.join(' ').includes('@angular/cli@17.3.8'), 'client version not used: ' + JSON.stringify(captured));
  } finally {
    try { fs.rmSync(core.P(TEST_TOOLING_DIR), { recursive: true, force: true }); } catch (e) { /* best effort */ }
  }
});

// 22. No pinned and no client-declared version -> INSTALLATION_BLOCKED (never "latest").
test('22-unpinned-install-blocked', () => {
  stubExec(() => ({ code: 0, stdout: '', stderr: '', timedOut: false, error: null }));
  const tool = { id: 'x-ts', autoInstall: true, installation: { type: 'isolated-npm-dev-dependency', package: 'typescript', versionSource: 'client-compatible', binary: 'tsc' } };
  const out = tools.installTool(tool, policy, { status: 'INSTALLATION_REQUIRED' }, [], ev({ typescriptDetected: true }));
  assert(out.status === 'INSTALLATION_BLOCKED', 'expected INSTALLATION_BLOCKED, got ' + out.status);
});

// 23. Client dependency ranges are normalised to an exact installable version.
test('23-client-version-range-normalised', () => {
  assert(core.exactVersionFromRange('^17.3.8') === '17.3.8', 'caret range');
  assert(core.exactVersionFromRange('~5.4.5') === '5.4.5', 'tilde range');
  assert(core.exactVersionFromRange('18.0.0-rc.1') === '18.0.0-rc.1', 'prerelease');
  assert(core.exactVersionFromRange('*') === null, 'wildcard must not resolve');
  assert(core.exactVersionFromRange('github:x/y') === null, 'git spec must not resolve');
});

// 24. Clean-tree invariant: running this suite must not modify any tracked file.
test('24-suite-leaves-tree-clean', () => {
  const after = gitStatus();
  assert(after !== null, 'git status unavailable');
  assert(after === TREE_BASELINE, 'the test suite modified tracked files:\n' + diffLines(TREE_BASELINE, after));
});

// ---- report ----
const passed = results.filter((r) => r.pass).length;
console.log('TOOL_BOOTSTRAP tests');
for (const r of results) console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.id}${r.error ? '  -> ' + r.error : ''}`);
console.log(`\n${passed}/${results.length} passed, ${results.length - passed} failed.`);
process.exit(passed === results.length ? 0 : 1);

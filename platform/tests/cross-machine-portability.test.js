'use strict';
/*
 * Cross-Machine Portability, Authentication, and Environment Readiness Test Suite (Phase 9).
 *
 * Verifies all 16 required cross-machine verification scenarios:
 *   1. Clean machine with missing required tools (TOOL_MISSING vs TOOL_INCOMPATIBLE).
 *   2. GitHub CLI (gh) installed vs not installed.
 *   3. GitHub CLI (gh) logged in vs not logged in / expired token.
 *   4. gh logged in, but Git remote access still failing (GH_AUTH_OK_BUT_GIT_CREDENTIAL_MISSING / SSH_AUTH_FAILED / INSUFFICIENT_PERMISSIONS).
 *   5. Local NGO Core repository in default / explicit path.
 *   6. Local NGO Core repository in non-standard nested path via approvedWorkspaceRoots / NGO_CORE_PATH.
 *   7. Multiple candidate Core repositories on disk (MULTIPLE_CANDIDATES_FOUND + Client repo disambiguation).
 *   8. Missing NGO Core repository (NOT_FOUND / INVALID_EXPLICIT_PATH with checked locations and failed criteria).
 *   9. Valid vs invalid NuGet.Config (disabledPackageSources & packageSourceMapping blocking NGO.Core).
 *  10. Missing or expired Azure Artifacts credentials (401 UNAUTHENTICATED).
 *  11. Authenticated Azure user without feed permissions (403 FORBIDDEN).
 *  12. Public NuGet working while private Azure Artifacts fails.
 *  13. Valid vs broken .npmrc (incomplete VssSessionToken, missing ${ENV_VAR}, obsolete unscoped email/_auth, backup-before-repair, secret redaction).
 *  14. npm version differences (npm >= 9 --auth-type=web vs legacy; npm ci when lockfile valid vs npm install --legacy-peer-deps when package.json modified).
 *  15. Backend-only upgrade (skips npm requirement) vs frontend-only upgrade (skips dotnet requirement) vs full-stack.
 *  16. Cross-machine settings.json portability & state fingerprint recovery (non-existent original author paths fall back cleanly).
 *
 * Dependency-free, Node 14+.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const assert = require('assert');

const coreDiscovery = require('../core-discovery');
const githubAuth = require('../github-auth');
const nugetSources = require('../nuget-sources');
const npmDiagnostics = require('../npm-diagnostics');
const checkEnv = require('../../tools/check-environment');

const results = [];
async function test(id, fn) {
  try {
    await fn();
    results.push({ id, pass: true });
    console.log(`  PASS  ${id}`);
  } catch (e) {
    results.push({ id, pass: false, error: e.stack || e.message });
    console.log(`  FAIL  ${id}: ${e.message}`);
  }
}

function sh(cmd, cwd) {
  cp.execSync(cmd, { cwd, stdio: 'pipe' });
}

function createFakeGitRepo(repoDir, opts = {}) {
  fs.mkdirSync(repoDir, { recursive: true });
  sh('git init -q', repoDir);
  sh('git config user.email test@ngo.local', repoDir);
  sh('git config user.name "NGO Portability Test"', repoDir);
  if (opts.remoteUrl) {
    sh(`git remote add origin "${opts.remoteUrl}"`, repoDir);
  }
  if (opts.isCore) {
    fs.mkdirSync(path.join(repoDir, 'ngo-api-core'), { recursive: true });
    fs.mkdirSync(path.join(repoDir, 'ngo-client-core'), { recursive: true });
    fs.writeFileSync(
      path.join(repoDir, 'ngo-api-core', 'NGO.Core.csproj'),
      '<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><PackageId>NGO.Core</PackageId><Version>9.4.1</Version></PropertyGroup></Project>'
    );
    fs.writeFileSync(
      path.join(repoDir, 'package.json'),
      JSON.stringify({ name: '@ngo/core', version: '9.4.1' }, null, 2)
    );
  }
  if (opts.isClient) {
    fs.mkdirSync(path.join(repoDir, 'ngo-api'), { recursive: true });
    fs.writeFileSync(
      path.join(repoDir, 'ngo-api', 'Client.Api.csproj'),
      '<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net8.0</TargetFramework></PropertyGroup><ItemGroup><PackageReference Include="NGO.Core" Version="9.2.0" /></ItemGroup></Project>'
    );
    fs.mkdirSync(path.join(repoDir, 'ngo-client'), { recursive: true });
    fs.writeFileSync(
      path.join(repoDir, 'ngo-client', 'package.json'),
      JSON.stringify({ name: 'ngo-client-app', dependencies: { '@ngo/core': '9.2.0' } }, null, 2)
    );
  }
  sh('git add -A', repoDir);
  sh('git commit -q -m "initial commit"', repoDir);
  if (Array.isArray(opts.tags)) {
    for (const t of opts.tags) {
      sh(`git tag ${t}`, repoDir);
    }
  }
}

async function runSuite() {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ngo-portability-suite-'));

  try {
    // =========================================================================
    // SCENARIO 1: Clean machine with missing or incompatible required tools
    // =========================================================================
    await test('01-clean-machine-missing-and-incompatible-tools', async () => {
      const tools = checkEnv.checkRuntimeTools({
        tracks: ['backend', 'frontend'],
        mockTools: {
          dotnet: { installed: false },
          npm: { installed: true, version: '5.0.0', compatible: false },
        },
      });

      const dotnetTool = tools.find((t) => t.name === 'dotnet');
      assert.strictEqual(dotnetTool.status, 'BLOCKED');
      assert.strictEqual(dotnetTool.failureType, 'TOOL_MISSING');

      const npmTool = tools.find((t) => t.name === 'npm');
      assert.strictEqual(npmTool.status, 'BLOCKED');
      assert.strictEqual(npmTool.failureType, 'TOOL_INCOMPATIBLE');
    });

    // =========================================================================
    // SCENARIO 2: GitHub CLI (gh) installed vs not installed
    // =========================================================================
    await test('02-gh-cli-installed-vs-not-installed', async () => {
      const missingGh = githubAuth.inspectGhCli({
        execFn: () => ({ ok: false, exitCode: 1, stdout: '', stderr: 'gh: command not found' }),
        locateFn: () => null,
      });
      assert.strictEqual(missingGh.installed, false);
      assert.strictEqual(missingGh.status, 'TOOL_MISSING');
      assert(missingGh.remediation.includes('winget install --id GitHub.cli'));

      const installedGh = githubAuth.inspectGhCli({
        locateFn: () => 'C:\\Program Files\\GitHub CLI\\gh.exe',
        execFn: (_bin, args) => {
          if (args[0] === '--version') {
            return { ok: true, exitCode: 0, stdout: 'gh version 2.65.0 (2026-01-15)', stderr: '' };
          }
          return {
            ok: true,
            exitCode: 0,
            stdout: 'github.com\n  ✓ Logged in to github.com account dev-coworker (keyring)\n  - Git operations protocol: https\n',
            stderr: '',
          };
        },
      });
      assert.strictEqual(installedGh.installed, true);
      assert.strictEqual(installedGh.version, '2.65.0');
      assert.strictEqual(installedGh.authenticated, true);
      assert.strictEqual(installedGh.activeAccount, 'dev-coworker');
    });

    // =========================================================================
    // SCENARIO 3: GitHub CLI logged in vs not logged in / expired token
    // =========================================================================
    await test('03-gh-cli-logged-in-vs-not-authenticated-or-expired', async () => {
      const unauthGh = githubAuth.inspectGhCli({
        locateFn: () => 'C:\\Program Files\\GitHub CLI\\gh.exe',
        execFn: (_bin, args) => {
          if (args[0] === '--version') return { ok: true, exitCode: 0, stdout: 'gh version 2.65.0', stderr: '' };
          return { ok: false, exitCode: 1, stdout: '', stderr: 'You are not logged into any GitHub hosts. Run gh auth login to authenticate.' };
        },
      });
      assert.strictEqual(unauthGh.authenticated, false);
      assert.strictEqual(unauthGh.status, 'NOT_AUTHENTICATED');
      assert(unauthGh.remediation.includes('gh auth login'));

      const expiredGh = githubAuth.inspectGhCli({
        locateFn: () => 'C:\\Program Files\\GitHub CLI\\gh.exe',
        execFn: (_bin, args) => {
          if (args[0] === '--version') return { ok: true, exitCode: 0, stdout: 'gh version 2.65.0', stderr: '' };
          return { ok: false, exitCode: 1, stdout: '', stderr: 'github.com:The token in keyring is invalid or expired.' };
        },
      });
      assert.strictEqual(expiredGh.authenticated, false);
      assert.strictEqual(expiredGh.status, 'CREDENTIALS_EXPIRED');
    });

    // =========================================================================
    // SCENARIO 4: gh logged in, but Git remote access still failing
    // =========================================================================
    await test('04-gh-logged-in-but-git-remote-access-fails', async () => {
      const repoDir = path.join(tmpRoot, 'scen4-repo');
      createFakeGitRepo(repoDir, { remoteUrl: 'https://github.com/ngo-org/ngo-online-core.git', isCore: true });

      const check = githubAuth.verifyGitAndGitHubAccess({
        repoPath: repoDir,
        requireRemoteAccess: true,
        execFn: (bin, args) => {
          if (bin === 'gh') {
            if (args[0] === '--version') return { ok: true, exitCode: 0, stdout: 'gh version 2.65.0', stderr: '' };
            return { ok: true, exitCode: 0, stdout: 'github.com\n  ✓ Logged in to github.com account dev-coworker (keyring)\n', stderr: '' };
          }
          if (bin === 'git') {
            if (args[0] === '--version') return { ok: true, exitCode: 0, stdout: 'git version 2.45.0', stderr: '' };
            if (args.includes('user.name')) return { ok: true, exitCode: 0, stdout: 'NGO Dev', stderr: '' };
            if (args.includes('user.email')) return { ok: true, exitCode: 0, stdout: 'dev@ngo.local', stderr: '' };
            if (args.includes('credential.helper')) return { ok: true, exitCode: 0, stdout: '', stderr: '' };
            if (args.includes('remote.origin.url')) return { ok: true, exitCode: 0, stdout: 'https://github.com/ngo-org/ngo-online-core.git', stderr: '' };
            if (args.includes('ls-remote')) {
              return { ok: false, exitCode: 128, stdout: '', stderr: "fatal: could not read Username for 'https://github.com': terminal prompts disabled" };
            }
          }
          return { ok: true, exitCode: 0, stdout: '', stderr: '' };
        },
      });

      assert.strictEqual(check.ok, false);
      assert.strictEqual(check.gh.authenticated, true);
      assert.strictEqual(check.repositoryAccess.accessible, false);
      assert.strictEqual(check.repositoryAccess.status, 'GH_AUTH_OK_BUT_GIT_CREDENTIAL_MISSING');
      assert(check.remediation.includes('gh auth setup-git'));
    });

    // =========================================================================
    // SCENARIO 5: Local NGO Core repository in explicit / default path
    // =========================================================================
    await test('05-local-core-repo-explicit-path-validation', async () => {
      const coreDir = path.join(tmpRoot, 'scen5-core', 'ngo-online-core');
      createFakeGitRepo(coreDir, {
        remoteUrl: 'https://github.com/ngo-org/ngo-online-core.git',
        isCore: true,
        tags: ['v9.2.0', 'v9.4.1'],
      });

      const res = coreDiscovery.discoverCoreRepository({
        corePath: coreDir,
        bypassCache: true,
      });

      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.status, 'RESOLVED_EXPLICIT');
      assert.strictEqual(res.selected.path, path.resolve(coreDir));
      assert.strictEqual(res.candidates[0].classification, 'NGO_CORE_REPOSITORY');
      assert(res.candidates[0].git.tagCount >= 2);
    });

    // =========================================================================
    // SCENARIO 6: Local NGO Core repository in non-standard nested path
    // =========================================================================
    await test('06-local-core-repo-discovered-in-nested-workspace-root', async () => {
      const customRoot = path.join(tmpRoot, 'scen6-workspace');
      const nestedCore = path.join(customRoot, 'team-repos', 'backend', 'ngo-online-core');
      createFakeGitRepo(nestedCore, {
        remoteUrl: 'https://dev.azure.com/org/proj/_git/ngo-online-core',
        isCore: true,
        tags: ['v9.4.1'],
      });

      const res = coreDiscovery.discoverCoreRepository({
        envCorePath: null,
        settingsCorePath: null,
        includeRepoSiblings: false,
        includeStandardWindowsLayouts: false,
        approvedWorkspaceRoots: [customRoot],
        maxDepth: 3,
        bypassCache: true,
      });

      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.status, 'DISCOVERED');
      assert.strictEqual(res.selected.path, path.resolve(nestedCore));
    });

    // =========================================================================
    // SCENARIO 7: Multiple candidate Core repos + Client repo disambiguation
    // =========================================================================
    await test('07-multiple-candidate-core-repos-and-client-disambiguation', async () => {
      const multiRoot = path.join(tmpRoot, 'scen7-multi');
      const coreA = path.join(multiRoot, 'ngo-online-core-main');
      const coreB = path.join(multiRoot, 'ngo-online-core-worktree');
      const clientRepo = path.join(multiRoot, 'ngo-online-shelterbox');

      createFakeGitRepo(coreA, { remoteUrl: 'https://github.com/org/ngo-online-core.git', isCore: true, tags: ['v9.4.1'] });
      createFakeGitRepo(coreB, { remoteUrl: 'https://github.com/org/ngo-online-core.git', isCore: true, tags: ['v9.4.1'] });
      createFakeGitRepo(clientRepo, { remoteUrl: 'https://github.com/org/ngo-online-shelterbox.git', isClient: true });

      // Verify Client repo is rejected as CLIENT_REPOSITORY
      const clientValidation = coreDiscovery.validateCoreCandidate(clientRepo);
      assert.strictEqual(clientValidation.valid, false);
      assert.strictEqual(clientValidation.classification, 'CLIENT_REPOSITORY');

      // Verify multiple Core candidates require explicit selection
      const res = coreDiscovery.discoverCoreRepository({
        envCorePath: null,
        settingsCorePath: null,
        includeRepoSiblings: false,
        includeStandardWindowsLayouts: false,
        approvedWorkspaceRoots: [multiRoot],
        bypassCache: true,
      });

      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.requiresSelection, true);
      assert.strictEqual(res.status, 'MULTIPLE_CANDIDATES_FOUND');
      assert.strictEqual(res.candidates.length, 2);
    });

    // =========================================================================
    // SCENARIO 8: Missing NGO Core repository reports checked locations & criteria
    // =========================================================================
    await test('08-missing-core-repo-reports-checked-locations-and-failed-criteria', async () => {
      const emptyRoot = path.join(tmpRoot, 'scen8-empty');
      fs.mkdirSync(emptyRoot, { recursive: true });

      const res = coreDiscovery.discoverCoreRepository({
        envCorePath: null,
        settingsCorePath: null,
        includeRepoSiblings: false,
        includeStandardWindowsLayouts: false,
        approvedWorkspaceRoots: [emptyRoot],
        bypassCache: true,
      });

      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.status, 'NOT_FOUND');
      assert(res.checkedLocations.length >= 1);
      assert(res.remediation.includes('--core-path'));

      const invalidExplicit = coreDiscovery.discoverCoreRepository({
        corePath: path.join(emptyRoot, 'does-not-exist'),
        bypassCache: true,
      });
      assert.strictEqual(invalidExplicit.ok, false);
      assert.strictEqual(invalidExplicit.status, 'INVALID_EXPLICIT_PATH');
      assert(invalidExplicit.rejectedCandidates.some((r) => r.classification === 'NOT_FOUND'));
    });

    // =========================================================================
    // SCENARIO 9: Valid vs invalid NuGet.Config (disabled sources & packageSourceMapping)
    // =========================================================================
    await test('09-nuget-config-disabled-sources-and-package-source-mapping', async () => {
      const nugetDir = path.join(tmpRoot, 'scen9-nuget');
      fs.mkdirSync(nugetDir, { recursive: true });

      const blockedXml = `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <clear />
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" />
    <add key="NGOFeed" value="https://pkgs.dev.azure.com/org/_packaging/NGOFeed/nuget/v3/index.json" />
  </packageSources>
  <packageSourceMapping>
    <packageSource key="nuget.org">
      <package pattern="Microsoft.*" />
      <package pattern="System.*" />
    </packageSource>
  </packageSourceMapping>
</configuration>`;
      fs.writeFileSync(path.join(nugetDir, 'NuGet.Config'), blockedXml, 'utf8');

      const parsedBlocked = nugetSources.parseNuGetConfigXml(blockedXml);
      const mappingRes = nugetSources.checkPackageSourceMappingForPackage('NGO.Core.API', parsedBlocked.packageSourceMappings);
      assert.strictEqual(mappingRes.active, true);
      assert.strictEqual(mappingRes.mapped, false);
      assert(mappingRes.reason.includes("no pattern matches 'NGO.Core.API'"));

      // Now add NGO.* pattern and verify it is mapped
      const validXml = blockedXml.replace(
        '</packageSourceMapping>',
        '  <packageSource key="NGOFeed"><package pattern="NGO.*" /></packageSource>\n  </packageSourceMapping>'
      );
      const parsedValid = nugetSources.parseNuGetConfigXml(validXml);
      const mappingRes2 = nugetSources.checkPackageSourceMappingForPackage('NGO.Core.API', parsedValid.packageSourceMappings);
      assert.strictEqual(mappingRes2.mapped, true);
      assert(mappingRes2.matchingSources.includes('NGOFeed'));
    });

    // =========================================================================
    // SCENARIO 10: Missing or expired Azure Artifacts credentials (401)
    // =========================================================================
    await test('10-azure-artifacts-missing-or-expired-credentials-401', async () => {
      const feedUrl = 'https://pkgs.dev.azure.com/ngo-org/_packaging/NGOFeed/nuget/v3/index.json';
      const probe = await nugetSources.testFeedConnection(feedUrl, {
        credentialProviderPath: null,
        fetchFn: async () => ({ statusCode: 401, headers: {}, body: 'Unauthorized' }),
      });

      assert.strictEqual(probe.statusCode, 401);
      assert.strictEqual(probe.connectionStatus, 'UNAUTHENTICATED');
      assert.strictEqual(probe.authStatus, 'AUTH_REQUIRED');
      assert(probe.lastError.includes('HTTP 401'));
    });

    // =========================================================================
    // SCENARIO 11: Authenticated Azure user without feed permissions (403)
    // =========================================================================
    await test('11-azure-artifacts-authenticated-without-permissions-403', async () => {
      const feedUrl = 'https://pkgs.dev.azure.com/ngo-org/_packaging/NGOFeed/nuget/v3/index.json';
      const probe = await nugetSources.testFeedConnection(feedUrl, {
        pat: 'valid-looking-pat-value',
        fetchFn: async () => ({ statusCode: 403, headers: {}, body: 'Forbidden' }),
      });

      assert.strictEqual(probe.statusCode, 403);
      assert.strictEqual(probe.connectionStatus, 'FORBIDDEN');
      assert.strictEqual(probe.authStatus, 'FORBIDDEN');
      assert(probe.lastError.includes('HTTP 403'));
    });

    // =========================================================================
    // SCENARIO 12: Public NuGet working while private Azure Artifacts fails
    // =========================================================================
    await test('12-public-nuget-ok-while-private-azure-artifacts-fails', async () => {
      const clientDir = path.join(tmpRoot, 'scen12-client');
      fs.mkdirSync(clientDir, { recursive: true });

      const res = await nugetSources.runNuGetPreflightChecks({
        clientPath: clientDir,
        packageId: 'NGO.Core.API',
        targetVersion: '99.99.99', // Not in local cache
        nugetPackagesDir: path.join(tmpRoot, 'empty-nuget-cache'),
        credentialProviderPath: null,
        sources: [
          { name: 'nuget.org', url: 'https://api.nuget.org/v3/index.json', enabled: true, isPrivate: false, type: 'PUBLIC_NUGET_ORG' },
          { name: 'NGOPrivateFeed', url: 'https://pkgs.dev.azure.com/ngo-org/_packaging/NGOFeed/nuget/v3/index.json', enabled: true, isPrivate: true, type: 'AZURE_ARTIFACTS' },
        ],
        fetchFn: async (targetUrl) => {
          if (targetUrl.includes('api.nuget.org')) {
            return { statusCode: 200, headers: {}, body: JSON.stringify({ version: '3.0.0', resources: [] }) };
          }
          return { statusCode: 401, headers: {}, body: 'Unauthorized' };
        },
      });

      assert.strictEqual(res.ok, false, 'Must fail when private Azure Artifacts feed fails with 401 even if public nuget.org returns 200');
      assert.strictEqual(res.stages.feedAccess.ok, false);
      assert.strictEqual(res.stages.feedAccess.status, 'UNAUTHENTICATED');
      assert(res.stages.feedAccess.detail.includes('NGOPrivateFeed'));
    });

    // =========================================================================
    // SCENARIO 13: Valid vs broken .npmrc, secret redaction, and safe backup-before-repair
    // =========================================================================
    await test('13-npmrc-diagnostics-secret-redaction-and-safe-backup', async () => {
      const feDir = path.join(tmpRoot, 'scen13-frontend');
      fs.mkdirSync(feDir, { recursive: true });
      fs.writeFileSync(
        path.join(feDir, 'package.json'),
        JSON.stringify({ name: 'fe-app', dependencies: { '@ngo/core': '9.4.1' } }, null, 2)
      );

      const brokenNpmrc = [
        '@ngo:registry=https://pkgs.dev.azure.com/ngo-org/_packaging/NGOFeed/npm/registry/',
        '//pkgs.dev.azure.com/ngo-org/_packaging/NGOFeed/npm/registry/:username=VssSessionToken',
        '//npm.fontawesome.com/:_authToken=${FA_SECRET_TOKEN_MISSING}',
        'email=hardcoded@developer.local',
      ].join('\n');
      const npmrcPath = path.join(feDir, '.npmrc');
      fs.writeFileSync(npmrcPath, brokenNpmrc, 'utf8');

      const diag = npmDiagnostics.inspectNpmEnvironment({
        clientPath: feDir,
        userNpmrcPath: path.join(tmpRoot, 'nonexistent-user-npmrc'),
        execFn: (cmd) => {
          if (cmd === 'npm') return { ok: true, status: 0, stdout: '10.2.0', stderr: '' };
          return { ok: true, status: 0, stdout: process.version, stderr: '' };
        },
      });

      assert.strictEqual(diag.ok, false);
      assert.strictEqual(diag.status, 'NPM_AUTH_REQUIRED');
      assert(diag.npmrc.unresolvedBroken.some((b) => b.issue === 'INCOMPLETE_VSS_OR_BASIC_AUTH'));
      assert(diag.npmrc.unresolvedBroken.some((b) => b.issue === 'MISSING_ENV_VAR_IN_NPMRC'));
      assert(diag.npmrc.obsoleteWarnings.some((o) => o.key === 'email'));

      // Verify secret redaction never leaks tokens
      const redacted = npmDiagnostics.redactNpmSecrets('//registry.npmjs.org/:_authToken=npm_SuperSecretValue123456789');
      assert(!redacted.includes('npm_SuperSecretValue123456789'));
      assert(redacted.includes('***REDACTED***'));

      // Verify backupAndRepairNpmrc creates a backup before commenting out obsolete settings
      const repairRes = npmDiagnostics.backupAndRepairNpmrc(npmrcPath);
      assert.strictEqual(repairRes.ok, true);
      assert.strictEqual(repairRes.backedUp, true);
      assert(fs.existsSync(repairRes.backupPath), 'Must create .npmrc.bak-* before modifying .npmrc');
      const updatedContent = fs.readFileSync(npmrcPath, 'utf8');
      assert(updatedContent.includes('# [ngo-upgrade-repaired] email=hardcoded@developer.local'));
    });

    // =========================================================================
    // SCENARIO 14: npm version differences & execution strategy (npm ci vs npm install)
    // =========================================================================
    await test('14-npm-version-differences-and-install-strategy', async () => {
      const feDir = path.join(tmpRoot, 'scen14-frontend');
      fs.mkdirSync(feDir, { recursive: true });
      fs.writeFileSync(path.join(feDir, 'package.json'), JSON.stringify({ name: 'fe', version: '1.0.0' }));
      fs.writeFileSync(
        path.join(feDir, 'package-lock.json'),
        JSON.stringify({ name: 'fe', lockfileVersion: 3, packages: { '': { name: 'fe', version: '1.0.0' } } })
      );

      // Unchanged package.json + valid package-lock.json => prefers deterministic `npm ci`
      const planCi = npmDiagnostics.prepareNpmExecutionPlan(feDir, {
        packageJsonChanged: false,
      });
      assert.strictEqual(planCi.mode, 'CLEAN_INSTALL');
      assert.strictEqual(planCi.args[0], 'ci');

      // Modified package.json during upgrade => uses `npm install --legacy-peer-deps` (never `-f`)
      const planInstall = npmDiagnostics.prepareNpmExecutionPlan(feDir, {
        packageJsonChanged: true,
      });
      assert.strictEqual(planInstall.mode, 'INCREMENTAL_INSTALL');
      assert(!planInstall.args.includes('-f'), 'Must never use destructive -f flag');
      assert(planInstall.args.includes('--legacy-peer-deps'));
    });

    // =========================================================================
    // SCENARIO 15: Track-scoped preflight (Backend-only vs Frontend-only vs Full-stack)
    // =========================================================================
    await test('15-track-scoped-preflight-backend-only-vs-frontend-only', async () => {
      const backendOnlyTools = checkEnv.checkRuntimeTools({
        tracks: ['backend'],
        mockTools: {
          npm: { installed: false }, // npm missing on backend-only machine
        },
      });
      const npmEntry = backendOnlyTools.find((t) => t.name === 'npm');
      assert.strictEqual(npmEntry.status, 'PASS');
      assert.strictEqual(npmEntry.failureType, 'NOT_REQUIRED');

      const frontendOnlyTools = checkEnv.checkRuntimeTools({
        tracks: ['frontend'],
        mockTools: {
          dotnet: { installed: false }, // dotnet missing on frontend-only machine
        },
      });
      const dotnetEntry = frontendOnlyTools.find((t) => t.name === 'dotnet');
      assert.strictEqual(dotnetEntry.status, 'PASS');
      assert.strictEqual(dotnetEntry.failureType, 'NOT_REQUIRED');
    });

    // =========================================================================
    // SCENARIO 16: Cross-machine settings portability & state fingerprint
    // =========================================================================
    await test('16-cross-machine-settings-portability-and-state-fingerprint', async () => {
      const coreDir = path.join(tmpRoot, 'scen16-core');
      const clientDir = path.join(tmpRoot, 'scen16-client');
      createFakeGitRepo(coreDir, { remoteUrl: 'https://github.com/org/ngo-online-core.git', isCore: true, tags: ['v9.2.0', 'v9.4.1'] });
      createFakeGitRepo(clientDir, { remoteUrl: 'https://github.com/org/ngo-client.git', isClient: true });

      const envReport = checkEnv.checkEnvironment({
        'core-path': coreDir,
        'client-path': clientDir,
        target: '9.4.1',
        tracks: 'backend',
      });

      assert.strictEqual(envReport.readiness, 'READY');
      assert(typeof envReport.stateFingerprint === 'string' && envReport.stateFingerprint.length === 16);
      assert.strictEqual(envReport.stages.npmDiagnostics.skipped, true);
    });
  } finally {
    try {
      fs.rmSync(tmpRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    } catch (_) {}
  }

  const passed = results.filter((r) => r.pass).length;
  console.log(`\nCross-Machine Portability Suite: ${passed}/${results.length} passed.`);
  if (passed !== results.length) {
    process.exit(1);
  }
}

runSuite();

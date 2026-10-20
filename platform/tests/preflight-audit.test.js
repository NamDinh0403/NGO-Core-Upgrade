'use strict';
/*
 * Comprehensive Preflight Truthfulness, Semantics, and Safety Audit Test Suite.
 *
 * Verifies that all Preflight Impact Preview metrics and statuses are backed by
 * actual evidence, cannot produce false positives, enforce safety gates on dirty
 * working trees, compute real evidence completeness, and generate traceable plans.
 *
 * Dependency-free, Node 14+.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const assert = require('assert');

const preflightLib = require('../preflight');
const resolver = require('../../ingest/tools/lib/release-resolver');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

const results = [];
function test(id, fn) {
  try {
    fn();
    results.push({ id, pass: true });
    console.log(`  PASS  ${id}`);
  } catch (e) {
    results.push({ id, pass: false, error: e.stack || e.message });
    console.log(`  FAIL  ${id}: ${e.message}`);
  }
}

async function testAsync(id, fn) {
  try {
    await fn();
    results.push({ id, pass: true });
    console.log(`  PASS  ${id}`);
  } catch (e) {
    results.push({ id, pass: false, error: e.stack || e.message });
    console.log(`  FAIL  ${id}: ${e.message}`);
  }
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'preflight-audit-'));
const tmpClient = path.join(tmpRoot, 'client-fixture');
const tmpCore = path.join(tmpRoot, 'core-fixture');

function sh(cmd, cwd) { cp.execSync(cmd, { cwd, stdio: 'pipe' }); }

async function runAuditSuite() {
  try {
    // 1. Initialize temporary Core git repo
    fs.mkdirSync(tmpCore, { recursive: true });
    sh('git init -q', tmpCore);
    sh('git config user.email test@ngo.local', tmpCore);
    sh('git config user.name "NGO Test"', tmpCore);

    // v9.2.0 commit & tag
    fs.writeFileSync(path.join(tmpCore, 'package.json'), JSON.stringify({ name: 'ngo-core', version: '9.2.0' }));
    sh('git add -A', tmpCore);
    sh('git commit -q -m "v9.2.0"', tmpCore);
    sh('git tag v9.2.0', tmpCore);

    // v9.3.0 commit & tag
    fs.writeFileSync(path.join(tmpCore, 'package.json'), JSON.stringify({ name: 'ngo-core', version: '9.3.0' }));
    sh('git add -A', tmpCore);
    sh('git commit -q -m "v9.3.0"', tmpCore);
    sh('git tag v9.3.0', tmpCore);

    // 2. Initialize temporary Client repo
    fs.mkdirSync(path.join(tmpClient, 'ngo-api'), { recursive: true });
    fs.mkdirSync(path.join(tmpClient, 'ngo-client'), { recursive: true });
    sh('git init -q', tmpClient);
    sh('git config user.email test@ngo.local', tmpClient);
    sh('git config user.name "NGO Test"', tmpClient);

    const csprojContent = `<Project Sdk="Microsoft.NET.Sdk">\n  <ItemGroup>\n    <PackageReference Include="NGO.Core" Version="9.2.0" />\n  </ItemGroup>\n</Project>`;
    fs.writeFileSync(path.join(tmpClient, 'ngo-api', 'Sample.csproj'), csprojContent);

    const pkgJsonContent = JSON.stringify({
      name: 'client-app',
      dependencies: { '@ngo/core': '9.2.0' },
    }, null, 2);
    fs.writeFileSync(path.join(tmpClient, 'ngo-client', 'package.json'), pkgJsonContent);

    sh('git add -A', tmpClient);
    sh('git commit -q -m "clean initial 9.2.0"', tmpClient);

    // -----------------------------------------------------------------------
    // TEST 1: Clean Working Tree + Verified Package => Preflight PASS
    // -----------------------------------------------------------------------
    test('01-clean-tree-and-verified-package-passes', () => {
      const res = preflightLib.runPreflight({
        clientPath: tmpClient,
        targetVersion: '9.3.0',
        corePath: tmpCore,
      });

      assert.strictEqual(res.ok, true, 'Clean tree with verified package must pass');
      assert.strictEqual(res.canProceed, true);
      assert.strictEqual(res.readyToUpgrade, true);
      assert.strictEqual(res.isBlocked, false);
      assert.strictEqual(res.blockers.length, 0);
      assert.strictEqual(res.isClean, true);
      assert.strictEqual(res.evidence.packageAvailable, true);
      assert.strictEqual(res.evidence.sourceRevisionAvailable, true);
      assert(res.completeness.percentage >= 70, 'Completeness should reflect verified evidence');
    });

    // -----------------------------------------------------------------------
    // TEST 2: Dirty Working Tree with Target Conflict => MUST BLOCK
    // -----------------------------------------------------------------------
    test('02-dirty-working-tree-with-target-conflict-blocks', () => {
      // Modify an upgrade target file without committing
      fs.appendFileSync(path.join(tmpClient, 'ngo-api', 'Sample.csproj'), '\n<!-- uncommitted edit -->');

      const res = preflightLib.runPreflight({
        clientPath: tmpClient,
        targetVersion: '9.3.0',
        corePath: tmpCore,
      });

      assert.strictEqual(res.ok, false, 'Preflight must fail when target file has uncommitted edits');
      assert.strictEqual(res.canProceed, false);
      assert.strictEqual(res.readyToUpgrade, false);
      assert.strictEqual(res.isBlocked, true);
      assert.strictEqual(res.safetyDecision, 'BLOCKED');
      assert.strictEqual(res.workingTree.conflictRisk, 'HIGH');
      assert(res.blockers.some((b) => b.includes('Sample.csproj')), 'Must mention the conflicting file');

      // Revert the edit
      sh('git checkout -- ngo-api/Sample.csproj', tmpClient);
    });

    // -----------------------------------------------------------------------
    // TEST 3: Target Equals Installed Version => MUST BLOCK (No-Op)
    // -----------------------------------------------------------------------
    test('03-target-equals-installed-version-blocks', () => {
      const res = preflightLib.runPreflight({
        clientPath: tmpClient,
        targetVersion: '9.2.0',
        corePath: tmpCore,
      });

      assert.strictEqual(res.ok, false, 'Same version upgrade must be blocked');
      assert.strictEqual(res.canProceed, false);
      assert.strictEqual(res.isBlocked, true);
      assert(res.blockers.some((b) => b.includes('already at target Core version 9.2.0')));
    });

    // -----------------------------------------------------------------------
    // TEST 4: Target Older than Installed (Downgrade) => MUST BLOCK
    // -----------------------------------------------------------------------
    test('04-downgrade-is-blocked-by-policy', () => {
      const res = preflightLib.runPreflight({
        clientPath: tmpClient,
        targetVersion: '9.1.0',
        corePath: tmpCore,
      });

      assert.strictEqual(res.ok, false, 'Downgrade must be blocked');
      assert.strictEqual(res.canProceed, false);
      assert.strictEqual(res.isBlocked, true);
      assert(res.blockers.some((b) => b.includes('older than current version') && b.includes('Downgrading is disallowed')));
    });

    // -----------------------------------------------------------------------
    // TEST 5: Invalid Semantic Version Format => MUST BLOCK
    // -----------------------------------------------------------------------
    test('05-invalid-semver-format-blocks', () => {
      const res = preflightLib.runPreflight({
        clientPath: tmpClient,
        targetVersion: 'not-a-version',
        corePath: tmpCore,
      });

      assert.strictEqual(res.ok, false, 'Invalid semver must be blocked');
      assert.strictEqual(res.safetyDecision, 'BLOCKED_INVALID_TARGET');
      assert(res.blockers.some((b) => b.includes('Invalid target version format')));
    });

    // -----------------------------------------------------------------------
    // TEST 6: Confirmed Missing Package => MUST BLOCK
    // -----------------------------------------------------------------------
    test('06-missing-package-binary-blocks', () => {
      const res = preflightLib.runPreflight({
        clientPath: tmpClient,
        targetVersion: '9.9.9',
        corePath: tmpCore,
      });

      assert.strictEqual(res.ok, false, 'Missing package must block');
      assert.strictEqual(res.canProceed, false);
      assert.strictEqual(res.isBlocked, true);
      assert.strictEqual(res.evidence.packageAvailable, false);
      assert.strictEqual(res.evidence.packageFound, false);
      assert(res.blockers.some((b) => b.includes('unavailable') || b.includes('not published')));
    });

    // -----------------------------------------------------------------------
    // TEST 7: Registry Check Timeout / Network Failure Distinction
    // -----------------------------------------------------------------------
    test('07-registry-failure-distinguished-from-not-found', () => {
      const checkRes = resolver.discoverPackageEvidence('9.5.0', {
        registryError: 'ETIMEDOUT: Connection to nuget.org timed out after 10000ms',
      });

      assert.strictEqual(checkRes.available, false);
      assert.strictEqual(checkRes.status, 'CHECK_FAILED');
      assert.strictEqual(checkRes.failureType, 'NETWORK_OR_TIMEOUT');
      assert(checkRes.reason.includes('ETIMEDOUT'));
    });

    // -----------------------------------------------------------------------
    // TEST 8: Package-First Resolution Without Releases Branch
    // -----------------------------------------------------------------------
    test('08-package-first-resolution-proceeds-without-releases-branch', () => {
      // In tmpCore, v9.3.0 has a tag and package.json, but NO releases/9.3 branch exists
      const res = preflightLib.runPreflight({
        clientPath: tmpClient,
        targetVersion: '9.3.0',
        corePath: tmpCore,
      });

      assert.strictEqual(res.ok, true, 'Package-first release without releases branch must succeed');
      assert.strictEqual(res.canProceed, true);
      assert.strictEqual(res.resolutionMode, 'PACKAGE_FIRST');
    });

    // -----------------------------------------------------------------------
    // TEST 9: Honest Evidence Completeness Metric
    // -----------------------------------------------------------------------
    test('09-evidence-completeness-calculation', () => {
      const res = preflightLib.runPreflight({
        clientPath: tmpClient,
        targetVersion: '9.3.0',
        corePath: tmpCore,
      });

      const comp = res.completeness;
      assert(comp !== undefined);
      assert(typeof comp.numerator === 'number');
      assert(typeof comp.denominator === 'number');
      assert(comp.denominator > 0);
      assert.strictEqual(comp.summary, `${comp.numerator}/${comp.denominator} (${comp.percentage}%)`);

      // In tmpCore without release notes or approved ref mapping, percentage must NOT be 100%
      assert(comp.percentage < 100, 'Must not claim 100% complete when release notes/mappings are absent');
      assert(comp.missingOptional.includes('Official Release Notes / Migration Cards'));
    });

    // -----------------------------------------------------------------------
    // TEST 10: Traceable Upgrade Plan Derived from Client Files
    // -----------------------------------------------------------------------
    test('10-traceable-upgrade-plan-derived-from-client-files', () => {
      const res = preflightLib.runPreflight({
        clientPath: tmpClient,
        targetVersion: '9.3.0',
        corePath: tmpCore,
        tracks: ['backend', 'frontend'],
      });

      assert(Array.isArray(res.tasks));
      assert(res.tasks.length >= 2, 'Must generate plan tasks');

      const backendTask = res.tasks.find((t) => t.track === 'backend');
      assert(backendTask !== undefined, 'Must generate backend task');
      assert(backendTask.file.includes('Sample.csproj'), 'Must point to actual .csproj file');
      assert.strictEqual(backendTask.currentValue, '9.2.0');
      assert.strictEqual(backendTask.targetValue, '9.3.0');
      assert.strictEqual(backendTask.isDerivedFromEvidence, true);

      const frontendTask = res.tasks.find((t) => t.track === 'frontend');
      assert(frontendTask !== undefined, 'Must generate frontend task');
      assert(frontendTask.file.includes('package.json'), 'Must point to actual package.json file');
      assert.strictEqual(frontendTask.currentValue, '9.2.0');
      assert.strictEqual(frontendTask.targetValue, '9.3.0');
      assert.strictEqual(frontendTask.isDerivedFromEvidence, true);
    });

    // -----------------------------------------------------------------------
    // TEST 11: Evidence Inspector Matrix Integrity
    // -----------------------------------------------------------------------
    test('11-evidence-inspector-matrix-integrity', () => {
      const res = preflightLib.runPreflight({
        clientPath: tmpClient,
        targetVersion: '9.3.0',
        corePath: tmpCore,
      });

      assert(Array.isArray(res.checks));
      assert(res.checks.length >= 4, 'Must evaluate multiple structured checks');

      for (const chk of res.checks) {
        assert(typeof chk.id === 'string' && chk.id.startsWith('CHK-'));
        assert(typeof chk.name === 'string');
        assert(['PASS', 'FAIL', 'WARNING', 'BLOCKED', 'INFO'].includes(chk.status));
        assert(typeof chk.durationMs === 'number');
        assert(typeof chk.sourceOrCommand === 'string');
        assert(chk.freshness !== undefined);

        // Security assertion: check outputs must never leak secrets
        const serialized = JSON.stringify(chk);
        assert(!serialized.includes('ghp_'));
        assert(!serialized.includes('Bearer '));
      }
    });

    // -----------------------------------------------------------------------
    // TEST 12: Real Client (ShelterBox) Audit Execution in Read-Only Mode
    // -----------------------------------------------------------------------
    test('12-real-client-read-only-preflight-audit', () => {
      const realClient = path.join(path.resolve(REPO_ROOT, '..'), 'ngo-online-shelterbox');
      if (fs.existsSync(realClient)) {
        const res = preflightLib.runPreflight({
          clientPath: realClient,
          targetVersion: '9.4.0',
        });

        // ShelterBox has uncommitted changes in NGO.API.csproj
        // Preflight MUST truthfully report blocked and explain why
        assert.strictEqual(res.ok, false, 'Dirty real client with target edits must be blocked');
        assert.strictEqual(res.canProceed, false);
        assert.strictEqual(res.isBlocked, true);
        assert(res.blockers.some((b) => b.includes('NGO.API.csproj')));

        // But package 9.4.0 in NuGet cache MUST be recognized as available
        assert.strictEqual(res.evidence.packageAvailable, true);
        assert.strictEqual(res.evidence.packageSource, 'nuget-cache');
        assert(res.evidence.packageIdentity.includes('9.4.0'));

        // Completeness must reflect real numerator/denominator
        assert.strictEqual(res.completeness.missingRequired.includes('Client Working Tree Cleanliness'), true);
      }
    });

    // -----------------------------------------------------------------------
    // TEST 13: Core Version Discovery - Rule 1 & Rule 3 (Commit Ahead Derives Patch + 1)
    // -----------------------------------------------------------------------
    test('13-core-discovery-rule3-commit-ahead-derives-next-patch', () => {
      // Create releases/8.2 branch with 8.2.3 commit and 2 newer commits on top
      sh('git checkout -q -b releases/8.2', tmpCore);
      fs.writeFileSync(path.join(tmpCore, 'file1.txt'), '8.2.3 base');
      sh('git add -A', tmpCore);
      sh('git commit -q -m "Merged PR 35522: 8.2.3"', tmpCore);

      fs.writeFileSync(path.join(tmpCore, 'file2.txt'), '8.2.4 commit 1');
      sh('git add -A', tmpCore);
      sh('git commit -q -m "Merged PR 38945: fix error"', tmpCore);

      fs.writeFileSync(path.join(tmpCore, 'file3.txt'), '8.2.4 commit 2');
      sh('git add -A', tmpCore);
      sh('git commit -q -m "Merged PR 38947: Use ParentWebUrl"', tmpCore);

      // Return to master
      sh('git checkout -q master', tmpCore);

      const disc = resolver.discoverCoreBranchReleases(tmpCore, { bypassCache: true });
      assert.strictEqual(disc.ok, true);
      assert(disc.versions.includes('8.2.3'), 'Must discover base patch 8.2.3');
      assert(disc.versions.includes('8.2.4'), 'Must derive next patch 8.2.4 due to commits ahead');

      const meta82 = disc.branchMetadata['8.2'];
      assert(meta82 !== undefined, 'Must contain 8.2 branch metadata');
      assert.strictEqual(meta82.nextPatchDerived.baseVersion, '8.2.3');
      assert.strictEqual(meta82.nextPatchDerived.nextPatchVersion, '8.2.4');
      assert.strictEqual(meta82.nextPatchDerived.commitsAhead, 2);
    });

    // -----------------------------------------------------------------------
    // TEST 14: Core Version Discovery - Rule 2 (Beta Branch Marks Latest Major Release)
    // -----------------------------------------------------------------------
    test('14-core-discovery-rule2-beta-marks-latest-major', () => {
      // Create releases/10.0.0-beta.1 branch where major 10 has only beta branch
      sh('git checkout -q -b releases/10.0.0-beta.1', tmpCore);
      fs.writeFileSync(path.join(tmpCore, 'beta10.txt'), '10.0 beta');
      sh('git add -A', tmpCore);
      sh('git commit -q -m "Merged PR 40000: 10.0.0-beta.1 initial"', tmpCore);

      // Return to master
      sh('git checkout -q master', tmpCore);

      const disc = resolver.discoverCoreBranchReleases(tmpCore, { bypassCache: true });
      assert.strictEqual(disc.ok, true);
      assert(disc.latestMajorBeta !== null, 'Must identify latest major beta');
      assert.strictEqual(disc.latestMajorBeta.major, 10, 'Latest major beta must be major 10');
      assert.strictEqual(disc.latestMajorBeta.isLatestMajor, true, 'Major 10 beta must be marked latest major');
      assert(disc.versions.includes('10.0.0-beta.1'), 'Must include 10.0.0-beta.1 in discovered versions');
    });

    // -----------------------------------------------------------------------
    // TEST 15: Source Revision Resolves Derived Next-Patch to Branch Head
    // -----------------------------------------------------------------------
    test('15-source-revision-resolves-derived-patch-to-branch-head', () => {
      const src = resolver.discoverSourceEvidence(tmpCore, '8.2.4');
      assert.strictEqual(src.sourceRevisionAvailable, true);
      assert.strictEqual(src.branch.name, 'releases/8.2');
      assert(src.targetCommit !== null);
    });

  } finally {
    // Clean up temporary fixtures safely on Windows
    try {
      fs.rmSync(tmpRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    } catch (_) {}
  }

  // Summary
  const passed = results.filter((r) => r.pass).length;
  console.log(`\nPreflight Truthfulness Audit Matrix: ${passed}/${results.length} passed.`);
  if (passed !== results.length) {
    process.exit(1);
  }
}

runAuditSuite();

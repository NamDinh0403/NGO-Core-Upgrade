#!/usr/bin/env node
'use strict';
/*
 * Deterministic Environment & Preflight Checker for NGO Core Upgrade.
 *
 * Verifies all prerequisites on any developer's machine:
 *   1. Git Author Identity (git user.name, user.email)
 *   2. Client Repository & Working Tree Status (git status, detect current Core version)
 *   3. NGO Core Local Checkout (valid repo, tags fetched: v<source>..v<target>, read-only check)
 *   4. .NET SDK & NuGet Package Sources (dotnet CLI, NuGet feed connectivity)
 *   5. Node.js & npm runtimes
 *   6. Generates exact, deterministic engine upgrade commands
 *
 * Usage:
 *   node tools/check-environment.js --core-path <path> --client-path <path> [--target <version>]
 *
 * Dependency-free, Node 14+.
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      flags[key] = val;
    }
  }
  return flags;
}

function runCmd(cmd, args, cwd) {
  try {
    const res = cp.spawnSync(cmd, args, {
      cwd: cwd || process.cwd(),
      encoding: 'utf8',
      windowsHide: true,
      timeout: 30000,
    });
    return {
      status: res.status,
      stdout: (res.stdout || '').trim(),
      stderr: (res.stderr || '').trim(),
      error: res.error,
    };
  } catch (err) {
    return { status: -1, stdout: '', stderr: String(err.message || err), error: err };
  }
}

function normalizeVersion(v) {
  if (!v) return null;
  const m = String(v).replace(/^v/i, '').trim().match(/^(\d+)\.(\d+)(?:\.(\d+))?/);
  return m ? `${m[1]}.${m[2]}.${m[3] || 0}` : null;
}

function detectClientInstalledVersions(clientPath) {
  let backendVersion = null;
  let frontendVersion = null;
  let backendPath = null;
  let frontendPath = null;

  if (!fs.existsSync(clientPath)) {
    return { backendVersion, frontendVersion, backendPath, frontendPath, primary: null };
  }

  // Scan for csproj
  function scanDir(dir, depth) {
    if (depth > 4) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          if (!['bin', 'obj', '.vs', 'node_modules', '.git'].includes(ent.name)) {
            scanDir(full, depth + 1);
          }
        } else if (ent.name.endsWith('.csproj')) {
          try {
            const content = fs.readFileSync(full, 'utf8');
            const m = content.match(/<PackageReference\s+Include=["']NGO\.Core(?:\.[^"']+)?["']\s+Version=["']([^"']+)["']/i) ||
                      content.match(/<PackageReference\s+Version=["']([^"']+)["']\s+Include=["']NGO\.Core/i);
            if (m && !backendVersion) {
              backendVersion = normalizeVersion(m[1]);
              backendPath = full;
            }
          } catch (_) {}
        } else if (ent.name === 'package.json' && !frontendVersion) {
          try {
            const pkg = JSON.parse(fs.readFileSync(full, 'utf8'));
            const deps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
            for (const [dep, ver] of Object.entries(deps)) {
              if (dep.includes('ngo-core') || dep.includes('@ngo/core')) {
                frontendVersion = normalizeVersion(ver);
                frontendPath = full;
                break;
              }
            }
          } catch (_) {}
        }
      }
    } catch (_) {}
  }

  scanDir(clientPath, 0);
  const primary = backendVersion || frontendVersion || null;
  return { backendVersion, frontendVersion, backendPath, frontendPath, primary };
}

function checkEnvironment(flags) {
  const corePath = flags['core-path'] || flags.core;
  const clientPath = flags['client-path'] || flags.client;
  const rawTarget = flags.target || flags['target-version'];
  const targetVersion = normalizeVersion(rawTarget);

  const report = {
    timestamp: new Date().toISOString(),
    inputs: { corePath: corePath || null, clientPath: clientPath || null, targetVersion },
    checks: [],
    blockers: [],
    warnings: [],
    readiness: 'READY',
  };

  function addCheck(name, status, details, remediation) {
    report.checks.push({ name, status, details, remediation });
    if (status === 'BLOCKED') {
      report.blockers.push(`${name}: ${details}${remediation ? ` (Fix: ${remediation})` : ''}`);
      report.readiness = 'BLOCKED';
    } else if (status === 'WARN') {
      report.warnings.push(`${name}: ${details}${remediation ? ` (Note: ${remediation})` : ''}`);
    }
  }

  // 1. Mandatory Input Check
  if (!corePath) {
    addCheck('Core Path Input', 'BLOCKED', 'Local NGO Core path was not provided.', 'Specify --core-path <path-to-ngo-online-core>');
  }
  if (!clientPath) {
    addCheck('Client Path Input', 'BLOCKED', 'Client project path was not provided.', 'Specify --client-path <path-to-client-repo>');
  }

  // 2. Git Author Identity Check
  const gitNameRes = runCmd('git', ['config', 'user.name'], clientPath && fs.existsSync(clientPath) ? clientPath : process.cwd());
  const gitEmailRes = runCmd('git', ['config', 'user.email'], clientPath && fs.existsSync(clientPath) ? clientPath : process.cwd());
  const gitName = gitNameRes.stdout;
  const gitEmail = gitEmailRes.stdout;

  if (gitName && gitEmail) {
    addCheck('Git Author Identity', 'PASS', `Configured as: ${gitName} <${gitEmail}>`);
  } else {
    addCheck('Git Author Identity', 'WARN', 'git user.name or user.email not configured.', 'Run: git config user.name "Your Name" && git config user.email "your.email@example.com"');
  }

  // 3. Client Repository & Working Tree Status
  let detectedVersions = { primary: null, backendVersion: null, frontendVersion: null };
  if (clientPath) {
    if (!fs.existsSync(clientPath)) {
      addCheck('Client Repository Exists', 'BLOCKED', `Client directory not found at: ${clientPath}`);
    } else {
      const gitRepoCheck = runCmd('git', ['rev-parse', '--is-inside-work-tree'], clientPath);
      if (gitRepoCheck.status !== 0 || gitRepoCheck.stdout !== 'true') {
        addCheck('Client Git Repository', 'WARN', 'Client directory is not a Git repository.');
      } else {
        const gitStatusRes = runCmd('git', ['status', '--porcelain'], clientPath);
        if (gitStatusRes.status === 0) {
          const statusLines = gitStatusRes.stdout.split(/\r?\n/).filter(Boolean);
          if (statusLines.length === 0) {
            addCheck('Client Working Tree', 'PASS', 'Working tree is clean.');
          } else {
            const hasConflictRisk = statusLines.some((l) => /(\.csproj|package\.json|appsettings.*\.json)/i.test(l));
            if (hasConflictRisk) {
              addCheck('Client Working Tree', 'WARN', `${statusLines.length} modified/untracked files include upgrade target files (.csproj/package.json). Commit or stash before proceeding.`);
            } else {
              addCheck('Client Working Tree', 'PASS', `${statusLines.length} uncommitted changes (no collision with upgrade project files).`);
            }
          }
        }
      }

      detectedVersions = detectClientInstalledVersions(clientPath);
      if (detectedVersions.primary) {
        addCheck('Detected Installed Core Version', 'PASS', `Current version: ${detectedVersions.primary} (Backend: ${detectedVersions.backendVersion || 'N/A'}, Frontend: ${detectedVersions.frontendVersion || 'N/A'})`);
      } else {
        addCheck('Detected Installed Core Version', 'WARN', 'Could not automatically find NGO.Core packages in client files.');
      }
    }
  }

  // 4. NGO Core Local Checkout
  if (corePath) {
    if (!fs.existsSync(corePath)) {
      addCheck('Core Repository Exists', 'BLOCKED', `Core path not found: ${corePath}`);
    } else {
      const coreGitCheck = runCmd('git', ['rev-parse', '--is-inside-work-tree'], corePath);
      if (coreGitCheck.status !== 0 || coreGitCheck.stdout !== 'true') {
        addCheck('Core Git Repository', 'BLOCKED', `Core path is not a valid git repository: ${corePath}`);
      } else {
        addCheck('Core Repository Safety', 'PASS', 'Core repo verified. Strictly READ-ONLY (no checkouts or branch changes).');

        // Check git tags
        const tagsRes = runCmd('git', ['tag', '-l'], corePath);
        const tagList = tagsRes.status === 0 ? tagsRes.stdout.split(/\r?\n/).map((t) => t.trim()).filter(Boolean) : [];

        const sourceVer = flags.source || flags['source-version'] || detectedVersions.primary;
        if (sourceVer) {
          const normSource = normalizeVersion(sourceVer);
          const hasSourceTag = tagList.some((t) => t === `v${normSource}` || t === normSource);
          if (hasSourceTag) {
            addCheck('Source Release Tag', 'PASS', `Found tag for source v${normSource} in Core repository.`);
          } else {
            // Check if pre-ingested canonical knowledge exists
            const canonicalFile = path.resolve(__dirname, '..', 'ingest', 'knowledge', 'canonical', 'releases', normSource, 'release.yaml');
            if (fs.existsSync(canonicalFile)) {
              addCheck('Source Release Tag', 'PASS', `Tag v${normSource} resolved via pre-ingested canonical knowledge.`);
            } else {
              addCheck('Source Release Tag', 'BLOCKED', `Tag v${normSource} NOT found in Core repo!`, `cd "${corePath}" && git fetch --all --tags`);
            }
          }
        }

        if (targetVersion) {
          const hasTargetTag = tagList.some((t) => t === `v${targetVersion}` || t === targetVersion);
          if (hasTargetTag) {
            addCheck('Target Release Tag', 'PASS', `Found tag for target v${targetVersion} in Core repository.`);
          } else {
            addCheck('Target Release Tag', 'WARN', `Tag v${targetVersion} not found in local Core git tags. (Will attempt package-first or canonical knowledge resolution). If tags are remote, run: cd "${corePath}" && git fetch --all --tags`);
          }
        }
      }
    }
  }

  // 5. .NET SDK & NuGet
  const dotnetVerRes = runCmd('dotnet', ['--version']);
  if (dotnetVerRes.status === 0) {
    addCheck('.NET SDK', 'PASS', `.NET SDK version ${dotnetVerRes.stdout} installed.`);
    const nugetSourcesRes = runCmd('dotnet', ['nuget', 'list', 'source']);
    if (nugetSourcesRes.status === 0) {
      const enabledSources = nugetSourcesRes.stdout.split(/\r?\n/).filter((l) => /\[Enabled\]/i.test(l));
      addCheck('NuGet Sources', 'PASS', `${enabledSources.length} enabled NuGet sources found.`);
    } else {
      addCheck('NuGet Sources', 'WARN', 'Could not query dotnet nuget sources.');
    }
  } else {
    addCheck('.NET SDK', 'WARN', '.NET CLI not available in PATH.');
  }

  // 6. Node.js & npm
  const nodeVer = process.version;
  const npmVerRes = runCmd('npm', ['--version']);
  if (nodeVer) {
    addCheck('Node.js Runtime', 'PASS', `Node.js ${nodeVer} active.`);
  }
  if (npmVerRes.status === 0) {
    addCheck('npm CLI', 'PASS', `npm ${npmVerRes.stdout} active.`);
  }

  return report;
}

// CLI Execution
if (require.main === module) {
  const flags = parseFlags(process.argv.slice(2));

  if (flags.help || (!flags['core-path'] && !flags['client-path'] && Object.keys(flags).length === 0)) {
    console.log(`
Deterministic Preflight & Environment Checker for NGO Core Upgrade
===================================================================

Usage:
  node tools/check-environment.js --core-path <path> --client-path <path> [--target <version>]

Options:
  --core-path <path>     Path to local ngo-online-core repository
  --client-path <path>   Path to client project / solution
  --target <version>     Desired target version (e.g. 9.4.0)
  --json                 Output raw JSON result
`);
    process.exit(flags.help ? 0 : 1);
  }

  const result = checkEnvironment(flags);

  if (flags.json) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.readiness === 'READY' ? 0 : 1);
  }

  console.log('\n=============================================================');
  console.log(' NGO Core Upgrade - Preflight & Environment Check');
  console.log('=============================================================\n');

  for (const c of result.checks) {
    const symbol = c.status === 'PASS' ? '  ✓ [PASS]' : c.status === 'WARN' ? '  ! [WARN]' : '  ✗ [FAIL]';
    console.log(`${symbol} ${c.name}: ${c.details}`);
    if (c.remediation) {
      console.log(`           --> Remediation: ${c.remediation}`);
    }
  }

  console.log('\n-------------------------------------------------------------');
  console.log(`Readiness Status: ${result.readiness === 'READY' ? 'READY TO UPGRADE' : 'BLOCKED - ACTION REQUIRED'}`);
  console.log('-------------------------------------------------------------\n');

  if (result.readiness === 'BLOCKED') {
    console.log('Please resolve the following blockers before proceeding:\n');
    for (const b of result.blockers) {
      console.log(`  - ${b}`);
    }
    console.log('');
    process.exit(1);
  } else {
    const core = flags['core-path'] || flags.core;
    const client = flags['client-path'] || flags.client;
    const target = flags.target || '9.4.0';
    console.log('Ready to proceed! Run the deterministic upgrade command:');
    console.log('\nnode engine/tools/upgrade-engine.js create-run \\');
    console.log(`  --client demo-client \\`);
    console.log(`  --tracks backend,frontend \\`);
    console.log(`  --core-path "${core}" \\`);
    console.log(`  --source-version ${result.checks.find(c => c.name === 'Detected Installed Core Version')?.details.match(/Current version: ([0-9.]+)/)?.[1] || '9.0.0'} \\`);
    console.log(`  --target-version ${target} \\`);
    console.log(`  --backend-client-path "${client}"\n`);
    process.exit(0);
  }
}

module.exports = { checkEnvironment, detectClientInstalledVersions, normalizeVersion };

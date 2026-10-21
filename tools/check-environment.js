#!/usr/bin/env node
'use strict';
/*
 * Deterministic Environment & Cross-Machine Preflight Checker for NGO Core Upgrade.
 *
 * Implements the 8-Stage Preflight Architecture:
 *   Stage 1: Runtime & Tool Availability (git, gh, node, dotnet, dotnet-ef, az, npm)
 *   Stage 2: GitHub & Git Remote Access (gh auth vs git credential.helper vs git ls-remote)
 *   Stage 3: Local NGO Core Repository Discovery & Validation (cross-machine discovery)
 *   Stage 4: NuGet / Azure Artifacts 5-Stage Configuration & Authentication
 *   Stage 5: npm & .npmrc Version-Aware Configuration & Authentication
 *   Stage 6: Target Client Project/Solution Validation & Working Tree Safety
 *   Stage 7: Upgrade Plan & Release Resolution Preconditions
 *   Stage 8: Controlled Execution Readiness Summary & Reusable State Fingerprint
 *
 * Usage:
 *   node tools/check-environment.js --core-path <path> --client-path <path> [--target <version>] [--tracks <backend,frontend>] [--json]
 *
 * Dependency-free, Node 14+.
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const coreDiscovery = require('../platform/core-discovery');
const githubAuth = require('../platform/github-auth');
const nugetSources = require('../platform/nuget-sources');
const npmDiagnostics = require('../platform/npm-diagnostics');
const preflight = require('../platform/preflight');
const settingsLib = require('../platform/settings');
const resolver = require('../ingest/tools/lib/release-resolver');

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

function runCmd(cmd, args, cwd, extraEnv) {
  try {
    const res = cp.spawnSync(cmd, args, {
      cwd: cwd || process.cwd(),
      encoding: 'utf8',
      windowsHide: true,
      timeout: 30000,
      shell: process.platform === 'win32' && /\.(cmd|bat)$/i.test(cmd),
      env: extraEnv ? Object.assign({}, process.env, extraEnv) : process.env,
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

  if (!clientPath || !fs.existsSync(clientPath)) {
    return { backendVersion, frontendVersion, backendPath, frontendPath, primary: null };
  }

  function scanDir(dir, depth) {
    if (depth > 4) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          if (!['bin', 'obj', '.vs', 'node_modules', '.git', 'dist', 'coverage'].includes(ent.name)) {
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

/**
 * Stage 1: Probe all runtime & tool dependencies with clear classification:
 *   PASS | WARN | BLOCKED
 *   failureType: TOOL_MISSING | TOOL_INCOMPATIBLE | NOT_REQUIRED
 */
function checkRuntimeTools(opts = {}) {
  const tracks = Array.isArray(opts.tracks) && opts.tracks.length > 0
    ? opts.tracks
    : ['backend', 'frontend'];
  const needBackend = tracks.includes('backend');
  const needFrontend = tracks.includes('frontend');
  const clientPath = opts.clientPath || null;
  const mockTools = opts.mockTools || null;

  const tools = [];

  function probeTool(name, bin, versionArgs, minMajor, required, trackScope) {
    if (mockTools && Object.prototype.hasOwnProperty.call(mockTools, name)) {
      const m = mockTools[name];
      tools.push({
        name,
        required,
        trackScope,
        installed: Boolean(m.installed),
        executablePath: m.executablePath || null,
        version: m.version || null,
        compatible: m.compatible !== undefined ? Boolean(m.compatible) : Boolean(m.installed),
        status: m.status || (m.installed ? (m.compatible === false ? 'BLOCKED' : 'PASS') : (required ? 'BLOCKED' : 'WARN')),
        failureType: m.failureType || (!m.installed ? 'TOOL_MISSING' : m.compatible === false ? 'TOOL_INCOMPATIBLE' : null),
        details: m.details || (m.installed ? `${name} ${m.version || ''} found` : `${name} is not installed`),
        remediation: m.remediation || null,
      });
      return;
    }

    const exePath = githubAuth.locateExecutable(bin);
    if (!exePath) {
      tools.push({
        name,
        required,
        trackScope,
        installed: false,
        executablePath: null,
        version: null,
        compatible: false,
        status: required ? 'BLOCKED' : 'WARN',
        failureType: required ? 'TOOL_MISSING' : 'OPTIONAL_TOOL_MISSING',
        details: `${name} (${bin}) was not found on PATH.`,
        remediation: getToolInstallRemediation(name),
      });
      return;
    }

    const verRes = runCmd(bin, versionArgs);
    const rawVer = (verRes.stdout || verRes.stderr || '').split(/\r?\n/)[0].trim();
    const verMatch = rawVer.match(/(\d+)\.(\d+)(?:\.(\d+))?/);
    const major = verMatch ? parseInt(verMatch[1], 10) : null;
    const compatible = verRes.status === 0 && (minMajor === null || (major !== null && major >= minMajor));

    tools.push({
      name,
      required,
      trackScope,
      installed: true,
      executablePath: exePath,
      version: verMatch ? verMatch[0] : rawVer,
      compatible,
      status: compatible ? 'PASS' : (required ? 'BLOCKED' : 'WARN'),
      failureType: compatible ? null : 'TOOL_INCOMPATIBLE',
      details: compatible
        ? `${name} ${verMatch ? verMatch[0] : rawVer} at ${exePath}`
        : `${name} version (${rawVer || 'unknown'}) is incompatible (requires >= ${minMajor}.x).`,
      remediation: compatible ? null : getToolInstallRemediation(name),
    });
  }

  // 1. Git (always required)
  probeTool('git', 'git', ['--version'], 2, true, 'all');

  // 2. Node.js (always required)
  const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
  tools.push({
    name: 'node',
    required: true,
    trackScope: 'all',
    installed: true,
    executablePath: process.execPath,
    version: process.versions.node,
    compatible: nodeMajor >= 14,
    status: nodeMajor >= 14 ? 'PASS' : 'BLOCKED',
    failureType: nodeMajor >= 14 ? null : 'TOOL_INCOMPATIBLE',
    details: `Node.js ${process.version} (${process.execPath})`,
    remediation: nodeMajor >= 14 ? null : 'Install Node.js LTS (>= 18.x recommended) from https://nodejs.org/',
  });

  // 3. GitHub CLI (optional for local-only, warning if missing)
  probeTool('gh', 'gh', ['--version'], 2, false, 'all');

  // 4. .NET SDK (required when backend track is active)
  if (needBackend) {
    probeTool('dotnet', 'dotnet', ['--version'], 6, true, 'backend');

    // Check if installed .NET SDK supports the client's TargetFramework
    const dotnetEntry = tools.find((t) => t.name === 'dotnet');
    if (dotnetEntry && dotnetEntry.installed && clientPath && fs.existsSync(clientPath)) {
      const reqTfm = preflight.detectRequiredTargetFramework(clientPath);
      if (reqTfm && reqTfm.major) {
        const sdkCheck = preflight.checkDotnetSdkForTarget(reqTfm.major);
        if (!sdkCheck.installed) {
          dotnetEntry.compatible = false;
          dotnetEntry.status = 'BLOCKED';
          dotnetEntry.failureType = 'TOOL_INCOMPATIBLE';
          dotnetEntry.details = `Client requires ${reqTfm.tfm} (.NET ${reqTfm.major}.0 SDK), but only [${sdkCheck.allSdks.join(', ')}] are installed.`;
          dotnetEntry.remediation = `winget install Microsoft.DotNet.SDK.${reqTfm.major}`;
        }
      }
    }

    // 5. Entity Framework CLI (probe only — non-blocking unless migration verification requested)
    if (!mockTools || !Object.prototype.hasOwnProperty.call(mockTools, 'dotnet-ef')) {
      const efRes = runCmd('dotnet', ['ef', '--version'], clientPath && fs.existsSync(clientPath) ? clientPath : process.cwd());
      const efInstalled = efRes.status === 0;
      const efVer = efInstalled ? (efRes.stdout.split(/\r?\n/).pop() || '').trim() : null;
      tools.push({
        name: 'dotnet-ef',
        required: false,
        trackScope: 'backend',
        installed: efInstalled,
        executablePath: efInstalled ? 'dotnet ef' : null,
        version: efVer,
        compatible: efInstalled,
        status: efInstalled ? 'PASS' : 'WARN',
        failureType: efInstalled ? null : 'OPTIONAL_TOOL_MISSING',
        details: efInstalled ? `Entity Framework CLI ${efVer} available` : 'dotnet-ef tool not installed (optional unless running EF migration checks).',
        remediation: efInstalled ? null : 'dotnet tool install --global dotnet-ef (or dotnet tool restore if using a local manifest)',
      });
    } else {
      probeTool('dotnet-ef', 'dotnet-ef', ['--version'], 6, false, 'backend');
    }

    // 6. Azure CLI (optional auth helper for Azure Artifacts)
    probeTool('az', process.platform === 'win32' ? 'az.cmd' : 'az', ['--version'], 2, false, 'backend');
  } else {
    tools.push({
      name: 'dotnet',
      required: false,
      trackScope: 'backend',
      installed: false,
      executablePath: null,
      version: null,
      compatible: true,
      status: 'PASS',
      failureType: 'NOT_REQUIRED',
      details: 'Skipped (.NET backend track is disabled).',
      remediation: null,
    });
  }

  // 7. npm (required ONLY when frontend track is active)
  if (needFrontend) {
    probeTool('npm', process.platform === 'win32' ? 'npm.cmd' : 'npm', ['--version'], 6, true, 'frontend');
  } else {
    tools.push({
      name: 'npm',
      required: false,
      trackScope: 'frontend',
      installed: false,
      executablePath: null,
      version: null,
      compatible: true,
      status: 'PASS',
      failureType: 'NOT_REQUIRED',
      details: 'Skipped (frontend track is disabled).',
      remediation: null,
    });
  }

  return tools;
}

function getToolInstallRemediation(toolName) {
  switch (toolName) {
    case 'git':
      return 'Install Git: winget install --id Git.Git -e --source winget';
    case 'gh':
      return 'Install GitHub CLI: winget install --id GitHub.cli -e --source winget';
    case 'dotnet':
      return 'Install .NET SDK: winget install Microsoft.DotNet.SDK.8';
    case 'dotnet-ef':
      return 'Install EF Core CLI: dotnet tool install --global dotnet-ef';
    case 'az':
      return 'Optional: Install Azure CLI: winget install Microsoft.AzureCLI';
    case 'npm':
    case 'node':
      return 'Install Node.js LTS (includes npm): winget install OpenJS.NodeJS.LTS';
    default:
      return `Install ${toolName} and ensure it is on your system PATH.`;
  }
}

/**
 * Synchronous environment check (preserves backward compatibility with CLI & sync callers)
 * while integrating Stage 1 (tools), Stage 2 (GitHub/Git), Stage 3 (Core Discovery),
 * Stage 4 (NuGet config & mapping), Stage 5 (npm/.npmrc), Stage 6 (Client working tree), and Stage 7 (Release evidence).
 */
function checkEnvironment(flags = {}) {
  const settings = settingsLib.loadSettings();
  const rawTracks = flags.tracks || 'backend,frontend';
  const tracks = Array.isArray(rawTracks)
    ? rawTracks
    : String(rawTracks).split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  const needBackend = tracks.includes('backend');
  const needFrontend = tracks.includes('frontend');

  const explicitCorePath = flags['core-path'] || flags.core || flags.corePath || null;
  const clientPath = flags['client-path'] || flags.client || flags.clientPath || null;
  const rawTarget = flags.target || flags['target-version'] || flags.targetVersion || null;

  // Stage 3: Cross-machine Core Repository Discovery
  const discoveryRes = coreDiscovery.discoverCoreRepository({
    corePath: explicitCorePath,
    envCorePath: process.env.NGO_CORE_PATH,
    settingsCorePath: settings.corePath,
    clientPath,
    approvedWorkspaceRoots: settings.approvedWorkspaceRoots,
    bypassCache: Boolean(flags.bypassCache),
  });
  const effectiveCorePath = (discoveryRes.selected && discoveryRes.selected.path) || explicitCorePath || null;

  const targetVersion = resolver.resolveLatestBranchVersion(rawTarget, effectiveCorePath) || normalizeVersion(rawTarget);

  const report = {
    timestamp: new Date().toISOString(),
    inputs: {
      corePath: effectiveCorePath,
      explicitCorePath,
      clientPath: clientPath || null,
      targetVersion,
      tracks,
    },
    stages: {},
    checks: [],
    blockers: [],
    warnings: [],
    readiness: 'READY',
    stateFingerprint: null,
  };

  function addCheck(name, status, details, remediation, extra = {}) {
    const entry = Object.assign({ name, status, details, remediation: remediation || null }, extra);
    report.checks.push(entry);
    if (status === 'BLOCKED') {
      report.blockers.push(`${name}: ${details}${remediation ? ` (Fix: ${remediation})` : ''}`);
      report.readiness = 'BLOCKED';
    } else if (status === 'WARN') {
      report.warnings.push(`${name}: ${details}${remediation ? ` (Note: ${remediation})` : ''}`);
    }
  }

  // Stage 1: Runtime & Tool Availability
  const toolChecks = checkRuntimeTools({
    tracks,
    clientPath,
    mockTools: flags.mockTools,
  });
  report.stages.runtimeTools = toolChecks;
  for (const t of toolChecks) {
    if (t.failureType === 'NOT_REQUIRED') continue;
    addCheck(`Tool: ${t.name}`, t.status, t.details, t.remediation, {
      stage: 1,
      failureType: t.failureType,
      executablePath: t.executablePath,
      version: t.version,
    });
  }

  // Stage 2: Git Author Identity & GitHub/Git Remote Access
  const gitCwd = clientPath && fs.existsSync(clientPath) ? clientPath : process.cwd();
  const gitNameRes = runCmd('git', ['config', 'user.name'], gitCwd);
  const gitEmailRes = runCmd('git', ['config', 'user.email'], gitCwd);
  const gitName = gitNameRes.stdout;
  const gitEmail = gitEmailRes.stdout;

  if (gitName && gitEmail) {
    addCheck('Git Author Identity', 'PASS', `Configured as: ${gitName} <${gitEmail}>`, null, { stage: 2 });
  } else {
    addCheck(
      'Git Author Identity',
      'WARN',
      'git user.name or user.email not configured.',
      'Run: git config user.name "Your Name" && git config user.email "your.email@example.com"',
      { stage: 2 }
    );
  }

  if (flags.verifyRemoteAccess && (clientPath || effectiveCorePath)) {
    const ghCheck = githubAuth.verifyGitAndGitHubAccess({
      repoPath: clientPath && fs.existsSync(clientPath) ? clientPath : effectiveCorePath,
    });
    report.stages.githubAccess = ghCheck;
    addCheck(
      'Git & GitHub Remote Access',
      ghCheck.ok ? 'PASS' : 'WARN',
      ghCheck.repositoryAccess ? ghCheck.repositoryAccess.detail : ghCheck.status,
      ghCheck.remediation,
      { stage: 2, classification: ghCheck.status }
    );
  } else {
    const ghCli = githubAuth.inspectGhCli(flags.mockGh || {});
    report.stages.githubAccess = ghCli;
    addCheck(
      'GitHub CLI Authentication',
      ghCli.authenticated ? 'PASS' : 'WARN',
      ghCli.detail,
      ghCli.remediation,
      { stage: 2, classification: ghCli.status }
    );
  }

  // Stage 3: Local NGO Core Repository Discovery & Validation
  report.stages.coreDiscovery = discoveryRes;
  if (!effectiveCorePath && discoveryRes.status !== 'MULTIPLE_CANDIDATES_FOUND') {
    addCheck(
      'Core Path Input',
      'BLOCKED',
      discoveryRes.remediation || 'Local NGO Core path was not provided or discovered.',
      'Specify --core-path <path-to-ngo-online-core> or set NGO_CORE_PATH',
      { stage: 3, classification: discoveryRes.status }
    );
  } else if (discoveryRes.status === 'MULTIPLE_CANDIDATES_FOUND') {
    addCheck(
      'Core Repository Discovery',
      'BLOCKED',
      discoveryRes.remediation,
      'Specify --core-path <path-to-ngo-online-core> to disambiguate.',
      { stage: 3, classification: 'MULTIPLE_CANDIDATES_FOUND', candidates: discoveryRes.candidates }
    );
  } else if (effectiveCorePath) {
    if (!fs.existsSync(effectiveCorePath)) {
      addCheck('Core Repository Exists', 'BLOCKED', `Core path not found: ${effectiveCorePath}`, 'Verify --core-path points to a valid directory.', { stage: 3 });
    } else {
      const coreGitCheck = runCmd('git', ['rev-parse', '--is-inside-work-tree'], effectiveCorePath);
      if (coreGitCheck.status !== 0 || coreGitCheck.stdout !== 'true') {
        addCheck('Core Git Repository', 'BLOCKED', `Core path is not a valid git repository: ${effectiveCorePath}`, null, { stage: 3 });
      } else {
        addCheck('Core Repository Safety', 'PASS', `Core repo verified at ${effectiveCorePath}. Strictly READ-ONLY (no checkouts or branch changes).`, null, { stage: 3 });
      }
    }
  }

  // Stage 5: npm & .npmrc Configuration (only when frontend track is active)
  if (needFrontend && clientPath && fs.existsSync(clientPath)) {
    const npmDiag = npmDiagnostics.inspectNpmEnvironment({ clientPath, tracks });
    report.stages.npmDiagnostics = npmDiag;
    const npmStatus = npmDiag.ok ? (npmDiag.npmrc && npmDiag.npmrc.obsoleteWarnings.length > 0 ? 'WARN' : 'PASS') : 'BLOCKED';
    const issueDetails = !npmDiag.ok
      ? npmDiag.remediation || npmDiag.status
      : `npm ${npmDiag.npm ? npmDiag.npm.version : ''} ready`;
    addCheck(
      'npm & .npmrc Configuration',
      npmStatus,
      issueDetails,
      npmDiag.remediation,
      { stage: 5 }
    );
  } else if (!needFrontend) {
    report.stages.npmDiagnostics = { skipped: true, reason: 'Frontend track is disabled.' };
  }

  // Stage 6: Client Repository & Working Tree Status
  let detectedVersions = { primary: null, backendVersion: null, frontendVersion: null };
  if (!clientPath) {
    addCheck('Client Path Input', 'BLOCKED', 'Client project path was not provided.', 'Specify --client-path <path-to-client-repo>', { stage: 6 });
  } else if (!fs.existsSync(clientPath)) {
    addCheck('Client Repository Exists', 'BLOCKED', `Client directory not found at: ${clientPath}`, null, { stage: 6 });
  } else {
    const gitRepoCheck = runCmd('git', ['rev-parse', '--is-inside-work-tree'], clientPath);
    if (gitRepoCheck.status !== 0 || gitRepoCheck.stdout !== 'true') {
      addCheck('Client Git Repository', 'WARN', 'Client directory is not a Git repository.', null, { stage: 6 });
    } else {
      const gitStatusRes = runCmd('git', ['status', '--porcelain'], clientPath);
      if (gitStatusRes.status === 0) {
        const statusLines = gitStatusRes.stdout.split(/\r?\n/).filter(Boolean);
        if (statusLines.length === 0) {
          addCheck('Client Working Tree', 'PASS', 'Working tree is clean.', null, { stage: 6 });
        } else {
          const hasConflictRisk = statusLines.some((l) => /(\.csproj|package\.json|appsettings.*\.json)/i.test(l));
          if (hasConflictRisk) {
            addCheck('Client Working Tree', 'WARN', `${statusLines.length} modified/untracked files include upgrade target files (.csproj/package.json). Commit or stash before proceeding.`, null, { stage: 6 });
          } else {
            addCheck('Client Working Tree', 'PASS', `${statusLines.length} uncommitted changes (no collision with upgrade project files).`, null, { stage: 6 });
          }
        }
      }
    }

    detectedVersions = detectClientInstalledVersions(clientPath);
    if (detectedVersions.primary) {
      addCheck('Detected Installed Core Version', 'PASS', `Current version: ${detectedVersions.primary} (Backend: ${detectedVersions.backendVersion || 'N/A'}, Frontend: ${detectedVersions.frontendVersion || 'N/A'})`, null, { stage: 6 });
    } else {
      addCheck('Detected Installed Core Version', 'WARN', 'Could not automatically find NGO.Core packages in client files.', null, { stage: 6 });
    }
  }

  // Stage 7: Source & Target Release Evidence (Package-First, releases/* Branches, Commit History, or Optional Tags)
  if (effectiveCorePath && fs.existsSync(effectiveCorePath)) {
    const coreGitCheck = runCmd('git', ['rev-parse', '--is-inside-work-tree'], effectiveCorePath);
    if (coreGitCheck.status === 0 && coreGitCheck.stdout === 'true') {
      const tagsRes = runCmd('git', ['tag', '-l'], effectiveCorePath);
      const tagList = tagsRes.status === 0 ? tagsRes.stdout.split(/\r?\n/).map((t) => t.trim()).filter(Boolean) : [];

      const evaluateVersionEvidence = (ver, label, isTarget) => {
        const normVer = normalizeVersion(ver) || String(ver).trim();
        const sub = normVer.split('.').slice(0, 2).join('.');
        const branchCheck = runCmd('git', ['rev-parse', '--verify', `origin/releases/${sub}`], effectiveCorePath);
        const localBranchCheck = runCmd('git', ['rev-parse', '--verify', `releases/${sub}`], effectiveCorePath);
        const hasBranch = (branchCheck.status === 0 && branchCheck.stdout) || (localBranchCheck.status === 0 && localBranchCheck.stdout);
        const hasTag = tagList.some((t) => t === `v${normVer}` || t === normVer);
        const canonicalFile = path.resolve(__dirname, '..', 'ingest', 'knowledge', 'canonical', 'releases', normVer, 'release.yaml');
        const candidateFile = path.resolve(__dirname, '..', 'ingest', 'knowledge', 'candidates', 'releases', `${normVer}.json`);
        const srcEv = resolver.discoverSourceEvidence(effectiveCorePath, normVer);
        const pkgEv = resolver.discoverPackageEvidence(normVer, { corePath: effectiveCorePath });

        if (hasBranch || (srcEv && srcEv.branch && srcEv.branch.exists)) {
          const branchName = (srcEv && srcEv.branch && srcEv.branch.name) || `releases/${sub}`;
          addCheck(label, 'PASS', `Resolved ${normVer} via Core release branch (${branchName}).`, null, { stage: 7 });
        } else if (srcEv && srcEv.sourceRevisionAvailable) {
          addCheck(label, 'PASS', `Resolved ${normVer} via Core commit/revision evidence (${srcEv.targetCommit ? srcEv.targetCommit.slice(0, 8) : 'verified'}).`, null, { stage: 7 });
        } else if (pkgEv && pkgEv.available) {
          addCheck(label, 'PASS', `Resolved ${normVer} via published package metadata (${pkgEv.identity || pkgEv.source}).`, null, { stage: 7 });
        } else if (fs.existsSync(canonicalFile) || fs.existsSync(candidateFile)) {
          addCheck(label, 'PASS', `Resolved ${normVer} via pre-ingested release knowledge.`, null, { stage: 7 });
        } else if (hasTag) {
          addCheck(label, 'PASS', `Resolved ${normVer} via Git tag in Core repository.`, null, { stage: 7 });
        } else if (isTarget) {
          addCheck(
            label,
            'WARN',
            `Release ${normVer} was not found in local releases/${sub} branches or local package cache (will query remote package feeds in package-first mode). To refresh remote release branches, run: git -C "${effectiveCorePath}" fetch --all`,
            null,
            { stage: 7 }
          );
        } else {
          addCheck(
            label,
            'WARN',
            `Source release ${normVer} was not found in local releases/${sub} branches (will resolve via package metadata or remote branches). Run: git -C "${effectiveCorePath}" fetch --all`,
            `git -C "${effectiveCorePath}" fetch --all`,
            { stage: 7 }
          );
        }
      };

      const sourceVer = flags.source || flags['source-version'] || detectedVersions.primary;
      if (sourceVer) {
        evaluateVersionEvidence(sourceVer, 'Source Release Evidence', false);
      }
      if (targetVersion) {
        evaluateVersionEvidence(targetVersion, 'Target Release Evidence', true);
      }
    }
  }

  // Stage 4 (sync summary): NuGet config hierarchy & credential provider check when backend track is active
  if (needBackend) {
    const cfgHierarchy = nugetSources.inspectNuGetConfigHierarchy(clientPath || process.cwd());
    const mappingCheck = nugetSources.checkPackageSourceMappingForPackage('NGO.Core.API', cfgHierarchy.packageSourceMappings);
    const credProvider = nugetSources.findAzureArtifactsCredentialProvider();
    report.stages.nugetConfig = {
      configHierarchy: cfgHierarchy,
      mappingCheck,
      credentialProvider: credProvider,
    };

    if (!mappingCheck.mapped) {
      addCheck('NuGet Package Source Mapping', 'BLOCKED', mappingCheck.reason, 'Update <packageSourceMapping> in NuGet.Config to include pattern "NGO.*" for your NGO Core feed.', { stage: 4 });
    } else {
      const nugetSourcesRes = runCmd('dotnet', ['nuget', 'list', 'source'], clientPath && fs.existsSync(clientPath) ? clientPath : process.cwd());
      if (nugetSourcesRes.status === 0) {
        const enabledSources = nugetSourcesRes.stdout.split(/\r?\n/).filter((l) => /\[Enabled\]/i.test(l));
        addCheck('NuGet Sources', 'PASS', `${enabledSources.length} enabled NuGet sources found.`, null, { stage: 4 });
      } else {
        addCheck('NuGet Sources', 'WARN', 'Could not query dotnet nuget sources.', null, { stage: 4 });
      }
    }
  }

  // Stage 8: Reusable State Fingerprint
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify({
    corePath: effectiveCorePath,
    clientPath,
    targetVersion,
    tracks,
    readiness: report.readiness,
  }));
  report.stateFingerprint = hash.digest('hex').slice(0, 16);

  return report;
}

/**
 * Full Async 8-Stage Environment Check (includes live 5-stage NuGet/Azure Artifacts feed & package checks).
 */
async function runEnvironmentCheck(flags = {}) {
  const report = checkEnvironment(flags);
  const rawTracks = flags.tracks || 'backend,frontend';
  const tracks = Array.isArray(rawTracks)
    ? rawTracks
    : String(rawTracks).split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);

  // Optionally persist validated corePath and workspace root to platform/config/settings.json
  if (flags['save-settings'] || flags.saveSettings) {
    try {
      const updates = {};
      if (report.inputs.corePath && fs.existsSync(report.inputs.corePath)) {
        updates.corePath = path.resolve(report.inputs.corePath);
      }
      if (report.inputs.clientPath && fs.existsSync(report.inputs.clientPath)) {
        const currentSettings = settingsLib.loadSettings();
        const clientParent = path.dirname(path.resolve(report.inputs.clientPath));
        const existingRoots = Array.isArray(currentSettings.approvedWorkspaceRoots)
          ? currentSettings.approvedWorkspaceRoots
          : [];
        if (!existingRoots.some((r) => path.resolve(r).toLowerCase() === clientParent.toLowerCase())) {
          updates.approvedWorkspaceRoots = [...existingRoots, clientParent];
        }
      }
      if (Object.keys(updates).length > 0) {
        settingsLib.saveSettings(updates);
        report.settingsSaved = updates;
      }
    } catch (_) {}
  }

  if (tracks.includes('backend') && !flags.skipNuGetNetworkProbe) {
    const nugetPreflight = await nugetSources.runNuGetPreflightChecks({
      clientPath: report.inputs.clientPath || process.cwd(),
      packageId: flags.packageId || 'NGO.Core.API',
      targetVersion: report.inputs.targetVersion,
      pat: flags.pat,
      fetchFn: flags.fetchFn,
    });
    report.stages.nugetPreflight = nugetPreflight;
    if (!nugetPreflight.ok) {
      const stageBlock = !nugetPreflight.stages.feedConfig.ok
        ? nugetPreflight.stages.feedConfig
        : !nugetPreflight.stages.feedAccess.ok
        ? nugetPreflight.stages.feedAccess
        : nugetPreflight.stages.packageRestore;
      if (stageBlock) {
        report.checks.push({
          name: 'NuGet / Azure Artifacts Preflight',
          status: 'BLOCKED',
          details: stageBlock.detail,
          remediation: nugetPreflight.remediation,
          stage: 4,
        });
        report.blockers.push(`NuGet / Azure Artifacts Preflight: ${stageBlock.detail}`);
        report.readiness = 'BLOCKED';
      }
    }
  }

  return report;
}

// CLI Execution
if (require.main === module) {
  (async () => {
    const flags = parseFlags(process.argv.slice(2));

    if (flags.help || (!flags['core-path'] && !flags['client-path'] && Object.keys(flags).length === 0)) {
      console.log(`
Deterministic Preflight & Environment Checker for NGO Core Upgrade
===================================================================

Usage:
  node tools/check-environment.js --core-path <path> --client-path <path> [--target <version>] [--tracks <backend,frontend>] [--save-settings]

Options:
  --core-path <path>     Path to local ngo-online-core repository (or auto-discovered via NGO_CORE_PATH)
  --client-path <path>   Path to client project / solution
  --target <version>     Desired target version or branch (e.g. 9.4, 9.4.1, releases/9.4)
  --tracks <list>        Comma-separated tracks: backend,frontend (default: backend,frontend)
  --save-settings        Save verified corePath and client workspace root into platform/config/settings.json
  --json                 Output raw JSON result
`);
      process.exit(flags.help ? 0 : 1);
    }

    const result = await runEnvironmentCheck(flags);

    if (flags.json) {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.readiness === 'READY' ? 0 : 1);
    }

    console.log('\n=============================================================');
    console.log(' NGO Core Upgrade - Preflight & Environment Check');
    console.log('=============================================================\n');

    if (result.settingsSaved) {
      console.log(`  ✓ [SAVED] Updated platform/config/settings.json with verified paths.`);
    }

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
      const core = result.inputs.corePath || flags['core-path'] || flags.core;
      const client = flags['client-path'] || flags.client;
      const target = result.inputs.targetVersion || flags.target || '9.4.1';
      const tracksArg = (result.inputs.tracks || ['backend', 'frontend']).join(',');
      console.log('Ready to proceed! Run the deterministic upgrade command:');
      console.log('\nnode engine/tools/upgrade-engine.js create-run \\');
      console.log(`  --client demo-client \\`);
      console.log(`  --tracks ${tracksArg} \\`);
      console.log(`  --core-path "${core}" \\`);
      console.log(`  --source-version ${result.checks.find((c) => c.name === 'Detected Installed Core Version')?.details.match(/Current version: ([0-9.]+)/)?.[1] || '9.0.0'} \\`);
      console.log(`  --target-version ${target} \\`);
      console.log(`  --backend-client-path "${client}"\n`);
      process.exit(0);
    }
  })();
}

module.exports = {
  checkEnvironment,
  runEnvironmentCheck,
  checkRuntimeTools,
  detectClientInstalledVersions,
  normalizeVersion,
};

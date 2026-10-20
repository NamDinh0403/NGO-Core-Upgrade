'use strict';
/*
 * Background Upgrade Worker Process.
 *
 * Executes the stages of an upgrade engagement sequentially:
 *   PREFLIGHT -> CORE_INGEST -> PLAN -> IMPLEMENT -> VERIFY -> (REPAIR) -> REVIEW
 * Runs non-interactively; writes progress events and logs to the durable job store.
 * Dependency-free, Node 14+.
 */

const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const preflightLib = require('./preflight');
const verifierLib = require('./verifier');
const reviewerLib = require('./reviewer');
const copilotCli = require('./copilot-cli');
const telemetryLib = require('./telemetry');
const nugetSources = require('./nuget-sources');

/**
 * Extract clean user handle from Git user.name or user.email.
 * e.g. "Nam Dinh Phuong" -> "namdinh"
 */
function getGitUserHandle(clientPath) {
  try {
    const res = cp.spawnSync('git', ['config', 'user.name'], { cwd: clientPath, encoding: 'utf8', windowsHide: true, shell: false });
    const name = (res.stdout || '').trim();
    if (name) {
      const parts = name.toLowerCase().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0]}${parts[1]}`.replace(/[^a-z0-9_-]/g, '');
      }
      return parts[0].replace(/[^a-z0-9_-]/g, '');
    }
  } catch (_) {}
  try {
    const res = cp.spawnSync('git', ['config', 'user.email'], { cwd: clientPath, encoding: 'utf8', windowsHide: true, shell: false });
    const email = (res.stdout || '').trim().split('@')[0];
    if (email) {
      const parts = email.toLowerCase().split(/[._-]+/).filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0]}${parts[1]}`.replace(/[^a-z0-9_-]/g, '');
      }
      return parts[0].replace(/[^a-z0-9_-]/g, '');
    }
  } catch (_) {}
  return 'user';
}

/**
 * Automatically create and checkout a new branch for the upgrade under the user git handle.
 * e.g. namdinh/upgrade-version-9-4-1
 */
function ensureUpgradeBranch(clientPath, targetVersion, log) {
  try {
    const handle = getGitUserHandle(clientPath);
    const verSlug = String(targetVersion || '').replace(/\./g, '-');
    const branchName = `${handle}/upgrade-version-${verSlug}`;

    // Get current branch
    const currRes = cp.spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: clientPath, encoding: 'utf8', windowsHide: true, shell: false });
    const currentBranch = (currRes.stdout || '').trim();

    if (currentBranch === branchName) {
      log(`Already on target upgrade branch: ${branchName}`);
      return branchName;
    }

    // Check if branch already exists
    const checkRes = cp.spawnSync('git', ['rev-parse', '--verify', branchName], { cwd: clientPath, encoding: 'utf8', windowsHide: true, shell: false });
    if (checkRes.status === 0) {
      log(`Checking out existing upgrade branch: ${branchName}`);
      const coRes = cp.spawnSync('git', ['checkout', branchName], { cwd: clientPath, encoding: 'utf8', windowsHide: true, shell: false });
      if (coRes.status === 0) return branchName;
    } else {
      log(`Creating new upgrade branch: ${branchName}`);
      const createRes = cp.spawnSync('git', ['checkout', '-b', branchName], { cwd: clientPath, encoding: 'utf8', windowsHide: true, shell: false });
      if (createRes.status === 0) {
        log(`Switched to branch: ${branchName}`);
        return branchName;
      }
      log(`Warning: Failed to checkout -b ${branchName}: ${createRes.stderr || createRes.stdout}`);
    }
    return currentBranch;
  } catch (err) {
    log(`Git branch setup notice: ${err.message}`);
    return null;
  }
}

// Auto-configure Credential Provider path for child dotnet processes if available
try {
  if (!process.env.NUGET_CREDENTIALPROVIDERS_PATH) {
    const credExe = nugetSources.findAzureArtifactsCredentialProvider();
    if (credExe) {
      process.env.NUGET_CREDENTIALPROVIDERS_PATH = path.dirname(path.dirname(credExe));
    }
  }
} catch (_) {}

// Parse CLI flags
function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i].startsWith('--')) {
      const key = process.argv[i].slice(2);
      const val = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : true;
      args[key] = val;
    }
  }
  return args;
}

const args = parseArgs();
const jobFile = args['job-file'];

if (!jobFile || !fs.existsSync(jobFile)) {
  console.error('Usage: node worker.js --job-file <path-to-job.json>');
  process.exit(1);
}

const jobDir = path.dirname(jobFile);
const logFile = path.join(jobDir, 'worker.log');

let job = null;

function readJob() {
  job = JSON.parse(fs.readFileSync(jobFile, 'utf8'));
  return job;
}

function updateJob(mutator) {
  const current = readJob();
  mutator(current);
  current.updatedAt = new Date().toISOString();
  fs.writeFileSync(jobFile, JSON.stringify(current, null, 2));
  job = current;
  return current;
}

function extractCoreErrors(text) {
  if (!text) return '';
  const lines = String(text).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const errorLines = lines.filter((l) => /error|failed|fatal|exception|unsupported|not compatible/i.test(l) && !/^\s*at\s+/i.test(l));
  const chosen = errorLines.length > 0 ? errorLines.slice(0, 25) : lines.slice(0, 15);
  return chosen.join('\n').slice(0, 2000);
}

function appendLog(line, level, stage) {
  let lvl = level;
  if (!lvl) {
    if (/error|failed|blocker/i.test(line)) lvl = 'ERROR';
    else if (/warn|note|unconfirmed/i.test(line)) lvl = 'WARN';
    else lvl = 'INFO';
  }
  const timestamp = new Date().toISOString();
  const currentJob = readJob();
  const stg = stage || currentJob.currentStage || 'SYSTEM';
  const rawLine = String(line || '');
  const safeLine = rawLine.length > 4000 ? rawLine.slice(0, 4000) + '... [truncated]' : rawLine;
  const formatted = `[${timestamp}] [${lvl}] [${stg}] ${safeLine}\n`;
  fs.appendFileSync(logFile, formatted);
  console.log(safeLine);
}

async function runWorker() {
  job = readJob();
  appendLog(`Worker started for run ${job.runId} (${job.clientName} -> Core ${job.targetVersion})`, 'INFO', 'INIT');
  updateJob((j) => {
    j.status = 'RUNNING';
    j.pid = process.pid;
    j.startedAt = j.startedAt || new Date().toISOString();
    j.stageMetrics = j.stageMetrics || {};
    j.trackStates = {
      backend: j.tracks.includes('backend') ? 'RUNNING' : 'SKIPPED',
      frontend: j.tracks.includes('frontend') ? 'RUNNING' : 'SKIPPED',
    };
  });

  const { clientPath, targetVersion, corePath, tracks, simulateCopilot } = job;
  const isSimulation = simulateCopilot || process.env.COPILOT_SIMULATOR === 'true';

  try {
    const releaseNotesLib = require('./release-notes');
    if (!job.releaseNotes) {
      const rn = releaseNotesLib.getReleaseNotes(targetVersion);
      if (rn && rn.exists) {
        updateJob((j) => { j.releaseNotes = rn.content; });
        job = readJob();
      }
    }
  } catch (_) {}

  try {
    // -----------------------------------------------------------------------
    // STAGE 1: PREFLIGHT
    // -----------------------------------------------------------------------
    const stage1Start = Date.now();
    if (job.completedStages.includes('PREFLIGHT')) {
      appendLog('Already completed in previous run; reusing preflight.', 'INFO', 'PREFLIGHT');
    } else {
      appendLog('Inspecting client project and resolving Core release...', 'INFO', 'PREFLIGHT');
      updateJob((j) => {
        j.currentStage = 'PREFLIGHT';
        j.stageMetrics.PREFLIGHT = { startedAt: new Date().toISOString(), status: 'RUNNING' };
      });

      let feedCheck = null;
      try {
        const nugetSources = require('./nuget-sources');
        feedCheck = await nugetSources.verifyPackageAvailability(targetVersion);
      } catch (_) {}

      const preflightResult = preflightLib.runPreflight({
        clientPath,
        targetVersion,
        corePath,
        tracks,
        feedCheck,
      });

      appendLog(`Resolution mode: ${preflightResult.impactPreview.mode}`, 'INFO', 'PREFLIGHT');
      appendLog(`Compatibility evidence: ${preflightResult.impactPreview.compatibilityEvidence}`, 'INFO', 'PREFLIGHT');

      if (preflightResult.warnings.length > 0) {
        for (const w of preflightResult.warnings) appendLog(w, 'WARN', 'PREFLIGHT');
      }

      if (preflightResult.isBlocked) {
        throw new Error(`Preflight blocked: ${preflightResult.blockers.join('; ')}`);
      }

      updateJob((j) => {
        j.preflight = preflightResult;
        j.completedStages.push('PREFLIGHT');
        j.stageMetrics.PREFLIGHT = {
          startedAt: j.stageMetrics.PREFLIGHT.startedAt,
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - stage1Start,
          status: 'COMPLETED',
        };
      });
      appendLog('Preflight stage completed successfully.', 'INFO', 'PREFLIGHT');

      appendLog('Ensuring dedicated upgrade Git branch...', 'INFO', 'PREFLIGHT');
      const branchName = ensureUpgradeBranch(clientPath, targetVersion, (l) => appendLog(l, 'INFO', 'PREFLIGHT'));
      if (branchName) {
        updateJob((j) => { j.gitBranch = branchName; });
      }
    }

    // -----------------------------------------------------------------------
    // STAGE 2: CORE_INGEST
    // -----------------------------------------------------------------------
    const stage2Start = Date.now();
    const adaptationLib = require('./adaptation');
    const sourceVersion = job.preflight ? job.preflight.currentVersion : null;

    let releaseAnalysis = null;
    try {
      const ingestOut = path.join(jobDir, 'candidates');
      fs.mkdirSync(ingestOut, { recursive: true });
      releaseAnalysis = adaptationLib.deriveReleaseRequirements({
        corePath,
        sourceVersion,
        targetVersion,
        ingestOutDir: ingestOut,
        runId: job.runId,
        tracks,
      });
    } catch (err) {
      appendLog(`Notice: Extended release analysis: ${err.message}`, 'WARN', 'CORE_INGEST');
    }

    if (job.completedStages.includes('CORE_INGEST')) {
      appendLog('Already completed; candidate reused.', 'INFO', 'CORE_INGEST');
    } else {
      appendLog('Ingesting Core facts and building candidate changeset...', 'INFO', 'CORE_INGEST');
      updateJob((j) => {
        j.currentStage = 'CORE_INGEST';
        j.stageMetrics.CORE_INGEST = { startedAt: new Date().toISOString(), status: 'RUNNING' };
      });

      const ingestReused = releaseAnalysis && releaseAnalysis.ingestResult ? releaseAnalysis.ingestResult.reused : false;
      const entriesCount = releaseAnalysis && releaseAnalysis.ingestResult && releaseAnalysis.ingestResult.entries
        ? releaseAnalysis.ingestResult.entries.length : 0;
      const versionsRange = releaseAnalysis && releaseAnalysis.versions ? releaseAnalysis.versions : [targetVersion];

      appendLog(`Core release processed. Reused: ${ingestReused} (Release path: ${versionsRange.join(' -> ')})`, 'INFO', 'CORE_INGEST');
      updateJob((j) => {
        j.ingest = {
          reused: ingestReused,
          entriesCount,
          releaseRange: versionsRange,
          targetAngularMajor: releaseAnalysis ? releaseAnalysis.targetAngularMajor : 15,
        };
        j.completedStages.push('CORE_INGEST');
        j.stageMetrics.CORE_INGEST = {
          startedAt: j.stageMetrics.CORE_INGEST.startedAt,
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - stage2Start,
          status: 'COMPLETED',
        };
      });
      appendLog('Core Ingest stage completed successfully.', 'INFO', 'CORE_INGEST');
    }

    // -----------------------------------------------------------------------
    // STAGE 3: PLAN
    // -----------------------------------------------------------------------
    const stage3Start = Date.now();
    if (job.completedStages.includes('PLAN')) {
      appendLog('Plan already registered.', 'INFO', 'PLAN');
    } else {
      appendLog('Slicing requirements and preparing implementation plan...', 'INFO', 'PLAN');
      updateJob((j) => {
        j.currentStage = 'PLAN';
        j.stageMetrics.PLAN = { startedAt: new Date().toISOString(), status: 'RUNNING' };
      });

      // AppSettings configuration inspection
      let backendConfigInspection = { missing: [] };
      if (tracks.includes('backend')) {
        try {
          const configurationLib = require('../backend/tools/configuration');
          const apiDir = path.join(clientPath, 'ngo-api');
          const inspectRoot = fs.existsSync(apiDir) ? apiDir : clientPath;
          const storeSettings = releaseAnalysis && releaseAnalysis.appSettings ? releaseAnalysis.appSettings : [];
          backendConfigInspection = configurationLib.inspect(inspectRoot, storeSettings);
        } catch (_) {}
      }

      // Build structured plan tasks
      const tasks = [];
      const targetTfm = (job.preflight && job.preflight.targetFramework)
        || preflightLib.detectRequiredTargetFramework(corePath, targetVersion) || 'net10.0';

      if (tracks.includes('backend')) {
        tasks.push({ track: 'backend', action: `Update NGO.Core NuGet package references to ${targetVersion} in .csproj files` });
        tasks.push({ track: 'backend', action: `Align TargetFramework to ${targetTfm} across .csproj files` });
        if (backendConfigInspection.missing && backendConfigInspection.missing.length > 0) {
          tasks.push({
            track: 'backend',
            action: `Merge ${backendConfigInspection.missing.length} missing Core AppSettings keys into appsettings.json`,
            keys: backendConfigInspection.missing.map((m) => m.key),
          });
        }
      }

      const targetAngularMajor = releaseAnalysis ? releaseAnalysis.targetAngularMajor : 15;
      if (tracks.includes('frontend')) {
        tasks.push({ track: 'frontend', action: `Align @ngo/core dependency to ${targetVersion} in package.json` });
        tasks.push({ track: 'frontend', action: `Align Angular ${targetAngularMajor} peer dependencies (RxJS, Zone.js, TypeScript, NgRx)` });
        tasks.push({ track: 'frontend', action: 'Sanitize .npmrc feed registry configuration (FontAwesome + Azure Packaging)' });
        tasks.push({ track: 'frontend', action: 'Install frontend dependencies via npm i -f --peer-deps' });
        tasks.push({ track: 'frontend', action: 'Synchronize environment configuration from Core reference host' });
        tasks.push({ track: 'frontend', action: 'Adapt known breaking syntax and API changes (e.g. FormFieldFactoryExt)' });
      }

      const allReqs = (releaseAnalysis && releaseAnalysis.split && releaseAnalysis.split.all)
        ? releaseAnalysis.split.all.requirements || [] : [];
      const backendReqs = (releaseAnalysis && releaseAnalysis.split && releaseAnalysis.split.backend)
        ? releaseAnalysis.split.backend.requirements || [] : [];
      const frontendReqs = (releaseAnalysis && releaseAnalysis.split && releaseAnalysis.split.frontend)
        ? releaseAnalysis.split.frontend.requirements || [] : [];
      const versionsRange = releaseAnalysis && releaseAnalysis.versions ? releaseAnalysis.versions : [targetVersion];

      appendLog(`Release range resolved: ${versionsRange.join(' -> ')} (${allReqs.length} total requirements derived: ${backendReqs.length} backend, ${frontendReqs.length} frontend).`, 'INFO', 'PLAN');
      if (backendConfigInspection.missing && backendConfigInspection.missing.length > 0) {
        appendLog(`AppSettings audit: ${backendConfigInspection.missing.length} missing Core configuration key(s) detected.`, 'INFO', 'PLAN');
      }

      const plan = {
        targetVersion,
        sourceVersion,
        tracks,
        releaseRange: versionsRange,
        frameworkTransitions: {
          dotnet: targetTfm,
          angular: targetAngularMajor,
        },
        tasks,
        backendConfigResult: backendConfigInspection,
        requirementsSummary: {
          total: allReqs.length,
          backend: backendReqs.length,
          frontend: frontendReqs.length,
        },
      };

      updateJob((j) => {
        j.plan = plan;
        j.completedStages.push('PLAN');
        j.stageMetrics.PLAN = {
          startedAt: j.stageMetrics.PLAN.startedAt,
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - stage3Start,
          status: 'COMPLETED',
        };
      });
      appendLog('Plan stage completed successfully.', 'INFO', 'PLAN');
    }

    // -----------------------------------------------------------------------
    // STAGE 4: IMPLEMENT
    // -----------------------------------------------------------------------
    const isAutoPatch = preflightLib.classifyUpgradeMode(
      job.preflight ? job.preflight.currentVersion : null,
      targetVersion
    ).isPatch;

    const stage4Start = Date.now();
    if (job.completedStages.includes('IMPLEMENT')) {
      appendLog('Implementation already applied.', 'INFO', 'IMPLEMENT');
    } else {
      appendLog('Applying package updates and code adjustments...', 'INFO', 'IMPLEMENT');
      updateJob((j) => {
        j.currentStage = 'IMPLEMENT';
        j.stageMetrics.IMPLEMENT = { startedAt: new Date().toISOString(), status: 'RUNNING' };
      });

      let modifiedCount = 0;

      // Backend updates
      if (tracks.includes('backend')) {
        const targetTfm = (job.preflight && job.preflight.targetFramework)
          ? job.preflight.targetFramework
          : (preflightLib.detectRequiredTargetFramework(corePath, targetVersion) || 'net10.0');
        const updateCsproj = (dir) => {
          for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory() && !['bin', 'obj', '.vs', 'node_modules'].includes(entry.name)) {
              updateCsproj(full);
            } else if (entry.name.endsWith('.csproj')) {
              let text = fs.readFileSync(full, 'utf8');
              const orig = text;
              text = text.replace(/(<PackageReference\s+Include=["']NGO\.Core(?:\.[^"']+)?["']\s+Version=["'])[^"']+(["'])/gi, `$1${targetVersion}$2`);
              text = text.replace(/(<PackageReference\s+Version=["'])[^"']+(["']\s+Include=["']NGO\.Core)/gi, `$1${targetVersion}$2`);
              if (targetTfm) {
                text = text.replace(/<TargetFramework>([^<]+)<\/TargetFramework>/gi, (m, cur) => {
                  if (cur.trim().toLowerCase() !== targetTfm.toLowerCase()) {
                    return `<TargetFramework>${targetTfm}</TargetFramework>`;
                  }
                  return m;
                });
                text = text.replace(/<TargetFrameworks>([^<]+)<\/TargetFrameworks>/gi, (m, cur) => {
                  const parts = cur.split(';').map(p => p.trim());
                  if (!parts.some(p => p.toLowerCase() === targetTfm.toLowerCase())) {
                    return `<TargetFrameworks>${targetTfm}</TargetFrameworks>`;
                  }
                  return m;
                });
              }
              if (text !== orig) {
                fs.writeFileSync(full, text);
                appendLog(`Updated NGO.Core references${targetTfm ? ' and TargetFramework to ' + targetTfm : ''} to ${targetVersion} in ${path.relative(clientPath, full)}`, 'INFO', 'IMPLEMENT');
                modifiedCount++;
              }
            }
          }
        };
        const apiDir = path.join(clientPath, 'ngo-api');
        updateCsproj(fs.existsSync(apiDir) ? apiDir : clientPath);

        // AppSettings configuration adaptation (merges missing Core keys, strictly preserves client values)
        try {
          const storeSettings = releaseAnalysis && releaseAnalysis.appSettings ? releaseAnalysis.appSettings : [];
          const configRes = adaptationLib.adaptBackendConfiguration(clientPath, storeSettings, (l) => appendLog(l, 'INFO', 'IMPLEMENT'));
          modifiedCount += (configRes.modifiedFiles || []).length;
        } catch (err) {
          appendLog(`Warning: Backend AppSettings adaptation: ${err.message}`, 'WARN', 'IMPLEMENT');
        }
      }

      // Frontend updates
      if (tracks.includes('frontend')) {
        const clientDir = path.join(clientPath, 'ngo-client');
        const targetDir = fs.existsSync(clientDir) ? clientDir : clientPath;
        const pkgFile = path.join(targetDir, 'package.json');
        if (fs.existsSync(pkgFile)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
            let pkgModified = false;
            for (const scope of ['dependencies', 'devDependencies']) {
              if (pkg[scope]) {
                for (const dep of Object.keys(pkg[scope])) {
                  if (dep.includes('ngo-core') || dep.includes('@ngo/core')) {
                    if (pkg[scope][dep] !== targetVersion) {
                      pkg[scope][dep] = targetVersion;
                      pkgModified = true;
                      appendLog(`Updated ${dep} dependencies to ${targetVersion} in package.json`, 'INFO', 'IMPLEMENT');
                    }
                  }
                }
              }
            }

            // Discover Core package.json to align framework and peer dependencies
            let corePkg = null;
            const candidateCorePkgPaths = [
              path.join(corePath || 'D:\\NGO Client\\ngo-online-core', 'ngo-client-core', 'package.json'),
              path.join(corePath || 'D:\\NGO Client\\ngo-online-core', 'package.json'),
            ];
            for (const cpPath of candidateCorePkgPaths) {
              if (fs.existsSync(cpPath)) {
                try {
                  corePkg = JSON.parse(fs.readFileSync(cpPath, 'utf8'));
                  break;
                } catch (_) {}
              }
            }

            if (corePkg) {
              const coreDeps = Object.assign({}, corePkg.devDependencies || {}, corePkg.dependencies || {});
              const frameworkPrefixes = ['@angular/', '@angular-devkit/', '@ngrx/'];
              const frameworkNames = [
                'rxjs', 'zone.js', 'tslib', 'typescript',
                '@azure/msal-angular', '@azure/msal-browser',
                '@fortawesome/angular-fontawesome',
                '@ng-bootstrap/ng-bootstrap', '@ng-select/ng-select',
                '@ngx-translate/core', '@ngx-translate/http-loader',
                'ngx-toastr', 'ngx-spinner', 'ngx-translate-cache'
              ];

              for (const scope of ['dependencies', 'devDependencies']) {
                if (!pkg[scope]) continue;
                for (const dep of Object.keys(pkg[scope])) {
                  const isFramework = frameworkPrefixes.some(p => dep.startsWith(p)) || frameworkNames.includes(dep);
                  if (isFramework && coreDeps[dep] && pkg[scope][dep] !== coreDeps[dep]) {
                    appendLog(`Aligned peer dependency ${dep} from ${pkg[scope][dep]} to ${coreDeps[dep]} (Core ${targetVersion})`, 'INFO', 'IMPLEMENT');
                    pkg[scope][dep] = coreDeps[dep];
                    pkgModified = true;
                  }
                }
              }
            } else if (parseInt(String(targetVersion).split('.')[0], 10) >= 9) {
              const v9Defaults = {
                'rxjs': '^7.5.0',
                'zone.js': '~0.13.3',
                'typescript': '^4.9.3',
                'tslib': '^2.6.3',
                '@ngrx/effects': '^15.2.0',
                '@ngrx/store': '^15.2.0',
                '@ngrx/store-devtools': '^15.2.0',
                '@ng-bootstrap/ng-bootstrap': '^14.2.0',
                '@ng-select/ng-select': '^10.0.4',
              };
              for (const scope of ['dependencies', 'devDependencies']) {
                if (!pkg[scope]) continue;
                for (const dep of Object.keys(pkg[scope])) {
                  if (dep.startsWith('@angular/')) {
                    if (pkg[scope][dep] !== '^15.2.10') {
                      pkg[scope][dep] = '^15.2.10';
                      pkgModified = true;
                    }
                  } else if (dep.startsWith('@angular-devkit/')) {
                    if (pkg[scope][dep] !== '^15.2.11') {
                      pkg[scope][dep] = '^15.2.11';
                      pkgModified = true;
                    }
                  } else if (v9Defaults[dep] && pkg[scope][dep] !== v9Defaults[dep]) {
                    pkg[scope][dep] = v9Defaults[dep];
                    pkgModified = true;
                  }
                }
              }
            }

            if (pkgModified) {
              fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2));
              modifiedCount++;
            }
          } catch (err) {
            appendLog(`Warning: Failed to update client package.json: ${err.message}`, 'WARN', 'IMPLEMENT');
          }
        }

        // 1. Sanitize .npmrc (remove all email/login lines, keep only FontAwesome and Azure Packaging registry)
        const npmrcFile = path.join(targetDir, '.npmrc');
        const canonicalNpmrc = [
          '@fortawesome:registry=https://npm.fontawesome.com/',
          '//npm.fontawesome.com/:_authToken=3782FD2E-F78E-470E-BDCF-CD67BB18773C',
          'registry=https://pkgs.dev.azure.com/preciofishbone/_packaging/NGO_Online_feed/npm/registry/',
          '//pkgs.dev.azure.com/preciofishbone/_packaging/NGO_Online_feed/npm/registry/:username=VssSessionToken',
        ].join('\n') + '\n';

        try {
          fs.writeFileSync(npmrcFile, canonicalNpmrc, 'utf8');
          appendLog('Sanitized .npmrc to clean FontAwesome & Packaging feed registry (removed email/login lines)', 'INFO', 'IMPLEMENT');
          modifiedCount++;
        } catch (err) {
          appendLog(`Warning: Failed to write clean .npmrc: ${err.message}`, 'WARN', 'IMPLEMENT');
        }

        // 2. Install frontend packages with npm i -f --peer-deps (deterministic code, no LLM)
        if (!isSimulation) {
          appendLog('Installing frontend packages via npm i -f --peer-deps...', 'INFO', 'IMPLEMENT');
          const npmRes = cp.spawnSync('npm', ['i', '-f', '--peer-deps'], {
            cwd: targetDir,
            encoding: 'utf8',
            windowsHide: true,
            shell: process.platform === 'win32',
            timeout: 180000,
          });
          if (npmRes.status === 0) {
            appendLog('Frontend packages installed successfully via npm i -f --peer-deps.', 'INFO', 'IMPLEMENT');
          } else {
            // Fallback to --legacy-peer-deps if npm version requires it
            const fallbackRes = cp.spawnSync('npm', ['i', '-f', '--legacy-peer-deps'], {
              cwd: targetDir,
              encoding: 'utf8',
              windowsHide: true,
              shell: process.platform === 'win32',
              timeout: 180000,
            });
            if (fallbackRes.status === 0) {
              appendLog('Frontend packages installed successfully via npm i -f --legacy-peer-deps.', 'INFO', 'IMPLEMENT');
            } else {
              appendLog(`Frontend npm install notice: ${(fallbackRes.stderr || fallbackRes.stdout || npmRes.stderr || npmRes.stdout || '').slice(0, 300)}`, 'WARN', 'IMPLEMENT');
            }
          }
        } else {
          appendLog('[SIMULATION] Frontend package install (npm i -f --peer-deps) simulated.', 'INFO', 'IMPLEMENT');
        }

        // Frontend environment adaptation from Core reference host
        try {
          const envRes = adaptationLib.adaptFrontendEnvironment(clientPath, corePath, (l) => appendLog(l, 'INFO', 'IMPLEMENT'));
          modifiedCount += (envRes.modifiedFiles || []).length;
        } catch (err) {
          appendLog(`Warning: Frontend environment adaptation: ${err.message}`, 'WARN', 'IMPLEMENT');
        }

        // Pre-build source code adaptations (known mechanical migrations)
        try {
          const sourceRes = adaptationLib.adaptKnownSourceMigrations(clientPath, targetVersion, sourceVersion, (l) => appendLog(l, 'INFO', 'IMPLEMENT'));
          modifiedCount += sourceRes.adaptedFilesCount || 0;
        } catch (err) {
          appendLog(`Warning: Source code adaptation: ${err.message}`, 'WARN', 'IMPLEMENT');
        }
      }

      appendLog('Deterministic package updates, configuration, and source adaptations applied successfully (no LLM).', 'INFO', 'IMPLEMENT');

      updateJob((j) => {
        j.implementation = {
          modifiedFilesCount: modifiedCount,
          copilotDurationMs: 0,
          copilotExitCode: 0,
          fastPatchMode: isAutoPatch,
        };
        j.completedStages.push('IMPLEMENT');
        j.stageMetrics.IMPLEMENT = {
          startedAt: j.stageMetrics.IMPLEMENT.startedAt,
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - stage4Start,
          status: 'COMPLETED',
        };
      });
      appendLog('Implementation stage completed successfully.', 'INFO', 'IMPLEMENT');
    }

    // -----------------------------------------------------------------------
    // STAGE 5: VERIFY (with Bounded Repair)
    // -----------------------------------------------------------------------
    const stage5Start = Date.now();
    appendLog('Executing deterministic local verification checks...', 'INFO', 'VERIFY');
    updateJob((j) => {
      j.currentStage = 'VERIFY';
      j.stageMetrics.VERIFY = { startedAt: new Date().toISOString(), status: 'RUNNING' };
    });

    let verification = verifierLib.verify({
      clientPath,
      targetVersion,
      tracks,
      isPatch: isAutoPatch,
      upgradeMode: job.upgradeMode,
      breakingChangesCount: job.preflight && job.preflight.impactPreview ? job.preflight.impactPreview.breakingChangesCount : 0,
      isSimulation,
      onLog: (l) => appendLog(l, 'INFO', 'VERIFY'),
    });

    for (const check of verification.checks) {
      appendLog(`  [${check.status}] ${check.name} (${check.durationMs}ms)`, check.ok ? 'INFO' : 'ERROR', 'VERIFY');
      if (!check.ok) {
        const compactDetails = extractCoreErrors(check.details);
        appendLog(`       Details: ${compactDetails || String(check.details || '').slice(0, 1000)}`, 'ERROR', 'VERIFY');
      }
    }

    const isFastPatchVerify = job.upgradeMode === 'FAST_PATCH' || (job.upgradeMode !== 'FULL_SEMANTIC' && isAutoPatch);

    if (verification.ok && isFastPatchVerify) {
      appendLog('[FAST_PATCH] Fast patch restore & build clean. 0 errors detected. Full upgrade LLM reasoning skipped.', 'INFO', 'VERIFY');
    }

    // Bounded Repair Loop (max 2 attempts)
    let repairAttempts = 0;
    const maxRepairs = 2;
    while (!verification.ok && repairAttempts < maxRepairs) {
      repairAttempts++;
      if (isFastPatchVerify) {
        appendLog(`[FAST_PATCH] Build/restore verification failed with errors. Escalating to Copilot CLI (${job.copilotModel || 'default'}) repair attempt ${repairAttempts}/${maxRepairs}...`, 'WARN', 'REPAIR');
      } else {
        appendLog(`Verification failed. Attempting automated repair ${repairAttempts}/${maxRepairs} (model: ${job.copilotModel || 'default'})...`, 'WARN', 'REPAIR');
      }
      updateJob((j) => { j.currentStage = 'REPAIR'; });

      const failedChecksSummary = verification.checks
        .filter((c) => !c.ok)
        .map((c) => `[${c.name}]\n${extractCoreErrors(c.details)}`)
        .join('\n\n')
        .slice(0, 3500);

      const releaseNotesContext = job.releaseNotes ? `\n\nTeam Release & Migration Notes:\n${String(job.releaseNotes).slice(0, 2000)}` : '';

      const repairPrompt = `
Automated build verification failed during upgrade to NGO Core ${targetVersion}:
${failedChecksSummary}${releaseNotesContext}

Please diagnose and provide necessary source adjustments for any API changes, TargetFramework updates, node module changes, environment files, or configuration.
`.trim();

      await copilotCli.invoke(repairPrompt, {
        cwd: clientPath,
        model: job.copilotModel || job.model,
        simulate: isSimulation,
        onLog: (l) => appendLog(l, 'INFO', 'REPAIR'),
      });

      // Re-run deterministic verification with forced re-test after mutation
      verification = verifierLib.verify({
        clientPath,
        targetVersion,
        tracks,
        isPatch: isAutoPatch,
        upgradeMode: job.upgradeMode,
        breakingChangesCount: job.preflight && job.preflight.impactPreview ? job.preflight.impactPreview.breakingChangesCount : 0,
        forceRunTests: true,
        isSimulation,
        onLog: (l) => appendLog(l, 'INFO', 'REPAIR'),
      });
      appendLog(`Re-verification result: ${verification.ok ? 'PASSED' : 'STILL FAILING'}`, verification.ok ? 'INFO' : 'WARN', 'REPAIR');
    }

    updateJob((j) => {
      j.verification = verification;
      j.repairAttempts = repairAttempts;
      j.completedStages.push('VERIFY');
      j.stageMetrics.VERIFY = {
        startedAt: j.stageMetrics.VERIFY.startedAt,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - stage5Start,
        status: verification.ok ? 'COMPLETED' : 'FAILED',
      };
      if (tracks.includes('backend')) j.trackStates.backend = verification.ok ? 'PASSED' : 'FAILED';
      if (tracks.includes('frontend')) j.trackStates.frontend = verification.ok ? 'PASSED' : 'FAILED';
    });
    appendLog(`Verification stage finished. Result: ${verification.ok ? 'PASSED' : 'FAILED'}`, verification.ok ? 'INFO' : 'WARN', 'VERIFY');

    // -----------------------------------------------------------------------
    // STAGE 6: REVIEW & AWAITING_APPROVAL
    // -----------------------------------------------------------------------
    const stage6Start = Date.now();
    appendLog('Preparing final diff review and commit gate...', 'INFO', 'REVIEW');
    updateJob((j) => {
      j.currentStage = 'REVIEW';
      j.stageMetrics.REVIEW = { startedAt: new Date().toISOString(), status: 'RUNNING' };
    });

    const review = await reviewerLib.generateReview({
      clientPath,
      targetVersion,
      model: job.copilotModel || job.model,
      verification,
      preflight: job.preflight,
      simulate: isSimulation,
      onLog: (l) => appendLog(l, 'INFO', 'REVIEW'),
    });

    try {
      const handover = adaptationLib.generateHandoverChecklist({
        runId: job.runId,
        clientId: job.clientName,
        sourceVersion,
        targetVersion,
        backendConfigResult: job.plan ? job.plan.backendConfigResult : null,
        jobDir,
      });
      review.handover = handover;
      appendLog(`Handover checklist generated (${handover.checklist.items.length} deployment item(s) in deployment-checklist.yaml).`, 'INFO', 'REVIEW');
    } catch (err) {
      appendLog(`Warning: Handover generation: ${err.message}`, 'WARN', 'REVIEW');
    }

    appendLog(`Changes detected: ${review.hasChanges}. Ready for commit: ${review.canCommit}`, 'INFO', 'REVIEW');

    const finalJob = updateJob((j) => {
      j.review = review;
      j.completedStages.push('REVIEW');
      j.currentStage = 'AWAITING_APPROVAL';
      j.status = 'AWAITING_APPROVAL';
      j.finishedAt = new Date().toISOString();
      j.stageMetrics.REVIEW = {
        startedAt: j.stageMetrics.REVIEW.startedAt,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - stage6Start,
        status: 'COMPLETED',
      };
    });

    // Record honest telemetry
    telemetryLib.recordJobTelemetry(finalJob);

    appendLog('Upgrade run reached AWAITING_APPROVAL. Awaiting user commit confirmation in UI.', 'INFO', 'AWAITING_APPROVAL');
    process.exit(0);

  } catch (err) {
    appendLog(`Execution error: ${err.stack || err.message}`, 'ERROR', 'SYSTEM');
    const failedJob = updateJob((j) => {
      j.status = 'FAILED';
      j.error = err.message;
      j.finishedAt = new Date().toISOString();
    });
    telemetryLib.recordJobTelemetry(failedJob);
    process.exit(1);
  }
}

runWorker();

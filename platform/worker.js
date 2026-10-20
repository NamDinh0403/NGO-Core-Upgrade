'use strict';
/*
 * Background Upgrade Worker Process.
 *
 * Executes the stages of an upgrade engagement sequentially:
 *   PREFLIGHT -> CORE_INGEST -> PLAN -> IMPLEMENT -> VERIFY -> (REPAIR) -> REVIEW
 * Runs non-interactively; writes progress events and logs to the durable job store.
 * Dependency-free, Node 14+.
 */

const fs = require('fs');
const path = require('path');
const preflightLib = require('./preflight');
const verifierLib = require('./verifier');
const reviewerLib = require('./reviewer');
const copilotCli = require('./copilot-cli');
const telemetryLib = require('./telemetry');
const nugetSources = require('./nuget-sources');

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

function readJob() {
  return JSON.parse(fs.readFileSync(jobFile, 'utf8'));
}

function updateJob(mutator) {
  const job = readJob();
  mutator(job);
  job.updatedAt = new Date().toISOString();
  fs.writeFileSync(jobFile, JSON.stringify(job, null, 2));
  return job;
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
  const formatted = `[${timestamp}] [${lvl}] [${stg}] ${line}\n`;
  fs.appendFileSync(logFile, formatted);
  console.log(line);
}

async function runWorker() {
  let job = readJob();
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

      const preflightResult = preflightLib.runPreflight({
        clientPath,
        targetVersion,
        corePath,
        tracks,
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
    }

    // -----------------------------------------------------------------------
    // STAGE 2: CORE_INGEST
    // -----------------------------------------------------------------------
    const stage2Start = Date.now();
    if (job.completedStages.includes('CORE_INGEST')) {
      appendLog('Already completed; candidate reused.', 'INFO', 'CORE_INGEST');
    } else {
      appendLog('Ingesting Core facts and building candidate changeset...', 'INFO', 'CORE_INGEST');
      updateJob((j) => {
        j.currentStage = 'CORE_INGEST';
        j.stageMetrics.CORE_INGEST = { startedAt: new Date().toISOString(), status: 'RUNNING' };
      });

      const ingestLib = require('../ingest/tools/ingest');
      const ingestOut = path.join(jobDir, 'candidates');
      fs.mkdirSync(ingestOut, { recursive: true });

      const ingestResult = ingestLib.ensureReleases({
        'core-path': corePath,
        since: job.preflight ? job.preflight.currentVersion : undefined,
        target: targetVersion,
        out: ingestOut,
      });

      appendLog(`Core release processed. Reused: ${ingestResult.reused}`, 'INFO', 'CORE_INGEST');
      updateJob((j) => {
        j.ingest = {
          reused: ingestResult.reused,
          entriesCount: ingestResult.entries.length,
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

      const plan = {
        targetVersion,
        tracks,
        tasks: [
          { track: 'backend', action: 'Update NGO.Core NuGet package versions in .csproj files' },
          { track: 'frontend', action: 'Align @ngo/core dependency in package.json' },
        ],
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
              if (text !== orig) {
                fs.writeFileSync(full, text);
                appendLog(`Updated NGO.Core references to ${targetVersion} in ${path.relative(clientPath, full)}`, 'INFO', 'IMPLEMENT');
                modifiedCount++;
              }
            }
          }
        };
        const apiDir = path.join(clientPath, 'ngo-api');
        updateCsproj(fs.existsSync(apiDir) ? apiDir : clientPath);
      }

      // Frontend updates
      if (tracks.includes('frontend')) {
        const clientDir = path.join(clientPath, 'ngo-client');
        const pkgFile = path.join(fs.existsSync(clientDir) ? clientDir : clientPath, 'package.json');
        if (fs.existsSync(pkgFile)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
            let pkgModified = false;
            for (const scope of ['dependencies', 'devDependencies']) {
              if (pkg[scope]) {
                for (const dep of Object.keys(pkg[scope])) {
                  if (dep.includes('ngo-core') || dep.includes('@ngo/core')) {
                    pkg[scope][dep] = targetVersion;
                    pkgModified = true;
                  }
                }
              }
            }
            if (pkgModified) {
              fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2));
              appendLog(`Updated @ngo/core dependencies to ${targetVersion} in package.json`, 'INFO', 'IMPLEMENT');
              modifiedCount++;
            }
          } catch (_) {}
        }
      }

      // Check if Fast Patch mode applies
      const preflightLib = require('./preflight');
      const isAutoPatch = preflightLib.classifyUpgradeMode(
        job.preflight ? job.preflight.currentVersion : null,
        targetVersion
      ).isPatch;
      const isFastPatch = job.upgradeMode === 'FAST_PATCH' || (job.upgradeMode !== 'FULL_SEMANTIC' && isAutoPatch);

      // Copilot CLI semantic reasoning (or fast patch skip)
      let copilotRes = { ok: true, durationMs: 0, exitCode: 0, model: job.copilotModel || 'default' };

      if (!isFastPatch) {
        appendLog(`Invoking Copilot CLI (${job.copilotModel || 'default'}) for semantic reasoning and configuration checks...`, 'INFO', 'IMPLEMENT');
        const copilotTask = `
Upgrade task for client project ${path.basename(clientPath)} to NGO Core ${targetVersion}.
Target packages updated. Analyze changed references and verify configuration alignment.
`.trim();

        copilotRes = await copilotCli.invoke(copilotTask, {
          cwd: clientPath,
          model: job.copilotModel || job.model,
          simulate: isSimulation,
          onLog: (l) => appendLog(l, 'INFO', 'IMPLEMENT'),
        });
      } else {
        appendLog(`[FAST_PATCH] Small patch update detected (v${job.preflight ? job.preflight.currentVersion : 'current'} -> v${targetVersion}). Version numbers updated directly in package files. Copilot semantic invocation deferred.`, 'INFO', 'IMPLEMENT');
      }

      updateJob((j) => {
        j.implementation = {
          modifiedFilesCount: modifiedCount,
          copilotDurationMs: copilotRes.durationMs,
          copilotExitCode: copilotRes.exitCode,
          fastPatchMode: isFastPatch,
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
    });

    for (const check of verification.checks) {
      appendLog(`  [${check.status}] ${check.name} (${check.durationMs}ms)`, check.ok ? 'INFO' : 'ERROR', 'VERIFY');
      if (!check.ok) appendLog(`       Details: ${check.details}`, 'ERROR', 'VERIFY');
    }

    const preflightLibCheck = require('./preflight');
    const isFastPatchVerify = job.upgradeMode === 'FAST_PATCH' || (job.upgradeMode !== 'FULL_SEMANTIC' && preflightLibCheck.classifyUpgradeMode(job.preflight ? job.preflight.currentVersion : null, targetVersion).isPatch);

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

      const failedChecksSummary = verification.checks.filter((c) => !c.ok).map((c) => `${c.name}: ${c.details}`).join('\n');
      const repairPrompt = `
Automated build verification failed during upgrade to NGO Core ${targetVersion}:
${failedChecksSummary}
Please diagnose and provide necessary source adjustments.
`.trim();

      await copilotCli.invoke(repairPrompt, {
        cwd: clientPath,
        model: job.copilotModel || job.model,
        simulate: isSimulation,
        onLog: (l) => appendLog(l, 'INFO', 'REPAIR'),
      });

      // Re-run deterministic verification
      verification = verifierLib.verify({
        clientPath,
        targetVersion,
        tracks,
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

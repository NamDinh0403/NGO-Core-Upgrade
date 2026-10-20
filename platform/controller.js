'use strict';
/*
 * Local Upgrade Controller.
 *
 * Manages durable upgrade jobs, background worker lifecycle, cancellation,
 * safe resumption, log streaming with filtering, and workspace concurrency locks.
 * Dependency-free, Node 14+.
 */

const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const runLib = require('../orchestrator/tools/lib/run');
const reviewerLib = require('./reviewer');
const telemetryLib = require('./telemetry');
const settingsLib = require('./settings');

const REPO_ROOT = path.resolve(__dirname, '..');
const RUNS_ROOT = path.join(REPO_ROOT, 'orchestrator', 'runs');
const WORKER_SCRIPT = path.join(__dirname, 'worker.js');

// In-memory active process handles and workspace locks
const activeProcesses = new Map(); // jobId -> ChildProcess
const workspaceLocks = new Set();  // clientPath

function sanitizeClientName(name) {
  return String(name || 'client').replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
}

/**
 * Ensure storage directory for a job.
 */
function getJobDir(clientId, runId) {
  const dir = path.join(RUNS_ROOT, clientId, runId, 'platform');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Check whether a workspace path is within approved workspace roots.
 */
function isWorkspaceApproved(clientPath) {
  const settings = settingsLib.loadSettings();
  const normalized = path.resolve(clientPath);

  // Allow test temporary paths in os.tmpdir() for automated tests
  if (normalized.startsWith(path.resolve(require('os').tmpdir()))) {
    return true;
  }

  for (const root of settings.approvedWorkspaceRoots || []) {
    const normRoot = path.resolve(root);
    if (normalized === normRoot || normalized.startsWith(normRoot + path.sep)) {
      return true;
    }
  }
  return false;
}

/**
 * Create and start a new upgrade job.
 */
function createJob(options) {
  const { clientPath, targetVersion, corePath, tracks, simulateCopilot, copilotModel } = options;
  const clientId = sanitizeClientName(path.basename(clientPath));

  if (!isWorkspaceApproved(clientPath)) {
    throw new Error(`Workspace path ${clientPath} is not within approved workspace roots. Configure in Settings.`);
  }

  // Concurrency check: prevent conflicting runs in the same workspace
  if (workspaceLocks.has(clientPath)) {
    throw new Error(`An upgrade job is already running for client at ${clientPath}. Cancel or wait for it to finish.`);
  }

  // Clean previous run logs and directories for this client so every upgrade starts clean
  const clientRunsDir = path.join(RUNS_ROOT, clientId);
  if (fs.existsSync(clientRunsDir)) {
    try {
      for (const entry of fs.readdirSync(clientRunsDir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          fs.rmSync(path.join(clientRunsDir, entry.name), { recursive: true, force: true });
        }
      }
    } catch (_) {}
  }

  const runId = runLib.newRunId(clientId);
  const jobDir = getJobDir(clientId, runId);
  const jobFile = path.join(jobDir, 'job.json');

  const selectedTracks = tracks || ['backend', 'frontend'];
  const selectedModel = copilotModel || options.model || (settingsLib.loadSettings().copilotModel || 'auto');
  const selectedMode = options.upgradeMode || (settingsLib.loadSettings().defaultUpgradeMode || 'AUTO');
  const job = {
    id: `${clientId}/${runId}`,
    runId,
    clientId,
    clientName: path.basename(clientPath),
    clientPath,
    targetVersion,
    corePath: corePath || path.join(path.resolve(REPO_ROOT, '..'), 'ngo-online-core'),
    tracks: selectedTracks,
    status: 'QUEUED',
    currentStage: 'PENDING',
    completedStages: [],
    stageMetrics: {},
    trackStates: {
      backend: selectedTracks.includes('backend') ? 'QUEUED' : 'SKIPPED',
      frontend: selectedTracks.includes('frontend') ? 'QUEUED' : 'SKIPPED',
    },
    repairAttempts: 0,
    copilotModel: selectedModel,
    upgradeMode: selectedMode,
    simulateCopilot: Boolean(simulateCopilot),
    createdAt: new Date().toISOString(),
    startedAt: null,
    finishedAt: null,
    error: null,
    preflight: null,
    ingest: null,
    plan: null,
    implementation: null,
    verification: null,
    review: null,
  };

  fs.writeFileSync(jobFile, JSON.stringify(job, null, 2));

  // Spawn background worker process
  spawnWorker(jobFile, clientPath, job.id);

  return job;
}

/**
 * Spawn the background worker process.
 */
function spawnWorker(jobFile, clientPath, jobId) {
  workspaceLocks.add(clientPath);

  const child = cp.spawn(process.execPath, [WORKER_SCRIPT, '--job-file', jobFile], {
    cwd: REPO_ROOT,
    detached: false,
    windowsHide: true,
    stdio: ['ignore', 'ignore', 'ignore'],
  });

  activeProcesses.set(jobId, child);

  child.on('close', (code) => {
    activeProcesses.delete(jobId);
    workspaceLocks.delete(clientPath);

    // If job was still running when process closed with error, update status
    try {
      const job = JSON.parse(fs.readFileSync(jobFile, 'utf8'));
      if (job.status === 'RUNNING' && code !== 0) {
        job.status = 'FAILED';
        job.error = `Worker process exited unexpectedly with code ${code}`;
        job.finishedAt = new Date().toISOString();
        fs.writeFileSync(jobFile, JSON.stringify(job, null, 2));
        telemetryLib.recordJobTelemetry(job);
      }
    } catch (_) {}
  });

  return child;
}

/**
 * Get job record by ID (e.g. "ngo-online-brc/run-2026-10-13...").
 */
function getJob(jobId) {
  const parts = String(jobId).split('/');
  if (parts.length !== 2) return null;
  const [clientId, runId] = parts;
  const jobFile = path.join(getJobDir(clientId, runId), 'job.json');

  if (!fs.existsSync(jobFile)) return null;
  try {
    return JSON.parse(fs.readFileSync(jobFile, 'utf8'));
  } catch (_) {
    return null;
  }
}

/**
 * Append a structured log line to a job's log.
 */
function appendJobLog(jobId, message, level, stage) {
  const parts = String(jobId).split('/');
  if (parts.length !== 2) return;
  const [clientId, runId] = parts;
  const logFile = path.join(getJobDir(clientId, runId), 'worker.log');
  const lvl = (level || 'INFO').toUpperCase();
  const stg = (stage || 'SYSTEM').toUpperCase();
  const line = `[${new Date().toISOString()}] [${lvl}] [${stg}] ${message}\n`;
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, line, 'utf8');
}

/**
 * Read logs for a job with severity and text filtering.
 */
function getJobLogs(jobId, options) {
  options = options || {};
  const sinceLine = typeof options === 'number' ? options : (options.sinceLine || 0);
  const level = options.level ? String(options.level).toUpperCase() : null;
  const search = options.search ? String(options.search).toLowerCase() : null;

  const parts = String(jobId).split('/');
  if (parts.length !== 2) {
    const empty = [];
    empty.lines = [];
    empty.logs = [];
    empty.totalLines = 0;
    return empty;
  }
  const [clientId, runId] = parts;
  const logFile = path.join(getJobDir(clientId, runId), 'worker.log');

  if (!fs.existsSync(logFile)) {
    const empty = [];
    empty.lines = [];
    empty.logs = [];
    empty.totalLines = 0;
    return empty;
  }

  try {
    const text = fs.readFileSync(logFile, 'utf8');
    let lines = text.split(/\r?\n/).filter(Boolean);
    const totalLines = lines.length;

    if (sinceLine > 0) {
      lines = lines.slice(sinceLine);
    }
    if (level && level !== 'ALL') {
      lines = lines.filter((l) => l.includes(`[${level}]`));
    }
    if (search) {
      lines = lines.filter((l) => l.toLowerCase().includes(search));
    }

    lines.lines = lines;
    lines.logs = lines;
    lines.totalLines = totalLines;
    return lines;
  } catch (_) {
    const empty = [];
    empty.lines = [];
    empty.logs = [];
    empty.totalLines = 0;
    return empty;
  }
}

/**
 * Cancel an active job.
 */
function cancelJob(jobId) {
  const job = getJob(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  const child = activeProcesses.get(jobId);
  if (child) {
    try {
      child.kill('SIGTERM');
    } catch (_) {}
    activeProcesses.delete(jobId);
  }

  workspaceLocks.delete(job.clientPath);

  const parts = String(jobId).split('/');
  const jobFile = path.join(getJobDir(parts[0], parts[1]), 'job.json');
  job.status = 'CANCELLED';
  job.finishedAt = new Date().toISOString();
  fs.writeFileSync(jobFile, JSON.stringify(job, null, 2));

  telemetryLib.recordJobTelemetry(job);
  return job;
}

/**
 * Resume a stopped or cancelled job.
 */
function resumeJob(jobId) {
  const job = getJob(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  if (activeProcesses.has(jobId)) {
    throw new Error(`Job ${jobId} is currently running`);
  }

  if (workspaceLocks.has(job.clientPath)) {
    throw new Error(`Workspace ${job.clientPath} is currently locked by another operation`);
  }

  const parts = String(jobId).split('/');
  const jobFile = path.join(getJobDir(parts[0], parts[1]), 'job.json');

  job.status = 'QUEUED';
  job.error = null;
  fs.writeFileSync(jobFile, JSON.stringify(job, null, 2));

  spawnWorker(jobFile, job.clientPath, jobId);
  return job;
}

/**
 * List recent jobs.
 */
function listJobs() {
  const jobs = [];
  if (!fs.existsSync(RUNS_ROOT)) return jobs;

  try {
    for (const client of fs.readdirSync(RUNS_ROOT)) {
      const clientDir = path.join(RUNS_ROOT, client);
      if (!fs.statSync(clientDir).isDirectory()) continue;

      for (const run of fs.readdirSync(clientDir)) {
        const jobFile = path.join(clientDir, run, 'platform', 'job.json');
        if (fs.existsSync(jobFile)) {
          try {
            jobs.push(JSON.parse(fs.readFileSync(jobFile, 'utf8')));
          } catch (_) {}
        }
      }
    }
  } catch (_) {}

  // Sort descending by creation date
  return jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Commit approved changes for a completed job.
 */
function approveAndCommit(jobId, commitMessage) {
  const job = getJob(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  if (job.status !== 'AWAITING_APPROVAL' && job.status !== 'COMPLETE') {
    throw new Error(`Job is not in AWAITING_APPROVAL state (current: ${job.status})`);
  }

  const msg = commitMessage || (job.review && job.review.defaultCommitMessage) || `chore(upgrade): upgrade NGO Core to ${job.targetVersion}`;
  const commitResult = reviewerLib.commitChanges(job.clientPath, msg);

  if (!commitResult.ok) {
    throw new Error(`Commit failed: ${commitResult.error}`);
  }

  const parts = String(jobId).split('/');
  const jobFile = path.join(getJobDir(parts[0], parts[1]), 'job.json');
  job.status = 'COMPLETE';
  job.committed = commitResult;
  fs.writeFileSync(jobFile, JSON.stringify(job, null, 2));

  telemetryLib.recordJobTelemetry(job);

  return {
    ok: true,
    commitResult,
    job,
  };
}

module.exports = {
  createJob,
  getJob,
  getJobLogs,
  appendJobLog,
  cancelJob,
  resumeJob,
  listJobs,
  approveAndCommit,
  isWorkspaceApproved,
};

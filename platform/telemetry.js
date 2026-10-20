'use strict';
/*
 * Honest Usage Ledger and Telemetry Service.
 *
 * Captures observable runtime metrics per upgrade job and Copilot invocation.
 * Strictly separates OBSERVED metrics from UNAVAILABLE telemetry (such as tokens/costs).
 * Never fabricates token counts, credits, or financial savings.
 * Dependency-free, Node 14+.
 */

const fs = require('fs');
const path = require('path');

const LEDGER_FILE = path.join(__dirname, 'config', 'telemetry-ledger.jsonl');

/**
 * Record a completed or updated job's telemetry record.
 */
function recordJobTelemetry(job) {
  if (!job || (!job.id && !job.jobId)) return null;

  const jobId = job.id || job.jobId;
  const clientName = job.client || job.clientName || job.clientId || 'unknown-client';
  const clientId = job.clientId || clientName;

  const observed = job.observed || {
    copilotInvocations: (job.implementation ? 1 : 0) + (job.repairAttempts || 0) + (job.review ? 1 : 0),
    copilotDurationMs: job.implementation ? (job.implementation.copilotDurationMs || 0) : 0,
    deterministicChecksRun: job.verification ? (job.verification.totalChecks || 0) : 0,
    repairAttempts: job.repairAttempts || 0,
    filesUpdated: job.implementation ? (job.implementation.modifiedFilesCount || 0) : 0,
  };

  const record = {
    jobId,
    runId: job.runId || null,
    clientId,
    clientName,
    client: clientName,
    targetVersion: job.targetVersion || 'unknown',
    status: job.status || 'RECORDED',
    createdAt: job.createdAt || new Date().toISOString(),
    startedAt: job.startedAt || null,
    finishedAt: job.finishedAt || null,
    durationMs: job.durationMs || (job.startedAt && job.finishedAt ? new Date(job.finishedAt) - new Date(job.startedAt) : null),

    observed,

    // Observable Copilot CLI Invocations
    copilot: {
      invocationsCount: observed.copilotInvocations,
      totalDurationMs: observed.copilotDurationMs,
      model: job.copilotModel || process.env.COPILOT_MODEL || 'gpt-4o',
      simulated: Boolean(job.simulateCopilot),
      tokenTelemetry: {
        status: 'UNAVAILABLE',
        reason: 'Token counts and billing credit telemetry are not emitted by the local Copilot CLI process stream.',
        inputTokens: null,
        outputTokens: null,
      },
      costTelemetry: {
        status: 'UNAVAILABLE',
        reason: 'Monetary cost and credit consumption are managed at GitHub Organization tier and unavailable locally.',
        estimatedCostUsd: null,
      },
    },

    // Deterministic Work (Completed without LLM calls)
    deterministicWork: {
      preflightPassed: job.preflight ? !job.preflight.isBlocked : false,
      resolutionMode: job.preflight && job.preflight.impactPreview ? job.preflight.impactPreview.mode : null,
      cacheHit: job.ingest ? Boolean(job.ingest.reused) : false,
      filesModifiedCount: observed.filesUpdated,
      verificationPassed: job.verification ? Boolean(job.verification.ok) : false,
      totalChecksRun: observed.deterministicChecksRun,
      checksPassed: job.verification ? (job.verification.passedChecks || 0) : 0,
      checksFailed: job.verification ? (job.verification.failedChecks || 0) : 0,
    },

    repairIterations: observed.repairAttempts,
    stagesCompleted: job.completedStages || [],
    recordedAt: new Date().toISOString(),
    timestamp: new Date().toISOString(),
  };

  try {
    fs.mkdirSync(path.dirname(LEDGER_FILE), { recursive: true });
    fs.appendFileSync(LEDGER_FILE, JSON.stringify(record) + '\n');
  } catch (_) {}

  return record;
}

/**
 * Read all telemetry records from ledger.
 */
function readLedger() {
  if (!fs.existsSync(LEDGER_FILE)) return [];
  try {
    const lines = fs.readFileSync(LEDGER_FILE, 'utf8').split(/\r?\n/).filter(Boolean);
    const records = [];
    for (const l of lines) {
      try { records.push(JSON.parse(l)); } catch (_) {}
    }
    return records;
  } catch (_) {
    return [];
  }
}

/**
 * Query telemetry records with optional filters.
 */
function queryTelemetry(filters) {
  filters = filters || {};
  let records = readLedger();

  if (filters.client) {
    records = records.filter((r) => r.client === filters.client || r.clientName === filters.client || r.clientId === filters.client);
  }
  if (filters.clientId) {
    records = records.filter((r) => r.clientId === filters.clientId);
  }
  if (filters.targetVersion) {
    records = records.filter((r) => r.targetVersion === filters.targetVersion);
  }
  if (filters.status) {
    records = records.filter((r) => r.status === filters.status);
  }
  if (filters.dateFrom) {
    const fromTime = new Date(filters.dateFrom).getTime();
    records = records.filter((r) => new Date(r.createdAt).getTime() >= fromTime);
  }
  if (filters.dateTo) {
    const toTime = new Date(filters.dateTo).getTime();
    records = records.filter((r) => new Date(r.createdAt).getTime() <= toTime);
  }

  return records.reverse(); // newest first
}

/**
 * Compute honest aggregated telemetry summary.
 */
function getTelemetrySummary(filters) {
  const records = queryTelemetry(filters);

  let totalDurationMs = 0;
  let totalCopilotInvocations = 0;
  let totalCopilotDurationMs = 0;
  let totalDeterministicChecks = 0;
  let totalFilesModified = 0;
  let totalRepairIterations = 0;
  let totalCacheHits = 0;
  let successfulUpgrades = 0;

  for (const r of records) {
    if (r.durationMs) totalDurationMs += r.durationMs;
    totalCopilotInvocations += r.copilot?.invocationsCount || r.observed?.copilotInvocations || 0;
    totalCopilotDurationMs += r.copilot?.totalDurationMs || r.observed?.copilotDurationMs || 0;
    totalDeterministicChecks += r.deterministicWork?.totalChecksRun || r.observed?.deterministicChecksRun || 0;
    totalFilesModified += r.deterministicWork?.filesModifiedCount || r.observed?.filesUpdated || 0;
    totalRepairIterations += r.repairIterations || r.observed?.repairAttempts || 0;
    if (r.deterministicWork?.cacheHit) totalCacheHits++;
    if (r.status === 'COMPLETE' || r.status === 'AWAITING_APPROVAL') successfulUpgrades++;
  }

  return {
    totalJobs: records.length,
    successfulUpgrades,
    totalDurationMs,
    totalCopilotInvocations,
    totalCopilotDurationMs,
    totalDeterministicChecks,
    totalChecksRun: totalDeterministicChecks,
    totalFilesModified,
    totalFilesUpdated: totalFilesModified,
    totalRepairIterations,
    totalCacheHits,
    tokenCounts: {
      status: 'UNAVAILABLE',
      diagnosticNote: 'GitHub Copilot CLI subprocess streams do not emit token telemetry.',
    },
    monetaryCost: {
      status: 'UNAVAILABLE',
      diagnosticNote: 'GitHub Copilot pricing is subscription-managed and unavailable locally.',
    },
    // Explicit disclosure of telemetry boundaries
    dataDisclosures: {
      observedMetrics: [
        'Job counts and run durations',
        'Copilot invocation counts and response durations',
        'Deterministic checks run, passed, and failed',
        'Source files modified',
        'Cache hits/misses for Core releases',
        'Automated repair loop iterations',
      ],
      unavailableMetrics: [
        {
          metric: 'Token Counts (Prompt & Completion)',
          status: 'UNAVAILABLE',
          reason: 'Copilot CLI does not expose token telemetry in subprocess streams.',
        },
        {
          metric: 'Monetary Cost ($)',
          status: 'UNAVAILABLE',
          reason: 'GitHub Copilot licenses are flat-rate or billed via GitHub enterprise organization tiers.',
        },
      ],
    },
    recentRecords: records.slice(0, 50),
  };
}

module.exports = {
  recordJobTelemetry,
  recordTelemetryEntry: recordJobTelemetry,
  queryTelemetry,
  getTelemetryEntries: queryTelemetry,
  getTelemetrySummary,
  LEDGER_FILE,
};

'use strict';
/*
 * Merges each track's own coverage signal into ONE requirement-coverage.yaml
 * + missing-steps.yaml, run once per shared run by
 * `orchestrator compose-results` -> `orchestrator verify-coverage`.
 *
 * frontend/ already writes a structured requirement-coverage.yaml per run —
 * reused verbatim (source: 'frontend-track').
 * backend/ has no structured per-requirement coverage file today (confirmed
 * by inspection: only state.json + free-text developer-review-*.md). Rather
 * than fabricate structured items that don't exist, this synthesizes one
 * track-level entry from backend's own state.json signal (source:
 * 'backend-track-synthetic') so the gap stays visible instead of silently
 * omitted.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('./yaml');

function readFrontendCoverage(frontendRunDir) {
  if (!frontendRunDir) return [];
  const p = path.join(frontendRunDir, 'requirement-coverage.yaml');
  if (!fs.existsSync(p)) return [];
  const parsed = yaml.parse(fs.readFileSync(p, 'utf8'));
  return (parsed.requirements || []).map((r) => Object.assign({}, r, {
    scope: r.scope || 'FRONTEND',
    source: 'frontend-track'
  }));
}

// backend/state.json has no per-requirement breakdown. Derive one synthetic,
// clearly-labelled entry per unresolved issue / blocked step, plus one
// overall track-level entry, so backend's own outstanding work is visible
// in the SAME merged report instead of requiring a second document.
function readBackendCoverage(backendState) {
  if (!backendState) return [];
  const entries = [];
  const unresolved = backendState.unresolvedIssues || [];
  for (let i = 0; i < unresolved.length; i++) {
    entries.push({
      id: `BACKEND-UNRESOLVED-${i + 1}`,
      scope: 'BACKEND',
      status: 'BLOCKED',
      source: 'backend-track-synthetic',
      evidence: typeof unresolved[i] === 'string' ? unresolved[i] : JSON.stringify(unresolved[i]),
      owner: null
    });
  }
  const pending = backendState.pendingSteps || [];
  const overallStatus = backendState.status === 'SUCCEEDED' && pending.length === 0 ? 'VERIFIED'
    : backendState.status === 'SUCCEEDED' ? 'IMPLEMENTED'
      : backendState.status === 'FAILED' || backendState.status === 'BLOCKED' ? 'BLOCKED'
        : 'PLANNED';
  entries.push({
    id: 'BACKEND-TRACK-OVERALL',
    scope: 'BACKEND',
    status: overallStatus,
    source: 'backend-track-synthetic',
    evidence: `backend state.json status=${backendState.status}, currentPhase=${backendState.currentPhase}, pendingSteps=[${pending.join(', ')}]. Backend emits no structured per-requirement coverage file today — see docs/refactor/unified-agent-decisions.md (DEC-1). Consult the backend run's own report for requirement-level detail.`,
    owner: null
  });
  return entries;
}

const REASONS = {
  NOT_APPLICABLE_WITH_EVIDENCE: null,
  VERIFIED: null,
  DECISION_PENDING: 'requires a developer/PM decision',
  RESEARCH_REQUIRED: 'applicability or mapping unresolved; research required',
  PLANNED: 'applicable and mapped but not yet implemented',
  IMPLEMENTED: 'implemented but not yet verified',
  MANUAL_ACTION_PENDING: 'manual action without confirmed completion',
  FAILED: 'attempted and failed',
  BLOCKED: 'blocking issue prevents progress'
};

function buildMissingSteps(requirements) {
  const items = [];
  for (const r of requirements) {
    const reason = REASONS[r.status];
    if (reason) {
      items.push({ id: r.id, scope: r.scope, status: r.status, reason, owner: r.owner || null });
    }
  }
  return items;
}

function verifyCoverage({ runId, frontendRunDir, backendState, domainEvidenceRefs }) {
  const requirements = [...readFrontendCoverage(frontendRunDir), ...readBackendCoverage(backendState)];
  for (const file of domainEvidenceRefs || []) {
    const evidence = JSON.parse(fs.readFileSync(file, 'utf8'));
    const rejected = new Set((evidence.secretRejections || []).map((entry) => entry.id));
    for (const entry of evidence.coverage || []) requirements.push({
      id: entry.id, scope: 'BACKEND', source: 'orchestrator',
      status: rejected.has(entry.id) ? 'BLOCKED' : entry.status,
      owner: 'backend', evidence: `${file}: ${entry.id}; configuration values remain backend-owned`
    });
  }
  const verifiedOrNA = requirements.filter((r) => r.status === 'VERIFIED' || r.status === 'NOT_APPLICABLE_WITH_EVIDENCE').length;
  const coverage = {
    schemaVersion: 1,
    runId,
    generatedAt: new Date().toISOString(),
    requirements,
    summary: {
      total: requirements.length,
      verifiedOrNotApplicable: verifiedOrNA,
      outstanding: requirements.length - verifiedOrNA
    }
  };
  const missingSteps = {
    schemaVersion: 1,
    runId,
    items: buildMissingSteps(requirements)
  };
  return { coverage, missingSteps };
}

module.exports = { readFrontendCoverage, readBackendCoverage, buildMissingSteps, verifyCoverage };

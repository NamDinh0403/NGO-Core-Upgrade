'use strict';
/*
 * Requirement coverage validator + missing-step detector
 * (IRequirementCoverageValidator + IMissingStepDetector).
 * Deterministically compares canonical applicable requirements against the
 * plan, client mapping, changed files, verification, and deployment handover,
 * and computes per-requirement status plus planning/completion gates.
 * Dependency-free, Node 14+.
 */

const DEPLOYMENT_SCOPES = new Set(['DEPLOYMENT', 'AZURE', 'SHAREPOINT', 'PIPELINE']);
const MANUAL_AUTOMATION = new Set(['MANUAL_DECISION', 'MANUAL_EXECUTION', 'REPORT_ONLY']);

// ctx per requirement id:
//   applicability: { status }   (from applicability.evaluate)
//   mapping:       { mapped, targets }   (from requirement-map.map)
//   planned:       Set<id>
//   changed:       { id: [files] }
//   verified:      Set<id>
//   owners:        { id: owner }   (assigned manual owners)
function deriveStatus(req, ctx) {
  const appl = (ctx.applicability && ctx.applicability[req.id]) || { status: 'RESEARCH_REQUIRED' };
  if (appl.status === 'NOT_APPLICABLE_WITH_EVIDENCE') return 'NOT_APPLICABLE_WITH_EVIDENCE';
  if (appl.status === 'RESEARCH_REQUIRED') return 'RESEARCH_REQUIRED';
  if (appl.status === 'DECISION_PENDING') return 'DECISION_PENDING';

  // Applicable from here on.
  if (ctx.verified && ctx.verified.has(req.id)) return 'VERIFIED';
  if (ctx.changed && ctx.changed[req.id] && ctx.changed[req.id].length) return 'IMPLEMENTED';

  const isManual = MANUAL_AUTOMATION.has(req.automation) || DEPLOYMENT_SCOPES.has(req.scope);
  if (isManual) {
    const owner = (ctx.owners && ctx.owners[req.id]) || req.owner;
    return owner ? 'MANUAL_ACTION_PENDING' : 'BLOCKED';
  }

  const mapped = ctx.mapping && ctx.mapping[req.id] && ctx.mapping[req.id].mapped;
  if (ctx.planned && ctx.planned.has(req.id)) {
    return mapped ? 'PLANNED' : 'RESEARCH_REQUIRED';
  }
  // Applicable, automatable, but absent from the plan.
  return 'BLOCKED';
}

function buildCoverage(runId, sourceVersion, targetVersion, requirements, ctx) {
  const records = [];
  for (const req of requirements) {
    const status = deriveStatus(req, ctx);
    const rec = {
      id: req.id, scope: req.scope, status,
      mappedFiles: (ctx.mapping && ctx.mapping[req.id] && ctx.mapping[req.id].targets) || [],
      changedFiles: (ctx.changed && ctx.changed[req.id]) || [],
      commands: [], verification: null,
      evidence: (ctx.applicability && ctx.applicability[req.id] && ctx.applicability[req.id].evidence) || null,
      owner: (ctx.owners && ctx.owners[req.id]) || req.owner || null,
      manualHandover: null,
    };
    if (status === 'MANUAL_ACTION_PENDING') {
      rec.manualHandover = {
        action: req.action || req.title,
        owner: rec.owner || 'deployment-owner',
        timing: req.timing,
        instructions: req.action || req.description,
        risk: req.risk,
        verification: req.validation || 'confirm completion',
      };
    }
    records.push(rec);
  }
  return { schemaVersion: 1, runId, sourceVersion, targetVersion, requirements: records };
}

function missingSteps(coverage) {
  const bad = new Set(['RESEARCH_REQUIRED', 'DECISION_PENDING', 'BLOCKED', 'FAILED']);
  return coverage.requirements
    .filter((r) => bad.has(r.status) || (r.status === 'MANUAL_ACTION_PENDING' && (!r.manualHandover || !r.manualHandover.owner)))
    .map((r) => ({ id: r.id, scope: r.scope, status: r.status, reason: reasonFor(r) }));
}

function reasonFor(r) {
  switch (r.status) {
    case 'BLOCKED': return r.mappedFiles.length ? 'applicable and mapped but absent from the plan' : 'applicable but no client implementation point mapped';
    case 'RESEARCH_REQUIRED': return 'applicability or mapping unresolved; research required';
    case 'DECISION_PENDING': return 'requires a developer/PM decision';
    case 'MANUAL_ACTION_PENDING': return 'manual action without an assigned owner';
    default: return r.status;
  }
}

function deploymentChecklist(requirements, coverage) {
  const byId = {};
  for (const r of coverage.requirements) byId[r.id] = r;
  const out = [];
  for (const req of requirements) {
    const rec = byId[req.id];
    if (!rec) continue;
    const isDeploy = DEPLOYMENT_SCOPES.has(req.scope) || req.timing === 'BEFORE_DEPLOYMENT' || req.timing === 'AFTER_DEPLOYMENT';
    if (!isDeploy) continue;
    out.push({
      id: req.id, action: req.action || req.title, owner: rec.owner || req.owner || 'deployment-owner',
      timing: req.timing, instructions: req.action || req.description, risk: req.risk,
      verification: req.validation || 'confirm completion', status: rec.status,
    });
  }
  return out;
}

// Planning gate: every applicable requirement must be dispositioned (planned,
// manual-with-owner, or not-applicable/decision surfaced). No BLOCKED items.
function planReady(coverage) {
  const blocking = coverage.requirements.filter((r) => r.status === 'BLOCKED'
    || (r.status === 'MANUAL_ACTION_PENDING' && (!r.manualHandover || !r.manualHandover.owner)));
  return { ready: blocking.length === 0, blocking: blocking.map((r) => r.id) };
}

// Completion gate: no applicable requirement may remain unmapped/unplanned/
// unimplemented/unverified or be a manual item without an owner.
function completionReady(coverage) {
  const terminalOk = new Set(['VERIFIED', 'NOT_APPLICABLE_WITH_EVIDENCE']);
  const reasons = [];
  for (const r of coverage.requirements) {
    if (terminalOk.has(r.status)) continue;
    if (r.status === 'MANUAL_ACTION_PENDING' && r.manualHandover && r.manualHandover.owner) continue;
    reasons.push(`${r.id}: ${r.status}`);
  }
  return { complete: reasons.length === 0, blockingReasons: reasons };
}

module.exports = {
  deriveStatus, buildCoverage, missingSteps, deploymentChecklist,
  planReady, completionReady,
};

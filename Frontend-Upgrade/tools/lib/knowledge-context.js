'use strict';
/*
 * Release context packet builder (keeps LLM prompts small).
 * Assembles ONLY the minimal context needed for one requirement decision:
 * the current release range, applicable requirement IDs, the current
 * requirement, relevant Core/client evidence, applicable policy, known failed
 * patterns, uncertainty, and the required output schema id. Full raw notes and
 * evidence stay OUTSIDE the model context (on disk under runs/).
 * Dependency-free, Node 14+.
 */

function buildPacket(input) {
  const range = input.range || {};
  return {
    releaseRange: { source: range.sourceVersion, target: range.targetVersion },
    applicableRequirementIds: (input.applicableRequirements || []).map((r) => r.id),
    reusableMigrations: range.reusableMigrations || [],
    currentRequirement: input.currentRequirement
      ? pickRequirement(input.currentRequirement)
      : null,
    coreEvidence: trim(input.coreEvidence, 2000),
    clientEvidence: trim(input.clientEvidence, 2000),
    applicablePolicy: input.policy || null,
    knownFailedPatterns: input.failedPatterns || [],
    uncertainty: input.uncertainty || [],
    outputSchema: input.outputSchema || null,
  };
}

function pickRequirement(r) {
  return {
    id: r.id, releaseVersion: r.releaseVersion, title: r.title, scope: r.scope,
    category: r.category, timing: r.timing, applicability: r.applicability,
    semanticRoles: r.semanticRoles || [], action: r.action, automation: r.automation,
    validation: r.validation, risk: r.risk, confidence: r.confidence,
  };
}

function trim(v, max) {
  if (v == null) return null;
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return s.length > max ? s.slice(0, max) + '...[truncated]' : v;
}

module.exports = { buildPacket, pickRequirement };

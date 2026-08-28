'use strict';
/*
 * Knowledge candidate generator (IKnowledgeCandidateGenerator).
 * When a run discovers a discrepancy between canonical release knowledge and
 * reality (e.g. an incomplete release note, an unmapped requirement, a new
 * client pattern), it emits a redacted CANDIDATE - never approved knowledge.
 * Dependency-free, Node 14+.
 */
const core = require('./core');

function redact(v) {
  if (v == null) return v;
  const red = core.redactor({});
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return red(s);
}

function generate(discrepancy) {
  const d = discrepancy || {};
  return {
    schemaVersion: 1,
    id: `CAND-${d.requirementId || 'GENERIC'}-${Date.now()}`,
    kind: d.kind || 'RELEASE_KNOWLEDGE_CANDIDATE',
    requirementId: d.requirementId || null,
    summary: redact(d.summary || 'discrepancy discovered during a run'),
    observed: redact(d.observed || null),
    expected: redact(d.expected || null),
    evidence: redact(d.evidence || null),
    status: 'CANDIDATE',
    approved: false,
  };
}

function generateAll(discrepancies) {
  return (discrepancies || []).map(generate);
}

module.exports = { generate, generateAll };

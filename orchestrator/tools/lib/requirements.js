'use strict';
/*
 * Splits the shared ingest candidate record (ingest/knowledge/candidates/
 * releases/<version>.json) plus an optional feature-decisions.yaml into the
 * normalized per-domain requirement seeds each track is handed. This is
 * additive context for each track's own planning — it does not replace
 * either track's own requirement-derivation skill
 * (backend/skills/plan-upgrade, frontend/skills/derive-release-requirements).
 */
const fs = require('fs');
const path = require('path');
const yaml = require('./yaml');

function loadCandidateRecord(ingestRoot, version) {
  const candidatePath = path.join(ingestRoot, 'knowledge', 'candidates', 'releases', `${version}.json`);
  if (!fs.existsSync(candidatePath)) return null;
  return { path: candidatePath, record: JSON.parse(fs.readFileSync(candidatePath, 'utf8')) };
}

function loadFeatureDecisions(featureDecisionsPath) {
  if (!featureDecisionsPath || !fs.existsSync(featureDecisionsPath)) return { features: {} };
  const parsed = yaml.parse(fs.readFileSync(featureDecisionsPath, 'utf8'));
  return parsed && parsed.features ? parsed : { features: parsed || {} };
}

// A finding is excluded if any of its evidence text names an excluded
// feature (case-insensitive substring match on the feature key). This is a
// conservative first pass — genuine ambiguity is left for developer review,
// never silently resolved either way (findings stay in `all.yaml` either
// way; only the per-domain seed omits excluded-feature findings).
function isExcludedByDecision(finding, decisions) {
  const text = `${finding.statement || ''} ${finding.category || ''}`.toLowerCase();
  for (const [feature, decision] of Object.entries(decisions.features || {})) {
    if (decision && decision.decision === 'EXCLUDED' && text.includes(String(feature).toLowerCase())) {
      return { excluded: true, feature };
    }
  }
  return { excluded: false };
}

function splitRequirements({ ingestRoot, version, featureDecisionsPath, runId }) {
  const loaded = loadCandidateRecord(ingestRoot, version);
  const decisions = loadFeatureDecisions(featureDecisionsPath);
  const findings = loaded ? loaded.record.findings : { backend: [], frontend: [], shared: [] };
  const unresolvedItems = loaded ? loaded.record.unresolvedItems || [] : [];

  const tag = (scope) => (findings[scope] || []).map((f, idx) => {
    const decision = isExcludedByDecision(f, decisions);
    return Object.assign({ id: `${version}-${scope.toUpperCase()}-${String(idx + 1).padStart(2, '0')}` }, f, {
      excluded: decision.excluded,
      excludedByFeature: decision.excluded ? decision.feature : null
    });
  });

  const backendFindings = [...tag('backend'), ...tag('shared')];
  const frontendFindings = [...tag('frontend'), ...tag('shared')];
  const sharedFindings = tag('shared');
  const allFindings = [...tag('backend'), ...tag('frontend'), ...tag('shared')];

  return {
    all: {
      schemaVersion: 1, runId, version,
      ingestCandidateRef: loaded ? loaded.path : null,
      requirements: allFindings,
      unresolvedItems
    },
    backend: {
      schemaVersion: 1, runId, version,
      requirements: backendFindings.filter((f) => !f.excluded),
      excluded: backendFindings.filter((f) => f.excluded)
    },
    frontend: {
      schemaVersion: 1, runId, version,
      requirements: frontendFindings.filter((f) => !f.excluded),
      excluded: frontendFindings.filter((f) => f.excluded)
    },
    shared: {
      schemaVersion: 1, runId, version,
      requirements: sharedFindings.filter((f) => !f.excluded),
      excluded: sharedFindings.filter((f) => f.excluded)
    },
    decisions: {
      schemaVersion: 1, runId,
      features: decisions.features || {}
    },
    ingestCandidateRef: loaded ? loaded.path : null,
    hadCandidateRecord: !!loaded
  };
}

function writeRequirements(requirementsDir, split) {
  fs.mkdirSync(requirementsDir, { recursive: true });
  fs.writeFileSync(path.join(requirementsDir, 'all.yaml'), yaml.stringify(split.all));
  fs.writeFileSync(path.join(requirementsDir, 'backend.yaml'), yaml.stringify(split.backend));
  fs.writeFileSync(path.join(requirementsDir, 'frontend.yaml'), yaml.stringify(split.frontend));
  fs.writeFileSync(path.join(requirementsDir, 'shared.yaml'), yaml.stringify(split.shared));
  fs.writeFileSync(path.join(requirementsDir, 'decisions.yaml'), yaml.stringify(split.decisions));
}

module.exports = { loadCandidateRecord, loadFeatureDecisions, isExcludedByDecision, splitRequirements, writeRequirements };

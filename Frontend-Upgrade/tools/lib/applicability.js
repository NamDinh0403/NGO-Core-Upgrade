'use strict';
/*
 * Requirement applicability evaluator (IRequirementApplicabilityEvaluator).
 * Evaluates a release requirement against structured client evidence and
 * returns a disposition. Never guesses: ambiguous/customized items become
 * RESEARCH_REQUIRED or DECISION_PENDING rather than a silent APPLICABLE.
 * Dependency-free, Node 14+.
 */

// clientEvidence: {
//   files: [relative paths],
//   tokens: [symbols/imports/free text found in sources],
//   packages: [dependency names],
//   configKeys: [environment / runtime config keys],
//   customizedTokens: [tokens indicating client customization e.g. '-ext', 'override'],
//   enabledFeatures: [feature ids known to be enabled]
// }

function lc(s) { return String(s || '').toLowerCase(); }

function anyMatch(tokens, haystacks) {
  const hs = haystacks.map(lc);
  for (const t of tokens) {
    const needle = lc(t);
    if (!needle) continue;
    if (hs.some((h) => h.indexOf(needle) !== -1)) return t;
  }
  return null;
}

function discoveryHaystack(ev) {
  return []
    .concat(ev.files || [])
    .concat(ev.tokens || [])
    .concat(ev.packages || [])
    .concat(ev.configKeys || []);
}

function evaluate(req, clientEvidence) {
  const ev = clientEvidence || {};
  const disc = Array.isArray(req.clientDiscovery) ? req.clientDiscovery : [];
  const haystack = discoveryHaystack(ev);
  const match = disc.length ? anyMatch(disc, haystack) : null;

  const applicable = (evidence) => ({ requirementId: req.id, status: 'APPLICABLE', evidence });
  const notApplicable = (evidence) => ({ requirementId: req.id, status: 'NOT_APPLICABLE_WITH_EVIDENCE', evidence });
  const research = (evidence) => ({ requirementId: req.id, status: 'RESEARCH_REQUIRED', evidence });
  const decision = (evidence) => ({ requirementId: req.id, status: 'DECISION_PENDING', evidence, owner: req.owner || null });

  switch (req.applicability) {
    case 'ALWAYS':
      return applicable('applicability ALWAYS');
    case 'IF_FILE_EXISTS':
      return match ? applicable(`file/token matched: ${match}`) : notApplicable('no matching client file');
    case 'IF_SYMBOL_USED':
      return match ? applicable(`symbol matched: ${match}`) : notApplicable('symbol not used in client');
    case 'IF_PACKAGE_USED':
      return match ? applicable(`package matched: ${match}`) : notApplicable('package not present');
    case 'IF_CONFIGURATION_EXISTS':
      return match ? applicable(`config key matched: ${match}`) : notApplicable('configuration not present');
    case 'IF_CLIENT_CUSTOMIZED': {
      const custom = anyMatch((ev.customizedTokens || []).concat(disc), haystack);
      if (custom) return applicable(`customization evidence: ${custom}`);
      return research('customization cannot be confirmed from client evidence');
    }
    case 'IF_FEATURE_ENABLED': {
      const feat = anyMatch(disc.concat([req.title]), (ev.enabledFeatures || []));
      if (feat) return applicable(`feature enabled: ${feat}`);
      if (match) return decision('feature artifacts present; confirm the feature is enabled');
      return decision('confirm whether the feature is enabled for this client');
    }
    case 'IF_PM_APPROVES':
      return decision('requires PM approval');
    case 'IF_DATABASE_DATA_MATCHES':
      return research('requires database inspection outside the client repository');
    case 'IF_DEPLOYMENT_ENVIRONMENT_USES':
      return decision('requires deployment-environment confirmation');
    default:
      return research(`unknown applicability: ${req.applicability}`);
  }
}

function evaluateAll(requirements, clientEvidence) {
  return requirements.map((r) => evaluate(r, clientEvidence));
}

module.exports = { evaluate, evaluateAll };

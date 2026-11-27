'use strict';

const ACTION_PATTERN = /^\s*(?:[-*]\s*)?(?:install|add|update|replace|remove|copy|compare|run|configure|set|ensure|activate|execute|upgrade|delete|migrate|create|fill|grant|check)\b/im;
const ACTION_SIGNAL_PATTERN = /(?:\[(?:before|after)\s*deployment\]|\[during\s*upgrade\]|\[afterdeployment\]|\[beforedeployment\]|\[(?:for\s+)?(?:upgraded?|deployment|upgrade)(?:\s+person)?\]|\bappsettings(?:\.json)?\b|\bconnectionstrings?\b|\benvironment files?\b|\.sql\b|\brun (?:the )?(?:tool|script|job)\b|\bEF migration\b|\bpackage(?:\.json)? updates?\b|\bweb\.config\b|\bpipeline\b)/i;
const CONDITIONAL_MARKERS = [
  /\bif\s+(?:a\s+|the\s+)?client\b/i,
  /\bif\s+client\b/i,
  /\bif\s+your?\s+client\b/i,
  /\bonly\s+(?:if|when|for)\b/i,
  /\bcheck\s+whether\b/i,
  /\bcheck\s+if\b/i,
  /\bcustomiz(?:e|ed|ation|ations|ing|ations related|ation for)\b/i,
  /\bcustomis(?:e|ed|ation|ations|ing)\b/i,
  /\bAlwaysUpdate\s*=\s*1\b/i,
  /\boptional\b/i,
  /\bfeature flag\b/i,
  /\b[A-Z][A-Za-z0-9_]*\s*=\s*(?:true|false|1|0)\b/,
  /\bif\s+yes\b/i,
  /\bdepending on\b/i,
  /\bfor clients in\b/i,
  /\bper client needs\b/i,
  /\bif client (?:projects?|project)\s+(?:use|uses|using|have|has|contains?|don't|do not)\b/i,
];

const BUG_PATTERN = /\b(?:bug|fix(?:ed|es)?|error|issue|cannot|can't|doesn't|does not|failed|failure|not working|not appear|wrong|incorrect|too high|too many|should not|shouldn't|missing|lost)\b/i;
const FEATURE_PATTERN = /\b(?:new feature|enhancement|support (?:new|more|additional)|add(?:ed|s)?|introduce(?:d|s)?|new\b|enable(?:d|s)?|improve(?:d|s)?|allow(?:s|ed)?|modernize(?:d|s)?)\b/i;

function stripTags(value) {
  return String(value || '')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractUrls(text) {
  const values = String(text || '').match(/https?:\/\/[^\s<>"')\]]+/gi) || [];
  return Array.from(new Set(values
    .map((url) => url.replace(/[),.;]+$/, ''))
    .filter((url) => !/www\.onenote\.com\/api\//i.test(url))
    .filter((url) => !/https?:\/\/\[/.test(url))));
}

function extractCondition(text) {
  const lines = String(text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (/\bAlwaysUpdate\s*=\s*1\b/i.test(line)) {
      return stripTags(line).replace(/\s*[,;]\s*$/, '');
    }

    const custom = line.match(/\b(?:if|when)\b[\s\S]*?\bcustomiz[\s\S]*?(?=[:;,.]|$)/i)
      || line.match(/\b(?:if|when)\b[\s\S]*?\bcustomis[\s\S]*?(?=[:;,.]|$)/i);
    if (custom) return stripTags(custom[0]);

    const check = line.match(/\bcheck\s+(?:whether|if)\b[\s\S]*?(?=,\s+(?:and|then|please)|\.(?:\s|$)|[:;]|$)/i);
    if (check) return stripTags(check[0]);

    const ifClient = line.match(/\bif\s+(?:(?:a|the|your)\s+)?client[\s\S]*?(?=\bthen\b|,|\.|[:;]|$)/i);
    if (ifClient) return stripTags(ifClient[0]);

    const only = line.match(/\bonly\s+(?:if|when|for)\b[\s\S]*?(?=,\s*(?:then|please)|\.(?:\s|$)|[:;]|$)/i);
    if (only) return stripTags(only[0]);

    const flagged = line.match(/\b(?:optional|feature flag|for clients in|per client needs)\b[\s\S]*?(?=\.(?:\s|$)|[:;]|$)/i);
    if (flagged) return stripTags(flagged[0]);
  }

  const markerLine = lines.find((line) => CONDITIONAL_MARKERS.some((pattern) => pattern.test(line)));
  if (markerLine) {
    return stripTags(markerLine).slice(0, 260);
  }
  return null;
}

function classifyApplicability(text, metadata) {
  metadata = metadata || {};
  const allowed = ['mandatory', 'conditional', 'needs_review'];
  if (allowed.includes(metadata.applicability)) {
    return {
      applicability: metadata.applicability,
      condition: metadata.condition || (metadata.applicability === 'conditional' ? extractCondition(text) : null),
      reason: 'structured-metadata',
    };
  }
  if (metadata.condition) {
    return { applicability: 'conditional', condition: String(metadata.condition), reason: 'structured-condition' };
  }
  if (!stripTags(text).replace(/https?:\/\/\S+/g, '').trim()) {
    return { applicability: 'needs_review', condition: null, reason: 'source-label-without-action' };
  }

  const condition = extractCondition(text);
  if (condition || CONDITIONAL_MARKERS.some((pattern) => pattern.test(text))) {
    return {
      applicability: 'conditional',
      condition: condition || 'Client-specific condition named in the note; confirm the condition manually.',
      reason: 'conditional-signal',
    };
  }

  if (ACTION_SIGNAL_PATTERN.test(text) || ACTION_PATTERN.test(text)) {
    return { applicability: 'mandatory', condition: null, reason: 'unconditional-action' };
  }
  return { applicability: 'needs_review', condition: null, reason: 'ambiguous-applicability' };
}

function classifyTiming(text, metadata) {
  if (metadata && /^(before deploy|during upgrade|after deploy)$/i.test(metadata.timing || '')) {
    return metadata.timing;
  }
  if (/\b(?:before\s+deploy(?:ment)?|beforedeployment)\b/i.test(text)) return 'Before Deploy';
  if (/\b(?:after\s+deploy(?:ment)?|afterdeployment)\b/i.test(text)) return 'After Deploy';
  if (/\b(?:during upgrade|for (?:upgraded?|upgrade) person|upgrade person)\b|\[(?:for\s+)?upgrade\]/i.test(text)) return 'During Upgrade';
  if (/\b(?:deployment person|deployer|deployment pipeline)\b/i.test(text)) return 'During Upgrade';
  return 'During Upgrade';
}

function classifyOwner(text, metadata) {
  if (metadata && /^(client dev|deployer)$/i.test(metadata.owner || '')) return metadata.owner;
  if (/\b(?:for\s+)?deployment person\b|\[deployment\]|\bdeployer\b|\bafter deployment\b|\bbefore deployment\b/i.test(text)) {
    return 'Deployer';
  }
  if (/\b(?:for\s+)?upgraded?\s+person\b|\[(?:for\s+)?upgrade\]|\bclient code\b|\bclient project\b/i.test(text)) {
    return 'Client Dev';
  }
  if (/\.sql\b|\brun (?:the )?(?:tool|script|job)\b/i.test(text)) return 'Deployer';
  return 'Client Dev';
}

function isAction(text, metadata) {
  if (metadata && (metadata.category === 'upgrade_action' || metadata.applicability || metadata.timing || metadata.owner)) return true;
  if (CONDITIONAL_MARKERS.some((pattern) => pattern.test(text))) return true;
  return ACTION_PATTERN.test(text) || ACTION_SIGNAL_PATTERN.test(text);
}

function classifyCategory(text, metadata) {
  metadata = metadata || {};
  if (['feature', 'bugfix', 'upgrade_action'].includes(metadata.category)) return metadata.category;
  const headline = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !/^https?:\/\//i.test(line))
    || String(text || '');
  if (BUG_PATTERN.test(headline)) return 'bugfix';
  if (FEATURE_PATTERN.test(headline)) {
    const withoutTags = stripTags(headline.replace(/https?:\/\/\S+/g, ''));
    if (!ACTION_PATTERN.test(withoutTags) || extractUrls(text).length > 0) return 'feature';
  }
  if (/\bupdate(?:d|s)?\b/i.test(headline) && extractUrls(text).length > 0) return 'feature';
  return 'upgrade_action';
}

function actionTitle(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const imperative = lines.find((line) => {
    const withoutTags = line.replace(/\[[^\]]+\]/g, ' ').replace(/^\s*[-*]\s*/, '').trim();
    return ACTION_PATTERN.test(withoutTags);
  });
  const fallback = lines.find((line) => !/^https?:\/\//i.test(line));
  const cleaned = stripTags(String(imperative || fallback || 'Review release note').replace(/https?:\/\/\S+/gi, ''))
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 'Review tagged release instruction';
  return cleaned
    .replace(/^[-*\d.)]+\s*/, '')
    .slice(0, 180);
}

function classifyItem(text, metadata) {
  const applicability = classifyApplicability(text, metadata);
  return {
    applicability: applicability.applicability,
    condition: applicability.condition,
    classificationReason: applicability.reason,
    timing: classifyTiming(text, metadata),
    owner: classifyOwner(text, metadata),
    category: classifyCategory(text, metadata),
    action: actionTitle(text),
  };
}

module.exports = {
  ACTION_PATTERN,
  ACTION_SIGNAL_PATTERN,
  BUG_PATTERN,
  classifyApplicability,
  classifyCategory,
  classifyItem,
  classifyOwner,
  classifyTiming,
  extractCondition,
  extractUrls,
  isAction,
};

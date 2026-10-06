'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const policy = require('../../config/execution-policy.json').memory;
const ROOT = path.resolve(__dirname, '..', '..', 'memory');
const sensitive = /(?:password|passwd|pwd|api[_-]?key|secret|token|AccountKey|SharedAccessKey)\s*[=:]\s*[^\s;,]+|Bearer\s+[^\s]+/gi;

function location(tier, scope, id, root) {
  if (!policy.tiers.includes(tier) || !policy.scopes.includes(scope)) throw new Error('Invalid memory scope or tier');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id)) throw new Error('Invalid memory id');
  return path.join(root || ROOT, tier, scope, `${id}.json`);
}

function sanitize(value) {
  if (typeof value === 'string') return value.replace(sensitive, '[REDACTED]');
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    const clean = {};
    for (const [key, entry] of Object.entries(value)) {
      if (/clientId|clientName|email|businessRules|sourceCode|absolutePath/i.test(key)) continue;
      clean[key] = /password|secret|token|api.?key/i.test(key) ? '[REDACTED]' : sanitize(entry);
    }
    return clean;
  }
  return value;
}

function capture(scope, record, options) {
  options = options || {};
  const review = options.redactionReview;
  if (!review || !['Agent', 'Developer'].includes(review.reviewer) || review.personalDataRemoved !== true || review.clientBusinessRulesRemoved !== true || review.sourceBodiesRemoved !== true || !review.evidence) throw new Error('Verified redaction review is required before reusable memory capture');
  if (options.containsPersonalData || options.containsClientBusinessRules) throw new Error('Reusable memory requires developer redaction review');
  const clean = sanitize(record);
  const id = options.id || crypto.createHash('sha256').update(JSON.stringify(clean)).digest('hex').slice(0, 20);
  const tier = options.candidate ? 'candidates' : 'episodes';
  const file = location(tier, scope, id, options.root);
  const output = Object.assign({}, clean, { schemaVersion: 1, scope, tier, redactionStatus: 'REVIEWED_REDACTED', approvalStatus: 'UNAPPROVED',
    redactionReview: sanitize({ reviewer: review.reviewer, personalDataRemoved: true, clientBusinessRulesRemoved: true, sourceBodiesRemoved: true, evidence: review.evidence }) });
  if (tier === 'candidates' && (!Array.isArray(output.evidence) || !output.evidence.length)) throw new Error('Candidate memory requires redacted evidence');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(output, null, 2) + '\n');
  return { ref: file, scope, tier, approvedWritten: false };
}

function approved(scope, root) {
  location('approved', scope, 'validate', root);
  const directory = path.join(root || ROOT, 'approved', scope);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((name) => name.endsWith('.json')).map((name) => Object.assign({}, JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8')), { scope }));
}

function review(scope, id, decision, reviewRecord, root) {
  if (!reviewRecord || reviewRecord.reviewer !== 'Developer' || !reviewRecord.evidenceReviewed || !reviewRecord.redactionVerified) throw new Error('Explicit developer review and verified redaction required');
  if (!['APPROVE', 'REJECT'].includes(decision)) throw new Error('Invalid memory decision');
  const candidate = location('candidates', scope, id, root);
  const record = JSON.parse(fs.readFileSync(candidate, 'utf8'));
  const target = location(decision === 'APPROVE' ? 'approved' : 'rejected', scope, id, root);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const review = sanitize({ reviewer: reviewRecord.reviewer, evidenceReviewed: true, redactionVerified: true, reason: reviewRecord.reason || null });
  fs.writeFileSync(target, JSON.stringify(Object.assign(record, { tier: decision === 'APPROVE' ? 'approved' : 'rejected', approvalStatus: decision, review }), null, 2) + '\n');
  fs.unlinkSync(candidate);
  return target;
}

module.exports = { ROOT, location, sanitize, capture, approved, review };
'use strict';
/*
 * Merges each track's own deployment-relevant output into ONE
 * before-deployment.md / after-deployment.md / deployment-checklist.yaml,
 * run once per shared run, only after verify-coverage succeeds.
 *
 * frontend/ already writes a structured deployment-checklist.yaml per run —
 * reused verbatim (source: 'frontend-track').
 * backend/ has no structured deployment-item extraction today; rather than
 * fabricate structured items, this emits one explicit pointer item (source:
 * 'backend-track-manual-review') directing the developer to backend's own
 * report / state.json nextAction+safeResumeInstruction text.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('./yaml');

function readFrontendChecklist(frontendRunDir) {
  if (!frontendRunDir) return [];
  const p = path.join(frontendRunDir, 'deployment-checklist.yaml');
  if (!fs.existsSync(p)) return [];
  const parsed = yaml.parse(fs.readFileSync(p, 'utf8'));
  return (parsed.items || []).map((item) => Object.assign({}, item, {
    timing: item.timing || 'AFTER_DEPLOYMENT',
    source: 'frontend-track'
  }));
}

function backendManualReviewItem(backendState, backendRunRef) {
  if (!backendState) return null;
  return {
    id: 'BACKEND-MANUAL-REVIEW',
    action: 'Review the backend track\u2019s own report for manual deployment actions (backend emits no structured deployment-checklist today).',
    timing: 'AFTER_DEPLOYMENT',
    owner: null,
    instructions: backendState.safeResumeInstruction || backendState.nextAction || null,
    risk: null,
    verification: null,
    status: 'MANUAL_ACTION_PENDING',
    coreVersion: backendState.targetVersion || null,
    source: 'backend-track-manual-review',
    backendRunRef
  };
}

function renderList(items) {
  if (items.length === 0) return '_None._';
  return items.map((it) => {
    const bits = [`- **${it.id}** (${it.source}) — ${it.action}`];
    if (it.owner) bits.push(`  - Owner: ${it.owner}`);
    if (it.instructions) bits.push(`  - Instructions: ${it.instructions}`);
    if (it.risk) bits.push(`  - Risk: ${it.risk}`);
    if (it.verification) bits.push(`  - Verification: ${it.verification}`);
    bits.push(`  - Status: ${it.status}`);
    return bits.join('\n');
  }).join('\n');
}

function prepareHandover({ runId, clientId, sourceVersion, targetVersion, frontendRunDir, backendState, backendRunRef, frontendRunRef, templatesDir, domainEvidenceRefs }) {
  const items = [...readFrontendChecklist(frontendRunDir)];
  const backendItem = backendManualReviewItem(backendState, backendRunRef);
  if (backendItem) items.push(backendItem);
  for (const file of domainEvidenceRefs || []) {
    const evidence = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const entry of evidence.azureChecklist || []) items.push({
      id: `BACKEND-CONFIG-${entry.azureKey}`, action: `Validate backend setting ${entry.azureKey}`,
      timing: entry.timing || 'BEFORE_DEPLOYMENT', owner: entry.owner,
      instructions: `Use the backend-owned evidence ${file}; resolve values through the client secret provider.`,
      verification: 'Backend configuration coverage verified', status: 'MANUAL_ACTION_PENDING',
      source: 'backend-track-manual-review'
    });
  }

  const before = items.filter((i) => i.timing === 'BEFORE_DEPLOYMENT');
  const after = items.filter((i) => i.timing !== 'BEFORE_DEPLOYMENT');

  const checklist = { schemaVersion: 1, runId, items };

  const fill = (tpl, vars) => Object.keys(vars).reduce((s, k) => s.split(`{{${k}}}`).join(vars[k]), tpl);
  const beforeTpl = fs.readFileSync(path.join(templatesDir, 'before-deployment.template.md'), 'utf8');
  const afterTpl = fs.readFileSync(path.join(templatesDir, 'after-deployment.template.md'), 'utf8');
  const vars = {
    clientId, sourceVersion: sourceVersion || 'unknown', targetVersion, runId,
    backendRunRef: backendRunRef || 'n/a', frontendRunRef: frontendRunRef || 'n/a'
  };
  const beforeMd = fill(beforeTpl, Object.assign({ beforeItems: renderList(before) }, vars));
  const afterMd = fill(afterTpl, Object.assign({ afterItems: renderList(after) }, vars));

  return { checklist, beforeMd, afterMd };
}

module.exports = { readFrontendChecklist, backendManualReviewItem, renderList, prepareHandover };

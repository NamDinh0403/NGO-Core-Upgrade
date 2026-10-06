'use strict';
/*
 * Bootstrap orchestrator. Ties detection + install + validation + manifest into
 * the `tools bootstrap|check|validate|doctor|manifest` entry points.
 * Writes durable artifacts under runs/_bootstrap/<run-id>/.
 */
const fs = require('fs');
const path = require('path');
const c = require('./core');
const t = require('./tools');

const BOOTSTRAP_CLIENT = '_bootstrap';

function newRunId() {
  return `${BOOTSTRAP_CLIENT}-${c.nowIso().replace(/[:.]/g, '-')}`;
}

function writeArtifacts(runDirRel, manifest, checks, log, policy) {
  c.ensureDir(runDirRel);
  const redact = c.redactor(policy);
  fs.writeFileSync(c.P(runDirRel, 'tool-checks.json'), redact(JSON.stringify(checks, null, 2)));
  fs.writeFileSync(c.P(runDirRel, 'tool-manifest.json'), redact(JSON.stringify(manifest, null, 2)));
  const jsonl = log.map((e) => redact(JSON.stringify(e))).join('\n') + (log.length ? '\n' : '');
  fs.writeFileSync(c.P(runDirRel, 'tool-installation-log.jsonl'), jsonl);
  // Stable "latest" pointer for wrappers.
  c.ensureDir(`runs/${BOOTSTRAP_CLIENT}`);
  fs.writeFileSync(c.P(`runs/${BOOTSTRAP_CLIENT}`, 'tool-manifest.json'), redact(JSON.stringify(manifest, null, 2)));
}

function overall(manifest) {
  const policyBlocked = manifest.tools.some((x) => x.status === 'POLICY_BLOCKED' &&
    (x.classification === 'REQUIRED' || x.classification === 'REQUIRED_IF_APPLICABLE'));
  if (manifest.missingRequiredCapabilities.length > 0) {
    return { status: policyBlocked ? 'FAILED_POLICY' : 'BLOCKED_NEEDS_DEVELOPER', exitCode: 1 };
  }
  return { status: 'SUCCEEDED', exitCode: 0 };
}

function writeEscalation(runDirRel, manifest, result) {
  const blocked = manifest.tools.filter((x) =>
    ['MISSING', 'INSTALLATION_BLOCKED', 'VERSION_TOO_OLD', 'VALIDATION_FAILED', 'POLICY_BLOCKED'].includes(x.status) &&
    (x.classification === 'REQUIRED' || x.classification === 'REQUIRED_IF_APPLICABLE'));
  const lines = [];
  lines.push(`# Developer Escalation — TOOL_BOOTSTRAP (${manifest.runId})`);
  lines.push('');
  lines.push(`Status: \`${result.status}\``);
  lines.push('');
  lines.push('## Missing required capabilities');
  for (const cap of manifest.missingRequiredCapabilities) lines.push(`- ${cap}`);
  lines.push('');
  lines.push('## Blocked tools and required action');
  for (const x of blocked) {
    lines.push(`### ${x.id} — ${x.status}`);
    lines.push(`- Reason: ${x.selectionReason || 'n/a'}`);
    lines.push(`- Manual action: install/repair \`${x.id}\` (see docs/operations/tool-troubleshooting.md), then re-run \`upgrade-agent tools bootstrap\`.`);
  }
  lines.push('');
  lines.push('## Safe resume instruction');
  lines.push('After the missing prerequisite is installed manually, re-run `upgrade-agent tools bootstrap`. VERSION_RESEARCH remains blocked until the required capabilities resolve to AVAILABLE.');
  fs.writeFileSync(c.P(runDirRel, 'developer-escalation.md'), lines.join('\n') + '\n');
}

function run(mode, suppliedEvidence) {
  const cfg = c.loadConfig();
  const evidence = suppliedEvidence || c.gatherEvidence();
  const runId = newRunId();
  const runDirRel = `runs/${BOOTSTRAP_CLIENT}/${runId}`;
  const buildMode = mode === 'bootstrap' ? 'install' : 'check';
  const { manifest, checks, log } = t.buildManifest(cfg.requirements, evidence, cfg.policy, runId, buildMode);
  writeArtifacts(runDirRel, manifest, checks, log, cfg.policy);
  const result = overall(manifest);
  if (result.exitCode !== 0) writeEscalation(runDirRel, manifest, result);
  return { manifest, checks, log, runDirRel, evidence, result, mode };
}

function summarize(out) {
  const { manifest, result, runDirRel, evidence } = out;
  const line = (s) => process.stdout.write(s + '\n');
  line('NGO Core Upgrade — TOOL_BOOTSTRAP');
  line(`  platform: ${manifest.platform.os} (${manifest.platform.architecture})`);
  line(`  evidence: dotnetClient=${evidence.dotnetClientPresent} frontend=${evidence.frontendPresent} angular=${evidence.angularDetected} ts=${evidence.typescriptDetected}`);
  line('  tools:');
  for (const x of manifest.tools) {
    const v = x.version ? ` v${x.version}` : '';
    const val = x.status === 'AVAILABLE' ? `smoke=${x.validation.smokeTest}` : '';
    line(`    ${x.status.padEnd(22)} ${x.id}${v} ${val}`);
  }
  if (manifest.warnings.length) { line('  warnings:'); for (const w of manifest.warnings) line(`    - ${w}`); }
  if (manifest.missingRequiredCapabilities.length) {
    line('  MISSING REQUIRED CAPABILITIES:');
    for (const m of manifest.missingRequiredCapabilities) line(`    - ${m}`);
  }
  line(`  bootstrap status: ${result.status}`);
  line(`  artifacts: ${runDirRel}/`);
}

module.exports = { run, summarize, overall, BOOTSTRAP_CLIENT };

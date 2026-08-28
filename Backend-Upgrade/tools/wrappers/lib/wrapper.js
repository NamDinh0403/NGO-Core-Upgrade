'use strict';
/*
 * Shared research-tool wrapper runner. Wrappers resolve the executable from the
 * generated manifest, refuse client mutation, enforce timeouts, redact secrets,
 * persist full logs as hashed artifacts, and return a structured JSON result.
 */
const fs = require('fs');
const path = require('path');
const c = require('../../bootstrap/lib/core');
const bootstrap = require('../../bootstrap/lib/bootstrap');

function loadManifest() {
  const p = c.P('runs', bootstrap.BOOTSTRAP_CLIENT, 'tool-manifest.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; }
}

function clientMutationAttempt(spec, policy) {
  const globs = (policy.clientProtection && policy.clientProtection.neverModify) || [];
  const args = (spec.userArgs || []).join(' ');
  // Deny mutating verbs for research wrappers.
  for (const verb of (spec.mutatingVerbs || [])) {
    const re = new RegExp(`(^|\\s)${verb}(\\s|$)`, 'i');
    if (re.test(args)) return `mutating verb '${verb}' is not allowed in a research wrapper`;
  }
  // Deny writing to a protected client dependency file.
  for (const g of globs) {
    const base = g.replace('**/', '').replace('*', '');
    if (base && args.includes(base)) return `argument targets a protected client file pattern '${g}'`;
  }
  return null;
}

function runWrapper(spec) {
  const policy = c.loadConfig().policy;
  const startedAt = c.nowIso();
  const result = {
    schemaVersion: '1.0', toolId: spec.toolId, toolVersion: null, capability: spec.capability,
    status: 'FAILED', workingDirectory: spec.cwd || '.', phase: spec.phase || null,
    startedAt, completedAt: startedAt, exitCode: null, artifacts: [],
    stdoutArtifact: null, stderrArtifact: null, warnings: [], nextRecommendedAction: null,
  };

  const manifest = loadManifest();
  if (!manifest) {
    result.status = 'TOOL_UNAVAILABLE';
    result.warnings.push('no tool manifest; run `upgrade-agent tools bootstrap` first');
    result.completedAt = c.nowIso();
    return result;
  }

  // Client-mutation guard (before resolving/executing anything).
  if (!spec.allowClientMutation) {
    const violation = clientMutationAttempt(spec, policy);
    if (violation) {
      result.status = 'REFUSED_CLIENT_MUTATION';
      result.warnings.push(violation);
      result.completedAt = c.nowIso();
      return result;
    }
  }

  let tool = manifest.tools.find((x) => x.id === spec.toolId);
  let executable = tool && tool.executable;
  let argsPrefix = spec.argsPrefix || [];

  // Fallback support (e.g. repository-search: ripgrep -> git grep).
  if ((!tool || tool.status !== 'AVAILABLE') && spec.fallback) {
    tool = manifest.tools.find((x) => x.id === spec.fallback.toolId);
    executable = tool && tool.executable;
    argsPrefix = spec.fallback.argsPrefix || [];
    result.warnings.push(`primary tool unavailable; using fallback ${spec.fallback.toolId}`);
  }

  if (!tool || tool.status !== 'AVAILABLE' || !executable) {
    result.status = 'TOOL_UNAVAILABLE';
    result.warnings.push(`capability '${spec.capability}' has no AVAILABLE tool in the manifest`);
    result.completedAt = c.nowIso();
    return result;
  }
  result.toolVersion = tool.version;

  const argv = argsPrefix.concat(spec.userArgs || []);
  const timeout = (policy.execution && policy.execution.defaultTimeoutSeconds ? policy.execution.defaultTimeoutSeconds : 600) * 1000;
  const exec = c.runExec(executable, argv, { cwd: spec.cwd, timeout });

  // Persist redacted logs as hashed artifacts.
  const redact = c.redactor(policy);
  const logDirRel = `runs/${bootstrap.BOOTSTRAP_CLIENT}/wrapper-logs/${startedAt.replace(/[:.]/g, '-')}-${spec.toolId}`;
  c.ensureDir(logDirRel);
  const stdoutPath = c.P(logDirRel, 'stdout.txt');
  const stderrPath = c.P(logDirRel, 'stderr.txt');
  fs.writeFileSync(stdoutPath, redact(exec.stdout));
  fs.writeFileSync(stderrPath, redact(exec.stderr));
  result.stdoutArtifact = `${logDirRel}/stdout.txt`;
  result.stderrArtifact = `${logDirRel}/stderr.txt`;
  result.artifacts = [
    { path: result.stdoutArtifact, sha256: c.sha256File(stdoutPath) },
    { path: result.stderrArtifact, sha256: c.sha256File(stderrPath) },
  ];
  result.exitCode = exec.code;
  result.completedAt = c.nowIso();
  if (exec.timedOut) { result.status = 'TIMED_OUT'; return result; }
  result.status = exec.code === 0 ? 'SUCCEEDED' : 'FAILED';
  return result;
}

module.exports = { runWrapper, loadManifest };

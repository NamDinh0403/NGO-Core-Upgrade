'use strict';
/*
 * Tool detection, smoke tests, installation, and manifest generation.
 * Dependency-free, Node 14+. All process output is redacted before persistence.
 */
const fs = require('fs');
const path = require('path');
const c = require('./core');

const MANIFEST_SCHEMA_VERSION = '1.0';
const isWin = process.platform === 'win32';

function resolveExecutable(cmd) {
  const probe = isWin ? c.runExec('where', [cmd]) : c.runExec('command', ['-v', cmd]);
  if (probe.code === 0 && probe.stdout.trim()) return probe.stdout.trim().split(/\r?\n/)[0].trim();
  return null;
}

function policyGateBlocked(tool, policy) {
  if (!tool.policyGate) return null;
  for (const gate of tool.policyGate) {
    if (!(policy.gates && policy.gates[gate] === true)) return gate;
  }
  return null;
}

// ---- detection -------------------------------------------------------------
function checkTool(tool, evidence, policy) {
  const now = c.nowIso();
  const base = {
    schemaVersion: '1.0', toolId: tool.id, applicable: true, found: false,
    executable: null, rawVersion: null, normalizedVersion: null,
    minimumVersion: tool.minimumVersion || null, meetsMinimum: null,
    candidateExecutables: [], selectedScope: null, selectionReason: null,
    status: 'MISSING', checkedAt: now,
  };

  if (tool.classification === 'FORBIDDEN') {
    return Object.assign(base, { applicable: false, status: 'POLICY_BLOCKED', selectionReason: 'classified FORBIDDEN' });
  }
  if (!c.appliesWhen(tool, evidence)) {
    return Object.assign(base, { applicable: false, status: 'NOT_APPLICABLE', selectionReason: 'appliesWhen not satisfied by repository evidence' });
  }
  const blockedGate = policyGateBlocked(tool, policy);
  if (blockedGate) {
    return Object.assign(base, { status: 'POLICY_BLOCKED', selectionReason: `policy gate '${blockedGate}' is not enabled` });
  }

  if (tool.detect && tool.detect.length) {
    const [cmd, ...args] = tool.detect;
    const exe = resolveExecutable(cmd);
    if (exe) base.candidateExecutables = [exe];
    const res = c.runExec(cmd, args);
    if (res.code === 0) {
      base.found = true;
      base.executable = exe || cmd;
      base.rawVersion = (res.stdout || res.stderr).trim().split(/\r?\n/)[0].trim();
      base.normalizedVersion = c.normalizeVersion(base.rawVersion);
      base.meetsMinimum = c.meetsMinimum(base.rawVersion, tool.minimumVersion);
      base.selectedScope = 'EXISTING_APPROVED';
      base.selectionReason = 'resolved on PATH; approved existing installation';
      if (base.meetsMinimum === false) base.status = 'VERSION_TOO_OLD';
      else base.status = 'AVAILABLE';
      return base;
    }
  }

  // Not found (or no direct detect command, e.g. local dotnet/npm tools).
  if (tool.installation && tool.autoInstall) {
    base.status = 'INSTALLATION_REQUIRED';
    base.selectionReason = 'not found; auto-install permitted';
  } else {
    base.status = 'MISSING';
    base.selectionReason = tool.fallback ? `not found; fallback available: ${tool.fallback}` : 'not found';
  }
  return base;
}

// ---- smoke tests -----------------------------------------------------------
const SMOKE = {
  version: (t) => t.detect ? c.runExec(t.detect[0], t.detect.slice(1)).code === 0 : true,
  // Controlled temp-fixture dry run: proves worktree support without touching the
  // real repository and without depending on the current directory being a checkout.
  'git-worktree-support': () => {
    const os = require('os'); const fs = require('fs'); const path = require('path'); const cp = require('child_process');
    let dir = null;
    try {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ua-git-'));
      if (cp.spawnSync('git', ['init', '-q'], { cwd: dir, shell: true }).status !== 0) return false;
      return cp.spawnSync('git', ['worktree', 'list'], { cwd: dir, shell: true, encoding: 'utf8' }).status === 0;
    } catch (e) { return false; }
    finally { try { if (dir) fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* best effort */ } }
  },
  'dotnet-info': () => c.runExec('dotnet', ['--info']).code === 0,
  'node-eval': () => c.runExec('node', ['-e', '"process.exit(0)"']).code === 0,
  'npm-version': () => c.runExec('npm', ['--version']).code === 0,
  'apicompat-help': () => c.runExec('dotnet', ['tool', 'run', 'apicompat', '--', '--help']).code === 0,
  'ilspycmd-help': () => c.runExec('dotnet', ['tool', 'run', 'ilspycmd', '--', '--help']).code === 0,
  'tsc-noemit-fixture': () => false,
  'angular-workspace-fixture': () => false,
};

function smokeTest(tool, check) {
  if (check.status !== 'AVAILABLE') return 'SKIPPED';
  const fn = SMOKE[tool.smoke];
  if (!fn) return 'SKIPPED';
  try { return fn(tool) ? 'PASSED' : 'FAILED'; } catch (e) { return 'FAILED'; }
}

// ---- installation ----------------------------------------------------------
function ensureDotnetManifest(log) {
  const abs = c.P('.config', 'dotnet-tools.json');
  if (fs.existsSync(abs)) return true;
  const res = c.runExec('dotnet', ['new', 'tool-manifest']);
  log.push({ action: 'create-dotnet-tool-manifest', exitCode: res.code, at: c.nowIso() });
  // Some SDKs create ./dotnet-tools.json at the repo root; normalize to .config/.
  const rootManifest = c.P('dotnet-tools.json');
  if (!fs.existsSync(abs) && fs.existsSync(rootManifest)) {
    fs.mkdirSync(c.P('.config'), { recursive: true });
    fs.renameSync(rootManifest, abs);
  }
  return fs.existsSync(abs);
}

function installDotnetLocalTool(tool, policy, log) {
  if (!(policy.dotnetTools && policy.dotnetTools.allowLocalToolManifest)) {
    return { status: 'POLICY_BLOCKED', detail: 'local .NET tool manifest not permitted' };
  }
  if (!ensureDotnetManifest(log)) {
    return { status: 'INSTALLATION_BLOCKED', detail: 'could not create .config/dotnet-tools.json' };
  }
  const pkg = tool.installation.package;
  const args = ['tool', 'install', pkg];
  if (tool.installation.pinnedVersion) args.push('--version', tool.installation.pinnedVersion);
  const res = c.runExec('dotnet', args);
  log.push({ action: 'dotnet-tool-install', package: pkg, exitCode: res.code, at: c.nowIso() });
  if (res.code === 0) return { status: 'REPOSITORY_LOCAL', detail: 'installed as local .NET tool' };
  return { status: 'INSTALLATION_BLOCKED', detail: 'dotnet tool install failed (offline or unavailable source)' };
}

function installIsolatedNpm(tool, policy, log) {
  if (policy.npmTools && policy.npmTools.addToClientPackageJson) {
    return { status: 'POLICY_BLOCKED', detail: 'policy forbids adding tools to the client package.json' };
  }
  const dir = (policy.npmTools && policy.npmTools.isolatedToolingDir) || 'tools/frontend-runtime';
  c.ensureDir(dir);
  const pkgPath = c.P(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    fs.writeFileSync(pkgPath, JSON.stringify({ name: 'ngo-frontend-runtime', private: true, devDependencies: {} }, null, 2) + '\n');
  }
  const spec = tool.installation.package + (tool.installation.pinnedVersion ? '@' + tool.installation.pinnedVersion : '');
  const res = c.runExec('npm', ['install', '--save-dev', '--save-exact', spec], { cwd: dir });
  log.push({ action: 'npm-install-isolated', package: tool.installation.package, dir, exitCode: res.code, at: c.nowIso() });
  if (res.code === 0) return { status: 'RUN_LOCAL', detail: `installed ${spec} as isolated dev dependency in ${dir}` };
  return { status: 'INSTALLATION_BLOCKED', detail: 'npm install failed (offline, version unavailable, or credentials required)' };
}

function installTool(tool, policy, check, log) {
  if (check.status !== 'INSTALLATION_REQUIRED') return check;
  if (tool.installation && tool.installation.type === 'dotnet-local-tool') {
    const r = installDotnetLocalTool(tool, policy, log);
    if (r.status === 'REPOSITORY_LOCAL') {
      check.status = 'AVAILABLE'; check.found = true; check.selectedScope = 'REPOSITORY_LOCAL';
      check.executable = 'dotnet'; check.selectionReason = r.detail;
    } else {
      check.status = r.status; check.selectionReason = r.detail;
    }
    return check;
  }
  if (tool.installation && tool.installation.type === 'isolated-npm-dev-dependency') {
    const r = installIsolatedNpm(tool, policy, log);
    if (r.status === 'RUN_LOCAL') {
      check.status = 'AVAILABLE'; check.found = true; check.selectedScope = 'RUN_LOCAL';
      check.executable = 'npm'; check.selectionReason = r.detail;
    } else {
      check.status = r.status; check.selectionReason = r.detail;
    }
    return check;
  }
  return check;
}

// ---- manifest --------------------------------------------------------------
function buildManifest(requirements, evidence, policy, runId, mode) {
  const tools = [];
  const log = [];
  const warnings = [];
  for (const tool of requirements.tools) {
    let check = checkTool(tool, evidence, policy);
    if (mode === 'install' && check.status === 'INSTALLATION_REQUIRED') {
      check = installTool(tool, policy, check, log);
    }
    const versionCheck = check.status === 'NOT_APPLICABLE' || check.status === 'POLICY_BLOCKED' ? 'NOT_APPLICABLE'
      : (check.found ? (check.meetsMinimum === false ? 'FAILED' : 'PASSED') : 'SKIPPED');
    const smoke = smokeTest(tool, check);
    if (smoke === 'FAILED') { check.status = 'VALIDATION_FAILED'; }
    tools.push({
      id: tool.id, status: check.status, classification: tool.classification,
      version: check.normalizedVersion, executable: check.executable, scope: check.selectedScope,
      source: check.selectionReason, capabilities: tool.capabilities || [],
      selectionReason: check.selectionReason,
      validation: { versionCheck, smokeTest: smoke, validatedAt: c.nowIso() },
      _check: check,
    });
    if (tool.classification === 'RECOMMENDED' && check.status === 'MISSING') {
      warnings.push(`recommended tool '${tool.id}' is missing${tool.fallback ? ` (fallback: ${tool.fallback})` : ''}`);
    }
  }

  // Missing REQUIRED capabilities.
  const missingRequiredCapabilities = [];
  for (const t of tools) {
    const spec = requirements.tools.find((x) => x.id === t.id);
    const required = spec.classification === 'REQUIRED' ||
      (spec.classification === 'REQUIRED_IF_APPLICABLE' && t.status !== 'NOT_APPLICABLE');
    const ok = t.status === 'AVAILABLE' || t.status === 'AVAILABLE_WITH_WARNING';
    if (required && !ok) for (const cap of (spec.capabilities || [])) missingRequiredCapabilities.push(cap);
  }

  const manifest = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    generatedAt: c.nowIso(),
    runId: runId,
    platform: c.platform(),
    tools: tools.map(({ _check, ...rest }) => rest),
    missingRequiredCapabilities: [...new Set(missingRequiredCapabilities)],
    warnings,
  };
  const checks = tools.map((t) => t._check);
  return { manifest, checks, log };
}

module.exports = { checkTool, smokeTest, installTool, buildManifest, resolveExecutable, MANIFEST_SCHEMA_VERSION };

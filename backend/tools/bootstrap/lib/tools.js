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

// Run a callback inside a throwaway temp directory that is always removed.
function withTempDir(prefix, fn) {
  const os = require('os');
  let dir = null;
  try {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
    return fn(dir);
  } catch (e) { return false; }
  finally { try { if (dir) fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* best effort */ } }
}

// Execute a command with an absolute cwd. core.runExec always resolves cwd under the
// backend ROOT, so temp-directory fixtures must not go through it.
function spawnIn(cwd, command, argv) {
  const cp = require('child_process');
  const tok = /\s/.test(command) ? `"${command}"` : command;
  return cp.spawnSync([tok].concat(argv || []).join(' '), {
    cwd, shell: true, encoding: 'utf8', windowsHide: true, timeout: 120000,
  });
}

function policyGateBlocked(tool, policy) {  if (!tool.policyGate) return null;
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
  // Compile a throwaway TypeScript file in an isolated temp workspace. Proves the
  // resolved `tsc` binary actually type-checks, never touching the client repository.
  'tsc-noemit-fixture': (t, check) => withTempDir('ua-tsc-', (dir) => {
    const exe = check && check.executable;
    if (!exe) return false;
    fs.writeFileSync(path.join(dir, 'fixture.ts'), 'export const n: number = 1;\n');
    return spawnIn(dir, exe, ['--noEmit', '--skipLibCheck', 'fixture.ts']).status === 0;
  }),
  // Resolve the Angular CLI against a minimal synthetic workspace in a temp dir.
  'angular-workspace-fixture': (t, check) => withTempDir('ua-ng-', (dir) => {
    const exe = check && check.executable;
    if (!exe) return false;
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'ua-fixture', private: true, version: '0.0.0' }, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, 'angular.json'), JSON.stringify({ version: 1, projects: {} }, null, 2) + '\n');
    return spawnIn(dir, exe, ['version']).status === 0;
  }),
};

function smokeTest(tool, check) {
  if (check.status !== 'AVAILABLE') return 'SKIPPED';
  const fn = SMOKE[tool.smoke];
  if (!fn) return 'SKIPPED';
  try { return fn(tool, check) ? 'PASSED' : 'FAILED'; } catch (e) { return 'FAILED'; }
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

// Resolve the exact version to install. Policy forbids unpinned installs, so an
// unresolvable version is a blocking condition rather than a floating "latest".
function resolveNpmVersion(tool, evidence) {
  const inst = tool.installation || {};
  if (inst.pinnedVersion) return { version: inst.pinnedVersion, source: 'repository-pinned' };
  if (inst.versionSource === 'client-compatible') {
    const detected = evidence && evidence.clientToolVersions && evidence.clientToolVersions[inst.package];
    if (detected) return { version: detected, source: 'client-compatible' };
    return { version: null, source: 'client-compatible', reason: `no ${inst.package} version declared by the client repository` };
  }
  return { version: null, source: inst.versionSource || 'unspecified', reason: 'no pinned version and no version source' };
}

// Absolute path of the executable produced by an isolated npm install.
function npmBinPath(dir, binary) {
  const rel = path.join(dir, 'node_modules', '.bin', isWin ? `${binary}.cmd` : binary);
  return c.P(rel);
}

function installIsolatedNpm(tool, policy, log, evidence) {
  if (policy.npmTools && policy.npmTools.addToClientPackageJson) {
    return { status: 'POLICY_BLOCKED', detail: 'policy forbids adding tools to the client package.json' };
  }
  const resolved = resolveNpmVersion(tool, evidence);
  const pinRequired = !(policy.execution && policy.execution.pinVersions === false);
  if (!resolved.version && pinRequired) {
    log.push({ action: 'npm-install-isolated', package: tool.installation.package, exitCode: null, blocked: 'unresolved-version', at: c.nowIso() });
    return {
      status: 'INSTALLATION_BLOCKED',
      detail: `cannot pin ${tool.installation.package}: ${resolved.reason || 'version unresolved'} (policy requires pinned versions)`,
    };
  }
  const dir = (policy.npmTools && policy.npmTools.isolatedToolingDir) || 'tools/frontend-runtime';
  c.ensureDir(dir);
  const pkgPath = c.P(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    fs.writeFileSync(pkgPath, JSON.stringify({ name: 'ngo-frontend-runtime', private: true, devDependencies: {} }, null, 2) + '\n');
  }
  const spec = tool.installation.package + (resolved.version ? '@' + resolved.version : '');
  const res = c.runExec('npm', ['install', '--save-dev', '--save-exact', spec], { cwd: dir });
  log.push({ action: 'npm-install-isolated', package: tool.installation.package, dir, versionSource: resolved.source, exitCode: res.code, at: c.nowIso() });
  if (res.code !== 0) {
    return { status: 'INSTALLATION_BLOCKED', detail: 'npm install failed (offline, version unavailable, or credentials required)' };
  }
  const binary = (tool.installation && tool.installation.binary) || tool.installation.command || null;
  return {
    status: 'RUN_LOCAL',
    executable: binary ? npmBinPath(dir, binary) : null,
    detail: `installed ${spec} (${resolved.source}) as isolated dev dependency in ${dir}`,
  };
}

function installTool(tool, policy, check, log, evidence) {
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
    const r = installIsolatedNpm(tool, policy, log, evidence);
    if (r.status === 'RUN_LOCAL') {
      check.status = 'AVAILABLE'; check.found = true; check.selectedScope = 'RUN_LOCAL';
      check.executable = r.executable || 'npm'; check.selectionReason = r.detail;
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
      check = installTool(tool, policy, check, log, evidence);
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

module.exports = { checkTool, smokeTest, installTool, buildManifest, resolveExecutable, resolveNpmVersion, npmBinPath, MANIFEST_SCHEMA_VERSION };

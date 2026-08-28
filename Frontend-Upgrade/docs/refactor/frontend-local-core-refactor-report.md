# Refactor report - from multi-session snapshots to single-session local-Core

## 1. Prior state (assessment)

The original Frontend-Upgrade system was a document-and-prompt workflow, not a durable
agent:

- **Two independent sessions.** A "Main Upgrade" ran in the client project; a separate
  "HTML Pass" ran against Core source. The developer switched contexts by hand.
- **Manual artifact hand-off.** State moved between sessions through files copied by the
  developer: `client-snapshot.md`, `html-snapshot.md`, `html-delta.md`, and
  `upgrade-delta.md`, plus root-level `frontend-upgrade-plan-*.md` /
  `frontend-upgrade-report-*.md`.
- **No dual-repository process.** Nothing inspected the client and a local Core in one
  run; Core was "opened separately" or approximated from `node_modules`.
- **Version guidance was prose.** Target versions came from release-note tables in
  `Knowledge/`, not resolved as exact pins from the target Core manifests.
- **No enforced safety.** There was no mutation gate, no Core read-only guarantee, no
  fingerprint, no rollback checkpoint, no mandatory integration audit, and no durable,
  resumable run state.
- **No deterministic skills or tests.** Behaviour lived in `agent-guide.md` /
  `instructions.md` narrative rather than in schemas, a skill registry, an engine, and an
  executable test suite.

Retained assets worth keeping: the canonical `Knowledge/` (version manifest, breaking
changes by version, syntax-migration patterns, config-file reference) and the
plan/report `Templates/`.

## 2. Target state (design)

A single process that takes four inputs - client path, local Core path, source version,
and target version/ref - and inspects **both** repositories in **one run**, with the client
as the only mutable repository and Core strictly read-only. See
[../architecture/local-core-frontend-upgrade.md](../architecture/local-core-frontend-upgrade.md)
and [../architecture/core-requirement-mapping.md](../architecture/core-requirement-mapping.md).

Non-negotiable properties: exact target versions resolved from Core; semantic
Core-to-client requirement mapping; mandatory read-only planning with a mutation gate;
client rollback checkpoints; Core fingerprint verified unchanged; a mandatory integration
audit as the completion gate; durable, resumable run state; and a dependency-free,
developer-friendly CLI with a passing test suite.

## 3. What was built

### Engine and libraries (`tools/lib/`)
`yaml.js` (dependency-free YAML incl. inline flow collections), `core.js`, `git.js`
(read-only, fsmonitor-safe), `repos.js`, `request.js`, `doctor.js`, `engine.js`
(skill selection + `mutationGate` + transitions), `state-machine.js`, `run.js`,
`inventory.js` (client workspace/semantic graph/coverage), `inspect-core.js` (read-only
Core inventory + fingerprint), `resolve-packages.js` (exact-version alignment).

### Skills (`skills/`, 12, each with SKILL.md + input/output schema + evals)
`validate-local-repositories`, `inventory-client-frontend`, `inspect-local-core`,
`resolve-target-packages`, `derive-release-requirements`, `map-core-to-client`,
`plan-frontend-upgrade`, `execute-frontend-upgrade`, `investigate-frontend-failure`,
`audit-frontend-integration`, `learn-from-frontend-run`, `developer-escalation`
(reachable from every skill). Registered and wired in `skills/registry.yaml`.

### Schemas (`schemas/`, draft-07)
`run-request`, `run-state`, `doctor-report`, `package-alignment`, `core-requirement`,
`requirement-map`, `uncertainty`, `plan`, `workflow-event`, `frontend-audit`,
`learned-pattern`.

### Config (`config/`)
`agent-policy`, `escalation-policy`, `quality-gates`, `package-alignment-policy`,
`repository-safety-policy`, `repository-layout-policy`, plus the retained `rules.yaml`.

### CLI (`tools/`)
`frontend-upgrade-agent.js` (+ `.ps1` and bash wrappers) with `start`, `doctor`, `plan`,
`run`, `resume`, `status`, `audit`, `learn`.

### Tests (`tools/`, dependency-free)
`validate.js` (structural), `repo-layout.test.js` (layout policy), `skills.test.js`
(skill IO + behaviour), `run-evals.js` (end-to-end read-only pipeline + gate scenarios),
with fixtures under `evals/fixtures/` (`client-ngmodule`, `core-repo`).

### Documentation (`docs/`)
Architecture (2), operations (5: setup, upgrade, doctor, resume, troubleshooting), and this
refactor report; plus a rewritten `README.md` and a new `AGENTS.md`.

## 4. What was removed

- The two-session workflow and every manual hand-off artifact: `client-snapshot.md`,
  `client-snapshot.template.md`, `html-snapshot.md`, `html-delta.md`, `upgrade-delta.md`,
  and root `frontend-upgrade-plan-*.md` / `frontend-upgrade-report-*.md`.
- The narrative operator/agent guides that encoded the old flow: `agent-guide.md`,
  `instructions.md`, `CLAUDE.md`.

These are now enforced as forbidden by `config/repository-layout-policy.yaml`; all run
state lives only under `runs/<client>/<run-id>/`.

## 5. Verification

```
node tools/validate.js          # VALID - schemas, config, registry, 12 skills consistent
node tools/repo-layout.test.js  # LAYOUT OK - tree conforms; no legacy artifacts
node tools/skills.test.js       # skill IO + behaviour pass
node tools/run-evals.js         # end-to-end read-only pipeline + gate scenarios pass
```

`doctor` and `start` run against the fixtures produce a valid dual-repository preflight,
exact package alignment, derived Core requirements, and confirm **Core verified unchanged
after inspection**.

## 6. Migration notes for existing users

- Replace any "run the Main Upgrade, then the HTML Pass" instructions with a single
  `start` invocation providing both repository paths.
- Discard leftover `*-snapshot.md` / `*-delta.md` files; they are no longer read or written.
- Dependency versions are no longer chosen from tables by hand - they are resolved as exact
  pins from the target Core. The `Knowledge/` matrix remains a useful cross-reference.

# Frontend Upgrade Agent

**Single-session, dual-repository Angular / NGO Core front-end upgrade.**

One process inspects **both** repositories in **one run**:

- the **client front-end repository** - the only repository the agent modifies, and
- a **local NGO Core repository** - a strictly **read-only** source of truth.

There is no second session, no manual file copying, and no snapshot/delta hand-off.
The agent resolves exact target dependency versions from the local Core, derives the
semantic integration requirements of the target Core, maps each requirement to the
actual client implementation point, plans every change with exact files and evidence,
and only then - behind a mutation gate - applies changes to the client.

---

## Quick start

```
frontend-upgrade-agent start \
  --client-path "<path-to-client-frontend>" \
  --core-path   "<path-to-local-ngo-core>" \
  --source-version "8.3.0" \
  --target-version "9.2.0"
```

Or drive everything from a request file:

```
frontend-upgrade-agent start --request frontend-upgrade-request.yaml
```

The target may be a Core version **or** a Core git reference:

```
  --target-version "9.2.0"        # semantic version
  --target-ref     "release/9.2"  # branch / tag / commit (read-only worktree)
```

Wrappers `tools/frontend-upgrade-agent.ps1` (Windows) and `tools/frontend-upgrade-agent`
(bash) forward to `tools/frontend-upgrade-agent.js`. No npm dependencies; Node 14+.

---

## What the agent guarantees

- **Only the client repository is modified.** The local NGO Core repository is inspected
  read-only; its git identity and key-file hashes are fingerprinted before and after
  inspection and verified unchanged. When the target reference differs from the Core
  checkout, a read-only `git worktree` is created **outside** both repositories under
  `runs/<client>/<run-id>/research/core-target/` - the developer's Core working tree is
  never switched.
- **Exact target versions come from Core** - not from `latest`, wildcards, or ranges.
  `ngo-core` is never upgraded in isolation: Angular, the CLI/DevKit, TypeScript, RxJS,
  Zone.js, peer dependencies, and client-relevant packages are aligned to the exact
  versions the target Core declares.
- **Requirements are semantic, then mapped.** Core findings become "what is required"
  (a package, a config key, a provider, a route, an asset), and are mapped to the client's
  actual implementation point - resolving environment/runtime config precedence,
  module/provider registration, route composition, and multi-level `tsconfig` inheritance.
  A Core record never becomes a blind "edit environment.ts".
- **Planning precedes mutation.** A complete, read-only plan naming exact files and evidence
  is produced first. Vague actions are rejected. Mutation is gated on a READY plan, a client
  rollback checkpoint, a recorded Core fingerprint, and no unresolved HIGH/CRITICAL
  uncertainty.
- **A mandatory audit blocks completion** until the client provably integrates the target
  Core (exact versions installed, production build succeeds, required config/providers/routes
  present, Core unchanged).
- **Durable and resumable.** Every run persists state, evidence, checkpoints, and artifacts
  under `runs/<client>/<run-id>/`. `resume` continues after a developer resolves a blocker.

---

## Commands

| Command | Purpose |
| --- | --- |
| `start`  | Run the full single-session pipeline (read-only through planning; `--execute` continues to gated mutation). |
| `doctor` | Dual-repository preflight only (read-only). |
| `plan`   | (Re)build the read-only plan for a run. |
| `run`    | Execute the READY plan behind the mutation gate (client only). |
| `resume` | Continue a run after a developer resolves a blocker. |
| `status` | Show run status, doctor result, coverage, package alignment, and documentation. |
| `audit`  | Run the mandatory integration audit. |
| `learn`  | Extract redacted learning **candidates** (never auto-approved). |

---

## Repository layout

```
Frontend-Upgrade/
  config/        agent, escalation, quality-gate, package-alignment, safety, and layout policies
  docs/          architecture, operations, and refactor documentation
  evals/         fixtures + behavioural evaluation harness inputs
  knowledge/     canonical release/migration/appsettings knowledge (structured YAML + derived md)
  runs/          durable per-run state, evidence, checkpoints, artifacts
  schemas/       draft-07 schemas for requests, state, reports, and skill IO
  skills/        12 skills (SKILL.md + input/output schemas + evals) + registry.yaml
  templates/     report/plan templates
  tools/         CLI, lib/ engine, and dependency-free tests
```

---

## Tests

```
node tools/validate.js            # schema / config / registry / skill structural integrity
node tools/repo-layout.test.js    # enforce repository-layout-policy.yaml
node tools/skills.test.js         # skill IO + behavioural evaluations
node tools/run-evals.js           # end-to-end read-only pipeline + gate scenarios
```

All are dependency-free and run offline against the fixtures in `evals/fixtures/`.

---

## Documentation

- Architecture: [docs/architecture/local-core-frontend-upgrade.md](docs/architecture/local-core-frontend-upgrade.md),
  [docs/architecture/core-requirement-mapping.md](docs/architecture/core-requirement-mapping.md)
- Operations: [docs/operations/new-developer-setup.md](docs/operations/new-developer-setup.md),
  [docs/operations/frontend-upgrade.md](docs/operations/frontend-upgrade.md),
  [docs/operations/frontend-doctor.md](docs/operations/frontend-doctor.md),
  [docs/operations/frontend-resume.md](docs/operations/frontend-resume.md),
  [docs/operations/frontend-troubleshooting.md](docs/operations/frontend-troubleshooting.md)
- Agent contract: [AGENTS.md](AGENTS.md) · Refactor report:
  [docs/refactor/frontend-local-core-refactor-report.md](docs/refactor/frontend-local-core-refactor-report.md)
- Canonical knowledge: [knowledge/README.md](knowledge/README.md)

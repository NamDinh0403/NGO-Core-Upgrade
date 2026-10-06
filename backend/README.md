# NGO Core Upgrade Agent (Backend)

The domain executor consumes a verified BackendContext from the
[shared owner](../orchestrator/README.md). Standalone exact-version planning uses
the same owner; `--context` binds coordinated runs without another ingest.
Backend owns NuGet, installed DLL signatures, EF, appsettings and database
requirements. Initial discovery is limited to the requested backend manifests,
not the framework workspace or frontend packages. Existing mutation gates,
bounded diagnosis and checkpoints remain authoritative.

> **Autonomous, package-first upgrade workflow for NGO.Core NuGet packages.**
> Drop the prompt, walk away, come back to a green build and a written report.

> **For humans:** read this README.
> **For agents:** start from **[AGENTS.md](AGENTS.md)** — the single entry point. It routes you through the explicit workflow state machine, durable run state, and the smallest knowledge records needed for the current phase.

[![.NET](https://img.shields.io/badge/.NET-8%20%7C%209%20%7C%2010-512BD4?logo=dotnet)](#supported-versions)
[![NGO Core](https://img.shields.io/badge/NGO.Core-7.1.x%20%E2%86%92%209.1.x-2b6cb0)](#supported-versions)
[![Workflow](https://img.shields.io/badge/workflow-state--machine-38a169)](#how-it-works)

---

## What is this?

A **package-first, agent-driven workflow** that upgrades any client solution depending on the **NGO.Core** NuGet suite (`NGO.Core.API`, `NGO.Core.Common`, `NGO.Core.Model`, `NGO.Core.Repositories`, `NGO.Core.Services`, `NGO.Core.Infrastructure`, `NGO.Core.Deployment`, `NGO.Core.WebJobs.*`, `NGO.Core.Tools.Common`).

You give a coding agent one prompt:

```text
Upgrade NGO Core packages to version <X.Y.Z>
```

The agent enters the workflow at [AGENTS.md](AGENTS.md), prepares its research tools, writes a plan before touching code, updates packages/config, fixes every compiler error by inspecting the installed package on disk, runs tests + EF migrations, and writes an `upgrade-report-YYYY-MM-DD.md` to the solution root.

**It does not stop silently. It does not skip the report.**

## Why it exists

Manual NGO.Core upgrades are slow and error-prone: scanning release notes, triaging 30–200 compiler errors, missing a constructor change deep in `NGO.Core.Services`, forgetting a DI registration, or hand-patching a drifted EF migration.

The **decompiled DLL in the local NuGet cache is the source of truth** — not diffs, not release notes, not chat memory. Every fix is grounded in the actual current public surface of the package.

## How it works

Principles:

| Principle | Meaning |
|-----------|---------|
| **Package-first** | The compiled `NGO.Core.*.dll` in the NuGet cache is the authoritative signature. Written knowledge corroborates; on conflict, the DLL wins. |
| **Smallest change** | A fix touches exactly the lines the compiler flagged, plus unavoidable callers (DI, call sites). No refactors. |
| **Never stop** | Every step ends in exactly one machine status; any blocked/failed status routes to `HANDOVER` with an actionable escalation and a resume instruction. |
| **Documentation is a gate** | A run cannot be `COMPLETE` while any required documentation item is pending (`DOCUMENTATION_PENDING`). |

Explicit workflow state machine ([workflows/core-upgrade/workflow.yaml](workflows/core-upgrade/workflow.yaml)):

```text
DISCOVERY → TOOL_BOOTSTRAP → BASELINE → PLAN → UPGRADE
          → BUILD_AND_FIX → TEST → DOCUMENT → HANDOVER → COMPLETE
```

Controlled backward transitions: `BUILD_AND_FIX→UPGRADE`, `TEST→BUILD_AND_FIX`. Progress lives in `runs/<client>/<run-id>/state.json`, never in chat context.

## Developer workflow (skills)

Bounded agent procedures live under [skills/](skills/) and follow one simple flow:

```text
doctor → plan → research (when necessary) → run → resume (if interrupted) → learn
```

```text
node tools/upgrade-agent.js doctor                       # READY_FOR_PLANNING (optional tools may be absent)
node tools/upgrade-agent.js plan   --client <id> --run <run-id>   # read-only plan + uncertainty register
node tools/upgrade-agent.js run    --client <id> --run <run-id>   # requires a READY plan (mutation gate)
node tools/upgrade-agent.js resume --client <id> --run <run-id>   # resume from the last checkpoint
node tools/upgrade-agent.js status --client <id> --run <run-id>
```

Planning is mandatory and read-only; specialist tools activate only when a plan needs them. See [skills/README.md](skills/README.md) and [docs/operations/new-developer-setup.md](docs/operations/new-developer-setup.md).

## Quick start

1. Open your solution in an agent-capable editor (VS Code + Copilot Chat agent mode, etc.).
2. Prepare tooling: `node tools/upgrade-agent.js tools bootstrap`.
3. Give the trigger prompt: `Upgrade NGO Core packages to version 8.3.0` and point the agent at [AGENTS.md](AGENTS.md).
4. Walk away. On return, read `upgrade-report-YYYY-MM-DD.md` at the solution root; `runs/<client>/<run-id>/state.json` shows the terminal status.

## Repository structure

```text
backend/
├── AGENTS.md                     ← the agent entry point
├── README.md                     ← human orientation
│
├── config/                       ← policies (machine-enforced)
│   ├── agent-policy.yaml  quality-gates.yaml  escalation-policy.yaml
│   ├── retention-policy.yaml  knowledge-priority.yaml
│   ├── tool-requirements.yaml  tool-installation-policy.yaml  tool-capabilities.yaml
│   └── repository-layout-policy.yaml
├── .config/dotnet-tools.json     ← local .NET tool manifest (standard tool metadata)
│
├── workflows/core-upgrade/       ← the versioned state machine
│   ├── workflow.yaml
│   ├── phases/01-discovery … 01b-tool-bootstrap … 08-handover
│   └── checklists/definition-of-done.md  developer-handoff.md
│
├── knowledge/
│   ├── index/                    routing-table.json  manifest.json  retrieval-index.json  version-manifest.json
│   ├── canonical/                versions/ errors/ symbols/ migrations/ appsettings/ anti-patterns/
│   └── derived/                  breaking-changes/ common-error-solutions/ deployment-guides/ version-changes/
│
├── memory/                       episodes/ candidates/ approved/ rejected/  (learning lifecycle)
├── skills/                       bounded agent procedures (8 skills + registry + engine tests)
├── runs/                         isolated durable run directories
├── schemas/                      JSON schemas for every machine record
├── templates/                    plan / report / escalation / learned-pattern / state seeds
├── evals/                        regression cases, simulated runs, scoring
├── tools/                        state-machine, validator, bootstrap engine, wrappers
└── docs/                         architecture/ operations/ refactor/
```

## Supported versions

| NGO Core | .NET | Status |
|----------|------|--------|
| 9.1.x | net10 | Current |
| 9.0.x | net10 | Current |
| 8.x   | net9  | Stable |
| 7.4.x / 7.3.x / 7.2.x | net8 | Supported |

Versions without prepared knowledge still work because the fix loop reads the installed DLL directly. The routing table is [knowledge/index/routing-table.json](knowledge/index/routing-table.json); per-version records live under [knowledge/canonical/versions/](knowledge/canonical/versions/).

## Output contract

| Artifact | When | Location | Template |
|----------|------|----------|----------|
| `upgrade-plan-{date}.md` | before any change | solution root | [templates/upgrade-plan.template.md](templates/upgrade-plan.template.md) |
| `upgrade-report-{date}.md` | before COMPLETE/BLOCKED | solution root | [templates/client-upgrade-report.md](templates/client-upgrade-report.md) |
| `state.json` + checkpoints + JSONL events | continuously | `runs/<client>/<run-id>/` | [schemas/run-state.schema.json](schemas/run-state.schema.json) |

The **plan** declares intended changes up front; the **report** records what was actually done, including a **Deviations from Plan** section.

## Agent entrypoint

1. [AGENTS.md](AGENTS.md) — authoritative files, how to start/resume, phases, checkpoints, escalation, non-negotiables.
2. [workflows/core-upgrade/phases/](workflows/core-upgrade/phases/) — one contract card per phase.
3. [knowledge/index/routing-table.json](knowledge/index/routing-table.json) — request a capability/route, load only what the current step needs.
4. [memory/episodes/](memory/episodes/) — prior runs, retrievable by technical characteristics (error code, symbol, version), never by client name.

## Document map

| Path | Purpose |
|------|---------|
| [AGENTS.md](AGENTS.md) | Agent entry point |
| [workflows/core-upgrade/workflow.yaml](workflows/core-upgrade/workflow.yaml) | State machine + capability gates |
| [config/](config/) | Policies (gates, escalation, retention, knowledge priority, tools, layout) |
| [knowledge/canonical/](knowledge/canonical/) | Authoritative version/error/symbol/migration/appsettings/anti-pattern records |
| [knowledge/derived/](knowledge/derived/) | Narrative evidence (non-authoritative), incl. `version-changes/changelog.md` |
| [memory/](memory/) | episodes → candidates → approved → rejected lifecycle |
| [templates/](templates/) | plan, report, escalation, unresolved-issue, learned-pattern, state seeds |
| [schemas/](schemas/) | JSON schemas for all machine records |
| [tools/](tools/) | `upgrade-agent` CLI, `validate.js`, `run-evals.js`, bootstrap engine, wrappers |
| [docs/architecture/overview.md](docs/architecture/overview.md) | Final architecture + ADRs |
| [docs/operations/](docs/operations/) | How to run, resume, bootstrap tools, remove client memory |

## Learning

Runs produce **episodes** (`../engine/memory/episodes/backend/`). Reusable lessons become **candidate** patterns (`../engine/memory/candidates/backend/`), which are never applied as authoritative until they pass validation, regression replay, and developer approval to become **approved** patterns (`../engine/memory/approved/backend/`). Rejected approaches are retained with reasons (`../engine/memory/rejected/backend/`). Client data is scoped and redacted per [config/retention-policy.yaml](../engine/config/retention-policy.yaml).

## Tools & validation

```text
node tools/upgrade-agent.js tools bootstrap   # detect + install permitted research tools, write manifest
node tools/upgrade-agent.js tools doctor      # diagnose environment (no install, no client changes)
node tools/validate.js                        # structural / schema / reference / invariant checks
node tools/run-evals.js                       # behavioural regression scenarios
node tools/repo-layout.test.js                # repository layout + cleanliness policy
node tools/bootstrap/tests/bootstrap.test.js  # tool bootstrap tests
```

Research tools are invoked through capability wrappers under [tools/wrappers/](tools/wrappers/); they never modify the client's dependency files. See [docs/operations/tool-bootstrap.md](docs/operations/tool-bootstrap.md).

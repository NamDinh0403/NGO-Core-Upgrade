# Phase 03 — Plan

- **Phase ID:** `03-plan`
- **State:** `PLAN`

## Purpose
Declare, before any mutation, every step and change the run intends to make. **Hard gate.**

## Required inputs
`inventory.json`, routed `knowledge/canonical/versions/{target}.json`, routed `knowledge/canonical/appsettings/appsettings-by-version.json`.

## Preconditions
Baseline completed. No `.csproj`, `appsettings*.json`, or `.cs` file has been modified.

## Required actions
1. Load only routed knowledge for the target version (see scoped-retrieval design).
2. Write `upgrade-plan-YYYY-MM-DD.md` at the solution root using `templates/upgrade-plan.template.md`.
3. Write `plan.json` in the run directory (machine mirror of the plan).
4. Set `state.json.planPath` and status `PLAN`.
5. **Enumerate the full appsettings surface up front.** From `appsettings-by-version.json`, compute the *cumulative* key set (every version above the client baseline up to and including the target — `applyPolicy.cumulative`). Discover every target file in the solution (API, WebJob, **and** `NGO.Deployment/appsettings.json`). Emit a **coverage matrix (key x file)** into the plan marking each cell `present` / `to-add` / `client-specific`. This matrix is a required plan artifact — appsettings work must be fully planned here, not improvised during UPGRADE.
6. **Treat all listed keys as startup-required** (`applyPolicy.startupRequired`): the plan must not defer any key as "optional/feature-gated". Feature enablement is a value decision, not a key-presence decision.

> **Why this matters:** Core binds these keys via `IOptions<T>` at host startup; a missing key breaks app load. Planning the complete matrix here prevents the run from stalling later on one-key-at-a-time fixes.

## Allowed tools
Read-only knowledge retrieval; file write of plan documents only.

## Required evidence
The routed version/appsettings entries consulted, recorded in `observations.jsonl`.

## Required outputs
`upgrade-plan-YYYY-MM-DD.md`, `plan.json`.

## Completion criteria
Plan file exists at solution root; `state.json.planPath` set; **appsettings coverage matrix (cumulative key x every target file) present in the plan**; `nextAction = "Load phases/04-upgrade.md"`.

## Documentation responsibilities
The plan is a mandatory developer-facing document; deviations are recorded later in the report.

## Checkpoint requirements
Checkpoint before writing the plan and after it exists.

## Retry behaviour
Missing routed knowledge is not a blocker — plan with explicit "unknown/expected" markers.

## Escalation conditions
- Canonical sources conflict irreconcilably → `BLOCKED_NEEDS_DEVELOPER`.

## Allowed next states
`UPGRADE`, or `HANDOVER`.

# Phase 04 — Upgrade

- **Phase ID:** `04-upgrade`
- **State:** `UPGRADE`

## Purpose
Apply the declared package and configuration changes. First mutating phase.

## Required inputs
`plan.json`, routed version + appsettings knowledge.

## Preconditions
Plan gate satisfied (`state.json.planPath` set).

## Required actions
1. Update all `NGO.Core.*` package references and target frameworks to the target version.
2. Delete `packages.lock.json` files (shell-appropriate command).
3. **Apply the complete appsettings coverage matrix from the plan.** Merge **every** cumulative required key (`applyPolicy.cumulative`) into **every** declared target file — API, WebJob **and** `NGO.Deployment/appsettings.json` (`applyPolicy.applyToAllTargetFiles`) — **without overwriting existing client values** (`overwriteExisting: false`). All listed keys are startup-required (`applyPolicy.startupRequired`); do **not** skip any key as "optional/feature-gated". Use safe/placeholder defaults; never write real secrets.
4. **Validate completeness before leaving this phase:** re-parse every edited `appsettings*.json`, and confirm every matrix cell is `present` (added or already-present). A single missing key or an un-covered file is a phase failure, not a follow-up prompt.
5. Record every changed file in `changed-files.json` and `actions.jsonl` (each with an `idempotencyKey`), and update the plan's coverage matrix to reflect applied state.

> **Restore-in-place acquisition.** Bumping the project-file versions/frameworks here is the
> planned way to enable `dotnet restore` (phase 05) to fetch the target packages via the
> solution's configured feeds/credentials and populate the NuGet cache for installed-DLL
> inspection. A standalone `.nupkg` download failing (401/NU1301) is **not** a reason to
> avoid this edit (`config/agent-policy.yaml#packageAcquisition`).

## Allowed tools
`.csproj` / `appsettings*.json` edits, file deletion of lock files. No `.cs` edits yet.

## Required evidence
Diff of each edited file; the routed knowledge that justified each key.

## Required outputs
Updated project/config files; `changed-files.json`.

## Completion criteria
All planned package/config changes applied and recorded; **the appsettings coverage matrix shows every cumulative key present across API + WebJob + Deployment files**; `nextAction = "Load phases/05-build-and-fix.md"`.

## Documentation responsibilities
Config changes must be captured for the report's "Configuration changes" section.

## Checkpoint requirements
Checkpoint **before and after** each mutation batch.

## Retry behaviour
An idempotent edit already recorded with a matching `idempotencyKey` must not be re-applied on resume.

## Escalation conditions
- A required key implies a secret the agent does not have → **add the key with a safe placeholder** (per `secretsPolicy`) and record it for deployment-time provisioning; escalate `BLOCKED_NEEDS_CONTEXT` **only** if the key cannot be placeholdered without breaking startup.
- Security/auth-related config change required → `BLOCKED_NEEDS_APPROVAL`.

## Allowed next states
`BUILD_AND_FIX`, or `HANDOVER`.

# Phase 05 — Build and Fix

- **Phase ID:** `05-build-and-fix`
- **State:** `BUILD_AND_FIX`

## Purpose
Reach a green build by fixing one compiler-error family at a time using the decompile-first Fix Pattern Workflow.

## Required inputs
Updated solution, routed error/symbol knowledge, approved memory patterns (labelled), candidate patterns (labelled, non-authoritative).

## Preconditions
Packages/config updated. Required capabilities (`build-dotnet`, decompiler, etc.)
are re-validated as `AVAILABLE` in `tool-manifest.json` at phase start
(`phases/01b-tool-bootstrap.md#completion-criteria`).

## Required actions
1. `dotnet restore --force`, then `dotnet build --no-restore`; capture `build.log`.
2. For each root-cause error family, run the 7-step Fix Pattern Workflow: BUILD → CLASSIFY → INSPECT (decompile installed DLL — authoritative) → CROSS-CHECK (routed knowledge, approved memory, candidate as hint only) → PATCH (minimal diff) → VERIFY → RECORD.
3. Update interface, implementation, base call, DI registration, and call sites atomically.
4. Record each attempt (success and failure) in `actions.jsonl` / `failures.jsonl` and resolved signatures in `state.json`.

## Allowed tools
`dotnet restore/build`, decompiler (`ilspycmd`), `.cs`/DI edits.

## Required evidence
Decompiled signature per fix; before/after error counts per iteration.

## Required outputs
Green build **or** a bounded, documented partial with escalation.

## Completion criteria
`dotnet build` reports 0 errors; `nextAction = "Load phases/06-test.md"`.

## Documentation responsibilities
Each error and its fix feeds the report's "Errors fixed" table.

## Checkpoint requirements
Checkpoint after every build and after every fix batch.

## Retry behaviour
Bounded by `escalation-policy.yaml`: max 5 build-fix iterations, max 2 attempts per identical fix, max 4 distinct patterns per issue. Revert a batch that increases errors.

## Escalation conditions
- Package acquisition follows `config/agent-policy.yaml#packageAcquisition` as
  the single source of truth (do not restate/re-derive the rule here): a
  standalone `.nupkg` probe download failing is **not** a blocker; escalate
  credentials (`BLOCKED_NEEDS_DEVELOPER` / `WAITING_FOR_CREDENTIAL`) **only**
  when the client's own `dotnet restore --force` fails authentication
  (NU1301/401).
- Same error remains after max attempts → `BLOCKED_NEEDS_DEVELOPER`.
- No applicable approved pattern and decompile inconclusive → `BLOCKED_NEEDS_DEVELOPER`.
- Fix would change a public API or require an architecture-wide change → `BLOCKED_NEEDS_APPROVAL`.
- Budget exceeded → `FAILED_BUDGET`.

## Allowed next states
`TEST`, back to `UPGRADE` (if a package choice was wrong), or `HANDOVER`.

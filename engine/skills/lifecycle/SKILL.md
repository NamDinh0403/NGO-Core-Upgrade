---
name: shared-upgrade-lifecycle
description: Own the single NGO Core upgrade lifecycle, sliced contexts, executor dispatch, validation and reporting for any requested track.
---

# Shared Lifecycle

`DISCOVER -> CORE_ANALYSIS -> IMPACT_ANALYSIS -> PLAN -> EXECUTE -> VALIDATE -> REPORT`
is controlled by `engine/tools/lib/lifecycle.js`. Executors expose only
READY/RUNNING/PASSED/FAILED/BLOCKED. Old track phase names are checkpoint labels,
not another lifecycle. Load only the current run, selected skill and applicable
evidence; never all skills, knowledge, history or the complete diff by default.

## Discover And Analyze
Discover client paths and installed source versions deterministically through the
requested executor. Ask once for genuinely missing/conflicting inputs, including
the target; never choose a target from the highest installed version.
Run `node engine/tools/upgrade-engine.js create-run --client <id> --tracks <tracks>
--core-path <core> --source-version <source> --target-version <target>` with each
requested `--<track>-client-path`. The engine alone ensures ingestion; ingest is
the canonical CoreChangeSet producer. One result references all intermediate
releases and verified commits/notes/analyzer hashes. Cache reuse still validates
identity. Candidates are hints, not canonical knowledge or compatibility proof.
Blocked analysis stops dispatch with one exact resume action.

## Plan
Run `dispatch --run <client>/<run> --track <track> --operation plan`.
Pass only `contexts/<track>.json` and that track's client path to the executor.
Shared requirements appear once per packet. API/contract impact and validation
status are the cross-track boundary, not .NET/EF or Angular implementation data.
Use `engine/skills/plan/SKILL.md`, then the domain implementation-planning skill.
Retrieve immutable Core evidence lazily through `context --evidence-version`.
Record finding dispositions with verification/not-applicable evidence; hints
never authorize blind changes. Register each plan through `register-plan --file
<json>` with `{plan, gateFacts}`. Every change names file, evidence and validation.

## Execute
Run `dispatch --operation execute` only against a registered READY plan and an
unchanged context. The engine opens the mutation gate; the domain executor
implements the registered changes. Baseline, rollback, capabilities, uncertainty,
approval and fingerprint gates remain mandatory. Installed Core DLL/public API
verification wins over source diffs. Frontend must verify actual dependencies,
toolchain and the full target reference-host composition. Serialize mutations
when client working trees overlap. Never modify or switch Core; never commit
secrets, promote candidates or perform ambiguous/destructive changes unapproved.

## Diagnose And Validate
Use the shared diagnosis/retry policy with domain-specific evidence. Do not
repeat identical unsuccessful fixes or hide skipped checks. Return validation
via `record-validation --file <json-array>` with `{kind,status,ref}` entries.
Domain executors check their required evidence; the engine fingerprints results.
Missing installed-surface/build/test/config/integration evidence cannot PASSED.
Legacy track state files remain readable as checkpoint/evidence projections.

## Report And Learn
Compose domain artifacts, verify coverage, prepare handover, then final-report.
No COMPLETE with failed/missing evidence or unowned outstanding work. Run the
shared learning procedure for success, failure or blockage. It writes sanitized,
scoped episodes/candidates only. Promotion requires explicit developer review.
Every result has one status, exact next action and safe resume instruction.
# Skill Implementation Report

Date: 2026-08-19

## Executive summary
A complete, functional skill layer was implemented under `skills/`, backed by a
deterministic engine (`tools/skills/lib/engine.js`), validated schemas, a stable CLI
(`upgrade-agent`), lazy capability activation, and a 40-scenario test suite. Planning
is mandatory and read-only; client mutation is impossible without a READY plan and an
open mutation gate; optional research tools activate only when a plan requires them.

## Skills implemented (8)
`plan-upgrade`, `research-version`, `analyze-client-impact`, `execute-upgrade`,
`investigate-build-failure`, `audit-frontend-integration`, `learn-from-run`,
`developer-escalation`.

## Skill boundaries
Each skill has a single bounded responsibility (plan / research / impact / execute /
diagnose / front-end audit / learn / escalate). No oversized all-purpose skill exists.
Central policy is referenced from `config/`, not duplicated per skill.

## Skill transitions
Enforced by `engine.isValidTransition` against `skills/registry.yaml`:
```
plan-upgrade → {research-version, analyze-client-impact, execute-upgrade, developer-escalation}
research-version → {plan-upgrade, analyze-client-impact, developer-escalation}
analyze-client-impact → {plan-upgrade, execute-upgrade, developer-escalation}
execute-upgrade → {investigate-build-failure, audit-frontend-integration, research-version, learn-from-run, developer-escalation}
investigate-build-failure → {execute-upgrade, research-version, developer-escalation}
audit-frontend-integration → {execute-upgrade, research-version, learn-from-run, developer-escalation}
learn-from-run → {developer-escalation}
developer-escalation reachable from every skill.
```
Invalid transitions (e.g. `learn-from-run → execute-upgrade`, `research-version → execute-upgrade`) are rejected.

## Schemas created
`skills/registry.yaml` + 16 per-skill JSON schemas (input + output for each of 8 skills),
plus 8 sample outputs under `skills/*/evals/`. Invariants encoded as schema `const`:
research `clientUnchanged:true`, learn `wroteToCanonical:false` / `approvedOwnCandidates:false`
/ `clientIdentifiersInGlobalMemory:false`, audit `installOnlySuccess:false`,
investigate `usedCandidateAsAuthoritative:false`, plan `readOnly:true`.

## Source code added / changed
- Added: `tools/skills/lib/engine.js` (selection, transitions, mutation gate, uncertainty
  gates, lazy capability activation, invocation recording), `tools/skills.test.js`.
- Changed: `tools/upgrade-agent.js` (doctor/plan/research/run/resume/status/learn),
  `tools/validate.js` (skill registry + schema check), `config/repository-layout-policy.yaml`.

## Old code simplified / removed
No dead code required removal. The tool bootstrap already installed only applicable +
permitted tools and treated missing optional tools as non-blocking warnings. The new
`doctor` reports `READY_FOR_PLANNING` from Level 0/1 alone, so optional Level 2/3 tool
absence never appears as a setup failure and specialist tools are never installed before
planning. Wrappers and capability resolvers were kept.

## Lazy capability behavior
Four levels (`docs/operations/tool-capabilities.md`): Level 0 inspection (no install,
planning always works), Level 1 prerequisites (checked per detected tech, never
auto-installed), Level 2 research tools (activated only when the plan requires),
Level 3 deep research (only for unresolved HIGH/CRITICAL uncertainty). Verified by
scenarios 09–17 and 40.

## Uncertainty behavior
KNOWN/ASSUMED/UNCERTAIN/CONTRADICTORY/NOT_APPLICABLE classification; register with
OPEN/RESEARCHING/RESOLVED/ACCEPTED_RISK/DEFERRED/REQUIRES_DEVELOPER/NOT_APPLICABLE and
LOW/MEDIUM/HIGH/CRITICAL impacts; HIGH/CRITICAL open uncertainty blocks the affected
mutation and cannot be auto-accepted (scenarios 05–08, 23).

## Evaluations added
`tools/skills.test.js` — 40/40 covering all required behaviours.

## Commands executed
```
node tools/skills.test.js     -> 40/40
node tools/validate.js        -> 14/14
node tools/run-evals.js       -> 12/12 (silent-stop 0)
node tools/bootstrap/tests/bootstrap.test.js -> 20/20
node tools/repo-layout.test.js -> 7/7
node tools/upgrade-agent.js doctor  -> READY_FOR_PLANNING
node tools/upgrade-agent.js plan/status/resume -> functional
```

## Current limitations
- Skills are executed by the LLM agent; the engine provides the deterministic harness
  (selection, gates, schema validation, recording) rather than a full execution runtime.
- CLI `research`/`run`/`learn` scaffold and guard (plan presence + mutation gate); the
  substantive work is performed by the agent following the SKILL.md procedures.

## Recommended future skills
`audit-backend-integration` (DI/EF/host wiring parity), `security-authz-review`,
`deployment-config-migration`, `dependency-conflict-resolver`, `test-triage`.

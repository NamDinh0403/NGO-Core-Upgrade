# Unified agent — decisions

## Current Contract Update (2026-10-06)

The approved execution-contract refactor supersedes DEC-1/DEC-2 only for shared
ensuring, generic lifecycle, knowledge-reader and context ownership. Local track
state/checkpoints, domain policies, standalone discovery identities and canonical
promotion remain. The single shared lifecycle lives in
`orchestrator/skills/lifecycle/SKILL.md`; track ingestion procedures consume owner
contexts instead of calling ingest. See
[execution-contract-report.md](execution-contract-report.md) for the current map.

Real, consequential decisions made during this refactor, with evidence and
rationale. Not a log of routine implementation detail.

## DEC-1 — Keep backend/frontend internal run state machines untouched

**Decision:** Do not merge `backend/runs/` and `frontend/runs/` into one
physical tree, and do not rewrite either track's internal state machine to
read/write a unified schema. Add a new sibling `orchestrator/` module that
owns one run-id and composes each track's existing output instead.

**Evidence considered:**
- `backend/workflows/core-upgrade/` defines a 10-phase, tested state machine
  (`tools/validate.js`, `tools/run-evals.js`) with real client run history
  under `backend/runs/ngo-online-brc/`.
- `frontend/tools/lib/engine.js` drives a 14-skill pipeline
  (`tools/validate.js`, `tools/repo-layout.test.js`) with real client run
  history under `frontend/runs/{ngo-client,ngo-online-cbm,ngo-online-norcross}/`.
- Both are already validated, in active use, and have their own
  `config/*-policy.yaml` gates the pasted spec doesn't ask to remove.

**Rationale:** Rewriting two large, independently-tested, currently-correct
state machines to satisfy "one physical run directory" is high-risk for a
requirement that can be satisfied just as well by "one run-id, shared
requirements/coverage/handover, each track's own internal bookkeeping left
alone." Confirmed with the developer before implementation (see plan
approval).

**Consequence:** `orchestrator/runs/<client>/<run-id>/` is the *authoritative
shared* run for cross-cutting artifacts (requirements seed, merged coverage,
merged handover, final report). `backend/runs/<client>/<run-id>/` and
`frontend/runs/<client>/<run-id>/` remain each track's own execution detail,
referenced by path from the shared run rather than duplicated into it.

## DEC-2 — Do not create 7 of the pasted spec's 9 named shared skills

**Decision:** Only add `verify-release-coverage` and
`prepare-deployment-handover` as new capabilities (inside `orchestrator/`, not
as new `.github/skills/*` folders — see DEC-3). Do **not** create
`.github/skills/ingest-core-release`, `inspect-local-core`,
`plan-core-upgrade`, `execute-backend-upgrade`, `execute-frontend-upgrade`,
`investigate-upgrade-failure`, or `learn-from-upgrade`.

**Evidence considered:** Read both `backend/skills/ingest-core-release/SKILL.md`
and `frontend/skills/ingest-core-release/SKILL.md` side by side — both are
already thin wrappers delegating to `ingest/tools/ingest.js`, consuming only
their own findings slice. `frontend/skills/inspect-local-core/SKILL.md`
already implements scoped, read-only Core inspection.
`backend/skills/plan-upgrade`, `frontend/skills/plan-frontend-upgrade`
(planning); `backend/skills/execute-upgrade`,
`frontend/skills/execute-frontend-upgrade` (execution);
`backend/skills/investigate-build-failure`,
`frontend/skills/investigate-frontend-failure` (failure investigation);
`backend/skills/learn-from-run`, `frontend/skills/learn-from-frontend-run`
(learning) already exist, one per domain, each appropriately scoped to its
own domain's file types and gates.

**Rationale:** The pasted spec's own mandate is "remove duplicated backend and
frontend ingestion logic" and "do not use indefinite dispositions." Creating
new `.github/skills/*` wrappers around capabilities that already exist,
correctly scoped, per domain, would itself be new duplication — the opposite
of the spec's intent read literally. The two skills that generalize this
decision (`verify-release-coverage`, `prepare-deployment-handover`) are
different: no per-track equivalent merges *across* domains today, so they are
genuinely new shared capability, not a wrapper around existing per-track logic.

**Consequence:** Documented here as a deliberate, evidence-backed scope
decision rather than a silent omission.

## DEC-3 — House the new orchestrator capabilities in `orchestrator/`, not `.github/skills/`

**Decision:** `create-run`, `compose-results`, `verify-coverage`,
`prepare-handover`, `final-report` are subcommands of one CLI,
`orchestrator/tools/orchestrator.js`, driven by the existing
`.github/agents/ngo-core-upgrade-orchestrator.agent.md` /
`.github/skills/ngo-core-upgrade-orchestrator/SKILL.md` pair — not five new
`.github/skills/*/SKILL.md` folders.

**Rationale:** Matches the repo's own established convention: `ingest/` is a
real, shared, non-`.github` module with its own CLI/schemas/tests, driven by a
thin per-track `SKILL.md` wrapper. `orchestrator/` follows the identical
pattern for orchestrator-owned logic. `.github/` stays reserved for Copilot
discovery surfaces (agents, skills, instructions, prompts) per the spec's own
Phase 1 layout guidance, not for the actual implementation.

## DEC-4 — Delete the duplicate root `compiler-error-fix-loop.png`

**Decision:** Delete `compiler-error-fix-loop.png` at the repo root; keep
`frontend/docs/assets/compiler-error-fix-loop.png`; update `README.md`'s
workspace-layout diagram to stop listing it as a root file.

**Evidence:** `Get-FileHash` confirms byte-identical SHA256
(`10D0D224C5E0D1B5320C2F536D20C2841E9190E3BA636D23C61A6E5E96C5402A`) for both
copies. `frontend/config/repository-layout-policy.yaml` lists
`compiler-error-fix-loop.png` under `forbiddenRootFiles` (scoped to the
frontend track root), confirming the asset's intended home is
`frontend/docs/assets/`, not the workspace root.

## DEC-5 — `.github/instructions/` and `.github/prompts/` are deferred, not silently dropped

**Decision:** Do not create the pasted spec's
`.github/instructions/*.instructions.md` or
`.github/prompts/*.prompt.md` scaffolding in this pass.

**Rationale:** The developer's explicit priority list (the "minimum working
path") does not include these; the 8 prioritized items are all satisfied
without them. Recorded here as an explicit follow-up rather than left
unmentioned, per the instruction not to use indefinite dispositions —
this is a scoping decision with a stated reason, not a "maybe later."

---
name: ingest-core-release
description: Derives candidate Core version knowledge via the shared ingest phase (git history + release-notes.md, both tracks) — without requiring a human to notice a new release or hand-transcribe its notes.
metadata:
  id: ingest-core-release
  version: 2.0.0
  status: active
  risk: low
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose
Close the gap between "Core shipped a new version" and "the agent has usable
knowledge about it" without a human re-reading release notes and hand-writing
`knowledge/canonical/versions/*.json` every time. This skill is a thin,
backend-facing wrapper around the **shared** ingestion phase in
[../../../ingest/](../../../ingest/README.md) — the actual git-diff /
release-notes cross-check logic lives there, once, so a Core version is never
diffed and parsed twice (once per track) with two candidate records that could
silently disagree.

# Trigger conditions
- `research-version`'s evidence ladder reaches a point where approved version
  knowledge is missing/insufficient for the target version **and**
  a local NGO.Core repository path is available (new rung, before
  developer/vendor escalation).
- `plan-upgrade` detects `targetVersion` absent from
  `knowledge/canonical/versions/` **and** a local Core repository path is
  available.
- On-demand maintenance check: `node ../ingest/tools/ingest.js check --core-path <path>`
  (equivalent to the former track-local `check-core-releases` command, now
  delegating to the shared tool so it also accounts for what frontend
  already knows).
- The `ngo-core-upgrade-orchestrator` custom agent runs the shared ingestion
  phase once per engagement before delegating to this track — in that case
  this skill's job reduces to step 1 below (read the already-produced record).

# Exclusions
- Never writes to `knowledge/canonical/` — output is candidate-only
  (`../../ingest/knowledge/candidates/releases/<version>.json`), consistent
  with every other candidate-producing skill in this repository (`learn-from-run`).
- Never mutates, checks out, resets, or switches branches in the Core
  repository (`ingest/tools/lib/git.js` is read-only by construction).
- Never touches the client repository.
- Does not re-implement git-diff/release-notes parsing locally — that logic
  lives once in `ingest/tools/ingest.js`. If it's missing/inaccessible
  (e.g. a standalone copy of this track without the sibling `ingest/`
  folder), escalate rather than reinventing it here.
- Does not replace the decompiled-installed-DLL rule for concrete symbol
  signatures (`config/knowledge-priority.yaml#evidenceOverride`) — that stays
  authoritative on the client's own restored packages. This skill answers a
  different question: what changed release-to-release, and why.

# Preconditions
- `../../ingest/tools/ingest.js` exists (sibling directory). If not, this
  is a packaging/install problem, not a per-run problem — return
  `BLOCKED_NEEDS_DEVELOPER`, do not attempt a local reimplementation.
- A local, read-only NGO.Core repository path is available (from the run
  request, or supplied by the `ngo-core-upgrade-orchestrator` when it delegates
  to this track). If absent, return `BLOCKED_NEEDS_CONTEXT`.

# Required capabilities
`inspect-core-repository-history` (delegated to `ingest/tools/lib/git.js`
under the hood), `inspect-approved-knowledge`, `validate-json-schema`.

# Inputs
See `schemas/input.schema.json` — `coreRepoPath`, optional `releaseNotesPath`,
optional `sinceVersion`/`targetVersion`.

# Procedure
1. Follow the owning **Ingest And Analyze** section of
  [shared lifecycle](../../../orchestrator/skills/lifecycle/SKILL.md).
  With a shared run, consume `contexts/backend.json` using orchestrator `context`.
  Without one, request `create-run --tracks backend` from that owner. Never call
  ingest independently, including for freshness; stale context blocks execution.
2. Confirm context verification succeeded and source/target/client/run match.
4. **Consume only this track's slice.** Use backend context requirements; request
  lazy scoped evidence with `context --track backend --evidence-version <v>`.
  Never load the complete candidate record into the prompt. Map findings into the shape
   `research-version`/`plan-upgrade` expect (statement + verification level:
  `CONFIRMED_BY_DIFF_AND_NOTES` → file-change metadata confidence only,
   `OBSERVED_IN_DIFF_NOT_MENTIONED_IN_NOTES` / `NOTED_BUT_UNCONFIRMED_BY_DIFF` →
   `UNCONFIRMED`).
  `correlationOnly` is a filename/note hint, not API compatibility proof.
  Installed-DLL evidence still controls concrete signatures. Omit optional
  CLI flags without available values; never pass placeholders.
5. Surface every `unresolvedItems` entry relevant to `backend`/`shared` scope
   unchanged — do not resolve them here.

# Evidence requirements
Every finding cites its source (`git-diff`, `release-notes`, or `both`) via the
shared record's `evidence` field. This skill adds no new evidence of its own —
it consumes and narrows what `ingest/tools/ingest.js` already produced.

# Uncertainty handling
Every `unresolvedItems` entry stays an open item for developer review — never
silently resolved in either direction by this skill.

# Completion criteria
The shared candidate record exists (fresh or reused), the backend/shared slice
was extracted, and `ingest`'s fingerprint check confirmed the Core
repository was unchanged. Status is one of the enumerated values with an exact
`nextAction`.

# Retry behavior
Consume the same verified context; only the owner revalidates ingestion.

# Escalation behavior
- `../../ingest/` is missing (broken install/packaging) → `BLOCKED_NEEDS_DEVELOPER`.
- No Core repository path configured → `BLOCKED_NEEDS_CONTEXT`.
- The shared tool reports the Core repository changed during ingestion (its own
  fingerprint check failed) → `BLOCKED_NEEDS_DEVELOPER` via `developer-escalation`.
- `release-notes.md` missing/unreadable → the shared tool still proceeds with
  diff-only findings (`SUCCEEDED_WITH_WARNINGS`); do not block purely on the
  notes file being absent.

# Outputs
See `schemas/output.schema.json` — `discoveredVersions`, `findings` (backend +
shared slice only), `candidateRefs` (pointing at the shared file), `changelogDraftRef`,
`unresolvedItems`, `nextAction`.

# Allowed next skills
`research-version` (normal return — re-evaluate the plan against the new
candidates, still labelled ASSUMED), `plan-upgrade`, `developer-escalation`.

# Prohibited behavior
No write to `knowledge/canonical/`. No self-approval of its own candidates. No
Core repository mutation. No re-implementing git-diff/notes-parsing locally —
always use the orchestrator-owned CoreChangeSet. No treating a candidate as
authoritative in the same run that produced it
(`config/knowledge-priority.yaml` rank 6.5/7.5 — always below canonical).

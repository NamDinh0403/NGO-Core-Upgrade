---
name: ingest-core-release
description: Derives DRAFT candidate release requirements via the shared ingest phase (git history + release-notes.md, both tracks) — without requiring a human to notice a new release or hand-transcribe it into knowledge/canonical/releases/.
metadata:
  id: ingest-core-release
  version: 2.0.0
  status: active
  risk: low
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose

Close the gap documented in `docs/operations/import-release-notes.md` and
`update-release-knowledge.md`: today, a new NGO Core release only becomes
usable knowledge after a human manually re-reads `release-notes.md` and
hand-splits it into atomic `knowledge/canonical/releases/<version>/*.yaml`
records. This skill is a thin, frontend-facing wrapper around the **shared**
ingestion phase in [../../ingest/](../../ingest/README.md) — the
actual git-diff / release-notes cross-check logic lives there, once, so a Core
version is never diffed and parsed twice (once per track, as it would be if
each track kept its own copy) with two candidate records that could silently
disagree.

# Trigger conditions
- `resolve-target-packages` or `derive-release-requirements` finds that
  `knowledge/canonical/releases/<version>/` is missing or empty for one or
  more versions inside the resolved `sourceVersion..targetVersion` range
  (`tools/lib/release-range.js#resolve`), and `repositories.core.path` is
  configured (it always is — see `schemas/run-request.schema.json`).
- A manual maintenance check requests newer Core releases.
- The `ngo-core-upgrade-orchestrator` custom agent runs the shared ingestion
  phase once per engagement before delegating to this track — in that case
  this skill's job reduces to step 1 below (read the already-produced record).

# Exclusions
- Never writes to `knowledge/canonical/releases/` — output stays `status:
  "CANDIDATE"` under `../../ingest/knowledge/candidates/releases/<version>.json`
  only, consistent with every other candidate-producing path in this repository.
- Never mutates, checks out, resets, or switches branches in the Core
  repository (`ingest/tools/lib/git.js` is read-only by construction;
  `config/repository-safety-policy.yaml` still applies to this track).
- Never touches the client repository.
- Does not re-implement git-diff/release-notes parsing locally — that logic
  lives once in `ingest/tools/ingest.js`. If it's missing/inaccessible,
  escalate rather than reinventing it here.

# Preconditions
- `../../ingest/tools/ingest.js` exists (sibling directory). If not, this
  is a packaging/install problem, not a per-run problem — return
  `BLOCKED_NEEDS_DEVELOPER`, do not attempt a local reimplementation.
- `repositories.core.path` resolves and `tools/lib/git.js#isGitRepo` is true.
- A Core fingerprint (`tools/lib/git.js#fingerprint`) is captured before this
  skill runs, so "Core unchanged" can be verified afterward — the shared tool
  does this internally too, but this track's own gate mirrors it.

# Required capabilities
`read-core-repository`, `inspect-configuration`.

# Inputs
See `schemas/input.schema.json` — `corePath`, optional `releaseNotesPath`,
optional `sinceVersion`.

# Procedure
1. **Check whether the shared record already exists and is fresh.** Read
   `../../ingest/knowledge/candidates/releases/<version>.json`. If it
   exists, was produced from the same `corePath`, and its `sources.tagRange.to`
   matches, skip straight to step 3 (reuse it) — the common case when the
   orchestrator already ran the shared phase, or a sibling backend run
   already ingested the same version.
2. If it doesn't exist or is stale, invoke the shared tool (do not reimplement
   its logic here):
   ```
   node ../ingest/tools/ingest.js ingest \
     --core-path <corePath> \
     --release-notes <releaseNotesPath> \
     --target <version>
   ```
   This fingerprints the Core repository before/after, enumerates the tag
   boundary, diffs it read-only, parses the matching `release-notes.md`
   section, cross-checks both sources, and writes
   `ingest/knowledge/candidates/releases/<version>.json`.
3. **Consume only this track's slice.** Read `findings.frontend` and
   `findings.shared` from the shared record (ignore `findings.backend` — that's
   backend's concern). Map each finding into a DRAFT
   `schemas/release-requirement.schema.json`-shaped record for
   `derive-release-requirements` to consume: `crossCheck:
   "CONFIRMED_BY_DIFF_AND_NOTES"` → higher confidence; `OBSERVED_IN_DIFF_...` /
   `NOTED_BUT_UNCONFIRMED_BY_DIFF` → `confidence: "LOW"`, `status: "DRAFT"`.
4. Redact any secret-looking value before writing anything — the shared tool
   already redacts at ingestion time; this step is a second check, not the
   primary one.
5. Surface every `unresolvedItems` entry relevant to `frontend`/`shared` scope
   unchanged — do not resolve them here.
6. Re-fingerprint the Core repository and confirm it is unchanged before
   returning (belt-and-braces on top of the shared tool's own check).

# Evidence requirements
Every finding cites its source (`git-diff`, `release-notes`, or `both`) via the
shared record's `evidence` field. This skill adds no new evidence of its own —
it consumes and narrows what `ingest/tools/ingest.js` already produced.

# Uncertainty behavior
Every cross-check gap stays an open item for developer review; nothing is
silently resolved in either direction.

# Completion criteria
The shared candidate record exists (fresh or reused), the frontend/shared
slice was extracted into DRAFT release-requirement records, and Core is
verified unchanged. Status is one of the enumerated values with an exact
`nextAction`.

# Retry behavior
Idempotent per version boundary — re-running the shared tool overwrites the
same shared file rather than duplicating it.

# Escalation behavior
- `../../ingest/` is missing (broken install/packaging) → `BLOCKED_NEEDS_DEVELOPER`.
- `repositories.core.path` missing/not a git repo → `BLOCKED_NEEDS_CONTEXT`.
- Core fingerprint changed during inspection → `BLOCKED_NEEDS_DEVELOPER` via
  `developer-escalation` (same rule `inspect-local-core` already applies).
- `release-notes.md` missing/unreadable → the shared tool still proceeds with
  diff-only findings (`SUCCEEDED_WITH_WARNINGS`); do not block purely on the
  notes file's absence.

# Outputs
See `schemas/output.schema.json` — `discoveredVersions`, `candidateRefs`
(pointing at the shared file), `unresolvedItems`, `nextAction`.

# Allowed next skills
`derive-release-requirements` (normal return — the newly discovered DRAFT
candidates are available for review), `developer-escalation`.

# Prohibited behavior
No write to `knowledge/canonical/`. No self-approval of its own candidates. No
Core repository mutation. No re-implementing git-diff/notes-parsing locally —
always delegate to `ingest/tools/ingest.js`. No treating a DRAFT candidate
as `ACTIVE` in the same run that produced it.

# Evaluations
See `evals/`. Covers a successful ingestion producing DRAFT candidates plus an
`unresolvedItems` cross-check gap, matching the `ingested.output.json` fixture.

---
name: research-version
description: Researches a Core target version outside the client repository using a progressive evidence ladder.
metadata:
  id: research-version
  version: 1.0.0
  status: active
  risk: medium
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose
Resolve missing/contradictory/insufficient version knowledge using the least
expensive sufficient method, entirely outside the client repository.

# Trigger conditions
- Approved version knowledge is missing, incomplete, contradictory, or insufficient for the client.

# Exclusions
- Never modifies client package references, manifests, lockfiles, source, or configuration.
- Never installs or invokes every possible tool automatically.

# Preconditions
- A plan exists and marked `RESEARCH_REQUIRED`, or an execution paused with HIGH/CRITICAL uncertainty.
- Isolated research storage available under `runs/<client>/<run-id>/artifacts/research/` and disposable probe projects.

# Required capabilities
`inspect-approved-knowledge`, `inspect-nuget-metadata` (Level 0).

# Optional capabilities (activated lazily, stop at the earliest sufficient rung)
`acquire-nuget-package`, `compare-package-content`, `compare-dotnet-public-api`,
`inspect-dotnet-assembly-metadata`, `selectively-decompile-dotnet` (policy-gated),
`acquire-npm-package`, `compare-npm-package-content`, `typecheck-typescript`.

# Inputs
See `schemas/input.schema.json` — target package(s), source/target versions, the uncertainty IDs to resolve.

# Procedure — backend evidence ladder (stop at earliest sufficient level)
1. Approved version knowledge → 2. registry/NuGet metadata → 3. package acquisition →
4. package-content compare → 5. public assembly metadata compare → 6. dependency-resolution probe →
7. compile probe → 8. ApiCompat (only if metadata insufficient) → 9. runtime probe →
10. selective decompilation (only if permitted and still required) →
10.5. **`ingest-core-release`** (only if a `coreRepoPath` is configured —
`config/core-repository.yaml` — derives candidate version knowledge from the
local NGO.Core git history + shared `release-notes.md` instead of stopping at
"nothing found"; re-enter this ladder at rung 1 with the resulting candidates,
still labelled non-authoritative) → 11. developer/vendor escalation.

> **Why rung 10.5 exists.** Rungs 1–10 assume the answer lives in a published
> NuGet package or the client's own restored DLL. Neither helps when the
> **canonical version knowledge itself** (`knowledge/canonical/versions/*.json`)
> was never authored for this target version — a real, recurring situation
> when Core ships faster than a human transcribes its release notes. Rung 10.5
> is a cheaper, more complete substitute for immediately escalating to a human
> for "I don't have data on this version": it produces the same kind of
> evidence a human would have manually typed, cross-checked against the
> release notes, and still gated behind developer approval before becoming
> canonical.

> **Acquisition note.** A `401`/`NU1301` on the isolated download (rung 3) is **not** a
> blocker. The authoritative acquisition for installed-DLL inspection is the client's own
> credentialed `dotnet restore` after the planned version bump
> (`config/agent-policy.yaml#packageAcquisition`, phase 05). If approved knowledge is
> missing and the probe cannot download, return `RESEARCH_REQUIRED` and plan a
> **restore-in-place** acquisition (edit `.csproj` → `dotnet restore` → inspect the DLL).
> Escalate `WAITING_FOR_CREDENTIAL` only when the client `dotnet restore` **itself** fails
> authentication.

# Procedure — front-end evidence ladder
1. approved knowledge → 2. registry metadata → 3. package.json/peer-dep compare → 4. tarball acquisition →
5. content compare → 6. export/declaration compare → 7. migration/schematic inspection →
8. dependency-resolution probe → 9. type-check probe → 10. dev/prod build probes → 11. bootstrap smoke →
12. selective implementation inspection → 13. developer/vendor escalation.

# Evidence requirements
Classify each conclusion: OBSERVED, INFERRED, VERIFIED_BY_METADATA, VERIFIED_BY_COMPILE, VERIFIED_BY_TEST, VERIFIED_AT_RUNTIME, UNCONFIRMED.

# Uncertainty handling
Update `uncertainty-register.yaml`: resolved uncertainties reference the evidence; remaining ones keep their status. Do not accept HIGH/CRITICAL automatically.

# Completion criteria
A candidate compatibility manifest exists with per-finding verification levels; the resolved/remaining uncertainty is recorded; status is SUCCEEDED / SUCCEEDED_WITH_WARNINGS / BLOCKED_NEEDS_DEVELOPER / FAILED_POLICY / FAILED_BUDGET.

# Retry behavior
Bounded by `config/escalation-policy.yaml` budgets. Do not re-run identical probes.

# Escalation behavior
When the ladder is exhausted without sufficient evidence → `developer-escalation` (WAITING_FOR_DEVELOPER_DECISION / WAITING_FOR_VENDOR).

# Outputs
See `schemas/output.schema.json` — provenance, versions, hashes, diffs, API/export changes, probe results, verified vs unconfirmed findings, candidate compatibility manifest, nextAction.

# Allowed next skills
`plan-upgrade` (normal return after evidence changes the plan), `analyze-client-impact`,
`ingest-core-release` (rung 10.5, when canonical version knowledge itself is missing and
`coreRepoPath` is configured), `developer-escalation`.

# Prohibited behavior
No client mutation. No speculative installation of ApiCompat/ILSpy when metadata + compile probes already suffice.

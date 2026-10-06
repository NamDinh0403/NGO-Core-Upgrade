# Upgrade Report — {ClientName} — Core {TargetVersion}

> **MANDATORY.** The agent must produce this file at the solution root as `upgrade-report-{YYYY-MM-DD}.md` before transitioning state to `COMPLETED`.
> Replace every `{placeholder}` with concrete values. Delete sections that do not apply (but never leave the section empty — write "N/A").

---

## Upgrade Result

- **Status:** SUCCESS | PARTIAL | BLOCKED
- **Client:** {ClientName}
- **Solution:** {path/to/solution.sln}
- **Previous version:** {X.Y.Z}
- **Target version:** {X.Y.Z}
- **.NET target:** {net8 | net9 | net10}
- **Build result:** Build succeeded | Build failed ({n} errors, {n} warnings)
- **EF migration result:** Applied `UpgradeCoreXY` | Skipped (no schema change) | Failed
- **Total iterations:** {n} of 5
- **Date:** {YYYY-MM-DD}
- **Agent duration:** {approximate wall clock}

---

## Agentic Reasoning Summary

- **Accepted hypotheses:**
  - {hypothesis} → confirmed by {evidence}
- **Rejected hypotheses:**
  - {hypothesis} → contradicted by {evidence}
- **Playbook overrides:** {triage reordering rationale, or "None"}
- **Decompile lookups:** {classes inspected via `ilspycmd`, or "None"}

---

## Files Changed

| File | Change Summary |
|------|----------------|
| {path/to/file.cs} | {what changed and why} |
| {path/to/file.csproj} | Bumped NGO.Core.* packages from {old} → {new} |

Total files modified: **{n}**

---

## Errors Fixed

| Error Code | Count | Fix Summary | Structured Route | Corroborating Source | Status |
|-----------|-------|-------------|------------------|----------------------|--------|
| CS{nnnn} | {n} | {one-line summary} | knowledge/canonical/errors/{ERROR}.json + knowledge/canonical/symbols/{FQN}.json | memory/episodes/ (by error/symbol/version) | Novel/Reused |

---

## Configuration Changes

- **appsettings.json:** {keys added/removed/renamed, or "None"}
- **DI registrations:** {services added/replaced, or "None"}
- **EF migrations:** {migration name applied, or "None"}
- **NuGet (non-Core):** {transitive bumps required, or "None"}

---

## Remaining Issues

- {Issue 1 + recommended next action} | **None**

---

## Deviations from Plan

> Reconcile this run against `upgrade-plan-{YYYY-MM-DD}.md`. The developer uses this table to cross-check the plan against what actually happened. Write "None — run matched the plan" if there were no deviations.

| Planned item | What actually happened | Reason |
|--------------|------------------------|--------|
| {planned step/change} | {done as planned / not done / done differently} | {why} |

- **Planned but not done:** {list, or "None"}
- **Done but not planned:** {list, or "None"}

---

## Validation Commands Run

```bash
dotnet restore --force
dotnet build --no-restore
dotnet ef migrations add UpgradeCoreXY --context NgoContext --project src/NGO.Repositories   # if applicable
dotnet ef database update --context NgoContext --project src/NGO.Repositories                 # if applicable
```

Exit codes: restore={n}, build={n}, ef={n}

---

## Lessons Learned (feed back into reference)

- {Insight} → propose adding/updating [knowledge/index/routing-table.json](../backend/knowledge/index/routing-table.json) and the matching JSON route under `knowledge/canonical/errors/`, `knowledge/canonical/symbols/`, or `knowledge/canonical/versions/`
- {Insight} → add legacy Markdown notes only if the finding needs long-form context beyond the JSON fact entry

---

## Promote to an episode?

- [ ] Yes — a structured episode is written under `../engine/memory/episodes/backend/` (retrievable by error/symbol/version), and any reusable lesson is proposed as a `../engine/memory/candidates/backend/` pattern.
- [ ] No — routine run, keep at solution root only.

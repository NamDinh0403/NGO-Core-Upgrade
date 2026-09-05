# Upgrade Plan — {ClientName} — Core {TargetVersion}

> **MANDATORY.** The agent must produce this file at the solution root as `upgrade-plan-{YYYY-MM-DD}.md` **immediately after pre-flight, before changing any file**.
> It is the agent's declared intent: every step and change it *plans* to make. The developer reads this first, then cross-checks it against `upgrade-report-{YYYY-MM-DD}.md` at the end.
> Replace every `{placeholder}`. Write "N/A" rather than leaving a section blank.

---

## Plan Summary

- **Client:** {ClientName}
- **Solution:** {path/to/solution.sln}
- **Current version:** {X.Y.Z}
- **Target version:** {X.Y.Z}
- **.NET target change:** {net8 → net9 | none}
- **Upgrade path:** {e.g. 7.2.0 → 7.3.0 → 7.4.0 → 8.0.0}
- **EF migration expected?** {Yes — reason | No}
- **Date:** {YYYY-MM-DD}

---

## Planned Steps

> The ordered list of steps the agent intends to run. Mirrors the Execution Guide, tailored to this solution.

| # | Step | What the agent will do | Expected outcome |
|---|------|------------------------|------------------|
| 0 | Pre-flight | Detect `.sln`, current versions, compute upgrade path | `PREFLIGHT_DONE` |
| 1 | Update packages | Bump every `NGO.Core.*` + `DocumentFormat.OpenXml.Extensions` to {target} in {n} `.csproj` files | all `.csproj` on {target} |
| 2 | Update appsettings | Add keys for versions {list} to {files} | keys present |
| 3 | Restore + build | `dotnet restore --force`; `dotnet build` | error inventory captured |
| 4 | Fix loop | Resolve error families via decompile-first Fix Pattern Workflow | 0 errors |
| 5 | EF migration | `dotnet ef migrations add UpgradeCore{major}x` | migration created or "no changes" |
| 6 | Report | Write `upgrade-report-{YYYY-MM-DD}.md` | report exists |

---

## Planned Changes (declared up front)

> The concrete edits the agent expects to make, based on the Version-Changes diffs, Knowledge registries, and prior case studies for this client. This is a prediction — the report will record what actually happened and any deviations.

### Projects / packages
- {`.csproj` files to touch, package version bumps}

### Configuration
- **appsettings keys to add:** {list, or "None"}
- **DI registrations expected:** {list, or "None"}
- **Target framework changes:** {e.g. `net8.0 → net9.0` in {n} projects, or "None"}

#### appsettings coverage matrix (cumulative: baseline-exclusive → target-inclusive)
> All listed keys are **startup-required** (Core binds them via `IOptions<T>` at host load). Do not defer any as "optional".
> Status legend: `present` (already in file) · `to-add` (will insert with safe/placeholder default) · `client-specific` (exists, do not overwrite).

| Key (Core:…) | Introduced | API appsettings | WebJob appsettings | Deployment appsettings | Default / placeholder |
|--------------|-----------|-----------------|--------------------|------------------------|-----------------------|
| {e.g. Core:Queue:GenerateIATIFileQueue} | {7.0.0} | {to-add} | {to-add} | {to-add} | {generateiatifilequeue} |

### Expected breaking changes to handle
> From `knowledge/index/routing-table.json` routes first, then `knowledge/canonical/versions/{version}.json`, matching error/symbol JSON entries, and relevant prior runs under `memory/episodes/`.

| Version | Area | Expected change | Planned fix |
|---------|------|-----------------|-------------|
| {ver} | {Services/Repositories/...} | {constructor/generic/override change} | {how the agent will adapt client code} |

### Known fixes reused from memory
- {From `migration-memory.json`: errorCode:symbol → fix, or "None — first run for this client"}

---

## Risks & Watch-list

- {Anticipated cascade, fragile client override, uncertain area — what the agent will watch for}
- {EF model-snapshot drift risk, or "None"}

---

## Assumptions

- {e.g. "Client is on a single Core version across all projects" — anything the plan depends on}

---

## Cross-check contract

At the end of the run, the developer compares this plan against `upgrade-report-{YYYY-MM-DD}.md`:

- Every **Planned Step** must appear in the report with its actual outcome.
- Every **Planned Change** must be either applied (and listed in the report's *Files Changed*) or explained under the report's *Deviations from Plan*.
- Anything the agent did that was **not** in this plan must appear under the report's *Deviations from Plan*.

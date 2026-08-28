# Core Versions — At a Glance

One page to answer **"what's different between these versions and how risky is each step?"** before diving into a folder.

> The agent doesn't read this file during a fix loop — it's a human-orientation document. Per-version detail lives in each folder's `README.md`.

---

## Comparison matrix

| | **7.2.0** | **7.3.0** | **7.4.0** | **8.0.0** | **9.0.0** | **9.1.0** |
|---|---|---|---|---|---|---|
| **Theme** | Service-ctor cleanup | Services + first real EF migrations + DI | Stabilization | .NET 9 + IATI import + generic arity | .NET 10 + workflow-instance tables + draft/published queue | RelatedEntity fields + EF Core tooling + SP signed-off config |
| **Risk** | Low–Medium | Medium–High | Low | **HIGH** | **HIGH** | Low–Medium |
| **Diff payload** | ~225 KB / 12 files | ~340 KB / 14 files | ~67 KB / 10 files | **~1.6 MB / 15 files** | *no diffs prepared — inspect installed DLL* | *no diffs prepared — inspect installed DLL* |
| **Target framework** | net8.0 | net8.0 | net8.0 | **net9.0** | **net10.0** | net10.0 |
| **EF migration?** | No | **Yes** (`AddCalculatedIATIActivityId`, `AddPeriodNameColumnForIndicator`) | No | **Yes** (`UpgradeCore8x` — combined) | **Yes** + post-deploy `ConvertWorkflowInstanceJsonConfigToTables` tool | Possible (RelatedEntity fields) |
| **DI churn?** | Small | Moderate (`07-DI-Registration` non-trivial) | None | Large (many new services) | Inspect DLL | Small |
| **Dominant error codes** | `CS7036` | `CS7036`, runtime-DI | `CS7036` × few | `NU1201` → `CS7036` → `CS0305`/`CS0311` → `CS0115` | `NU1201` (net10) → `CS7036` | `CS7036` |
| **Iterations to expect** | 1–2 | 2–3 | 1 | **4–5** | 3–5 | 1–2 |
| **Folder** | [7.2.0/](7.2.0/README.md) | [7.3.0/](7.3.0/README.md) | [7.4.0/](7.4.0/README.md) | [8.0.0/](8.0.0/README.md) | *(registry only)* | *(registry only)* |

---

## Upgrade path planner

Apply folders in order from your current version up to (and including) the target. **Each folder is applied as a single transition** — don't cherry-pick diffs across folders.

| From → To | Apply in order |
|-----------|----------------|
| 7.1.x → 8.x | `7.2.0` → `7.3.0` → `7.4.0` → `8.0.0` |
| 7.2.x → 8.x | `7.3.0` → `7.4.0` → `8.0.0` |
| 7.3.x → 8.x | `7.4.0` → `8.0.0` |
| 7.4.x → 8.x | `8.0.0` |
| 8.x → 9.x | `9.0.0` → `9.1.0` |
| 7.4.x → 9.x | `8.0.0` → `9.0.0` → `9.1.0` |

> **9.0.0 / 9.1.0 have no prepared diff folders.** Their changes are routed from [../knowledge/index/routing-table.json](../knowledge/index/routing-table.json) into [../knowledge/canonical/versions/9.0.0.json](../knowledge/canonical/versions/9.0.0.json), [../knowledge/canonical/versions/9.1.0.json](../knowledge/canonical/versions/9.1.0.json), and [../knowledge/canonical/appsettings/appsettings-by-version.json](../knowledge/canonical/appsettings/appsettings-by-version.json). The installed DLL remains the source of truth for any compiler error.

---

## How each version differs (one paragraph each)

### 7.2.0 — *minor cleanup*
Mostly service constructor parameter additions. No EF schema change. Most clients see 1–2 fix iterations and `CS7036` exclusively. Use this version to validate the fix loop is working end-to-end before tackling bigger jumps.

### 7.3.0 — *first real schema migrations*
The largest 7.x increment. Introduces real EF migrations (`AddCalculatedIATIActivityId`, `AddPeriodNameColumnForIndicator`) — the upgrade **must** run `dotnet ef migrations add` after the build is green. Significant `07-DI-Registration` churn — startup-time crashes (not compile errors) are possible if new services aren't registered. Controllers also see broad attribute/route updates.

### 7.4.0 — *stabilization*
The smallest folder in the matrix. A handful of service ctor tweaks; no migration; no DI churn. Typically clears in a single iteration. Treat this as a "warm-up" before 8.0.0 if doing a long chain upgrade.

### 8.0.0 — *the big one*
The single largest upgrade. Combines a **.NET runtime bump** (net8 → net9), a wide set of constructor signature changes, **generic arity changes** on base classes (`CS0305`/`CS0311`), several `override` signature shifts (`CS0115`), new DI dependencies, and an EF migration. Expect to use the full 5-iteration budget. Fix `NU1201` (target framework) **first** — no other error report is reliable until every `.csproj` is on `net9.0`. The `02-Services.diff` is ~1 MB; open it lazily and only when a specific service errors out.

### 9.0.0 — *.NET 10 + workflow instance tables*
A **.NET runtime bump** (net9 → **net10**) plus a data-model change: workflow instances move from JSON config into new relational tables (`CorePhaseInstances`, `CorePhaseTemplateInstances`). Update every `.csproj` to `net10.0` **before** touching Core packages and fix `NU1201` first. Also update `build-pipeline-api.yml` (`netVersion` `8.0` → `10.0`) and add the draft/published queue key `SyncPublishedWorkflowQueue` to every `appSettings.json`. **Deployment-critical:** the `ConvertWorkflowInstanceJsonConfigToTables` tool must run after deployment or the Workflow Cycle tab breaks. NGO.API `web.config` also gains security headers. No diff folder — inspect the installed DLL for any constructor/signature drift.

### 9.1.0 — *RelatedEntity fields + EF Core tooling*
A lighter release. Adds `RelatedEntity` fields to `Log`/`Log2`/`Log3` (switch a field to `instances` if it must hold multiple values), and requires the EF Core tooling packages (`Microsoft.EntityFrameworkCore.Design` and `.Tools` at `10.0.7`) on **NGO.API**. Introduces the `SPSignedOffAdditionalDocumentsFolderName` system config (default `Additional documents`) for Mark-as-Paid/Cancel approval subfolders — confirm the value with the client PM/AM, and after deployment run `NGO.Core.Tools.UpdatePaymentDocumentLinks` if the client uses those actions. If the upgrade machine has both EF Core and EF 6, use `EntityFrameworkCore\Add-Migration` to force EF Core.

---

## What "at a glance" headers mean inside each folder

Every `README.md` starts with the same five-row table so you can scan a version's shape in five seconds:

```
| Theme               | what this release is about, in one phrase
| Risk                | Low / Medium / High
| Diff payload        | total KB / file count
| EF migration        | None / Required (+ migration names)
| Target framework    | net8.0 / net9.0 / net10.0
```

Use this matrix and the per-folder header together — the matrix to plan, the folder to execute.

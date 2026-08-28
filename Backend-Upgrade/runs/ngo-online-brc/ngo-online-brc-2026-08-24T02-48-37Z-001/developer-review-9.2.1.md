# Developer Review — NGO Core Upgrade 5.12.5 → 9.2.1 (Backend)

> **Branch:** `namdinh/upgrade_core_9`
> **Target framework:** net10.0 · **Target Core version:** 9.2.1
> **Solution:** `ngo-api/NGO/NGO.sln`
> **Build status:** ✅ Full-solution build succeeds (0 errors)
>
> This document is for developers/PM/AM to review **what changed, new settings, and required deployment actions** before merging and deploying.

---

## 1. Summary

The backend was upgraded from NGO.Core 5.12.5 to 9.2.1 and retargeted to .NET 10. This involved
package upgrades, source-level API/constructor fixes, a new EF migration, config additions across
all releases from 6.0.0 → 9.2.1, pipeline changes, and Web.config security headers.

Please pay special attention to sections **3 (new settings — decisions required)**,
**5 (EF migration — data-loss review)**, and **6 (post-deployment steps)**.

---

## 2. Code / project changes

| Area | Change |
|------|--------|
| Target framework | All projects retargeted to `net10.0` |
| Packages | All direct `NGO.Core.*` references bumped to `9.2.1`; `Microsoft.Data.SqlClient` aligned in migration project |
| Constructors / APIs | Updated across services, repositories, controllers, hotfixes, and data-migration to match Core 9.2.1 signatures (see `build-fix-running-log.md` for the full error/fix table) |
| IATI export | Removed stale generated `NGO.Model/Domain/IATIExport/IATIActivities.cs`; export code aligned to Core 9.2.1 global IATI model types |
| DI registrations | `CustomCommonDIs.cs` generic arities corrected for `ExportPdfService` / `EntityService` |

---

## 3. New / changed configuration settings

### 3a. Applied automatically (safe defaults)

> **Why these are always added:** Core registers these settings through its DI / `IOptions<T>`
> binding at startup. If a required key is **missing**, options binding fails and **the web app
> cannot load/start**. Therefore all Core-consumed keys are added with safe defaults (empty or
> documented default) regardless of whether the feature is actively used. Feature *behavior* is
> controlled by system configuration / actual usage, not by the presence of the key.

| Setting | Section | Files | Value | Release |
|---------|---------|-------|-------|---------|
| `SyncPublishedWorkflowQueue` | `Core:Queue` | API + WebJob `appsettings.json` | `syncpublishedworkflowqueue` | 9.0.0 |
| `SPSignedOffAdditionalDocumentsFolderName` | `Core` | API + WebJob `appsettings.json` | `Additional documents` | 9.1.0 |
| `CspAdditionalFrameSrc` | `Core` | API + WebJob `appsettings.json` | `""` (empty = no extra frame sources) | 9.2.0 |
| `IATITransactionImportQueue` | `Core:Queue` | API + WebJob | `iatitransactionimportqueue` | 8.0.0 |
| `GenerateIATIFileQueue` | `Core:Queue` | API + WebJob | `generateiatifilequeue` | 7.0.0 |
| `SwitchCurrentSiteCollectionQueue` | `Core:Queue` | API + WebJob | `switchcurrentsitecollectionqueue` | 7.0.0 |
| `ReminderTaskDeadlineQueue` | `Core:Queue` | API + WebJob | `remindertaskdeadlinequeue` | 7.0.0 |
| `PageImportAddDataQueue` | `Core:Queue` | API + WebJob | `pageimportadddataqueue` | 6.0.0 |
| `ADSyncGroupsQueue` | `Core:Queue` | API + WebJob | `adsyncgroupqueue` | 6.0.0 |
| `ADSyncUsersQueue` | `Core:Queue` | API + WebJob | `adsyncuserqueue` | 6.0.0 |
| `MaxEmailAttachmentFileSizeMb` | `Core` | API + WebJob | `20` | 7.1.0 |
| `IATIDocumentsBlob` | `Core` | API + WebJob | `iati-documents` | 7.0.0 |
| `IATIValidationApi` | `Core` | API + WebJob | `https://api.iatistandard.org/validator/validate` | 7.0.0 |
| `IATISubscriptionKey` | `Core` | API + WebJob | `""` (**set securely per environment**) | 7.0.0 |
| `GenerateIATIFileSchedule` | `Core` | API + WebJob | `0 2 * * *` | 7.0.0 |
| `SwitchCurrentSiteCollectionSchedule` | `Core` | API + WebJob | `0 4 * * *` | 7.0.0 |
| `ReminderTaskDeadlineSchedule` | `Core` | API + WebJob | `0 2 * * *` | 6.0.0/7.0.0 |
| `ADSyncGroupsSchedule` | `Core` | API + WebJob | `0 */4 * * *` | 6.0.0 |
| `ADSyncUsersSchedule` | `Core` | API + WebJob | `0 * * * *` | 6.0.0 |
| `AzureOpenAISettings:Endpoint` / `:DeploymentName` | `Core` | API + WebJob | `""` / `""` (**set only when Write-with-AI approved**) | 9.0.0 |

> **Note on Azure App Settings:** the same keys must be set in each deployed environment
> (colon-delimited), e.g. `Core:Queue:SyncPublishedWorkflowQueue`,
> `Core:SPSignedOffAdditionalDocumentsFolderName`, `Core:CspAdditionalFrameSrc`,
> `Core:Queue:ADSyncGroupsQueue`, etc.

### 3b. Decisions required (PM / AM)

Keys are present with defaults so the app can start; the **values / feature enablement** still
need confirmation:

| Setting | Question | Default used |
|---------|----------|--------------|
| `SPSignedOffAdditionalDocumentsFolderName` | Does the client use **Mark as Paid** / **Cancel Payment**, and should signed-off documents go in a subfolder? Confirm folder name or empty to disable. | `Additional documents` |
| `CspAdditionalFrameSrc` | Any additional iframe/frame sources needed (semicolon-separated)? No permissive wildcards without security review. | `""` |
| `IATISubscriptionKey` | Provide the real key via the secret provider per environment (never commit). | `""` |
| `AzureOpenAISettings:Endpoint` / `:DeploymentName` | Only populate + enable `UsingWriteWithAI` after customer approval (incurs cost). | `""` |
| Schedules (`*Schedule`) | Adjust cron expressions per client requirement; preserve approved client-specific values. | documented defaults |

> ⚠️ **Secrets:** never commit real values for `IATISubscriptionKey`, `AzureOpenAISettings:Endpoint`, storage/connection strings. Use the secret provider / secured Azure settings. If a real key was previously committed, report it for rotation.

---

## 4. Pipeline & infrastructure changes

| File | Change |
|------|--------|
| `build-pipeline-api.yml` | `netVersion: '8.0'` → `'10.0'` |
| `build-pipeline-api.yml` | `dotnet-ef` tool `8.0.7` → `10.0.7` |
| `ngo-api/NGO/NGO/Web.config` | Added `removeServerHeader="true"` on `requestFiltering`; added `httpProtocol/customHeaders` removing `X-Powered-By` |

---

## 5. Database migration — REVIEW REQUIRED

- New migration: **`20260824083004_UpgradeCore_9.2.1`** (`NGO.Repositories/Migrations`).
- Creates the 9.0.0 workflow-instance relational tables **`CorePhaseInstances`** and
  **`CorePhaseTemplateInstances`**, plus accumulated column additions (workflow draft/published
  config, sync columns, task/task-template fields).
- ⚠️ The EF scaffolder emitted a **possible data-loss warning**. Review the `Up`/`Down` methods
  carefully before applying to any real database, and take a backup first.

---

## 6. Post-deployment steps (must run in order)

1. **Apply the EF migration** to each target database (after review + backup).
2. **`ConvertWorkflowInstanceJsonConfigToTables`** — migrates existing workflow instance JSON
   config into the new relational tables. **If not run, the Workflow Cycle tab breaks.**
3. **`NGO.Core.Tools.UpdatePaymentDocumentLinks`** — only if the client uses Mark-as-Paid /
   Cancel Payment actions, and only after the `SPSignedOffAdditionalDocumentsFolderName`
   decision is confirmed.
4. Set the Azure App Settings listed in section 3a (and any feature-gated ones from 3c) for
   every deployed environment.
5. Ensure any newly referenced Azure Storage **queue resources** exist for the queue keys added.

---

## 7. Verification checklist

- [ ] Solution builds green on net10.0 (confirmed in CI with updated pipeline).
- [ ] API starts and configuration binding succeeds.
- [ ] CSP response header contains only intended frame sources.
- [ ] Draft-to-published workflow synchronization smoke test passes.
- [ ] Workflow Cycle tab works after `ConvertWorkflowInstanceJsonConfigToTables`.
- [ ] Payment document links behave correctly (if Mark-as-Paid/Cancel used).
- [ ] Azure App Settings match file settings in every environment.

---

## 8. References

- `runs/ngo-online-brc/ngo-online-brc-2026-08-24T02-48-37Z-001/build-fix-running-log.md` — full error/fix log + lessons learned.
- `runs/ngo-online-brc/ngo-online-brc-2026-08-24T02-48-37Z-001/state.json` — run state.
- `backend-appsettings-upgrade-release-note.md` — canonical appsettings requirements per release.

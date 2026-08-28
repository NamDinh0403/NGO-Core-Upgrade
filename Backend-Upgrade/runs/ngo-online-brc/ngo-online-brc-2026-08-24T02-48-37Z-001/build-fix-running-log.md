# Build & Fix Running Log — NGO Core 5.12.5 → 9.2.1 (Backend)

- **Branch:** `namdinh/upgrade_core_9`
- **Target framework:** net10.0
- **Target Core version:** 9.2.1
- **Solution:** `ngo-api/NGO/NGO.sln`

## Status
- **Full-solution build: SUCCESS (0 errors).**
- **Config / pipeline / web.config changes: APPLIED.**
- **EF migration: `20260824083004_UpgradeCore_9.2.1` SCAFFOLDED (review data-loss warning before applying).**
- **Run `state.json`: UPDATED (SUCCEEDED, nextAction = phase 06-test).**

---

## Config / pipeline / infrastructure changes (9.0.0 + 9.1.0 requirements)

| Change | File(s) | Detail |
|--------|---------|--------|
| Draft/published queue key | `NGO/appsettings.json`, `NGO.WebJobs.Job/appsettings.json` | Added `"SyncPublishedWorkflowQueue": "syncpublishedworkflowqueue"` to the System `Queue` block |
| SP signed-off subfolder config | `NGO/appsettings.json`, `NGO.WebJobs.Job/appsettings.json` | Added `"SPSignedOffAdditionalDocumentsFolderName": "Additional documents"` (confirm value with client PM/AM) |
| CSP additional frame sources (9.2.0) | `NGO/appsettings.json`, `NGO.WebJobs.Job/appsettings.json` | Added `"CspAdditionalFrameSrc": ""` to the `Core` section (empty = no extra frame sources) |
| Startup-bound Core keys (6.0.0 → 9.0.0) | `NGO/appsettings.json`, `NGO.WebJobs.Job/appsettings.json` | Added ALL Core DI/options-bound keys with safe defaults so host startup binding succeeds: `Core:Queue` — `IATITransactionImportQueue`, `GenerateIATIFileQueue`, `SwitchCurrentSiteCollectionQueue`, `ReminderTaskDeadlineQueue`, `PageImportAddDataQueue`, `ADSyncGroupsQueue`, `ADSyncUsersQueue`; `Core` — `MaxEmailAttachmentFileSizeMb` (20), `IATIDocumentsBlob`, `IATIValidationApi`, `IATISubscriptionKey` (empty/secure), `GenerateIATIFileSchedule`, `SwitchCurrentSiteCollectionSchedule`, `ReminderTaskDeadlineSchedule`, `ADSyncGroupsSchedule`, `ADSyncUsersSchedule`, `AzureOpenAISettings:Endpoint`/`:DeploymentName` (empty). **These are NOT optional** — Core binds them at startup; missing keys break `IOptions<T>` binding and the app cannot load. |
| Pipeline .NET version | `build-pipeline-api.yml` | `netVersion: '8.0'` → `'10.0'` |
| Pipeline dotnet-ef tool | `build-pipeline-api.yml` | `dotnet-ef --version 8.0.7` → `10.0.7` |
| Security headers | `NGO/Web.config` | `requestFiltering removeServerHeader="true"` + `httpProtocol/customHeaders` removing `X-Powered-By` |

## EF migration

- Added `20260824083004_UpgradeCore_9.2.1` via `dotnet ef migrations add ... --project NGO.Repositories --startup-project NGO/NGO.API.csproj --context NgoContext` **after** the build was green.
- Creates the 9.0.0 workflow-instance relational tables `CorePhaseInstances` and `CorePhaseTemplateInstances` plus accumulated column additions (workflow draft/published config, sync columns, task/task-template fields).
- **Data-loss warning** was emitted by the scaffolder — review the `Up`/`Down` before applying to any real DB.

## Deployment implications (must run post-deploy)

- `ConvertWorkflowInstanceJsonConfigToTables` — migrates workflow instance JSON config into the new tables, or the Workflow Cycle tab breaks.
- `NGO.Core.Tools.UpdatePaymentDocumentLinks` — only if the client uses Mark-as-Paid / Cancel approval actions.

---

## Errors fixed (this session)

| # | File | Error family | Root cause | Fix |
|---|------|--------------|------------|-----|
| 1 | `NGO.Services/WebjobEmailService.cs` | CS7036 | Core `WebJobEmailService` base ctor gained `ITaskTemplateRepository<TaskTemplate>` | Added param + forwarded to base |
| 2 | `NGO.Services/IdeaService.cs` | CS7036 | Core `IdeaService` base ctor gained `IUserRepository<User>` + `ISecurityService` | Added params + forwarded to base |
| 3 | `NGO.Services/IdeaService.cs` | CS1501/CS0029 | `ISPDocumentService.GetBrowseOfDocumentsAsync` now takes `SPDocumentRequest` and returns `BrowseListResult<T>` | Passed `Core.Model.Dto.Parameters.SPDocumentRequest`; read results via `.BrowseItems` |
| 4 | `NGO.Services/TaskAssignmentService.cs` | CS7036 | Core `TaskAssignmentService` base ctor gained `ILogframe2Service<...>` | Added param + forwarded to base |
| 5 | `NGO.Services/IATIExportService.cs` + `IATIExportBaseService.cs` | CS0576/CS0029 | Stale generated `IATIActivities.cs` collided with Core 9.2.1 global-namespace IATI types with different property types | Removed stale `NGO.Model/Domain/IATIExport/IATIActivities.cs`; removed dead `using IATIActivities;`; aligned shapes: `isodate`/`valuedate` = `DateTime`, `humanitarian` = `bool` (+ `humanitarianSpecified`), `defaultaidtype`/`aidtype` = `aidTypeBase[]` |
| 6 | `NGO.Infrastructure/CustomCommonDIs.cs` | CS0305/CS0311 | `ExportPdfService` (42 generic args) and `EntityService` (33 generic args) arity changes; `PartnerExpenditureReporting` slot expects domain type; added `BudgetVersion`, `IATIDocument` | Expanded/corrected generic registrations |
| 7 | `NGO.Hotfixes.RegenerateGADPdfs/Program.cs` | CS1501/CS0029 | `ISPFolderService.SaveDocument` new signature `(Entity, string, string, byte[], Stream, bool)` returning `Task<(string,string)>` | Used tuple deconstruction `var (pdfUrl, _) = ...(..., null, true)` |
| 8 | `NGO.Hotfixes.ResetWorkflowConfig/Program.cs` | CS1061/CS0246 | `RebuildConfigForRepeatWorkflowYearly` / `UpdateWorkflowConfig(id, config)` removed/changed | Switched to local `NGO.Services.IWorkflowService`, `RebuildConfigForWorkflow(...)`, and `UpdateWorkflowConfig(workflowInstance)` after setting `WorkflowConfigs` |
| 9 | `NGO.DataMigration/Custom/WorkflowService.cs` | CS7036/CS0246/CS1503 | Core `WorkflowService<T>` base ctor fully re-shaped (history phase mapper, minimum-requirement repo, permission queue, wf-instance mapper, sync-published queue, resource-string service, dto mappers, financial-period repo/mapper, logger) | Rewrote ctor to match base; added `using NGO.Core.Repositories.Mapping;` and `Microsoft.Extensions.Logging`; mappers use `Core.Model.Dto.*` source types |
| 10 | `NGO.DataMigration/Handlers/{Stakeholder,Project,BAU}Handler.cs` | CS0029 | `AddStakeholder`/`AddProject` now return a `(addedEntity, memberIds)` tuple | Consumed `.addedEntity` from the tuple |

---

## Lessons learned

- **Prefer Core's authoritative types over stale client-generated copies.** The IATI collision was caused by an old generated `IATIActivities.cs` shadowing Core 9.2.1's global-namespace IATI model. Aliasing around it was attempted and reverted; the correct fix was deleting the client copy and compiling against Core. Property *types* changed too (`string`→`DateTime`, `string`→`bool`, single object→`aidTypeBase[]`).
- **Ctor drift is pervasive across layers.** The same Core signature changes (e.g. workflow service, task-assignment service) ripple into services, controllers, hotfix utilities, and the data-migration project. When a base ctor changes, fix interface + implementation + base call + DI registration + all derived ctors together.
- **DTO vs domain mapper generics matter.** `WorkflowService<T>` base expects `IDtoMapper<Core.Model.Dto.Entity, Core.Model.Entity>`, `IDtoMapper<Core.Model.Dto.Workflow, T>`, and `IDtoMapper<Core.Model.Dto.FinancialPeriod, Core.Model.FinancialPeriod>` — the *Dto* type is the source. Decompiled signatures are the source of truth here.
- **Service methods now return tuples.** `SaveDocument` and `AddProject/AddStakeholder` return tuples; downstream call sites must deconstruct, not just constructors.
- **`GetBrowseOfDocumentsAsync` shape changed** to take `SPDocumentRequest` and return `BrowseListResult<T>` (access items via `.BrowseItems`).
- **Build one project at a time.** Removing one blocker surfaces downstream errors (e.g. DataMigration handlers only appeared after the WorkflowService ctor compiled). Iterate per-project, then confirm with a full-solution build.
- **A green build is not the whole upgrade.** The 9.x jump also requires non-code changes that the compiler never flags: the `SyncPublishedWorkflowQueue` + `SPSignedOffAdditionalDocumentsFolderName` config keys (in *every* appsettings — API and WebJobs), pipeline `netVersion`/`dotnet-ef` bumps, and Web.config security headers. Track these against the changelog explicitly.
- **Add the EF migration only after the build is green,** with the correct `--startup-project` (NGO.API) and `--context NgoContext`. The scaffolder folds the accumulated 9.0→9.2.1 schema changes (incl. `CorePhaseInstances`/`CorePhaseTemplateInstances`) into one migration. It emitted a data-loss warning — always review `Up`/`Down` before applying.
- **Deployment-critical post-steps exist.** `ConvertWorkflowInstanceJsonConfigToTables` must run after deploy or the Workflow Cycle tab breaks; `UpdatePaymentDocumentLinks` is needed if Mark-as-Paid/Cancel actions are used. These belong in the handover doc, not just the code.
- **"Feature-gated" settings are still startup-required.** The release note groups some 6.0→9.0 settings as feature-specific, but Core registers them through DI / `IOptions<T>` binding at host startup. If the key is absent, options binding throws and **the web app fails to load** — regardless of whether the feature is used. Therefore all Core-consumed keys are added to *every* appsettings (API + WebJob) with safe/empty defaults; feature *behavior* stays controlled by values/enablement flags, not by key presence. Secrets (`IATISubscriptionKey`, `AzureOpenAISettings:Endpoint`) are committed empty and set securely per environment.


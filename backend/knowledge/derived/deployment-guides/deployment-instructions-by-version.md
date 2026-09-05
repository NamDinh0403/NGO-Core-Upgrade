# NGO Core - Deployment Instructions by Version

> **Purpose:** Actions for deployment/upgrade person (run scripts, Azure config, tools, etc.)  
> **Last Updated:** May 2026

---

## FULL SUMMARY — ALL VERSIONS

> Copy this section into a Trello card as a full deployment checklist across all versions

### ✅ Before Deployment (All Versions)

**9.0.0**
- Update **all** projects to target **.NET 10.0** *before* upgrading Core packages
- Update `build-pipeline-api.yml`: `netVersion: '8.0'` → `netVersion: '10.0'`
- Ensure build agents / deployment pipelines are compatible with .NET 10
- Update the Azure App Service / Web App runtime to **.NET 10**
- Add Azure App Setting: `Core:Queue:SyncPublishedWorkflowQueue = syncpublishedworkflowqueue`
- Add to every `appSettings.json`: `"SyncPublishedWorkflowQueue": "syncpublishedworkflowqueue"`

**8.3.0**
- Edit Release pipeline variable: `Core:Deployment:DeploySPFieldsAndCTypesEnabled = true` (revert after done)
- Update `appsettings.json` for tool (ask Vien for detail)
- Run tool `NGO.Core.Tools.UpdateIdeaMembers` with action **BeforeDeployment**

**8.0.0**
- Entra ID App Registration — add App role `AppOnly` (DisplayName + Value = `AppOnly`, Allowed member types = Applications)
- Entra ID — Add API permission: My APIs → NGO → Application → `AppOnly` (requires Admin consent)
- Check release pipeline: if `Core:Deployment:DeploySPFieldsAndCTypesEnabled = false` → set `true`, revert when done
- Add Azure setting: `Core:Queue:IATITransactionImportQueue` (client-specific)
- Update `appsettings.json`: `"IATITransactionImportQueue": "iatitransactionimportqueue-dev-{clientname}"`
- Run SharePoint Deployment

**7.2.0**
- Ensure Entra App Registration has permission `Mail.Read` (type: Application, granted admin consent)

**7.1.0**
- Add `"MaxEmailAttachmentFileSizeMb": 20` to `appsettings.json` (API + WebJob)
- Add Azure: `Core:MaxEmailAttachmentFileSizeMb = 20`

**7.0.0**
- Update .NET Version of web service in Azure to **.NET 9**
- Check release pipeline: if `Core:Deployment:DeploySPFieldsAndCTypesEnabled = false` → set `true`, revert when done
- Manual run SQL before deployment:
  `DELETE FROM CoreFieldInstances WHERE Id IN (21355, 21356)`
- Add to `appsettings.json` (API, WebJob, Deployment):
  - `"Core:IATIDocumentsBlob": "iati-documents"`
  - `"Core:Queue:GenerateIATIFileQueue": "generateiatifilequeue"`
  - `"Core:IATIValidationApi": "https://api.iatistandard.org/validator/validate"`
  - `"Core:IATISubscriptionKey": "e05a6d92d39f445ca81fb90c2f485c8d"`
  - `"Core:GenerateIATIFileSchedule": "0 2 * * *"`
  - `"SwitchCurrentSiteCollectionSchedule": "0 4 * * *"` (WebJob only)
  - `"SwitchCurrentSiteCollectionQueue": "switchcurrentsitecollectionqueue"` (Queue section)
  - `"ReminderTaskDeadlineQueue": "remindertaskdeadlinequeue"` (Queue section)
- Add to Azure App Settings:
  - `Core:IATIDocumentsBlob = iati-documents`
  - `Core:Queue:GenerateIATIFileQueue = generateiatifilequeue`
  - `Core:IATIValidationApi = https://api.iatistandard.org/validator/validate`
  - `Core:IATISubscriptionKey = e05a6d92d39f445ca81fb90c2f485c8d`
  - `Core:GenerateIATIFileSchedule = 0 2 * * *`
  - `Core:SwitchCurrentSiteCollectionSchedule = 0 4 * * *`
  - `Core:Queue:SwitchCurrentSiteCollectionQueue = switchcurrentsitecollectionqueue`
  - `Core:Queue:ReminderTaskDeadlineQueue = remindertaskdeadlinequeue`

**6.3.0**
- Update `appsettings.json`: Queue names, CoreContext, AzureWebJobsStorage, `"RemoveRedundantPeriods": false`
- Run tool: `NGO.Core.Tools.UpdateExistingPartnerExpenditureReportings`

---

### ✅ After Deployment (All Versions)

**9.1.0**
- Confirm the value of `SPSignedOffAdditionalDocumentsFolderName` with the client PM/AM (default `Additional documents`; may be changed or left empty)
- If the client uses **Mark as Paid** or **Cancel** on payments: update `appsettings.json`, then run tool `NGO.Core.Tools.UpdatePaymentDocumentLinks`

**9.0.0**
- Run tool `ConvertWorkflowInstanceJsonConfigToTables` to migrate existing workflow-instance JSON configs into the new tables (`CorePhaseInstances`, `CorePhaseTemplateInstances`)
  - **Required** — if skipped, the *Workflow Cycle* tab will not display data correctly

**8.3.0**
- Run tool `NGO.Core.Tools.UpdateIdeaMembers` with action **AfterDeployment**
- Revert `Core:Deployment:DeploySPFieldsAndCTypesEnabled` back to original value

**8.2.0**
- Update `appsettings.json` → Run tool: `NGO.Core.Tools.SetAzureAdIdForUser`
- Verify all `AzureAdId` values in `CoreUsers` are populated
- Check for deleted users in Azure Portal — if any are missing AzureAdId → update manually
- **[If using Logframe2]** Manual run SQL: `20250917_DisableLogframe1.sql`

**8.0.0**
- Update `appsettings.json` → Run tool: `NGO.Core.Tools.UpdateIdeaMembers`
- Open script `20251015_AddCodeToLogframeLevelInput.sql`:
  - Update `(4)` to the list of Objective level IDs that are input (not having target or reporting period)
  - Manual run the script

**7.7.0**
- If client overrides DB FUNCTION `GetTaskThatUserHasViewPermission` → inner join Tasks table with CoreEntities

**7.6.0**
- Update `appsettings.json` → Run tool: `NGO.Core.Tools.SetAzureAdIdForUser`
- Verify all `AzureAdId` values in `CoreUsers` are populated — update manually if any missing
- **[If using Logframe2]** Manual run SQL: `20250917_DisableLogframe1.sql`

**7.3.0**
- Open script `20251003_EnsureFrequencyIndicator.sql`:
  - Update `(4)` to the list of Objective level IDs that are input
  - Manual run the script
- Then: update `appsettings.json` → Run tool: `NGO.Core.Tools.RebindPeriodNameForIndicatorTargetReport`

**7.2.0**
- Run SharePoint Deployment

**7.1.0**
- Run if needed: `DataFix/20250319_InactiveGlobalIndicatorOfCustomGlobalObjectiveField.sql`

**6.4.0**
- Update `appsettings.json` → Run tool: `NGO.Core.Tools.GenerateMissingReports`

**6.3.0**
- **[Optional]** Enable `RemoveRedundantPeriods = true` if client requests removal of reporting periods outside current published budget periods

---

## DETAIL BY VERSION

---

## 8.4.0

*(No deployment actions required)*

---

## 8.3.0

### Before Deployment

- Edit and update Release pipeline variable: `Core:Deployment:DeploySPFieldsAndCTypesEnabled = true`
- Update `appsettings.json` for tool (ask Vien for detail)
- Run tool `NGO.Core.Tools.UpdateIdeaMembers` with action **BeforeDeployment** — moves idea folders to other site collections

### After Deployment

- Run tool `NGO.Core.Tools.UpdateIdeaMembers` with action **AfterDeployment**
- Revert `Core:Deployment:DeploySPFieldsAndCTypesEnabled` back to original value

---

## 8.2.0

### Before Deployment

- *(No specific before-deployment steps)*

### After Deployment

- Update `appsettings.json`
- Run tool: `NGO.Core.Tools.SetAzureAdIdForUser`
- Verify all rows in `AzureAdId` in `CoreUsers` have values
- Check deleted users in Azure: https://portal.azure.com/#view/Microsoft_AAD_UsersAndTenants/UserManagementMenuBlade/~/DeletedUsers
- If deleted user exists with missing AzureAdId → manually update `AzureAdId` for that user
- **[If using Logframe2]** Manual run SQL: `20250917_DisableLogframe1.sql`

---

## 8.1.0

### Before Deployment

- *(No specific before-deployment steps)*

### After Deployment

- *(No specific after-deployment steps — see Code Changes file for app.module.ts updates)*

---

## 8.0.0

### Before Deployment

- **Entra ID App Registration** — In App Registration for NGO Online:
  - In **App roles**: add role with DisplayName = `AppOnly`, Value = `AppOnly`, Allowed member types = `Applications`
  - In **API permissions**: Add → My APIs → NGO → Application permissions → `AppOnly`
  - ⚠️ This permission requires Admin consent — may need to request from client admin
- Check release pipeline: if `Core:Deployment:DeploySPFieldsAndCTypesEnabled = false` → set to `true`, revert when done
- Add Azure setting: `Core:Queue:IATITransactionImportQueue` (client-specific queue name)
- Update `appsettings.json`: `"IATITransactionImportQueue": "iatitransactionimportqueue-dev-{clientname}"`
- Run SharePoint Deployment

### After Deployment

- Update all settings in `appsettings.json` then run tool: `NGO.Core.Tools.UpdateIdeaMembers`
- In script `20251015_AddCodeToLogframeLevelInput.sql`:
  - Update `(4)` to the list of Objective level IDs that are input (not having target or reporting period)
  - Manual run the script

---

## 7.7.0

### Before Deployment

- *(No specific before-deployment steps)*

### After Deployment

- If client overrides DB FUNCTION `GetTaskThatUserHasViewPermission` → inner join Tasks table with CoreEntities to ensure only view accessible entities

---

## 7.6.0

### Before Deployment

- *(No specific before-deployment steps)*

### After Deployment

- Update `appsettings.json`
- Run tool: `NGO.Core.Tools.SetAzureAdIdForUser`
- Verify all rows in `AzureAdId` in `CoreUsers` have values
- Check deleted users in Azure — manually update `AzureAdId` if any missing
- **[If using Logframe2]** Manual run SQL: `20250917_DisableLogframe1.sql`

---

## 7.5.0

### Before Deployment

- *(No specific before-deployment steps)*

### After Deployment

- *(No specific after-deployment steps — see Code Changes file for app.module.ts updates)*

---

## 7.3.0

### Before Deployment

- *(No specific before-deployment steps)*

### After Deployment

- In script `20251003_EnsureFrequencyIndicator.sql`:
  - Update `(4)` to the list of Objective level IDs that are input (not having target or reporting period)
  - Manual run the script
- After the script completes, update `appsettings.json` then run tool: `NGO.Core.Tools.RebindPeriodNameForIndicatorTargetReport`
  - ⚠️ Only run this tool after ensuring indicator frequency step is done

---

## 7.2.0

### Before Deployment

- Ensure Entra App Registration has API permission: `Mail.Read` (type: Application) with Admin consent granted

### After Deployment

- Run SharePoint Deployment

---

## 7.1.0

### Before Deployment

- Add to `appsettings.json` (API + WebJob):
  - `"MaxEmailAttachmentFileSizeMb": 20` (default 20 unless client has specific requirements)
- Add to Azure Portal: `Core:MaxEmailAttachmentFileSizeMb = 20`

### After Deployment

- Run if needed: `DataFix/20250319_InactiveGlobalIndicatorOfCustomGlobalObjectiveField.sql`

---

## 7.0.0

### Before Deployment

- Update .NET Version of web service in Azure to **.NET 9**
- Check release pipeline: if `Core:Deployment:DeploySPFieldsAndCTypesEnabled = false` → set to `true`, revert when done
- Manual run SQL script before deployment:
  ```sql
  -- IDs 21355 & 21356 are now used for IATI, may be redundant in existing databases
  DELETE FROM CoreFieldInstances WHERE Id IN (21355, 21356)
  ```
- Add to **appsettings.json** (API, WebJob, Deployment):
  - `"Core:IATIDocumentsBlob": "iati-documents"`
  - `"Core:Queue:GenerateIATIFileQueue": "generateiatifilequeue"`
  - `"Core:IATIValidationApi": "https://api.iatistandard.org/validator/validate"`
  - `"Core:IATISubscriptionKey": "e05a6d92d39f445ca81fb90c2f485c8d"`
  - `"Core:GenerateIATIFileSchedule": "0 2 * * *"`
  - `"SwitchCurrentSiteCollectionSchedule": "0 4 * * *"` (WebJob only)
  - `"SwitchCurrentSiteCollectionQueue": "switchcurrentsitecollectionqueue"` (WebJob, Deployment, API — Queue section)
  - `"ReminderTaskDeadlineQueue": "remindertaskdeadlinequeue"` (Queue section)
- Add to **Azure App Settings**:
  - `Core:IATIDocumentsBlob = iati-documents`
  - `Core:Queue:GenerateIATIFileQueue = generateiatifilequeue`
  - `Core:IATIValidationApi = https://api.iatistandard.org/validator/validate`
  - `Core:IATISubscriptionKey = e05a6d92d39f445ca81fb90c2f485c8d`
  - `Core:GenerateIATIFileSchedule = 0 2 * * *`
  - `Core:SwitchCurrentSiteCollectionSchedule = 0 4 * * *`
  - `Core:Queue:SwitchCurrentSiteCollectionQueue = switchcurrentsitecollectionqueue`
  - `Core:Queue:ReminderTaskDeadlineQueue = remindertaskdeadlinequeue`

### After Deployment

- *(No specific after-deployment steps)*

---

## 6.4.0

### Before Deployment

- *(No specific before-deployment steps)*

### After Deployment

- Update `appsettings.json` then run tool: `NGO.Core.Tools.GenerateMissingReports`
  - Reason: adds missing reporting in head for current logframe version

---

## 6.3.0

### Before Deployment

- Update `appsettings.json` with:
  - Queue names
  - `CoreContext`
  - `AzureWebJobsStorage`
  - `"RemoveRedundantPeriods": false`
- Run tool: `NGO.Core.Tools.UpdateExistingPartnerExpenditureReportings`

### After Deployment

- **[Optional]** Turn on `RemoveRedundantPeriods = true` in `appsettings.json` if client requests removal of reporting periods outside current published budget periods
| `Core:SwitchCurrentSiteCollectionSchedule` | 0 4 * * * | 7.0.0 |
| `Core:Queue:SwitchCurrentSiteCollectionQueue` | switchcurrentsitecollectionqueue | 7.0.0 |
| `Core:Queue:ReminderTaskDeadlineQueue` | remindertaskdeadlinequeue | 7.0.0 |

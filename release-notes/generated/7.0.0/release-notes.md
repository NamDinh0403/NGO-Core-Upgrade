# NGO Core 7.0.0 Release Notes

- **Version:** 7.0.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/7.0.0.json)
- **Quick Summary:** Mandatory Actions **12** | Conditional Actions **2** | New Features **3** | Bug Fixes **0** | Needs Review **12**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Upgrade to .NET 9 | During Upgrade | Client Dev | - Upgrade to .NET 9 | - |
| Update netVersion parameter in build-pipeline-api.yml from 8.0 to 9.0 . | During Upgrade | Client Dev | - Update netVersion parameter in build-pipeline-api.yml from 8.0 to 9.0 . | - |
| Update EF tool version in build-pipeline-api.yml : | During Upgrade | Client Dev | - Update EF tool version in build-pipeline-api.yml : | - |
| Add to all appsettings.json files and Azure App Settings: | During Upgrade | Client Dev | - Add to all appsettings.json files and Azure App Settings: | - |
| Update environment.ts & environment.prod.ts : | During Upgrade | Client Dev | - Update environment.ts & environment.prod.ts : | - |
| Update App.module.ts | During Upgrade | Client Dev | - Update App.module.ts | - |
| DELETE FROM CoreFieldInstances WHERE Id IN (21355, 21356) | During Upgrade | Client Dev | DELETE FROM CoreFieldInstances WHERE Id IN (21355, 21356) | - |
| Add 'faCommentLines' to library.addIcons | During Upgrade | Client Dev | Import ' faCommentLines' from '@fortawesome/pro-light-svg-icons'<br>Add 'faCommentLines' to library.addIcons | [Card](https://trello.com/c/BOBvztKJ/4767-l-logframe-new-reporting-form) |
| set => _fieldDependencies = value ?? new Dictionary<string, string> | During Upgrade | Client Dev | Override LogframeExcelService -> can Override SetupReadonlyFieldByDependencies() to update property FieldDependencies ) to disable an actual fields based on Indicator Type<br>Exp: In MCC, Numfields is only show if Indicator is Text and Ref, so<br>public virtual Dictionary<string, string> FieldDependencies<br>{<br>get => _fieldDependencies;<br>set => _fieldDependencies = value ?? new Dictionary<string, string><br>{ { "numField1", "3;5" }}<br>} | - |
| Add API url to environment files: | During Upgrade | Client Dev | [L] Logframe - Updated layout logframe structure<br>Add API url to environment files:<br>logframes2: 'api/core/entity' | [Card](https://trello.com/c/FyjrMfP7/4645-l-logframe-updated-layout-logframe-structure) |
| Add the following to dependencies to frontend package.json_ | During Upgrade | Client Dev | [M] Can we drag and drop folders on Current sprint - Core \| Trello<br>Add the following to dependencies to frontend package.json_<br>"ng2-file-upload" : "^1.3.0"<br>"ngx-file-drop" : "^10.0.0"<br>Remove the dependency "ngx-uploader". | [Card](https://trello.com/c/CLajr9Or/4495-m-can-we-drag-and-drop-folders) |
| Add key "Core:Queue: ReminderTaskDeadlineQueue ", value " remindertaskdeadlinequeue " in appsettings and azure | During Upgrade | Client Dev | Add key "Core:Queue: ReminderTaskDeadlineQueue ", value " remindertaskdeadlinequeue " in appsettings and azure | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Manual SQL Script (Run Before Deployment) | Before Deploy | Deployer | Manual SQL Script (Run Before Deployment) | - |
| check if release pipeline / deployment appsettings.json having Core | check if release pipeline / deployment appsettings.json having Core: Deployment:DeploySPFieldsAndCTypesEnabled false -> if so please add Core: Deployment:DeploySPFieldsAndCTypesEna | During Upgrade | Deployer | [For deployment person] check if release pipeline / deployment appsettings.json having Core: Deployment:DeploySPFieldsAndCTypesEnabled false -> if so please add Core: Deployment:DeploySPFieldsAndCTypesEnabled true to the release pipeline, and turn the setting back when the deployment done. | - |
| check if release pipeline / deployment appsettings.json having Core | check if release pipeline / deployment appsettings.json having Core: Deployment:DeploySPFieldsAndCTypesEnabled false -> if so please add Core: Deployment:DeploySPFieldsAndCTypesEna | During Upgrade | Deployer | [M] Import / export logframe reporting<br>[For deployment person] check if release pipeline / deployment appsettings.json having Core: Deployment:DeploySPFieldsAndCTypesEnabled false -> if so please add Core: Deployment:DeploySPFieldsAndCTypesEnabled true to the release pipeline, and turn the setting back when the deployment done. | [Card](https://trello.com/c/kgHs7HMX/4768-m-import-export-logframe-reporting) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Find and replace net8.0 with net9.0 in all .csproj files before installing NuGet packages . | During Upgrade | Client Dev | - Find and replace net8.0 with net9.0 in all .csproj files before installing NuGet packages . | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Task: Install dotnet-ef | During Upgrade | Client Dev | - Task: Install dotnet-ef | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Change version from 8.0.7 → 9.0.1 . | During Upgrade | Client Dev | - Change version from 8.0.7 → 9.0.1 . | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Configuration | During Upgrade | Client Dev | Configuration | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Finance, Expenditure, ability to Import expenditure | During Upgrade | Client Dev | [M][PRJ18] Finance, Expenditure, ability to Import expenditure<br>Remember to copy environment.prod.ts<br>partnerExpenditureImport: 'api/core/entity', | [Card](https://trello.com/c/c3mWmh4b/4349-mprj18-finance-expenditure-ability-to-import-expenditure) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Import PartnerExpenditureReportingImportModule in app.module.ts. | During Upgrade | Client Dev | - Import PartnerExpenditureReportingImportModule in app.module.ts. | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Remember to copy environment.prod.ts | During Upgrade | Client Dev | Remember to copy environment.prod.ts<br>logframeImported: 'api/core/entity', | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Finance, Summary, Total funding by status box | During Upgrade | Client Dev | [M][SUM07] Finance, Summary, Total funding by status box | [Card](https://trello.com/c/Z2MCSGrO/4235-msum07-finance-summary-total-funding-by-status-box) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | summary: 'api/core/summary' | During Upgrade | Client Dev | - summary: 'api/core/summary' | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Import Logframe2Module in app.module.ts. | During Upgrade | Client Dev | - Import Logframe2Module in app.module.ts. | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Manage Site Collection improvement | During Upgrade | Client Dev | [M] Manage Site Collection improvement | [Card](https://trello.com/c/b85jr09i/4729-m16-manage-site-collection-improvement) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| New Step – 29/09/2025 | [New Step – 29/09/2025] : Update the .NET Version of the web service in Azure to .NET 9 . | No deterministic note-to-file match. Release diff covers 1070 files (backend: 488, frontend: 486, shared: 96); representative changes: M `.gitignore`, M `build-pipeline-api.yml`, M `ngo-api-core/NGO/NGO.Core.API/Attributes/NGOCheckPermissionAttribute.cs`, A `ngo-api-core/NGO/NGO.Core.API/BaseControllers/AdminIATIPageController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/AdminWebJobMonitoringController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/BeneficiariesController.cs`. | No explicit client action was stated in the release source. | - |
| Backend | IATI modular ( ) | Matched key changes: M `ngo-api-core/NGO/NGO.Core.Model/Dto/Logframe/Logframe.cs` | No explicit client action was stated in the release source. | [Card](https://trello.com/c/BOBvztKJ/4767-l-logframe-new-reporting-form) |
| Frontend | [L] Logframe - Updated layout logframe structure | Matched key changes: M `ngo-api-core/NGO/NGO.Core.Model/Dto/Logframe/Logframe.cs`, M `ngo-client-core/src/environments/environment.ts` | Action applies during the upgrade. Add API url to environment files: | [Card](https://trello.com/c/FyjrMfP7/4645-l-logframe-updated-layout-logframe-structure) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

# NGO Core 3.9.0 Release Notes

- **Version:** 3.9.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **10** | Conditional Actions **0** | New Features **0** | Bug Fixes **3** | Needs Review **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Card: Performance: Browse pages < > | After Deploy | Deployer | Card: [M] Performance: Browse pages < ><br>[After deployment]: DataFixes/ 20221103_AddSqlDtoMapping.sql | [Card](https://trello.com/c/O27JvryB) |
| Program/Org Unit - Monitoring: correct TabFunctionId = 30 in CoreEntityTabs | After Deploy | Deployer | Program/Org Unit - Monitoring: correct TabFunctionId = 30 in CoreEntityTabs<br>< ><br>[After deployment]: DataFixes/20221103_UpdateMonitoringTabFunctionId.sql | [Card](https://trello.com/c/jFYfSV2b) |
| Replace WindowsAzure.Storage with Azure.Storage.Queues and Azure.Storage.Blobs | During Upgrade | Client Dev | - Replace WindowsAzure.Storage with Azure.Storage.Queues and Azure.Storage.Blobs | [Card](https://trello.com/c/yHrxeLz6) |
| Add Azure.Storage.Queues to NGO.Repository to fix error when run update-database | During Upgrade | Client Dev | - Add Azure.Storage.Queues to NGO.Repository to fix error when run update-database | - |
| Upgrade EF 6.4.4 : | Before Deploy | Deployer | Could not load file or assembly 'Azure.Storage.Queues, Version=12.12.0.0, Culture=neutral, PublicKeyToken=<FROM_SECRET_PROVIDER>' or one of its dependencies. The system cannot find the file specified.<br>Upgrade EF 6.4.4 [Before Deployment] :<br>a. Update the pipeline file: build-pipeline-api.yml, in **task: CopyFiles@2** (for packages), change the values of "SourceFolders" and "Contents" as below:<br>SourceFolder: '$(Build.SourcesDirectory)\\ngo-api\\NGO\\packages\\EntityFramework.6.4.4\\tools\\net45\\any\\'<br>Contents: 'ef6.exe' | - |
| b. DevOps: update command in the task of Migrate database to | During Upgrade | Client Dev | b. DevOps: update command in the task of Migrate database to<br>ef6.exe database update --assembly $(CoreContextDLL) --connection-provider System.Data.SqlClient --connection-string "$(ConnectionString)" --verbose | - |
| < > | After Deploy | Deployer | < ><br>[After deployment]: after run Tools/NGO.Core.Tools.FixBudgetCalculation (update App.config (db,storage, queue name) and run the tool), verify the webjob FinancialActualAsyncFunctions run Success | [Card](https://trello.com/c/Uq9hSRue/2901-financebox-budget-actuals-box-budget-actual-dont-show-up) |
| < > | After Deploy | Deployer | < ><br>Lost Beneficiary ReportingName in db after it's approved<br>We can re-use existing tool NGO.Core.Tools.PeriodNamesPopulation to update reporting's name for Beneficiary<br>For Live only - Manually fix existing data for beneficiary reporting periods<br>[After deployment]: DataFixes/20221201_QueryAndManuallyCorrectBeneficiaryReportings.sql | [Card](https://trello.com/c/wHtaamEW/2896-beneficiaries-should-display-the-next-period-not-report-yet-when-open-the-actual-form) |
| Remove ModidiedDate/ModifiedBy/CreatedDate/CreatedBy in Allocation function | During Upgrade | Client Dev | Vien notes: no card associated<br>-- Remove ModidiedDate/ModifiedBy/CreatedDate/CreatedBy in Allocation function<br>-- This is redundant fields since 12/2021 when we remove Org Allocation function<br>-- Script to ensure redundant fields to be removed from form/listview in Allocation function<br>delete from CoreFieldInstanceLocations where FieldInstanceId in (3001,3002,3003,3004) and Id in (901,902,921,922,923,940,943,947,952,953)<br>delete from CoreCacheItems | - |
| Nuget packages: | Before Deploy | Deployer | Nuget packages:<br>SharePoint Deployment - PowerShell update auditlog<br>[Before Deployment] :<br>Edit Release > Deploy Sharepoint > select the powershell task that will run the Deploy.ps1 > Arguments: at the end of line, add a space and<br>-AuditLogQueue "auditlogqueue" -AuditLogBlob "auditlogblob" -AuditLogBlobQueue "auditlogblobqueue"<br>Save the Release and run the deploy.<br>Note: Should update that same thing for the Live Release when updating this for the Test Site Release | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Make sure System.Runtime.CompilerServices.Unsafe nuget has the same version in the Solution. | During Upgrade | Client Dev | - Make sure System.Runtime.CompilerServices.Unsafe nuget has the same version in the Solution. | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Backend | Add Azure.Storage.Queues to NGO.Repository to fix error when run update-database | No deterministic git-diff evidence was supplied for this note. | Add Azure.Storage.Queues to NGO.Repository to fix error when run update-database | - |
| Database / Deployment | Could not load file or assembly 'Azure.Storage.Queues, Version=12.12.0.0, Culture=neutral, PublicKeyToken=<FROM_SECRET_PROVIDER>' or one of its dependencies. The system cannot find the file specified. | No deterministic git-diff evidence was supplied for this note. | Upgrade EF 6.4.4 : | - |
| Shared / Cross-track | Card: Logframe reporting: the completed report is missing 'ReportingName' in database in case the approval has been recalled/rejected before < > | No deterministic git-diff evidence was supplied for this note. | None stated in the release source. | [Card](https://trello.com/c/U2slptPo) |

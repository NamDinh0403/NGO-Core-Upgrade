# NGO Core 5.6.0 Release Notes

- **Version:** 5.6.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/5.6.0.json)
- **Quick Summary:** Mandatory Actions **2** | Conditional Actions **2** | New Features **2** | Bug Fixes **1** | Needs Review **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Add 'GenerateLogframeReportQueue' with value 'generatelogframereportqueue-dev' inside 'Queue' section of WebJob's, API and Deployment appsettings.json | During Upgrade | Client Dev | - Add 'GenerateLogframeReportQueue' with value 'generatelogframereportqueue-dev' inside 'Queue' section of WebJob's, API and Deployment appsettings.json | - |
| Add API url to environment files: adminWebJobMonitoring: 'api/core/adminWebJobMonitoring' | During Upgrade | Client Dev | - Add API url to environment files: adminWebJobMonitoring: 'api/core/adminWebJobMonitoring' | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| check and make sure your client customization 'Other Income 'tab still working as before and don't use core function (you might do something with routes so it will load your client customization components). | check and make sure your client customization 'Other Income 'tab still working as before and don't use core function (you might do something with routes so it will load your client | During Upgrade | Client Dev | [AAI client only] [L] [PRG12] [PRJ07] Finance, Other income tab<br>[For upgrade person] check and make sure your client customization 'Other Income 'tab still working as before and don't use core function (you might do something with routes so it will load your client customization components). | [Card](https://trello.com/c/NYxwImkQ/4114-l-prg12-prj07-finance-other-income-tab?search_id=0be97134-a6bc-4aa6-979f-bd77b5495a5d) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Review tagged release instruction | During Upgrade | Client Dev | [WebJobs Monitoring Admin UI] | - |
| If client use custom webjob and upgrade directly to version 5 | If client use custom webjob and upgrade directly to version 5.6 or above, please add a script to insert the information of the custom webjobs to table CoreWebJobs. Example in this | After Deploy | Deployer | - If client use custom webjob and upgrade directly to version 5.6 or above, please add a script to insert the information of the custom webjobs to table CoreWebJobs. Example in this PR: | [PR](https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-dtglobal/pullrequest/24510?_a=files&path=/ngo-api/NGO/NGO.Deployment/CustomDataFixes/AfterDeployment/20240722_AddCustomWebJobs.sql) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Backend | Azure app service configuration: add 'Core:Queue:GenerateLogframeReportQueue' with value 'generatelogframereportqueue' | Matched key changes: A `ngo-api-core/NGO/NGO.Core.Common/Queue/GenerateLogframeReportQueue.cs` | No explicit client action was stated in the release source. | - |
| Backend | If client use custom webjob and upgrade directly to version 5.6 or above, please add a script to insert the information of the custom webjobs to table CoreWebJobs. Example in this PR: | Matched key changes: A `ngo-api-core/NGO/NGO.Core.Model/Domain/Configuration/WebJob.cs`, A `ngo-api-core/NGO/NGO.Core.Model/Dto/Configuration/WebJob.cs`, R051 `ngo-api-core/NGO/NGO.Core.Repositories/DataModel/CoreWebJob.cs` | If client use custom webjob and upgrade directly to version 5 If client use custom webjob and upgrade directly to version 5.6 or above, please add a script to insert the information of the custom webjobs to table CoreWebJobs. Example in this | [PR](https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-dtglobal/pullrequest/24510?_a=files&path=/ngo-api/NGO/NGO.Deployment/CustomDataFixes/AfterDeployment/20240722_AddCustomWebJobs.sql) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | Release note | No deterministic note-to-file match. Release diff covers 231 files (backend: 111, frontend: 97, shared: 23); representative changes: A `ngo-api-core/NGO/NGO.Core.API/BaseControllers/AdminWebJobMonitoringController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/EntityMembersController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/FundingFinancialController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/OverallEntityStatusController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/PartnerAndDonorComplianceController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/StakeholderComplianceController.cs`. | None stated in the release source. | [Card](https://trello.com/c/xBMhYGdj/3996-logframe-actual-form-missing-period-reporting-on-dropdown-period-when-adjust-start-end-for-project) |

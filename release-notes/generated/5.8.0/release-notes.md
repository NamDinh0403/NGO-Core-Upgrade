# NGO Core 5.8.0 Release Notes

- **Version:** 5.8.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/5.8.0.json)
- **Quick Summary:** Mandatory Actions **12** | Conditional Actions **0** | New Features **1** | Bug Fixes **4** | Needs Review **6**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Update appsettings.json Files: | During Upgrade | Client Dev | - Update appsettings.json Files: | - |
| Add a queue triggered function with the same body as the scheduled function. Refer to WebJobExecutionCleanFunction.cs in Core for inspiration. | During Upgrade | Client Dev | - Add a queue triggered function with the same body as the scheduled function. Refer to WebJobExecutionCleanFunction.cs in Core for inspiration. | - |
| Add the queue settings to appsettings.json for both the web app and web job program. | During Upgrade | Client Dev | - Add the queue settings to appsettings.json for both the web app and web job program. | - |
| Update Azure AppService: | During Upgrade | Client Dev | - Update Azure AppService: | - |
| Add the following keys: | During Upgrade | Client Dev | - Add the following keys: | - |
| Add this section to the Web Job appsettings.json (root level) | During Upgrade | Client Dev | [S] Webjob throws time out error when the log text is too long<br>[For upgrade person]<br>Add this section to the Web Job appsettings.json (root level)<br>"Logging": {<br>"LogLevel": {<br>"Default": "Information",<br>"Microsoft.EntityFrameworkCore.Database.Command": "Warning",<br>"Azure.Core": "Error"<br>}<br>}, | [Card](https://trello.com/c/GHxh9UFJ/4432-s-webjob-throws-time-out-error-when-the-log-text-is-too-long) |
| Missing copy favicon file when build Artifact on Current sprint - Core \| Trello | During Upgrade | Client Dev | [Azure Pipeline] Missing copy favicon file when build Artifact on Current sprint - Core \| Trello | [Card](https://trello.com/c/4c1bs2mj/4321-azure-pipeline-missing-copy-favicon-file-when-build-artifact) |
| Config angular.json file like the changes on this PR: Pull request 24736: Missing copy favicon file when build Artifact - Repos | During Upgrade | Client Dev | - Config angular.json file like the changes on this PR: Pull request 24736: [Azure Pipeline] Missing copy favicon file when build Artifact - Repos | [PR](https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/24736?_a=files) |
| Client wants to always run the custom script before Core script | During Upgrade | Deployer | [S] [Deployment] Client wants to always run the custom script before Core script | [Card](https://trello.com/c/RmvNDK6d/) |
| Add "BeforeCoreFolder": "BeforeCore" to deployment's appSettings.json | During Upgrade | Client Dev | - Add "BeforeCoreFolder": "BeforeCore" to deployment's appSettings.json | - |
| Add copy always to "BeforeCore" folder in NGO.Deployment.csproj | During Upgrade | Client Dev | - Add copy always to "BeforeCore" folder in NGO.Deployment.csproj | - |
| Add "Core:Deployment:BeforeCoreFolder" with value BeforeCore to Release > Variables > Pipeline variables | During Upgrade | Client Dev | - Add "Core:Deployment:BeforeCoreFolder" with value BeforeCore to Release > Variables > Pipeline variables | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Webjob Admin UI: Requeue timer trigger job | During Upgrade | Client Dev | [S] Webjob Admin UI: Requeue timer trigger job | [Card](https://trello.com/c/fPHPi0cx/4413-s-webjob-admin-ui-requeue-timer-trigger-job) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | "WebJobExecutionCleanQueue": "webjobexecutionqueue", | During Upgrade | Client Dev | - "WebJobExecutionCleanQueue": "webjobexecutionqueue", | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | "ExecUpdatestatQueue": "execupdatestatqueue" ￼ | During Upgrade | Client Dev | - "ExecUpdatestatQueue": "execupdatestatqueue" ￼ | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | For Any Custom Scheduled Web Jobs: | During Upgrade | Client Dev | - For Any Custom Scheduled Web Jobs: | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | "Core:Queue:WebJobExecutionCleanQueue": "webjobexecutionqueue", | During Upgrade | Client Dev | - "Core:Queue:WebJobExecutionCleanQueue": "webjobexecutionqueue", | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | "Core:Queue:ExecUpdatestatQueue": "execupdatestatqueue" | During Upgrade | Client Dev | - "Core:Queue:ExecUpdatestatQueue": "execupdatestatqueue" | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | Inside the Queue section, add: | No deterministic note-to-file match. Release diff covers 157 files (backend: 49, frontend: 93, shared: 15); representative changes: M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/AdminWebJobMonitoringController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/ConfigurationController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/EntityController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/UserController.cs`, M `ngo-api-core/NGO/NGO.Core.API/Controllers/ConfigurationController.cs`, M `ngo-api-core/NGO/NGO.Core.Common/Constants/CoreAppSettingKeys.cs`. | No explicit client action was stated in the release source. | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Backend | Write a script to update all the types of web jobs in CoreWebJobs to the appropriate type, and add queues where they are missing. | Matched key changes: M `ngo-api-core/NGO/NGO.Core.Model/Domain/Configuration/WebJob.cs`, M `ngo-api-core/NGO/NGO.Core.Model/Dto/Configuration/WebJob.cs`, M `ngo-api-core/NGO/NGO.Core.Repositories/DataModel/CoreWebJob.cs` | None stated in the release source. | - |
| For upgrade person | [S] Webjob throws time out error when the log text is too long | Matched key changes: M `ngo-api-core/NGO/NGO.Core.Model/Domain/Configuration/WebJob.cs`, M `ngo-api-core/NGO/NGO.Core.Model/Dto/Configuration/WebJob.cs`, M `ngo-api-core/NGO/NGO.Core.Tools.SiteConfigurationPopulation/appsettings.json`, M `ngo-api-core/NGO/NGO.Webjobs/NGO.WebJobs.Job/appsettings.json`, M `ngo-api-core/NGO/NGO/appsettings.json` | Add this section to the Web Job appsettings.json (root level) | [Card](https://trello.com/c/GHxh9UFJ/4432-s-webjob-throws-time-out-error-when-the-log-text-is-too-long) |
| Azure Pipeline | [Azure Pipeline] Missing copy favicon file when build Artifact on Current sprint - Core \| Trello | No deterministic note-to-file match. Release diff covers 157 files (backend: 49, frontend: 93, shared: 15); representative changes: M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/AdminWebJobMonitoringController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/ConfigurationController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/EntityController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/UserController.cs`, M `ngo-api-core/NGO/NGO.Core.API/Controllers/ConfigurationController.cs`, M `ngo-api-core/NGO/NGO.Core.Common/Constants/CoreAppSettingKeys.cs`. | Missing copy favicon file when build Artifact on Current sprint - Core \| Trello | [Card](https://trello.com/c/4c1bs2mj/4321-azure-pipeline-missing-copy-favicon-file-when-build-artifact) |
| Azure Pipeline | Config angular.json file like the changes on this PR: Pull request 24736: [Azure Pipeline] Missing copy favicon file when build Artifact - Repos | Matched key changes: M `ngo-client-core/angular.json` | Config angular.json file like the changes on this PR: Pull request 24736: Missing copy favicon file when build Artifact - Repos | [PR](https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/24736?_a=files) |

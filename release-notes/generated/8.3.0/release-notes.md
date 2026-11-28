# NGO Core 8.3.0 Release Notes

- **Version:** 8.3.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/8.3.0.json)
- **Quick Summary:** Mandatory Actions **1** | Conditional Actions **2** | New Features **2** | Bug Fixes **2**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Before creating deployment in Release, please edit and update variable first as follow: Core:Deployment:DeploySPFieldsAndCTypesEnabled with value of true. Remember to revert it bac | Before Deploy | Deployer | [For deployment person] [BeforeDeployment] Before creating deployment in Release, please edit and update variable first as follow: Core:Deployment:DeploySPFieldsAndCTypesEnabled with value of true. Remember to revert it back to original when the deployment process was done. | [Card](https://trello.com/c/WW0cQyqK/5315-potential-bug-sp-groups-in-the-main-site-collection-may-hit-limits-if-too-many-ideas-or-funding-ideas-are-added) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| if your client doesn't have issue of running out of SP groups | App console with action "BeforeDeployment": could be skipped if your client doesn't have issue of running out of SP groups. This action to move idea's folders to other site collect | Before Deploy | Client Dev | - App console with action "BeforeDeployment": could be skipped if your client doesn't have issue of running out of SP groups. This action to move idea's folders to other site collections. If skipped, let ignore DisableInfraSetup and MigratedIdeas settings. | - |
| if client overrides it | Adjusted DB FUNCTION GetTaskThatUserHasViewPermission , so if client overrides it, please inner join Tasks table with CoreEntities to make sure only view accessable entities //Uyen | During Upgrade | Client Dev | Adjusted DB FUNCTION GetTaskThatUserHasViewPermission , so if client overrides it, please inner join Tasks table with CoreEntities to make sure only view accessable entities //Uyen | [Card](https://trello.com/c/AKettC6e/5344-analyse-task-as-primary-table-user-should-not-see-the-tasks-belong-to-the-entity-they-have-not-access-permission) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | [For deployment person] [BeforeDeployment] Before creating deployment in Release, please edit and update variable first as follow: Core:Deployment:DeploySPFieldsAndCTypesEnabled with value of true. Remember to revert it back to original when the deployment process was done. | No deterministic note-to-file match. Release diff covers 101 files (backend: 58, frontend: 27, shared: 16); representative changes: M `.gitignore`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/LogframeBreakdownTemplatesController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/PartnerExpenditureReportingImportController.cs`, M `ngo-api-core/NGO/NGO.Core.API/Controllers/PartnerExpenditureReportingImportController.cs`, M `ngo-api-core/NGO/NGO.Core.Common/Extensions/MiscExtensions.cs`, M `ngo-api-core/NGO/NGO.Core.Common/Extensions/ObjectExtensions.cs`. | Action applies during the upgrade. Before creating deployment in Release, please edit and update variable first as follow: Core:Deployment:DeploySPFieldsAndCTypesEnabled with value of true. Remember to revert it bac | [Card](https://trello.com/c/WW0cQyqK/5315-potential-bug-sp-groups-in-the-main-site-collection-may-hit-limits-if-too-many-ideas-or-funding-ideas-are-added) |
| Shared / Cross-track | App Console with action "AfterDeployment": The same tool but this is another action. This action to migrate idea members system config to new place. | No deterministic note-to-file match. Release diff covers 101 files (backend: 58, frontend: 27, shared: 16); representative changes: M `.gitignore`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/LogframeBreakdownTemplatesController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/PartnerExpenditureReportingImportController.cs`, M `ngo-api-core/NGO/NGO.Core.API/Controllers/PartnerExpenditureReportingImportController.cs`, M `ngo-api-core/NGO/NGO.Core.Common/Extensions/MiscExtensions.cs`, M `ngo-api-core/NGO/NGO.Core.Common/Extensions/ObjectExtensions.cs`. | No explicit client action was stated in the release source. | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Frontend | [S] Default page is not loaded when user inputs incorrect URL | Matched key changes: M `ngo-client-core/src/app/app-route.service.ts` | None stated in the release source. | [Card](https://trello.com/c/Hc0tfMNW/5326-s-default-page-is-not-loaded-when-user-inputs-incorrect-url) |
| Shared / Cross-track | App console with action "BeforeDeployment": could be skipped if your client doesn't have issue of running out of SP groups. This action to move idea's folders to other site collections. If skipped, let ignore DisableInfraSetup and MigratedIdeas settings. | No deterministic note-to-file match. Release diff covers 101 files (backend: 58, frontend: 27, shared: 16); representative changes: M `.gitignore`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/LogframeBreakdownTemplatesController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/PartnerExpenditureReportingImportController.cs`, M `ngo-api-core/NGO/NGO.Core.API/Controllers/PartnerExpenditureReportingImportController.cs`, M `ngo-api-core/NGO/NGO.Core.Common/Extensions/MiscExtensions.cs`, M `ngo-api-core/NGO/NGO.Core.Common/Extensions/ObjectExtensions.cs`. | if your client doesn't have issue of running out of SP groups. App console with action "BeforeDeployment": could be skipped if your client doesn't have issue of running out of SP groups. This action to move idea's folders to other site collect | - |

# NGO Core 5.12.0 Release Notes

- **Version:** 5.12.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/5.12.0.json)
- **Quick Summary:** Mandatory Actions **2** | Conditional Actions **2** | New Features **1** | Bug Fixes **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Add import of faExternalLink from '@fortawesome/pro-light-svg-icons' + add to constructor in app.module.ts | During Upgrade | Client Dev | [Search] If we allow to preview document, we should let user do something on preview dialog<br>Add import of faExternalLink from '@fortawesome/pro-light-svg-icons' + add to constructor in app.module.ts | [Card](https://trello.com/c/uHUFPYZY) |
| Implement for Income Schedules on Current sprint - Core \| Trello | During Upgrade | Client Dev | [Tasks/Created from] Implement for Income Schedules on Current sprint - Core \| Trello<br>[For upgrade person] Characteristic for fieldInstanceId 22538 add highlight text: {"readOnly": "true", "isHideIfNoValue": true, maxCharacters:50, "taskLinkFormat":[{tabDefinitionId: 2, fieldName: "description"}, {tabDefinitionId: 8, fieldName: "description"}, {tabDefinitionId: 15, fieldName: "description"}, {tabDefinitionId: 24, fieldName: "description"}, {tabDefinitionId: 10, fieldName: "name"}, {tabFunctionId: 44, fieldName: "name"} ]} | [Card](https://trello.com/c/S27nsFJY) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| check if we have any data need to be correct on this script as well) Datafixes/20250122_FixAllocationDateNotBeUpdatedWhenTaskApproved.sql | if you want to fix AllocationDate wasn't updated in confirmed Allocations, run script (we have the query to check if we have any data need to be correct on this script as well) Dat | During Upgrade | Deployer | if you want to fix AllocationDate wasn't updated in confirmed Allocations, run script (we have the query to check if we have any data need to be correct on this script as well) Datafixes/20250122_FixAllocationDateNotBeUpdatedWhenTaskApproved.sql | [Card](https://trello.com/c/VNp6VTqS/4683-budget-incoming-funding-confirmed-incoming-funding-displays-into-version-that-allocation-is-created-havent-approved) |
| We move the code Lock documents to webjob so please check customization in client, if using FolderPathWithoutRoot, move that code to OnAfterSaveScreenshot instead of OnTaskApproved . Because not sure screenshot webjob has finished before using FolderPathWithou | Can we move the LockRelatedDocuments function to ScreenshotQueue upon task completion? | During Upgrade | Client Dev | [M] Can we move the LockRelatedDocuments function to ScreenshotQueue upon task completion?<br>We move the code Lock documents to webjob so please check customization in client, if using FolderPathWithoutRoot, move that code to OnAfterSaveScreenshot instead of OnTaskApproved . Because not sure screenshot webjob has finished before using FolderPathWithoutRoot for the custom purpose | [Card](https://trello.com/c/8LmfSkcD/4682-m-can-we-move-the-lockrelateddocuments-function-to-screenshotqueue-upon-task-completion) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Search | [Search] If we allow to preview document, we should let user do something on preview dialog | Matched key changes: M `ngo-client-core/src/app/app.module.ts` | Action applies during the upgrade. Add import of faExternalLink from '@fortawesome/pro-light-svg-icons' + add to constructor in app.module.ts | [Card](https://trello.com/c/uHUFPYZY) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Backend | if you want to fix AllocationDate wasn't updated in confirmed Allocations, run script (we have the query to check if we have any data need to be correct on this script as well) Datafixes/20250122_FixAllocationDateNotBeUpdatedWhenTaskApproved.sql | Matched key changes: A `ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/20250122_FixAllocationDateNotBeUpdatedWhenTaskApproved.sql`, M `ngo-api-core/NGO/NGO.Core.Model/Domain/Funding.cs`, M `ngo-api-core/NGO/NGO.Core.Model/Dto/Funding.cs`, M `ngo-api-core/NGO/NGO.Core.Model/Dto/Task/Task.cs` | check if we have any data need to be correct on this script as well) Datafixes/20250122_FixAllocationDateNotBeUpdatedWhenTaskApproved.sql. if you want to fix AllocationDate wasn't updated in confirmed Allocations, run script (we have the query to check if we have any data need to be correct on this script as well) Dat | [Card](https://trello.com/c/VNp6VTqS/4683-budget-incoming-funding-confirmed-incoming-funding-displays-into-version-that-allocation-is-created-havent-approved) |

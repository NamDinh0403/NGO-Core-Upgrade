# NGO Core 2.14.0 Release Notes

- **Version:** 2.14.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **8** | Conditional Actions **0** | New Features **2** | Bug Fixes **0**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| CoreFieldInstances: Update the resource key in Log, Log2 CorefieldInstances to separate the resources | After Deploy | Deployer | CoreFieldInstances: Update the resource key in Log, Log2 CorefieldInstances to separate the resources<br>[After deployment]<br>DataFixes\20210506_UpdateResourceStringKeysForLogAndLog2.sql | - |
| Update resource string, run this script DataFixes\20210513_AdminUI_Folder_structure_updates.sql | During Upgrade | Deployer | AdminUI - Folder structure<br>Update resource string, run this script DataFixes\20210513_AdminUI_Folder_structure_updates.sql | - |
| Change task assignment : add API url to environment files | During Upgrade | Client Dev | Change task assignment : add API url to environment files<br>taskAssignmentChanges: 'api/core/taskAssignmentChanges' | - |
| CoreFieldInstancesLocations: Level, Objective ID and Objective Description should be separate columns | After Deploy | Deployer | CoreFieldInstancesLocations: Level, Objective ID and Objective Description should be separate columns<br>[After deployment]<br>DataFixes\20210514_UpdateLogframeIndicatorTrackerListViewColumns.sql | - |
| InitAnalyse: Update SqlMapping in the for Entities having Budget , Budget Row in Analyses ( = 31) | During Upgrade | Deployer | InitAnalyse: Update SqlMapping in the [CoreAnalyseTableRelations] for Entities having Budget , Budget Row in Analyses ([TabFunctionId2] = 31)<br>DataFixes\20210520_UpdateJoinConditionColumnForAnalyseBudgetAndBudgetRows.sql | - |
| Change member assignment : add API url to environment files | During Upgrade | Client Dev | Change member assignment : add API url to environment files<br>membershipChanges: 'api/core/membershipChanges' | - |
| CoreResourceStrings: Logframe Breakdown template: update validation messages | After Deploy | Deployer | CoreResourceStrings: Logframe Breakdown template: update validation messages<br>[After deployment]<br>DataFixes\20210526_UpdateResourceStringValuesForLogFrameValidationMessages.sql | - |
| add API url to environment files | During Upgrade | Client Dev | Power BI<br>npm install powerbi-client<br>Import PowerBIModule to app.module.ts<br>add API url to environment files<br>powerBI: 'api/core/entity', | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| None identified. | - | - | - | - | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Frontend | Change task assignment : add API url to environment files | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. Change task assignment : add API url to environment files | - |
| Frontend | Change member assignment : add API url to environment files | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. Change member assignment : add API url to environment files | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

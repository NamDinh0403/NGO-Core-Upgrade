# NGO Core 3.13.1 Release Notes

- **Version:** 3.13.1
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **1** | Conditional Actions **0** | New Features **0** | Bug Fixes **0**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Upgrade notes: | Before Deploy | Deployer | [L] Deployment improvement: Automate scripts (that are currently manual)<br>All future DataFix scripts should be but into the DataFixes/BeforeDeployment or DataFixes/AfterDeployment folders. These scripts will be executed automatically with the deployment so it's very important that all scripts are correct. For scripts where manual steps are still required, scripts can still be put into the root DataFixes folder but this should be avoided as much as possible. Only steps that need manual handling needs to be noted in the wiki or as deployment notes.<br>Upgrade notes:<br>Added nugets to Deployment: Microsoft.SqlServer.SqlManagementObjects 170.13.0<br>Update Release pipelines to match attached screenshots in card. The last step replaces SeedDb.ps1 + runs "after" scripts.<br>Existing Powershell step for deploy.ps1 needs to be updates, file now called Deploy_SharePoint.ps1<br>[Before deployment]: Run sql DataFixes/20230315_AddDeployScriptHistory.sql<br>Notes for client specific scripts:<br>Any client specific onetime scripts can be run in the same way. Place scripts in a CustomDataFixes/BeforeDeployment or CustomDataFixes/AfterDeployment and add those paths to the parameters in the corresponding steps of the Release pipeline. Any existing already run scripts should be kept in a separate folder or the root CustomDataFixes.<br>Add icon for PowerBI in LHS menu on Current sprint - Core \| Trello<br>Open app.module.ts, add 'faChartArea' next to ' faUserTag ' (two places) | [Card](https://trello.com/c/mkF651YM)<br>[Card](https://trello.com/c/eKFOyAcO/3243-add-icon-for-powerbi-in-lhs-menu) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| None identified. | - | - | - | - | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

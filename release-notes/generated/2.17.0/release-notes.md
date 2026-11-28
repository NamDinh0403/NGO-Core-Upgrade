# NGO Core 2.17.0 Release Notes

- **Version:** 2.17.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **7** | Conditional Actions **0** | New Features **0** | Bug Fixes **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Run DataFixes/ 20210909_RemoveTaskEntityId.sql | During Upgrade | Deployer | - Run DataFixes/ 20210909_RemoveTaskEntityId.sql | - |
| Run DataFixes/20210831_UpdateLogframePeriod.sql | During Upgrade | Deployer | - Run DataFixes/20210831_UpdateLogframePeriod.sql | - |
| Update target period / reporting name: Run Tools/NGO.Core.Tools.LogframePeriodNamesPopulation | During Upgrade | Client Dev | - Update target period / reporting name: Run Tools/NGO.Core.Tools.LogframePeriodNamesPopulation | - |
| Add code plugin: in angular.json file, add "node_modules/tinymce/plugins/code/plugin.min.js" next to "node_modules/tinymce/plugins/link/plugin.min.js" | During Upgrade | Client Dev | - Add code plugin: in angular.json file, add "node_modules/tinymce/plugins/code/plugin.min.js" next to "node_modules/tinymce/plugins/link/plugin.min.js" | - |
| Add to Environment files: emailTemplates: 'api/core/emailTemplates' | During Upgrade | Client Dev | - Add to Environment files: emailTemplates: 'api/core/emailTemplates' | - |
| 20210830_UpdateDataForSortingMySitesBox.sql | During Upgrade | Deployer | - 20210830_UpdateDataForSortingMySitesBox.sql | - |
| Run DataFixes/20210910_UpdateCheckPermissionIdForWorkflowTabFunctions | During Upgrade | Client Dev | - Run DataFixes/20210910_UpdateCheckPermissionIdForWorkflowTabFunctions | - |

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
| Database / Deployment | Bug in sorting tasks list: | No deterministic git-diff evidence was supplied for this note. | None stated in the release source. | - |

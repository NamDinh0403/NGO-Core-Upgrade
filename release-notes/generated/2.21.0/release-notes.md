# NGO Core 2.21.0 Release Notes

- **Version:** 2.21.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **9** | Conditional Actions **0** | New Features **2** | Bug Fixes **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Logframe: Add export to excel to rollup | During Upgrade | Deployer | Logframe: Add export to excel to rollup<br>DataFixes/20211217_Program_IndicatorTracker_RemoveRollupConfig.sql | - |
| Finance allocation - Remove modified by dropdown | During Upgrade | Deployer | Finance allocation - Remove modified by dropdown<br>DataFixes\20211215_FundingAllocation_Remove_ModifiedBy.sql | - |
| Tasks tab: Rename free-text search filter | During Upgrade | Deployer | [T] Tasks tab: Rename free-text search filter<br>20211208_UpdateResoureString_TaskTab.sql | - |
| Add configuration key in Azure settings for web job | During Upgrade | Client Dev | Analyse: Generate report and email<br>Add configuration key in Azure settings for web job<br>sp:AnalyseExportQueue<br>sp:AnalyseBlob<br>sp:AnalyseBlobQueue<br>sp:AnalyseBlobReference | - |
| Add AnalyseExport webjob to api pipeline yaml file | During Upgrade | Client Dev | Add AnalyseExport webjob to api pipeline yaml file | - |
| Run DataFixes\20211213_CoreRolePermissions_AddListPermissions.sql | During Upgrade | Deployer | Partner Portal - to be able to Hide entities in the Top bar that users don't have access to<br>Need to add List permission for roles that already had View permission to make sure users won't be redirected to 403 page<br>Run DataFixes\20211213_CoreRolePermissions_AddListPermissions.sql<br>* Note: for client projects, please make sure to add the necessary List permissions into CorePermissions (since Core script doesn't cover all custom functions) before running the above script | - |
| Run DataFixes\20211215_FundingAllocation_Remove_ModifiedBy | During Upgrade | Client Dev | [Finance-Allocation] Lost data in Modified By dropdown > Can't create an allocation<br>Run DataFixes\20211215_FundingAllocation_Remove_ModifiedBy | - |
| Run DataFixes\20211217_Program_IndicatorTracker_RemoveRollupConfig.sql | During Upgrade | Deployer | Logframe: Add export to excel to rollup<br>Run DataFixes\20211217_Program_IndicatorTracker_RemoveRollupConfig.sql | - |
| Remove duplicate status column in tasks list | During Upgrade | Deployer | Remove duplicate status column in tasks list<br>DataFixes/20220107_TaskList_FixDuplicateStatusColumn.sql | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| None identified. | - | - | - | - | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | Logframe: Add export to excel to rollup | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. Logframe: Add export to excel to rollup | - |
| Database / Deployment | Logframe: Add export to excel to rollup | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. Run DataFixes\20211217_Program_IndicatorTracker_RemoveRollupConfig.sql | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Finance-Allocation | [Finance-Allocation] Lost data in Modified By dropdown > Can't create an allocation | No deterministic git-diff evidence was supplied for this note. | Run DataFixes\20211215_FundingAllocation_Remove_ModifiedBy | - |

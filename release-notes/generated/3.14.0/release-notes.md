# NGO Core 3.14.0 Release Notes

- **Version:** 3.14.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **3** | Conditional Actions **0** | New Features **0** | Bug Fixes **1** | Needs Review **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Run below two scripts if it's not auto run by deployment (checking database table) | Before Deploy | Deployer | [M] Partner access: Documents<br>[For developer] Checking your client project if any override method of SPFolderService.cs/SetSignedOffFolderPermission, if existed, please read and compare with core code and then update your override method to still keep both your custom logic and core logic (new core updates: PFAdmin role will be added as 'Editor' of '99 Approvals' folder, Core supports to able configure exclude Role from View of 99 Approvals using 'RestrictedGlobalRolesInViews' use default setting or new setting with tabFunctionId: 113)<br>[BeforeDeployment, for deployment person] Go to 'SharePointBackend/ClientDocumentationImages/LibrarySettings/Permissions for this document library' and press 'Delete unique permissions' button, it will be re-setup by webjob.<br>[AfterDeployment] Run below two scripts if it's not auto run by deployment (checking [__DeployScriptHistory] database table)<br>20220602_CoreRolePermissions_ReplaceViewByListPermissionForRecycleBin.sql<br>20230413_AddListPermissionOnDocumentsTab.sql | [Card](https://trello.com/c/fbRqlu14/3264-m-partner-access-documents) |
| Add to environment (2 files): | During Upgrade | Client Dev | Add to environment (2 files):<br>adminStartPageConfiguration: 'api/core/adminStartPageConfiguration' | - |
| Set limited permissions, performance | During Upgrade | Client Dev | [S] Set limited permissions, performance<br>[S] Set limited permissions, performance on Current sprint - Core \| Trello<br>Add Azure configuration key sp:SubFolderLimitedPermissionCheckTimeoutInSec to set timeout to 30 | [Card](https://trello.com/c/TLwSwStH/3274-s-set-limited-permissions-performance) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Start page configuration to be possible in Administration Portal | During Upgrade | Client Dev | [L] Start page configuration to be possible in Administration Portal<br>Open app.module.ts, add 'faTh' next to 'faChartArea' (two places) | [Card](https://trello.com/c/FmexDXK3) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | [S] BrowseList - Region Field: ControlType.parentDropDownText not working anymore ( ) | No deterministic git-diff evidence was supplied for this note. | None stated in the release source. | [Card](https://trello.com/c/F2iwHNks) |

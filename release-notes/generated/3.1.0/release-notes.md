# NGO Core 3.1.0 Release Notes

- **Version:** 3.1.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **7** | Conditional Actions **0** | New Features **2** | Bug Fixes **1** | Needs Review **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Remove recent box on start page (only run if customer don't want to use it) | After Deploy | Deployer | Remove recent box on start page (only run if customer don't want to use it)<br>[After deployment]: DataFixes/20220330_DeleteRecentBoxInStartPage | - |
| Step2: Run : DataFixes/20220331_RemoveUnusedRecycleBinPermissions.sql | After Deploy | Deployer | - Step2: Run [After deployment]: DataFixes/20220331_RemoveUnusedRecycleBinPermissions.sql | - |
| Update FieldDefinitionId for "Heading" fields | During Upgrade | Deployer | Update FieldDefinitionId for "Heading" fields<br>DataFixes/20220405_UpdateFieldDefinitionIdForHeadingFields.sql | - |
| Fix data for overviewbox | During Upgrade | Deployer | Fix data for overviewbox<br>DataFixes/ 20220225_UpdateDataForOverviewBoxes.sql | - |
| Task-Gantt chart: update coreconfiguration for ShowGanttTask to new GanttTaskConfiguration | After Deploy | Deployer | Task-Gantt chart: update coreconfiguration for ShowGanttTask to new GanttTaskConfiguration<br>[After deployment]: DataFixes/20220414_FixTaskListSetting.sql | - |
| Admin UI / Task template / Edit template of All entity type: Default responsible field has no option | During Upgrade | Deployer | Admin UI / Task template / Edit template of All entity type: Default responsible field has no option<br>DataFixes/20220414_Update_EntityIsLimitedEntity.sql | - |
| Add route to app-route.service below the access-denied : | During Upgrade | Client Dev | Add route to app-route.service below the access-denied :<br>{ path: 'unauthorized', component: UnauthorizedComponent } , | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Step1: Review custom script in your client project related to CoreRolePermission and remove PermissionId 1352,1354,1402,1404 in your project custom script (if any) | During Upgrade | Client Dev | - Step1: Review custom script in your client project related to CoreRolePermission and remove PermissionId 1352,1354,1402,1404 in your project custom script (if any) | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | Task-Gantt chart: update coreconfiguration for ShowGanttTask to new GanttTaskConfiguration | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. Task-Gantt chart: update coreconfiguration for ShowGanttTask to new GanttTaskConfiguration | - |
| Shared / Cross-track | Recycle bin: no need permission: Add,Delete (Only List,View,Edit) | No deterministic git-diff evidence was supplied for this note. | No explicit client action was stated in the release source. | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | Fix data for overviewbox | No deterministic git-diff evidence was supplied for this note. | Fix data for overviewbox | - |

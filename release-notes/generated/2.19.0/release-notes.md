# NGO Core 2.19.0 Release Notes

- **Version:** 2.19.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **4** | Conditional Actions **1** | New Features **1** | Bug Fixes **0** | Needs Review **2**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Add to Azure configuration with key and value: <add key="sp:WorkflowBypassQueue" value="workflowbypass"/> | During Upgrade | Client Dev | - Add to Azure configuration with key and value: <add key="sp:WorkflowBypassQueue" value="workflowbypass"/> | - |
| Add to *.yml config file to deploy web job BypassPhaseManagement | During Upgrade | Client Dev | - Add to *.yml config file to deploy web job BypassPhaseManagement | - |
| Run to correct resource string DataFixes/20211004_WorkflowByPassResourceUpdates.sql | During Upgrade | Deployer | - Run to correct resource string DataFixes/20211004_WorkflowByPassResourceUpdates.sql | - |
| Document: add characteristic to fied FileLeafRef to open with app / online by global configuration | After Deploy | Deployer | Document: add characteristic to fied FileLeafRef to open with app / online by global configuration<br>[After deployment]: DataFixes/20211109_Document_link_Open_Characteristics.sql | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| And also add "canActivate: ," to routes in customize route services | Access denied page: | During Upgrade | Client Dev | Access denied page:<br>Recheck all override route services with Core to add "UserAuthGuard" as the 1st one to "canActivate" of routes<br>And also add "canActivate: [UserAuthGuard]," to routes in customize route services | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Gantt Chart in Task | During Upgrade | Client Dev | Gantt Chart in Task<br>+ Add faStream , faList to @fortawesome/pro-regular-svg-icons in app.module.ts | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Workflow / Bypass to later phase | During Upgrade | Client Dev | Workflow / Bypass to later phase | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | Document: add characteristic to fied FileLeafRef to open with app / online by global configuration | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. Document: add characteristic to fied FileLeafRef to open with app / online by global configuration | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

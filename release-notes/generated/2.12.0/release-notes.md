# NGO Core 2.12.0 Release Notes

- **Version:** 2.12.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **4** | Conditional Actions **1** | New Features **1** | Bug Fixes **1** | Needs Review **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Update SQLMapping for Strategies and Strategies2 in CoreFieldInstances table for Risk tab - It should use Type = 14 instead: | During Upgrade | Deployer | Update SQLMapping for Strategies and Strategies2 in CoreFieldInstances table for Risk tab - It should use Type = 14 instead:<br>Run 20210318_CoreFieldInstances_Update_Strategies_SQLMapping.sql in DataFixes folder | - |
| Run Datafixes/20210330_TabDefinitionUpdates.sql | During Upgrade | Deployer | Updates to manage Tabs<br>Run Datafixes/20210330_TabDefinitionUpdates.sql | - |
| Run 20210331_Sprint7_LogframeGlobalUpdates and 20210309_Sprint7_EntityTabUpdates.sql in Datafixes | During Upgrade | Deployer | Logframe rollup<br>Run 20210331_Sprint7_LogframeGlobalUpdates and 20210309_Sprint7_EntityTabUpdates.sql in Datafixes | - |
| Run DataFixes/20210331_CorrectFields_ForLogBoxes.sql | During Upgrade | Deployer | Correct the right 'entity' field instance for summary 'recent logs' boxes<br>Run DataFixes/20210331_CorrectFields_ForLogBoxes.sql | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| Optional) Fix sort order of my tasks box like | (Optional) Fix sort order of my tasks box like: name \| entity \| workflow status \| responsible \| duedate Run DataFixes/20210331_UpdateMyTasksBox_FieldOrders | During Upgrade | Client Dev | (Optional) Fix sort order of my tasks box like: name \| entity \| workflow status \| responsible \| duedate Run DataFixes/20210331_UpdateMyTasksBox_FieldOrders | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | All web jobs | During Upgrade | Client Dev | All web jobs<br>Define Unity container as a variable inside the function , NO LONGER static variable | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | Unity update | No deterministic git-diff evidence was supplied for this note. | No explicit client action was stated in the release source. | [PR](https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-wwf/pullrequest/5140)<br>[PR](https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-cbm/pullrequest/5974) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Backend | (Optional) Fix sort order of my tasks box like: name \| entity \| workflow status \| responsible \| duedate Run DataFixes/20210331_UpdateMyTasksBox_FieldOrders | No deterministic git-diff evidence was supplied for this note. | Optional) Fix sort order of my tasks box like. (Optional) Fix sort order of my tasks box like: name \| entity \| workflow status \| responsible \| duedate Run DataFixes/20210331_UpdateMyTasksBox_FieldOrders | - |

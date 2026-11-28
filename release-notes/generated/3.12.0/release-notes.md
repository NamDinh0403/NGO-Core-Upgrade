# NGO Core 3.12.0 Release Notes

- **Version:** 3.12.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **12** | Conditional Actions **0** | New Features **1** | Bug Fixes **5** | Needs Review **4**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Field/dropdown Country don't show all countries | After Deploy | Deployer | Field/dropdown Country don't show all countries<br>[After deployment] DataFixes/20230213_UpdateLimitlevelCharacteristics.sql | [Card](https://trello.com/c/emgFA9x5) |
| Update Logframe calculations for YTD or PTD: | After Deploy | Deployer | [Logframe] Update Logframe calculations for YTD or PTD:<br>[After Deployment] DataFixes/ 20230127_UpdateLogframeYTDColumnSortOrder.sql (Read the description in the script for more detail) | [Card](https://trello.com/c/0lhQZKyE) |
| Partner tasks - Partners should not be able to edit deadline/end date?: | After Deploy | Deployer | [S] Partner tasks - Partners should not be able to edit deadline/end date?:<br>[After Deployment] DataFixes/20230213_UpdateFieldCharacteristicForPartnerUsers | [Card](https://trello.com/c/SLfTvOr4)<br>[Card](https://trello.com/c/1fnUFfBR) |
| Analyse, default setup: Secondary tables appear when they shouldn't (such as Primary table Risks, and all entities appear as Secondary tables, even though the Risks tab only appear | After Deploy | Deployer | Analyse, default setup: Secondary tables appear when they shouldn't (such as Primary table Risks, and all entities appear as Secondary tables, even though the Risks tab only appears on two entities; Or Budget is only on Project, but in Analyse the "Budget" list is appearing for both Projects and Fundings, it shoudln't appear for Fundings)<br>[After deployment] DataFixes/ 20221230_RemoveUnusedPermissions.sql | [Card](https://trello.com/c/5yliDfRz) |
| Browse view: Filter by current phase not support, and not work | After Deploy | Deployer | [S] Browse view: Filter by current phase not support, and not work<br>[After deployment] DataFixes/20230208_UpdateCurrentWorkflowField.sql | [Card](https://trello.com/c/4dnlzWVi) |
| When a task that has mandatory review and approval, and the user click on "End review" the task is marked as "completed" and "stopped" the correct would be that the task status is | After Deploy | Deployer | [S] When a task that has mandatory review and approval, and the user click on "End review" the task is marked as "completed" and "stopped" the correct would be that the task status is "In progress" and "Stopped"?:<br>[After Deployment] DataFixes/ 20230217_UpdateTaskStatusResourceStrings.sql | [Card](https://trello.com/c/MYNPC68G) |
| Server error when config browse view with RatingField | After Deploy | Deployer | [S] Server error when config browse view with RatingField<br>[After deployment] DataFixes/20230223_UpdateFieldInstances_sqlDtoMapping.sql | [Card](https://trello.com/c/Q1HWk918) |
| Run NGO.Tools/NGO.Core.Tools.SetTaskTemplatesResourceStrings | During Upgrade | Client Dev | [S] Task/Task template - Assigned to, not translated<br>Run NGO.Tools/NGO.Core.Tools.SetTaskTemplatesResourceStrings | [Card](https://trello.com/c/48fHZEUp) |
| Run Datafixes/20230224_UpdateMissingLastPeriodMessageResourceString.sql | After Deploy | Deployer | [S] Finance/Partner expenditure/Form - Can't report next period if leave option 'Open Last Period' empty<br>[After deployment] Run Datafixes/20230224_UpdateMissingLastPeriodMessageResourceString.sql | [Card](https://trello.com/c/HyIBWb0f) |
| Check client config of rating and comment at objective level or indicator level | During Upgrade | Client Dev | - Check client config of rating and comment at objective level or indicator level | - |
| Update LogframeIndicatorTemplate pdf template to match with client config | During Upgrade | Client Dev | - Update LogframeIndicatorTemplate pdf template to match with client config | - |
| Compression settings: | During Upgrade | Client Dev | Compression settings:<br>Please update web.config to enable zip compression for all static files + data sent to/from the API. Inside the <system.webServer> element, add:<br><urlCompression doStaticCompression="true" doDynamicCompression="true" /> | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Indicator Level: | During Upgrade | Client Dev | - Indicator Level: | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Rating: ExportLogframeObjective.LogframeReportingIndicatorActual.RatingField1 | During Upgrade | Client Dev | - Rating: ExportLogframeObjective.LogframeReportingIndicatorActual.RatingField1 | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Comments: ExportLogframeObjective.LogframeReportingIndicatorActual.Comment | During Upgrade | Client Dev | - Comments: ExportLogframeObjective.LogframeReportingIndicatorActual.Comment | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Objective Level: using core template | During Upgrade | Client Dev | - Objective Level: using core template | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Logframe | [Logframe] Update Logframe calculations for YTD or PTD: | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. Update Logframe calculations for YTD or PTD: | [Card](https://trello.com/c/0lhQZKyE) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | [S] Partner tasks - Partners should not be able to edit deadline/end date?: | No deterministic git-diff evidence was supplied for this note. | Partner tasks - Partners should not be able to edit deadline/end date?: | [Card](https://trello.com/c/SLfTvOr4)<br>[Card](https://trello.com/c/1fnUFfBR) |
| Database / Deployment | Analyse, default setup: Secondary tables appear when they shouldn't (such as Primary table Risks, and all entities appear as Secondary tables, even though the Risks tab only appears on two entities; Or Budget is only on Project, but in Analyse the "Budget" list is appearing for both Projects and Fundings, it shoudln't appear for Fundings) | No deterministic git-diff evidence was supplied for this note. | Analyse, default setup: Secondary tables appear when they shouldn't (such as Primary table Risks, and all entities appear as Secondary tables, even though the Risks tab only appear | [Card](https://trello.com/c/5yliDfRz) |
| Database / Deployment | [S] Server error when config browse view with RatingField | No deterministic git-diff evidence was supplied for this note. | Server error when config browse view with RatingField | [Card](https://trello.com/c/Q1HWk918) |
| Database / Deployment | [S] Finance/Partner expenditure/Form - Can't report next period if leave option 'Open Last Period' empty | No deterministic git-diff evidence was supplied for this note. | Run Datafixes/20230224_UpdateMissingLastPeriodMessageResourceString.sql | [Card](https://trello.com/c/HyIBWb0f) |
| Logframe/Indicator tracker | [S] [Logframe/Indicator tracker] Missing Rating and comment value on approval PDF file: | No deterministic git-diff evidence was supplied for this note. | None stated in the release source. | [Card](https://trello.com/c/V3aMbvVj) |

# NGO Core 2.22.0 Release Notes

- **Version:** 2.22.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **9** | Conditional Actions **0** | New Features **3** | Bug Fixes **1** | Needs Review **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Run migration tool to update permissions in task template: NGO.Core.Tools.TaskTemplateApprovalStepsMigration | During Upgrade | Client Dev | Task Template: support permission as multi-choice<br>Run migration tool to update permissions in task template: NGO.Core.Tools.TaskTemplateApprovalStepsMigration | - |
| Analyse/Logframe: update name of target and reporting period name | During Upgrade | Deployer | Analyse/Logframe: update name of target and reporting period name<br>(Improve performance of SQL statement)<br>DataFixes/20220103_Logframe_UpdateTargetReportPeriodName.sql | - |
| Show checkbox" Display on workflow" | During Upgrade | Deployer | Show checkbox" Display on workflow"<br>DataFixes/ 20220105_UpdateFieldDisplayOnWorkflowTab.sql | - |
| Run SQL "UPDATE CoreEmailTemplates SET ReceiversTokenKey = ' ]' WHERE Id = 113" | During Upgrade | Client Dev | Approval recall email sent to wrong person<br>Run SQL "UPDATE CoreEmailTemplates SET ReceiversTokenKey = '[[Task.ResponsiblePerson]]' WHERE Id = 113" | - |
| "Is latest published version" field for Logframe | During Upgrade | Deployer | "Is latest published version" field for Logframe<br>DataFixes/ 20220105_UpdateLogframe_IsCurrentPublishedVersion.sql | - |
| Check New agreement/ amendment structure configuration and migration in Agreements in Config Wiki | During Upgrade | Client Dev | - Check New agreement/ amendment structure configuration and migration in Agreements in Config Wiki | - |
| Add these field locations as an After Deployment oneTimeFix sql file. | After Deploy | Deployer | - Add these field locations as an After Deployment oneTimeFix sql file. | [Card](https://trello.com/c/UQjEPmJW/1422-agreement-browse-view-mandatory-fields-need-to-be-moved-to-corect-script-file) |
| Check ReviewMode column on CoreTaskTemplates in custom scripts of project clients, if null, change value to 0 on that script. | During Upgrade | Client Dev | - Check ReviewMode column on CoreTaskTemplates in custom scripts of project clients, if null, change value to 0 on that script. | - |
| DataFixes/20211231_UpdateReviewMode_CoreTaskTemplates.sql | During Upgrade | Deployer | - DataFixes/20211231_UpdateReviewMode_CoreTaskTemplates.sql | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | = 2.22 + any task template configured in custom scripts | During Upgrade | Client Dev | = 2.22 + any task template configured in custom scripts<br>Please find if any task template configured in custom scripts, and update ApprovalPermissionGroups, ReviewPermissionGroups in<br>CoreTaskTemplates to new format.<br>[{id: 7, name custom: "Person responsible " n<br>responsible'<br>The green box is a correct format from Core 2.22.<br>The format is a array of array (the old format is array of object)<br>" /> | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | For developer: Please find if any task template configured in custom scripts in your client project, and update ApprovalPermissionGroups , ReviewPermissionGroups in CoreTaskTemplates to new format (see image for your reference) | No deterministic git-diff evidence was supplied for this note. | No explicit client action was stated in the release source. | - |
| Database / Deployment | Add these field locations as an After Deployment oneTimeFix sql file. | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. Add these field locations as an After Deployment oneTimeFix sql file. | [Card](https://trello.com/c/UQjEPmJW/1422-agreement-browse-view-mandatory-fields-need-to-be-moved-to-corect-script-file) |
| Shared / Cross-track | New Agreements tab - Amendment function : | No deterministic git-diff evidence was supplied for this note. | No explicit client action was stated in the release source. | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | Approval recall email sent to wrong person | No deterministic git-diff evidence was supplied for this note. | Run SQL "UPDATE CoreEmailTemplates SET ReceiversTokenKey = ' ]' WHERE Id = 113" | - |

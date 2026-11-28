# NGO Core 3.6.0 Release Notes

- **Version:** 3.6.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **9** | Conditional Actions **2** | New Features **4** | Bug Fixes **2**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| delete from CoreFieldInstanceLocations where id >= 20455 and id <= 20517 | During Upgrade | Client Dev | For ngo-nextgen only (clean up unused fields in logframe)<br>delete from CoreFieldInstanceLocations where id >= 20455 and id <= 20517 | - |
| delete from CoreCacheItems | During Upgrade | Client Dev | delete from CoreCacheItems | - |
| Show view only in main form when Auto Sum Not Editable validation applied (run again to ensure this logic) | After Deploy | Deployer | Show view only in main form when Auto Sum Not Editable validation applied (run again to ensure this logic)<br>[After deployment]: DataFixes/ 20220816_UpdateReadOnlyDependencyForSumNotEditableLogframe.sql | - |
| Card: Wrong format and default config in core scripts < | After Deploy | Deployer | Card: [T] [Side effect] Wrong format and default config in core scripts <<br>[After deployment]: DataFixes/20220905_UpdateTaskTemplatePermissions.sql | [Card](https://trello.com/c/D3sqFIrI) |
| Card: Admin UI: Metadata error messages < | After Deploy | Deployer | Card: Admin UI: Metadata error messages <<br>[After deployment]: DataFixes/ 20220906_UpdateResourceString_DeleteOptionError.sql | [Card](https://trello.com/c/fz74ePNB) |
| Card: Workflow, Activate phase form: Rename reference to 'project' < | After Deploy | Deployer | Card: [T] Workflow, Activate phase form: Rename reference to 'project' <<br>[After deployment]: 20221609_UpdateWorkflowResourceStringDescription.sql => Changed file name on version 3.7 to : 20220916_UpdateWorkflowResourceStringDescription.sql | [Card](https://trello.com/c/Mrfd8jag) |
| Logframe / Reporting: After rejecting report, there is no Save button when re-editing. Also no option to re-send for approval when re-opening an approved report | After Deploy | Deployer | [S] Logframe / Reporting: After rejecting report, there is no Save button when re-editing. Also no option to re-send for approval when re-opening an approved report<br><<br><<br>[After deployment]: DataFixes/ 20220914_AllowReApproval.sql | [Card](https://trello.com/c/wrmw3wtY)<br>[Card](https://trello.com/c/pS7zJHBD) |
| Run DataFixes/20220714_PowerBIv2.sql | During Upgrade | Deployer | PowerBI v2<br>Run DataFixes/20220714_PowerBIv2.sql | [Card](https://trello.com/c/8oIfhF5S/2527-m-power-bi-configurability-v2) |
| Card: Entity overall status box: Add more field options < | After Deploy | Deployer | Card: Entity overall status box: Add more field options <<br>[After deployment]: DataFixes/20220915_EntityOverallStatus_RemoveDuplicateTextField2.sql | [Card](https://trello.com/c/x201Jstw) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| check if your client project has NgoContext, if exists please replace Row 43 (see Row 43 in image below) with two new lines in 'App_Start/UnityConfig.cs' file | Card: Update 'UnityConfig.cs.pp' file in nuget folder | During Upgrade | Client Dev | Card: [Technical] Update 'UnityConfig.cs.pp' file in nuget folder<br><<br>Note1: when upgrading new core version, if it says to replace file 'UnityConfig.cs', please allow to replace file and then compare with previous file and copy specific lines that needed for your client project.<br>Note2: check if your client project has NgoContext, if exists please replace Row 43 (see Row 43 in image below) with two new lines in 'App_Start/UnityConfig.cs' file:<br>container.RegisterType<Core.Repositories.CoreContext, Repositories.NgoContext>(new PerRequestLifetimeManager()); | [Card](https://trello.com/c/yeVB1Qu2) |
| if your client project has custom NGO | (new PerRequesCLifeCimeManageI ; | During Upgrade | Client Dev | (new PerRequesCLifeCimeManageI ;<br>cont .CoreConCexC, Core PerRequesCLifeCimeManageI()) ;<br>DEBUG<br>container . AddExCension (new Diagnostic ;<br>" /><br>Note3: if your client project has custom NGO.WebJobs.Common, please find 'UnityConfig.cs' inside and add those two lines RegisterType but with PerResolveLifetimeManager for webjob. | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Technical | Card: [Technical] Update 'UnityConfig.cs.pp' file in nuget folder | No deterministic git-diff evidence was supplied for this note. | check if your client project has NgoContext, if exists please replace Row 43 (see Row 43 in image below) with two new lines in 'App_Start/UnityConfig.cs' file Card: Update 'UnityConfig.cs.pp' file in nuget folder | [Card](https://trello.com/c/yeVB1Qu2) |
| Shared / Cross-track | container.RegisterType<Repositories.NgoContext, Repositories.NgoContext>(new PerRequestLifetimeManager()); | No deterministic git-diff evidence was supplied for this note. | No explicit client action was stated in the release source. | - |
| Shared / Cross-track | (new PerRequesCLifeCimeManageI ; | No deterministic git-diff evidence was supplied for this note. | if your client project has custom NGO (new PerRequesCLifeCimeManageI ; | - |
| Backend | Card: Entity overall status box: Add more field options < | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. Card: Entity overall status box: Add more field options < | [Card](https://trello.com/c/x201Jstw) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Side effect | Card: [T] [Side effect] Wrong format and default config in core scripts < | No deterministic git-diff evidence was supplied for this note. | Card: Wrong format and default config in core scripts < | [Card](https://trello.com/c/D3sqFIrI) |
| Database / Deployment | Card: Admin UI: Metadata error messages < | No deterministic git-diff evidence was supplied for this note. | Card: Admin UI: Metadata error messages < | [Card](https://trello.com/c/fz74ePNB) |

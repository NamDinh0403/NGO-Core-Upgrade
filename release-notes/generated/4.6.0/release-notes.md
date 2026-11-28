# NGO Core 4.6.0 Release Notes

- **Version:** 4.6.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **2** | Conditional Actions **1** | New Features **0** | Bug Fixes **1** | Needs Review **3**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Generate restrictions for existing data run sql: | After Deploy | Deployer | - [After deployment] Generate restrictions for existing data run sql: | - |
| EXECUTE . | During Upgrade | Client Dev | EXECUTE [dbo].[GenerateCachedRestrictedUserEntities] | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| - Key of enabling to insert data to restricted table: Core:Queue:RestrictedEntityJobEnabled = true | Key of enabling to insert data to restricted table: Core:Queue:RestrictedEntityJobEnabled = true | During Upgrade | Client Dev | - Key of enabling to insert data to restricted table: Core:Queue:RestrictedEntityJobEnabled = true | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Restricted entities optimisation | During Upgrade | Client Dev | Restricted entities optimisation | [Card](https://trello.com/c/O9ryyPU1) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Key of queue message: Core:Queue:RestrictedUserEntitiesQueue = "restricteduserentities" | During Upgrade | Client Dev | - Key of queue message: Core:Queue:RestrictedUserEntitiesQueue = "restricteduserentities" | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Service Injection: IBaseTaskActionService -> Remove name in register service in CommonDIRegistrations.cs | During Upgrade | Client Dev | Service Injection: IBaseTaskActionService -> Remove name in register service in CommonDIRegistrations.cs<br>Ex:<br>container.RegisterType<Core.Services.IBaseTaskActionService, WireTransferTaskActionService>( WireTransferTaskActionService.ConfigurationId );<br>-> Change to: container.RegisterType<Core.Services.IBaseTaskActionService, WireTransferTaskActionService>();￼or container.AddTransient<Core.Services.IBaseTaskActionService, WireTransferTaskActionService>();<br>Do the same for IBaseExportPdfActionService | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Compile error | [Compile error] if any compile error related to IsGeneratingProgressDone == true, please replace it with 'ProgressStatus != Model.Enums.LogframeVersionProgressStatus.IsCloningStructure' | No deterministic git-diff evidence was supplied for this note. | None stated in the release source. | - |

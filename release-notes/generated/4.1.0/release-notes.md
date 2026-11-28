# NGO Core 4.1.0 Release Notes

- **Version:** 4.1.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **1** | Conditional Actions **0** | New Features **1** | Bug Fixes **0** | Needs Review **3**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Upgrade pipelines and release to dotnet 7: Upgrade pipelines and release to dotnet 7 | During Upgrade | Client Dev | NGO Core 4.x (to .net 7):<br>Upgrade pipelines and release to dotnet 7: Upgrade pipelines and release to dotnet 7 | [Ref](https://precio.sharepoint.com/:w:/r/sites/ngo-oonline/_layouts/15/Doc.aspx?sourcedoc=%7B562B8C65-796B-46E7-990C-0EA4DA001F5B%7D&file=Upgrade%20pipelines%20and%20release%20to%20dotnet%207.docx&action=default&mobileredirect=true) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Logframe: Loading breakdown dynamically | During Upgrade | Client Dev | Logframe: Loading breakdown dynamically<br>This function is enabled by default, please check with PM, if this function is not necessary in the client, deactivate the field location with<br>Id = 2868: For indicator tracker<br>Id = 4925: roll up of indicator tracker | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Service Injection: IBaseTaskActionService -> Remove name in register service in CommonDIRegistrations.cs | During Upgrade | Client Dev | Service Injection: IBaseTaskActionService -> Remove name in register service in CommonDIRegistrations.cs<br>Ex:<br>container.RegisterType<Core.Services.IBaseTaskActionService, WireTransferTaskActionService>( WireTransferTaskActionService.ConfigurationId );<br>-> Change to: container.RegisterType<Core.Services.IBaseTaskActionService, WireTransferTaskActionService>();￼or container.AddTransient<Core.Services.IBaseTaskActionService, WireTransferTaskActionService>();<br>Do the same for IBaseExportPdfActionService | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | NGO Core 4.x (to .net 7): | During Upgrade | Client Dev | NGO Core 4.x (to .net 7): | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| select * from CoreFieldInstanceLocations where ReadOnlyDependencyId = 54 | Logframe: Update Linked Global Indicator property in Indicator from Array to Single | No deterministic git-diff evidence was supplied for this note. | No explicit client action was stated in the release source. | [Card](https://trello.com/c/InbT6yKp) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

# NGO Core 5.4.0 Release Notes

- **Version:** 5.4.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/5.4.0.json)
- **Quick Summary:** Mandatory Actions **1** | Conditional Actions **1** | New Features **3** | Bug Fixes **1** | Needs Review **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| (For clients: Run this script after DataFixes steps if need to fix FieldInstanceId for existing generic overview boxes which have fields saved from wrong EntityDefinitionId: | During Upgrade | Deployer | (For clients: Run this script after DataFixes steps if need to fix FieldInstanceId for existing generic overview boxes which have fields saved from wrong EntityDefinitionId:<br>" 20240412_ManualAfterDataFixes_FieldInstanceIdForGenericOverviewBox.sql") | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| if client have custom webjob | Add the following to WebJobs.Job appSettings.json in Core section: | During Upgrade | Client Dev | Webjob monitoring<br>Add the following to WebJobs.Job appSettings.json in Core section:<br>"WebJobExecution": {<br>"RetainLogDays": 180,<br>"CleanSchedule": "0 1 * * *"<br>}<br>Also add "Core:WebJobExecution:RetainLogDays" and "Core:WebJobExecution:CleanSchedule" with the same values to Azure app settings.<br>Check the core code and adapt it to client webjob, if client have custom webjob. | [Card](https://trello.com/c/E8NuEFad/4111-webjob-monitoring) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Generic overview box is named 'overviewbox.generic_summary_overview_box' in the list on Current sprint - Core \| Trello | During Upgrade | Client Dev | Generic overview box is named 'overviewbox.generic_summary_overview_box' in the list on Current sprint - Core \| Trello<br>If there are custom generic overviewboxes implemented, each one needs to get a custom OverviewBoxDefinition and existing OverviewBoxInstances updated to use the new definition id. | [Card](https://trello.com/c/5hErQ4yl/3984-generic-overview-box-is-named-overviewboxgenericsummaryoverviewbox-in-the-list) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Backend | Release note | Matched key changes: M `ngo-api-core/NGO/NGO.Core.Infrastructure/SharePoint/Fields.cs` | No explicit client action was stated in the release source. | [Card](https://trello.com/c/EP5cJe16/4193-add-configuration-to-overview-box-definitions-about-what-entity-to-load-fields-from-load-fields-according-to-this-config-instead) |
| Backend | Note for clients: These boxes are rollup data from an entity (ex: projects) to another entity (ex: program), so they should only be added on related entities (ex: project/program) | Matched key changes: M `ngo-api-core/NGO/NGO.Core.Tools.SetWFForEntitiesCreatedWithoutWF/Program.cs`, M `ngo-api-core/NGO/NGO.Core.Tools.SiteConfigurationPopulation/Program.cs` | No explicit client action was stated in the release source. | - |
| Backend | The script bellow should be review and run if it's truly rollup info from entity to entity, otherwise, should be update OverviewBoxDefinitionId = (23,63,64) in CoreOverviewBoxInstances to appropriate definition id instead. If there is no appropriate definition id, plz add a new overviewbox definition with TypeId = 23, and use it as usual. | Matched key changes: M `ngo-api-core/NGO/NGO.Core.Model/Domain/Configuration/OverviewBoxDefinition.cs`, M `ngo-api-core/NGO/NGO.Core.Model/Dto/Configuration/OverviewBoxDefinition.cs` | No explicit client action was stated in the release source. | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Backend | (For clients: Run this script after DataFixes steps if need to fix FieldInstanceId for existing generic overview boxes which have fields saved from wrong EntityDefinitionId: | Matched key changes: A `ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/20240412_ManualAfterDataFixes_FieldInstanceIdForGenericOverviewBox.sql`, M `ngo-api-core/NGO/NGO.Core.Infrastructure/SharePoint/Fields.cs` | (For clients: Run this script after DataFixes steps if need to fix FieldInstanceId for existing generic overview boxes which have fields saved from wrong EntityDefinitionId: | - |

# NGO Core 9.2.0 Release Notes

- **Version:** 9.2.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/9.2.0.json)
- **Quick Summary:** Mandatory Actions **6** | Conditional Actions **5** | New Features **3** | Bug Fixes **0** | Needs Review **2**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Compare and copy the changes of | During Upgrade | Client Dev | - Compare and copy the changes of | [PR](https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/36783?_a=files&path=/ngo-client-core/src/app/app-routing.module.ts) |
| Copy the changes of | During Upgrade | Client Dev | - Copy the changes of | [PR](https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/36783?_a=files&path=/ngo-client-core/src/main.ts) |
| Remove Azure App permission: Microsoft Graph Mail.Read (Application) | During Upgrade | Client Dev | - Remove Azure App permission: Microsoft Graph Mail.Read (Application) | - |
| Add to all appsettings.json files and Azure App Settings: | During Upgrade | Client Dev | - Add to all appsettings.json files and Azure App Settings:<br>"Core: CspAdditionalFrameSrc " : "" | - |
| remove logframes2 from environment files | During Upgrade | Client Dev | ﷟HYPERLINK " Base url confusion on Current sprint - Core \| Trello Base url confusion on Current sprint - Core \| Trello<br>[For upgraded person] remove logframes2 from environment files | [Card](https://trello.com/c/zGX0IkPt/5554-tlogframe2-base-url-confusion) |
| Run script ExportCspAdditionalFrameSrc.sql in the PR attached card, then copy the value of CspAdditionalFrameSrc into "Core:CspAdditionalFrameSrc" on Azure/App Service (Check the v | After Deploy | Deployer | Write a script/tool to collect existing embedded URLs for CSP configuration<br>[For deployment person][AfterDeployment] Run script ExportCspAdditionalFrameSrc.sql in the PR attached card, then copy the value of CspAdditionalFrameSrc into "Core:CspAdditionalFrameSrc" on Azure/App Service (Check the verification results before copying): | [Card](https://trello.com/c/QlrpCYr1/5777-write-a-script-tool-to-collect-existing-embedded-urls-for-csp-configuration)<br>[PR](https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/38994) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| Optional – used for Outlook add-in] Add Azure App permission | Add Azure App permission: Microsoft Graph Mail.Read (Delegated) | During Upgrade | Client Dev | - [Optional – used for Outlook add-in] Add Azure App permission: Microsoft Graph Mail.Read (Delegated) | - |
| If there are any customizations related to BaseConfigurationRepository's entityViewDefinitions (e | ﷟HYPERLINK " Update config of Core Analyse tables on Current sprint - Core \| Trello Update config of Core Analyse tables on Current sprint - Core \| Trello | During Upgrade | Client Dev | ﷟HYPERLINK " Update config of Core Analyse tables on Current sprint - Core \| Trello Update config of Core Analyse tables on Current sprint - Core \| Trello<br>If there are any customizations related to BaseConfigurationRepository's entityViewDefinitions (e.g., custom entity definitions such as SvK ), please update them according to the changes in this card, following the same approach used for the custom tabs and tab functions | [Card](https://trello.com/c/lkMwkFgl) |
| If GetLogframe2IndicatorTrackers is customized in the client project | ﷟HYPERLINK " Indicator tracker, Export to Excel, Include fields configured in the popup on Current sprint - Core \| Trello Indicator tracker, Export to Excel, Include fields configu | During Upgrade | Client Dev | ﷟HYPERLINK " Indicator tracker, Export to Excel, Include fields configured in the popup on Current sprint - Core \| Trello Indicator tracker, Export to Excel, Include fields configured in the popup on Current sprint - Core \| Trello<br>If GetLogframe2IndicatorTrackers is customized in the client project, adapt this card's PR changes to it. | [Card](https://trello.com/c/oXjpiYoC/5540-mlogframe2-indicator-tracker-export-to-excel-include-fields-configured-in-the-popup) |
| if client not used this Member role in any entity type added | ﷟HYPERLINK " Cleanup Role/field mappings in core script on Current sprint - Core \| Trello Cleanup Role/field mappings in core script on Current sprint - Core \| Trello | During Upgrade | Client Dev | ﷟HYPERLINK " Cleanup Role/field mappings in core script on Current sprint - Core \| Trello Cleanup Role/field mappings in core script on Current sprint - Core \| Trello<br>[For upgraded person] After cleanup role Member connected with Field Definition Id, we will add Role Member with Field Definition Id is<br>Null for what we removed, so if client not used this Member role in any entity type added , please create script to remove to override seed data from Core<br>(CoreRoleEntityDefinitions Id from 50 -> 58) | [Card](https://trello.com/c/nf6rp5uP/5549-s-cleanup-role-field-mappings-in-core-script) |
| If GetLogframe2IndicatorTrackers is customized in the client project | ﷟HYPERLINK " Generate fields by SortOrder instead of Label on Current sprint - Core \| Trello Generate fields by SortOrder instead of Label on Current sprint - Core \| Trello | During Upgrade | Client Dev | ﷟HYPERLINK " [Logframe2] Generate fields by SortOrder instead of Label on Current sprint - Core \| Trello [Logframe2] Generate fields by SortOrder instead of Label on Current sprint - Core \| Trello<br>If GetLogframe2IndicatorTrackers is customized in the client project, adapt this card's PR changes to it. | [Card](https://trello.com/c/ZaYUjvzM/5544-s-logframe2-generate-fields-by-sortorder-instead-of-label) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Review release note | During Upgrade | Client Dev | Review release note | [Card](https://trello.com/c/IRyw8QbW/5553-s-outlook-addin-permissions-are-too-high) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | < bt : Url -id="functionFile" Defaultvalue="https: //localhost:4200/#/outlook-addin"/> | During Upgrade | Client Dev | .< bt : Url -id="functionFile" Defaultvalue="https: //localhost:4200/#/outlook-addin"/><br>.< bt : Url -id="messageReadTaskPaneUrl" Defaultvalue="https: //localhost:4200/#/outlook-addin"/><br>.< bt : Url id="functionFile" Defaultvalue="<br>.< bt : Url id="messageReadTaskPaneUrl" Defaultvalue="https : //localhost :4200/outlook-addin"/> " /> | [Ref](https://localhost:4200/outlook-addin) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | Tell your PM: the manifest file of Outlook add-in should be updated and then reinstall it (see the changes, removing the hash from URLs) | No deterministic note-to-file match. Release diff covers 1221 files (backend: 740, frontend: 95, shared: 386); representative changes: M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/Logframes2Controller.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/WorkflowCycleController.cs`, M `ngo-api-core/NGO/NGO.Core.API/packages.lock.json`, M `ngo-api-core/NGO/NGO.Core.Common/Auth/AzureOpenAIProvider.cs`, M `ngo-api-core/NGO/NGO.Core.Common/Auth/GraphContextProvider.cs`, M `ngo-api-core/NGO/NGO.Core.Common/Configurations/CoreAppSettings.cs`. | No explicit client action was stated in the release source. | - |
| Shared / Cross-track | This setting can be updated to allow additional iframe/frame sources as needed. Multiple sources should be separated by a semicolon ( ; ) | No deterministic note-to-file match. Release diff covers 1221 files (backend: 740, frontend: 95, shared: 386); representative changes: M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/Logframes2Controller.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/WorkflowCycleController.cs`, M `ngo-api-core/NGO/NGO.Core.API/packages.lock.json`, M `ngo-api-core/NGO/NGO.Core.Common/Auth/AzureOpenAIProvider.cs`, M `ngo-api-core/NGO/NGO.Core.Common/Auth/GraphContextProvider.cs`, M `ngo-api-core/NGO/NGO.Core.Common/Configurations/CoreAppSettings.cs`. | No explicit client action was stated in the release source. | - |
| Backend | ﷟HYPERLINK " Update config of Core Analyse tables on Current sprint - Core \| Trello Update config of Core Analyse tables on Current sprint - Core \| Trello | Matched key changes: M `ngo-api-core/NGO/NGO.Core.Repositories/BaseConfigurationRepository.cs`, M `ngo-api-core/NGO/NGO.Core.Repositories/ConfigurationRepository.cs` | If there are any customizations related to BaseConfigurationRepository's entityViewDefinitions (e ﷟HYPERLINK " Update config of Core Analyse tables on Current sprint - Core \| Trello Update config of Core Analyse tables on Current sprint - Core \| Trello | [Card](https://trello.com/c/lkMwkFgl) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

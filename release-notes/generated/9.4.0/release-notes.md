# NGO Core 9.4.0 Release Notes

- **Version:** 9.4.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/9.4.0.json)
- **Quick Summary:** Mandatory Actions **1** | Conditional Actions **2** | New Features **3** | Bug Fixes **0** | Needs Review **4**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Run NGO.Core.Tools.CompareSiteCount. See details in file README.md of PR ﷟HYPERLINK " request 39207: Update README of tool NGO.Core.Tools.CompareSiteCount - Repos request 39207: Up | After Deploy | Deployer | - [For deployment person] [After deployment] Run NGO.Core.Tools.CompareSiteCount. See details in file README.md of PR ﷟HYPERLINK " request 39207: Update README of tool NGO.Core.Tools.CompareSiteCount - Repos request 39207: Update README of tool NGO.Core.Tools.CompareSiteCount - Repos | [PR](https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/39207)<br>[Ref](http://Pull) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| For clients in the Support & Maintenance phase, this will be handled as regular maintenance under this card | For clients in the Support & Maintenance phase, this will be handled as regular maintenance under this card. ﷟HYPERLINK " | During Upgrade | Client Dev | - For clients in the Support & Maintenance phase, this will be handled as regular maintenance under this card. ﷟HYPERLINK " | [Card](https://trello.com/c/pyza1qZl/) |
| check if they should be updated to ] instead | Idea Task - Reassign: sent emails should be more precise on Current sprint - Core \| Trello | During Upgrade | Client Dev | [4][S] Idea Task - Reassign: sent emails should be more precise on Current sprint - Core \| Trello<br>If client projects use custom email templates with tokens like [[TaskFlow.Submitter.Name]] , [[FundingIdea.CreatedBy.Name]] , or [[Idea.CreatedBy.Name]] , please check if they should be updated to [[TaskActorName]] instead.<br>Scrip to check: select * from CoreEmailTemplateContents where Body like '%TaskFlow.Submitter.Name%' or Body like '%FundingIdea.CreatedBy.Name%' or Body like '%Idea.CreatedBy.Name%' and TemplateId > 49999 (Replace TemplateId by custom Id in client, default is 50000 so TemplateId > 49999) | [Card](https://trello.com/c/9s2Srmf1/5508-4s-idea-task-reassign-sent-emails-should-be-more-precise) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | If you want to show Inactive user from UserOptions, put this flag to CoreAnalyzeColumns' FieldCharacteristic | During Upgrade | Client Dev | If you want to show Inactive user from UserOptions, put this flag to CoreAnalyzeColumns' FieldCharacteristic<br>FieldCharacteristic . isAlwaysShowInactive = true | [Card](https://trello.com/c/WP3RDffZ/5605-analyse-and-inactive-users) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | ﷟HYPERLINK " Import tool and site collections on Current sprint - Core \| Trello Import tool and site collections on Current sprint - Core \| Trello | During Upgrade | Client Dev | ﷟HYPERLINK " Import tool and site collections on Current sprint - Core \| Trello Import tool and site collections on Current sprint - Core \| Trello<br>[2026-Nov-04] | [Card](https://trello.com/c/ldhZv7CQ/5659-m-import-tool-and-site-collections) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Review release note | During Upgrade | Client Dev | Review release note | [Card](https://trello.com/c/dYcw3tZP/5652-s-analyse-support-more-field-characteristic-for-configoptions) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | If you want to show Inactive user from ConfigOptionsMapper, put this flag to CoreAnalyzeColumns' FieldCharacteristic | During Upgrade | Client Dev | - If you want to show Inactive user from ConfigOptionsMapper, put this flag to CoreAnalyzeColumns' FieldCharacteristic<br>FieldCharacteristic . isAlwaysShowInactive = true | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | For new and implementation clients, please follow the note below: | No deterministic note-to-file match. Release diff covers 178 files (backend: 93, frontend: 52, shared: 33); representative changes: M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/ConfigurationController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/FinanceMonitoringController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/Logframes2Controller.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/MonitoringController.cs`, M `ngo-api-core/NGO/NGO.Core.Common/Constants/DbConfigurationKeys.cs`, M `ngo-api-core/NGO/NGO.Core.Common/Constants/SharePoint.cs`. | No explicit client action was stated in the release source. | - |
| Backend | [For deployment person] [After deployment] Run NGO.Core.Tools.CompareSiteCount. See details in file README.md of PR ﷟HYPERLINK " request 39207: Update README of tool NGO.Core.Tools.CompareSiteCount - Repos request 39207: Update README of tool NGO.Core.Tools.CompareSiteCount - Repos | Matched key changes: A `ngo-api-core/NGO/NGO.Core.Tools.CompareSiteCount/NGO.Core.Tools.CompareSiteCount.csproj`, A `ngo-api-core/NGO/NGO.Core.Tools.CompareSiteCount/README.md` | Action applies during the upgrade. Run NGO.Core.Tools.CompareSiteCount. See details in file README.md of PR ﷟HYPERLINK " request 39207: Update README of tool NGO.Core.Tools.CompareSiteCount - Repos request 39207: Up | [PR](https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/39207)<br>[Ref](http://Pull) |
| Backend | If you want to enable Readonly options of ConfigOptionsMapper, put this flag to CoreAnalyzeColumns' FieldCharacteristic | Matched key changes: M `ngo-api-core/NGO/NGO.Core.Repositories/Mapping/OptionsMapper/ConfigOptionsMapper.cs` | No explicit client action was stated in the release source. | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

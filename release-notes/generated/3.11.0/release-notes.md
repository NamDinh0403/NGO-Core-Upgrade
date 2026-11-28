# NGO Core 3.11.0 Release Notes

- **Version:** 3.11.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **8** | Conditional Actions **2** | New Features **0** | Bug Fixes **2** | Needs Review **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Power BI Overview boxes should load data from the admin ui, not the box instance < | After Deploy | Deployer | Power BI Overview boxes should load data from the admin ui, not the box instance <<br>[ After deployment ]: 20221227_ClearPowerBIOverviewBoxInstances.sql | [Card](https://trello.com/c/H5tNGqhL) |
| DataFixes/20230105_RemoveAutoPopulateProjectEndDate.sql | After Deploy | Deployer | - [ After Deployment ] DataFixes/20230105_RemoveAutoPopulateProjectEndDate.sql | - |
| Check with PM if they really want to remove this characteristic : = '{ "autoFillDateFieldRefId": "460", "autoFillDateMonthVal": "6" } ' is using for auto populate end date after 6 | During Upgrade | Client Dev | - Check with PM if they really want to remove this characteristic : [Characteristic] = '{ "autoFillDateFieldRefId": "460", "autoFillDateMonthVal": "6" } ' is using for auto populate end date after 6 months compared to start date when create a new project | - |
| DependentIds have been removed when updating item in Manage metadata | After Deploy | Deployer | [S] DependentIds have been removed when updating item in Manage metadata<br>[After deployment]: 20221227_UpdateDependentListId.sql | [Card](https://trello.com/c/PUGiwFy2) |
| The message modal is display wrong | After Deploy | Deployer | [Bank Account] The message modal is display wrong<br>[After deployment]: 20230104_Bank_account_name_in_message.sql | [Card](https://trello.com/c/RXUm6Nlt) |
| Skip Page when Save Query | After Deploy | Deployer | [T] [Analyses] Skip Page when Save Query<br>[After deployment]: 20230105_Analyse_UpdateSaveQuery.sql | [Card](https://trello.com/c/EqXZ0KHb) |
| Log/Log2 has an empty list of default fields in the dropdown | After Deploy | Deployer | [Admin UI / OverviewBox] Log/Log2 has an empty list of default fields in the dropdown<br>[After deployment]: 20220116_UpdateLogBoxSettings.sql | [Card](https://trello.com/c/ktwBiLZD) |
| Missing data for contact fields | After Deploy | Deployer | [Analyse] Missing data for contact fields<br>[After deployment]: 20230113_UpdateContactSqlMapping.sql | [Card](https://trello.com/c/JwVSXz5l) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Project End date auto populating with no ask to do this | During Upgrade | Client Dev | [T] Project End date auto populating with no ask to do this | [Card](https://trello.com/c/KxtrpdNm) |
| Optional ] DataFixes/20230106_RemoveAutoPopulateProjectEndDateFromFieldLocation.sql | DataFixes/20230106_RemoveAutoPopulateProjectEndDateFromFieldLocation.sql | After Deploy | Deployer | - [ After Deployment - Optional ] DataFixes/20230106_RemoveAutoPopulateProjectEndDateFromFieldLocation.sql | - |
| Optional] Check before update characteristics | Check before update characteristics: 20230113_UpdateListFilterSettings_Characteristics.sql | After Deploy | Deployer | [S] Characteristic of list filter field is not applied, always get from Field instance :<br>[After Deployment - Optional] Check before update characteristics: 20230113_UpdateListFilterSettings_Characteristics.sql | [Card](https://trello.com/c/oHn10pRV) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Bank Account | [Bank Account] The message modal is display wrong | No deterministic git-diff evidence was supplied for this note. | The message modal is display wrong | [Card](https://trello.com/c/RXUm6Nlt) |
| Analyse | [Analyse] Missing data for contact fields | No deterministic git-diff evidence was supplied for this note. | Missing data for contact fields | [Card](https://trello.com/c/JwVSXz5l) |

# NGO Core 3.0.0 Release Notes

- **Version:** 3.0.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **6** | Conditional Actions **1** | New Features **0** | Bug Fixes **0** | Needs Review **2**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Logframe Multiple-line fields in View form | After Deploy | Deployer | Logframe Multiple-line fields in View form<br>[After deployment]: 20220307_Logframe_multiple_line_fields_in_view_form.sql | - |
| Migrate permission: 20220504_UpdateTaskFinalisationPermission.sql | During Upgrade | Deployer | Payment - Upload receipt form<br>Read note Payment Upload Receipt in Config Wiki<br>Example script file: 20220310_Payment_reciept.sql<br>Migrate permission: 20220504_UpdateTaskFinalisationPermission.sql | [Card](https://trello.com/c/CyPrMKtI) |
| Add status column name to Start page - My task form | During Upgrade | Deployer | Add status column name to Start page - My task form<br>DataFixes/20220311_AddStatusColumnNameToMyTask.sql | - |
| Add list setting for Startpage Mytask box | After Deploy | Deployer | Add list setting for Startpage Mytask box<br>After deployment: update CoreOverviewBoxInstances set CoreListSettingId = 84 where OverviewBoxDefinitionId = 7 | - |
| (Before deployment) DataFixes/20220322_Logframe_Config_IndicatorType_For_CustomIndicator.sql | Before Deploy | Deployer | - (Before deployment) DataFixes/20220322_Logframe_Config_IndicatorType_For_CustomIndicator.sql | - |
| UPDATE CoreFieldInstanceLocations | During Upgrade | Client Dev | UPDATE CoreFieldInstanceLocations<br>SET Characteristic = '{ "customGroupedBy": "2072", "hideLabel": true, "autoCopyValueFromDependentProp": true, "autoCopyValueFromDependentFieldName": "customGlobalIndicatorLinks" } ', VisibilityDependencyId = NULL, ReadOnlyDependencyId = 54<br>WHERE Id = 2640 | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| If client project does use 'linked global indicator' field for custom indicator | If client project does use 'linked global indicator' field for custom indicator , should use below script (adding to Custom Script in folder DatabaseSeed) to update correct values | During Upgrade | Client Dev | - If client project does use 'linked global indicator' field for custom indicator , should use below script (adding to Custom Script in folder DatabaseSeed) to update correct values for field config: | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Links box appears blank when you first open the page | During Upgrade | Client Dev | Links box appears blank when you first open the page<br>Permission matrix of each entity, ensure user has Edit permission in Link box<br>(Previous version, it uses View permission for Edit link in box, and toolbox item is using permission of Edit entity) | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Logframe, Breakdown form validation, if total is read only the field in the main form should be read only | During Upgrade | Client Dev | Logframe, Breakdown form validation, if total is read only the field in the main form should be read only | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

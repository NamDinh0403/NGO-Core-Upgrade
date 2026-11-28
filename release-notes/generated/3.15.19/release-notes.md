# NGO Core 3.15.19 Release Notes

- **Version:** 3.15.19
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **4** | Conditional Actions **4** | New Features **0** | Bug Fixes **1** | Needs Review **3**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Check note for configuration in this card: | During Upgrade | Client Dev | 3.15.0 / 4.0<br>[S] Rating field in browse view doesn't include color property. As a result, the color can't be showed<br>Check note for configuration in this card: | [Card](https://trello.com/c/ToiK688Y) |
| Restructure email template data model < > | After Deploy | Deployer | [L] Restructure email template data model < ><br>[After deployment] Clean the email template field: delete from CoreFieldInstanceLocations where Id = 4803 | [Card](https://trello.com/c/TMEVMZOC) |
| Update CoreConfigurations/RestrictedGlobalRolesInViews with additional restricted roles on '99 Approvals' folder, write script like example (i.e. keep the existing config value in | During Upgrade | Client Dev | - Update CoreConfigurations/RestrictedGlobalRolesInViews with additional restricted roles on '99 Approvals' folder, write script like example (i.e. keep the existing config value in your system env and then add new config like the bold text, for example, 100080 is a role ID, 113 is Signed off folder): | - |
| Add <add key="MessageQueueSize" value="{ number} " /> in app.settings where 1 <= number <= 32 in order to control number of concurrent message processed by web job | During Upgrade | Client Dev | [S] Permission web job: when ensure site permission, many messages used to update permission for each entity are sent, and many items failed: ( )<br>Add <add key="MessageQueueSize" value="{ number} " /> in app.settings where 1 <= number <= 32 in order to control number of concurrent message processed by web job | [Card](https://trello.com/c/UuJ2FPm4) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| check if the client has a custom table based on table CoreEmailTemplates, in case yes | Noted : Please check if the client has a custom table based on table CoreEmailTemplates, in case yes, please check the script after that correct this script before run the deploy.p | Before Deploy | Client Dev | Noted : Please check if the client has a custom table based on table CoreEmailTemplates, in case yes, please check the script [ BeforeDeployment/20230417_SplitCoreEmailTemplateData] after that correct this script before run the deploy.ps1, because in this update, columns Subject, Body, LanguageId of CoreEmailTemplates will be moved to CoreEmailTemplateContents | - |
| Limit document permissions to confidential pages (CoreEntity.IsRestricted = true) | Limit document permissions to confidential pages (CoreEntity.IsRestricted = true) | During Upgrade | Client Dev | Limit document permissions to confidential pages (CoreEntity.IsRestricted = true)<br>< > | [Card](https://trello.com/c/l5l7Fuu0) |
| - If any custom entity roles , e.g. 'Project Partner Member'/'Project Partner Responsible'/'Organization Partner Member'/'Organization Partner Member', etc. If Yes, read step 2. | If any custom entity roles , e.g. 'Project Partner Member'/'Project Partner Responsible'/'Organization Partner Member'/'Organization Partner Member', etc. If Yes, read step 2. | During Upgrade | Client Dev | - If any custom entity roles , e.g. 'Project Partner Member'/'Project Partner Responsible'/'Organization Partner Member'/'Organization Partner Member', etc. If Yes, read step 2. | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Please check yourself or ask PM if those found roles - which one can see the '99 Approvals' folder. If there are a few custom entity roles that prevent from viewing '99 Approvals' | During Upgrade | Client Dev | - Please check yourself or ask PM if those found roles - which one can see the '99 Approvals' folder. If there are a few custom entity roles that prevent from viewing '99 Approvals' folder, read step 3. | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | } , { "roles": , tabFunctionId: 113} ] | During Upgrade | Client Dev | [{ "roles": [{ "id": 11} ]} , { "roles":[{ "id":100080} ], tabFunctionId: 113} ] | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | / 4.0 | During Upgrade | Client Dev | 3.15.0 / 4.0<br>For core upgrading person: looks at CoreRoles table and does as following steps | - |
| if the client has other condition | Run script: Datafixes/ 20231020_MigrationConditionToConfigurationForRollupRelatedTab | After Deploy | Deployer | [S][Finance/ Monitoring] Disappear when config rollup data from<br>[After Deployment] Run script: Datafixes/ 20231020_MigrationConditionToConfigurationForRollupRelatedTab<br>Note: Please re-check the script and update @CONFIGURATION according to the client customization if have, I.e: [{"name": "typeId", "value": [1]}] is the roll up conditions for entity type with id = 1, if the client has other condition, you should run command: SELECT * FROM CoreEntityTabs WHERE Conditions LIKE '%typeId%' to check and update the according script | [Card](https://trello.com/c/VKC4QRPq/3686-sfinance-monitoring-disappear-when-config-rollup-data-from) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Backend | [S] Permission web job: when ensure site permission, many messages used to update permission for each entity are sent, and many items failed: ( ) | No deterministic git-diff evidence was supplied for this note. | Add <add key="MessageQueueSize" value="{ number} " /> in app.settings where 1 <= number <= 32 in order to control number of concurrent message processed by web job | [Card](https://trello.com/c/UuJ2FPm4) |

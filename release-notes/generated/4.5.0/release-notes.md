# NGO Core 4.5.0 Release Notes

- **Version:** 4.5.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **3** | Conditional Actions **1** | New Features **1** | Bug Fixes **0**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| update appsettings.json in deployment project related to deployment section, see sample image below | During Upgrade | Client Dev | [For upgrading person] update appsettings.json in deployment project related to deployment section, see sample image below | [Card](https://trello.com/c/PvNYbKbp/3684-m-new-structure-of-db-deployment) |
| Update release pipeline > Variable: | Before Deploy | Deployer | [Before Deployment] Update release pipeline > Variable:<br>Rename Core:Deployment:DataFixesAfterFolders:0 to Core:Deployment:DataFixesAfterFolders:Core (if it is core script)<br>Rename Core:Deployment:DataFixesAfterFolders:1 to Core:Deployment:DataFixesAfterFolders:Custom (if it is client script)<br>Rename Core:Deployment:DataFixesBeforeFolders:0 to Core:Deployment:DataFixesBeforeFolders:Core (if it is core script)<br>Rename Core:Deployment:DataFixesBeforeFolders:1 to Core:Deployment:DataFixesBeforeFolders:Custom (if it is client script)<br>Note: the folder path configured in release pipeline should have single '\'.<br>Please verify the deployment logs if those above steps running properly. | - |
| Task in the log entry to open the task view form. Same for agreements | After Deploy | Client Dev | [M] Task in the log entry to open the task view form. Same for agreements<br>[Upgrade] When upgrading, create a custom AfterDeployment script to update FieldInstance Characteristic to match setup of tabs that have related tasks, see card for details. | [Card](https://trello.com/c/fCGMjudX) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| if the client has other condition | Run script (read the below Note before manual run): Datafixes/ 20231020_MigrationConditionToConfigurationForRollupRelatedTab | After Deploy | Deployer | [S][Finance/ Monitoring] Disappear when config rollup data from<br>[After Deployment] Run script (read the below Note before manual run): Datafixes/ 20231020_MigrationConditionToConfigurationForRollupRelatedTab<br>Note: Please re-check the script and update @CONFIGURATION according to the client customization if have, I.e: [{"name": "typeId", "value": [1]}] is the roll up conditions for entity type with id = 1, if the client has other condition, you should run command: SELECT * FROM CoreEntityTabs WHERE Conditions LIKE '%typeId%' to check and update the according script | [Card](https://trello.com/c/VKC4QRPq/3686-sfinance-monitoring-disappear-when-config-rollup-data-from) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| For upgrading person | [For upgrading person] update appsettings.json in deployment project related to deployment section, see sample image below | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. update appsettings.json in deployment project related to deployment section, see sample image below | [Card](https://trello.com/c/PvNYbKbp/3684-m-new-structure-of-db-deployment) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

# NGO Core 4.4.1 Release Notes

- **Version:** 4.4.1
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **0** | Conditional Actions **1** | New Features **0** | Bug Fixes **0**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| if the client has other condition | Run script: Datafixes/ 20231020_MigrationConditionToConfigurationForRollupRelatedTab | After Deploy | Deployer | [S][Finance/ Monitoring] Disappear when config rollup data from<br>[After Deployment] Run script: Datafixes/ 20231020_MigrationConditionToConfigurationForRollupRelatedTab<br>Note: Please re-check the script and update @CONFIGURATION according to the client customization if have, I.e: [{"name": "typeId", "value": [1]}] is the roll up conditions for entity type with id = 1, if the client has other condition, you should run command: SELECT * FROM CoreEntityTabs WHERE Conditions LIKE '%typeId%' to check and update the according script | [Card](https://trello.com/c/VKC4QRPq/3686-sfinance-monitoring-disappear-when-config-rollup-data-from) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

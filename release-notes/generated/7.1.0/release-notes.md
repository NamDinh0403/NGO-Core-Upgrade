# NGO Core 7.1.0 Release Notes

- **Version:** 7.1.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/7.1.0.json)
- **Quick Summary:** Mandatory Actions **3** | Conditional Actions **2** | New Features **1** | Bug Fixes **0** | Needs Review **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Update appsettings.json Files: | During Upgrade | Client Dev | - Update appsettings.json Files: | - |
| Update Azure Portal: | During Upgrade | Client Dev | - Update Azure Portal: | - |
| Add a variable with the key Core: MaxEmailAttachmentFileSizeMb and the value can be obtained from the appsettings.json . | During Upgrade | Client Dev | - Add a variable with the key Core: MaxEmailAttachmentFileSizeMb and the value can be obtained from the appsettings.json . | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| if client using Custom global objective field | Run DataFix/ 20250319_InactiveGlobalIndicatorOfCustomGlobalObjectiveField.sql if client using Custom global objective field | Before Deploy | Deployer | [S] Breakdown template populates incorrectly for new custom indicator<br>[Before Deployment] Run DataFix/ 20250319_InactiveGlobalIndicatorOfCustomGlobalObjectiveField.sql if client using Custom global objective field | [Card](https://trello.com/c/G3oJ247Y) |
| - Add a configuration with the key MaxEmailAttachmentFileSizeMb for appsetting.json of webjob and api . This config defines the maximum size of file will be sent in email of IATI export. Depending on the customer's requirements (if any), if there are no requir | Add a configuration with the key MaxEmailAttachmentFileSizeMb for appsetting.json of webjob and api . This config defines the maximum size of file will be sent in email of IATI exp | During Upgrade | Client Dev | - Add a configuration with the key MaxEmailAttachmentFileSizeMb for appsetting.json of webjob and api . This config defines the maximum size of file will be sent in email of IATI export. Depending on the customer's requirements (if any), if there are no requirements, the default value will be 20. | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | IATI Feedback 5 on Current sprint - Core \| Trello | During Upgrade | Client Dev | [M] IATI Feedback 5 on Current sprint - Core \| Trello | [Card](https://trello.com/c/Iaf6xZRx/4900-m-iati-feedback-5) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Backend | [S] Breakdown template populates incorrectly for new custom indicator | Matched key changes: A `ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/20250319_InactiveGlobalIndicatorOfCustomGlobalObjectiveField.sql` | if client using Custom global objective field Run DataFix/ 20250319_InactiveGlobalIndicatorOfCustomGlobalObjectiveField.sql if client using Custom global objective field | [Card](https://trello.com/c/G3oJ247Y) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

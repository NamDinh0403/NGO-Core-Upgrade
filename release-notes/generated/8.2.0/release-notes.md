# NGO Core 8.2.0 Release Notes

- **Version:** 8.2.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/8.2.0.json)
- **Quick Summary:** Mandatory Actions **2** | Conditional Actions **0** | New Features **0** | Bug Fixes **0**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| update appsetting.json then run tool NGO.Core.Tools.SetAzureAdIdForUser to set AzureAdId for CoreUsers. After run tool, make sure all row in AzureAdId in CoreUsers have value (we w | During Upgrade | Deployer | [S]ADSync webjob: Exception when deleted user has no UserPrincipleName on Current sprint - Core \| Trello<br>[For deployment person] update appsetting.json then run tool NGO.Core.Tools.SetAzureAdIdForUser to set AzureAdId for CoreUsers. After run tool, make sure all row in AzureAdId in CoreUsers have value (we will missing deleted User in Azure If such user exists, manually update AzureAdId for that user | [Card](https://trello.com/c/TxcBtgjh/5263-sadsync-webjob-exception-when-deleted-user-has-no-userprinciplename)<br>[Ref](https://portal.azure.com/#view/Microsoft_AAD_UsersAndTenants/UserManagementMenuBlade/~/DeletedUsers) |
| Read and manual run 20250917_DisableLogframe1.sql | During Upgrade | Deployer | [If using Logframe2] Read and manual run 20250917_DisableLogframe1.sql | [Card](https://trello.com/c/HC8irSiM/5111-logframe-upgrade-migration-scripts-when-move-to-logframe-2) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| None identified. | - | - | - | - | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

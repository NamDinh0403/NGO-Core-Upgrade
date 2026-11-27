# NGO Core 9.5.0 Release Notes

- **Version:** 9.5.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/9.5.0.json)
- **Quick Summary:** Mandatory Actions **1** | Conditional Actions **1** | New Features **1** | Bug Fixes **1** | Needs Review **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Check in client code scripts and remove resource string keys with '_in_email' suffix | Before Deploy | Deployer | [Resource String/ Email] Failed to get resource string value for email title when title has configured [[TabDefinitionName]] on Current sprint - Core \| Trello<br>[Before Deployment] Check in client code scripts and remove resource string keys with '_in_email' suffix | [Card](https://trello.com/c/xBxUjtSz/4394-resource-string-email-failed-to-get-resource-string-value-for-email-title-when-title-has-configured-tabdefinitionname) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| check if release pipeline / deployment appsettings.json having Core | Update setting on library Document on rootsite | During Upgrade | Deployer | [S] Update setting on library Document on rootsite<br>[For deployment person] check if release pipeline / deployment appsettings.json having Core: Deployment:DeploySPFieldsAndCTypesEnabled false -> if so please add Core: Deployment:DeploySPFieldsAndCTypesEnabled true to the release pipeline, and turn the setting back when the deployment done. | [Card](https://trello.com/c/sUcxhgAI/5692-s-update-setting-on-library-document-on-rootsite) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Resolve ingestion uncertainty for 9.5.0 | During Upgrade | Client Dev | Resolve ingestion uncertainty for 9.5.0<br>222 unresolved candidate item(s) require review. The complete list is retained in the structured report metadata and source candidate. Examples: 9.5.0 [backend] ngo-api-core/NGO/NGO.Core.API/BaseControllers/FinancialTransactionController.cs: observed in diff, no matching release-notes card \| 9.5.0 [backend] ngo-api-core/NGO/NGO.Core.API/Controllers/FinancialTransactionController.cs: observed in diff, no matching release-notes card \| 9.5.0 [backend] ngo-api-core/NGO/NGO.Core.Common/Constants/DbConfigurationKeys.cs: observed in diff, no matching release-notes card | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Backend | [S] Update setting on library Document on rootsite | Matched key changes: M `ngo-api-core/NGO/NGO/appsettings.json` | check if release pipeline / deployment appsettings.json having Core Update setting on library Document on rootsite | [Card](https://trello.com/c/sUcxhgAI/5692-s-update-setting-on-library-document-on-rootsite) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Resource String/ Email | [Resource String/ Email] Failed to get resource string value for email title when title has configured [[TabDefinitionName]] on Current sprint - Core \| Trello | No deterministic note-to-file match. Release diff covers 221 files (backend: 114, frontend: 47, shared: 60); representative changes: M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/FinancialTransactionController.cs`, M `ngo-api-core/NGO/NGO.Core.API/Controllers/FinancialTransactionController.cs`, M `ngo-api-core/NGO/NGO.Core.API/packages.lock.json`, M `ngo-api-core/NGO/NGO.Core.Common/Constants/DbConfigurationKeys.cs`, M `ngo-api-core/NGO/NGO.Core.Common/Constants/FieldName.cs`, M `ngo-api-core/NGO/NGO.Core.Common/NGO.Core.Common.csproj`. | Check in client code scripts and remove resource string keys with '_in_email' suffix | [Card](https://trello.com/c/xBxUjtSz/4394-resource-string-email-failed-to-get-resource-string-value-for-email-title-when-title-has-configured-tabdefinitionname) |

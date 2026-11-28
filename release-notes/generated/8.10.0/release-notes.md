# NGO Core 8.10.0 Release Notes

- **Version:** 8.10.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/8.10.0.json)
- **Quick Summary:** Mandatory Actions **1** | Conditional Actions **0** | New Features **0** | Bug Fixes **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Check in client code scripts and remove resource string keys with '_in_email' suffix | Before Deploy | Deployer | [Resource String/ Email] Failed to get resource string value for email title when title has configured [[TabDefinitionName]] on Current sprint - Core \| Trello<br>[Before Deployment] Check in client code scripts and remove resource string keys with '_in_email' suffix | [Card](https://trello.com/c/xBxUjtSz/4394-resource-string-email-failed-to-get-resource-string-value-for-email-title-when-title-has-configured-tabdefinitionname) |

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
| Resource String/ Email | [Resource String/ Email] Failed to get resource string value for email title when title has configured [[TabDefinitionName]] on Current sprint - Core \| Trello | No deterministic note-to-file match. Release diff covers 89 files (backend: 63, frontend: 15, shared: 11); representative changes: M `ngo-api-core/NGO/NGO.Core.Common/Constants/DbConfigurationKeys.cs`, A `ngo-api-core/NGO/NGO.Core.Common/Utilities/PopulateValueConverter.cs`, A `ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20240808_RemoveInEmailResourceString.sql`, A `ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20261006_UpdateNameForFundingMultiYearBoxes.sql`, A `ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20261007_UpdateSqlDtoMappings.sql`, A `ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20261022_UpdateResourceStringMembership.sql`. | Check in client code scripts and remove resource string keys with '_in_email' suffix | [Card](https://trello.com/c/xBxUjtSz/4394-resource-string-email-failed-to-get-resource-string-value-for-email-title-when-title-has-configured-tabdefinitionname) |

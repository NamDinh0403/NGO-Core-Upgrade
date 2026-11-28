# NGO Core 5.10.0 Release Notes

- **Version:** 5.10.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/5.10.0.json)
- **Quick Summary:** Mandatory Actions **0** | Conditional Actions **0** | New Features **0** | Bug Fixes **1** | Needs Review **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Firstly, double check by running SQL select to verify if delta rows are generated unexpectedly. | During Upgrade | Client Dev | - Firstly, double check by running SQL select to verify if delta rows are generated unexpectedly. | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | Secondly, running SQL command in the description card to remove redundant delta row that should not be generated when the funding source is added as first time. | No deterministic note-to-file match. Release diff covers 131 files (backend: 57, frontend: 32, shared: 42); representative changes: M `.gitignore`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/PowerBIController.cs`, M `ngo-api-core/NGO/NGO.Core.API/packages.lock.json`, M `ngo-api-core/NGO/NGO.Core.Common/Constants/Paging.cs`, A `ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20240411_UpdateRSStringTaskCheckListAndCommentAnalyse.sql`, A `ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20241002_UpdateTabFunctionIdAndAddPermissionsForPowerBIOverviewboxes.sql`. | None stated in the release source. | - |

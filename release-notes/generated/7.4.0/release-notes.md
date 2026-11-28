# NGO Core 7.4.0 Release Notes

- **Version:** 7.4.0
- **Status:** DRAFT / IN PROGRESS
- **Release Date:** Not specified
- **Source Refs:** [Candidate record](ingest/knowledge/candidates/releases/7.4.0.json)
- **Quick Summary:** Mandatory Actions **0** | Conditional Actions **0** | New Features **0** | Bug Fixes **0** | Needs Review **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Review release 7.4.0 git-diff evidence | After Deploy | Deployer | Review release 7.4.0 git-diff evidence<br>The candidate contains 146 changed files (backend: 70, frontend: 29, shared: 47) but no matching release-note cards. Review the complete diff before classifying client actions: .gitignore, ngo-api-core/NGO/NGO.Core.API/BaseControllers/ExchangeRateController.cs, ngo-api-core/NGO/NGO.Core.API/BaseControllers/PartnerExpenditureReportingImportController.cs, ngo-api-core/NGO/NGO.Core.API/Controllers/ExchangeRateController.cs, ngo-api-core/NGO/NGO.Core.API/Controllers/PartnerExpenditureReportingImportController.cs, ngo-api-core/NGO/NGO.Core.API/packages.lock.json, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20251006_SyncIndicatorNoFromGlobalIndicator.sql, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20251007_AllowActivateBypassAndRepeatPhaseForWorkflow.sql, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20251021_RemoveRedundantFieldInstance.sql, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20251030_UpdateEntityTabName.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/01_01 InitFieldOptions_insert_only.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/01_02 InitFieldOptions.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_07 EntityTabs_insert_only.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_09 FieldInstances.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_10 FieldDependencyDefinitions.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_10 FieldInstanceLocations.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_10 FieldInstanceLocations_insert_only.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/05 InitUserPermission.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/08 InitAnalyse.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/CreateBrowseTVFs.sql | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

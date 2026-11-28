# NGO Core 6.7.0 Release Notes

- **Version:** 6.7.0
- **Status:** DRAFT / IN PROGRESS
- **Release Date:** Not specified
- **Source Refs:** [Candidate record](ingest/knowledge/candidates/releases/6.7.0.json)
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
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Review release 6.7.0 git-diff evidence | Before Deploy | Deployer | Review release 6.7.0 git-diff evidence<br>The candidate contains 133 changed files (backend: 56, frontend: 62, shared: 15) but no matching release-note cards. Review the complete diff before classifying client actions: ngo-api-core/NGO/NGO.Core.API/BaseControllers/AdminWebJobMonitoringController.cs, ngo-api-core/NGO/NGO.Core.Common/Auth/HttpClientSPWebRequestExecutor.cs, ngo-api-core/NGO/NGO.Core.Common/Constants/ErrorException.cs, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20231024_UpdateUniqueHeadingsForSomeFields.sql, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20250725_Agreement_UpdateSqlMapping.sql, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20250813_UpdateValidatePropertyNameForLink.sql, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20250826_FunctionDefinitionCleanup.sql, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/BeforeDeployment/20250805_MigratePlannedReceivedIncomeBox.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/02 InitResourceString_insert_only.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_01 FieldDefinitions.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_03 FunctionDefinitions.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_04 TabFunctions.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_09 FieldInstances.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_09 FieldInstances_insert_only.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_10 FieldInstanceLocations.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/08 InitAnalyse.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/Security/06_11 UpdateCacheWhenEntityRestrictionChange.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/StoreProcedures/SetUserRestrictedEntities.sql, ngo-api-core/NGO/NGO.Core.Deployment/NGO.Core.Deployment.csproj, ngo-api-core/NGO/NGO.Core.Model/Dto/Configuration/FieldCharacteristic.cs | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

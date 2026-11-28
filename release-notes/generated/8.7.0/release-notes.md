# NGO Core 8.7.0 Release Notes

- **Version:** 8.7.0
- **Status:** DRAFT / IN PROGRESS
- **Release Date:** Not specified
- **Source Refs:** [Candidate record](ingest/knowledge/candidates/releases/8.7.0.json)
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
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Review release 8.7.0 git-diff evidence | Before Deploy | Deployer | Review release 8.7.0 git-diff evidence<br>The candidate contains 1161 changed files (backend: 731, frontend: 81, shared: 349) but no matching release-note cards. Review the complete diff before classifying client actions: ngo-api-core/NGO/NGO.Core.API/BaseControllers/Logframes2Controller.cs, ngo-api-core/NGO/NGO.Core.Common/Auth/GraphContextProvider.cs, ngo-api-core/NGO/NGO.Core.Common/Extensions/ObjectExtensions.cs, ngo-api-core/NGO/NGO.Core.Deployment/CoreDeployment.cs, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20250701_InitIdeaMembers.sql, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/BeforeDeployment/20260616_RemoveUnusedLogframe2FieldDependency.sql, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/BeforeDeployment/20260813_RenameOldCoreChangesIndex.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/02 InitResourceString_insert_only.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_01 FieldDefinitions.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_09 FieldInstances.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_09 FieldInstances_insert_only.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_10 FieldDependencyDefinitions.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_10 FieldInstanceLocations.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/05 InitUserPermission.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/06 InitListConfiguration.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/08 InitAnalyse.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/StoreProcedures/GetLogframe2IndicatorTrackers.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/Views/03_14 AnalyseChange.sql, ngo-api-core/NGO/NGO.Core.Deployment/NGO.Core.Deployment.csproj, ngo-api-core/NGO/NGO.Core.Deployment/OutlookAddin/OutlookAddin-Template.xml | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

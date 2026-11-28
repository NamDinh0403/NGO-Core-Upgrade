# NGO Core 6.5.0 Release Notes

- **Version:** 6.5.0
- **Status:** DRAFT / IN PROGRESS
- **Release Date:** Not specified
- **Source Refs:** [Candidate record](ingest/knowledge/candidates/releases/6.5.0.json)
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
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Review release 6.5.0 git-diff evidence | After Deploy | Deployer | Review release 6.5.0 git-diff evidence<br>The candidate contains 91 changed files (backend: 46, frontend: 37, shared: 8) but no matching release-note cards. Review the complete diff before classifying client actions: azure-pipeline-prerelease-pack.yml, ngo-api-core/NGO/NGO.Core.API/BaseControllers/LogframeGlobalController.cs, ngo-api-core/NGO/NGO.Core.Common/Constants/DbConfigurationKeys.cs, ngo-api-core/NGO/NGO.Core.Common/Extensions/MiscExtensions.cs, ngo-api-core/NGO/NGO.Core.Common/Utilities/HttpUtilities.cs, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20250224_FixProblemWithAmountFieldIncomeSchedule.sql, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20250612_FixExistingDataTaskFlows.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/02 InitResourceString_insert_only.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_01 FieldDefinitions.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_09 FieldInstances_insert_only.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_13 Configurations.sql, ngo-api-core/NGO/NGO.Core.Model/Domain/Payment.cs, ngo-api-core/NGO/NGO.Core.Model/Dto/Configuration/BasicConfiguration.cs, ngo-api-core/NGO/NGO.Core.Model/Dto/Logframe/ExportLogframeObjective.cs, ngo-api-core/NGO/NGO.Core.Model/Dto/Logframe/LogframeSetting.cs, ngo-api-core/NGO/NGO.Core.Model/Dto/Payment.cs, ngo-api-core/NGO/NGO.Core.Model/Mapping/OverviewBoxDefinitionDtoMapper.cs, ngo-api-core/NGO/NGO.Core.Model/Mapping/SPDocumentMapper.cs, ngo-api-core/NGO/NGO.Core.Model/Mapping/TaskFlowDtoMapper.cs, ngo-api-core/NGO/NGO.Core.Repositories/CoreContext.cs | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

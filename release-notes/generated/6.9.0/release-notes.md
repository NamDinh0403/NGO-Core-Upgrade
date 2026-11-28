# NGO Core 6.9.0 Release Notes

- **Version:** 6.9.0
- **Status:** DRAFT / IN PROGRESS
- **Release Date:** Not specified
- **Source Refs:** [Candidate record](ingest/knowledge/candidates/releases/6.9.0.json)
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
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Review release 6.9.0 git-diff evidence | After Deploy | Deployer | Review release 6.9.0 git-diff evidence<br>The candidate contains 44 changed files (backend: 24, frontend: 8, shared: 12) but no matching release-note cards. Review the complete diff before classifying client actions: ngo-api-core/NGO/NGO.Core.API/BaseControllers/ExchangeRateController.cs, ngo-api-core/NGO/NGO.Core.API/Controllers/ExchangeRateController.cs, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20251007_AllowActivateBypassAndRepeatPhaseForWorkflow.sql, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20251021_RemoveRedundantFieldInstance.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/01_01 InitFieldOptions_insert_only.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/01_02 InitFieldOptions.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_07 EntityTabs_insert_only.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_09 FieldInstances.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_10 FieldInstanceLocations.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_10 FieldInstanceLocations_insert_only.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/05 InitUserPermission.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/08 InitAnalyse.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/CreateBrowseTVFs.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeedTestData/05 InitUserPermission_test_data.sql, ngo-api-core/NGO/NGO.Core.Deployment/NGO.Core.Deployment.csproj, ngo-api-core/NGO/NGO.Core.Infrastructure/CommonDIRegistrations.cs, ngo-api-core/NGO/NGO.Core.Model/Domain/Finance/FundingAllocation.cs, ngo-api-core/NGO/NGO.Core.Repositories/AnalyseConfigurationRepository.cs, ngo-api-core/NGO/NGO.Core.Repositories/BaseConfigurationRepository.cs, ngo-api-core/NGO/NGO.Core.Repositories/ExchangeRateRepository.cs | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

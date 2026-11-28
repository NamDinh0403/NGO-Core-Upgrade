# NGO Core 5.13.0 Release Notes

- **Version:** 5.13.0
- **Status:** DRAFT / IN PROGRESS
- **Release Date:** Not specified
- **Source Refs:** [Candidate record](ingest/knowledge/candidates/releases/5.13.0.json)
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
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Review release 5.13.0 git-diff evidence | After Deploy | Deployer | Review release 5.13.0 git-diff evidence<br>The candidate contains 165 changed files (backend: 82, frontend: 42, shared: 41) but no matching release-note cards. Review the complete diff before classifying client actions: .gitignore, azure-pipeline-master.yml, azure-pipeline-pack.yml, azure-pipelines.yml, ngo-api-core/NGO/NGO.Core.API/BaseControllers/ConfigurationController.cs, ngo-api-core/NGO/NGO.Core.API/BaseControllers/EntityController.cs, ngo-api-core/NGO/NGO.Core.API/BaseControllers/FundingIdeaController.cs, ngo-api-core/NGO/NGO.Core.API/BaseControllers/IdeasController.cs, ngo-api-core/NGO/NGO.Core.API/packages.lock.json, ngo-api-core/NGO/NGO.Core.Common/Constants/ErrorException.cs, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20230711_FixOverviewboxFieldInstancesLabel.sql, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20231205_UpdateRSForDeletion.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/02 InitResourceString_insert_only.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_09 FieldInstances.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_10 FieldInstanceLocations.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/08 InitAnalyse.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/StoreProcedures/GetLogframeIndicatorTrackers.sql, ngo-api-core/NGO/NGO.Core.Deployment/packages.lock.json, ngo-api-core/NGO/NGO.Core.HelpDocumentationDeployment/packages.lock.json, ngo-api-core/NGO/NGO.Core.Infrastructure/CommonDIRegistrations.cs | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

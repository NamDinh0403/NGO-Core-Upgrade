# NGO Core 6.6.0 Release Notes

- **Version:** 6.6.0
- **Status:** DRAFT / IN PROGRESS
- **Release Date:** Not specified
- **Source Refs:** [Candidate record](ingest/knowledge/candidates/releases/6.6.0.json)
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
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Review release 6.6.0 git-diff evidence | After Deploy | Deployer | Review release 6.6.0 git-diff evidence<br>The candidate contains 123 changed files (backend: 59, frontend: 51, shared: 13) but no matching release-note cards. Review the complete diff before classifying client actions: azure-pipeline-prerelease-pack.yml, ngo-api-core/NGO/NGO.Core.API/BaseControllers/BudgetController.cs, ngo-api-core/NGO/NGO.Core.API/BaseControllers/EntityMembersController.cs, ngo-api-core/NGO/NGO.Core.API/BaseControllers/TaskController.cs, ngo-api-core/NGO/NGO.Core.API/Controllers/BudgetController.cs, ngo-api-core/NGO/NGO.Core.Common/Constants/DbConfigurationKeys.cs, ngo-api-core/NGO/NGO.Core.Common/Constants/SharePoint.cs, ngo-api-core/NGO/NGO.Core.Common/Utilities/SPUtilities.cs, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/20250319_InactiveGlobalIndicatorOfCustomGlobalObjectiveField.sql, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20240126_RemoveDuplicateTextFieldInstances.sql, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20250624_FixExistingTaskApprovalSettings.sql, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20250721_ChangeTaskStatusFromEndedToReviewEnded.sql, ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20250721_SetupDefaultSPWebNameFormat.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/02 InitResourceString_insert_only.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_01 FieldDefinitions.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_09 FieldInstances.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_09 FieldInstances_insert_only.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/04_10 FieldInstanceLocations.sql, ngo-api-core/NGO/NGO.Core.Deployment/DatabaseSeed/InitTaskTemplate.sql, ngo-api-core/NGO/NGO.Core.Deployment/NGO.Core.Deployment.csproj | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

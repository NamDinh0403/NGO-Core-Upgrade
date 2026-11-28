# NGO Core 2.6.0 Release Notes

- **Version:** 2.6.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **4** | Conditional Actions **0** | New Features **1** | Bug Fixes **0** | Needs Review **10**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Add below attribute to ClientContext (C#) | During Upgrade | Client Dev | Restricted entities<br>Add below attribute to ClientContext (C#)<br>[DbConfigurationType(typeof(SessionContextConfiguration))] | - |
| Admin task batch | During Upgrade | Client Dev | Admin task batch<br>New web job NGO.WebJobs.TaskBatchManagement added. Add step to unzip to build-pipeline-api.yml: | - |
| Run the data fix script for core & all client projects: DataFixes\20201110_Financial_Period_Enddate.sql | During Upgrade | Deployer | Financial periods : update the end date of end period (should be the last date of month)<br>Run the data fix script for core & all client projects: DataFixes\20201110_Financial_Period_Enddate.sql | - |
| Add the following line to environment.ts and environment.prod.ts: | During Upgrade | Client Dev | Map<br>Add the following line to environment.ts and environment.prod.ts:<br>map: 'api/core/map', | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | For entity framework raw SQL query, all store procedures should be executed by adding the prefix ' exec ' (see below as example) | During Upgrade | Client Dev | For entity framework raw SQL query, all store procedures should be executed by adding the prefix ' exec ' (see below as example)<br>_context.Database.SqlQuery<int>("exec GetNextPaymentNo").SingleOrDefault(); ￼ | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | task: ExtractFiles@1 | During Upgrade | Client Dev | - task: ExtractFiles@1 | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | displayName: 'extract TaskBatchManagement' | During Upgrade | Client Dev | displayName: 'extract TaskBatchManagement' | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | inputs: | During Upgrade | Client Dev | inputs: | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | archiveFilePatterns: '**\NGO.Deployment\**\TaskBatchManagement.zip' | During Upgrade | Client Dev | archiveFilePatterns: '**\NGO.Deployment\**\TaskBatchManagement.zip' | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | destinationFolder: '$(Build.ArtifactStagingDirectory)/WebJobs/app_data/Jobs/Continuous/TaskBatchManagement' | During Upgrade | Client Dev | destinationFolder: '$(Build.ArtifactStagingDirectory)/WebJobs/app_data/Jobs/Continuous/TaskBatchManagement' | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | faChevronLeft, | During Upgrade | Client Dev | - faChevronLeft, | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | faChevronRight | During Upgrade | Client Dev | - faChevronRight | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Import the following in app.module.ts: | During Upgrade | Client Dev | Import the following in app.module.ts:<br>MapModule | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Client project: Import awesome font icons in app module | During Upgrade | Client Dev | Client project: Import awesome font icons in app module | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Frontend | Web configuration: add config setting "sp:TaskBatchQueue" to API Azure service when deploying to each environment. | No deterministic git-diff evidence was supplied for this note. | No explicit client action was stated in the release source. | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

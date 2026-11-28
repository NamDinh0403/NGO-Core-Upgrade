# NGO Core 2.11.0 Release Notes

- **Version:** 2.11.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **3** | Conditional Actions **0** | New Features **0** | Bug Fixes **0** | Needs Review **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Update Monitoring tab for Program | After Deploy | Deployer | Update Monitoring tab for Program<br>Run 20210309_Sprint7_EntityTabUpdates.sql in DataFixes folder<br>Update AddReviewMandatory<br>Run 20210310_UpdateAddReviewMandatory.sql in DataFixes folder<br>Migrate logframe links between global objective & global indicators to new table<br>Run 20210303_Logframe_Global_objective_indicator_link_migration.sql<br>Please note that table CoreLogframeGlobalObjectiveIndicators is now obsolete and any code referencing this needs to change.<br>Analyse > Beneficiaries - Include "Is latest published version" in the Beneficiaries list<br>[AfterDeployment] RUN DataFixes/20210318_UpdateBeneficiaryIsCurrentPublishedVersion.sql | - |
| Add the following line to environment.ts and environment.prod.ts: | During Upgrade | Client Dev | OverallEntityStatus<br>Add the following line to environment.ts and environment.prod.ts:<br>overallEntityStatus: 'api/core/entity' | - |
| Add the following line to environment.ts and environment.prod.ts:sni | During Upgrade | Client Dev | Logframe template:<br>Add the following line to environment.ts and environment.prod.ts:sni<br>logframeTemplates: 'api/core/logframeTemplates' | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Import OverallEntityStatusModule to app.module.ts | During Upgrade | Client Dev | Import OverallEntityStatusModule to app.module.ts | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

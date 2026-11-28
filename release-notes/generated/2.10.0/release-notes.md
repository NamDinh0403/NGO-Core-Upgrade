# NGO Core 2.10.0 Release Notes

- **Version:** 2.10.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **4** | Conditional Actions **0** | New Features **0** | Bug Fixes **0**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Run 20210102_Sprint5_Resource_string_update.sql in DataFixes folder to update resource strings | During Upgrade | Deployer | Admin resource strings<br>Run 20210102_Sprint5_Resource_string_update.sql in DataFixes folder to update resource strings | - |
| run this script 20210201_Update_Option_Mapper_Current_Phase.sql in folder DataFixes to update the option mapper of current phase field in project | During Upgrade | Deployer | Analyse current phase filtering<br>run this script 20210201_Update_Option_Mapper_Current_Phase.sql in folder DataFixes to update the option mapper of current phase field in project | - |
| Budget frequency | During Upgrade | Deployer | Budget frequency<br>Fixed script: run to update for existing budget 20210122_Budget_frequency_correction .sql | - |
| Log frame : sum of breakdown by selected categories | During Upgrade | Deployer | Log frame : sum of breakdown by selected categories<br>Fixed script: run this script to move all current to new table 20210205_Logframe_breakdown_sum_categories_migration .sql | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| None identified. | - | - | - | - | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

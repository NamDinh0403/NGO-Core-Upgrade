# NGO Core 3.2.0 Release Notes

- **Version:** 3.2.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **2** | Conditional Actions **0** | New Features **1** | Bug Fixes **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Beneficiaries Boxes - Add figures of EOP if existing | After Deploy | Deployer | Beneficiaries Boxes - Add figures of EOP if existing<br>[After deployment]: DataFixes/20220525_Beneficiaries_boxes_AddEOP_Info.sql | - |
| Logframe: Cannot report on Breakdown if no breakdown targets are set | During Upgrade | Deployer | Logframe: Cannot report on Breakdown if no breakdown targets are set<br>DataFixes/20220520_LogframeIndicatorTracker_AddMissingBreakdowns.sql | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| None identified. | - | - | - | - | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | Beneficiaries Boxes - Add figures of EOP if existing | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. Beneficiaries Boxes - Add figures of EOP if existing | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | Logframe: Cannot report on Breakdown if no breakdown targets are set | No deterministic git-diff evidence was supplied for this note. | Logframe: Cannot report on Breakdown if no breakdown targets are set | - |

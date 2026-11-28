# NGO Core 3.0.2 Release Notes

- **Version:** 3.0.2
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **2** | Conditional Actions **0** | New Features **1** | Bug Fixes **0**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Logframe Multiple-line fields in View form | During Upgrade | Deployer | Logframe Multiple-line fields in View form<br>DataFixes/20220428_Logframe_Rollup_multiple_line_fields_in_view_form.sql | - |
| Payment - Upload receipt form - update | After Deploy | Deployer | Payment - Upload receipt form - update<br>[After deployment]: DataFixes/ 20220504_UpdateTaskFinalisationPermission.sql | [Card](https://trello.com/c/CyPrMKtI) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| None identified. | - | - | - | - | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | Payment - Upload receipt form - update | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. Payment - Upload receipt form - update | [Card](https://trello.com/c/CyPrMKtI) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

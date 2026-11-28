# NGO Core 3.7.4 Release Notes

- **Version:** 3.7.4
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **1** | Conditional Actions **0** | New Features **0** | Bug Fixes **0**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| < | After Deploy | Deployer | <<br>Lost Beneficiary ReportingName in db after it's approved<br>We can re-use existing tool NGO.Core.Tools.PeriodNamesPopulation to update reporting's name for Beneficiary<br>For Live only - Manually fix existing data for beneficiary reporting periods<br>[After deployment]: DataFixes/20221201_QueryAndManuallyCorrectBeneficiaryReportings.sql | [Card](https://trello.com/c/wHtaamEW/2896-beneficiaries-should-display-the-next-period-not-report-yet-when-open-the-actual-form) |

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

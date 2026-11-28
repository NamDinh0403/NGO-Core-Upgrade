# NGO Core 3.9.5 Release Notes

- **Version:** 3.9.5
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
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
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Card: Refactor PDF generation and Task extension points < | During Upgrade | Client Dev | Card: Refactor PDF generation and Task extension points <<br>We change the way to implement BaseTaskActionService and BaseExportPdfActionService to use Injection Services instead of looping in dll as before. Example for implementation in Client Project could be find here: | [Card](https://trello.com/c/AFzEihhF)<br>[Ref](https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-dtglobal/commit/d591320e4600fbf74d108ef0562fa328b0022d9c?refName=refs/heads/main&path=/ngo-api/NGO/NGO.Services/ExportPdfServices/BudgetExportPdfService.cs&_a=compare) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

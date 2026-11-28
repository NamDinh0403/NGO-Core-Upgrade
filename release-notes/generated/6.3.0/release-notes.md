# NGO Core 6.3.0 Release Notes

- **Version:** 6.3.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/6.3.0.json)
- **Quick Summary:** Mandatory Actions **0** | Conditional Actions **1** | New Features **1** | Bug Fixes **0**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| if client requests to remove reporting periods that are outside of current published budget periods (e | Update appsettings.json (Queue names, CoreContext, AzureWebJobsStorage, keep 'RemoveRedundantPeriods': false) and run the Tool: UpdateExistingPartnerExpenditureReportings | During Upgrade | Deployer | [Required] Update appsettings.json (Queue names, CoreContext, AzureWebJobsStorage, keep 'RemoveRedundantPeriods': false) and run the Tool: UpdateExistingPartnerExpenditureReportings<br>[Optional] Turn on the setting RemoveRedundantPeriods in appsettings.json if client requests to remove reporting periods that are outside of current published budget periods (e.g. user extends Entity EndDate and haven't published new budget version before this card's release, reporting periods are longer/outside than budget period will be removed) | [Card](https://trello.com/c/hFFsC2Vh/3876-partner-expenditure-some-issues-related-to-shortening-end-date-adjust-the-start-date) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Required / Optional | [Required] Update appsettings.json (Queue names, CoreContext, AzureWebJobsStorage, keep 'RemoveRedundantPeriods': false) and run the Tool: UpdateExistingPartnerExpenditureReportings | Matched key changes: A `ngo-api-core/NGO/NGO.Core.Tools.UpdateExistingPartnerExpenditureReportings/appsettings.json` | if client requests to remove reporting periods that are outside of current published budget periods (e Update appsettings.json (Queue names, CoreContext, AzureWebJobsStorage, keep 'RemoveRedundantPeriods': false) and run the Tool: UpdateExistingPartnerExpenditureReportings | [Card](https://trello.com/c/hFFsC2Vh/3876-partner-expenditure-some-issues-related-to-shortening-end-date-adjust-the-start-date) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

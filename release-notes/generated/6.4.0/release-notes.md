# NGO Core 6.4.0 Release Notes

- **Version:** 6.4.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/6.4.0.json)
- **Quick Summary:** Mandatory Actions **1** | Conditional Actions **0** | New Features **0** | Bug Fixes **1** | Needs Review **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| update appsettings.json and manual run the tool: NGO.Core.Tools.GenerateMissingReports | After Deploy | Deployer | Logframe periods missing<br>[For deployment person]<br>[After deployment] update appsettings.json and manual run the tool: NGO.Core.Tools.GenerateMissingReports<br>Reason: To add missing reporting in head for current logframe version | [Card](https://trello.com/c/Qb4gdJRj/4750-logframe-periods-missing) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | ID of global objective is displayed unexpectedly on at number objective field when number objective is blank on Current sprint - Core \| Trello | During Upgrade | Client Dev | [Logframe/Indicator Tracker] ID of global objective is displayed unexpectedly on at number objective field when number objective is blank on Current sprint - Core \| Trello<br>If in client project customs GetLogframeIndicatorTrackers procedure, update isnull(obj.ObjectiveNo, glObj.ObjectiveNo) to obj.[ObjectiveNo] (changes in PR: Pull request 23454: [Logframe/Indicator Tracker] ID of global objective is displayed unexpectedly on at number objective field when number objective is blank - Repos (azure.com) | [Card](https://trello.com/c/Y08Mqgwi/4207-logframe-indicator-tracker-id-of-global-objective-is-displayed-unexpectedly-on-at-number-objective-field-when-number-objective-i)<br>[PR](https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/23454) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Backend | Logframe periods missing | Matched key changes: M `ngo-api-core/NGO/NGO.Deployment/appsettings.json`, M `ngo-api-core/NGO/NGO.Webjobs/NGO.WebJobs.Job/appsettings.json`, M `ngo-api-core/NGO/NGO/appsettings.json` | update appsettings.json and manual run the tool: NGO.Core.Tools.GenerateMissingReports | [Card](https://trello.com/c/Qb4gdJRj/4750-logframe-periods-missing) |

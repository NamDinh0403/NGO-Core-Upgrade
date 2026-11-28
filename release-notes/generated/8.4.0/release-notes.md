# NGO Core 8.4.0 Release Notes

- **Version:** 8.4.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/8.4.0.json)
- **Quick Summary:** Mandatory Actions **1** | Conditional Actions **0** | New Features **1** | Bug Fixes **0**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Update Google Analytics script in Core on Current sprint - Core \| Trello | During Upgrade | Client Dev | [1][S] Update Google Analytics script in Core on Current sprint - Core \| Trello<br>Remove this from src/index.html:<br><!-- Global site tag (gtag.js) - Google Analytics --><br>< script ><br>window.dataLayer = window.dataLayer \|\| [];<br>function gtag(){dataLayer.push(arguments);}<br>gtag( 'js' , new Date ());<br></ script > | [Card](https://trello.com/c/oRXh5Tui/5364-1s-update-google-analytics-script-in-core) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| None identified. | - | - | - | - | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| 1 | [1][S] Update Google Analytics script in Core on Current sprint - Core \| Trello | Matched key changes: M `ngo-client-core/src/index.html` | Action applies during the upgrade. Update Google Analytics script in Core on Current sprint - Core \| Trello | [Card](https://trello.com/c/oRXh5Tui/5364-1s-update-google-analytics-script-in-core) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

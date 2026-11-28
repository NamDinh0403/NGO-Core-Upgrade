# NGO Core 7.3.0 Release Notes

- **Version:** 7.3.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/7.3.0.json)
- **Quick Summary:** Mandatory Actions **2** | Conditional Actions **0** | New Features **0** | Bug Fixes **0**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Logframe2 - Separate objective and structure tab functions and fields | During Upgrade | Deployer | Logframe2 - Separate objective and structure tab functions and fields<br>If logframe1 is used: override entity-route.service.ts and replace 'logframe' path with logframeRouteService, also add always-run core override script '20250930_DisableLogframe2.sql'<br>If logframe2 is used: manual run after script '20250917_DisableLogframe1.sql' | [Card](https://trello.com/c/eEdN0vxG/5080-logframe2-separate-objective-and-structure-tab-functions-and-fields) |
| Display correct period labels in UI based on each indicator's frequency on Current sprint - Core \| Trello | After Deploy | Deployer | [M][Logframe 2] Display correct period labels in UI based on each indicator's frequency on Current sprint - Core \| Trello<br>[For deployment person]<br>[After deployment] In 20251003_EnsureFrequencyIndicator.sql Update (4) to list id of Objective level that is input (not have target or reporting period), and manual run script. To ensure every indicator have frequency. Then run the tool below<br>[After deployment] Only run tool after ensure indicator frequency . Update appsettings.json and manual run the tool: NGO.Core.Tools.RebindPeriodNameForIndicatorTargetReport | [Card](https://trello.com/c/Rr0Rrrxh/5028-mlogframe-2-display-correct-period-labels-in-ui-based-on-each-indicators-frequency) |

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

# NGO Core 7.7.0 Release Notes

- **Version:** 7.7.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/7.7.0.json)
- **Quick Summary:** Mandatory Actions **0** | Conditional Actions **1** | New Features **0** | Bug Fixes **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| if client overrides it | Adjusted DB FUNCTION GetTaskThatUserHasViewPermission , so if client overrides it, please inner join Tasks table with CoreEntities to make sure only view accessable entities //Uyen | During Upgrade | Client Dev | Adjusted DB FUNCTION GetTaskThatUserHasViewPermission , so if client overrides it, please inner join Tasks table with CoreEntities to make sure only view accessable entities //Uyen | [Card](https://trello.com/c/AKettC6e/5344-analyse-task-as-primary-table-user-should-not-see-the-tasks-belong-to-the-entity-they-have-not-access-permission) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Frontend | [S] Default page is not loaded when user inputs incorrect URL | Matched key changes: M `ngo-client-core/src/app/app-route.service.ts` | None stated in the release source. | [Card](https://trello.com/c/Hc0tfMNW/5326-s-default-page-is-not-loaded-when-user-inputs-incorrect-url) |

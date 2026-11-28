# NGO Core 3.10.0 Release Notes

- **Version:** 3.10.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **5** | Conditional Actions **0** | New Features **1** | Bug Fixes **1** | Needs Review **3**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Card: Project - Particpants & People Reached (beneficiaries) - server error < | After Deploy | Deployer | Card: [M] Project - Particpants & People Reached (beneficiaries) - server error <<br>[After deployment]: 20221230_UpdateMonthYearForEOPTargetPeriod.sql | [Card](https://trello.com/c/ZKHJfGGx) |
| Card: Review/Approval, Comment are not displayed when selected Tasks in Primary table < | After Deploy | Deployer | Card: [Permission/Analyze/Tasks] Review/Approval, Comment are not displayed when selected Tasks in Primary table <<br>[After deployment]: 20221209_RemoveUnusedPermissions.sql | [Card](https://trello.com/c/sV9nzgVF) |
| Card: Admin UI / OverviewBox: Announcement has empty list of default fields in dropdown < | After Deploy | Deployer | Card: Admin UI / OverviewBox: Announcement has empty list of default fields in dropdown <<br>[After deployment]: 20221212_UpdateFieldInstanceForAnnouncementBox.sql | [Card](https://trello.com/c/ph8LltYo) |
| Update environement.ts and environment.prod.ts: | During Upgrade | Client Dev | [S] Project/OverviewBox : Partner assessment (tabfunctionId = 34), Due dilligence(tabfunctionId = 33) get the same permission to check validate<br>Update environement.ts and environment.prod.ts:<br>partnerCompliance: 'api/core/entity' | [Card](https://trello.com/c/yZQ60E7I) |
| Run datafixes/20221206_RemoveSubPhaseFields.sql | During Upgrade | Deployer | [S] Adding a new task to a workflow that is using the 'Repeating phase' function:<br>Run datafixes/20221206_RemoveSubPhaseFields.sql | [Card](https://trello.com/c/z76cL0Xz) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Card: Support ÅÄÖ in files sent through e-mail < | During Upgrade | Client Dev | Card: [S] Support ÅÄÖ in files sent through e-mail < | [Card](https://trello.com/c/mL0ceLUJ) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Sendgrid to 9.28.1 | During Upgrade | Client Dev | - Sendgrid to 9.28.1 | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Find all client projects and update | During Upgrade | Client Dev | Find all client projects and update | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | [S] Adding a new task to a workflow that is using the 'Repeating phase' function: | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. Run datafixes/20221206_RemoveSubPhaseFields.sql | [Card](https://trello.com/c/z76cL0Xz) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | Card: [M] Project - Particpants & People Reached (beneficiaries) - server error < | No deterministic git-diff evidence was supplied for this note. | Card: Project - Particpants & People Reached (beneficiaries) - server error < | [Card](https://trello.com/c/ZKHJfGGx) |

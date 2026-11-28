# NGO Core 2.7.0 Release Notes

- **Version:** 2.7.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **3** | Conditional Actions **0** | New Features **0** | Bug Fixes **0** | Needs Review **3**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Finance Budget rows grouped by fields | During Upgrade | Deployer | Finance Budget rows grouped by fields<br>When the JSON format for Budget settings and Partner expenditure report settings is changed, Please run this SQL script to correct it<br>This file is located in DataFixes folder 20201120_Financial_Budget_Grouped_By_Fields.sql | - |
| Add the following line to environment.ts and environment.prod.ts: | During Upgrade | Client Dev | Announcements<br>Add the following line to environment.ts and environment.prod.ts:<br>announcement: 'api/core/announcement', | - |
| Add the following line to environment.ts and environment.prod.ts: | During Upgrade | Client Dev | Generic summary/overview boxes<br>Add the following line to environment.ts and environment.prod.ts:<br>genericOverviewBox: 'api/core', | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Entity references to sub entity (e.g. funding has contact in form) | During Upgrade | Client Dev | Entity references to sub entity (e.g. funding has contact in form)<br>To generate correct browse view, it is necessary to add information of tab definition id / tab function id of sub entity<br>For example: Funding has 2 contacts field in form<br>Contact 1 mapping SQL: { Type: 18, RelId: 4, Alias: "Contact", "RelTable": { "TableName": "CoreContacts", "NameCol" : "FirstName", "TabDefinitionId": 5} }<br>Contact 2 mapping SQL: { Type: 18, RelId: 5, Alias: "Contact2", "RelTable": { "TableName": "CoreContacts", "NameCol" : "FirstName", "TabDefinitionId": 5} } | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Import the following in app.module.ts: | During Upgrade | Client Dev | Import the following in app.module.ts:<br>AnnouncementModule | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | import the following in app.module.ts: | During Upgrade | Client Dev | import the following in app.module.ts:<br>GenericOverviewBoxModule | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

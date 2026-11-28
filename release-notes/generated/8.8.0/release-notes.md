# NGO Core 8.8.0 Release Notes

- **Version:** 8.8.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/8.8.0.json)
- **Quick Summary:** Mandatory Actions **3** | Conditional Actions **0** | New Features **0** | Bug Fixes **0** | Needs Review **5**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Add ="true" to ngo-list-filter . | During Upgrade | Client Dev | - Add [flattenIntoParentFlow]="true" to ngo-list-filter . | - |
| Remove all "pull-right" or " pull-left" classes in other fields | During Upgrade | Client Dev | - Remove all "pull-right" or " pull-left" classes in other fields | - |
| Add class = " filter-align-left" to new div above | During Upgrade | Client Dev | - Add class = " filter-align-left" to new div above | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | ﷟HYPERLINK " Browse list : when zoomed in, the first filters are shown in the second row, not the last filters, why? on Current sprint - Core \| Trello Browse list : when zoomed in, | During Upgrade | Client Dev | ﷟HYPERLINK " Browse list : when zoomed in, the first filters are shown in the second row, not the last filters, why? on Current sprint - Core \| Trello Browse list : when zoomed in, the first filters are shown in the second row, not the last filters, why? on Current sprint - Core \| Trello | [Card](https://trello.com/c/bd3CO8en/5558-s-browse-list-when-zoomed-in-the-first-filters-are-shown-in-the-second-row-not-the-last-filters-why) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Wrap all fields in <div class="browse-filter-layout"> | During Upgrade | Client Dev | - Wrap all fields in <div class="browse-filter-layout"> | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | pull-right: | During Upgrade | Client Dev | - pull-right: | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Reorder other fields | During Upgrade | Client Dev | - Reorder other fields | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | pull-left | During Upgrade | Client Dev | - pull-left | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

# NGO Core 1.18.3 Release Notes

- **Version:** 1.18.3
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **2** | Conditional Actions **0** | New Features **0** | Bug Fixes **0** | Needs Review **5**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Add line logframes: 'api/core/entity', | During Upgrade | Client Dev | - Add line logframes: 'api/core/entity', | - |
| Add line permissions: 'api/core/permissions' | During Upgrade | Client Dev | - Add line permissions: 'api/core/permissions' | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Admin UI: Change property / column name (Need to correct for all client projects) | During Upgrade | Client Dev | Admin UI: Change property / column name (Need to correct for all client projects)<br>ngo-list-filter : replace parameter of list setting object to collection of List filter settings with new property listFilters<br>CoreListFilterSettings : rename column `OrderIndex` to `SortOrder`<br>When upgrading for client sites, please verify if the migration script generates the content of changing name of column like in this file 202007210748036_RenameFieldOrderInFilter.cs, if not, please add it by yourself | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | app.module.ts | During Upgrade | Client Dev | - app.module.ts | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | import LogframeModule | During Upgrade | Client Dev | - import LogframeModule | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | import PermissionsModule | During Upgrade | Client Dev | - import PermissionsModule | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | environments.ts & environments.prod.ts | During Upgrade | Client Dev | - environments.ts & environments.prod.ts | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

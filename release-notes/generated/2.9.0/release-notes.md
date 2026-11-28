# NGO Core 2.9.0 Release Notes

- **Version:** 2.9.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **3** | Conditional Actions **0** | New Features **0** | Bug Fixes **0** | Needs Review **6**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Add the following line to environment.ts and environment.prod.ts: systemBanner: 'api/core/systemBanner' | During Upgrade | Client Dev | - Add the following line to environment.ts and environment.prod.ts: systemBanner: 'api/core/systemBanner' | - |
| Add key for SQL command timeout | During Upgrade | Client Dev | Web.config<br>Add key for SQL command timeout<br><add key="sp:QueryTimeout" value="180"/> | - |
| Add this library: "ngx-color-picker": "^11.0.0", | During Upgrade | Client Dev | Packkage.json<br>Add this library: "ngx-color-picker": "^11.0.0", | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Import list of Awesome Font icon to client project | During Upgrade | Client Dev | - Import list of Awesome Font icon to client project | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | faWrench, faExclamationCircle, faNewspaper, faUmbrellaBeach, faMinus from '@fortawesome/free-solid-svg-icons' | During Upgrade | Client Dev | - faWrench, faExclamationCircle, faNewspaper, faUmbrellaBeach, faMinus from '@fortawesome/free-solid-svg-icons' | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | faCommentAltExclamation from '@fortawesome/pro-light-svg-icons' | During Upgrade | Client Dev | - faCommentAltExclamation from '@fortawesome/pro-light-svg-icons' | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Import SystemBannerModule to app.module.ts | During Upgrade | Client Dev | - Import SystemBannerModule to app.module.ts | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | System configuration | During Upgrade | Client Dev | System configuration<br>Import list of Awesome Font icon to client project<br>faCog from '@fortawesome/pro-light-svg-icons' | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | System banner | During Upgrade | Client Dev | System banner | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

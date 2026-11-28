# NGO Core 2.7.1 Release Notes

- **Version:** 2.7.1
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **0** | Conditional Actions **0** | New Features **1** | Bug Fixes **0** | Needs Review **2**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Logframe version | During Upgrade | Client Dev | Logframe version<br>New permissions added for logframe version . Needs to be added to client specific permission script in various roles:<br>--Logframe<br>(1952, 2, 20, NULL, NULL), -- Add Logframe version | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | (1953, 3, 20, NULL, NULL), -- Update Logframe version | During Upgrade | Client Dev | (1953, 3, 20, NULL, NULL), -- Update Logframe version | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | -Add icon faGlobeAmericas to file app.module.ts | No deterministic git-diff evidence was supplied for this note. | No explicit client action was stated in the release source. | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

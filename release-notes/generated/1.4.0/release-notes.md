# NGO Core 1.4.0 Release Notes

- **Version:** 1.4.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **2** | Conditional Actions **0** | New Features **0** | Bug Fixes **0** | Needs Review **3**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Update Sharing settings on SharePoint Site collection: C hange "External sharing" of sites (tenant admin -> "Active sites" -> select site -> "Policies") to "New and existing guests | During Upgrade | Client Dev | Update Sharing settings on SharePoint Site collection: C hange "External sharing" of sites (tenant admin -> "Active sites" -> select site -> "Policies") to "New and existing guests" and deactivate feature "Limited-access user permission lockdown mode" (Site settings -> Site collection features) when setup site collection to make the share function work. | - |
| Update any client specific scripts for EmailTemplates to match the new structure in core. | During Upgrade | Client Dev | 4. Config<br>Update any client specific scripts for EmailTemplates to match the new structure in core. | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | app.module.ts | During Upgrade | Client Dev | 1. app.module.ts | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | environments | During Upgrade | Client Dev | 2. environments | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Deployment | During Upgrade | Client Dev | 3. Deployment<br>Uncomment UpdateContentTypesForExistingSites in Deploy.ps1 to add link document content types to existing sites (if needed). | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

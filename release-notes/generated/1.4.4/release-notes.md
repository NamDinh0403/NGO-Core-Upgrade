# NGO Core 1.4.4 Release Notes

- **Version:** 1.4.4
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **3** | Conditional Actions **0** | New Features **1** | Bug Fixes **0** | Needs Review **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Add MonitoringFinanceModule | During Upgrade | Client Dev | 1. app.module.ts<br>Add MonitoringFinanceModule | - |
| Add | During Upgrade | Client Dev | 2. environments<br>Add<br>monitoring: 'api/core/entity', | - |
| Config | During Upgrade | Client Dev | 4. Config<br>New appsettings needed in web config:<br><add key="sp:FinancialActualEntityUpdateQueue" value="financialactualentityupdatequeue-dev" /> | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Deployment | During Upgrade | Client Dev | 3. Deployment<br>New parameters for Deploy.ps1. Release pipelines and Azure AppServices needs to be updated:<br>-FinancialActualEntityUpdateQueue "financialactualentityupdatequeue-dev" | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | New permission added for finance monitoring. Needs to be added to client specific permission script in various roles: | No deterministic git-diff evidence was supplied for this note. | No explicit client action was stated in the release source. | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

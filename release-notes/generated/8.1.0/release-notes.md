# NGO Core 8.1.0 Release Notes

- **Version:** 8.1.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/8.1.0.json)
- **Quick Summary:** Mandatory Actions **3** | Conditional Actions **0** | New Features **1** | Bug Fixes **0** | Needs Review **2**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Update app.module.ts : | During Upgrade | Client Dev | - Update app.module.ts : | - |
| Add EmergencyFinanceModule, NonProjectFinanceModule to @NgModule | During Upgrade | Client Dev | - Add EmergencyFinanceModule, NonProjectFinanceModule to @NgModule | - |
| Add API URL to environment files: | During Upgrade | Client Dev | - Add API URL to environment files: | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | nonProjectFinance: 'api/core/entity'- Ensure Entra App Registration has permission `Mail.Read` (type: Application, granted admin consent) | During Upgrade | Client Dev | - nonProjectFinance: 'api/core/entity'- Ensure Entra App Registration has permission `Mail.Read` (type: Application, granted admin consent) | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | emergencyFinance: 'api/core/entity' | During Upgrade | Client Dev | - emergencyFinance: 'api/core/entity' | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Backend | [S] Enable finance tabs + functionality on Emergency & Non-Project entities | Matched key changes: M `ngo-api-core/NGO/NGO.Core.Model/Domain/Emergency.cs`, M `ngo-api-core/NGO/NGO.Core.Model/Dto/Emergency.cs` | No explicit client action was stated in the release source. | [Card](https://trello.com/c/rWZ324Al/5257-s-enable-finance-tabs-functionality-on-emergency-non-project-entities) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

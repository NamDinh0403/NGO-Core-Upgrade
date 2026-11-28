# NGO Core 1.12.1 Release Notes

- **Version:** 1.12.1
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **2** | Conditional Actions **0** | New Features **0** | Bug Fixes **0** | Needs Review **5**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Add line partnerExpenditure: 'api/core/entity', | During Upgrade | Client Dev | - Add line partnerExpenditure: 'api/core/entity', | - |
| Add line financeChart: 'api/core/entity' | During Upgrade | Client Dev | - Add line financeChart: 'api/core/entity' | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Remember to also update DocumentFormat.OpenXml.Extensions package | During Upgrade | Client Dev | Remember to also update DocumentFormat.OpenXml.Extensions package | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | app.module.ts | During Upgrade | Client Dev | - app.module.ts | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | import PartnerExpenditureReportingModule | During Upgrade | Client Dev | - import PartnerExpenditureReportingModule | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | import FinanceChartModule | During Upgrade | Client Dev | - import FinanceChartModule | - |
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

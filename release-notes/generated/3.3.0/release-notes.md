# NGO Core 3.3.0 Release Notes

- **Version:** 3.3.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **3** | Conditional Actions **0** | New Features **0** | Bug Fixes **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Income schedule: update Donor fields displayed in Admin UI | During Upgrade | Deployer | Income schedule: update Donor fields displayed in Admin UI<br>DataFixes/20220718_IncomeSchedules_DonorFields.sql | - |
| Finance/Funding Plan/Form - Should link to a separate approval task template in standard setup scripts | During Upgrade | Deployer | Finance/Funding Plan/Form - Should link to a separate approval task template in standard setup scripts<br>DataFixes/ 20220623_UpdateTaskApprovalSetting.sql | - |
| Remove FinanceRouteGuard from the override service of FundingFinanceRouteService | During Upgrade | Client Dev | Display wrong tabfunction when using condition<br>Remove FinanceRouteGuard from the override service of FundingFinanceRouteService<br>Pull request 10446: [S] Finance/Sub tabs with conditions - Wrong view is shown when switch from Agreements tab (refresh in Agreements tab + first access in Finance tab - Repos (azure.com) | [Card](https://trello.com/c/Zk3n3vKH)<br>[PR](https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/10446?_a=files&path=/ngo-client-core/projects/ngo-core/src/lib/funding-finance/funding-finance-route.service.ts) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| None identified. | - | - | - | - | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Frontend | Display wrong tabfunction when using condition | No deterministic git-diff evidence was supplied for this note. | Remove FinanceRouteGuard from the override service of FundingFinanceRouteService | [Card](https://trello.com/c/Zk3n3vKH)<br>[PR](https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/10446?_a=files&path=/ngo-client-core/projects/ngo-core/src/lib/funding-finance/funding-finance-route.service.ts) |

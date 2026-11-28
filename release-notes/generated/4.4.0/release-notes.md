# NGO Core 4.4.0 Release Notes

- **Version:** 4.4.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **1** | Conditional Actions **1** | New Features **1** | Bug Fixes **3** | Needs Review **4**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Set new/old values of URL config | During Upgrade | Client Dev | - Set new/old values of URL config | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Move Task Template Tool | During Upgrade | Client Dev | Move Task Template Tool<br>It is the update to the existing tool NGO.Core.Tools.SiteConfigurationPopulation so that the default document links can be replaced with the URL of destination site | [Card](https://trello.com/c/mkT85zLU) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | RootUrl: SharePoint root URL | During Upgrade | Client Dev | - RootUrl: SharePoint root URL | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | TenantUrl: SharePoint tenant URL | During Upgrade | Client Dev | - TenantUrl: SharePoint tenant URL | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Web URL: Website URL | During Upgrade | Client Dev | - Web URL: Website URL | - |
| Note: Please run the script noted in the tool to check the invalid data, please make sure that there are no invalid budget report row (I.e: row has Month = 0, or invalid date time – null is ok) | Update version of npm package @ng-bootstrap/ng-bootstrap to 5.1.2 | After Deploy | Deployer | Fields: Auto-populated dates not working as expected<br>Update version of npm package @ng-bootstrap/ng-bootstrap to 5.1.2<br>[After Deployment] Run tool: NGO.Core.Tools.ValidateAndRemoveAllInvalidBudgetRows<br>Note: Please run the script noted in the tool to check the invalid data, please make sure that there are no invalid budget report row (I.e: row has Month = 0, or invalid date time – null is ok) | [Card](https://trello.com/c/s2sPg2v2) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | Define document link column in the table by property DocumentColumns in SmarterMerges (default document resource links already added to CoreTaskTemplates table) | No deterministic git-diff evidence was supplied for this note. | No explicit client action was stated in the release source. | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | Note : step 2 must have values for all settings. If some of them is missing, nothing is replaced | No deterministic git-diff evidence was supplied for this note. | None stated in the release source. | - |
| Shared / Cross-track | [M] Be able to configure format with fixed two decimal digits even though it's an integer value | No deterministic git-diff evidence was supplied for this note. | None stated in the release source. | [Card](https://trello.com/c/zKFfoTtO) |
| Database / Deployment | Fields: Auto-populated dates not working as expected | No deterministic git-diff evidence was supplied for this note. | Note: Please run the script noted in the tool to check the invalid data, please make sure that there are no invalid budget report row (I.e: row has Month = 0, or invalid date time – null is ok). Update version of npm package @ng-bootstrap/ng-bootstrap to 5.1.2 | [Card](https://trello.com/c/s2sPg2v2) |

# NGO Core 7.5.0 Release Notes

- **Version:** 7.5.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/7.5.0.json)
- **Quick Summary:** Mandatory Actions **3** | Conditional Actions **1** | New Features **1** | Bug Fixes **1** | Needs Review **2**

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
| If client extended BudgetFormComponent | If client extended BudgetFormComponent, should follow Core code to fix the problem in card. | During Upgrade | Client Dev | If client extended BudgetFormComponent, should follow Core code to fix the problem in card. | [Card](https://trello.com/c/mysZCJvG/3719-finance-budget-edit-form-reffield-options-in-2nd-3rd-levels-cannot-be-saved) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | nonProjectFinance: 'api/core/entity' | During Upgrade | Client Dev | - nonProjectFinance: 'api/core/entity' | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | emergencyFinance: 'api/core/entity' | During Upgrade | Client Dev | - emergencyFinance: 'api/core/entity' | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Backend | [S] Enable finance tabs + functionality on Emergency & Non-Project entities | Matched key changes: M `ngo-api-core/NGO/NGO.Core.Model/Domain/Emergency.cs`, M `ngo-api-core/NGO/NGO.Core.Model/Dto/Emergency.cs` | No explicit client action was stated in the release source. | [Card](https://trello.com/c/rWZ324Al/5257-s-enable-finance-tabs-functionality-on-emergency-non-project-entities) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | If client extended BudgetFormComponent, should follow Core code to fix the problem in card. | No deterministic note-to-file match. Release diff covers 196 files (backend: 64, frontend: 101, shared: 31); representative changes: M `.gitignore`, M `build-pipeline-api-pack.yml`, M `build-pipeline-api.yml`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/FundingFinancialController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/Logframes2Controller.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/PaymentController.cs`. | If client extended BudgetFormComponent. If client extended BudgetFormComponent, should follow Core code to fix the problem in card. | [Card](https://trello.com/c/mysZCJvG/3719-finance-budget-edit-form-reffield-options-in-2nd-3rd-levels-cannot-be-saved) |

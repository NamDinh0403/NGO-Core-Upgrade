# NGO Core 5.9.0 Release Notes

- **Version:** 5.9.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/5.9.0.json)
- **Quick Summary:** Mandatory Actions **2** | Conditional Actions **1** | New Features **1** | Bug Fixes **1** | Needs Review **5**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Check CoreOverviewBoxFieldInstances Fields: | During Upgrade | Client Dev | - Check CoreOverviewBoxFieldInstances Fields: | - |
| UPDATE CoreOverviewBoxFieldInstances SET Characteristic = '{"isHideLabel": true}' WHERE Characteristic IS NULL AND OverviewBoxInstanceId IN ( SELECT Id FROM CoreOverviewBoxInstance | During Upgrade | Client Dev | - If they do not display correctly, use the following script to correct them:<br>UPDATE CoreOverviewBoxFieldInstances SET Characteristic = '{"isHideLabel": true}' WHERE Characteristic IS NULL AND OverviewBoxInstanceId IN ( SELECT Id FROM CoreOverviewBoxInstances WHERE OverviewBoxDefinitionId IN (7, 10, 60) ) | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Before Deployment: | Before Deploy | Deployer | - Before Deployment: | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Use the following query to identify fields that are not in the correct JSON format: | During Upgrade | Client Dev | - Use the following query to identify fields that are not in the correct JSON format:<br>SELECT * FROM CoreOverviewBoxFieldInstances ￼ WHERE ISJSON(Characteristic) = 0 ￼ AND OverviewBoxInstanceId IN ( ￼ SELECT Id ￼ FROM CoreOverviewBoxInstances ￼ WHERE OverviewBoxDefinitionId IN (7, 10, 60) ￼ ) ￼ | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Correct the identified fields to match the JSON format. | During Upgrade | Client Dev | - Correct the identified fields to match the JSON format. | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Verify Task Overview Boxes: | During Upgrade | Client Dev | - Verify Task Overview Boxes: | - |
| Check if task overview boxes display correctly after deployment | Check if task overview boxes display correctly after deployment. | After Deploy | Deployer | - Check if task overview boxes display correctly after deployment. | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | After Deployment: | After Deploy | Deployer | - After Deployment: | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | [S] Add acolumn headers to the columns in the My Tasks and Milestones box | No deterministic note-to-file match. Release diff covers 287 files (backend: 134, frontend: 81, shared: 72); representative changes: M `.gitignore`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/AgreementsController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/BankAccountsController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/BeneficiariesController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/BudgetController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/ChangesController.cs`. | No explicit client action was stated in the release source. | [Card](https://trello.com/c/c6nTXpWO/4447-s-add-acolumn-headers-to-the-columns-in-the-my-tasks-and-milestones-box) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | This approach is recommended because the bug was discovered after the card had already been released, so running this script manually is the preferred solution if version 5.9.2 has been deployed. | No deterministic note-to-file match. Release diff covers 287 files (backend: 134, frontend: 81, shared: 72); representative changes: M `.gitignore`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/AgreementsController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/BankAccountsController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/BeneficiariesController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/BudgetController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/ChangesController.cs`. | None stated in the release source. | - |

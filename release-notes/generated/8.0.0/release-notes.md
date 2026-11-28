# NGO Core 8.0.0 Release Notes

- **Version:** 8.0.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/8.0.0.json)
- **Quick Summary:** Mandatory Actions **13** | Conditional Actions **3** | New Features **4** | Bug Fixes **1** | Needs Review **8**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| remove import of bootstrap: ￼@import url(" | During Upgrade | Client Dev | remove import of bootstrap: ￼@import url(" | [Ref](https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css) |
| Add at the end of the file: | During Upgrade | Client Dev | Add at the end of the file:<br>/* Override to adapt for Bootstrap 5 */<br>.modal-backdrop {<br>z-index:1050 !important;<br>} | - |
| Run SharePoint Deployment | During Upgrade | Client Dev | - Run SharePoint Deployment | - |
| Update Azure setting: Core:Queue:IATITransactionImportQueue | During Upgrade | Client Dev | - Update Azure setting: Core:Queue:IATITransactionImportQueue | - |
| Update appsetting files: "IATITransactionImportQueue": "iatitransactionimportqueue-dev-nidy" | During Upgrade | Client Dev | - Update appsetting files: "IATITransactionImportQueue": "iatitransactionimportqueue-dev-nidy" | - |
| Update all settings in appsettings.json the same as your environment and run NGO.Core.Tools.UpdateIdeaMembers | After Deploy | Deployer | [L] Idea and FundingIdea document permissions should be specific for each entity<br>[After deployment] Update all settings in appsettings.json the same as your environment and run NGO.Core.Tools.UpdateIdeaMembers<br>Note: skip this deployment note if you are updating to 8.3 or above (if true, let follow the new deployment note of 8.3) | [Card](https://trello.com/c/yU7W4yZ2/4893-l-idea-and-fundingidea-document-permissions-should-be-specific-for-each-entity) |
| Update app.module.ts : | During Upgrade | Client Dev | - Update app.module.ts : | - |
| Add farExclamationCircle after faMoneyBill inside the constructor. | During Upgrade | Client Dev | - Add farExclamationCircle after faMoneyBill inside the constructor. | - |
| Add MinimumRequirementModule to @NgModule | During Upgrade | Client Dev | - Add MinimumRequirementModule to @NgModule | - |
| Add API URL to environment files: | During Upgrade | Client Dev | - Add API URL to environment files: | - |
| Create CoreLogframeIATIProvider on Current sprint - Core \| Trello | After Deploy | Deployer | [M] Create CoreLogframeIATIProvider on Current sprint - Core \| Trello<br>[For deployment person]<br>[After deployment] In 20251015_AddCodeToLogframeLevelInput.sql Update (4) to list id of Objective level that is input (not have target or reporting period), and manual run script. | [Card](https://trello.com/c/ar5AjGkl/4895-m-create-corelogframeiatiprovider) |
| Add faLock inside the constructor. | During Upgrade | Client Dev | - Add faLock inside the constructor. | - |
| Extend the "Core API Versions" function to include more info and add security on Current sprint - Core \| Trello | Before Deploy | Deployer | [8][S] Extend the "Core API Versions" function to include more info and add security on Current sprint - Core \| Trello<br>[Before deployment] | [Card](https://trello.com/c/WvuRXkYJ/5059-8s-extend-the-core-api-versions-function-to-include-more-info-and-add-security) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| Check if any custom or reuse AddIdea or AddFundingIdea that cannot generate entity number for these entities | Check if any custom or reuse AddIdea or AddFundingIdea that cannot generate entity number for these entities, and use sequenceNumberService to handle that | During Upgrade | Client Dev | Check if any custom or reuse AddIdea or AddFundingIdea that cannot generate entity number for these entities, and use sequenceNumberService to handle that | [Card](https://trello.com/c/yRWF604C/5145-page-import-ideas-ideas-entity-always-auto-generates-entity-number) |
| If client want to change the number of characters in quick view of checklist’s comment | Task - Check list: improve comment text box to support multi-line | During Upgrade | Client Dev | [S] Task - Check list: improve comment text box to support multi-line<br>If client want to change the number of characters in quick view of checklist’s comment, they need to change maxCharacters of 2 field location: ID 21121(edit form) and 21122(View form). Default is 250 characters. | [Card](https://trello.com/c/OiqTNcWl/4899-s-task-check-list-improve-comment-text-box-to-support-multi-line) |
| Check if your custom code using 'getCurrentConfiguration', if yes -> make sure having 'filter(config => config != null),' | Check if your custom code using 'getCurrentConfiguration', if yes -> make sure having 'filter(config => config != null),' | During Upgrade | Client Dev | Check if your custom code using 'getCurrentConfiguration', if yes -> make sure having 'filter(config => config != null),' | [Card](https://trello.com/c/wxn79EfV/4981-loading-tabs-tabs-should-not-display-when-entity-page-is-loading) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Frontend upgrade | During Upgrade | Client Dev | [XL] Frontend upgrade<br>Please see Upgrade Angular 10-15.docx for detailed upgrade instructions | [Card](https://trello.com/c/JztEuIaT/4892-xl-frontend-upgrade)<br>[Ref](https://precio.sharepoint.com/:w:/r/sites/ngo-oonline/Shared%20Documents/03%20Core%20development/Technical/Upgrade%20Angular%2010-15.docx?d=wd0609985354946cd89c94f86f1f55831&csf=1&web=1&e=t7oIrs) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Src/styles.css | During Upgrade | Client Dev | Src/styles.css | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Minimum requirements function (aka Audit Tool/Compliance tab) | During Upgrade | Client Dev | [L] Minimum requirements function (aka Audit Tool/Compliance tab) | [Card](https://trello.com/c/zaQdRlnz/5024-l-minimum-requirements-function-aka-audit-tool-compliance-tab) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Import faExclamationCircle as farExclamationCircle at the line ...from '@fortawesome/pro-regular-svg-icons'. | During Upgrade | Client Dev | - Import faExclamationCircle as farExclamationCircle at the line ...from '@fortawesome/pro-regular-svg-icons'. | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | adminMinimumRequirements: 'api/core/adminMinimumRequirements' | During Upgrade | Client Dev | - adminMinimumRequirements: 'api/core/adminMinimumRequirements' | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | minimumRequirements: 'api/core/minimumRequirements' | During Upgrade | Client Dev | - minimumRequirements: 'api/core/minimumRequirements' | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Import faLock at the line ...from '@fortawesome/pro-light-svg-icons' | During Upgrade | Client Dev | - Import faLock at the line ...from '@fortawesome/pro-light-svg-icons' | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | This permission requires Admin consent which might have to be requested from a client admin. | During Upgrade | Client Dev | - This permission requires Admin consent which might have to be requested from a client admin. | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Backend | [S] Task - Check list: improve comment text box to support multi-line | Matched key changes: M `ngo-api-core/NGO/NGO.Core.Model/Domain/Change.cs`, M `ngo-api-core/NGO/NGO.Core.Model/Domain/Task/Task.cs`, M `ngo-api-core/NGO/NGO.Core.Model/Dto/Change.cs`, M `ngo-api-core/NGO/NGO.Core.Model/Dto/Task/Task.cs` | If client want to change the number of characters in quick view of checklist’s comment Task - Check list: improve comment text box to support multi-line | [Card](https://trello.com/c/OiqTNcWl/4899-s-task-check-list-improve-comment-text-box-to-support-multi-line) |
| 8 | [8][S] Extend the "Core API Versions" function to include more info and add security on Current sprint - Core \| Trello | Matched key changes: D `ngo-api-core/NGO/NGO.Core.Model/Dto/Versions.cs` | Action applies during the upgrade. Extend the "Core API Versions" function to include more info and add security on Current sprint - Core \| Trello | [Card](https://trello.com/c/WvuRXkYJ/5059-8s-extend-the-core-api-versions-function-to-include-more-info-and-add-security) |
| Shared / Cross-track | In App roles, add a role with both DisplayName and Value = "AppOnly". Allowed member types = Applications. | No deterministic note-to-file match. Release diff covers 1270 files (backend: 369, frontend: 791, shared: 110); representative changes: M `.gitignore`, M `build-pipeline-angular.yml`, M `build-pipeline-api-pack.yml`, M `build-pipeline-api.yml`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/AdminIATIPageController.cs`, A `ngo-api-core/NGO/NGO.Core.API/BaseControllers/AdminMinimumRequirementsController.cs`. | No explicit client action was stated in the release source. | - |
| Backend | In API permissions, Add permission. Select My APIs, then NGO, Application permissions and then AppOnly. | Matched key changes: M `ngo-api-core/NGO/NGO.Core.Model/Domain/Permission/Permission.cs` | No explicit client action was stated in the release source. | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Backend | Check if any custom or reuse AddIdea or AddFundingIdea that cannot generate entity number for these entities, and use sequenceNumberService to handle that | Matched key changes: M `ngo-api-core/NGO/NGO.Core.Model/Domain/Entity.cs`, M `ngo-api-core/NGO/NGO.Core.Model/Dto/Entity.cs`, M `ngo-api-core/NGO/NGO.Core.Model/Dto/FundingIdea.cs`, M `ngo-api-core/NGO/NGO.Core.Model/Dto/Idea.cs` | Check if any custom or reuse AddIdea or AddFundingIdea that cannot generate entity number for these entities. Check if any custom or reuse AddIdea or AddFundingIdea that cannot generate entity number for these entities, and use sequenceNumberService to handle that | [Card](https://trello.com/c/yRWF604C/5145-page-import-ideas-ideas-entity-always-auto-generates-entity-number) |

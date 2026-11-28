# NGO Core 3.5.0 Release Notes

- **Version:** 3.5.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **10** | Conditional Actions **0** | New Features **3** | Bug Fixes **3**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Add configuration key in Azure: | During Upgrade | Client Dev | Card: Task batch: when selecting multi templates along with multi entity, it causes the messgae content greater than the limitation (Messages cannot be larger than 65536 bytes.)<br>< ><br>Add configuration key in Azure:<br>key="sp:TaskBatchBlobQueue" value="taskbatchblobqueue"<br>key="sp:TaskBatchBlobReference" value="taskbatch/{queueTrigger}"<br>key="sp:TaskBatchBlob" value="taskbatch"<br>==> Must copy the " taskbatch/ { q ueueTrigger } " from Core WebConfig ( alot of hidden space after the { and } . If you copy from here remember to remove those spaces) | [Card](https://trello.com/c/UBUUxAen) |
| Card: Descriptions Overview boxes on entities do not work out-of-the-box < > | After Deploy | Deployer | Card: [S] Descriptions Overview boxes on entities do not work out-of-the-box < ><br>[After deployment]: DataFixes/20220916_RemoveOldFieldForDescriptionOverviewBox.sql | [Card](https://trello.com/c/H0bL3u4z) |
| Card: Analyse, "Incoming funding" is currently used for both Projects and Fundings, update to have them separate < > | After Deploy | Deployer | Card: [S] Analyse, "Incoming funding" is currently used for both Projects and Fundings, update to have them separate < ><br>[After deployment]: DataFixes/20220810_UpdateIncomingFundingForProjectInAnalyse | [Card](https://trello.com/c/MPUCXP2E) |
| Card: ADMIN - View rights doesnt't work in Admin (#132647) < > | After Deploy | Deployer | Card: [S] ADMIN - View rights doesnt't work in Admin (#132647) < ><br>[After deployment]: DataFixes/20221808_AdminUI_AddViewPermissionForRolesWithEditPermission.sql => Changed file name on version 3.7 to: 20220818_AdminUI_AddViewPermissionForRolesWithEditPermission.sql | [Card](https://trello.com/c/BBW2jIuk) |
| Card: Fields: Form field, Links - urlWithTitle only allows single, to allow multiple< | After Deploy | Deployer | Card: [S] Fields: Form field, Links - urlWithTitle only allows single, to allow multiple<<br>[After deployment]: DataFixes/20220802_FixLinkControl.sql | [Card](https://trello.com/c/goZeAM1q) |
| Entity overall status summary box name change | During Upgrade | Deployer | [T] Entity overall status summary box name change<br>DataFixes/20220727_OverallProjectStatus_ResourceString.sql | - |
| Missing options | During Upgrade | Deployer | Missing options<br>- Now must use DependentIds instead of ParentId when Option's parent come from another table (not in CoreFieldOptions, in this case the parent are come from CoreFundingCostStructures )<br>- Only run if missing options caused by the problem above<br>20220909_BudgetBreakdownOptionFix.sql | [Card](https://trello.com/c/s783Ut0Q) |
| Add imports to free-solid-svg-icons in app.module.ts | During Upgrade | Client Dev | Fix Admin portal icons<br>Add imports to free-solid-svg-icons in app.module.ts<br>faMapMarker, faUserTag | - |
| Card: Payment tab, Browse: Add 'Date approved' column< > | After Deploy | Deployer | Card: [S] Payment tab, Browse: Add 'Date approved' column< ><br>[After Deployment] 20220823_UpdatePaymentDateApproved.sql | [Card](https://trello.com/c/BCuKzQhv) |
| Upgrade TinyMCE for test automation | During Upgrade | Client Dev | Upgrade TinyMCE for test automation<br>Update angular.json and replace json node projects.ngo-nxt.architect.build.assets with this:<br>"assets": [ ￼ "src/favicon.ico", ￼ "src/assets", ￼ "src/web.config", ￼ {​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​ "glob": "**/*", "input": "node_modules/tinymce", "output": "/tinymce/" }​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​ ￼ ],<br>and node projects.ngo-nxt.architect.build.scripts with this:<br>"scripts": [ ￼ ​​​​​​​ "node_modules/tinymce/tinymce.min.js" ￼ ] ￼<br>Then run this npm command:<br>npm install @angular/animations@8.2.14 mailto:@angular/animations@8.2.14 @angular/common@8.2.14 mailto:@angular/common@8.2.14 @angular/compiler@8.2.14 mailto:@angular/compiler@8.2.14 @angular/core@8.2.14 mailto:@angular/core@8.2.14 @angular/forms@8.2.14 mailto:@angular/forms@8.2.14 @angular/platform-browser@8.2.14 mailto:@angular/platform-browser@8.2.14 @angular/platform-browser-dynamic@8.2.14 mailto:@angular/platform-browser-dynamic@8.2.14 @angular/router@8.2.14 mailto:@angular/router@8.2.14 @tinymce/tinymce-angular@3.6.1 mailto:@tinymce/tinymce-angular@3.6.1 tinymce@5.10.4 mailto:tinymce@5.10.4 @angular-devkit/build-angular@0.803.29 mailto:@angular-devkit/build-angular@0.803.29 @angular-devkit/build-ng-packagr@0.803.29 mailto:@angular-devkit/build-ng-packagr@0.803.29 @angular/cli@8.3.29 mailto:@angular/cli@8.3.29 @angular/compiler-cli@8.2.14 mailto:@angular/compiler-cli@8.2.14 @angular/language-service@8.2.14 mailto:@angular/language-service@8.2.14 --legacy-peer-deps | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| None identified. | - | - | - | - | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | Card: [S] Analyse, "Incoming funding" is currently used for both Projects and Fundings, update to have them separate < > | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. Card: Analyse, "Incoming funding" is currently used for both Projects and Fundings, update to have them separate < > | [Card](https://trello.com/c/MPUCXP2E) |
| Database / Deployment | Card: [S] Fields: Form field, Links - urlWithTitle only allows single, to allow multiple< | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. Card: Fields: Form field, Links - urlWithTitle only allows single, to allow multiple< | [Card](https://trello.com/c/goZeAM1q) |
| Database / Deployment | Card: [S] Payment tab, Browse: Add 'Date approved' column< > | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. Card: Payment tab, Browse: Add 'Date approved' column< > | [Card](https://trello.com/c/BCuKzQhv) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Backend | Card: Task batch: when selecting multi templates along with multi entity, it causes the messgae content greater than the limitation (Messages cannot be larger than 65536 bytes.) | No deterministic git-diff evidence was supplied for this note. | Add configuration key in Azure: | [Card](https://trello.com/c/UBUUxAen) |
| Database / Deployment | Missing options | No deterministic git-diff evidence was supplied for this note. | Missing options | [Card](https://trello.com/c/s783Ut0Q) |
| Shared / Cross-track | Fix Admin portal icons | No deterministic git-diff evidence was supplied for this note. | Add imports to free-solid-svg-icons in app.module.ts | - |

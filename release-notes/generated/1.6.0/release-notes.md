# NGO Core 1.6.0 Release Notes

- **Version:** 1.6.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **9** | Conditional Actions **0** | New Features **1** | Bug Fixes **0** | Needs Review **4**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Add ChangeModule | During Upgrade | Client Dev | 1. app.module.ts<br>Add ChangeModule<br>Add to providers:<br>{<br>provide: ROUTER_CONFIGURATION,<br>useFactory: (config) => config.routerConfig,<br>deps: [APP_CONFIG]<br>} | - |
| Add line: changes: 'api/core/entity', | During Upgrade | Client Dev | 2. environments<br>Add line: changes: 'api/core/entity', | - |
| Replace contents of main.ts with the file from ngo-online-core | During Upgrade | Client Dev | 3. main.ts<br>Replace contents of main.ts with the file from ngo-online-core | - |
| Add this to file above the line 'import zone.js/dist/zone': | During Upgrade | Client Dev | 4. polyfills.js<br>Add this to file above the line 'import zone.js/dist/zone':<br>import 'es6-promise';<br>import 'isomorphic-fetch';<br>import 'url-polyfill'; | - |
| Remove scripts reference to file 'n ode_modules/simplemde/dist/simplemde.min.js ' | During Upgrade | Client Dev | 5. angular.json<br>Remove scripts reference to file 'n ode_modules/simplemde/dist/simplemde.min.js ' | - |
| Add lines: | During Upgrade | Client Dev | Add lines:<br>"es6-promise": "^4.2.8",<br>"isomorphic-fetch": "^2.2.1",<br>"marked": "^0.7.0",<br>"url-polyfill": "^1.1.8" | - |
| Remove line: "simplemde": "^1.11.2" | During Upgrade | Client Dev | Remove line: "simplemde": "^1.11.2" | - |
| Update and redeploy Outlook addin manifest so URLs match this pattern with the #-sign: | During Upgrade | Client Dev | (This one is not related to developer, it's regarding the manifest xml file for Outllook Add-In that sent to clients)<br>Update and redeploy Outlook addin manifest so URLs match this pattern with the #-sign:<br><bt:Urls><br><bt:Url id="functionFile" DefaultValue="<br><bt:Url id="messageReadTaskPaneUrl" DefaultValue="<br></bt:Urls> | [Ref](https://localhost:4200/#/outlook-addin) |
| Add routing for Analyse in child | During Upgrade | Client Dev | 9. app-route.service.ts<br>Add routing for Analyse in child<br>{<br>path: 'analyse',<br>canActivate: [MsalGuard, ConfigurationGuard],<br>children: this.analyseRouteService.getRoutes()<br>}, | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | package.json | During Upgrade | Client Dev | 6. package.json<br>Element 'dependencies': | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | After Add_migration check the code to make sure having this defaultValue for IsFilter | During Upgrade | Client Dev | - After Add_migration check the code to make sure having this defaultValue for IsFilter | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | PdfTemplates format | During Upgrade | Client Dev | 8. PdfTemplates format<br>this is the order<br>1. HeaderTemplate.docx (logo ...) with ExtraText = HEADER<br>2. DefaultTemplate.docx, an empty file (ExtraText = DEFAULT) - or BankAccountTaskTemplate.docx, TaskTemplate.docx, FundingIdeaTaskTemplate.docx, ... (data columns) with ExtraText = MAIN<br>3. TaskChecklistTemplate.docx with ExtraText = CHECKLIST<br>4. CommentTemplate.docx with ExtraText = COMMENT<br>5. ReviewTemplate.docx with ExtraText = REVIEW<br>6. ApprovalTemplate.docx with ExtraText = APPROVAL | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Deployment | During Upgrade | Client Dev | 7. Deployment | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | (This one is not related to developer, it's regarding the manifest xml file for Outllook Add-In that sent to clients) | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. Update and redeploy Outlook addin manifest so URLs match this pattern with the #-sign: | [Ref](https://localhost:4200/#/outlook-addin) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

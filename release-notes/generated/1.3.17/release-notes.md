# NGO Core 1.3.17 Release Notes

- **Version:** 1.3.17
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **7** | Conditional Actions **0** | New Features **0** | Bug Fixes **0** | Needs Review **19**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Add root route | During Upgrade | Client Dev | - Add root route | - |
| Add this below 'toastr' | During Upgrade | Client Dev | - Add this below 'toastr' | - |
| add "ng2-simplemde": "^2.1.0" to dependencies | During Upgrade | Client Dev | - add "ng2-simplemde": "^2.1.0" to dependencies | - |
| add: "node_modules/simplemde/dist/simplemde.min.js" to path "projects/architect/build/scripts" | During Upgrade | Client Dev | - add: "node_modules/simplemde/dist/simplemde.min.js" to path "projects/architect/build/scripts" | - |
| Add this below line 'import environment' | During Upgrade | Client Dev | - Add this below line 'import environment' | - |
| Replace all code of the final block by using the Code snippet like this | During Upgrade | Client Dev | - Replace all code of the final block by using the Code snippet like this | - |
| Run this if no reference to this DLL | During Upgrade | Client Dev | Run this if no reference to this DLL<br>Install-Package Exchange.WebServices.Managed.Api -Version 2.2.1.2 | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Import free solid svg 'faAngleDown', 'faAngleRight' | During Upgrade | Client Dev | - Import free solid svg 'faAngleDown', 'faAngleRight' | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Import 'OutlookAddinModule' | During Upgrade | Client Dev | - Import 'OutlookAddinModule' | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Import 'DeputyModule' | During Upgrade | Client Dev | - Import 'DeputyModule' | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | { | During Upgrade | Client Dev | { | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | path: 'outlook-addin', | During Upgrade | Client Dev | path: 'outlook-addin', | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | canActivate: , | During Upgrade | Client Dev | canActivate: [MsalGuard, UserInfoGuard, ConfigurationGuard, OutlookAddinGuard], | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | children: this.outlookAddinRouteService.getRoutes() | During Upgrade | Client Dev | children: this.outlookAddinRouteService.getRoutes()<br>} | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | manageHelpDocumentation: 'api/core/helpDocumentation' | During Upgrade | Client Dev | - manageHelpDocumentation: 'api/core/helpDocumentation' | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | helpDocumentation: 'api/core/helpDocumentation' | During Upgrade | Client Dev | - helpDocumentation: 'api/core/helpDocumentation' | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | outlookAddin: 'api/core/outlookAddin' | During Upgrade | Client Dev | - outlookAddin: 'api/core/outlookAddin' | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | @import "../node_modules/simplemde/dist/simplemde.min.css"; | During Upgrade | Client Dev | @import "../node_modules/simplemde/dist/simplemde.min.css"; | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Table CoreTopNavigations: make sure Row with ID 18 (outlook-addin) have column 'Active' = 1 | During Upgrade | Client Dev | - Table CoreTopNavigations: make sure Row with ID 18 (outlook-addin) have column 'Active' = 1 | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Code snippet | During Upgrade | Client Dev | - Code snippet | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Make sure NGO.API project has reference to ' Exchange.WebServices.Managed.Api ' | During Upgrade | Client Dev | 9. Make sure NGO.API project has reference to ' Exchange.WebServices.Managed.Api ' | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Each section will contain release notes of core version. | During Upgrade | Client Dev | Each section will contain release notes of core version. | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | app.module.ts | During Upgrade | Client Dev | 1. app.module.ts<br>2. app-route.service.ts<br>3. environments .ts<br>4. styles.scss<br>5. package.json<br>6. angular.json<br>7. Db publish scripts<br>8. main.ts<br>declare const Office: any; | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | then(config => { | During Upgrade | Client Dev | .then(config => {<br>if (environment.production) {<br>enableProdMode();<br>} | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | var bootstrapModule = () => { | During Upgrade | Client Dev | var bootstrapModule = () => {<br>platformBrowserDynamic([{ provide: APP_CONFIG, useValue: config }]).bootstrapModule(AppModule)<br>.catch(err => console.error(err));<br>}; | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | var isOutlookAddinIframe = window !== window.parent && !window.opener && (window.name \|\| "").indexOf("Outlook") != -1; | During Upgrade | Client Dev | var isOutlookAddinIframe = window !== window.parent && !window.opener && (window.name \|\| "").indexOf("Outlook") != -1;<br>if (!isOutlookAddinIframe) {<br>bootstrapModule();<br>}<br>else {<br>const script = document.createElement('script');<br>script.type = 'text/javascript';<br>script.src = " ";<br>script.onload = () => {<br>console.log("office.js loaded.");<br>Office.initialize = () => {<br>bootstrapModule();<br>};<br>};<br>document.getElementsByTagName('head')[0].appendChild(script);<br>}<br>}) | [Ref](https://appsforoffice.microsoft.com/lib/1/hosted/office.js) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

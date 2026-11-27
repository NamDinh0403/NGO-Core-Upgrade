9.5.0
[S] Update setting on library Document on rootsite - https://trello.com/c/sUcxhgAI/5692-s-update-setting-on-library-document-on-rootsite
[For deployment person] check if release pipeline / deployment appsettings.json having Core:Deployment:DeploySPFieldsAndCTypesEnabled false -> if so please add Core:Deployment:DeploySPFieldsAndCTypesEnabled true to the release pipeline, and turn the setting back when the deployment done.
[Resource String/ Email] Failed to get resource string value for email title when title has configured [[TabDefinitionName]] on Current sprint - Core | Trello - https://trello.com/c/xBxUjtSz/4394-resource-string-email-failed-to-get-resource-string-value-for-email-title-when-title-has-configured-tabdefinitionname
[Before Deployment] Check in client code scripts and remove resource string keys with '_in_email' suffix

9.4.0
https://trello.com/c/WP3RDffZ/5605-analyse-and-inactive-users
If you want to show Inactive user from UserOptions, put this flag to CoreAnalyzeColumns' FieldCharacteristic
FieldCharacteristic.isAlwaysShowInactive = true
https://trello.com/c/ldhZv7CQ/5659-m-import-tool-and-site-collections [M] Import tool and site collections on Current sprint - Core | Trello
[2026-Nov-04]
- For clients in the Support & Maintenance phase, this will be handled as regular maintenance under this card. https://trello.com/c/pyza1qZl/
- For new and implementation clients, please follow the note below:
  - [For deployment person] [After deployment] Run NGO.Core.Tools.CompareSiteCount. See details in file README.md of PR https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/39207Pull request 39207: Update README of tool NGO.Core.Tools.CompareSiteCount - Repos - http://Pull request 39207: Update README of tool NGO.Core.Tools.CompareSiteCount - Repos
[4][S] Idea Task - Reassign: sent emails should be more precise on Current sprint - Core | Trello - https://trello.com/c/9s2Srmf1/5508-4s-idea-task-reassign-sent-emails-should-be-more-precise
If client projects use custom email templates with tokens like [[TaskFlow.Submitter.Name]], [[FundingIdea.CreatedBy.Name]], or [[Idea.CreatedBy.Name]], please check if they should be updated to [[TaskActorName]] instead.
Scrip to check: select * from CoreEmailTemplateContents where Body like '%TaskFlow.Submitter.Name%' or Body like '%FundingIdea.CreatedBy.Name%' or Body like '%Idea.CreatedBy.Name%' and TemplateId > 49999 (Replace TemplateId by custom Id in client, default is 50000 so TemplateId > 49999)
https://trello.com/c/dYcw3tZP/5652-s-analyse-support-more-field-characteristic-for-configoptions
- If you want to show Inactive user from ConfigOptionsMapper, put this flag to CoreAnalyzeColumns' FieldCharacteristic
FieldCharacteristic.isAlwaysShowInactive = true
- If you want to enable Readonly options of ConfigOptionsMapper, put this flag to CoreAnalyzeColumns' FieldCharacteristic
FieldCharacteristic.readOnlyOptionIncluded= true

9.3.0
https://trello.com/c/bd3CO8en/5558-s-browse-list-when-zoomed-in-the-first-filters-are-shown-in-the-second-row-not-the-last-filters-why [S] Browse list : when zoomed in, the first filters are shown in the second row, not the last filters, why? on Current sprint - Core | Trello
  - Wrap all fields in <div class="browse-filter-layout">
  - Add [flattenIntoParentFlow]="true" to ngo-list-filter.
  - Remove all "pull-right" or "pull-left" classes in other fields
  - pull-right:
    - Reorder other fields
  - pull-left
    - Add class = "filter-align-left" to new div above

9.2.0
https://trello.com/c/IRyw8QbW/5553-s-outlook-addin-permissions-are-too-high
  - Compare and copy the changes of https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/36783?_a=files&path=/ngo-client-core/src/app/app-routing.module.ts
  - Copy the changes of https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/36783?_a=files&path=/ngo-client-core/src/main.ts
  - Remove Azure App permission: Microsoft Graph Mail.Read (Application)
  - [Optional – used for Outlook add-in] Add Azure App permission: Microsoft Graph Mail.Read (Delegated)
  - Tell your PM: the manifest file of Outlook add-in should be updated and then reinstall it (see the changes, removing the hash from URLs)
  - Add to all appsettings.json files and Azure App Settings:
"Core:CspAdditionalFrameSrc" : ""
  - This setting can be updated to allow additional iframe/frame sources as needed. Multiple sources should be separated by a semicolon (;)
https://trello.com/c/lkMwkFgl [S] Update config of Core Analyse tables on Current sprint - Core | Trello
If there are any customizations related to BaseConfigurationRepository's entityViewDefinitions (e.g., custom entity definitions such as SvK), please update them according to the changes in this card, following the same approach used for the custom tabs and tab functions
https://trello.com/c/oXjpiYoC/5540-mlogframe2-indicator-tracker-export-to-excel-include-fields-configured-in-the-popup [M][Logframe2] Indicator tracker, Export to Excel, Include fields configured in the popup on Current sprint - Core | Trello
If GetLogframe2IndicatorTrackers is customized in the client project, adapt this card's PR changes to it.
https://trello.com/c/zGX0IkPt/5554-tlogframe2-base-url-confusion [T][Logframe2] Base url confusion on Current sprint - Core | Trello
[For upgraded person] remove logframes2 from environment files
https://trello.com/c/nf6rp5uP/5549-s-cleanup-role-field-mappings-in-core-script [S] Cleanup Role/field mappings in core script on Current sprint - Core | Trello
[For upgraded person] After cleanup role Member connected with Field Definition Id, we will add Role Member with Field Definition Id is
Null for what we removed, so if client not used this Member role in any entity type added , please create script to remove to override seed data from Core
(CoreRoleEntityDefinitions Id from 50 -> 58)
https://trello.com/c/ZaYUjvzM/5544-s-logframe2-generate-fields-by-sortorder-instead-of-label [S] [Logframe2] Generate fields by SortOrder instead of Label on Current sprint - Core | Trello
If GetLogframe2IndicatorTrackers is customized in the client project, adapt this card's PR changes to it.
Write a script/tool to collect existing embedded URLs for CSP configuration - https://trello.com/c/QlrpCYr1/5777-write-a-script-tool-to-collect-existing-embedded-urls-for-csp-configuration
[For deployment person][AfterDeployment] Run script ExportCspAdditionalFrameSrc.sql in the PR attached card, then copy the value of CspAdditionalFrameSrc into "Core:CspAdditionalFrameSrc" on Azure/App Service (Check the verification results before copying): https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/38994

9.1.0
https://trello.com/c/HRVFghna/5454-s-add-new-relatedentity-fields-to-log-log2-log3
If you want the field is multiple, change type of field instances in code
[8][M] Files uploaded using "mark as paid" or "mark as cancelled" should be copied to 99 approval on Current sprint - Core | Trello - https://trello.com/c/r6gg5amB/5499-8m-files-uploaded-using-mark-as-paid-or-mark-as-cancelled-should-be-copied-to-99-approval
Add new system config SPSignedOffAdditionalDocumentsFolderName to control the optional approval subfolder for "Mark as Paid" or "Cancel" actions.
Default: "Additional documents". Can be changed or set empty per client needs. Please ask client's PM/ AM about this before running tool below
[After Deployment] Check if the client uses "Mark as Paid" or "Cancel" on payments.
If yes, update appsettings.json and run:
NGO.Core.Tools.UpdatePaymentDocumentLinks
Update/Add nuget package "Microsoft.EntityFrameworkCore.Design" version 10.0.7 for NGO.API
Update/Add nuget package "Microsoft.EntityFrameworkCore.Tools" version 10.0.7 for NGO.API
[For upgrade person] If your computer is installed both EF Core and EF 6, use "EntityFrameworkCore\Add-migration" to make sure it will using EF Core instead of EF 6 by default
https://trello.com/c/2WTobq0v/5509-4s-logframe-report-on-indicators-text-previous-period-showing-pen-icon
Datafix 20260527_UpdateIconForNewTextAreaControl.sql is setting characteristic "iconWhenHaveValue" and "iconWhenHaveNoValue" = "pen" by default. If client is using another icon (means current characteristic "iconWhenHaveValue" is null or empty, "iconWhenHaveNoValue" is null or empty but "fileIcon" have value), dev needs to manually update "iconWhenHaveValue" and "iconWhenHaveNoValue" = value of "iconWhenHaveValue"
https://trello.com/c/3TaYSPQr/5519-slogframe2-migration-tool-for-saved-analyse-queries [S][Logframe2] Migration tool for saved analyse queries on Current sprint - Core | Trello
If using Logframe2: Run NGO.Core.Tools.Logframe2SavedQueryMigration to verify and migrate saved analysis queries from Logframe1. Please start with review mode, resolve all warnings (search for "See warnings for details" in console or log file), then run update mode.
  1. "Missing analyse table relation for …": Add the corresponding analyse table relation for Logframe2
  2. "Missing analyse column for field …": Identify the new field in the relevant tab function and add it as new analyse column
  3. "Unable to determine if field …": Check CoreAnalyseLogframeObjectiveView (Core/Client if available) to determine whether the field belongs to the Objective or Indicator table
    1. Add to IndicatorStructureFields if it belongs to Indicator
    2. Add to ObjectiveStructureFields if it belongs to Objective
  4. If any structure fields were renamed in Logframe2, remap them in IndicatorStructureFieldMappings or ObjectiveStructureFieldMappings

9.0.0
[L] Create tables for workflow instances - https://trello.com/c/8ysaSC9M/5247-l-create-tables-for-workflow-instances
[For Deployment Person]
After deployment, the ConvertWorkflowInstanceJsonConfigToTables tool must be executed to migrate existing workflow instance JSON configurations into the new database tables (CorePhaseInstances and CorePhaseTemplateInstances).
If this migration is not performed, workflow cycle data will not be displayed correctly in the Workflow Cycle tab.
https://trello.com/c/KEiWbbxf/5340-remove-deprecated-componentfactoryresolver-and-entrycomponents
BREAKING CHANGE
InfoFieldFactory.getComponentFactory() has been renamed to getComponentType().
  - Previous: ComponentFactory<any>
  - New: Type<any>
Fix deprecated linting on Current sprint - Core | Trello - https://trello.com/c/BTuoUrxo/5339-fix-deprecated-linting
Angular ESLint Migration
Delete Files
  - ngo-client/src/tslint.json
  - ngo-client/tslint.json
Add File
  - ngo-client/.eslintrc.json
Update angular.json
Under projects.ngo-nxt.architect, add the following lint configuration after the test property:
Update package.json
Copy the entire devDependencies section from Core to ensure all required ESLint packages and dependencies are included.
Modernize Angular Dependencies and Migrate from ngx-contextmenu - https://trello.com/c/lQlJG97e/5346-modernize-angular-dependencies-and-replace-ngx-contextmenu
Package Updates
  - Upgrade @angular/cdk to v15.2.0
  - Upgrade @angular/animations to v15.2.10
  - @angular/flex-layout
  - ngx-contextmenu
Context Menu Migration
If the client contains custom context menu implementations, they must be updated.
BREAKING CHANGE
Context menu usage has changed:
  - Replace <context-menu> with <ngo-context-menu>
  - Replace contextMenuItem with ngoContextMenuItem
All custom context menu implementations should be reviewed and updated accordingly.
Update spinner, remove and update some libraries on Current sprint - Core | Trello - https://trello.com/c/0bPuztpq/5370-update-spinner-remove-and-update-some-libraries
  - Replace the entire dependencies section with the version from Core.
  - Replace the entire devDependencies section with the version from Core.
  - Replace the contents of polyfills.js with the version from Core.
Update angular.json
  - "node_modules/ngx-spinner/animations/ball-clip-rotate-multiple.css"￼
  - Update compilerOptions.lib:
Old: "lib": ["es2018", "dom"]
New: "lib": ["ES2022", "dom"]
[40][XL] Draft and Published workflow on Current sprint - Core | Trello - https://trello.com/c/PMVHjHDi/5294-40xl-draft-and-published-workflow
Queue Configuration Changes
[For Upgrade Person]
  - "SyncPublishedWorkflowQueue": "syncpublishedworkflowqueue"￼
[For Deployment Person]
Add the following Azure App Setting:
This setting must be configured in the Azure environment to ensure the queue is available after deployment.
Dotnet 10 on Current sprint - Core | Trello - https://trello.com/c/bbLvYOTe/5395-dotnet-10
For Upgrade Person
Before upgrading any Core packages, update all projects to target .NET 10.0.
Build Pipeline Changes
Update build-pipeline-api.yml:
Old
netVersion: '8.0'￼
New
netVersion: '10.0'￼
This change must be completed before proceeding with the Core package upgrade to ensure compatibility with the latest platform requirements.
For Deployment Person
  - Update the Azure App Service / Web App runtime to .NET 10.
  - Ensure build agents and deployment pipelines are compatible with .NET 10. (check build-pipeline-api.yml)
Use node 18 on Current sprint - Core | Trello - https://trello.com/c/TPqvvxaD/5338-use-node-18
Update build-pipeline-angular.yml:
Change nodeTool task to:
- task: NodeTool@0
inputs:
versionSpec: '18.20.0'
displayName: 'Install Node.js'
Remove npm@1 task "npm version"
https://trello.com/c/2V8JXW45/5373-user-tracking-in-application-insights
Update package.json:
Remove "@types/applicationinsights-js": "^1.0.9" from dependencies and devDependencies
Remove "applicationinsights-js": "^1.0.20"
Add "@microsoft/applicationinsights-web": "^3.0.4"
[L] Write with AI on Current sprint - Core | Trello - https://trello.com/c/4hW1CK8s/5348-l-write-with-ai
This feature may incur subscription costs. Please make sure to confirm that the customer wants to use it before upgrading.
[For Upgrade Person]
  - aiwriter: 'api/core/aiwriter'
If Client don’t use AI function, ignore these steps bellow
  1. Update the system configuration “AIConfiguration” and set UsingWriteWithAI to true.
  2. Create a Microsoft Foundry resource. (or using existing resource) (https://ai.azure.com/nextgen/r/,-,,-/allresources)
  3. Go to Deployment → Deploy model → Deploy base model (fine-tune it if the client has a model that needs fine-tuning).
  4. Select the LLM model you want to use (the core system currently uses GPT-5) → confirm the deployment.
  5. Save the endpoint and deployment name of the model. (need to use later), Important: Use the Azure OpenAI v1 endpoint instead of the Foundry project endpoint.
  6. Go to the Azure Portal → Foundry. Search for the Foundry resource you created → Access Control → Role assignments.
  7. Grant the “Cognitive Services OpenAI Contributor” role to the Entra App client being used.
  8. Edit appsettings and add the following settings to the Core section:
"AzureOpenAISettings":{
"Endpoint": "your-end-point",
"DeploymentName": "your-delployment-name"
},
  1. Add a variable with the key Core:AzureOpenAISettings:Endpoint the value will be endpoint of foundry
  2. Add a variable with the key Core:AzureOpenAISettings:DeploymentName the value will be deployment name of foundry
Use security headers on Current sprint - Core | Trello - https://trello.com/c/6f8iAPDE/5396-use-security-headers
[Upgrade]
NGO.API web.config:
Add removeServerHeader="true" to <system.webServer><security><requestFiltering> element.
Add after <system.webServer><security>…</security>:
<httpProtocol>
<customHeaders>
<remove name="X-Powered-By" />
</customHeaders>
</httpProtocol>
Index.html:
Update link tag for bootstrap css to:
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
Add Content Security Policy on Current sprint - Core | Trello - https://trello.com/c/gbxUhjrV/5398-add-content-security-policy
[Upgrade]
Index.html:
Remove script block
<script type="text/javascript">
// Notice how this gets configured before we load Font Awesome
//window.FontAwesomeConfig = { autoReplaceSvg: false }
</script>
Main.ts:
Change "addinLoadingElement.innerHtml = msg;" to "addinLoadingElement.textContent = msg;"
Add below "script.src = 'https://appsforoffice.microsoft.com/lib/1/hosted/office.js';" :
const cspNonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content');
if (cspNonce) {
script.setAttribute('nonce', cspNonce);
}
Angular.json:
Update architect.build.configurations.optimization from "optimization": true,
to
"optimization": {
"scripts": true,
"styles": {
"minify": true,
"inlineCritical": false
},
"fonts": true
},
Assets/skins/content/default/custom.css:
Replace the entire file contents from the same file in ngo-online-core repository.
Customizations:
Check if there are any customizations with html containing tags like this: <a href="javascript:void(0);">
It should be replaced with <button class="inline-btn">
https://trello.com/c/smEcBFh4/5352-8s-connecting-the-workflow-and-task-templates-in-the-admin-ui
[Upgrade]
Import the icon "faExternalLink" in app.module (from '@fortawesome/pro-light-svg-icons)
[Admin/Help documentation] Lost icons in context box on Current sprint - Core | Trello - https://trello.com/c/2ypPJZpN/5443-admin-help-documentation-lost-icons-in-context-box
[Upgrade]
Index.html:
Add this link below the existing bootstrap css link:
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" integrity="sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN" crossorigin="anonymous">
https://trello.com/c/nJN3ds0U/5296-m-transaction-made-from-funding-plan-should-have-source-entity-currency
[Deployment]
Run Sharepoint to update Word templates
https://trello.com/c/kSSati11/5376-8m-expanded-workflow-history
[Deployment]
- Activate Workhistory tab in Workflow cycle Entity (Manual check if workflow cycle tab enabled in Admin UI / Entities)

8.10.0
[Resource String/ Email] Failed to get resource string value for email title when title has configured [[TabDefinitionName]] on Current sprint - Core | Trello - https://trello.com/c/xBxUjtSz/4394-resource-string-email-failed-to-get-resource-string-value-for-email-title-when-title-has-configured-tabdefinitionname
[Before Deployment] Check in client code scripts and remove resource string keys with '_in_email' suffix

8.9.0
https://trello.com/c/WP3RDffZ/5605-analyse-and-inactive-users
If you want to show Inactive user from UserOptions, put this flag to CoreAnalyzeColumns' FieldCharacteristic
FieldCharacteristic.isAlwaysShowInactive = true
[4][S] Idea Task - Reassign: sent emails should be more precise on Current sprint - Core | Trello - https://trello.com/c/9s2Srmf1/5508-4s-idea-task-reassign-sent-emails-should-be-more-precise
If client projects use custom email templates with tokens like [[TaskFlow.Submitter.Name]], [[FundingIdea.CreatedBy.Name]], or [[Idea.CreatedBy.Name]], please check if they should be updated to [[TaskActorName]] instead.
https://trello.com/c/dYcw3tZP/5652-s-analyse-support-more-field-characteristic-for-configoptions
- If you want to show Inactive user from ConfigOptionsMapper, put this flag to CoreAnalyzeColumns' FieldCharacteristic
FieldCharacteristic.isAlwaysShowInactive = true
- If you want to enable Readonly options of ConfigOptionsMapper, put this flag to CoreAnalyzeColumns' FieldCharacteristic
FieldCharacteristic.readOnlyOptionIncluded= true

8.8.0
https://trello.com/c/bd3CO8en/5558-s-browse-list-when-zoomed-in-the-first-filters-are-shown-in-the-second-row-not-the-last-filters-why [S] Browse list : when zoomed in, the first filters are shown in the second row, not the last filters, why? on Current sprint - Core | Trello
  - Wrap all fields in <div class="browse-filter-layout">
  - Add [flattenIntoParentFlow]="true" to ngo-list-filter.
  - Remove all "pull-right" or "pull-left" classes in other fields
  - pull-right:
    - Reorder other fields
  - pull-left
    - Add class = "filter-align-left" to new div above

8.6.0
https://trello.com/c/HRVFghna/5454-s-add-new-relatedentity-fields-to-log-log2-log3
If you want the field is multiple, change type of field instances in code
[8][M] Files uploaded using "mark as paid" or "mark as cancelled" should be copied to 99 approval on Current sprint - Core | Trello - https://trello.com/c/r6gg5amB/5499-8m-files-uploaded-using-mark-as-paid-or-mark-as-cancelled-should-be-copied-to-99-approval
Add new system config SPSignedOffAdditionalDocumentsFolderName to control the optional approval subfolder for "Mark as Paid" or "Cancel" actions.
Default: "Additional documents". Can be changed or set empty per client needs. Please ask client's PM/ AM about this before running tool below
[After Deployment] Check if the client uses "Mark as Paid" or "Cancel" on payments. (select * from Coreentitytabs where TabFunctionId in( 35,132,136) and Active = 1) and check CoreRolePermissions as well for these tab functions.
If yes, update appsettings.json and run:
NGO.Core.Tools.UpdatePaymentDocumentLinks
https://trello.com/c/3TaYSPQr/5519-slogframe2-migration-tool-for-saved-analyse-queries [S][Logframe2] Migration tool for saved analyse queries on Current sprint - Core | Trello
If using Logframe2: Run NGO.Core.Tools.Logframe2SavedQueryMigration to verify and migrate saved analysis queries from Logframe1. Please start with review mode, resolve all warnings (search for "See warnings for details" in console or log file), then run update mode.
  1. "Missing analyse table relation for …": Add the corresponding analyse table relation for Logframe2
  2. "Missing analyse column for field …": Identify the new field in the relevant tab function and add it as new analyse column
  3. "Unable to determine if field …": Check CoreAnalyseLogframeObjectiveView (Core/Client if available) to determine whether the field belongs to the Objective or Indicator table
    1. Add to IndicatorStructureFields if it belongs to Indicator
    2. Add to ObjectiveStructureFields if it belongs to Objective
  4. If any structure fields were renamed in Logframe2, remap them in IndicatorStructureFieldMappings or ObjectiveStructureFieldMappings

8.4.0
[1][S] Update Google Analytics script in Core on Current sprint - Core | Trello - https://trello.com/c/oRXh5Tui/5364-1s-update-google-analytics-script-in-core
Remove this from src/index.html:
<!-- Global site tag (gtag.js) - Google Analytics -->
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
</script>

8.3.0
https://trello.com/c/AKettC6e/5344-analyse-task-as-primary-table-user-should-not-see-the-tasks-belong-to-the-entity-they-have-not-access-permission
Adjusted DB FUNCTION GetTaskThatUserHasViewPermission , so if client overrides it, please inner join Tasks table with CoreEntities to make sure only view accessable entities //Uyen
[S] Default page is not loaded when user inputs incorrect URL - https://trello.com/c/Hc0tfMNW/5326-s-default-page-is-not-loaded-when-user-inputs-incorrect-url
Find app-route.service.ts and add:
{ path: '**', redirectTo: 'start' }
at below of 'outlook-addin' route, the new route and outlook addin route should be same level.
https://trello.com/c/WW0cQyqK/5315-potential-bug-sp-groups-in-the-main-site-collection-may-hit-limits-if-too-many-ideas-or-funding-ideas-are-added
[For deployment person] [BeforeDeployment] Before creating deployment in Release, please edit and update variable first as follow: Core:Deployment:DeploySPFieldsAndCTypesEnabled with value of true. Remember to revert it back to original when the deployment process was done.
  - App console with action "BeforeDeployment": could be skipped if your client doesn't have issue of running out of SP groups. This action to move idea's folders to other site collections. If skipped, let ignore DisableInfraSetup and MigratedIdeas settings.
  - App Console with action "AfterDeployment": The same tool but this is another action. This action to migrate idea members system config to new place.

8.2.0
[S]ADSync webjob: Exception when deleted user has no UserPrincipleName on Current sprint - Core | Trello - https://trello.com/c/TxcBtgjh/5263-sadsync-webjob-exception-when-deleted-user-has-no-userprinciplename
[For deployment person] update appsetting.json then run tool NGO.Core.Tools.SetAzureAdIdForUser to set AzureAdId for CoreUsers. After run tool, make sure all row in AzureAdId in CoreUsers have value (we will missing deleted User in Azure https://portal.azure.com/#view/Microsoft_AAD_UsersAndTenants/UserManagementMenuBlade/~/DeletedUsers). If such user exists, manually update AzureAdId for that user
https://trello.com/c/HC8irSiM/5111-logframe-upgrade-migration-scripts-when-move-to-logframe-2
[If using Logframe2] Read and manual run 20250917_DisableLogframe1.sql

8.1.0
[S] Enable finance tabs + functionality on Emergency & Non-Project entities - https://trello.com/c/rWZ324Al/5257-s-enable-finance-tabs-functionality-on-emergency-non-project-entities
  1. Update app.module.ts:
    - Add EmergencyFinanceModule, NonProjectFinanceModule to @NgModule
  2. Add API URL to environment files:
    - nonProjectFinance: 'api/core/entity'- Ensure Entra App Registration has permission `Mail.Read` (type: Application, granted admin consent)
    - emergencyFinance: 'api/core/entity'

8.0.0
[XL] Frontend upgrade - https://trello.com/c/JztEuIaT/4892-xl-frontend-upgrade
Please see Upgrade Angular 10-15.docx - https://precio.sharepoint.com/:w:/r/sites/ngo-oonline/Shared%20Documents/03%20Core%20development/Technical/Upgrade%20Angular%2010-15.docx?d=wd0609985354946cd89c94f86f1f55831&csf=1&web=1&e=t7oIrs for detailed upgrade instructions
Src/styles.css
remove import of bootstrap: ￼@import url("https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css");
Add at the end of the file:
/* Override to adapt for Bootstrap 5 */
.modal-backdrop {
z-index:1050 !important;
}
https://trello.com/c/yRWF604C/5145-page-import-ideas-ideas-entity-always-auto-generates-entity-number
Check if any custom or reuse AddIdea or AddFundingIdea that cannot generate entity number for these entities, and use sequenceNumberService to handle that
  - Run SharePoint Deployment
  - Update Azure setting: Core:Queue:IATITransactionImportQueue
  - Update appsetting files: "IATITransactionImportQueue": "iatitransactionimportqueue-dev-nidy"
[S] Task - Check list: improve comment text box to support multi-line - https://trello.com/c/OiqTNcWl/4899-s-task-check-list-improve-comment-text-box-to-support-multi-line
If client want to change the number of characters in quick view of checklist’s comment, they need to change maxCharacters of 2 field location: ID 21121(edit form) and 21122(View form). Default is 250 characters.
[L] Idea and FundingIdea document permissions should be specific for each entity - https://trello.com/c/yU7W4yZ2/4893-l-idea-and-fundingidea-document-permissions-should-be-specific-for-each-entity
[After deployment] Update all settings in appsettings.json the same as your environment and run NGO.Core.Tools.UpdateIdeaMembers
Note: skip this deployment note if you are updating to 8.3 or above (if true, let follow the new deployment note of 8.3)
[L] Minimum requirements function (aka Audit Tool/Compliance tab) - https://trello.com/c/zaQdRlnz/5024-l-minimum-requirements-function-aka-audit-tool-compliance-tab
  1. Update app.module.ts:
    - Import faExclamationCircle as farExclamationCircle at the line ...from '@fortawesome/pro-regular-svg-icons'.
    - Add farExclamationCircle after faMoneyBill inside the constructor.
    - Add MinimumRequirementModule to @NgModule
  2. Add API URL to environment files:
    - adminMinimumRequirements: 'api/core/adminMinimumRequirements'
    - minimumRequirements: 'api/core/minimumRequirements'
https://trello.com/c/wxn79EfV/4981-loading-tabs-tabs-should-not-display-when-entity-page-is-loading
Check if your custom code using 'getCurrentConfiguration', if yes -> make sure having 'filter(config => config != null),'
[M] Create CoreLogframeIATIProvider on Current sprint - Core | Trello - https://trello.com/c/ar5AjGkl/4895-m-create-corelogframeiatiprovider
[For deployment person]
[After deployment] In 20251015_AddCodeToLogframeLevelInput.sql Update (4) to list id of Objective level that is input (not have target or reporting period), and manual run script.
  1. Update app.module.ts:
  2. Import faLock at the line ...from '@fortawesome/pro-light-svg-icons'
  3. Add faLock inside the constructor.
[8][S] Extend the "Core API Versions" function to include more info and add security on Current sprint - Core | Trello - https://trello.com/c/WvuRXkYJ/5059-8s-extend-the-core-api-versions-function-to-include-more-info-and-add-security
[Before deployment]
  1. In App roles, add a role with both DisplayName and Value = "AppOnly". Allowed member types = Applications.
  2. In API permissions, Add permission. Select My APIs, then NGO, Application permissions and then AppOnly.
  3. This permission requires Admin consent which might have to be requested from a client admin.

7.7.0
https://trello.com/c/AKettC6e/5344-analyse-task-as-primary-table-user-should-not-see-the-tasks-belong-to-the-entity-they-have-not-access-permission
Adjusted DB FUNCTION GetTaskThatUserHasViewPermission , so if client overrides it, please inner join Tasks table with CoreEntities to make sure only view accessable entities //Uyen
[S] Default page is not loaded when user inputs incorrect URL - https://trello.com/c/Hc0tfMNW/5326-s-default-page-is-not-loaded-when-user-inputs-incorrect-url
Find app-route.service.ts and add:
{ path: '**', redirectTo: 'start' }
at below of 'outlook-addin' route, the new route and outlook addin route should be same level.

7.6.0
[S]ADSync webjob: Exception when deleted user has no UserPrincipleName on Current sprint - Core | Trello - https://trello.com/c/TxcBtgjh/5263-sadsync-webjob-exception-when-deleted-user-has-no-userprinciplename
[For deployment person] update appsetting.json then run tool NGO.Core.Tools.SetAzureAdIdForUser to set AzureAdId for CoreUsers. After run tool, make sure all row in AzureAdId in CoreUsers have value (we will missing deleted User in Azure https://portal.azure.com/#view/Microsoft_AAD_UsersAndTenants/UserManagementMenuBlade/~/DeletedUsers). If such user exists, manually update AzureAdId for that user
https://trello.com/c/HC8irSiM/5111-logframe-upgrade-migration-scripts-when-move-to-logframe-2
[If using Logframe2] Read and manual run 20250917_DisableLogframe1.sql

7.5.0
[S] Enable finance tabs + functionality on Emergency & Non-Project entities - https://trello.com/c/rWZ324Al/5257-s-enable-finance-tabs-functionality-on-emergency-non-project-entities
  1. Update app.module.ts:
    - Add EmergencyFinanceModule, NonProjectFinanceModule to @NgModule
  2. Add API URL to environment files:
    - nonProjectFinance: 'api/core/entity'
    - emergencyFinance: 'api/core/entity'
https://trello.com/c/mysZCJvG/3719-finance-budget-edit-form-reffield-options-in-2nd-3rd-levels-cannot-be-saved
If client extended BudgetFormComponent, should follow Core code to fix the problem in card.

7.3.1
[S] Logframe - Update the Objective form for standard/custom indicators to support similarly behaviour as with Indicators on Current sprint - Core | Trello - https://trello.com/c/1b8XAqaw/5107-s-logframe-update-the-objective-form-for-standard-custom-indicators-to-support-similarly-behaviour-as-with-indicators
If user want to have this new behaviour, pls follow dev notes checklist

7.3.0
Logframe2 - Separate objective and structure tab functions and fields - https://trello.com/c/eEdN0vxG/5080-logframe2-separate-objective-and-structure-tab-functions-and-fields
If logframe1 is used: override entity-route.service.ts and replace 'logframe' path with logframeRouteService, also add always-run core override script '20250930_DisableLogframe2.sql'
If logframe2 is used: manual run after script '20250917_DisableLogframe1.sql'
[M][Logframe 2] Display correct period labels in UI based on each indicator's frequency on Current sprint - Core | Trello - https://trello.com/c/Rr0Rrrxh/5028-mlogframe-2-display-correct-period-labels-in-ui-based-on-each-indicators-frequency
[For deployment person]
[After deployment] In 20251003_EnsureFrequencyIndicator.sql Update (4) to list id of Objective level that is input (not have target or reporting period), and manual run script. To ensure every indicator have frequency. Then run the tool below
[After deployment] Only run tool after ensure indicator frequency. Update appsettings.json and manual run the tool: NGO.Core.Tools.RebindPeriodNameForIndicatorTargetReport

7.2.0
  - Overrides LandscapeFunctionIds in ExportPdfService to support landscape by tabid
Update Documents/PdfTemplates/ExpenditureTaskTemplate.docx follow client requirement
  - Run SharePoint Deployment
  - P/S: this SQL After-script will run automatically if PdfTemplates on CoreTaskApprovalSettings is null or empty.
20250801_SetupPartnerExpenditureApprovalScreenshotTemplate.sql
[M][Funding & Summary] [Income planned vs received] overview box
https://trello.com/c/ngBU5eEx/4967-mfunding-summary-income-planned-vs-received-overview-box
[For upgrade person] Find the text 'DateAndValueFields' in your custom SQL scripts, if any, please update it to the new format (see new config format in the description of card)
[M] Outlook add-in stops working due to recent MS changes on Current sprint - Core | Trello - https://trello.com/c/IWyi7qRy/5035-m-outlook-add-in-stops-working-due-to-recent-ms-changes
[For deployment person] Ensure in API permission of entra app registrations has permission Mail.Read (type: Application) and Granted admin consent

7.1.0
[M] IATI Feedback 5 on Current sprint - Core | Trello - https://trello.com/c/Iaf6xZRx/4900-m-iati-feedback-5
  1. Update appsettings.json Files:
    - Add a configuration with the key MaxEmailAttachmentFileSizeMb for appsetting.json of webjob and api. This config defines the maximum size of file will be sent in email of IATI export. Depending on the customer's requirements (if any), if there are no requirements, the default value will be 20.
  1. Update Azure Portal:
    - Add a variable with the key Core:MaxEmailAttachmentFileSizeMb and the value can be obtained from the appsettings.json .
[S] Breakdown template populates incorrectly for new custom indicator - https://trello.com/c/G3oJ247Y
[Before Deployment] Run DataFix/20250319_InactiveGlobalIndicatorOfCustomGlobalObjectiveField.sql if client using Custom global objective field

7.0.0
  - Upgrade to .NET 9
    - Find and replace net8.0 with net9.0 in all .csproj files before installing NuGet packages.
    - Update netVersion parameter in build-pipeline-api.yml from 8.0 to 9.0.
    - Update EF tool version in build-pipeline-api.yml:
      - Task: Install dotnet-ef
      - Change version from 8.0.7 → 9.0.1.
    - [New Step – 29/09/2025]: Update the .NET Version of the web service in Azure to .NET 9.
IATI modular (https://trello.com/c/BOBvztKJ/4767-l-logframe-new-reporting-form)
Configuration
- Add to all appsettings.json files and Azure App Settings:
- Update environment.ts & environment.prod.ts:
- Update App.module.ts
- Manual SQL Script (Run Before Deployment)
DELETE FROM CoreFieldInstances WHERE Id IN (21355, 21356)
[For deployment person] check if release pipeline / deployment appsettings.json having Core:Deployment:DeploySPFieldsAndCTypesEnabled false -> if so please add Core:Deployment:DeploySPFieldsAndCTypesEnabled true to the release pipeline, and turn the setting back when the deployment done.
https://trello.com/c/BOBvztKJ/4767-l-logframe-new-reporting-form
Import 'faCommentLines' from '@fortawesome/pro-light-svg-icons'
Add 'faCommentLines' to library.addIcons
[M][PRJ18] Finance, Expenditure, ability to Import expenditure - https://trello.com/c/c3mWmh4b/4349-mprj18-finance-expenditure-ability-to-import-expenditure
Remember to copy environment.prod.ts
partnerExpenditureImport: 'api/core/entity',
  - Import PartnerExpenditureReportingImportModule in app.module.ts.
[M] Import / export logframe reporting - https://trello.com/c/kgHs7HMX/4768-m-import-export-logframe-reporting
[For deployment person] check if release pipeline / deployment appsettings.json having Core:Deployment:DeploySPFieldsAndCTypesEnabled false -> if so please add Core:Deployment:DeploySPFieldsAndCTypesEnabled true to the release pipeline, and turn the setting back when the deployment done.
Remember to copy environment.prod.ts
logframeImported: 'api/core/entity',
Override LogframeExcelService -> can Override SetupReadonlyFieldByDependencies() to update property FieldDependencies ) to disable an actual fields based on Indicator Type
Exp: In MCC, Numfields is only show if Indicator is Text and Ref, so
public virtual Dictionary<string, string> FieldDependencies
{
get => _fieldDependencies;
set => _fieldDependencies = value ?? new Dictionary<string, string>
{ { "numField1", "3;5" }}
}
[M][SUM07] Finance, Summary, Total funding by status box - https://trello.com/c/Z2MCSGrO/4235-msum07-finance-summary-total-funding-by-status-box
  - summary: 'api/core/summary'
[L] Logframe - Updated layout logframe structure - https://trello.com/c/FyjrMfP7/4645-l-logframe-updated-layout-logframe-structure
Add API url to environment files:
logframes2: 'api/core/entity'
  - Import Logframe2Module in app.module.ts.
[M] Can we drag and drop folders on Current sprint - Core | Trello - https://trello.com/c/CLajr9Or/4495-m-can-we-drag-and-drop-folders
Add the following to dependencies to frontend package.json_
"ng2-file-upload": "^1.3.0"
"ngx-file-drop": "^10.0.0"
Remove the dependency "ngx-uploader".
[M] Manage Site Collection improvement - https://trello.com/c/b85jr09i/4729-m16-manage-site-collection-improvement
Add key "Core:Queue:ReminderTaskDeadlineQueue", value "remindertaskdeadlinequeue" in appsettings and azure

6.4.0
[Logframe/Indicator Tracker] ID of global objective is displayed unexpectedly on at number objective field when number objective is blank on Current sprint - Core | Trello - https://trello.com/c/Y08Mqgwi/4207-logframe-indicator-tracker-id-of-global-objective-is-displayed-unexpectedly-on-at-number-objective-field-when-number-objective-i
If in client project customs GetLogframeIndicatorTrackers procedure, update isnull(obj.ObjectiveNo, glObj.ObjectiveNo) to obj.[ObjectiveNo] (changes in PR: Pull request 23454: [Logframe/Indicator Tracker] ID of global objective is displayed unexpectedly on at number objective field when number objective is blank - Repos (azure.com) - https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/23454)
Logframe periods missing - https://trello.com/c/Qb4gdJRj/4750-logframe-periods-missing
[For deployment person]
[After deployment] update appsettings.json and manual run the tool: NGO.Core.Tools.GenerateMissingReports
Reason: To add missing reporting in head for current logframe version

6.3.0
https://trello.com/c/hFFsC2Vh/3876-partner-expenditure-some-issues-related-to-shortening-end-date-adjust-the-start-date
[Required] Update appsettings.json (Queue names, CoreContext, AzureWebJobsStorage, keep 'RemoveRedundantPeriods': false) and run the Tool: UpdateExistingPartnerExpenditureReportings
[Optional] Turn on the setting RemoveRedundantPeriods in appsettings.json if client requests to remove reporting periods that are outside of current published budget periods (e.g. user extends Entity EndDate and haven't published new budget version before this card's release, reporting periods are longer/outside than budget period will be removed)

6.2.0
https://trello.com/c/VNp6VTqS/4683-budget-incoming-funding-confirmed-incoming-funding-displays-into-version-that-allocation-is-created-havent-approved
if you want to fix AllocationDate wasn't updated in confirmed Allocations, run script Datafixes/20250122_FixAllocationDateNotBeUpdatedWhenTaskApproved.sql
[Tasks/Created from] Implement for Income Schedules on Current sprint - Core | Trello - https://trello.com/c/S27nsFJY
[For upgrade person] Characteristic for fieldInstanceId 22538 add highlight text: {"readOnly": "true", "isHideIfNoValue": true, maxCharacters:50, "taskLinkFormat":[{tabDefinitionId: 2, fieldName: "description"}, {tabDefinitionId: 8, fieldName: "description"}, {tabDefinitionId: 15, fieldName: "description"}, {tabDefinitionId: 24, fieldName: "description"}, {tabDefinitionId: 10, fieldName: "name"}, {tabFunctionId: 44, fieldName: "name"}]}
[Search] If we allow to preview document, we should let user do something on preview dialog - https://trello.com/c/uHUFPYZY
Add import of faExternalLink from '@fortawesome/pro-light-svg-icons' + add to constructor in app.module.ts
[M] Can we move the LockRelatedDocuments function to ScreenshotQueue upon task completion? - https://trello.com/c/8LmfSkcD/4682-m-can-we-move-the-lockrelateddocuments-function-to-screenshotqueue-upon-task-completion
We move the code Lock documents to webjob so please check customization in client, if using FolderPathWithoutRoot, move that code to OnAfterSaveScreenshot instead of OnTaskApproved . Because not sure screenshot webjob has finished before using FolderPathWithoutRoot for the custom purpose

6.1.0
[S][8] Task - Check list disappear when pressing save in Agreement on Current sprint - Core | Trello - https://trello.com/c/UA9vmHUi/4585-s8-task-check-list-disappear-when-pressing-save-in-agreement

6.0.0
[L] Generated migration templates + Entity import Admin UI page - https://trello.com/c/ASsnivvK/4414-l-generated-migration-templates-entity-import-admin-ui-page
  1. Update app.module.ts:
    - Import faCloudUploadAlt at the line ...from '@fortawesome/free-solid-svg-icons'.
    - Add faCloudUploadAlt after faTh inside the constructor.
  2. Add API URL to environment files:
    - pageImport: 'api/core/pageImport'
  3. Add new queue for web job:
    - Inside the Queue section in all appsettings.json files, add the key PageImportAddDataQueue with the value pageimportadddataqueue.
  - Add the key Core:Queue:PageImportAddDataQueue with the value pageimportadddataqueue in Azure AppService.
[M] Extract current monitoring boxes to be overview boxes - https://trello.com/c/ueMy1fsk/4234-m-extract-current-monitoring-boxes-to-be-overview-boxes
  1. Update app.module.ts:
    - Import FinanceMonitoringModule in app.module.ts.
  2. Add API URL to environment files:
    - financeMonitoring: 'api/core/entity'
  3. Find and correct the Location column of CoreOverviewBoxDefinitions in your custom deployment script (if any):
    - startpage (old value = 3) -> 1 (new value)
    - both (old value = 1) -> 3 (new value)
[L] [PAY06] Finance, Payments, Add option to cancel an approved payment - https://trello.com/c/0yPjPHbL/4532-l-pay06-finance-payments-add-option-to-cancel-an-approved-payment
[For Upgrade Person]
  1. Cancel Payment:
  2. If the client already has the Cancelled option, remove the Custom Cancelled option and use the Core Cancelled option (Id = 2401). Migrate the Custom Id to Core Id.
  3. If the client does not use the Payment status option list (Id = 62), update the Core Cancelled option to the correct option list.
  4. Activate Cancel Option:
    - Run the following SQL command:
    - This function needs to be activated manually by enabling permission (permission tab on admin) and the tab in the entity.
  5. Activate Tab on Project:
    - Change the EntityId value if you want to activate it on other entities:
  6. Mark as Paid Payment:
  7. Follow the same steps as for Cancel Payment, but use Paid option Id = 2402 and tab function Id = 136.
[L][16] Email notification when a deadline is approaching - https://trello.com/c/qjCWUrPj/4574-l16-email-notification-when-a-deadline-is-approaching
  - Adding new key name "ReminderTaskDeadlineSchedule to configuration of appsetting.json of webjobs, the value default is "0 2 * * *". Depending on the client's specific requirements, there may be a configuration adjustment for this scheduled interval.
  - Adding new key name "Core:ReminderTaskDeadlineSchedule" to configuration of Azure, the value default is "0 2 * * *". Depending on the client's specific requirements, there may be a configuration adjustment for this scheduled interval.
[M] Multi-language tool tip - https://trello.com/c/RMQDDdpv/4496-m-multi-language-tool-tip
  - Reformat all characteristics that are not in JSON format. You can run the script "SELECT * FROM CoreFieldInstanceLocations WHERE ISJSON(Characteristic) = 0" to identify the rows that need to be corrected. If there are too many rows to modify, you can limit your corrections to misformatted characteristics that include tooltipHover (add condition to check). The script 20241031_MoveTooltipHoverFromCharacteristicToProp.sql will run correctly when the rows with characteristics including tooltipHover are in the correct format.
Upgrade New Angular Version - https://trello.com/c/nGDBHSAB/4415-l-update-angular-version-to-102
  - See Upgrade Angular 9-10 - https://precio.sharepoint.com/:w:/r/sites/ngo-oonline/_layouts/15/Doc.aspx?sourcedoc=%7B3A8DD14E-2C32-4F08-989A-77F852621E0C%7D&file=Upgrade%20Angular%209-10.docx&action=default&mobileredirect=true
[M] Deputies: Add way for Admins to see who has been assigned as a deputy, and assign on behalf of someone else - https://trello.com/c/s2akaQFR/4416-m-deputies-add-way-for-admins-to-see-who-has-been-assigned-as-a-deputy-and-assign-on-behalf-of-someone-else
  - Add API URL to environment files: deputyAdministration: 'api/core/deputyAdministration',
[L][16] [PAY01] Finance, Summary, Payments master list - https://trello.com/c/wwXYGXZ2/4564-l-pay01-finance-summary-payments-master-list
  1. Update app.module.ts: import SummaryFinanceModule in app.module
Improved caching of env.config.json - https://trello.com/c/CCM7wUUw/4632-improved-caching-of-envconfigjson
  - Modify main.ts file according to the change in this PR: Pull request 26664: Testing caching of env.config.json - Repos - https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/26664?_a=files
[L] AD Sync / Connecting AzureAD-groups to global groups in NGO Online - https://trello.com/c/SBpeiTap
  - Update appsettings.json Files:
    - Inside the Queue section, add:
      - "ADSyncGroupsQueue": "adsyncgroupqueue",
      - "ADSyncUsersQueue": "adsyncuserqueue"
    - Inside the Core section, add:
      - "ADSyncGroupsSchedule": "0 */4 * * *",
      - "ADSyncUsersSchedule": "0 * * * *"
  - Update Azure AppService:
    - Add the following keys value:
      - "Core:Queue:ADSyncGroupsQueue": "adsyncgroupqueue",
      - "Core:Queue:ADSyncUsersQueue": "adsyncuserqueue",
      - "Core:ADSyncGroupsSchedule": "0 */4 * * *",
      - "Core:ADSyncUsersSchedule": "0 * * * *"

5.14.0
[Logframe/Indicator Tracker] ID of global objective is displayed unexpectedly on at number objective field when number objective is blank on Current sprint - Core | Trello - https://trello.com/c/Y08Mqgwi/4207-logframe-indicator-tracker-id-of-global-objective-is-displayed-unexpectedly-on-at-number-objective-field-when-number-objective-i
If in client project customs GetLogframeIndicatorTrackers procedure, update isnull(obj.ObjectiveNo, glObj.ObjectiveNo) to obj.[ObjectiveNo] (changes in PR: Pull request 23454: [Logframe/Indicator Tracker] ID of global objective is displayed unexpectedly on at number objective field when number objective is blank - Repos (azure.com) - https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/23454)

5.12.0
[Search] If we allow to preview document, we should let user do something on preview dialog - https://trello.com/c/uHUFPYZY
Add import of faExternalLink from '@fortawesome/pro-light-svg-icons' + add to constructor in app.module.ts
https://trello.com/c/VNp6VTqS/4683-budget-incoming-funding-confirmed-incoming-funding-displays-into-version-that-allocation-is-created-havent-approved
if you want to fix AllocationDate wasn't updated in confirmed Allocations, run script (we have the query to check if we have any data need to be correct on this script as well) Datafixes/20250122_FixAllocationDateNotBeUpdatedWhenTaskApproved.sql
[Tasks/Created from] Implement for Income Schedules on Current sprint - Core | Trello - https://trello.com/c/S27nsFJY
[For upgrade person] Characteristic for fieldInstanceId 22538 add highlight text: {"readOnly": "true", "isHideIfNoValue": true, maxCharacters:50, "taskLinkFormat":[{tabDefinitionId: 2, fieldName: "description"}, {tabDefinitionId: 8, fieldName: "description"}, {tabDefinitionId: 15, fieldName: "description"}, {tabDefinitionId: 24, fieldName: "description"}, {tabDefinitionId: 10, fieldName: "name"}, {tabFunctionId: 44, fieldName: "name"}]}
[M] Can we move the LockRelatedDocuments function to ScreenshotQueue upon task completion? - https://trello.com/c/8LmfSkcD/4682-m-can-we-move-the-lockrelateddocuments-function-to-screenshotqueue-upon-task-completion
We move the code Lock documents to webjob so please check customization in client, if using FolderPathWithoutRoot, move that code to OnAfterSaveScreenshot instead of OnTaskApproved . Because not sure screenshot webjob has finished before using FolderPathWithoutRoot for the custom purpose

5.11.0
[S][8] Task - Check list disappear when pressing save in Agreement on Current sprint - Core | Trello - https://trello.com/c/UA9vmHUi/4585-s8-task-check-list-disappear-when-pressing-save-in-agreement

5.10.0
  - Firstly, double check by running SQL select to verify if delta rows are generated unexpectedly.
  - Secondly, running SQL command in the description card to remove redundant delta row that should not be generated when the funding source is added as first time.

5.9.0
[S] Add acolumn headers to the columns in the My Tasks and Milestones box - https://trello.com/c/c6nTXpWO/4447-s-add-acolumn-headers-to-the-columns-in-the-my-tasks-and-milestones-box
  1. Before Deployment:
  2. Check CoreOverviewBoxFieldInstances Fields:
    - Use the following query to identify fields that are not in the correct JSON format:
    - SELECT * FROM CoreOverviewBoxFieldInstances ￼WHERE ISJSON(Characteristic) = 0 ￼AND OverviewBoxInstanceId IN (￼ SELECT Id ￼ FROM CoreOverviewBoxInstances ￼ WHERE OverviewBoxDefinitionId IN (7, 10, 60)￼)￼
    - Correct the identified fields to match the JSON format.
  3. After Deployment:
  4. Verify Task Overview Boxes:
    - Check if task overview boxes display correctly after deployment.
    - If they do not display correctly, use the following script to correct them:
    - UPDATE CoreOverviewBoxFieldInstances SET Characteristic = '{"isHideLabel": true}' WHERE Characteristic IS NULL AND OverviewBoxInstanceId IN ( SELECT Id FROM CoreOverviewBoxInstances WHERE OverviewBoxDefinitionId IN (7, 10, 60) )
  5. This approach is recommended because the bug was discovered after the card had already been released, so running this script manually is the preferred solution if version 5.9.2 has been deployed.

5.8.0
[S] Webjob Admin UI: Requeue timer trigger job - https://trello.com/c/fPHPi0cx/4413-s-webjob-admin-ui-requeue-timer-trigger-job
  1. Update appsettings.json Files:
  2. Inside the Queue section, add:
    - "WebJobExecutionCleanQueue": "webjobexecutionqueue",
    - "ExecUpdatestatQueue": "execupdatestatqueue"￼
  3. For Any Custom Scheduled Web Jobs:
  4. Add a queue triggered function with the same body as the scheduled function. Refer to WebJobExecutionCleanFunction.cs in Core for inspiration.
  5. Add the queue settings to appsettings.json for both the web app and web job program.
  6. Write a script to update all the types of web jobs in CoreWebJobs to the appropriate type, and add queues where they are missing.
  1. Update Azure AppService:
  2. Add the following keys:
    - "Core:Queue:WebJobExecutionCleanQueue": "webjobexecutionqueue",
    - "Core:Queue:ExecUpdatestatQueue": "execupdatestatqueue"
[S] Webjob throws time out error when the log text is too long - https://trello.com/c/GHxh9UFJ/4432-s-webjob-throws-time-out-error-when-the-log-text-is-too-long
[For upgrade person]
Add this section to the Web Job appsettings.json (root level)
"Logging": {
"LogLevel": {
"Default": "Information",
"Microsoft.EntityFrameworkCore.Database.Command": "Warning",
"Azure.Core": "Error"
}
},
[Azure Pipeline] Missing copy favicon file when build Artifact on Current sprint - Core | Trello - https://trello.com/c/4c1bs2mj/4321-azure-pipeline-missing-copy-favicon-file-when-build-artifact
  - Config angular.json file like the changes on this PR: Pull request 24736: [Azure Pipeline] Missing copy favicon file when build Artifact - Repos - https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/24736?_a=files
[S] [Deployment] Client wants to always run the custom script before Core script - https://trello.com/c/RmvNDK6d/
  - Add "BeforeCoreFolder": "BeforeCore" to deployment's appSettings.json
  - Add copy always to "BeforeCore" folder in NGO.Deployment.csproj
  - Add "Core:Deployment:BeforeCoreFolder" with value BeforeCore to Release > Variables > Pipeline variables

5.7.2
Patch from latest core version [S] [Deployment] Client wants to always run the custom script before Core script - https://trello.com/c/RmvNDK6d/
  - Add "BeforeCoreFolder": "BeforeCore" to deployment's appSettings.json
  - Add copy always to "BeforeCore" folder in NGO.Deployment.csproj
  - Add "Core:Deployment:BeforeCoreFolder" with value BeforeCore to Release > Variables > Pipeline variables

5.7.0
[S] Add "Is latest reported period" to Logframe ITT analyse on Current sprint - Core | Trello - https://trello.com/c/evTZgp64/4356-s-add-is-latest-reported-period-to-logframe-itt-analyse
If client custom CoreAnalyseLogframeReporting, pls add rpt.IsLatestPeriod (refer to this PR https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/24063)
Update nuget packages - https://trello.com/c/mr3DMhKn/4455-update-nuget-packages
[For upgrade person]
Update build-pipleine-api.yml:
Change the line: arguments: 'install --global dotnet-ef --version 8.0.3'
To: arguments: 'install --global dotnet-ef --version 8.0.7'
[S] Fundingidea permission for SP is incorrect with that show in Admin UI on Current sprint - Core | Trello - https://trello.com/c/xrXyz763/4377-s-fundingidea-permission-for-sp-is-incorrect-with-that-show-in-admin-ui
[For Deployment Person]
  1. Correct Permission Groups for Funding Ideas:
    - Go to the link: https://ngodev.sharepoint.com/sites/xxxxx/fundingIdeas/_layouts/15/user.aspx
    - Delete the User Permissions in the list (tick the User Permissions and select 'Remove User Permission'), except for the Permission SharePoint App.
    - IMPORTANT: Replace 'xxxxx' with the corresponding site collection for the environment.
[Admin/ Entities filter] Current Phase should get the CurrentPhaseName of each entity on Current sprint - Core | Trello - https://trello.com/c/xObuv7fv/4028-admin-entities-filter-current-phase-should-get-the-currentphasename-of-each-entity
Check and add characteristic: "IsFilteredByName": true if current phase filter fields and field instance fields don't have this characteristic (fieldDefinitionId: 63)
[S] Create a page about Signing out of NGO Online on Current sprint - Core | Trello - https://trello.com/c/ZzwEJax0/4431-s-create-a-page-about-signing-out-of-ngo-online
  1. Update env.config.json File:
    - Add the 'logout-success' string as a postfix to the postLogoutRedirectUri. For example:
  2. Update src/app/app-route.service.ts File:
    - Add the following after the path 'unauthorized':
  1. Before Deployment:
    - Add the 'logout-success' string as a postfix to the postLogoutRedirectUri in the Release variable. For example, change:
[M][FND17][PRJ11] Add calculated browse list columns - https://trello.com/c/pnZfoAiN/4350-mfnd17prj11-add-calculated-browse-list-columns
  1. Update appsettings.json Files:
    - Inside the Queue section, add:
      - "CalculatedFinancialValuesQueue": "calculatedfinancialvaluesqueue"￼
  2. Update Job appsettings.json Files:
    - Inside the Core section, add:
      - "CalculatedFinancialValuesCurrentYearTotalSchedule": "0 0 1 * *"￼
  1. Update Azure AppService:
    - Add the following keys:
      - "Core:Queue:CalculatedFinancialValuesQueue": "calculatedfinancialvaluesqueue",
      - "Core:CalculatedFinancialValuesCurrentYearTotalSchedule": "0 0 1 * *"
[M] Users & Roles - have a limit on number of users that can be added to the system on Current sprint - Core | Trello - https://trello.com/c/SkTffOfP/4417-m-users-roles-have-a-limit-on-number-of-users-that-can-be-added-to-the-system
  1. Update appsettings.json Files:
    - Add a configuration with the key MaximumUsers. This config defines the maximum number of active user licenses that can be in the system. Depending on the customer's requirements (if any), if there are no requirements, the default value will be 0 (i.e., no limit, as it currently is).
  1. Update Azure Portal:
    - Add a variable with the key Core:MaximumUsers and the value can be obtained from the appsettings.json in the API.

5.6.0
[AAI client only] [L] [PRG12] [PRJ07] Finance, Other income tab - https://trello.com/c/NYxwImkQ/4114-l-prg12-prj07-finance-other-income-tab?search_id=0be97134-a6bc-4aa6-979f-bd77b5495a5d
[For upgrade person] check and make sure your client customization 'Other Income 'tab still working as before and don't use core function (you might do something with routes so it will load your client customization components).
https://trello.com/c/xBMhYGdj/3996-logframe-actual-form-missing-period-reporting-on-dropdown-period-when-adjust-start-end-for-project
  - Azure app service configuration: add 'Core:Queue:GenerateLogframeReportQueue' with value 'generatelogframereportqueue'
  - Add 'GenerateLogframeReportQueue' with value 'generatelogframereportqueue-dev' inside 'Queue' section of WebJob's, API and Deployment appsettings.json
[WebJobs Monitoring Admin UI]
  - Add API url to environment files: adminWebJobMonitoring: 'api/core/adminWebJobMonitoring'
  - If client use custom webjob and upgrade directly to version 5.6 or above, please add a script to insert the information of the custom webjobs to table CoreWebJobs. Example in this PR: https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-dtglobal/pullrequest/24510?_a=files&path=/ngo-api/NGO/NGO.Deployment/CustomDataFixes/AfterDeployment/20240722_AddCustomWebJobs.sql

5.5.0
[S] Documents tab: Add column for Document type as standard set up on Current sprint - Core | Trello - https://trello.com/c/t6XG1wUA/4283-s-documents-tab-add-column-for-document-type-as-standard-set-up
[For upgrade person] Field Document type in list (FieldInstanceId = 133 and Location = 1) will be set up as standard. The existing field will be automatically removed before deployment (if the client already has that FieldInstanceLocation) and will then be re-inserted after deployment. Please check the client's code to see if there is any custom script that adds this FieldInstanceLocation. If so, please remove that code to avoid duplicating the field in the list.
[M] [PRJ05] Finance, Expenditure - Expediture Templates to allow differences between [project] type - https://trello.com/c/hfdSkUqb/4272-m-prj05-finance-expenditure-expediture-templates-to-allow-differences-between-project-type
  - partnerExpenditureTemplates⁠: 'api/core/partnerExpenditureTemplates⁠'
[S] Takes too long to load the dropdown when moving docs between entities on Current sprint - Core | Trello - https://trello.com/c/ia5laN2b/4255-s-takes-too-long-to-load-the-dropdown-when-moving-docs-between-entities?filter=member:phongphamthanh3
  - Create an additional System configuration called showAllEntityInCopyMoveForm to determine whether to show all entities in the copy/move form or not, default of this config is "false"
  - If the value is true, the logic in the copy/move form will remain unchanged. If the value is false, when the form is first opened, the entity will be the current entity. When switching entity types, the destination entity will be blank and the document tree will not be displayed. Users will have to type the display name to search for the destination entity of that entity type.
  - The Donor disaggregation column will be hidden by default in rollup scenarios with this update. Please Set "showDonorDisaggregationRollup" to true in BeneficiarySetting to show donor disaggregation in rollup.
https://trello.com/c/AGvhXKZ2/4287-s-beneficiaries-add-config-option-to-set-sort-order-of-categories
  - 1: Beneficiary rows in each section will be sorted by the row's sortOrder.
  - 2: Beneficiary rows in each section will be sorted by group first, and then by the row's sortOrder within each group.
Note: In the CoreBeneficiaryGroups table, the column RowTotalDisplayLocation can have values of 1 (display the total row at the bottom of the section) or 2 (display the total row at the bottom of each group). The configuration will be invalid when beneficiarySortTypeInList = 1 and RowTotalDisplayLocation = 2. In this case, the total rows of the group with DisplayLocation = 2 will not be displayed.
[M][PAY04] Finance, Geography, Payments to partners on Current sprint - Core | Trello - https://trello.com/c/8DPBMdSm/4274-mpay04-finance-geography-payments-to-partners
Add import of GeographyFinanceModule to app.module.ts
[Logframe/Logframe Structure] Failed to populate for Type, Cumulative, Is Mandatory field when adding indicator to Global Objective session on form on Current sprint - Core | Trello - https://trello.com/c/ObPGsY7B/4374-logframe-logframe-structure-failed-to-populate-for-type-cumulative-is-mandatory-field-when-adding-indicator-to-global-objective
Please check if you have Logframe scripts that setup Global Indicator read only fields on the Objective/Indicator form. They need to have the "displayedAsReadOnlyControl": true characteristic to display correctly.

5.4.0
https://trello.com/c/EP5cJe16/4193-add-configuration-to-overview-box-definitions-about-what-entity-to-load-fields-from-load-fields-according-to-this-config-instead
Note for clients: These boxes are rollup data from an entity (ex: projects) to another entity (ex: program), so they should only be added on related entities (ex: project/program)
The script bellow should be review and run if it's truly rollup info from entity to entity, otherwise, should be update OverviewBoxDefinitionId = (23,63,64) in CoreOverviewBoxInstances to appropriate definition id instead. If there is no appropriate definition id, plz add a new overviewbox definition with TypeId = 23, and use it as usual.
(For clients: Run this script after DataFixes steps if need to fix FieldInstanceId for existing generic overview boxes which have fields saved from wrong EntityDefinitionId:
"20240412_ManualAfterDataFixes_FieldInstanceIdForGenericOverviewBox.sql")
Webjob monitoring
https://trello.com/c/E8NuEFad/4111-webjob-monitoring
Add the following to WebJobs.Job appSettings.json in Core section:
"WebJobExecution": {
"RetainLogDays": 180,
"CleanSchedule": "0 1 * * *"
}
Also add "Core:WebJobExecution:RetainLogDays" and "Core:WebJobExecution:CleanSchedule" with the same values to Azure app settings.
Check the core code and adapt it to client webjob, if client have custom webjob.
Generic overview box is named 'overviewbox.generic_summary_overview_box' in the list on Current sprint - Core | Trello - https://trello.com/c/5hErQ4yl/3984-generic-overview-box-is-named-overviewboxgenericsummaryoverviewbox-in-the-list
If there are custom generic overviewboxes implemented, each one needs to get a custom OverviewBoxDefinition and existing OverviewBoxInstances updated to use the new definition id.

5.3.0
.NET 8
  1. Install .NET 8 on development computer
  2. Do a find and replace in the whole solution, find: net7.0 replace: net8.0
  3. Make sure to clean the solution, possibly manually delete bin and obj folders.
  4. Make the following updates to build-pipeline-api.yml
  5. [Before deployment] Remove step "Use .NET Core sdk 7.0.x" in two agents "Deploy Database" and "Deploy Sharepoint" (if have)
  6. [Before deployment] Change web app to run .net 8 instead of .net 7
[S][Task tab/ Gantt View] Visibility should also base on config of current entity: https://trello.com/c/Y8qEOLNQ
[For upgrade person] Check in the always sql scripts, if we have config "showGanttTask" of the key "GanttTaskConfiguration" in "CoreConfigurations", please remove it
Ex: { "showGanttTask": true , "defaultDisplayRange": 3 } change to -> { "defaultDisplayRange": 3 }
[S] Announcement | External link URL is encoded two times ([S] Announcement | External link URL is encoded two times on Current sprint - Core | Trello - https://trello.com/c/AcU8nez4/4137-s-announcement-external-link-url-is-encoded-two-times)
[For upgrade person] In DatabaseSeed, recheck fields with ControlType = Multilink (23) or Link (6) on list/view Form(FieldLocation in 1, 4), their characteristic should have "showAsOriginal": true. If missing, plz add.
https://trello.com/c/z1bjVWOk/4058-s-finance-income-schedule-add-income-schedule-tab-to-stakeholder-entity
https://trello.com/c/Yykcms2I/4059-m-finance-payments-add-payments-tab-to-stakeholder-entity
Open app.module.ts and add 'StakeholderFinanceModule' to @NgModule
[S] Add Scheduled web job function that runs EXEC sp_updatestats; according to a schedule in configuration on Current sprint - Core | Trello - https://trello.com/c/camG0k2z/4121-s-add-scheduled-web-job-function-that-runs-exec-spupdatestats-according-to-a-schedule-in-configuration?filter=member:phongphamthanh3
Adding key "ExecUpdatestatSchedule" to Webjob to run EXEC sp_updatestats at regular intervals
[For upgrade person] Adding new key name "ExecUpdatestatSchedule" to configuration of appsetting,json of webjobs, the value default is "0 0 1 * *" (each month). Depending on the client's specific requirements, there may be a configuration adjustment for this scheduled interval.
[For deploy person] Adding new key name "Core:ExecUpdatestatSchedule" to configuration of Azure, the value default is "0 0 1 * *" (each month). Depending on the client's specific requirements, there may be a configuration adjustment for this scheduled interval.
https://trello.com/c/rfypcnXW/4115-l-admin-ui-budget-template
  - Import "faMoneyBill" at the line "...from '@fortawesome/pro-regular-svg-icons'"
  - Add faMoneyBill after faMinus inside the constructor
  - budgetTemplates: 'api/core/budgetTemplates'
  - (For upgrade person) Run query SELECT * FROM CoreConfigurations WHERE [Key] = 'BudgetSetting' to check and make sure that property "Frequency" in key's value has a comma behind it. Otherwise, please add deployment script to move that property to the beginning or add a comma behind it (also check custom DatabaseSeed). Unless, the script "DataFixes/20240327_AddDefaultBudgetTemplate.sql" below won't work. See example fixes. - https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-wvuk/pullrequest/26553?path=/ngo-api/NGO/NGO.Deployment/CustomDataFixes/AfterDeployment/20241114_AfterCoreUpgrade_5.x.sql&version=GBthp1/Core-upgrade-3.15-5.9&line=83&lineEnd=84&lineStartColumn=1&lineEndColumn=1&type=2&lineStyle=plain&_a=files&iteration=4&base=0
  - Core's default OptionsListId for FundingType is 20. If any client's using another Id for FundingType list, please update that value in the script "DataFixes/20240327_AddDefaultBudgetTemplate.sql" to make sure data is added correctly for Restricted Fundings
Update front end packages
Update front end packages on Current sprint - Core | Trello - https://trello.com/c/EczdTtrN/3687-update-front-end-packages
Please see Upgrade Angular 8-9.docx - https://precio.sharepoint.com/:w:/r/sites/ngo-oonline/Shared%20Documents/03%20Core%20development/Technical/Upgrade%20Angular%208-9.docx?d=w37a01bd52d8c49b99f342e97aa040953&csf=1&web=1&e=QLWhto for detailed upgrade instructions.
[For Deploy Person]
  1. Rename "msalConfig.framework.protectedResourceMap" to "msalInterceptorConfig.protectedResourceMap"
  2. Update value to use scope https://ngodev.onmicrosoft.com/NGO2/user_impersonation (also Core:AzureAd:Audience to use NGO2 instead of NGO in azure config)
  3. Update all ClientId variables to "462468ff-5ae6-4e55-8cb8-9312a0100dc2" (also update in Azure config)
  1. Rename Release variable "msalConfig.framework.protectedResourceMap" to "msalInterceptorConfig.protectedResourceMap"
  2. Add Release variable "msalGuardConfig.authRequest.scopes" with value "[ "user.read", "openid", "profile", "https://tenant/NGO/user_impersonation" - https://tenant/NGO/user_impersonation%22 ]" where tenant is the client tenant name.
  3. Update Entra ID App Registration:￼- In Authentication, delete relevant redirect URI from section "Web".￼- Add platform "Single-page application" with the relevant redirect URI.
  - Steps to clear browser cache:
Improved caching of env.config.json - https://trello.com/c/CCM7wUUw/4632-improved-caching-of-envconfigjson
  1. Modify main.ts file according to the change in this PR: Pull request 26664: Testing caching of env.config.json - Repos - https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/26664?_a=files

5.2.0
Multiple SP sites - https://trello.com/c/42nqs50X
[Before deployment] Update 'Site_URL' in file '20240111_ManualBeforeDeployment_MultipleSPSites.sql' and manual run it before deployment
[For upgrade person] If any compile error, then follow as below:
2. Replace (if exists) URIUtilities.CleanUrlSegment -> SPUtilities.CleanUrlSegment
3. Replace (if exists) URIUtilities.GetRelativeUrl -> SPUtilities.GetServerRelativeUrl
https://trello.com/c/hrimmiVG/3773-s-entityasync-job-possible-loop-forever-and-affect-the-application-if-the-approval-pdf-screenshot-is-failed
[Before deployment] Azure app service configuration: add 'Core:Queue:IdeaFileCopyingQueue' with value 'ideafilecopyingqueue'
[For upgrade person] add 'IdeaFileCopyingQueue' with value 'ideafilecopyingqueue-dev' inside 'Queue' section of WebJob's appsettings.json
[L] Multiple languages - Global indicators, Global objectives, Breakdowns
[For deployment person]
[After deployment] update appsettings.json and manual run the tool: NGO.Core.Tools.UpdateLogframeGlobalResourceStrings
[For upgrade person]
If any custom code in GetLogframeIndicatorTrackers.sql, please add two columns as changes in GetLogframeIndicatorTrackers.sql in PR#22030 - https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/22030
The 'Name' column in db tables: CoreLogframeGlobalObjectives / CoreLogframeGlobalIndicators / CoreLogframeBreakdownTemplates and db tables: CoreLogframeObjectives (i.e. when it's global objective) / CoreLogframeIndicators (i.e. when it's global indicator) are resource strings. Therefore plz check and update your client code if your client has some custom code related to those tables.
[S] [Validate Entity Member] Core hard-coded to check "Partner Member"
"Previously, the core hardcoded the feature: Partner User role can only be assigned to Partner Member. This card will upgrade that part by checking the roles in globalRoleIds that are only allowed to be assigned to validInEntityRoleIds. (i.e.: [{"globalRoleIds": [1, 2], validInEntityRoleIds": [15, 16]}] means roles 1, 2 can only be assigned to entity roles 15, 16). Clients can configure this here.
However, if the client doesn't have any special requirements (like CBMI...), we can keep the old configuration (Partner User role can only be assigned to Partner Member) and RestrictedMemberRoles should be [{"globalRoleIds": [11], validInEntityRoleIds": [12]}].
Please check this with "select * from CoreConfigurations where [key] = 'RestrictedMemberRoles'". Make sure that the value will be [{"globalRoleIds": [11], "validInEntityRoleIds": [12]}]. If not, run "update CoreConfigurations set [Value] = '[{"globalRoleIds": [11], "validInEntityRoleIds": [12]}]' where [key] = 'RestrictedMemberRoles'."
[S] AuditLog show CreatedBy System
(Trello link: https://trello.com/c/NyhuxGfA)
If client project has NgoContext, please ensure override functions SaveChanges and SaveChangesAsync set value for audit.CreatedBy following changes in PR.

5.1.1
Deployment improvements when setting up new environments
Deployment improvements when setting up new environments on Current sprint - Core | Trello - https://trello.com/c/VtJiphKu/4010-deployment-improvements-when-setting-up-new-environments
When setting up a new environment/database, there's a new deployment command to run before the first normal DevOps deployment: NGO.Deployment.exe DbInit
This will initialize the __DeployScriptHistory table and add any existing CoreDataFix or OneTime scripts to the table. This ensures that old scripts not relevant or not working for a blank database will not be run on deployment. After the DbInit command is run, a normal full deployment can be made and any config copied.

5.1.0
[S] Remove resource string module Active flag
[S] Remove resource string module Active flag on Current sprint - Core | Trello - https://trello.com/c/XyjiGV0t/3938-s-remove-resource-string-module-active-flag?filter=resource
[Before deployments] Check scripts if using Active flag in CoreResourceStringModules and remove it.
Updates to Azure storage/queues packages
Please check any custom WebJob code that uses the function "JsonTo64BaseString" and replace with "ToJsonBytes".
Update CustomQueue in client project
Remove all the code in Queue Class, change the AzureBaseStorage to QueueBase, IQueue ( if normal queue) or QueueBaseWithFallback, IQueueWithFallback if it is a blob queue

5.0.0
EF Core
https://trello.com/c/Haz9EfB3/3622-ef-core
[For deployment person]
  - Update Migrate NGO Context step script to "efbundle.exe"
  - Add suffix "/CoreDBMigration/migrations" to "Advanced/Working Directory" of "Migrate NGO Context" step
  - Add release variable "MigrationsAssembly": "NGO.Repositories"
[For upgrade person] I remember some clients using bulk/batch insert technique in transaction integration web job but I cannot remember if it's referencing to Z.EntityFramework.Extensions.EFCore or not. But anyway please find 'context.BulkInsert' / 'context.BulkUpdate' / 'context.BulkDelete', if existing, try to replace with other way because those extensions (i.e. Z.EntityFramework.Extensions.EFCore) are licensed and only free for several months.
Upgrade steps detailed in document - Upgrade to EF Core : https://precio.sharepoint.com/:w:/r/sites/ngo-oonline/Shared%20Documents/03%20Core/Development/Technical/Upgrade%20to%20EF%20Core.docx?d=we3b5c3c3b5be4894aa9cd71d84f8172b&csf=1&web=1&e=LeVF2B
Be careful: Check if client are overwritting any repositories of Task function (TaskRepository, TaskFlowRepository,…). If yes, please separate NgoContext and CoreContext to use it separately, DO NOT USE NgoContext to map with CoreContext when inherit contructor of repositories from Core (see image)
- 4.6.9
[Allocation] Funding Source should not be added to/gotten from the CoreFunctionalItemEntityRelations (https://trello.com/c/KXErJ2Jc)
[Before deployment] Run the script in this card when do the upgrade: 20231006_1200_MigrateFundingEntityToFundingAllocationTransaction.sql
- 4.6.0
Restricted entities optimisation https://trello.com/c/O9ryyPU1
  - Key of queue message: Core:Queue:RestrictedUserEntitiesQueue = "restricteduserentities"
  - Key of enabling to insert data to restricted table: Core:Queue:RestrictedEntityJobEnabled = true
  - [After deployment] Generate restrictions for existing data run sql:
EXECUTE [dbo].[GenerateCachedRestrictedUserEntities]
Service Injection: IBaseTaskActionService -> Remove name in register service in CommonDIRegistrations.cs
Ex:
container.RegisterType<Core.Services.IBaseTaskActionService, WireTransferTaskActionService>(WireTransferTaskActionService.ConfigurationId);
-> Change to: container.RegisterType<Core.Services.IBaseTaskActionService, WireTransferTaskActionService>();￼or container.AddTransient<Core.Services.IBaseTaskActionService, WireTransferTaskActionService>();
Do the same for IBaseExportPdfActionService
[Compile error] if any compile error related to IsGeneratingProgressDone == true, please replace it with 'ProgressStatus != Model.Enums.LogframeVersionProgressStatus.IsCloningStructure'
- 4.5.0
[S][Finance/ Monitoring] Disappear when config rollup data from - https://trello.com/c/VKC4QRPq/3686-sfinance-monitoring-disappear-when-config-rollup-data-from
[After Deployment] Run script (read the below Note before manual run): Datafixes/20231020_MigrationConditionToConfigurationForRollupRelatedTab
Note: Please re-check the script and update @CONFIGURATION according to the client customization if have, I.e: [{"name": "typeId", "value": [1]}] is the roll up conditions for entity type with id = 1, if the client has other condition, you should run command: SELECT * FROM CoreEntityTabs WHERE Conditions LIKE '%typeId%' to check and update the according script
https://trello.com/c/PvNYbKbp/3684-m-new-structure-of-db-deployment
[For upgrading person] update appsettings.json in deployment project related to deployment section, see sample image below
[Before Deployment] Update release pipeline > Variable:
Rename Core:Deployment:DataFixesAfterFolders:0 to Core:Deployment:DataFixesAfterFolders:Core (if it is core script)
Rename Core:Deployment:DataFixesAfterFolders:1 to Core:Deployment:DataFixesAfterFolders:Custom (if it is client script)
Rename Core:Deployment:DataFixesBeforeFolders:0 to Core:Deployment:DataFixesBeforeFolders:Core (if it is core script)
Rename Core:Deployment:DataFixesBeforeFolders:1 to Core:Deployment:DataFixesBeforeFolders:Custom (if it is client script)
Note: the folder path configured in release pipeline should have single '\'.
Please verify the deployment logs if those above steps running properly.
[M] Task in the log entry to open the task view form. Same for agreements - https://trello.com/c/fCGMjudX
[Upgrade] When upgrading, create a custom AfterDeployment script to update FieldInstance Characteristic to match setup of tabs that have related tasks, see card for details.
- 4.4.1
[S][Finance/ Monitoring] Disappear when config rollup data from - https://trello.com/c/VKC4QRPq/3686-sfinance-monitoring-disappear-when-config-rollup-data-from
[After Deployment] Run script: Datafixes/20231020_MigrationConditionToConfigurationForRollupRelatedTab
Note: Please re-check the script and update @CONFIGURATION according to the client customization if have, I.e: [{"name": "typeId", "value": [1]}] is the roll up conditions for entity type with id = 1, if the client has other condition, you should run command: SELECT * FROM CoreEntityTabs WHERE Conditions LIKE '%typeId%' to check and update the according script
- 4.4.0
Move Task Template Tool https://trello.com/c/mkT85zLU
It is the update to the existing tool NGO.Core.Tools.SiteConfigurationPopulation so that the default document links can be replaced with the URL of destination site
  1. Define document link column in the table by property DocumentColumns in SmarterMerges (default document resource links already added to CoreTaskTemplates table)
  2. Set new/old values of URL config
  3. RootUrl: SharePoint root URL
  4. TenantUrl: SharePoint tenant URL
  5. Web URL: Website URL
Note: step 2 must have values for all settings. If some of them is missing, nothing is replaced
[M] Be able to configure format with fixed two decimal digits even though it's an integer value
https://trello.com/c/zKFfoTtO
For upgrade person: if any compile error in custom code in helper.service.ts/transformNumber (Heifer, maybe), it is because the argument 'isFixedFractionDigit' is now removed in Core. To solve: if you pass 'false' to 'isFixedFractionDigit', then you just remove 'false' and don't need to do anything else, if you pass 'true' to 'isFixedFractionDigit', then you remove 'true' and find/update the format where you pass to the function to have fixed fraction digits (use .00 for fixed decimal part, for example, see detailed configuration at https://trello.com/c/zKFfoTtO).
Fields: Auto-populated dates not working as expected
https://trello.com/c/s2sPg2v2
Update version of npm package @ng-bootstrap/ng-bootstrap to 5.1.2
[After Deployment] Run tool: NGO.Core.Tools.ValidateAndRemoveAllInvalidBudgetRows
Note: Please run the script noted in the tool to check the invalid data, please make sure that there are no invalid budget report row (I.e: row has Month = 0, or invalid date time – null is ok)
- 4.3.2
[S][Finance/ Monitoring] Disappear when config rollup data from - https://trello.com/c/VKC4QRPq/3686-sfinance-monitoring-disappear-when-config-rollup-data-from
[After Deployment] Run script: Datafixes/20231020_MigrationConditionToConfigurationForRollupRelatedTab
Note: Please re-check the script and update @CONFIGURATION according to the client customization if have, I.e: [{"name": "typeId", "value": [1]}] is the roll up conditions for entity type with id = 1, if the client has other condition, you should run command: SELECT * FROM CoreEntityTabs WHERE Conditions LIKE '%typeId%' to check and update the according script
- 4.3.0
[M] To allow form sub-tabs to be set up in Admin Portal
[After Deployment] run this script Datafixes/20230602_MigrateFormTabs
Important note before running script:
_ This update will change the data structure of the CoreFormTabs, so if any clients have customize in this table, all of related scripts, logic are needed to be re-check and re-write
_ The logic of new form tab contains 3 new columns: EntityDefinitionId, TabDefinitionId, TabFunctionId in order to show/hide the form tab which will be changed via the admin UI
_ The migration script will ignore tabs whose IsHidden = 1 a.k.a tabs that can't be configured by the admin (logframe, rollup, specific customized tabs), so use this logic for any tabs that can't be configured by the admin for client before running the script
Important note after running script:
_ This script will generate new form tabs row based on the existed one, so please check the ID for all related places in order to make sure the customize logic work (I.e re-check field instance location script containing old form tab id and move it to the new one according to the data generated by this script, insert new row data to script related to generate CoreFormTabs based on new data created by this script)
[M] Translations - Overview box fields stay in english, they should display the translation (https://trello.com/c/XydRMUAG)
_ Run this script after deployment: [20230711_FixOverviewboxFieldInstancesLabel.sql]
Noted:
_ Before run [20230711_FixOverviewboxFieldInstancesLabel.sql], please make sure that the @LocaleId and @LanguageId (in the script) are set the same locale and language of client configuration, take language with isDefault = 1. Ensure second "1033" equals with @LocaleId (see image below)
_ After run this script, please re-check all client configuration for overview box field instances and make sure that those labels are renamed from plain text => resource key generated by the script, you can check this in the table after running above script
[M] Partner expenditure label only support for calendar year
https://trello.com/c/8RS9rJO4
For upgrade person: please check if your client is using 'Finance/Partner expenditure' and the period names labels not displaying the same as your client test/dev site, if yes, please create a trello card in your client and you will work on it as next card (see wiki config to know how to configure 'PeriodNamePatterns'). The card title is "[CoreChangedAfterUpgrade] Check and update partner expenditure period names labels displaying the same as before".
4.2
4.1
Logframe: Update Linked Global Indicator property in Indicator from Array to Single
https://trello.com/c/InbT6yKp
Rename customGlobalIndicatorLinks to customGlobalIndicatorLink
!!!IMPORTANT Note for client: Please check all custom script whose characteristic contains customGlobalIndicatorLinks, then replace it to customGlobalIndicatorLink
In case any fields on the logframe objective form is readonly, please check with this script [select * from CoreFieldInstanceLocations where ReadOnlyDependencyId = 54], and then set ReadOnlyDependencyId = NULL in order to make it is editable
Logframe: Loading breakdown dynamically
This function is enabled by default, please check with PM, if this function is not necessary in the client, deactivate the field location with
Id = 2868: For indicator tracker
Id = 4925: roll up of indicator tracker
Service Injection: IBaseTaskActionService -> Remove name in register service in CommonDIRegistrations.cs
Ex:
container.RegisterType<Core.Services.IBaseTaskActionService, WireTransferTaskActionService>(WireTransferTaskActionService.ConfigurationId);
-> Change to: container.RegisterType<Core.Services.IBaseTaskActionService, WireTransferTaskActionService>();￼or container.AddTransient<Core.Services.IBaseTaskActionService, WireTransferTaskActionService>();
Do the same for IBaseExportPdfActionService
NGO Core 4.x (to .net 7):
Upgrade pipelines and release to dotnet 7: Upgrade pipelines and release to dotnet 7 - https://precio.sharepoint.com/:w:/r/sites/ngo-oonline/_layouts/15/Doc.aspx?sourcedoc=%7B562B8C65-796B-46E7-990C-0EA4DA001F5B%7D&file=Upgrade%20pipelines%20and%20release%20to%20dotnet%207.docx&action=default&mobileredirect=true
- 3.15.20
Update package references for Aspose.Words to version 21.9.0 when upgrading to this version.
Update 2024/02/07 ( (If we go directly to 3.15.24 or above, then no need to do this step): Ensure client NGO.Webjobs.Job also includes package Aspose.Words 21.9.0 => Ensure ScreenshotAsyncFunctions (Webjob) work without error.
- 3.15.19
[S][Finance/ Monitoring] Disappear when config rollup data from - https://trello.com/c/VKC4QRPq/3686-sfinance-monitoring-disappear-when-config-rollup-data-from
[After Deployment] Run script: Datafixes/20231020_MigrationConditionToConfigurationForRollupRelatedTab
Note: Please re-check the script and update @CONFIGURATION according to the client customization if have, I.e: [{"name": "typeId", "value": [1]}] is the roll up conditions for entity type with id = 1, if the client has other condition, you should run command: SELECT * FROM CoreEntityTabs WHERE Conditions LIKE '%typeId%' to check and update the according script
3.15.0 / 4.0
[S] Rating field in browse view doesn't include color property. As a result, the color can't be showed
Check note for configuration in this card: https://trello.com/c/ToiK688Y
[L] Restructure email template data model <https://trello.com/c/TMEVMZOC>
[After deployment] Clean the email template field: delete from CoreFieldInstanceLocations where Id = 4803
Noted: Please check if the client has a custom table based on table CoreEmailTemplates, in case yes, please check the script [BeforeDeployment/20230417_SplitCoreEmailTemplateData] after that correct this script before run the deploy.ps1, because in this update, columns Subject, Body, LanguageId of CoreEmailTemplates will be moved to CoreEmailTemplateContents
Limit document permissions to confidential pages (CoreEntity.IsRestricted = true)
<https://trello.com/c/l5l7Fuu0>
  1. If any custom entity roles, e.g. 'Project Partner Member'/'Project Partner Responsible'/'Organization Partner Member'/'Organization Partner Member', etc. If Yes, read step 2.
  2. Please check yourself or ask PM if those found roles - which one can see the '99 Approvals' folder. If there are a few custom entity roles that prevent from viewing '99 Approvals' folder, read step 3.
  3. Update CoreConfigurations/RestrictedGlobalRolesInViews with additional restricted roles on '99 Approvals' folder, write script like example (i.e. keep the existing config value in your system env and then add new config like the bold text, for example, 100080 is a role ID, 113 is Signed off folder):
    [{ "roles": [{ "id": 11} ]} , { "roles":[{ "id":100080} ], tabFunctionId: 113} ]
[S] Permission web job: when ensure site permission, many messages used to update permission for each entity are sent, and many items failed: (https://trello.com/c/UuJ2FPm4)
Add <add key="MessageQueueSize" value="{ number} " /> in app.settings where 1 <= number <= 32 in order to control number of concurrent message processed by web job
- 3.14.0
[S] BrowseList - Region Field: ControlType.parentDropDownText not working anymore (https://trello.com/c/F2iwHNks)
Config noted in this card in case any clients use it
[M] Partner access: Documents
https://trello.com/c/fbRqlu14/3264-m-partner-access-documents
[For developer] Checking your client project if any override method of SPFolderService.cs/SetSignedOffFolderPermission, if existed, please read and compare with core code and then update your override method to still keep both your custom logic and core logic (new core updates: PFAdmin role will be added as 'Editor' of '99 Approvals' folder, Core supports to able configure exclude Role from View of 99 Approvals using 'RestrictedGlobalRolesInViews' use default setting or new setting with tabFunctionId: 113)
[BeforeDeployment, for deployment person] Go to 'SharePointBackend/ClientDocumentationImages/LibrarySettings/Permissions for this document library' and press 'Delete unique permissions' button, it will be re-setup by webjob.
[AfterDeployment] Run below two scripts if it's not auto run by deployment (checking [__DeployScriptHistory] database table)
20220602_CoreRolePermissions_ReplaceViewByListPermissionForRecycleBin.sql
20230413_AddListPermissionOnDocumentsTab.sql
[L] Start page configuration to be possible in Administration Portal
https://trello.com/c/FmexDXK3
Open app.module.ts, add 'faTh' next to 'faChartArea' (two places)
Add to environment (2 files):
adminStartPageConfiguration: 'api/core/adminStartPageConfiguration'
[S] Set limited permissions, performance
[S] Set limited permissions, performance on Current sprint - Core | Trello - https://trello.com/c/TLwSwStH/3274-s-set-limited-permissions-performance
Add Azure configuration key sp:SubFolderLimitedPermissionCheckTimeoutInSec to set timeout to 30
- 3.13.9
Finance actuals job: actuals rows' values of sub header, header and total are empty
https://trello.com/c/bteFBLac
If client project uses Core Monitoring functions, run the tool NGO.Core.Tools.MonitoringValueCorrection
- 3.13.7
[Finance] Income Schedules tab: Income schedule entries being duplicated in browse view
https://trello.com/c/qmS9114D
[Before deployment]: DataFixes/BeforeDeployment/20230512_UpdateFields_Log_Finance.sql
- 3.13.2
Refactor FundingFinanceService
https://trello.com/c/SS8ZJR50
Add to environment: fundingPlan: 'api/core/entity'
Remove FP on IFundingFinancialXXX<FP, FA, FAT> (Repository, Service)
- 3.13.1
[L] Deployment improvement: Automate scripts (that are currently manual)
https://trello.com/c/mkF651YM
All future DataFix scripts should be but into the DataFixes/BeforeDeployment or DataFixes/AfterDeployment folders. These scripts will be executed automatically with the deployment so it's very important that all scripts are correct. For scripts where manual steps are still required, scripts can still be put into the root DataFixes folder but this should be avoided as much as possible. Only steps that need manual handling needs to be noted in the wiki or as deployment notes.
Upgrade notes:
Added nugets to Deployment: Microsoft.SqlServer.SqlManagementObjects 170.13.0
Update Release pipelines to match attached screenshots in card. The last step replaces SeedDb.ps1 + runs "after" scripts.
Existing Powershell step for deploy.ps1 needs to be updates, file now called Deploy_SharePoint.ps1
[Before deployment]: Run sql DataFixes/20230315_AddDeployScriptHistory.sql
Notes for client specific scripts:
Any client specific onetime scripts can be run in the same way. Place scripts in a CustomDataFixes/BeforeDeployment or CustomDataFixes/AfterDeployment and add those paths to the parameters in the corresponding steps of the Release pipeline. Any existing already run scripts should be kept in a separate folder or the root CustomDataFixes.
Add icon for PowerBI in LHS menu on Current sprint - Core | Trello - https://trello.com/c/eKFOyAcO/3243-add-icon-for-powerbi-in-lhs-menu
Open app.module.ts, add 'faChartArea' next to 'faUserTag' (two places)
- 3.12.7
[Finance] Income Schedules tab: Income schedule entries being duplicated in browse view
https://trello.com/c/qmS9114D
[Before deployment]: Run SQL script CoreDataFixes\beforeDeployment\20230512_UpdateFields_Log_Finance.sql
- 3.12.3
Refactor FundingFinanceService
https://trello.com/c/SS8ZJR50
Add to environment: fundingPlan: 'api/core/entity'
Remove FP on IFundingFinancialXXX<FP, FA, FAT> (Repository, Service)
- 3.12.0
Field/dropdown Country don't show all countries
https://trello.com/c/emgFA9x5
[After deployment] DataFixes/20230213_UpdateLimitlevelCharacteristics.sql
[Logframe] Update Logframe calculations for YTD or PTD: https://trello.com/c/0lhQZKyE
[After Deployment] DataFixes/20230127_UpdateLogframeYTDColumnSortOrder.sql (Read the description in the script for more detail)
[S] Partner tasks - Partners should not be able to edit deadline/end date?: https://trello.com/c/SLfTvOr4 - https://trello.com/c/1fnUFfBR
[After Deployment] DataFixes/20230213_UpdateFieldCharacteristicForPartnerUsers
Analyse, default setup: Secondary tables appear when they shouldn't (such as Primary table Risks, and all entities appear as Secondary tables, even though the Risks tab only appears on two entities; Or Budget is only on Project, but in Analyse the "Budget" list is appearing for both Projects and Fundings, it shoudln't appear for Fundings)
https://trello.com/c/5yliDfRz
[After deployment] DataFixes/20221230_RemoveUnusedPermissions.sql
[S] Browse view: Filter by current phase not support, and not work
https://trello.com/c/4dnlzWVi
[After deployment] DataFixes/20230208_UpdateCurrentWorkflowField.sql
[S] When a task that has mandatory review and approval, and the user click on "End review" the task is marked as "completed" and "stopped" the correct would be that the task status is "In progress" and "Stopped"?: https://trello.com/c/MYNPC68G
[After Deployment] DataFixes/20230217_UpdateTaskStatusResourceStrings.sql
[S] Server error when config browse view with RatingField
https://trello.com/c/Q1HWk918
[After deployment] DataFixes/20230223_UpdateFieldInstances_sqlDtoMapping.sql
[S] Task/Task template - Assigned to, not translated
https://trello.com/c/48fHZEUp
Run NGO.Tools/NGO.Core.Tools.SetTaskTemplatesResourceStrings
[S] Finance/Partner expenditure/Form - Can't report next period if leave option 'Open Last Period' empty https://trello.com/c/HyIBWb0f
[After deployment] Run Datafixes/20230224_UpdateMissingLastPeriodMessageResourceString.sql
  1. Check client config of rating and comment at objective level or indicator level
  2. Update LogframeIndicatorTemplate pdf template to match with client config
    1. Indicator Level:
      - Rating: ExportLogframeObjective.LogframeReportingIndicatorActual.RatingField1
      - Comments: ExportLogframeObjective.LogframeReportingIndicatorActual.Comment
    2. Objective Level: using core template
Compression settings:
Please update web.config to enable zip compression for all static files + data sent to/from the API. Inside the <system.webServer> element, add:
<urlCompression doStaticCompression="true" doDynamicCompression="true" />
- 3.11.0
Power BI Overview boxes should load data from the admin ui, not the box instance <https://trello.com/c/H5tNGqhL>:
[After deployment]: 20221227_ClearPowerBIOverviewBoxInstances.sql
  1. [After Deployment] DataFixes/20230105_RemoveAutoPopulateProjectEndDate.sql
  2. Check with PM if they really want to remove this characteristic: [Characteristic] = '{ "autoFillDateFieldRefId": "460", "autoFillDateMonthVal": "6" } ' is using for auto populate end date after 6 months compared to start date when create a new project
    1. [After Deployment - Optional] DataFixes/20230106_RemoveAutoPopulateProjectEndDateFromFieldLocation.sql
[S] DependentIds have been removed when updating item in Manage metadata
https://trello.com/c/PUGiwFy2
[After deployment]: 20221227_UpdateDependentListId.sql
[Bank Account] The message modal is display wrong
https://trello.com/c/RXUm6Nlt
[After deployment]: 20230104_Bank_account_name_in_message.sql
[T] [Analyses] Skip Page when Save Query
https://trello.com/c/EqXZ0KHb
[After deployment]: 20230105_Analyse_UpdateSaveQuery.sql
[S] Characteristic of list filter field is not applied, always get from Field instance: https://trello.com/c/oHn10pRV
[After Deployment - Optional] Check before update characteristics: 20230113_UpdateListFilterSettings_Characteristics.sql
[Admin UI / OverviewBox] Log/Log2 has an empty list of default fields in the dropdown
https://trello.com/c/ktwBiLZD
[After deployment]: 20220116_UpdateLogBoxSettings.sql
[Analyse] Missing data for contact fields
https://trello.com/c/JwVSXz5l
[After deployment]: 20230113_UpdateContactSqlMapping.sql
- 3.10.0
Card: [M] Project - Particpants & People Reached (beneficiaries) - server error <https://trello.com/c/ZKHJfGGx>
[After deployment]: 20221230_UpdateMonthYearForEOPTargetPeriod.sql
Card: [S] Support ÅÄÖ in files sent through e-mail <https://trello.com/c/mL0ceLUJ>
  - Sendgrid to 9.28.1
Card: [Permission/Analyze/Tasks] Review/Approval, Comment are not displayed when selected Tasks in Primary table <https://trello.com/c/sV9nzgVF>
[After deployment]: 20221209_RemoveUnusedPermissions.sql
Card: Admin UI / OverviewBox: Announcement has empty list of default fields in dropdown <https://trello.com/c/ph8LltYo>
[After deployment]: 20221212_UpdateFieldInstanceForAnnouncementBox.sql
[S] Project/OverviewBox : Partner assessment (tabfunctionId = 34), Due dilligence(tabfunctionId = 33) get the same permission to check validate https://trello.com/c/yZQ60E7I
Update environement.ts and environment.prod.ts:
partnerCompliance: 'api/core/entity'
[S] Adding a new task to a workflow that is using the 'Repeating phase' function: https://trello.com/c/z76cL0Xz
Run datafixes/20221206_RemoveSubPhaseFields.sql
- 3.9.5
Card: Refactor PDF generation and Task extension points <https://trello.com/c/AFzEihhF>
We change the way to implement BaseTaskActionService and BaseExportPdfActionService to use Injection Services instead of looping in dll as before. Example for implementation in Client Project could be find here: https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-dtglobal/commit/d591320e4600fbf74d108ef0562fa328b0022d9c?refName=refs/heads/main&path=/ngo-api/NGO/NGO.Services/ExportPdfServices/BudgetExportPdfService.cs&_a=compare
- 3.9.0
Card: [M] Performance: Browse pages <https://trello.com/c/O27JvryB>
[After deployment]: DataFixes/20221103_AddSqlDtoMapping.sql
Program/Org Unit - Monitoring: correct TabFunctionId = 30 in CoreEntityTabs
<https://trello.com/c/jFYfSV2b>
[After deployment]: DataFixes/20221103_UpdateMonitoringTabFunctionId.sql
  - Replace WindowsAzure.Storage with Azure.Storage.Queues and Azure.Storage.Blobs https://trello.com/c/yHrxeLz6
  - Make sure System.Runtime.CompilerServices.Unsafe nuget has the same version in the Solution.
  - Add Azure.Storage.Queues to NGO.Repository to fix error when run update-database
Could not load file or assembly 'Azure.Storage.Queues, Version=12.12.0.0, Culture=neutral, PublicKeyToken=92742159e12e44c8' or one of its dependencies. The system cannot find the file specified.
Upgrade EF 6.4.4 [Before Deployment]:
a. Update the pipeline file: build-pipeline-api.yml, in **task: CopyFiles@2** (for packages), change the values of "SourceFolders" and "Contents" as below:
SourceFolder: '$(Build.SourcesDirectory)\\ngo-api\\NGO\\packages\\EntityFramework.6.4.4\\tools\\net45\\any\\'
Contents: 'ef6.exe'
b. DevOps: update command in the task of Migrate database to
ef6.exe database update --assembly $(CoreContextDLL) --connection-provider System.Data.SqlClient --connection-string "$(ConnectionString)" --verbose
Card: Logframe reporting: the completed report is missing 'ReportingName' in database in case the approval has been recalled/rejected before <https://trello.com/c/U2slptPo>
- We can re-use existing tool NGO.Core.Tools.PeriodNamesPopulation to update reporting's name
<https://trello.com/c/Uq9hSRue/2901-financebox-budget-actuals-box-budget-actual-dont-show-up>
[After deployment]: after run Tools/NGO.Core.Tools.FixBudgetCalculation (update App.config (db,storage, queue name) and run the tool), verify the webjob FinancialActualAsyncFunctions run Success
<https://trello.com/c/wHtaamEW/2896-beneficiaries-should-display-the-next-period-not-report-yet-when-open-the-actual-form>
Lost Beneficiary ReportingName in db after it's approved
We can re-use existing tool NGO.Core.Tools.PeriodNamesPopulation to update reporting's name for Beneficiary
For Live only - Manually fix existing data for beneficiary reporting periods
[After deployment]: DataFixes/20221201_QueryAndManuallyCorrectBeneficiaryReportings.sql
Vien notes: no card associated
-- Remove ModidiedDate/ModifiedBy/CreatedDate/CreatedBy in Allocation function
-- This is redundant fields since 12/2021 when we remove Org Allocation function
-- Script to ensure redundant fields to be removed from form/listview in Allocation function
delete from CoreFieldInstanceLocations where FieldInstanceId in (3001,3002,3003,3004) and Id in (901,902,921,922,923,940,943,947,952,953)
delete from CoreCacheItems
- 3.8.2
<https://trello.com/c/wHtaamEW/2896-beneficiaries-should-display-the-next-period-not-report-yet-when-open-the-actual-form>
Lost Beneficiary ReportingName in db after it's approved
We can re-use existing tool NGO.Core.Tools.PeriodNamesPopulation to update reporting's name for Beneficiary
For Live only - Manually fix existing data for beneficiary reporting periods
[After deployment]: DataFixes/20221201_QueryAndManuallyCorrectBeneficiaryReportings.sql
- 3.8.0
Card: [M] Issue with Actual breakdown template validation when changing validation type <https://trello.com/c/wI75Eoh7>
[After deployment]: DataFixes/20221005_UpdateBreakdownDetailsForLogframe.sql
Card: Admin UI / Manage task template: when editing existing template without approval, "Optional review" section is still required, and can't save it with this validation <https://trello.com/c/bDWb6GpJ>
[After deployment]: 20221024_UpdateDefaultReviewTypeForOptionalReviewTaskTemplate.sql
Card: [S] Entity_EntityCode have an ecoding error if the user inputs Special characters to entityCode (not by auto-generated by the system) <https://trello.com/c/QqefJ10T>
Update web.config: find existing </system.webServer> and below it, add these lines:
<!--Explanation: to solve the case some angular entity URLs not working when reload page, e.g. entity/1/QA%2520 -->
<location path="entity">
<system.webServer>
<httpErrors errorMode="Custom" existingResponse="Replace">
<remove statusCode="404" subStatusCode="-1" />
<error statusCode="404" path="/" responseMode="ExecuteURL" />
</httpErrors>
</system.webServer>
</location>
Card: [S] [Geography] The data in the AREA column of the View form should be displayed same as Edit form <https://trello.com/c/Md11V9me>
Run this script if environment have this issue (see trello card above), otherwise no need to again.
20220323_MigrateOptionsHavingSpaces.sql
Card: Program/Org Unit - Monitoring: correct TabFunctionId = 30 in CoreEntityTabs<https://trello.com/c/jFYfSV2b>
Run this script to correct TabFucntionId for monitoring in Program and Org Unit
20221103_UpdateMonitoringTabFunctionId.sql <Next version>
[L] Analyse permissions
<https://trello.com/c/xwtersaM/2809-l-analyse-permissions>
For developer who upgrades new core version: please run 'https://localhost:44318/api/core/analyse/generateViews', if any error, it might be there are some new custom Analyse tables in your client project, please review them and update code related to 'AdditonalJoins' to use the right column to join (see Core code for your reference)
[M] Consolidate webjobs
  - Create a new project "NGO.WebJobs.Job"
    - Based on the "Azure WebJob (.NET Framework) template
    - Add Nuget references to:
      - DocumentFormat.OpenXml.Extensions
      - NGO.Core.Common
      - NGO.Core.Model
      - NGO.Core.Repositories
      - NGO.Core.Services
      - NGO.Core.Infrastructure
      - NGO.Core.WebJobs.Common
      - NGO.Core.WebJobs.Job
      - Sendgrid (9.12.0)
      - Unity (5.11.1)
      - Azure.Storage.Queues (12.12.0)
    - Add files with content from corresponding files in theNGO.Core.WebJobs.Job project:
      - Program.cs
      - UnityConfig.cs
      - app.config
  - Modify the build-pipeline-api.yml file:
    - Remove any instances of - task: ExtractFiles@1
    - Add
      - task: DotNetCoreCLI@2
      inputs:
      command: 'publish'
      publishWebProjects: false
      projects: '**/NGO.WebJobs.Job.csproj'
      arguments: '--configuration ${ { parameters.buildConfiguration} } --output $(Build.ArtifactStagingDirectory)/WebJobs/app_data/Jobs/Continuous/Job'
      zipAfterPublish: false
      modifyOutputPath: false
  - Overridden webjobs
    The functionality of each Core webjob is now defined in a service interface + class. To override the behavior of a Core job, add a new service class that extends the corresponding Core job service. This can be placed in the NGO.WebJobs.Job project and can contain any logic needed. Update the dependency injection registration to use your custom service in the NGO.WebJobs.Job.UnityConfig.RegisterTypes method.
  - [Optional] Migrate custom webjobs to the new model
  - Add NGO.Core.Tools.Common to Deployment project.
  - Before deployment, delete all existing webjobs in Azure!
- 3.7.4
<https://trello.com/c/wHtaamEW/2896-beneficiaries-should-display-the-next-period-not-report-yet-when-open-the-actual-form>
Lost Beneficiary ReportingName in db after it's approved
We can re-use existing tool NGO.Core.Tools.PeriodNamesPopulation to update reporting's name for Beneficiary
For Live only - Manually fix existing data for beneficiary reporting periods
[After deployment]: DataFixes/20221201_QueryAndManuallyCorrectBeneficiaryReportings.sql
- 3.7.0
Card: [M] Finance, Monitoring tab: Add export to excel for budget vs expenditure table
< https://trello.com/c/tNHvm870>
[After deployment]: DataFixes/20220921_RemoveWrongTabFunctionForProgramMonitoring.sql
Card: [T] Task templates: Typo in default templates
[T] Task templates: Typo in default templates on Current sprint - Core | Trello - https://trello.com/c/lIsG7uBe/2714-t-task-templates-typo-in-default-templates
[After deployment]: DataFixes/20221923_UpdateResourceStrings_Beneficiary.sql
Card: [S] Deployment: Make SQL errors in deployment cause the deployment to fail
https://trello.com/c/GcZeUV9Y
Replace the last line in SeedDb.ps1 with:
Get-ChildItem -Path $PSScriptRoot -Recurse -Filter "*.sql" | sort FullName | foreach { Write-Output 'Running script: ' $_.FullName; Invoke-Sqlcmd -ConnectionString "$CoreContextConnectionString" -InputFile $_.FullName -Verbose -ErrorAction Stop }
==> Must copy from Core ( alot of hidden space after the { and } . If you copy from here remember to remove those spaces)
Card: [T][Task] Incorrect default responsible person when manually creating a task from task template <https://trello.com/c/J3i6pbrb>
[After deployment]: DataFixes/20221003_UpdateResourceStringForDefaultResponsiblePerson.sql
Card: [S] Summary, Risks box: Pop-up is empty again when clicking on a number <https://trello.com/c/bWadZZc6>
[After deployment]: DataFixes/20221006_UpdateRiskSummaryForm.sql
Card: [S] Documents, Limited permissions, can't select "Restricted users" in View or Edit - is this by design? <https://trello.com/c/4AvOpuum>
[After deployment]: 20221012_UpdatePermissionRoleNameInLimitedPermision.sql
- 3.6.7
<https://trello.com/c/wHtaamEW/2896-beneficiaries-should-display-the-next-period-not-report-yet-when-open-the-actual-form>
Lost Beneficiary ReportingName in db after it's approved
We can re-use existing tool NGO.Core.Tools.PeriodNamesPopulation to update reporting's name for Beneficiary
For Live only - Manually fix existing data for beneficiary reporting periods
[After deployment]: DataFixes/20221201_QueryAndManuallyCorrectBeneficiaryReportings.sql
- 3.6.0
For ngo-nextgen only (clean up unused fields in logframe)
delete from CoreFieldInstanceLocations where id >= 20455 and id <= 20517
delete from CoreCacheItems
Show view only in main form when Auto Sum Not Editable validation applied (run again to ensure this logic)
[After deployment]: DataFixes/20220816_UpdateReadOnlyDependencyForSumNotEditableLogframe.sql
Card: [T] [Side effect] Wrong format and default config in core scripts <https://trello.com/c/D3sqFIrI>
[After deployment]: DataFixes/20220905_UpdateTaskTemplatePermissions.sql
Card: Admin UI: Metadata error messages <https://trello.com/c/fz74ePNB>
[After deployment]: DataFixes/20220906_UpdateResourceString_DeleteOptionError.sql
Card: [T] Workflow, Activate phase form: Rename reference to 'project' <https://trello.com/c/Mrfd8jag>
[After deployment]: 20221609_UpdateWorkflowResourceStringDescription.sql => Changed file name on version 3.7 to: 20220916_UpdateWorkflowResourceStringDescription.sql
[S] Logframe / Reporting: After rejecting report, there is no Save button when re-editing. Also no option to re-send for approval when re-opening an approved report
<https://trello.com/c/wrmw3wtY>
<https://trello.com/c/pS7zJHBD>
[After deployment]: DataFixes/20220914_AllowReApproval.sql
Card: [Technical] Update 'UnityConfig.cs.pp' file in nuget folder
<https://trello.com/c/yeVB1Qu2>
Note1: when upgrading new core version, if it says to replace file 'UnityConfig.cs', please allow to replace file and then compare with previous file and copy specific lines that needed for your client project.
Note2: check if your client project has NgoContext, if exists please replace Row 43 (see Row 43 in image below) with two new lines in 'App_Start/UnityConfig.cs' file:
container.RegisterType<Core.Repositories.CoreContext, Repositories.NgoContext>(new PerRequestLifetimeManager());
container.RegisterType<Repositories.NgoContext, Repositories.NgoContext>(new PerRequestLifetimeManager());
Note3: if your client project has custom NGO.WebJobs.Common, please find 'UnityConfig.cs' inside and add those two lines RegisterType but with PerResolveLifetimeManager for webjob.
PowerBI v2
https://trello.com/c/8oIfhF5S/2527-m-power-bi-configurability-v2
Run DataFixes/20220714_PowerBIv2.sql
Card: Entity overall status box: Add more field options <https://trello.com/c/x201Jstw>
[After deployment]: DataFixes/20220915_EntityOverallStatus_RemoveDuplicateTextField2.sql
- 3.5.2
<https://trello.com/c/wHtaamEW/2896-beneficiaries-should-display-the-next-period-not-report-yet-when-open-the-actual-form>
Lost Beneficiary ReportingName in db after it's approved
We can re-use existing tool NGO.Core.Tools.PeriodNamesPopulation to update reporting's name for Beneficiary
For Live only - Manually fix existing data for beneficiary reporting periods
[After deployment]: DataFixes/20221201_QueryAndManuallyCorrectBeneficiaryReportings.sql
- 3.5.0
Card: Task batch: when selecting multi templates along with multi entity, it causes the messgae content greater than the limitation (Messages cannot be larger than 65536 bytes.)
<https://trello.com/c/UBUUxAen>
Add configuration key in Azure:
key="sp:TaskBatchBlobQueue" value="taskbatchblobqueue"
key="sp:TaskBatchBlobReference" value="taskbatch/{queueTrigger}"
key="sp:TaskBatchBlob" value="taskbatch"
==> Must copy the "taskbatch/{ queueTrigger} " from Core WebConfig ( alot of hidden space after the { and } . If you copy from here remember to remove those spaces)
Card: [S] Descriptions Overview boxes on entities do not work out-of-the-box <https://trello.com/c/H0bL3u4z>
[After deployment]: DataFixes/20220916_RemoveOldFieldForDescriptionOverviewBox.sql
Card: [S] Analyse, "Incoming funding" is currently used for both Projects and Fundings, update to have them separate <https://trello.com/c/MPUCXP2E>
[After deployment]: DataFixes/20220810_UpdateIncomingFundingForProjectInAnalyse
Card: [S] ADMIN - View rights doesnt't work in Admin (#132647) <https://trello.com/c/BBW2jIuk>
[After deployment]: DataFixes/20221808_AdminUI_AddViewPermissionForRolesWithEditPermission.sql => Changed file name on version 3.7 to: 20220818_AdminUI_AddViewPermissionForRolesWithEditPermission.sql
Card: [S] Fields: Form field, Links - urlWithTitle only allows single, to allow multiple<https://trello.com/c/goZeAM1q>
[After deployment]: DataFixes/20220802_FixLinkControl.sql
[T] Entity overall status summary box name change
DataFixes/20220727_OverallProjectStatus_ResourceString.sql
Missing options - https://trello.com/c/s783Ut0Q
- Now must use DependentIds instead of ParentId when Option's parent come from another table (not in CoreFieldOptions, in this case the parent are come from CoreFundingCostStructures )
- Only run if missing options caused by the problem above
20220909_BudgetBreakdownOptionFix.sql
Fix Admin portal icons
Add imports to free-solid-svg-icons in app.module.ts
faMapMarker, faUserTag
Card: [S] Payment tab, Browse: Add 'Date approved' column<https://trello.com/c/BCuKzQhv>
[After Deployment] 20220823_UpdatePaymentDateApproved.sql
Upgrade TinyMCE for test automation
Update angular.json and replace json node projects.ngo-nxt.architect.build.assets with this:
"assets": [￼ "src/favicon.ico",￼ "src/assets",￼ "src/web.config",￼ {​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​ "glob": "**/*", "input": "node_modules/tinymce", "output": "/tinymce/" }​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​￼ ],
and node projects.ngo-nxt.architect.build.scripts with this:
"scripts": [ ￼ ​​​​​​​ "node_modules/tinymce/tinymce.min.js"￼ ]￼
Then run this npm command:
npm install @angular/animations@8.2.14 @angular/common@8.2.14 @angular/compiler@8.2.14 @angular/core@8.2.14 @angular/forms@8.2.14 @angular/platform-browser@8.2.14 @angular/platform-browser-dynamic@8.2.14 @angular/router@8.2.14 @tinymce/tinymce-angular@3.6.1 tinymce@5.10.4 @angular-devkit/build-angular@0.803.29 @angular-devkit/build-ng-packagr@0.803.29 @angular/cli@8.3.29 @angular/compiler-cli@8.2.14 @angular/language-service@8.2.14 --legacy-peer-deps
- 3.4.1
Card: [S] [Logframe/Indicator Tracker view] Columns in indicator are pushed back by 1 column in Indicator Tracker<https://trello.com/c/iOeD6by4>
[After deployment]: DataFixes/20220805_FixLogframeYTDColumn.sql
- 3.4.0
Approval PDF - Logframe Indicator Tracker
DataFixes/20220729_UpdateLogframeTaskApprovalSettings.sql
Logframe draft versions
From now on, the draft version of logframe will be auto generated after the previous version published via
  - Add system configuration key for webjob queue in Azure Setting "sp:GenerateLogframeDraftVersionQueue": generatedraftversionqueue-dev
  - In case client project, please make sure to add
- task: ExtractFiles@1
displayName: 'extract GenerateLogframeDraftVersion'
inputs:
archiveFilePatterns: '**\NGO.Deployment\**\GenerateLogframeDraftVersion.zip'
destinationFolder: '$(Build.ArtifactStagingDirectory)/WebJobs/app_data/Jobs/Continuous/GenerateLogframeDraftVersion'
in the build-pipeline-api.yml file
  - [After deployment]
Run Tools/NGO.Core.Tools.PopulateLogframeDraftVersions to generate draft versions for remaining published versions which don't have draft version
Project Budget: Allow review workflow when budget exceeds total funding
Add system configuration key for allow review workflow when budget exceeds total funding: ByPassReviewValidationForBudget
Admin UI, Manage users: All users showing as 'Guest users'
Add configuration key in Azure Setting for configuring internal domains: InternalDomains
Update overview document box to show icon
DataFixes/20220422_UpdateShowIconForDocumentBox.sql
Beneficiaries template: names of categories in Dissagregation and Additional Breakdown not support multi language.
If client project customize the names of beneficiaries template, please change the name in templates to resource strings and write the hot fix script to correct old data following the hot fix below. If not, run
this hot fix before deployment
DataFixes/20220517_UpdateResourceStringForBeneficiaryCategories.sql (read the note above)
Logframe: Cannot report on Breakdown if no breakdown targets are set
DataFixes/20220520_LogframeIndicatorTracker_AddMissingBreakdowns.sql
Admin UI - Permissions - Recycle bin
DataFixes/20220602_CoreRolePermissions_ReplaceViewByListPermissionForRecycleBin.sql
Tab entry number: Add a function similar to the EntityNumber generation for tab entries
DataFixes/SequenceNumberFix.sql
Add min-width for Start page Task box column to support mobile UI
20220622_UpdateMinWidthForStartPageTaskBox
Fix for modification info fields (modifiedDate, createdDate, modifiedBy, createdBy) of Stakeholder Compliance https://trello.com/c/fqRJmUK8
DataFixes/20220628_StakeholderCompliance_FixModificationInfoFields.sql Pull request - https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/11028
Finance tabs: Have exchange rates auto-fill but remain editable - https://trello.com/c/yZIw8i1y
Base on the current configuration of the client, make sure to update all sql script of the client to the value from
ExchangeRatePublishMode { Editable = 0, AutoFill = 1, AutoFillAndEditable = 2 } . More detail in Config wiki > CoreExchangeRates
for these key
( 'AutoSetBudgetExchangeRate' ,'AutoSetFundingExchangeRate' , 'AutoSetExpenditureExchangeRate')
[BeforeDeployment] 20220628_update_ExchangeRatePublishMode.sql
Remove default Description field in Overview box description, use Description field from Entity instead
20220707_RemoveDescriptionFieldInOverviewboxDescription.sql
Recalculate budget total amount for old data
Run tool Tools/NGO.Core.Tools.UpdateTotalBudgetRow . Correct connection string
Fix validation for Breakdown form - https://trello.com/c/KWbxIFnD/2493-s-logframe-baseline-target-inputs-not-working-correctly-in-cfgb
IMPORTANT NOTE: for CFGB
Logframe - Structure - Objective form: From now in Breakdown config, we will remove "extraIndicatorBaselineColIndex : 3". Any client that is using this one should be updated to use colIndex = "indicatorColIndex: 1" instead.
Run manual script to setup logic related to Validation AutoSum Not Editable
20220816_UpdateReadOnlyDependencyForSumNotEditableLogframe.sql
Note for Core Development Env after this card is approved:
[Clean up Test fields - ignore this in client projects] Need to run LogframeBreakdownDataFix.sql to fix Logframe data
Update log overview box
DataFixes/20220329_UpdateLogBoxSetting.sql
Add missing Document icon to Document box item
20220701_FixMissingIconInDocumentBox.sql
- 3.3.0
Income schedule: update Donor fields displayed in Admin UI
DataFixes/20220718_IncomeSchedules_DonorFields.sql
Finance/Funding Plan/Form - Should link to a separate approval task template in standard setup scripts
DataFixes/20220623_UpdateTaskApprovalSetting.sql
Display wrong tabfunction when using condition https://trello.com/c/Zk3n3vKH
Remove FinanceRouteGuard from the override service of FundingFinanceRouteService
Pull request 10446: [S] Finance/Sub tabs with conditions - Wrong view is shown when switch from Agreements tab (refresh in Agreements tab + first access in Finance tab - Repos (azure.com) - https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/10446?_a=files&path=/ngo-client-core/projects/ngo-core/src/lib/funding-finance/funding-finance-route.service.ts
- 3.2.0
Beneficiaries Boxes - Add figures of EOP if existing
[After deployment]: DataFixes/20220525_Beneficiaries_boxes_AddEOP_Info.sql
Logframe: Cannot report on Breakdown if no breakdown targets are set
DataFixes/20220520_LogframeIndicatorTracker_AddMissingBreakdowns.sql
- 3.1.0
Remove recent box on start page (only run if customer don't want to use it)
[After deployment]: DataFixes/20220330_DeleteRecentBoxInStartPage
  - Step1: Review custom script in your client project related to CoreRolePermission and remove PermissionId 1352,1354,1402,1404 in your project custom script (if any)
  - Step2: Run [After deployment]: DataFixes/20220331_RemoveUnusedRecycleBinPermissions.sql
Update FieldDefinitionId for "Heading" fields
DataFixes/20220405_UpdateFieldDefinitionIdForHeadingFields.sql
Fix data for overviewbox
DataFixes/20220225_UpdateDataForOverviewBoxes.sql
Task-Gantt chart: update coreconfiguration for ShowGanttTask to new GanttTaskConfiguration
[After deployment]: DataFixes/20220414_FixTaskListSetting.sql
Admin UI / Task template / Edit template of All entity type: Default responsible field has no option
DataFixes/20220414_Update_EntityIsLimitedEntity.sql
Add route to app-route.service below the access-denied:
{ path: 'unauthorized', component: UnauthorizedComponent } ,
- 3.0.2
Logframe Multiple-line fields in View form
DataFixes/20220428_Logframe_Rollup_multiple_line_fields_in_view_form.sql
Payment - Upload receipt form - https://trello.com/c/CyPrMKtI - update
[After deployment]: DataFixes/20220504_UpdateTaskFinalisationPermission.sql
- 3.0.0
Logframe Multiple-line fields in View form
[After deployment]: 20220307_Logframe_multiple_line_fields_in_view_form.sql
Links box appears blank when you first open the page
Permission matrix of each entity, ensure user has Edit permission in Link box
(Previous version, it uses View permission for Edit link in box, and toolbox item is using permission of Edit entity)
Payment - Upload receipt form - https://trello.com/c/CyPrMKtI
Read note Payment Upload Receipt in Config Wiki
Example script file: 20220310_Payment_reciept.sql
Migrate permission: 20220504_UpdateTaskFinalisationPermission.sql
Add status column name to Start page - My task form
DataFixes/20220311_AddStatusColumnNameToMyTask.sql
Add list setting for Startpage Mytask box
After deployment: update CoreOverviewBoxInstances set CoreListSettingId = 84 where OverviewBoxDefinitionId = 7
  - (Before deployment) DataFixes/20220322_Logframe_Config_IndicatorType_For_CustomIndicator.sql
  - If client project does use 'linked global indicator' field for custom indicator, should use below script (adding to Custom Script in folder DatabaseSeed) to update correct values for field config:
- 2.24.0
Analyse / Beneficiaries: Name of Target and reporting period not same as form
After deployment:
Run migration tool for Beneficiaries: NGO.Core.Tools.PeriodNamesPopulation
Run script: DataFixes/20220218_Beneficiaries_RemoveUnusedView.sql
[Admin portal_Allocations-'Project']Change project field name to entity page
DataFixes/20220217_UpdateResourceStrings_AdminAllocations.sql
Correct Id of mandatory fields
Before deployment: 20220309_CorrectIndexField.sql
Remove duplicate field in Idea
DataFixes/20220311_RemoveDuplicateFieldInIdea.sql
Admin / Metadata: Ensure resource string key has no space or dot
[After deployment]: 20220323_MigrateOptionsHavingSpaces.sql
  - Make sure No more Characteristic > isResourceLibrary in the sql script / code, replace it with Characteristic > isResourceLib
  - FOR DEV who upgrade to this version Read and follow the instruction in 20220324_FixCharacteristic.sql
- 2.23.0
Tasks: 'Display in workflow tab' checkbox disappears after task created
DataFixes/20220217_Task_DisplayTaskFlowOptionEditMode.sql
Logframe - Associated global indicator is required - can't be deleted but can be update to another global indicator
After deployment: DataFixes/20220210_LogframeMandatoryGlobalIndicatorLocked.sql
[T] BUG: The resource string for the button to create new tasks is wrong
DataFixes/20220124_UpdateResourceStrings.sql
- 2.22.3
Double check if you Override "app-route.service.ts" in your Client project
Add canDeactivate: [ConfigurationDeactivateGuard] to each of the state, like in Core
Check https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core-test/pullrequest/8985
- 2.22.0
Task Template: support permission as multi-choice
Run migration tool to update permissions in task template: NGO.Core.Tools.TaskTemplateApprovalStepsMigration
For developer: Please find if any task template configured in custom scripts in your client project, and update ApprovalPermissionGroups, ReviewPermissionGroups in CoreTaskTemplates to new format (see image for your reference)
Analyse/Logframe: update name of target and reporting period name
(Improve performance of SQL statement)
DataFixes/20220103_Logframe_UpdateTargetReportPeriodName.sql
Show checkbox" Display on workflow"
DataFixes/20220105_UpdateFieldDisplayOnWorkflowTab.sql
Approval recall email sent to wrong person
Run SQL "UPDATE CoreEmailTemplates SET ReceiversTokenKey = '[[Task.ResponsiblePerson]]' WHERE Id = 113"
"Is latest published version" field for Logframe
DataFixes/20220105_UpdateLogframe_IsCurrentPublishedVersion.sql
  - Check New agreement/ amendment structure configuration and migration in Agreements in Config Wiki
  - Add these field locations as an After Deployment oneTimeFix sql file. https://trello.com/c/UQjEPmJW/1422-agreement-browse-view-mandatory-fields-need-to-be-moved-to-corect-script-file
  - Check ReviewMode column on CoreTaskTemplates in custom scripts of project clients, if null, change value to 0 on that script.
  - DataFixes/20211231_UpdateReviewMode_CoreTaskTemplates.sql
- 2.21.0
Logframe: Add export to excel to rollup
DataFixes/20211217_Program_IndicatorTracker_RemoveRollupConfig.sql
Finance allocation - Remove modified by dropdown
DataFixes\20211215_FundingAllocation_Remove_ModifiedBy.sql
[T] Tasks tab: Rename free-text search filter
20211208_UpdateResoureString_TaskTab.sql
Analyse: Generate report and email
Add configuration key in Azure settings for web job
sp:AnalyseExportQueue
sp:AnalyseBlob
sp:AnalyseBlobQueue
sp:AnalyseBlobReference
Add AnalyseExport webjob to api pipeline yaml file
Partner Portal - to be able to Hide entities in the Top bar that users don't have access to
Need to add List permission for roles that already had View permission to make sure users won't be redirected to 403 page
Run DataFixes\20211213_CoreRolePermissions_AddListPermissions.sql
* Note: for client projects, please make sure to add the necessary List permissions into CorePermissions (since Core script doesn't cover all custom functions) before running the above script
[Finance-Allocation] Lost data in Modified By dropdown > Can't create an allocation
Run DataFixes\20211215_FundingAllocation_Remove_ModifiedBy
Logframe: Add export to excel to rollup
Run DataFixes\20211217_Program_IndicatorTracker_RemoveRollupConfig.sql
Remove duplicate status column in tasks list
DataFixes/20220107_TaskList_FixDuplicateStatusColumn.sql
- 2.20.0
[Before Deployment] [Analyse] Remove itemTask.Checklist
20211122_Analyse_Remove_Column_Task_Checklist.sql
CoreResourceStrings: Admin portal, Exchange Rates - Rename "Exchange rate" to "Exchange rates"
DataFixes/20211025_UpdateReourceStrings.sql
AdminUI / Entity Configuration / Only show Folder Structure tab
If in client projects, admin can see all tabs (General, Fields, Overview boxes, Browse, and Folder Structure), please add Permission Id (1804, 1805, 1806, 1807, and 1808) to admin role
Remove OrgUnit/Program Finance
Remove OrgUnit/Program Finance allocation list + form + view form + allocations list, controller, service
Update ShowFundingSourceInAllocation config from boolean to GenericItems with parentId: entityId, id: tabFunctionId, Active: show/hide funding source. If parentId is not set, the configuration will apply to tab function of all entities.
Run DataFixes\20211116_FundingAllocationUpdates.sql before Deployment
Summary page Standard box - Entity Overall Status
Run DataFixes\20211124_EntityTab_Remove_Function_Announcement_EntityStatus.sql
Remove attachments from any email templates
Run script "UPDATE [dbo].[CoreEmailTemplates] SET Attachments = NULL"
- 2.19.1
[Project_Tasks] 'Task/Milestone' and 'Responsible' columns are duplicated
Run DataFixes\20211130_TaskList_Remove_Redundant_Fields.sql
- 2.19.0
Gantt Chart in Task
+ Add faStream, faList to @fortawesome/pro-regular-svg-icons in app.module.ts
  - Add to Azure configuration with key and value: <add key="sp:WorkflowBypassQueue" value="workflowbypass"/>
  - Add to *.yml config file to deploy web job BypassPhaseManagement
  - Run to correct resource string DataFixes/20211004_WorkflowByPassResourceUpdates.sql
Document: add characteristic to fied FileLeafRef to open with app / online by global configuration
[After deployment]: DataFixes/20211109_Document_link_Open_Characteristics.sql
Access denied page:
Recheck all override route services with Core to add "UserAuthGuard" as the 1st one to "canActivate" of routes
And also add "canActivate: [UserAuthGuard]," to routes in customize route services
- 2.18.2
2.18.2 fixes a small bug in the core.sql script. This can manually be fixed by adding this script to a custom script.
UPDATE CoreFieldDefinitions SET SqlMapping = '{ Type: 1, RawColumns: ["ISNULL(cwfiResx.Value, cwfi.CurrentPhaseName) AS CurrentPhase"], ColumnNames: ["cwfi.CurrentPhase as CurrentPhaseId" ], Joins: [{ TableName: "CoreWorkflowInstances", Alias: "cwfi", First: "cwfi.EntityId", Second: "e.Id", Type: 2} ,{ TableName: "CoreResourceStringsView", Alias: "cwfiResx", TableHints:"WITH(NOEXPAND)", Conditions: [{ First: "cwfiResx.FullKey", Second: "cwfi.CurrentPhaseName"} , { First: "cwfiResx.localeId", Second: "@localeId"} ], Type: 4} ]} ' WHERE Id = 63
2.18.1 (Use 2.18.2 instead)
Budget template: Update template pdf for budget
DataFixes/20211104_UpdateBudgetPdfTemplate
- 2.18.0
NG TEST ENV - Admin Portal, metadata list, duplicates and spelling error
20210928_UpdateNamesForOptionsLists.sql
[Amin portal] Remove preview field in manage Email
20211008_RemovePreviewFieldInAdminManageEmail.sql
Funding plan Approval PDF - Add more info
UPDATE CoreTaskApprovalSettings SET PdfTemplates = '[{ extraValue: "/Documents/PdfTemplates/FundingPlanApprovalTemplate.docx", sortOrder: 2, extraText: "MAIN"} ]' WHERE EntityDefinitionId = 6 AND TabDefinitionId = 16 AND TabFunctionId = 18
- 2.17.0
  - Run DataFixes/20210909_RemoveTaskEntityId.sql
  - Run DataFixes/20210831_UpdateLogframePeriod.sql
  - Update target period / reporting name: Run Tools/NGO.Core.Tools.LogframePeriodNamesPopulation
  - Add code plugin: in angular.json file, add "node_modules/tinymce/plugins/code/plugin.min.js" next to "node_modules/tinymce/plugins/link/plugin.min.js"
  - Add to Environment files: emailTemplates: 'api/core/emailTemplates'
  - 20210830_UpdateDataForSortingMySitesBox.sql
  - Run DataFixes/20210910_UpdateCheckPermissionIdForWorkflowTabFunctions
- 2.16.0
Update email template for send document
DataFixes/20210821_UpdateEmailTemplateForDocument.sql
Admin UI - Metadata - Update error message confirm dialog when deleting any options.
DataFixes/20210726_UpdateResourceStringKeysForRemoveOption
My Recent documents pop up - File paths spill out (should be wrapped)
[After deployment]
DataFixes/20210803_UpdateFieldCharacteristicsForDocumentsBox.sql
CoreNews: Update value of old columns to new columns
[After deployment]
DataFixes\20210705_UpdateColumnDataOfNews.sql
Logframe:
Change name of breakdown option: DataFixes\20210726_UpdateResourceStrings.sql
IdeaMemberFields in CoreConfigurations Update JSON format from [{ "entityId": number, "fields":string[]} ] to [{ "entityId": number, "roles":[{ "id": number, "fields":string[]} ]} ]
- 2.15.0
CoreResourceStrings: Document button bar - Rename "New from template" to "New Document"
[After deployment]
DataFixes/20210701_UpdateResourceStringKeysForDocumentButton.sql
Admin UI - Adjust "Administrator" role permission
DataFixes: 20210617_UpdateAdminPermissionOnAdminUI
Approval file name without having number formating (copy two below lines into a manual script file in your client project)
UPDATE CoreTaskApprovalSettings SET TaskFolderSetting = REPLACE(TaskFolderSetting, N'}​​​', N', extraText: "####"}​​​​​​​​​​') WHERE TaskFolderSetting LIKE '%}​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​' AND TaskFolderSetting NOT LIKE '%extraText%'￼ UPDATE CoreTaskApprovalSettings SET PdfFileNameFormat = REPLACE(PdfFileNameFormat, N'}​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​', N', extraText: "####"}​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​') WHERE PdfFileNameFormat LIKE '%}​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​' AND PdfFileNameFormat NOT LIKE '%extraText%'￼
Logframe EOY
Before upgrade/deployment: Run this file DataFixes\20210610_[Before]_Logframe_Add_EOY.sql
Funding Entity Page: Update Resource String with key = "untrack_funding" for funding entity toolbox
Before upgrade/deployment: Run this file DataFixes\20210628_UpdateResourceStringValuesForUntrackingFunding
CoreFieldInstances: Update Chacracteristics with ExportDispalyedName property for project name
[After deployment]
DataFixes\20210608_UpdateCharacteristicWithExportDisplayNameForProject.sql
Admin Options: set special lists as system, and read-only in UI
DataFixes\20210812_UpdatePermissionsOfMetadataList.sql
- 2.14.0
CoreFieldInstances: Update the resource key in Log, Log2 CorefieldInstances to separate the resources
[After deployment]
DataFixes\20210506_UpdateResourceStringKeysForLogAndLog2.sql
AdminUI - Folder structure
Update resource string, run this script DataFixes\20210513_AdminUI_Folder_structure_updates.sql
Change task assignment: add API url to environment files
taskAssignmentChanges: 'api/core/taskAssignmentChanges'
CoreFieldInstancesLocations: Level, Objective ID and Objective Description should be separate columns
[After deployment]
DataFixes\20210514_UpdateLogframeIndicatorTrackerListViewColumns.sql
InitAnalyse: Update SqlMapping in the [CoreAnalyseTableRelations] for Entities having Budget , Budget Row in Analyses ([TabFunctionId2] = 31)
DataFixes\20210520_UpdateJoinConditionColumnForAnalyseBudgetAndBudgetRows.sql
Change member assignment: add API url to environment files
membershipChanges: 'api/core/membershipChanges'
CoreResourceStrings: Logframe Breakdown template: update validation messages
[After deployment]
DataFixes\20210526_UpdateResourceStringValuesForLogFrameValidationMessages.sql
Power BI
npm install powerbi-client
Import PowerBIModule to app.module.ts
add API url to environment files
powerBI: 'api/core/entity',
- 2.13.7
Power BI
npm install powerbi-client
Import PowerBIModule to app.module.ts
add API url to environment files
powerBI: 'api/core/entity',
- 2.13.0
Validation visibility dependency migration
[After deployment] Run SQL script: Datafixes\20210408_Validation_VisibilityDependency.sql
Fix IsCurrentPublishedVersion for Funding Plan Version - https://trello.com/c/JO7uhLzm
[After deployment] Run DataFixes\20210415_Update_fundingPlanCurrentVersion.sql
  - Extend number of digits in decimal part
[Before deployment / version upgrade]: Run DataFixes\20210419_Budget_Multi_Currency.sql
  - Multi-currency in admin allocation/private funds: ensure that
    - Edit / view form: Amount field is replaced by AmountCur field
    - Edit / view form: Currency and Exchange rate fields are added to field locations (compared with Core) of each tab function (admin allocation: 62; private fund allocation: 19)
    - Private fund allocation list: ensure there is a currency filter in list settings, and AmountOutCur field in list fields
Update Type value for documentLinks field in Log and Logs, change it from 3(Single choice) to 4 (Multiple choice)
[After deployment]
DataFixes\20210428_CoreFieldInstances_UpdateTypeForDocumentLinkField_LogsAndLog2.sql
Contact: add format to combine title + first name + last name for field in browse list
This script to ensure the new field is addded
  - Run DataFixes\20210429_AddContactNameFieldAsFirstLastName.sql
  - Regenerate browse view
CoreFieldInstances: Fix RelId from 13 to 14 for Stakeholders2 in Log
[After deployment]
DataFixes\20210429_UpdateRelIdForStakeholders2InLog.sql
Search label consistency: remove all old search label to updates the new text
[Before deployment]
DataFixes\20210429_MakeSearchLabelConsistent.sql
Deployment update
  1. Add "Download secure file" as first step under "Deploy sharepoint"
  2. Select the secure file "NGOOnline.pfx"
  3. Under Output Variables set the Reference name to "appCertificate"
  4. Add another step under "Download secure file", task should be "PowerShell"
  5. Under Type select Inline and pase this script:
Write-Host "Start adding the PFX file to the certificate store."￼$pfxpath = '$(appCertificate.secureFilePath)'￼$password = '<FROM_SECRET_PROVIDER>'￼Add-Type -AssemblyName System.Security￼$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2￼$cert.Import($pfxpath, $password, [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]"PersistKeySet")￼$store = new-object system.security.cryptography.X509Certificates.X509Store -argumentlist "MY", CurrentUser￼$store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]"ReadWrite")￼$store.Add($cert)￼$store.Close()
6. Add two new Variables to the release, AppCerticatePassword, value: ask Niklas
and
AppCertificateThumbprint, value: EEFEB6E9B71B2B853E84DAA385D2F76377DBFBAF
- 2.12.0
Update SQLMapping for Strategies and Strategies2 in CoreFieldInstances table for Risk tab - It should use Type = 14 instead:
Run 20210318_CoreFieldInstances_Update_Strategies_SQLMapping.sql in DataFixes folder
Updates to manage Tabs
Run Datafixes/20210330_TabDefinitionUpdates.sql
Logframe rollup
Run 20210331_Sprint7_LogframeGlobalUpdates and 20210309_Sprint7_EntityTabUpdates.sql in Datafixes
Correct the right 'entity' field instance for summary 'recent logs' boxes
Run DataFixes/20210331_CorrectFields_ForLogBoxes.sql
(Optional) Fix sort order of my tasks box like: name | entity | workflow status | responsible | duedateRun DataFixes/20210331_UpdateMyTasksBox_FieldOrders
Unity update
This release requires changes to the dependecy injection implementation in all client projects, please see this PR for reference: https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-wwf/pullrequest/5140
https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-cbm/pullrequest/5974 (RegisterType for db context (CoreContext, NgoContext,...) need always is PerResolveLifetimeManager)
Specific files to pay attention to in the PR/Client projects are:
/ngo-api/NGO/NGO/App_Start/UnityConfig.cs
/ngo-api/NGO/NGO/App_Start/UnityWebApiActivator.cs
/ngo-api/NGO/NGO.DataMigration/UnityConfig.cs
/ngo-api/NGO/NGO.Infrastructure/Unity/CommonUnityConfig.cs
/ngo-api/NGO/NGO.Webjobs/NGO.WebJobs.Common/UnityConfig.cs
All web jobs
Define Unity container as a variable inside the function, NO LONGER static variable
- 2.11.0
Update Monitoring tab for Program
Run 20210309_Sprint7_EntityTabUpdates.sql in DataFixes folder
Update AddReviewMandatory
Run 20210310_UpdateAddReviewMandatory.sql in DataFixes folder
Migrate logframe links between global objective & global indicators to new table
Run 20210303_Logframe_Global_objective_indicator_link_migration.sql
Please note that table CoreLogframeGlobalObjectiveIndicators is now obsolete and any code referencing this needs to change.
Analyse > Beneficiaries - Include "Is latest published version" in the Beneficiaries list
[AfterDeployment] RUN DataFixes/20210318_UpdateBeneficiaryIsCurrentPublishedVersion.sql
OverallEntityStatus
Add the following line to environment.ts and environment.prod.ts:
overallEntityStatus: 'api/core/entity'
Logframe template:
Add the following line to environment.ts and environment.prod.ts:sni
logframeTemplates: 'api/core/logframeTemplates'
Import OverallEntityStatusModule to app.module.ts
- 2.10.0
Admin resource strings
Run 20210102_Sprint5_Resource_string_update.sql in DataFixes folder to update resource strings
Analyse current phase filtering
run this script 20210201_Update_Option_Mapper_Current_Phase.sql in folder DataFixes to update the option mapper of current phase field in project
Budget frequency
Fixed script: run to update for existing budget 20210122_Budget_frequency_correction.sql
Log frame: sum of breakdown by selected categories
Fixed script: run this script to move all current to new table 20210205_Logframe_breakdown_sum_categories_migration.sql
- 2.9.0
  - Import list of Awesome Font icon to client project
    - faWrench, faExclamationCircle, faNewspaper, faUmbrellaBeach, faMinus from '@fortawesome/free-solid-svg-icons'
    - faCommentAltExclamation from '@fortawesome/pro-light-svg-icons'
  - Add the following line to environment.ts and environment.prod.ts: systemBanner: 'api/core/systemBanner'
  - Import SystemBannerModule to app.module.ts
System configuration
Import list of Awesome Font icon to client project
faCog from '@fortawesome/pro-light-svg-icons'
Web.config
Add key for SQL command timeout
<add key="sp:QueryTimeout" value="180"/>
Packkage.json
Add this library: "ngx-color-picker": "^11.0.0",
- 2.8.0
Iframe
Add the following line to environment.ts and environment.prod.ts:
entityIframe: 'api/core/iframe',
Exchange rates
Add the following line to environment.ts and environment.prod.ts:
exchangeRate: 'api/core/exchangeRates'
Import awesome font icons in app module:
faPercent (free-solid-svg-icons)
Logframe indicator cumulative/non-cumulative
The setting for cumulative/non-cumulative values is now per indicator. If no config is added, it defaults to non-cumulative for existing and new indicators.
Add the following FieldInstanceLocations to enable fields on global indicators, custom indicators and YTD tracking:
-- global indicator form
(16011, 7650, 3, 2, NULL, NULL,NULL, 1, 2, 1, NULL, N'{ "defaultValue": false, "setDefaultValueOnNewFormOnly": true, "booleanTrueDisplayText": "logframe.is_cumulative_true", "booleanFalseDisplayText": "logframe.is_cumulative_false" } ', NULL, NULL, NULL, NULL, NULL),
-- entity indicator form
(16021,6629,10,1, NULL, NULL,NULL,1,2,1, 120, N'{ "customGroupedBy": "2072", "hideLabel": true, "defaultValue": false, "setDefaultValueOnNewFormOnly": true, "booleanTrueDisplayText": "logframe.is_cumulative_true", "booleanFalseDisplayText": "logframe.is_cumulative_false" } ', NULL, 5, 'px', NULL, NULL),
(16022,6629,10,1, NULL, NULL,NULL,1,2,1, 120, N'{ "customGroupedBy": "2071", "hideLabel": true, "readOnly": true, "autoCopyValueFromDependentProp": true, "autoCopyValueFromDependentFieldName": "globalIndicator", "booleanTrueDisplayText": "logframe.is_cumulative_true", "booleanFalseDisplayText": "logframe.is_cumulative_false" } ', NULL, 5, 'px', NULL, NULL),
--table tracker
(16031,6729,15,6, NULL, NULL,NULL,1,1,1, 100, N'{ "customGroupedBy": "2071;2072", "hideLabel": true } ', NULL, 1, 'px', NULL, NULL), --actual YTD indicator
(16032,6783,15,8, NULL, NULL,NULL,1,1,1, 100, N'{ "hideLabel": true, "customCssClass": "text-italic text-gray-out" } ', NULL, 1, 'px', NULL, NULL) --actual YTD breakdown
Run the following script to set existing indicators to cumulative if desired:
UPDATE CoreLogframeIndicators SET IsCumulativeInput = 1
UPDATE CoreLogframeGlobalIndicators SET IsCumulativeInput = 1
- 2.7.1
Logframe version
New permissions added for logframe version. Needs to be added to client specific permission script in various roles:
--Logframe
(1952, 2, 20, NULL, NULL), -- Add Logframe version
(1953, 3, 20, NULL, NULL), -- Update Logframe version
--Add icon faGlobeAmericas to file app.module.ts
- 2.7.0
Finance Budget rows grouped by fields
When the JSON format for Budget settings and Partner expenditure report settings is changed, Please run this SQL script to correct it
This file is located in DataFixes folder 20201120_Financial_Budget_Grouped_By_Fields.sql
Entity references to sub entity (e.g. funding has contact in form)
To generate correct browse view, it is necessary to add information of tab definition id / tab function id of sub entity
For example: Funding has 2 contacts field in form
Contact 1 mapping SQL: { Type: 18, RelId: 4, Alias: "Contact", "RelTable": { "TableName": "CoreContacts", "NameCol" : "FirstName", "TabDefinitionId": 5} }
Contact 2 mapping SQL: { Type: 18, RelId: 5, Alias: "Contact2", "RelTable": { "TableName": "CoreContacts", "NameCol" : "FirstName", "TabDefinitionId": 5} }
Announcements
Add the following line to environment.ts and environment.prod.ts:
announcement: 'api/core/announcement',
Import the following in app.module.ts:
AnnouncementModule
Generic summary/overview boxes
Add the following line to environment.ts and environment.prod.ts:
genericOverviewBox: 'api/core',
import the following in app.module.ts:
GenericOverviewBoxModule
- 2.6.0
Restricted entities
Add below attribute to ClientContext (C#)
[DbConfigurationType(typeof(SessionContextConfiguration))]
For entity framework raw SQL query, all store procedures should be executed by adding the prefix 'exec' (see below as example)
_context.Database.SqlQuery<int>("exec GetNextPaymentNo").SingleOrDefault();￼
Admin task batch
New web job NGO.WebJobs.TaskBatchManagement added. Add step to unzip to build-pipeline-api.yml:
- task: ExtractFiles@1
displayName: 'extract TaskBatchManagement'
inputs:
archiveFilePatterns: '**\NGO.Deployment\**\TaskBatchManagement.zip'
destinationFolder: '$(Build.ArtifactStagingDirectory)/WebJobs/app_data/Jobs/Continuous/TaskBatchManagement'
Web configuration: add config setting "sp:TaskBatchQueue" to API Azure service when deploying to each environment.
  - faChevronLeft,
  - faChevronRight
Financial periods: update the end date of end period (should be the last date of month)
Run the data fix script for core & all client projects: DataFixes\20201110_Financial_Period_Enddate.sql
Map
Add the following line to environment.ts and environment.prod.ts:
map: 'api/core/map',
Import the following in app.module.ts:
MapModule
- 2.5.8
Analyse: After deployment, run one time script 20201016_AnalyseFinancePerformance.sql
- 2.5.6
Admin for logframe breakdown templates
Add the following line to the environments.ts and environments.prod.ts:
logframeBreakdownTemplates: 'api/core/logframeBreakdownTemplates',
- 2.4.1
Admin for global objectives / indicators
Add the following line to environment.ts and environment.prod.ts:
logframeGlobal: 'api/core/logframeGlobal',
- 2.4.0
  - Please run file "20200928_MigrationForRelatedEntityInLog.sql" before deployment
  - Update log configuration in scripts to remove any references to FieldInsstances 2006, 2029, 2106, 2129
  - If project use FieldInstanceId 2006, 2010, 2029, 2031, 2106, 2129, 2131, 2130, please replace it to FieldInstanceId: 2006 => 2007, 2029 => 2002, 2010 => 2008, 2130 => 2108, 2031 => 2007, 2131 => 2107, 2129 => 2102, 2106 => 2107
  - Run this script "20200928_RefactorDependencyFIeldInLog.sql" after change the FieldInstanceId
- 2.3.0
Add the following dependencies to package.json in the Angular project:
"floatthead": "^2.2.1",
"jquery": "^3.5.1",
- 2.2.0
  - package.json
    Update msal -> 1.4.0
    Update @azure/msal-angular -> 1.1.1
Add "floatthead": "^2.2.1"
Add "jquery": "^3.5.1"
  - app.module.ts
    Update import { MSAL_CONFIG } from '@azure/msal-angular';
  - app-route.service.ts
    Remove MsalGuard from all top level child routes, see Core for reference
  - The table CoreFinancialPeriods stores the definition start/end month of each year. The values can be generated by store procedure [CreateFinancialPeriods] with parameters (If the table has data already, only future periods are removed by news, not past years)
    - startYear (int): year to start to generate
    - format (string): label for the period with place holder { startYear} { endYear} . If this value is NULL, default value for calendar year is { startYear} ; for fiscal year is { startYear} /{ endYear}
    - startMonth(int): the start month of the year, if not set, default value is 1
    - numberOfYear(int): length of year to be generated, default is 20 years
    - Migration tool NGO.Core.Tools.FinanceFiscalYearValueMigration to update budget month for yearly budget type, funding plan cost and grant allocation, it will set start month / start year of the relevant period to them
  - Run migration tool NGO.Core.Tools.FixPhaseNumberForTasksAddedToWorkflowByEntity to fix "PhaseNo" column for tasks that is manually added to workflow, it will set PhaseNo to correct (card: https://trello.com/c/5y35J25h)
Setup Google Analytics for Client project
1: Please add this code to file index.html in client side
<!-- Global site tag (gtag.js) - Google Analytics -->
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments);}
gtag('js', new Date());
</script>
2: Add tracking id to table CoreConfigurations with key GoogleAnalyticTrackingId
- 2.0.0
IDs for FieldInstanceLocations have been changed in Core, so any client specific scripts that reference those IDs needs to be updated to match the new IDs. Before deployment, please delete all existing rows in CoreFieldInstanceLocations.
After deployment please run this sql to ensure idea and funding idea is still set as LimitedEntity
update CoreEntityDefinitions set IsLimitedEntity = 1 where Id in (5, 12)
- 1.18.3
Admin UI: Change property / column name (Need to correct for all client projects)
ngo-list-filter: replace parameter of list setting object to collection of List filter settings with new property listFilters
CoreListFilterSettings: rename column `OrderIndex` to `SortOrder`
When upgrading for client sites, please verify if the migration script generates the content of changing name of column like in this file 202007210748036_RenameFieldOrderInFilter.cs, if not, please add it by yourself
  1. app.module.ts
    - import LogframeModule
    - import PermissionsModule
  2. environments.ts & environments.prod.ts
    - Add line logframes: 'api/core/entity',
    - Add line permissions: 'api/core/permissions'
- 1.17.0
YearType
  1. When adding new db migration (C#) for new Core package, find line A and add new line B above A.
Line A: DropTable("dbo.CoreWorkflowPhaseRepeatPeriods"); (NOTE: searching this line to add the line B above it)
Line B: DropForeignKey("dbo.CoreWorkflows", "PhaseRepeatPeriodId", "dbo.CoreWorkflowPhaseRepeatPeriods");
  2. Update your script config of beneficiary SQL to set value '2' for year type 'Calendar year'.
  1. Before new deployment:
CASE 1: If CoreYearTypes table is existing, then run SQL script to add missing year types, so when deploying new table structure, you will not get data foreign value conflicted.
SET IDENTITY_INSERT [dbo].CoreYearTypes ON
merge into [dbo].CoreYearTypes as Target
using (values
(4, 'metadata.year_type_manual', 1)
) as Source ([Id], [Name], [Active])
on Target.[Id] = Source.[Id]
when matched then
update set [Name] = Source.[Name],
[Active] = Source.[Active]
when not matched by target then
insert ([Id], [Name], [Active])
values ([Id], [Name], [Active]);
SET IDENTITY_INSERT [dbo].CoreYearTypes OFF
  1. Manually backup the value of column 'PhaseRepeatPeriodId' on CoreWorkflows
  2. Manually set PhaseRepeatPeriodId to NULL
  3. After deployment finished, manually set PhaseRepeatPeriodId back to the original value
2. After new deployment: (optional step - hotfix - only for clients implemented 'beneficiary' before 2020-08-05), run below script to change year type 'Calendar year' to '2' for existing data:
UPDATE CoreBeneficiaryTemplates SET YearTypeId = 2
UPDATE CoreBeneficiaryVersions SET YearTypeId = 2
  - This build included:
    - Display Idea/Funding Idea on My Sites by using CoreConfigurations.IdeaMemberFields [Show Idea on start page - EntityMember For Idea And Funding Idea in Config Wiki]
  - build-pipeline-api.yml
Add task to extract the webjob for auditlogging before the "PublishPipelineArtifact" task:
  - This build included:
    - The new Dependency configuration
      - TS Coding update [Developer] Using helper to create object instead of create them inline (to prevent missing the new dependency configuration):
        - FieldHelperService.createViewFormItem to create ViewFormItem object instead of create them inline.
        - FieldHelperService.createFieldProperty to create FieldProperty object instead of create them inline.
  - Deployment
- 1.13.1
Deployment
Run "MigrationForRelatedAgreement.sql" in folder Deployment/DataFixes
- 1.12.1
Remember to also update DocumentFormat.OpenXml.Extensions package
  1. app.module.ts
    - import PartnerExpenditureReportingModule
    - import FinanceChartModule
  2. environments.ts & environments.prod.ts
    - Add line partnerExpenditure: 'api/core/entity',
    - Add line financeChart: 'api/core/entity'
- 1.8.2
PR 2013 (if merged): Delete the files in Deplyment\DatabaseSeed\01 Core before updating the Deployment Nuget package
Refactoring code: Please check all customized mapper in client projects
  - When copying the primitive properties from object A to object B
    - Dto to Model: Dto.ToOptionalFields(Model)
    - Model to Dto: Model.ToOptionalFields(Dto)
    - Model to DataModel: Model.ToOptionalFields(DataModel)
    - DataModel to Model: DataModel.ToOptionalFields(Model, extractedSourceType: false) because in DataModel, normally, there is no attribute PrimitiveProperty is set for property, therefore it will use the Model class to extract properties
  - To add timezone for DATETIME field, in DtoMapper, it should add parameter to this function includeTimeZone = true
  1. app.module.ts
    - import BeneficiaryModule
  2. environments.ts & environments.prod.ts
    - Add line beneficiaries: 'api/core/entity',
  1. app.module.ts
    - import BudgetModule
  2. environments.ts & environments.prod.ts
    - Add line budget: 'api/core/entity',
- 1.6.0
1. app.module.ts
Add ChangeModule
Add to providers:
{
provide: ROUTER_CONFIGURATION,
useFactory: (config) => config.routerConfig,
deps: [APP_CONFIG]
}
2. environments
Add line: changes: 'api/core/entity',
3. main.ts
Replace contents of main.ts with the file from ngo-online-core
4. polyfills.js
Add this to file above the line 'import zone.js/dist/zone':
import 'es6-promise';
import 'isomorphic-fetch';
import 'url-polyfill';
5. angular.json
Remove scripts reference to file 'node_modules/simplemde/dist/simplemde.min.js'
6. package.json
Element 'dependencies':
Add lines:
"es6-promise": "^4.2.8",
"isomorphic-fetch": "^2.2.1",
"marked": "^0.7.0",
"url-polyfill": "^1.1.8"
Remove line: "simplemde": "^1.11.2"
  - After Add_migration check the code to make sure having this defaultValue for IsFilter
(This one is not related to developer, it's regarding the manifest xml file for Outllook Add-In that sent to clients)
Update and redeploy Outlook addin manifest so URLs match this pattern with the #-sign:
<bt:Urls>
<bt:Url id="functionFile" DefaultValue="https://localhost:4200/#/outlook-addin"/>
<bt:Url id="messageReadTaskPaneUrl" DefaultValue="https://localhost:4200/#/outlook-addin"/>
</bt:Urls>
8. PdfTemplates format
this is the order
1. HeaderTemplate.docx (logo ...) with ExtraText = HEADER
2. DefaultTemplate.docx, an empty file (ExtraText = DEFAULT) - or BankAccountTaskTemplate.docx, TaskTemplate.docx, FundingIdeaTaskTemplate.docx, ... (data columns) with ExtraText = MAIN
3. TaskChecklistTemplate.docx with ExtraText = CHECKLIST
4. CommentTemplate.docx with ExtraText = COMMENT
5. ReviewTemplate.docx with ExtraText = REVIEW
6. ApprovalTemplate.docx with ExtraText = APPROVAL
9. app-route.service.ts
Add routing for Analyse in child
{
path: 'analyse',
canActivate: [MsalGuard, ConfigurationGuard],
children: this.analyseRouteService.getRoutes()
},
- 1.5.0
1. Deployment
New parameters for Deploy.ps1. Release pipelines and Azure AppServices needs to be updated:
-ScreenshotQueue "screenshotqueue-dev"
2. Config
New appsettings needed in web config:
<add key="sp:ScreenshotQueue" value="screenshotqueue-dev" />
3. WebJob
add WebJobs.ScreenshotAsyncManagement to client project with services references from itself and core. This also needs to be added to release pipeline.
- 1.4.4
1. app.module.ts
Add MonitoringFinanceModule
2. environments
Add
monitoring: 'api/core/entity',
3. Deployment
New parameters for Deploy.ps1. Release pipelines and Azure AppServices needs to be updated:
-FinancialActualEntityUpdateQueue "financialactualentityupdatequeue-dev"
4. Config
New appsettings needed in web config:
<add key="sp:FinancialActualEntityUpdateQueue" value="financialactualentityupdatequeue-dev" />
New permission added for finance monitoring. Needs to be added to client specific permission script in various roles:
-- Monitoring
(1701, 1, 16, 30, NULL)
- 1.4.0
1. app.module.ts
2. environments
3. Deployment
Uncomment UpdateContentTypesForExistingSites in Deploy.ps1 to add link document content types to existing sites (if needed).
Update Sharing settings on SharePoint Site collection: Change "External sharing" of sites (tenant admin -> "Active sites" -> select site -> "Policies") to "New and existing guests" and deactivate feature "Limited-access user permission lockdown mode" (Site settings -> Site collection features) when setup site collection to make the share function work.
4. Config
Update any client specific scripts for EmailTemplates to match the new structure in core.
- 1.3.17
  - Import free solid svg 'faAngleDown', 'faAngleRight'
  - Import 'OutlookAddinModule'
  - Import 'DeputyModule'
  - Add root route
{
path: 'outlook-addin',
canActivate: [MsalGuard, UserInfoGuard, ConfigurationGuard, OutlookAddinGuard],
children: this.outlookAddinRouteService.getRoutes()
}
  - manageHelpDocumentation: 'api/core/helpDocumentation'
  - helpDocumentation: 'api/core/helpDocumentation'
  - outlookAddin: 'api/core/outlookAddin'
  - Add this below 'toastr'
@import "../node_modules/simplemde/dist/simplemde.min.css";
  - add "ng2-simplemde": "^2.1.0" to dependencies
  - add: "node_modules/simplemde/dist/simplemde.min.js" to path "projects/architect/build/scripts"
  - Table CoreTopNavigations: make sure Row with ID 18 (outlook-addin) have column 'Active' = 1
  - Add this below line 'import environment'
  - Replace all code of the final block by using the Code snippet like this
    - Code snippet
9. Make sure NGO.API project has reference to 'Exchange.WebServices.Managed.Api'
Run this if no reference to this DLL
Install-Package Exchange.WebServices.Managed.Api -Version 2.2.1.2
Each section will contain release notes of core version.
Waiting list
Note: Only apply step 2 if client intends to use Embedded Token. In this case, need to assign permissions as Member for Service Principle in Workspace
[UpgradePerson]
Next major version (Add here)
[XL] Custom forms - External Applications (v3) - https://trello.com/c/dcORfZN4/5608-xl-custom-forms-external-applications-v3
Next version (Add here)
Add to environments files:
highestDonorsSummary: 'api/core/highestDonorsSummary',
[For upgrade person] Check override code of Logframe and Beneficiary to see if we use just Tab Definition permissions for checking permissions for Tab function view. In this case, we should add Tab function in checking permissions.
Pass true when the call:
[ForUpgradePerson-Only] Follow those manual steps:
Update angular.json
[For upgrade person]: Check for custom components where ngo-list-filter shares a row with other fields, such as a search field, and update the layout as follows:
[UpgradePerson]
[AfterDeployment]
https://trello.com/c/ttW93QKa/5585-s-fix-iframes-and-maps-after-introduction-of-csp [S] Fix iframes and maps after introduction of CSP on Current sprint - Core | Trello
Example warnings:
[For Deployment Person]
BREAKING CHANGE
In addition, the return type has changed:
Any custom code that calls getComponentFactory() must be updated to use getComponentType() and adjusted to work with the new return type.
Angular ESLint Migration
Delete Files
Remove the following files:
Add File
Add the following file and copy its contents from Core:
Update angular.json
"lint": {
"builder": "@angular-eslint/builder:lint",
"options": {
"lintFilePatterns": [
"src/**/*.ts",
"src/**/*.html"
]
}
}
Update package.json
Package Updates
Update package.json
Remove the following packages:
Context Menu Migration
BREAKING CHANGE
Old Syntax
<context-menu>￼
<ng-template contextMenuItem>￼
...
</ng-template>￼
</context-menu>
New Syntax
<ngo-context-menu>￼
<ng-template ngoContextMenuItem>￼
…
￼ </ng-template>
￼</ngo-context-menu>
Required Changes
Update package.json
Update polyfills.js
Update angular.json
Under projects.ngo-next.architect.build.options.styles, add:
Update tsconfig.json
Queue Configuration Changes
[For Upgrade Person]
Add the following entry to all appSettings.json files:
[For Deployment Person]
For Upgrade Person
Build Pipeline Changes
For Deployment Person
The deployment environment must also be updated to support .NET 10.0.
Add to environments files:
If Client use AI function, follow these steps to set up: (Please contact me if you experience any issues during the setup process.)
[For Deployment Person]
[For upgrade person]: Check for custom components where ngo-list-filter shares a row with other fields, such as a search field, and update the layout as follows:
Example warnings:
[For deployment person] [AfterDeployment] Run the tool 'UpdateIdeaMembers' (update the appSettings before running the tool. There are two actions in the app console:
[For upgraded person]
IATI - Transaction import - https://trello.com/c/s9jJq4S2/4896-l-iati-transaction-import
[For upgraded person]
[32][L] Lock entities when ready for further registration on Current sprint - Core | Trello - https://trello.com/c/5SMHGhna/5054-32l-lock-entities-when-ready-for-further-registration
In Entra ID App Registration for NGO Online:
[For upgraded person]
[Partner expenditure] Create approval pdf template for Partner expenditure - https://trello.com/c/Ti88ijq5/4965-partner-expenditure-create-approval-pdf-template-for-partner-expenditure
[For Upgrade Person]
[For Deployment Person]
.NET Upgrade
Configuration
"Core:IATIDocumentsBlob" : "iati-documents"
"Core:Queue:GenerateIATIFileQueue" : "generateiatifilequeue"
"Core:IATIValidationApi": "https://api.iatistandard.org/validator/validate"
"Core:IATISubscriptionKey": "<FROM_SECRET_PROVIDER>"
"Core:GenerateIATIFileSchedule": "0 2 * * *"
adminIATIPage: 'api/core/adminIATIPage',
entityIATI: 'api/core/entity',
iatiDocument: 'api/core/entity',
iatitransactions: 'api/core/entity',
Add IATIModule to @NgModule
Manual SQL Script (Run Before Deployment)
Note: IDs 21355 & 21356 are now used for IATI. They may be redundant in existing databases.
Update app.module.ts:
[For deployment person] check if release pipeline / deployment appsettings.json having Core:Deployment:DeploySPFieldsAndCTypesEnabled false -> if so please add Core:Deployment:DeploySPFieldsAndCTypesEnabled true to the release pipeline, and turn the setting back when the deployment done.
Add API url to environment files:
Update app.module.ts:
[For Upgrade Person]
Adding new key name "SwitchCurrentSiteCollectionSchedule" to configuration of appsetting.json of webjobs, the value default is "0 4 * * *". Depending on the client's specific requirements, there may be a configuration adjustment for this scheduled interval.
Adding new key name "SwitchCurrentSiteCollectionQueue" to Queue section in configuration of appsetting.json of webjobs, deployment and api, the value is "switchcurrentsitecollectionqueue".
[For Deploy Person]
Adding new key name "Core:SwitchCurrentSiteCollectionSchedule" to configuration of Azure, the value default is "0 4 * * *". Depending on the client's specific requirements, there may be a configuration adjustment for this scheduled interval.
Add the key "Core:Queue:SwitchCurrentSiteCollectionQueue" with the value "switchcurrentsitecollectionqueue" in Azure AppService.
[For upgrade person]
If we copied ManageTask function from Core, consider to use ManageTask from BaseService or remove task.Checklist = null and task.ChecklistTitle = null
[For Upgrade Person]
[For Deployment Person]
[For Upgrade Person]
[For Upgrade Person]
Please be advised this function doesn't work together with the function "Upload recipt(s)" for payments. If this function is enabled, it needs to be turned off by setting AddFinalDocuments = NULL in CoreTaskTemplates before enabling Cancel Payment and Mark as Paid. Also conder tasks that are currently in the "Waiting for finalization" stage.
update CoreTaskTemplates set AddFinalAttachments = null where Id = 7
update CoreTasks set StatusId = 3 where StatusId = 6 and TemplateId = 7
update CoreTasks set AddFinalAttachments = null where TemplateId = 7
If you do not use these functions, you can ignore the steps mentioned.
UPDATE CoreFieldOptions SET Active = 1 WHERE Id = 2401￼
UPDATE CoreEntityTabs SET Active = 1 WHERE TabFunctionId = 132 AND EntityId = [YourEntityId]
[For Upgrade Person]
[For Deploy Person]
[For Deployment Person] [Before deployment]
[For Upgrade Person]
[For Upgrade Person]
[For Upgrade Person]
[For Upgrade Person]
[For Upgrade Person]
[For Deployment Person]
[For upgrade person]
If we copied ManageTask function from Core, consider to use ManageTask from BaseService or remove task.Checklist = null and task.ChecklistTitle = null
Transaction of new funding source for funding plan are duplicated - https://trello.com/c/MmBli1nv:
[For Deployment – Upgrade Person]
[For Upgrade Person]
[For Deployment Person]
[For Upgrade Person]
[For Upgrade Person] [Before deployment]
Important: "BeforeCore" folder should put same level with DatabaseSeed
<None Include="BeforeCore\**\*.*">
<CopyToOutputDirectory>Always</CopyToOutputDirectory>
</None>
[For deployment person]
[For Upgrade Person] [Before deployment]
Important: "BeforeCore" folder should put same level with DatabaseSeed
<None Include="BeforeCore\**\*.*">
<CopyToOutputDirectory>Always</CopyToOutputDirectory>
</None>
[For Deployment Person]
[For Deployment Person]
Before Deployment:
[For Upgrade Person]
"postLogoutRedirectUri": "http://localhost:4200/logout-success"￼
{ path: 'logout-success', component: LogOutComponent },￼
[For Deployment Person]
"https://xxxxx.com" to "https://xxxxx.com/logout-success"
[For Upgrade Person]
[For Deployment Person]
[For Upgrade Person]
[For Deployment Person]
[Before deployment]
[For upgrade person]
https://trello.com/c/pKyRWL8J/4277-m-web-job-monitoring-admin-ui
Add API url to environment files:
[S] Beneficiaries tab: Add config option to hide Donor disaggregation column on roll-up tabs on Current sprint - Core | Trello - https://trello.com/c/vgGizvHA/4295-s-beneficiaries-tab-add-config-option-to-hide-donor-disaggregation-column-on-roll-up-tabs
Adding a new configuration named beneficiarySortTypeInList in BeneficiarySetting with values 1 or 2 (default will be 2). These two values will correspond to the following scenarios:
https://trello.com/c/ktUgRun4/4185-net-8
1) Update app.module.ts:
2) Add API url to environment files:
3) There's a script to automatically read current values of BudgetSetting.Frequency and IsBudgetValidationAllYears from CoreConfigurations and add default budget templates for Project, Programme and Restricted Funding.
Notes for ngo- release pipelines (for Previo dev env):
Notes before client deployments (for client env):
[For Upgrade Person] Only for client environments, add check list item to inform PM/AM about authentication platform change in Entra ID after deployment, so they can notify clients to clear browser cache if needed.
[For Upgrade Person]
1. Replace (if exists) URIUtilities.BuildSharePointAbsoluteUrl -> SPUtilities.BuildAbsoluteUrl
- Update the second parameter to use '_coreAppSettings.SP.TenantUrl'
- Make sure the first parameter is either SP server relative URL or Absolute URL
[Before Deployment] Update pipeline
Beside of activating security policy, it requires to set Azure configurations to make web job run
How to use:
[S] Finance / Budget: when project periods have been changes, the budget row values out of from new period must be removed in draft version - https://trello.com/c/s2IOcMpb/3677-s-finance-budget-when-project-periods-have-been-changes-the-budget-row-values-out-of-from-new-period-must-be-removed-in-draft-ve
[S] Permissions, Members tab - Validation for Partner users (Guest) accounts to only be able to be added as Partner members
[After Deployment] run script Datafixes/20230811_UpdateCoreConfigurationForPartnerUser
Note: Please check if CoreConfigurations for RestrictedGlobalRolesInViews in case ALways Update = 0, if yes, please add {"roles": [{"id": 12}], "tabFunctionId": 113} to the existed configuration
4.2
4.1
NGO Core 4.x (to .net 7):
- 3.15.20
- 3.15.19
3.15.0 / 4.0
For core upgrading person: looks at CoreRoles table and does as following steps
- 3.14.0
- 3.13.9
- 3.13.7
- 3.13.2
- 3.13.1
- 3.12.7
- 3.12.3
- 3.12.0
[S] [Logframe/Indicator tracker] Missing Rating and comment value on approval PDF file: https://trello.com/c/V3aMbvVj
- 3.11.0
[T] Project End date auto populating with no ask to do this https://trello.com/c/KxtrpdNm
- 3.10.0
Find all client projects and update
- 3.9.5
- 3.9.0
Nuget packages:
SharePoint Deployment - PowerShell update auditlog
[Before Deployment]:
Edit Release > Deploy Sharepoint > select the powershell task that will run the Deploy.ps1 > Arguments: at the end of line, add a space and
-AuditLogQueue "auditlogqueue" -AuditLogBlob "auditlogblob" -AuditLogBlobQueue "auditlogblobqueue"
Save the Release and run the deploy.
Note: Should update that same thing for the Live Release when updating this for the Test Site Release
- 3.8.2
- 3.8.0
[M] Consolidate webjobs to one webjob with services that can be overridden on Current sprint - Core | Trello - https://trello.com/c/TF7hsO4A/2808-m-consolidate-webjobs-to-one-webjob-with-services-that-can-be-overridden
Make sure no weird characters are copied!
- 3.7.4
- 3.7.0
- 3.6.7
- 3.6.0
- 3.5.2
- 3.5.0
- 3.4.1
- 3.4.0
NGO.Core.Webjobs.GenerateLogframeDraftVersion webjob (for more information: https://trello.com/c/uqZLlXB1)
- 3.3.0
- 3.2.0
- 3.1.0
Recycle bin: no need permission: Add,Delete (Only List,View,Edit)
- 3.0.2
- 3.0.0
Logframe, Breakdown form validation, if total is read only the field in the main form should be read only
UPDATE CoreFieldInstanceLocations
SET Characteristic = '{ "customGroupedBy": "2072", "hideLabel": true, "autoCopyValueFromDependentProp": true, "autoCopyValueFromDependentFieldName": "customGlobalIndicatorLinks" } ', VisibilityDependencyId = NULL, ReadOnlyDependencyId = 54
WHERE Id = 2640
- 2.24.0
Admin Portal, Entity/Tab Fields problem with ticked Characteristics in table view
- 2.23.0
- 2.22.3
- 2.22.0
New Agreements tab - Amendment function:
CoreTaskTemplates - update ReviewMode
- 2.21.0
- 2.20.0
- 2.19.1
- 2.19.0
Workflow / Bypass to later phase
- 2.18.2
2.18.1 (Use 2.18.2 instead)
- 2.18.0
- 2.17.0
Bug in sorting tasks list:
Analyze / Logframe - After deployment:
Email templates:
Sorting My Sites box:
Permissions - Bypass to later phase function and Repeat phase function
- 2.16.0
- 2.15.0
- 2.14.0
- 2.13.7
- 2.13.0
Finance / Budget / Support multi currency:
[After deployment]
To run deployments the release pipeline needs to be updated:
- 2.12.0
- 2.11.0
- 2.10.0
- 2.9.0
System banner
- 2.8.0
- 2.7.1
- 2.7.0
- 2.6.0
Client project: Import awesome font icons in app module
- 2.5.8
- 2.5.6
- 2.4.1
- 2.4.0
Refactoring dependency field in log tab
- 2.3.0
- 2.2.0
Authentication refactoring needed in client code:
Finance: Fiscal year configuration refactoring
Phase numbers
- 2.0.0
- 1.18.3
- 1.17.0
Fix YearType - when upgrading new core package (for clients)
Fix YearType - when doing deployment (for existing environments)
CASE 2: If CoreYearTypes table is not existing, to not get the foreign key conflict when changing to new foreign table on CoreWorkflows table.
- 1.16.8
- 1.14.0
Run tool to migrate field dependencies, see New Dependency configuration in [CoreFieldDependencyDefinitions] in Config Wiki .
- 1.13.1
- 1.12.1
- 1.9.2
- 1.8.2
ToOptionalFields
- 1.6.4
- 1.6.0
7. Deployment
- 1.5.0
- 1.4.4
- 1.4.0
- 1.3.17
1. app.module.ts
2. app-route.service.ts
3. environments .ts
4. styles.scss
5. package.json
6. angular.json
7. Db publish scripts
8. main.ts
declare const Office: any;
.then(config => {
if (environment.production) {
enableProdMode();
}
var bootstrapModule = () => {
platformBrowserDynamic([{ provide: APP_CONFIG, useValue: config }]).bootstrapModule(AppModule)
.catch(err => console.error(err));
};
var isOutlookAddinIframe = window !== window.parent && !window.opener && (window.name || "").indexOf("Outlook") != -1;
if (!isOutlookAddinIframe) {
bootstrapModule();
}
else {
const script = document.createElement('script');
script.type = 'text/javascript';
script.src = "https://appsforoffice.microsoft.com/lib/1/hosted/office.js";
script.onload = () => {
console.log("office.js loaded.");
Office.initialize = () => {
bootstrapModule();
};
};
document.getElementsByTagName('head')[0].appendChild(script);
}
})

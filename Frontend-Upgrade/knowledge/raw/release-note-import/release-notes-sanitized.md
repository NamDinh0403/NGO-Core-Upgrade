9.2.0
https://trello.com/c/IRyw8QbW/5553-s-outlook-addin-permissions-are-too-high
[UpgradePerson]
      • Compare and copy the changes of https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/36783?_a=files&path=/ngo-client-core/src/app/app-routing.module.ts
      • Copy the changes of https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/36783?_a=files&path=/ngo-client-core/src/main.ts
[AfterDeployment] 
      • Remove Azure App permission: Microsoft Graph Mail.Read (Application)
      • [Optional – used for Outlook add-in] Add Azure App permission: Microsoft Graph Mail.Read (Delegated)
      • Tell your PM: the manifest file of Outlook add-in should be updated and then reinstall it (see the changes, removing the hash from URLs)


[S] Fix iframes and maps after introduction of CSP on Current sprint - Core | Trello
      • Add to all appsettings.json files and Azure App Settings:
      "Core:CspAdditionalFrameSrc" : ""
      • This setting can be updated to allow additional iframe/frame sources as needed. Multiple sources should be separated by a semicolon (;)

[S] Update config of Core Analyse tables on Current sprint - Core | Trello
If there are any customizations related to BaseConfigurationRepository's entityViewDefinitions (e.g., custom entity definitions such as SvK), please update them according to the changes in this card, following the same approach used for the custom tabs and tab functions

[M][Logframe2] Indicator tracker, Export to Excel, Include fields configured in the popup on Current sprint - Core | Trello
If GetLogframe2IndicatorTrackers is customized in the client project, adapt this card's PR changes to it.

[T][Logframe2] Base url confusion on Current sprint - Core | Trello
[For upgraded person] remove logframes2 from environment files

[S] Cleanup Role/field mappings in core script on Current sprint - Core | Trello
[For upgraded person] After cleanup role Member connected with Field Definition Id, we will add Role Member with Field Definition Id is
Null for what we removed, so if client not used this Member role in any entity type added , please create script to override seed data from Core
(CoreRoleEntityDefinitions Id from 50 -> 58)


9.1.0
https://trello.com/c/HRVFghna/5454-s-add-new-relatedentity-fields-to-log-log2-log3
If you want the field is multiple, change type of field instances in code

[8][M] Files uploaded using "mark as paid" or "mark as cancelled" should be copied to 99 approval on Current sprint - Core | Trello
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

[S][Logframe2] Migration tool for saved analyse queries on Current sprint - Core | Trello
If using Logframe2: Run NGO.Core.Tools.Logframe2SavedQueryMigration to verify and migrate saved analysis queries from Logframe1. Please start with review mode, resolve all warnings (search for "See warnings for details" in console or log file), then run update mode.
Example warnings:
      1. "Missing analyse table relation for …": Add the corresponding analyse table relation for Logframe2
      2. "Missing analyse column for field …": Identify the new field in the relevant tab function and add it as new analyse column
      3. "Unable to determine if field …": Check CoreAnalyseLogframeObjectiveView (Core/Client if available) to determine whether the field belongs to the Objective or Indicator table
            a. Add to IndicatorStructureFields if it belongs to Indicator
            b. Add to ObjectiveStructureFields if it belongs to Objective
      4. If any structure fields were renamed in Logframe2, remap them in IndicatorStructureFieldMappings or ObjectiveStructureFieldMappings

9.0.0 
[L] Create tables for workflow instances
[For Deployment Person]
After deployment, the ConvertWorkflowInstanceJsonConfigToTables tool must be executed to migrate existing workflow instance JSON configurations into the new database tables (CorePhaseInstances and CorePhaseTemplateInstances).
If this migration is not performed, workflow cycle data will not be displayed correctly in the Workflow Cycle tab.

https://trello.com/c/KEiWbbxf/5340-remove-deprecated-componentfactoryresolver-and-entrycomponents
BREAKING CHANGE
InfoFieldFactory.getComponentFactory() has been renamed to getComponentType().
In addition, the return type has changed:
      • Previous: ComponentFactory<any>
      • New: Type<any>
Any custom code that calls getComponentFactory() must be updated to use getComponentType() and adjusted to work with the new return type.
      
Fix deprecated linting on Current sprint - Core | Trello
Angular ESLint Migration
Delete Files
Remove the following files:
      • ngo-client/src/tslint.json
      • ngo-client/tslint.json
      
Add File
Add the following file and copy its contents from Core:
      • ngo-client/.eslintrc.json
Update angular.json
Under projects.ngo-nxt.architect, add the following lint configuration after the test property:
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
Copy the entire devDependencies section from Core to ensure all required ESLint packages and dependencies are included.

Modernize Angular Dependencies and Migrate from ngx-contextmenu
Package Updates
Update package.json
      • Upgrade @angular/cdk to v15.2.0
      • Upgrade @angular/animations to v15.2.10
Remove the following packages:
      • @angular/flex-layout
      • ngx-contextmenu
      
Context Menu Migration
If the client contains custom context menu implementations, they must be updated.
BREAKING CHANGE
Context menu usage has changed:
Old Syntax
      <context-menu>

                <ng-template contextMenuItem>

                    ...
                </ng-template>

      </context-menu>
New Syntax
      <ngo-context-menu>

                <ng-template ngoContextMenuItem>

                    …
            
    </ng-template>
      
</ngo-context-menu>
Required Changes
      • Replace <context-menu> with <ngo-context-menu>
      • Replace contextMenuItem with ngoContextMenuItem
All custom context menu implementations should be reviewed and updated accordingly.

Update spinner, remove and update some libraries on Current sprint - Core | Trello
Update package.json
      • Replace the entire dependencies section with the version from Core.
      • Replace the entire devDependencies section with the version from Core.
Update polyfills.js
      • Replace the contents of polyfills.js with the version from Core.
Update angular.json
Under projects.ngo-next.architect.build.options.styles, add:
      • "node_modules/ngx-spinner/animations/ball-clip-rotate-multiple.css"

Update tsconfig.json
      • Update compilerOptions.lib:
      Old: "lib": ["es2018", "dom"]
      New: "lib": ["ES2022", "dom"]
      
[40][XL] Draft and Published workflow on Current sprint - Core | Trello
Queue Configuration Changes
[For Upgrade Person]
Add the following entry to all appSettings.json files:
      • "SyncPublishedWorkflowQueue": "syncpublishedworkflowqueue"

[For Deployment Person]
Add the following Azure App Setting:
Key	Value
Core:Queue:SyncPublishedWorkflowQueue	syncpublishedworkflowqueue
This setting must be configured in the Azure environment to ensure the queue is available after deployment.

Dotnet 10 on Current sprint - Core | Trello
For Upgrade Person
Before upgrading any Core packages, update all projects to target .NET 10.0.
Build Pipeline Changes
Update build-pipeline-api.yml:
Old
netVersion: '8.0'

New
netVersion: '10.0'

This change must be completed before proceeding with the Core package upgrade to ensure compatibility with the latest platform requirements.
For Deployment Person
The deployment environment must also be updated to support .NET 10.0.
      • Update the Azure App Service / Web App runtime to .NET 10.
      • Ensure build agents and deployment pipelines are compatible with .NET 10. (check build-pipeline-api.yml)

Use node 18 on Current sprint - Core | Trello
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

[L] Write with AI on Current sprint - Core | Trello

This feature may incur subscription costs. Please make sure to confirm that the customer wants to use it before upgrading.
[For Upgrade Person]
Add to environments files:
      • aiwriter: 'api/core/aiwriter'

If Client don’t use AI function, ignore these steps bellow
If Client use AI function, follow these steps to set up: (Please contact me if you experience any issues during the setup process.)
      1. Update the system configuration “AIConfiguration” and set UsingWriteWithAI to true.
      2. Create a Microsoft Foundry resource. (or using existing resource) (https://ai.azure.com/nextgen/r/,-,,-/allresources)
      3. Go to Deployment → Deploy model → Deploy base model (fine-tune it if the client has a model that needs fine-tuning).
      4. Select the LLM model you want to use (the core system currently uses GPT-4o mini) → confirm the deployment.
      5. Save the endpoint and deployment name of the model. (need to use later)
      6. Go to the Azure Portal → Foundry. Search for the Foundry resource you created → Access Control → Role assignments.
      7. Grant the “Cognitive Services OpenAI Contributor” role to the Entra App client being used.
      8. Edit appsettings and add the following settings to the Core section:
    "AzureOpenAISettings":{
      "Endpoint": "your-end-point",
      "DeploymentName": "your-delployment-name"
    },

[For Deployment Person]
      1. Add a variable with the key Core:AzureOpenAISettings:Endpoint the value will be endpoint of foundry
      2. Add a variable with the key Core:AzureOpenAISettings:DeploymentName the value will be deployment name of foundry

Use security headers on Current sprint - Core | Trello
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

Add Content Security Policy on Current sprint - Core | Trello
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

[Admin/Help documentation] Lost icons in context box on Current sprint - Core | Trello
[Upgrade]
Index.html:
Add this link below the existing bootstrap css link:
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" integrity="sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN" crossorigin="anonymous">

https://trello.com/c/nJN3ds0U/5296-m-transaction-made-from-funding-plan-should-have-source-entity-currency
[Deployment]
Run Sharepoint to update Word templates

https://trello.com/c/kSSati11/5376-8m-expanded-workflow-history
[Deployment]
• Activate Workhistory tab in Workflow cycle Entity (Manual check if workflow cycle tab enabled in Admin UI / Entities)

8.6.0
https://trello.com/c/HRVFghna/5454-s-add-new-relatedentity-fields-to-log-log2-log3
If you want the field is multiple, change type of field instances in code

[8][M] Files uploaded using "mark as paid" or "mark as cancelled" should be copied to 99 approval on Current sprint - Core | Trello
Add new system config SPSignedOffAdditionalDocumentsFolderName to control the optional approval subfolder for "Mark as Paid" or "Cancel" actions.
Default: "Additional documents". Can be changed or set empty per client needs. Please ask client's PM/ AM about this before running tool below
[After Deployment] Check if the client uses "Mark as Paid" or "Cancel" on payments. (select * from Coreentitytabs where TabFunctionId in( 35,132,136) and Active = 1) and check CoreRolePermissions as well for these tab functions.
If yes, update appsettings.json and run:
NGO.Core.Tools.UpdatePaymentDocumentLinks

[S][Logframe2] Migration tool for saved analyse queries on Current sprint - Core | Trello
If using Logframe2: Run NGO.Core.Tools.Logframe2SavedQueryMigration to verify and migrate saved analysis queries from Logframe1. Please start with review mode, resolve all warnings (search for "See warnings for details" in console or log file), then run update mode.
Example warnings:
      1. "Missing analyse table relation for …": Add the corresponding analyse table relation for Logframe2
      2. "Missing analyse column for field …": Identify the new field in the relevant tab function and add it as new analyse column
      3. "Unable to determine if field …": Check CoreAnalyseLogframeObjectiveView (Core/Client if available) to determine whether the field belongs to the Objective or Indicator table
            a. Add to IndicatorStructureFields if it belongs to Indicator
            b. Add to ObjectiveStructureFields if it belongs to Objective
      4. If any structure fields were renamed in Logframe2, remap them in IndicatorStructureFieldMappings or ObjectiveStructureFieldMappings


8.4.0
[1][S] Update Google Analytics script in Core on Current sprint - Core | Trello
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

[S] Default page is not loaded when user inputs incorrect URL
Find app-route.service.ts and add:
{ path: '**', redirectTo: 'start' }
at below of 'outlook-addin' route, the new route and outlook addin route should be same level.

https://trello.com/c/WW0cQyqK/5315-potential-bug-sp-groups-in-the-main-site-collection-may-hit-limits-if-too-many-ideas-or-funding-ideas-are-added
Run the tool 'UpdateIdeaMembers' (update the appSettings before run, ask Vien for detail, BeforeDeployment step could be optional if your client doesn't have issue of running out of SP groups). There are two actions:
[BeforeDeployment]: run before trigger deployment to move idea's folders to other site collections.
[AfterDeployment]: run when the deployment is done, use the same tool but this action.
[For deployment person] Before creating deployment in Release, please Edit and update variable first as follow: Core:Deployment:DeploySPFieldsAndCTypesEnabled with value of true. Revert it back to original when the deployment process was done.

8.2.0
[S]ADSync webjob: Exception when deleted user has no UserPrincipleName on Current sprint - Core | Trello
[For upgrade person] update appsetting.json then run tool NGO.Core.Tools.SetAzureAdIdForUser to set AzureAdId for CoreUsers. After run tool, make sure all row in AzureAdId in CoreUsers have value (we will missing deleted User in Azure https://portal.azure.com/#view/Microsoft_AAD_UsersAndTenants/UserManagementMenuBlade/~/DeletedUsers). If such user exists, manually update AzureAdId for that user

https://trello.com/c/HC8irSiM/5111-logframe-upgrade-migration-scripts-when-move-to-logframe-2
[If using Logframe2] Read and manual run 20250917_DisableLogframe1.sql

8.1.0
[S] Enable finance tabs + functionality on Emergency & Non-Project entities
[For upgraded person]
      1. Update app.module.ts:
            ○ Add EmergencyFinanceModule, NonProjectFinanceModule to @NgModule
      2. Add API URL to environment files:
            ○       nonProjectFinance: 'api/core/entity'- Ensure Entra App Registration has permission `Mail.Read` (type: Application, granted admin consent)
            ○       emergencyFinance: 'api/core/entity'

8.0.0
[XL] Frontend upgrade
Please see Upgrade Angular 10-15.docx for detailed upgrade instructions

Src/styles.css
remove import of bootstrap: 
@import url("https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css");

Add at the end of the file:
/* Override to adapt for Bootstrap 5 */
.modal-backdrop {
  z-index:1050 !important;
}

https://trello.com/c/yRWF604C/5145-page-import-ideas-ideas-entity-always-auto-generates-entity-number
Check if any custom or reuse AddIdea or AddFundingIdea that cannot generate entity number for these entities, and use sequenceNumberService to handle that

IATI - Transaction import
      • Run SharePoint Deployment
      • Update Azure setting: Core:Queue:IATITransactionImportQueue
      • Update  appsetting files: "IATITransactionImportQueue": "iatitransactionimportqueue-dev-nidy"

[S] Task - Check list: improve comment text box to support multi-line
If client want to change the number of characters in quick view of checklist’s comment, they need to change maxCharacters of 2 field location: ID 21121(edit form) and 21122(View form). Default is 250 characters.

[L] Idea and FundingIdea document permissions should be specific for each entity
[After deployment] Update all settings in appsettings.json the same as your environment and run NGO.Core.Tools.UpdateIdeaMembers

[L] Minimum requirements function (aka Audit Tool/Compliance tab)
[For upgraded person]
      1. Update app.module.ts:
            ○ Import faExclamationCircle as farExclamationCircle  at the line ...from '@fortawesome/pro-regular-svg-icons'.
            ○ Add farExclamationCircle after faMoneyBill inside the constructor.
            ○ Add MinimumRequirementModule to @NgModule
      2. Add API URL to environment files:
            ○ adminMinimumRequirements: 'api/core/adminMinimumRequirements'
            ○ minimumRequirements: 'api/core/minimumRequirements'

https://trello.com/c/wxn79EfV/4981-loading-tabs-tabs-should-not-display-when-entity-page-is-loading
Check if your custom code using 'getCurrentConfiguration', if yes -> make sure having 'filter(config => config != null),'

[M] Create CoreLogframeIATIProvider on Current sprint - Core | Trello
[For deployment person]
[After deployment] In 20251015_AddCodeToLogframeLevelInput.sql Update (4) to list id of Objective level that is input (not have target or reporting period), and manual run script.

[32][L] Lock entities when ready for further registration on Current sprint - Core | Trello
      1. Update app.module.ts:
      • Import faLock at the line ...from '@fortawesome/pro-light-svg-icons'
      • Add faLock inside the constructor.

[8][S] Extend the "Core API Versions" function to include more info and add security on Current sprint - Core | Trello
[Before deployment]
In Entra ID App Registration for NGO Online:
      1. In App roles, add a role with both DisplayName and Value = "AppOnly". Allowed member types = Applications.
      2. In API permissions, Add permission. Select My APIs, then NGO, Application permissions and then AppOnly.
      3. This permission requires Admin consent which might have to be requested from a client admin.

7.7.0
https://trello.com/c/AKettC6e/5344-analyse-task-as-primary-table-user-should-not-see-the-tasks-belong-to-the-entity-they-have-not-access-permission
Adjusted DB FUNCTION GetTaskThatUserHasViewPermission , so if client overrides it, please inner join Tasks table with CoreEntities to make sure only view accessable entities //Uyen

[S] Default page is not loaded when user inputs incorrect URL
Find app-route.service.ts and add:
{ path: '**', redirectTo: 'start' }
at below of 'outlook-addin' route, the new route and outlook addin route should be same level.

7.6.0
[S]ADSync webjob: Exception when deleted user has no UserPrincipleName on Current sprint - Core | Trello
[For deployment person] update appsetting.json then run tool NGO.Core.Tools.SetAzureAdIdForUser to set AzureAdId for CoreUsers. After run tool, make sure all row in AzureAdId in CoreUsers have value (we will missing deleted User in Azure https://portal.azure.com/#view/Microsoft_AAD_UsersAndTenants/UserManagementMenuBlade/~/DeletedUsers). If such user exists, manually update AzureAdId for that user

https://trello.com/c/HC8irSiM/5111-logframe-upgrade-migration-scripts-when-move-to-logframe-2
[If using Logframe2] Read and manual run 20250917_DisableLogframe1.sql

7.5.0
[S] Enable finance tabs + functionality on Emergency & Non-Project entities
[For upgraded person]
      1. Update app.module.ts:
            ○ Add EmergencyFinanceModule, NonProjectFinanceModule to @NgModule
      2. Add API URL to environment files:
            ○       nonProjectFinance: 'api/core/entity'
            ○       emergencyFinance: 'api/core/entity'

https://trello.com/c/mysZCJvG/3719-finance-budget-edit-form-reffield-options-in-2nd-3rd-levels-cannot-be-saved
If client extended BudgetFormComponent, should follow Core code to fix the problem in card.

7.3.1
 [S] Logframe - Update the Objective form for standard/custom indicators to support similarly behaviour as with Indicators on Current sprint - Core | Trello
If user want to have this new behaviour, pls follow dev notes checklist

7.3.0

Logframe2 - Separate objective and structure tab functions and fields
If logframe1 is used: override entity-route.service.ts and replace 'logframe' path with logframeRouteService, also add always-run core override script '20250930_DisableLogframe2.sql'
If logframe2 is used: manual run after script '20250917_DisableLogframe1.sql'

[M][Logframe 2] Display correct period labels in UI based on each indicator's frequency on Current sprint - Core | Trello
[For deployment person]
[After deployment] In 20251003_EnsureFrequencyIndicator.sql Update (4) to list id of Objective level that is input (not have target or reporting period), and manual run script. To ensure every indicator have frequency. Then run the tool below
[After deployment] Only run tool after ensure indicator frequency. Update appsettings.json and manual run the tool: NGO.Core.Tools.RebindPeriodNameForIndicatorTargetReport


7.2.0

[Partner expenditure] Create approval pdf template for Partner expenditure
      • Overrides LandscapeFunctionIds in ExportPdfService to support landscape by tabid
      Update Documents/PdfTemplates/ExpenditureTaskTemplate.docx follow client requirement
      • Run  SharePoint Deployment
      • P/S: this SQL After-script will run automatically if PdfTemplates on CoreTaskApprovalSettings is null or empty.
      20250801_SetupPartnerExpenditureApprovalScreenshotTemplate.sql

[M][Funding & Summary] [Income planned vs received] overview box
https://trello.com/c/ngBU5eEx/4967-mfunding-summary-income-planned-vs-received-overview-box
[For upgrade person] Find the text 'DateAndValueFields' in your custom SQL scripts, if any, please update it to the new format (see new config format in the description of card)

[M] Outlook add-in stops working due to recent MS changes on Current sprint - Core | Trello
[For deployment person] Ensure in API permission of  entra app registrations has permission Mail.Read (type: Application) and Granted admin consent

7.1.0

[M] IATI Feedback 5 on Current sprint - Core | Trello
[For Upgrade Person]
      1. Update appsettings.json Files:
            • Add a configuration with the key MaxEmailAttachmentFileSizeMb for appsetting.json of webjob and api. This config defines the maximum size of file will be sent in email of IATI export. Depending on the customer's requirements (if any), if there are no requirements, the default value will be 20.
[For Deployment Person]
      1. Update Azure Portal:
            • Add a variable with the key Core:MaxEmailAttachmentFileSizeMb and the value can be obtained from the appsettings.json .

[S] Breakdown template populates incorrectly for new custom indicator
[Before Deployment] Run DataFix/20250319_InactiveGlobalIndicatorOfCustomGlobalObjectiveField.sql if client using Custom global objective field


7.0.0

.NET Upgrade
      • Upgrade to .NET 9
            • Find and replace net8.0 with net9.0 in all .csproj files before installing NuGet packages.
            • Update netVersion parameter in build-pipeline-api.yml from 8.0 to 9.0.
            • Update EF tool version in build-pipeline-api.yml:
                  ▪ Task: Install dotnet-ef
                  ▪ Change version from 8.0.7 → 9.0.1.
            • [New Step – 29/09/2025]: Update the .NET Version of the web service in Azure to .NET 9.

IATI modular (https://trello.com/c/BOBvztKJ/4767-l-logframe-new-reporting-form)
Configuration
• Add to all appsettings.json files and Azure App Settings:
      "Core:IATIDocumentsBlob" : "iati-documents"
      "Core:Queue:GenerateIATIFileQueue" : "generateiatifilequeue"
      "Core:IATIValidationApi": "https://api.iatistandard.org/validator/validate"
      "Core:<FROM_SECRET_PROVIDER> "<FROM_SECRET_PROVIDER>"
      "Core:GenerateIATIFileSchedule": "0 2 * * *"
• Update environment.ts & environment.prod.ts:
       adminIATIPage: 'api/core/adminIATIPage',
       entityIATI: 'api/core/entity',
       iatiDocument: 'api/core/entity',
       iatitransactions: 'api/core/entity',
      
• Update App.module.ts
      Add IATIModule to @NgModule
• Manual SQL Script (Run Before Deployment)
      Note: IDs 21355 & 21356 are now used for IATI. They may be redundant in existing databases.
DELETE FROM CoreFieldInstances WHERE Id IN (21355, 21356)

[For deployment person] check if release pipeline / deployment appsettings.json having Core:Deployment:DeploySPFieldsAndCTypesEnabled false -> if so please add Core:Deployment:DeploySPFieldsAndCTypesEnabled true to the release pipeline, and turn the setting back when the deployment done.

https://trello.com/c/BOBvztKJ/4767-l-logframe-new-reporting-form
Import 'faCommentLines' from '@fortawesome/pro-light-svg-icons'
Add 'faCommentLines' to library.addIcons

[M][PRJ18] Finance, Expenditure, ability to Import expenditure
Remember to copy environment.prod.ts   
      partnerExpenditureImport: 'api/core/entity',
Update app.module.ts:
      • Import PartnerExpenditureReportingImportModule in app.module.ts.

[For deployment person] check if release pipeline / deployment appsettings.json having Core:Deployment:DeploySPFieldsAndCTypesEnabled false -> if so please add Core:Deployment:DeploySPFieldsAndCTypesEnabled true to the release pipeline, and turn the setting back when the deployment done.
      

[M] Import / export logframe reporting
[For deployment person] check if release pipeline / deployment appsettings.json having Core:Deployment:DeploySPFieldsAndCTypesEnabled false -> if so please add Core:Deployment:DeploySPFieldsAndCTypesEnabled true to the release pipeline, and turn the setting back when the deployment done.

Remember to copy environment.prod.ts  
      logframeImported: 'api/core/entity',

Override LogframeExcelService -> can Override SetupReadonlyFieldByDependencies() to update property FieldDependencies ) to disable an actual fields based on Indicator Type
Exp: In MCC,  Numfields is only show if Indicator is Text and Ref, so 
public virtual Dictionary<string, string> FieldDependencies
{
     get => _fieldDependencies;
     set => _fieldDependencies = value ?? new Dictionary<string, string>
     {  { "numField1", "3;5" }}
}

[M][SUM07] Finance, Summary, Total funding by status box
Add API url to environment files:
      • summary: 'api/core/summary'

[L] Logframe - Updated layout logframe structure
Add API url to environment files:
logframes2: 'api/core/entity'
Update app.module.ts:
      • Import Logframe2Module in app.module.ts.

[M] Can we drag and drop folders on Current sprint - Core | Trello
Add the following to dependencies to frontend package.json_
"ng2-file-upload": "^1.3.0"
"ngx-file-drop": "^10.0.0"
Remove the dependency "ngx-uploader".

[M] Manage Site Collection improvement
[For Upgrade Person] 
      Adding new key name "SwitchCurrentSiteCollectionSchedule" to configuration of appsetting.json of webjobs, the value default is "0 4 * * *". Depending on the client's specific requirements, there may be a configuration adjustment for this scheduled interval.
      Adding new key name "SwitchCurrentSiteCollectionQueue" to Queue section in configuration of appsetting.json of webjobs, deployment and api, the value is "switchcurrentsitecollectionqueue".
[For Deploy Person] 
      Adding new key name "Core:SwitchCurrentSiteCollectionSchedule" to configuration of Azure, the value default is "0 4 * * *". Depending on the client's specific requirements, there may be a configuration adjustment for this scheduled interval.
      Add the key "Core:Queue:SwitchCurrentSiteCollectionQueue" with the value "switchcurrentsitecollectionqueue" in Azure AppService.

Add key "Core:Queue:ReminderTaskDeadlineQueue", value "remindertaskdeadlinequeue" in appsettings and azure

6.4.0
[Logframe/Indicator Tracker] ID of global objective is displayed unexpectedly on at number objective field when number objective is blank on Current sprint - Core | Trello
If in client project customs GetLogframeIndicatorTrackers procedure, update isnull(obj.ObjectiveNo, glObj.ObjectiveNo) to obj.[ObjectiveNo] (changes in PR: Pull request 23454: [Logframe/Indicator Tracker] ID of global objective is displayed unexpectedly on at number objective field when number objective is blank - Repos (azure.com))

Logframe periods missing
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

[Tasks/Created from] Implement for Income Schedules on Current sprint - Core | Trello
[For upgrade person] Characteristic for fieldInstanceId 22538 add highlight text:  {"readOnly": "true", "isHideIfNoValue": true, maxCharacters:50, "taskLinkFormat":[{tabDefinitionId: 2, fieldName: "description"}, {tabDefinitionId: 8, fieldName: "description"}, {tabDefinitionId: 15, fieldName: "description"}, {tabDefinitionId: 24, fieldName: "description"}, {tabDefinitionId: 10, fieldName: "name"}, {tabFunctionId: 44, fieldName: "name"}]}

[Search] If we allow to preview document, we should let user do something on preview dialog
Add import of faExternalLink from '@fortawesome/pro-light-svg-icons' + add to constructor in app.module.ts
[M] Can we move the LockRelatedDocuments function to ScreenshotQueue upon task completion?
We move the code Lock documents to webjob so please check customization in client, if using FolderPathWithoutRoot, move that code to OnAfterSaveScreenshot instead of OnTaskApproved . Because not sure screenshot webjob has finished before using FolderPathWithoutRoot for the custom purpose

6.1.0
[S][8] Task - Check list disappear when pressing save in Agreement on Current sprint - Core | Trello
[For upgrade person] 
      If we copied ManageTask function from Core, consider to use ManageTask from BaseService or remove task.Checklist = null and task.ChecklistTitle = null

6.0.0

[L] Generated migration templates + Entity import Admin UI page
[For Upgrade Person]
      1. Update app.module.ts:
            • Import faCloudUploadAlt at the line ...from '@fortawesome/free-solid-svg-icons'.
            • Add faCloudUploadAlt after faTh inside the constructor.
      2. Add API URL to environment files:
            • pageImport: 'api/core/pageImport'
      3. Add new queue for web job:
            • Inside the Queue section in all appsettings.json files, add the key PageImportAddDataQueue with the value pageimportadddataqueue.
[For Deployment Person]
            • Add the key Core:Queue:PageImportAddDataQueue with the value pageimportadddataqueue in Azure AppService.
            
[M] Extract current monitoring boxes to be overview boxes
[For Upgrade Person]
      1. Update app.module.ts:
            • Import FinanceMonitoringModule in app.module.ts.
      2. Add API URL to environment files:
            • financeMonitoring: 'api/core/entity'
      3. Find and correct the Location column of CoreOverviewBoxDefinitions in your custom deployment script (if any):
            • startpage (old value = 3) -> 1 (new value)
            • both (old value = 1) -> 3 (new value)
[L] [PAY06] Finance, Payments, Add option to cancel an approved payment
[For Upgrade Person] 

Please be advised this function doesn't work together with the function "Upload recipt(s)" for payments. If this function is enabled, it needs to be turned off by setting AddFinalDocuments = NULL in CoreTaskTemplates before enabling Cancel Payment and Mark as Paid. Also conder tasks that are currently in the "Waiting for finalization" stage.
      update CoreTaskTemplates set AddFinalAttachments = null where Id = 7
      update CoreTasks set StatusId = 3 where StatusId = 6 and TemplateId = 7
      update CoreTasks set AddFinalAttachments = null where TemplateId = 7
      

If you do not use these functions, you can ignore the steps mentioned.
      1. Cancel Payment:
      • If the client already has the Cancelled option, remove the Custom Cancelled option and use the Core Cancelled option (Id = 2401). Migrate the Custom Id to Core Id.
      • If the client does not use the Payment status option list (Id = 62), update the Core Cancelled option to the correct option list.
      • Activate Cancel Option:
            ▪ Run the following SQL command: 
                  UPDATE CoreFieldOptions SET Active = 1 WHERE Id = 2401

            ▪ This function needs to be activated manually by enabling permission (permission tab on admin) and the tab in the entity.
      • Activate Tab on Project:
            ▪ Change the EntityId value if you want to activate it on other entities: 
                         UPDATE CoreEntityTabs SET Active = 1 WHERE TabFunctionId = 132 AND EntityId = [YourEntityId]
      2. Mark as Paid Payment:
      • Follow the same steps as for Cancel Payment, but use Paid option Id = 2402 and tab function Id = 136.
      
[L][16] Email notification when a deadline is approaching
[For Upgrade Person] 
      • Adding new key name "ReminderTaskDeadlineSchedule to configuration of appsetting.json of webjobs, the value default is "0 2 * * *". Depending on the client's specific requirements, there may be a configuration adjustment for this scheduled interval.
[For Deploy Person] 
      • Adding new key name "Core:ReminderTaskDeadlineSchedule" to configuration of Azure, the value default is "0 2 * * *". Depending on the client's specific requirements, there may be a configuration adjustment for this scheduled interval.
      
[M] Multi-language tool tip
[For Deployment Person] [Before deployment] 
      • Reformat all characteristics that are not in JSON format. You can run the script "SELECT * FROM CoreFieldInstanceLocations WHERE ISJSON(Characteristic) = 0" to identify the rows that need to be corrected. If there are too many rows to modify, you can limit your corrections to misformatted characteristics that include tooltipHover (add condition to check). The script 20241031_MoveTooltipHoverFromCharacteristicToProp.sql will run correctly when the rows with characteristics including tooltipHover are in the correct format.
      
  Upgrade New Angular Version
[For Upgrade Person]
      • See Upgrade Angular 9-10

[M] Deputies: Add way for Admins to see who has been assigned as a deputy, and assign on behalf of someone else
[For Upgrade Person]
      • Add API URL to environment files:  deputyAdministration: 'api/core/deputyAdministration',

[L][16] [PAY01] Finance, Summary, Payments master list
[For Upgrade Person]
      1. Update app.module.ts: import SummaryFinanceModule in app.module
      
Improved caching of env.config.json
[For Upgrade Person]
      • Modify main.ts file according to the change in this PR: Pull request 26664: Testing caching of env.config.json - Repos
      
[L] AD Sync / Connecting AzureAD-groups to global groups in NGO Online
[For Upgrade Person]
      • Update appsettings.json Files:
            ○ Inside the Queue section, add: 
                  ▪ "ADSyncGroupsQueue": "adsyncgroupqueue",
                  ▪ "ADSyncUsersQueue": "adsyncuserqueue"
            ○ Inside the Core section, add: 
                  ▪ "ADSyncGroupsSchedule": "0 */4 * * *",
                  ▪ "ADSyncUsersSchedule": "0 * * * *"
[For Deployment Person]
      • Update Azure AppService:
            ○ Add the following keys value:
                  ▪ "Core:Queue:ADSyncGroupsQueue": "adsyncgroupqueue",
                  ▪ "Core:Queue:ADSyncUsersQueue": "adsyncuserqueue",
                  ▪ "Core:ADSyncGroupsSchedule": "0 */4 * * *",
                  ▪ "Core:ADSyncUsersSchedule": "0 * * * *"


5.14.0
[Logframe/Indicator Tracker] ID of global objective is displayed unexpectedly on at number objective field when number objective is blank on Current sprint - Core | Trello
If in client project customs GetLogframeIndicatorTrackers procedure, update isnull(obj.ObjectiveNo, glObj.ObjectiveNo) to obj.[ObjectiveNo] (changes in PR: Pull request 23454: [Logframe/Indicator Tracker] ID of global objective is displayed unexpectedly on at number objective field when number objective is blank - Repos (azure.com))

5.12.0
[Search] If we allow to preview document, we should let user do something on preview dialog
Add import of faExternalLink from '@fortawesome/pro-light-svg-icons' + add to constructor in app.module.ts

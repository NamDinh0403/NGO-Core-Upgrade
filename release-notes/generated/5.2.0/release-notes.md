# NGO Core 5.2.0 Release Notes

- **Version:** 5.2.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/5.2.0.json)
- **Quick Summary:** Mandatory Actions **2** | Conditional Actions **3** | New Features **1** | Bug Fixes **1** | Needs Review **2**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Update ' Site_URL' in file ' 20240111_ManualBeforeDeployment_MultipleSPSites.sql ' and manual run it before deployment | Before Deploy | Deployer | Multiple SP sites -<br>[Before deployment] Update ' Site_URL' in file ' 20240111_ManualBeforeDeployment_MultipleSPSites.sql ' and manual run it before deployment<br>[For upgrade person] If any compile error, then follow as below:<br>2. Replace (if exists) URIUtilities.CleanUrlSegment -> SPUtilities.CleanUrlSegment<br>3. Replace (if exists) URIUtilities.GetRelativeUrl -> SPUtilities.GetServerRelativeUrl | [Card](https://trello.com/c/42nqs50X) |
| add 'IdeaFileCopyingQueue' with value 'ideafilecopyingqueue-dev' inside 'Queue' section of WebJob's appsettings.json | Before Deploy | Deployer | [Before deployment] Azure app service configuration: add 'Core:Queue:IdeaFileCopyingQueue' with value 'ideafilecopyingqueue'<br>[For upgrade person] add 'IdeaFileCopyingQueue' with value 'ideafilecopyingqueue-dev' inside 'Queue' section of WebJob's appsettings.json | [Card](https://trello.com/c/hrimmiVG/3773-s-entityasync-job-possible-loop-forever-and-affect-the-application-if-the-approval-pdf-screenshot-is-failed) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| if the client doesn't have any special requirements (like CBMI | However, if the client doesn't have any special requirements (like CBMI...), we can keep the old configuration (Partner User role can only be assigned to Partner Member) and Restri | During Upgrade | Client Dev | However, if the client doesn't have any special requirements (like CBMI...), we can keep the old configuration (Partner User role can only be assigned to Partner Member) and RestrictedMemberRoles should be [{"globalRoleIds": [11], validInEntityRoleIds": [12]}]. | - |
| If client project has NgoContext | AuditLog show CreatedBy System | During Upgrade | Client Dev | [S] AuditLog show CreatedBy System<br>(Trello link: )<br>If client project has NgoContext , please ensure override functions SaveChanges and SaveChangesAsync set value for audit.CreatedBy following changes in PR. | [Card](https://trello.com/c/NyhuxGfA) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Core hard-coded to check "Partner Member" | During Upgrade | Client Dev | [S] [Validate Entity Member] Core hard-coded to check "Partner Member"<br>"Previously, the core hardcoded the feature: Partner User role can only be assigned to Partner Member. This card will upgrade that part by checking the roles in globalRoleIds that are only allowed to be assigned to validInEntityRoleIds. (i.e.: [{"globalRoleIds": [1, 2], validInEntityRoleIds": [15, 16]}] means roles 1, 2 can only be assigned to entity roles 15, 16). Clients can configure this here. | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | P lease check this with " select * from CoreConfigurations where = 'RestrictedMemberRoles '". Make sure that the value will be , "validInEntityRoleIds": }] . If not, run " update C | During Upgrade | Client Dev | P lease check this with " select * from CoreConfigurations where [key] = 'RestrictedMemberRoles '". Make sure that the value will be [{"globalRoleIds": [11], "validInEntityRoleIds": [12]}] . If not, run " update CoreConfigurations set [Value] = '[{"globalRoleIds": [11], "validInEntityRoleIds": [12]}]' where [key] = 'RestrictedMemberRoles' ." | - |
| if your client has some custom code related to those tables | update appsettings.json and manual run the tool: NGO.Core.Tools.UpdateLogframeGlobalResourceStrings | After Deploy | Deployer | [L] Multiple languages - Global indicators, Global objectives, Breakdowns<br>[For deployment person]<br>[After deployment] update appsettings.json and manual run the tool: NGO.Core.Tools.UpdateLogframeGlobalResourceStrings<br>[For upgrade person]<br>If any custom code in GetLogframeIndicatorTrackers.sql, please add two columns as changes in GetLogframeIndicatorTrackers.sql in PR#22030<br>The 'Name' column in db tables: CoreLogframeGlobalObjectives / CoreLogframeGlobalIndicators / CoreLogframeBreakdownTemplates and db tables: CoreLogframeObjectives (i.e. when it's global objective) / CoreLogframeIndicators (i.e. when it's global indicator) are resource strings. Therefore plz check and update your client code if your client has some custom code related to those tables. | [PR](https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/22030) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| For upgrade person | [Before deployment] Azure app service configuration: add 'Core:Queue:IdeaFileCopyingQueue' with value 'ideafilecopyingqueue' | Matched key changes: A `ngo-api-core/NGO/NGO.Core.Common/Queue/IdeaFileCopyingQueue.cs`, M `ngo-api-core/NGO/NGO.Core.HelpDocumentationDeployment/appsettings.json`, M `ngo-api-core/NGO/NGO.Core.Model/Dto/Entity.cs`, M `ngo-api-core/NGO/NGO.Core.Model/Dto/Idea.cs`, M `ngo-api-core/NGO/NGO.Core.Tools.FinanceFiscalYearValueMigration/appsettings.json`, M `ngo-api-core/NGO/NGO.Core.Tools.FixPhaseNumberForTasksAddedToWorkflowByEntity/appsettings.json`, M `ngo-api-core/NGO/NGO.Core.Tools.PopulateLogframeDraftVersions/appsettings.json`, M `ngo-api-core/NGO/NGO.Core.Tools.SetReadOnlyForSignOffDocumentsFolder/appsettings.json`, M `ngo-api-core/NGO/NGO.Core.Tools.SetWFForEntitiesCreatedWithoutWF/appsettings.json`, A `ngo-api-core/NGO/NGO.Core.Tools.UpdateLogframeGlobalResourceStrings/appsettings.json`, M `ngo-api-core/NGO/NGO.Core.Tools.UpdateTotalBudgetRow/appsettings.json`, M `ngo-api-core/NGO/NGO.Core.Tools.ValidateAndRemoveAllInvalidBudgetRows/appsettings.json`, M `ngo-api-core/NGO/NGO.Deployment/appsettings.json`, M `ngo-api-core/NGO/NGO.Webjobs/NGO.WebJobs.Job/appsettings.json`, M `ngo-api-core/NGO/NGO/appsettings.json` | Action applies during the upgrade. add 'IdeaFileCopyingQueue' with value 'ideafilecopyingqueue-dev' inside 'Queue' section of WebJob's appsettings.json | [Card](https://trello.com/c/hrimmiVG/3773-s-entityasync-job-possible-loop-forever-and-affect-the-application-if-the-approval-pdf-screenshot-is-failed) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| {"globalRoleIds": [11 / 12 | However, if the client doesn't have any special requirements (like CBMI...), we can keep the old configuration (Partner User role can only be assigned to Partner Member) and RestrictedMemberRoles should be [{"globalRoleIds": [11], validInEntityRoleIds": [12]}]. | Matched key changes: M `ngo-api-core/NGO/NGO.Core.Model/Dto/Entity.cs` | if the client doesn't have any special requirements (like CBMI. However, if the client doesn't have any special requirements (like CBMI...), we can keep the old configuration (Partner User role can only be assigned to Partner Member) and Restri | - |

# NGO Core 3.4.0 Release Notes

- **Version:** 3.4.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **19** | Conditional Actions **2** | New Features **3** | Bug Fixes **4** | Needs Review **2**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Approval PDF - Logframe Indicator Tracker | During Upgrade | Deployer | Approval PDF - Logframe Indicator Tracker<br>DataFixes/20220729_UpdateLogframeTaskApprovalSettings.sql | - |
| Add system configuration key for webjob queue in Azure Setting "sp:GenerateLogframeDraftVersionQueue": generatedraftversionqueue-dev | During Upgrade | Client Dev | - Add system configuration key for webjob queue in Azure Setting "sp:GenerateLogframeDraftVersionQueue": generatedraftversionqueue-dev | - |
| task: ExtractFiles@1 | During Upgrade | Client Dev | - task: ExtractFiles@1<br>displayName: 'extract GenerateLogframeDraftVersion'<br>inputs:<br>archiveFilePatterns: '**\NGO.Deployment\**\GenerateLogframeDraftVersion.zip'<br>destinationFolder: '$(Build.ArtifactStagingDirectory)/WebJobs/app_data/Jobs/Continuous/GenerateLogframeDraftVersion'<br>in the build-pipeline-api.yml file | - |
|  | After Deploy | Deployer | - [After deployment] | - |
| Run Tools/NGO.Core.Tools.PopulateLogframeDraftVersions to generate draft versions for remaining published versions which don't have draft version | During Upgrade | Client Dev | Run Tools/NGO.Core.Tools.PopulateLogframeDraftVersions to generate draft versions for remaining published versions which don't have draft version | - |
| Add system configuration key for allow review workflow when budget exceeds total funding: ByPassReviewValidationForBudget | During Upgrade | Client Dev | Project Budget: Allow review workflow when budget exceeds total funding<br>Add system configuration key for allow review workflow when budget exceeds total funding: ByPassReviewValidationForBudget | - |
| Add configuration key in Azure Setting for configuring internal domains: InternalDomains | During Upgrade | Client Dev | Admin UI, Manage users: All users showing as 'Guest users'<br>Add configuration key in Azure Setting for configuring internal domains: InternalDomains | - |
| Update overview document box to show icon | During Upgrade | Deployer | Update overview document box to show icon<br>DataFixes/20220422_UpdateShowIconForDocumentBox.sql | - |
| Logframe: Cannot report on Breakdown if no breakdown targets are set | During Upgrade | Deployer | Logframe: Cannot report on Breakdown if no breakdown targets are set<br>DataFixes/20220520_LogframeIndicatorTracker_AddMissingBreakdowns.sql | - |
| Admin UI - Permissions - Recycle bin | During Upgrade | Deployer | Admin UI - Permissions - Recycle bin<br>DataFixes/20220602_CoreRolePermissions_ReplaceViewByListPermissionForRecycleBin.sql | - |
| Tab entry number: Add a function similar to the EntityNumber generation for tab entries | During Upgrade | Deployer | Tab entry number: Add a function similar to the EntityNumber generation for tab entries<br>DataFixes/SequenceNumberFix.sql | - |
| Add min-width for Start page Task box column to support mobile UI | During Upgrade | Client Dev | Add min-width for Start page Task box column to support mobile UI<br>20220622_UpdateMinWidthForStartPageTaskBox | - |
| Fix for modification info fields (modifiedDate, createdDate, modifiedBy, createdBy) of Stakeholder Compliance | During Upgrade | Deployer | Fix for modification info fields (modifiedDate, createdDate, modifiedBy, createdBy) of Stakeholder Compliance<br>DataFixes/20220628_StakeholderCompliance_FixModificationInfoFields.sql Pull request | [Card](https://trello.com/c/fqRJmUK8)<br>[PR](https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/11028) |
| _update_ExchangeRatePublishMode.sql | Before Deploy | Deployer | [BeforeDeployment] 20220628_update_ExchangeRatePublishMode.sql | - |
| Remove default Description field in Overview box description, use Description field from Entity instead | During Upgrade | Deployer | Remove default Description field in Overview box description, use Description field from Entity instead<br>20220707_RemoveDescriptionFieldInOverviewboxDescription.sql | - |
| Run tool Tools/NGO.Core.Tools.UpdateTotalBudgetRow . Correct connection string | During Upgrade | Deployer | Recalculate budget total amount for old data<br>Run tool Tools/NGO.Core.Tools.UpdateTotalBudgetRow . Correct connection string | - |
| Run manual script to setup logic related to Validation AutoSum Not Editable | During Upgrade | Deployer | Fix validation for Breakdown form<br>IMPORTANT NOTE: for CFGB<br>Logframe - Structure - Objective form: From now in Breakdown config, we will remove "extraIndicatorBaselineColIndex : 3". Any client that is using this one should be updated to use colIndex = "indicatorColIndex: 1" instead.<br>Run manual script to setup logic related to Validation AutoSum Not Editable<br>20220816_UpdateReadOnlyDependencyForSumNotEditableLogframe.sql<br>Note for Core Development Env after this card is approved:<br>[Clean up Test fields - ignore this in client projects] Need to run LogframeBreakdownDataFix.sql to fix Logframe data | [Card](https://trello.com/c/KWbxIFnD/2493-s-logframe-baseline-target-inputs-not-working-correctly-in-cfgb) |
| Update log overview box | During Upgrade | Deployer | Update log overview box<br>DataFixes/20220329_UpdateLogBoxSetting.sql | - |
| Add missing Document icon to Document box item | During Upgrade | Deployer | Add missing Document icon to Document box item<br>20220701_FixMissingIconInDocumentBox.sql | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| If client project customize the names of beneficiaries template | Beneficiaries template: names of categories in Dissagregation and Additional Breakdown not support multi language. | Before Deploy | Deployer | Beneficiaries template: names of categories in Dissagregation and Additional Breakdown not support multi language.<br>If client project customize the names of beneficiaries template, please change the name in templates to resource strings and write the hot fix script to correct old data following the hot fix below. If not, run<br>this hot fix before deployment<br>DataFixes/20220517_UpdateResourceStringForBeneficiaryCategories.sql (read the note above) | - |
| ExchangeRatePublishMode { Editable = 0, AutoFill = 1, AutoFillAndEditable = 2 } . More detail in Config wiki > CoreExchangeRates | Finance tabs: Have exchange rates auto-fill but remain editable | During Upgrade | Client Dev | Finance tabs: Have exchange rates auto-fill but remain editable<br>Base on the current configuration of the client, make sure to update all sql script of the client to the value from<br>ExchangeRatePublishMode { Editable = 0, AutoFill = 1, AutoFillAndEditable = 2 } . More detail in Config wiki > CoreExchangeRates<br>for these key<br>( 'AutoSetBudgetExchangeRate' ,'AutoSetFundingExchangeRate' , 'AutoSetExpenditureExchangeRate') | [Card](https://trello.com/c/yZIw8i1y) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Logframe draft versions | During Upgrade | Client Dev | Logframe draft versions<br>From now on, the draft version of logframe will be auto generated after the previous version published via | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | NGO.Core.Webjobs.GenerateLogframeDraftVersion webjob (for more information: | During Upgrade | Client Dev | NGO.Core.Webjobs.GenerateLogframeDraftVersion webjob (for more information: | [Card](https://trello.com/c/uqZLlXB1) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | In case client project, please make sure to add | No deterministic git-diff evidence was supplied for this note. | No explicit client action was stated in the release source. | - |
| Shared / Cross-track | Project Budget: Allow review workflow when budget exceeds total funding | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. Add system configuration key for allow review workflow when budget exceeds total funding: ByPassReviewValidationForBudget | - |
| Database / Deployment | Tab entry number: Add a function similar to the EntityNumber generation for tab entries | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. Tab entry number: Add a function similar to the EntityNumber generation for tab entries | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | Logframe: Cannot report on Breakdown if no breakdown targets are set | No deterministic git-diff evidence was supplied for this note. | Logframe: Cannot report on Breakdown if no breakdown targets are set | - |
| Database / Deployment | Fix for modification info fields (modifiedDate, createdDate, modifiedBy, createdBy) of Stakeholder Compliance | No deterministic git-diff evidence was supplied for this note. | Fix for modification info fields (modifiedDate, createdDate, modifiedBy, createdBy) of Stakeholder Compliance | [Card](https://trello.com/c/fqRJmUK8)<br>[PR](https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-online-core/pullrequest/11028) |
| Clean up Test fields - ignore this in client projects | Fix validation for Breakdown form | No deterministic git-diff evidence was supplied for this note. | Run manual script to setup logic related to Validation AutoSum Not Editable | [Card](https://trello.com/c/KWbxIFnD/2493-s-logframe-baseline-target-inputs-not-working-correctly-in-cfgb) |
| Database / Deployment | Add missing Document icon to Document box item | No deterministic git-diff evidence was supplied for this note. | Add missing Document icon to Document box item | - |

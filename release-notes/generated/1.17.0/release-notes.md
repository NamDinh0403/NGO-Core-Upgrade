# NGO Core 1.17.0 Release Notes

- **Version:** 1.17.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **7** | Conditional Actions **1** | New Features **4** | Bug Fixes **3** | Needs Review **19**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Update your script config of beneficiary SQL to set value '2' for year type 'Calendar year'. | During Upgrade | Client Dev | - Update your script config of beneficiary SQL to set value '2' for year type 'Calendar year'. | - |
| SET IDENTITY_INSERT .CoreYearTypes ON | During Upgrade | Client Dev | CASE 1: If CoreYearTypes table is existing, then run SQL script to add missing year types, so when deploying new table structure, you will not get data foreign value conflicted.<br>SET IDENTITY_INSERT [dbo].CoreYearTypes ON | - |
| update set = Source. , | During Upgrade | Client Dev | update set [Name] = Source.[Name], | - |
| SET IDENTITY_INSERT .CoreYearTypes OFF | During Upgrade | Client Dev | SET IDENTITY_INSERT [dbo].CoreYearTypes OFF | - |
| UPDATE CoreBeneficiaryVersions SET YearTypeId = 2 | During Upgrade | Client Dev | UPDATE CoreBeneficiaryVersions SET YearTypeId = 2 | - |
| build-pipeline-api.yml | During Upgrade | Client Dev | - build-pipeline-api.yml | - |
| Add task to extract the webjob for auditlogging before the "PublishPipelineArtifact" task: | During Upgrade | Client Dev | Add task to extract the webjob for auditlogging before the "PublishPipelineArtifact" task: | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| only for clients implemented 'beneficiary' before 2020-08-05), run below script to change year type 'Calendar year' to '2' for existing data | UPDATE CoreBeneficiaryTemplates SET YearTypeId = 2 | During Upgrade | Client Dev | 2. After new deployment: (optional step - hotfix - only for clients implemented 'beneficiary' before 2020-08-05), run below script to change year type 'Calendar year' to '2' for existing data:<br>UPDATE CoreBeneficiaryTemplates SET YearTypeId = 2 | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | YearType | During Upgrade | Client Dev | YearType | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | merge into .CoreYearTypes as Target | During Upgrade | Client Dev | merge into [dbo].CoreYearTypes as Target | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | using (values | During Upgrade | Client Dev | using (values | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | (4, 'metadata.year_type_manual', 1) | During Upgrade | Client Dev | (4, 'metadata.year_type_manual', 1) | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | as Source ( , , ) | During Upgrade | Client Dev | ) as Source ([Id], [Name], [Active]) | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | on Target. = Source. | During Upgrade | Client Dev | on Target.[Id] = Source.[Id] | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | when matched then | During Upgrade | Client Dev | when matched then | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | = Source. | During Upgrade | Client Dev | [Active] = Source.[Active] | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | when not matched by target then | During Upgrade | Client Dev | when not matched by target then | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | insert ( , , ) | During Upgrade | Client Dev | insert ([Id], [Name], [Active]) | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | values ( , , ); | During Upgrade | Client Dev | values ([Id], [Name], [Active]); | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Manually backup the value of column 'PhaseRepeatPeriodId' on CoreWorkflows | During Upgrade | Client Dev | - Manually backup the value of column 'PhaseRepeatPeriodId' on CoreWorkflows | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Manually set PhaseRepeatPeriodId to NULL | During Upgrade | Client Dev | - Manually set PhaseRepeatPeriodId to NULL | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | This build included: | During Upgrade | Client Dev | - This build included: | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Display Idea/Funding Idea on My Sites by using CoreConfigurations. IdeaMemberFields | During Upgrade | Client Dev | - Display Idea/Funding Idea on My Sites by using CoreConfigurations. IdeaMemberFields [ Show Idea on start page - EntityMember For Idea And Funding Idea in Config Wiki] | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | FieldHelperService. createViewFormItem to create ViewFormItem object instead of create them inline. | During Upgrade | Client Dev | - FieldHelperService. createViewFormItem to create ViewFormItem object instead of create them inline. | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | FieldHelperService. createFieldProperty to create FieldProperty object instead of create them inline. | During Upgrade | Client Dev | - FieldHelperService. createFieldProperty to create FieldProperty object instead of create them inline. | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Deployment | During Upgrade | Client Dev | - Deployment | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | After deployment finished, manually set PhaseRepeatPeriodId back to the original value | After Deploy | Deployer | - After deployment finished, manually set PhaseRepeatPeriodId back to the original value | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | When adding new db migration (C#) for new Core package, find line A and add new line B above A. | No deterministic git-diff evidence was supplied for this note. | No explicit client action was stated in the release source. | - |
| Database / Deployment | Before new deployment: | No deterministic git-diff evidence was supplied for this note. | No explicit client action was stated in the release source. | - |
| Database / Deployment | 2. After new deployment: (optional step - hotfix - only for clients implemented 'beneficiary' before 2020-08-05), run below script to change year type 'Calendar year' to '2' for existing data: | No deterministic git-diff evidence was supplied for this note. | only for clients implemented 'beneficiary' before 2020-08-05), run below script to change year type 'Calendar year' to '2' for existing data UPDATE CoreBeneficiaryTemplates SET YearTypeId = 2 | - |
| Shared / Cross-track | The new Dependency configuration | No deterministic git-diff evidence was supplied for this note. | No explicit client action was stated in the release source. | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| dbo | CASE 1: If CoreYearTypes table is existing, then run SQL script to add missing year types, so when deploying new table structure, you will not get data foreign value conflicted. | No deterministic git-diff evidence was supplied for this note. | SET IDENTITY_INSERT .CoreYearTypes ON | - |
| Developer | TS Coding update [Developer] Using helper to create object instead of create them inline ( to prevent missing the new dependency configuration) : | No deterministic git-diff evidence was supplied for this note. | None stated in the release source. | - |
| Database / Deployment | Fix YearType - when upgrading new core package (for clients) | No deterministic git-diff evidence was supplied for this note. | None stated in the release source. | - |

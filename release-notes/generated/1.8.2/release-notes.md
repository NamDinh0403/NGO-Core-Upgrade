# NGO Core 1.8.2 Release Notes

- **Version:** 1.8.2
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **2** | Conditional Actions **1** | New Features **1** | Bug Fixes **0** | Needs Review **10**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Add line beneficiaries: 'api/core/entity', | During Upgrade | Client Dev | - Add line beneficiaries: 'api/core/entity', | - |
| Add line budget: 'api/core/entity', | During Upgrade | Client Dev | - Add line budget: 'api/core/entity', | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| Refactoring code: Please check all customized mapper in client projects | PR 2013 (if merged): Delete the files in Deplyment\DatabaseSeed\01 Core before updating the Deployment Nuget package | During Upgrade | Client Dev | PR 2013 (if merged): Delete the files in Deplyment\DatabaseSeed\01 Core before updating the Deployment Nuget package<br>Refactoring code: Please check all customized mapper in client projects | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | When copying the primitive properties from object A to object B | During Upgrade | Client Dev | - When copying the primitive properties from object A to object B | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Dto to Model: Dto.ToOptionalFields(Model) | During Upgrade | Client Dev | - Dto to Model: Dto.ToOptionalFields(Model) | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Model to Dto: Model.ToOptionalFields(Dto) | During Upgrade | Client Dev | - Model to Dto: Model.ToOptionalFields(Dto) | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Model to DataModel: Model.ToOptionalFields(DataModel) | During Upgrade | Client Dev | - Model to DataModel: Model.ToOptionalFields(DataModel) | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | DataModel to Model: DataModel.ToOptionalFields(Model, extractedSourceType : false) because in DataModel, normally, there is no attribute PrimitiveProperty is set for property, ther | During Upgrade | Client Dev | - DataModel to Model: DataModel.ToOptionalFields(Model, extractedSourceType : false) because in DataModel, normally, there is no attribute PrimitiveProperty is set for property, therefore it will use the Model class to extract properties | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | app.module.ts | During Upgrade | Client Dev | - app.module.ts | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | import BeneficiaryModule | During Upgrade | Client Dev | - import BeneficiaryModule | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | environments.ts & environments.prod.ts | During Upgrade | Client Dev | - environments.ts & environments.prod.ts | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | import BudgetModule | During Upgrade | Client Dev | - import BudgetModule | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | ToOptionalFields | During Upgrade | Client Dev | ToOptionalFields | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | To add timezone for DATETIME field, in DtoMapper , it should add parameter to this function includeTimeZone = true | No deterministic git-diff evidence was supplied for this note. | No explicit client action was stated in the release source. | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

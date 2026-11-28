# NGO Core 2.24.0 Release Notes

- **Version:** 2.24.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **6** | Conditional Actions **0** | New Features **0** | Bug Fixes **0** | Needs Review **2**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Run migration tool for Beneficiaries: NGO.Core.Tools.PeriodNamesPopulation | After Deploy | Deployer | Analyse / Beneficiaries: Name of Target and reporting period not same as form<br>After deployment:<br>Run migration tool for Beneficiaries: NGO.Core.Tools.PeriodNamesPopulation<br>Run script: DataFixes/20220218_Beneficiaries_RemoveUnusedView.sql | - |
| Change project field name to entity page | During Upgrade | Deployer | [Admin portal_Allocations-'Project']Change project field name to entity page<br>DataFixes/20220217_UpdateResourceStrings_AdminAllocations.sql | - |
| Correct Id of mandatory fields | Before Deploy | Deployer | Correct Id of mandatory fields<br>Before deployment: 20220309_CorrectIndexField.sql | - |
| Remove duplicate field in Idea | During Upgrade | Deployer | Remove duplicate field in Idea<br>DataFixes/20220311_RemoveDuplicateFieldInIdea.sql | - |
| Admin / Metadata: Ensure resource string key has no space or dot | After Deploy | Deployer | Admin / Metadata: Ensure resource string key has no space or dot<br>[After deployment]: 20220323_MigrateOptionsHavingSpaces.sql | - |
| FOR DEV who upgrade to this version Read and follow the instruction in 20220324_FixCharacteristic.sql | During Upgrade | Deployer | - FOR DEV who upgrade to this version Read and follow the instruction in 20220324_FixCharacteristic.sql | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Make sure No more Characteristic > isResourceLibrary in the sql script / code, replace it with Characteristic > isResourceLib | During Upgrade | Client Dev | - Make sure No more Characteristic > isResourceLibrary in the sql script / code, replace it with Characteristic > isResourceLib | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Admin Portal, Entity/Tab Fields problem with ticked Characteristics in table view | During Upgrade | Client Dev | Admin Portal, Entity/Tab Fields problem with ticked Characteristics in table view | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

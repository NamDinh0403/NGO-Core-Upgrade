# NGO Core 2.15.0 Release Notes

- **Version:** 2.15.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **5** | Conditional Actions **0** | New Features **1** | Bug Fixes **0** | Needs Review **2**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| CoreResourceStrings: Document button bar - Rename "New from template" to "New Document" | After Deploy | Deployer | CoreResourceStrings: Document button bar - Rename "New from template" to "New Document"<br>[After deployment]<br>DataFixes/20210701_UpdateResourceStringKeysForDocumentButton.sql | - |
| UPDATE CoreTaskApprovalSettings SET TaskFolderSetting = REPLACE(TaskFolderSetting, N'}​​​', N', extraText: "####"}​​​​​​​​​​') WHERE TaskFolderSetting LIKE '%}​​​​​​​​​​​​​​​​​​​​​ | During Upgrade | Client Dev | Approval file name without having number formating (copy two below lines into a manual script file in your client project)<br>UPDATE CoreTaskApprovalSettings SET TaskFolderSetting = REPLACE(TaskFolderSetting, N'}​​​', N', extraText: "####"}​​​​​​​​​​') WHERE TaskFolderSetting LIKE '%}​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​' AND TaskFolderSetting NOT LIKE '%extraText%' ￼ UPDATE CoreTaskApprovalSettings SET PdfFileNameFormat = REPLACE(PdfFileNameFormat, N'}​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​', N', extraText: "####"}​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​') WHERE PdfFileNameFormat LIKE '%}​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​' AND PdfFileNameFormat NOT LIKE '%extraText%' ￼ | - |
| Logframe EOY | During Upgrade | Deployer | Logframe EOY<br>Before upgrade/deployment: Run this file DataFixes\20210610_[Before]_Logframe_Add_EOY.sql | - |
| CoreFieldInstances: Update Chacracteristics with ExportDispalyedName property for project name | After Deploy | Deployer | CoreFieldInstances: Update Chacracteristics with ExportDispalyedName property for project name<br>[After deployment]<br>DataFixes\20210608_UpdateCharacteristicWithExportDisplayNameForProject.sql | - |
| Admin Options : set special lists as system, and read-only in UI | During Upgrade | Deployer | Admin Options : set special lists as system, and read-only in UI<br>DataFixes\20210812_UpdatePermissionsOfMetadataList.sql | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Admin UI - Adjust "Administrator" role permission | During Upgrade | Client Dev | Admin UI - Adjust "Administrator" role permission<br>DataFixes: 20210617_UpdateAdminPermissionOnAdminUI | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Funding Entity Page: Update Resource String with key = "untrack_funding" for funding entity toolbox | During Upgrade | Client Dev | Funding Entity Page: Update Resource String with key = "untrack_funding" for funding entity toolbox<br>Before upgrade/deployment: Run this file DataFixes\20210628_UpdateResourceStringValuesForUntrackingFunding | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | CoreResourceStrings: Document button bar - Rename "New from template" to "New Document" | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. CoreResourceStrings: Document button bar - Rename "New from template" to "New Document" | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

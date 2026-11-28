# NGO Core 2.18.0 Release Notes

- **Version:** 2.18.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **3** | Conditional Actions **0** | New Features **1** | Bug Fixes **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| NG TEST ENV - Admin Portal, metadata list, duplicates and spelling error | During Upgrade | Deployer | NG TEST ENV - Admin Portal, metadata list, duplicates and spelling error<br>20210928_UpdateNamesForOptionsLists.sql | - |
| Remove preview field in manage Email | During Upgrade | Deployer | [Amin portal] Remove preview field in manage Email<br>20211008_RemovePreviewFieldInAdminManageEmail.sql | - |
| UPDATE CoreTaskApprovalSettings SET PdfTemplates = ' ' WHERE EntityDefinitionId = 6 AND TabDefinitionId = 16 AND TabFunctionId = 18 | During Upgrade | Client Dev | Funding plan Approval PDF - Add more info<br>UPDATE CoreTaskApprovalSettings SET PdfTemplates = '[{ extraValue: "/Documents/PdfTemplates/FundingPlanApprovalTemplate.docx", sortOrder: 2, extraText: "MAIN"} ]' WHERE EntityDefinitionId = 6 AND TabDefinitionId = 16 AND TabFunctionId = 18 | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| None identified. | - | - | - | - | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| { extraValue: "/Documents/PdfTemplates/FundingPlanApprovalTemplate.docx", sortOrder: 2, extraText: "MAIN"} | Funding plan Approval PDF - Add more info | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. UPDATE CoreTaskApprovalSettings SET PdfTemplates = ' ' WHERE EntityDefinitionId = 6 AND TabDefinitionId = 16 AND TabFunctionId = 18 | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | NG TEST ENV - Admin Portal, metadata list, duplicates and spelling error | No deterministic git-diff evidence was supplied for this note. | NG TEST ENV - Admin Portal, metadata list, duplicates and spelling error | - |

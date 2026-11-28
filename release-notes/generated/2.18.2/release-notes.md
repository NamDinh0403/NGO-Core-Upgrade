# NGO Core 2.18.2 Release Notes

- **Version:** 2.18.2
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **2** | Conditional Actions **0** | New Features **0** | Bug Fixes **1** | Needs Review **2**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| fixes a small bug in the core.sql script. This can manually be fixed by adding this script to a custom script. | During Upgrade | Deployer | 2.18.2 fixes a small bug in the core.sql script. This can manually be fixed by adding this script to a custom script. | - |
| UPDATE CoreFieldDefinitions SET SqlMapping = '{ Type: 1, RawColumns: , ColumnNames: , Joins: , Type: 4} ]} ' WHERE Id = 63 | During Upgrade | Client Dev | UPDATE CoreFieldDefinitions SET SqlMapping = '{ Type: 1, RawColumns: ["ISNULL(cwfiResx.Value, cwfi.CurrentPhaseName) AS CurrentPhase"], ColumnNames: ["cwfi.CurrentPhase as CurrentPhaseId" ], Joins: [{ TableName: "CoreWorkflowInstances", Alias: "cwfi", First: "cwfi.EntityId", Second: "e.Id", Type: 2} ,{ TableName: "CoreResourceStringsView", Alias: "cwfiResx", TableHints:"WITH(NOEXPAND)", Conditions: [{ First: "cwfiResx.FullKey", Second: "cwfi.CurrentPhaseName"} , { First: "cwfiResx.localeId", Second: "@localeId"} ], Type: 4} ]} ' WHERE Id = 63 | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | (Use 2.18.2 instead) | During Upgrade | Client Dev | 2.18.1 (Use 2.18.2 instead)<br>Budget template: Update template pdf for budget<br>DataFixes/20211104_UpdateBudgetPdfTemplate | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | (Use 2.18.2 instead) | During Upgrade | Client Dev | 2.18.1 (Use 2.18.2 instead) | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | 2.18.2 fixes a small bug in the core.sql script. This can manually be fixed by adding this script to a custom script. | No deterministic git-diff evidence was supplied for this note. | fixes a small bug in the core.sql script. This can manually be fixed by adding this script to a custom script. | - |

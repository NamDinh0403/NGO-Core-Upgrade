# NGO Core 2.4.0 Release Notes

- **Version:** 2.4.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **3** | Conditional Actions **0** | New Features **0** | Bug Fixes **0** | Needs Review **2**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Please run file " 20200928_MigrationForRelatedEntityInLog.sql " before deployment | Before Deploy | Deployer | - Please run file " 20200928_MigrationForRelatedEntityInLog.sql " before deployment | - |
| Update log configuration in scripts to remove any references to FieldInsstances 2006, 2029, 2106, 2129 | During Upgrade | Client Dev | - Update log configuration in scripts to remove any references to FieldInsstances 2006, 2029, 2106, 2129 | - |
| Run this script " 20200928_RefactorDependencyFIeldInLog.sql " after change the FieldInstanceId | During Upgrade | Deployer | - Run this script " 20200928_RefactorDependencyFIeldInLog.sql " after change the FieldInstanceId | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | If project use FieldInstanceId 2006, 2010, 2029, 2031, 2106, 2129, 2131, 2130, please replace it to FieldInstanceId: 2006 => 2007, 2029 => 2002, 2010 => 2008, 2130 => 2108, 2031 => | During Upgrade | Client Dev | - If project use FieldInstanceId 2006, 2010, 2029, 2031, 2106, 2129, 2131, 2130, please replace it to FieldInstanceId: 2006 => 2007, 2029 => 2002, 2010 => 2008, 2130 => 2108, 2031 => 2007, 2131 => 2107, 2129 => 2102, 2106 => 2107 | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Refactoring dependency field in log tab | During Upgrade | Client Dev | Refactoring dependency field in log tab | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

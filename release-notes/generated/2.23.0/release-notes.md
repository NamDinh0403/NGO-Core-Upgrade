# NGO Core 2.23.0 Release Notes

- **Version:** 2.23.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **3** | Conditional Actions **0** | New Features **0** | Bug Fixes **2**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Tasks: 'Display in workflow tab' checkbox disappears after task created | During Upgrade | Deployer | Tasks: 'Display in workflow tab' checkbox disappears after task created<br>DataFixes/20220217_Task_DisplayTaskFlowOptionEditMode.sql | - |
| Logframe - Associated global indicator is required - can't be deleted but can be update to another global indicator | After Deploy | Deployer | Logframe - Associated global indicator is required - can't be deleted but can be update to another global indicator<br>After deployment: DataFixes/ 20220210_LogframeMandatoryGlobalIndicatorLocked.sql | - |
| BUG: The resource string for the button to create new tasks is wrong | During Upgrade | Deployer | [T] BUG: The resource string for the button to create new tasks is wrong<br>DataFixes/20220124_UpdateResourceStrings.sql | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| None identified. | - | - | - | - | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | Logframe - Associated global indicator is required - can't be deleted but can be update to another global indicator | No deterministic git-diff evidence was supplied for this note. | Logframe - Associated global indicator is required - can't be deleted but can be update to another global indicator | - |
| Database / Deployment | [T] BUG: The resource string for the button to create new tasks is wrong | No deterministic git-diff evidence was supplied for this note. | BUG: The resource string for the button to create new tasks is wrong | - |

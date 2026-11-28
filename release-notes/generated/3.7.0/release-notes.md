# NGO Core 3.7.0 Release Notes

- **Version:** 3.7.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **6** | Conditional Actions **0** | New Features **1** | Bug Fixes **2**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| < | After Deploy | Deployer | <<br>[After deployment]: DataFixes/ 20220921_RemoveWrongTabFunctionForProgramMonitoring.sql | [Card](https://trello.com/c/tNHvm870) |
| Card: Task templates: Typo in default templates | After Deploy | Deployer | Card: [T] Task templates: Typo in default templates<br>[T] Task templates: Typo in default templates on Current sprint - Core \| Trello<br>[After deployment]: DataFixes/20221923_UpdateResourceStrings_Beneficiary.sql | [Card](https://trello.com/c/lIsG7uBe/2714-t-task-templates-typo-in-default-templates) |
| Replace the last line in SeedDb.ps1 with: | During Upgrade | Deployer | Card: [S] Deployment: Make SQL errors in deployment cause the deployment to fail<br>Replace the last line in SeedDb.ps1 with:<br>Get-ChildItem -Path $PSScriptRoot -Recurse -Filter "*.sql" \| sort FullName \| foreach { Write-Output 'Running script: ' $_.FullName; Invoke-Sqlcmd -ConnectionString "$CoreContextConnectionString" -InputFile $_.FullName -Verbose -ErrorAction Stop }<br>==> Must copy from Core ( alot of hidden space after the { and } . If you copy from here remember to remove those spaces) | [Card](https://trello.com/c/GcZeUV9Y) |
| Card: Incorrect default responsible person when manually creating a task from task template < > | After Deploy | Deployer | Card: [T][Task] Incorrect default responsible person when manually creating a task from task template < ><br>[After deployment]: DataFixes/20221003_UpdateResourceStringForDefaultResponsiblePerson.sql | [Card](https://trello.com/c/J3i6pbrb) |
| Card: Summary, Risks box: Pop-up is empty again when clicking on a number < > | After Deploy | Deployer | Card: [S] Summary, Risks box: Pop-up is empty again when clicking on a number < ><br>[After deployment]: DataFixes/20221006_UpdateRiskSummaryForm.sql | [Card](https://trello.com/c/bWadZZc6) |
| Card: Documents, Limited permissions, can't select "Restricted users" in View or Edit - is this by design? < > | After Deploy | Deployer | Card: [S] Documents, Limited permissions, can't select "Restricted users" in View or Edit - is this by design? < ><br>[After deployment]: 20221012_UpdatePermissionRoleNameInLimitedPermision .sql | [Card](https://trello.com/c/4AvOpuum) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| None identified. | - | - | - | - | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | Card: [M] Finance, Monitoring tab: Add export to excel for budget vs expenditure table | No deterministic git-diff evidence was supplied for this note. | No explicit client action was stated in the release source. | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Task | Card: [T][Task] Incorrect default responsible person when manually creating a task from task template < > | No deterministic git-diff evidence was supplied for this note. | Card: Incorrect default responsible person when manually creating a task from task template < > | [Card](https://trello.com/c/J3i6pbrb) |
| Database / Deployment | Card: [S] Documents, Limited permissions, can't select "Restricted users" in View or Edit - is this by design? < > | No deterministic git-diff evidence was supplied for this note. | Card: Documents, Limited permissions, can't select "Restricted users" in View or Edit - is this by design? < > | [Card](https://trello.com/c/4AvOpuum) |

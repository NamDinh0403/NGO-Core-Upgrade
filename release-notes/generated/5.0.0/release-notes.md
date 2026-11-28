# NGO Core 5.0.0 Release Notes

- **Version:** 5.0.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/5.0.0.json)
- **Quick Summary:** Mandatory Actions **5** | Conditional Actions **1** | New Features **0** | Bug Fixes **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| EF Core | During Upgrade | Deployer | EF Core<br>[For deployment person] | [Card](https://trello.com/c/Haz9EfB3/3622-ef-core) |
| Update Migrate NGO Context step script to "efbundle.exe" | During Upgrade | Client Dev | - Update Migrate NGO Context step script to "efbundle.exe" | - |
| Add suffix "/CoreDBMigration/migrations" to "Advanced/Working Directory" of "Migrate NGO Context" step | During Upgrade | Client Dev | - Add suffix "/CoreDBMigration/migrations" to "Advanced/Working Directory" of "Migrate NGO Context" step | - |
| Add release variable "MigrationsAssembly": "NGO.Repositories" | During Upgrade | Client Dev | - Add release variable "MigrationsAssembly": "NGO.Repositories" | - |
| I remember some clients using bulk/batch insert technique in transaction integration web job but I cannot remember if it's referencing to Z.EntityFramework.Extensions.EFCore or not | During Upgrade | Client Dev | [For upgrade person] I remember some clients using bulk/batch insert technique in transaction integration web job but I cannot remember if it's referencing to Z.EntityFramework.Extensions.EFCore or not. But anyway please find 'context.BulkInsert' / 'context.BulkUpdate' / 'context.BulkDelete', if existing, try to replace with other way because those extensions (i.e. Z.EntityFramework.Extensions.EFCore) are licensed and only free for several months. | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| Check if client are overwritting any repositories of Task function (TaskRepository, TaskFlowRepository,…) | Upgrade steps detailed in document - Upgrade to EF Core : | During Upgrade | Client Dev | Upgrade steps detailed in document - Upgrade to EF Core :<br>Be careful: Check if client are overwritting any repositories of Task function (TaskRepository, TaskFlowRepository,…). If yes, please separate NgoContext and CoreContext to use it separately, DO NOT USE NgoContext to map with CoreContext when inherit contructor of repositories from Core (see image) | [Ref](https://precio.sharepoint.com/:w:/r/sites/ngo-oonline/Shared%20Documents/03%20Core/Development/Technical/Upgrade%20to%20EF%20Core.docx?d=we3b5c3c3b5be4894aa9cd71d84f8172b&csf=1&web=1&e=LeVF2B) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| For upgrade person | [For upgrade person] I remember some clients using bulk/batch insert technique in transaction integration web job but I cannot remember if it's referencing to Z.EntityFramework.Extensions.EFCore or not. But anyway please find 'context.BulkInsert' / 'context.BulkUpdate' / 'context.BulkDelete', if existing, try to replace with other way because those extensions (i.e. Z.EntityFramework.Extensions.EFCore) are licensed and only free for several months. | Matched key changes: M `ngo-api-core/NGO/NGO.Core.Model/Domain/Entity.cs`, M `ngo-api-core/NGO/NGO.Core.Model/Dto/Entity.cs` | I remember some clients using bulk/batch insert technique in transaction integration web job but I cannot remember if it's referencing to Z.EntityFramework.Extensions.EFCore or not | - |

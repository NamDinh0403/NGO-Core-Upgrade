# NGO Core 8.9.0 Release Notes

- **Version:** 8.9.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/8.9.0.json)
- **Quick Summary:** Mandatory Actions **0** | Conditional Actions **1** | New Features **1** | Bug Fixes **0** | Needs Review **3**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| check if they should be updated to ] instead | Idea Task - Reassign: sent emails should be more precise on Current sprint - Core \| Trello | During Upgrade | Client Dev | [4][S] Idea Task - Reassign: sent emails should be more precise on Current sprint - Core \| Trello<br>If client projects use custom email templates with tokens like [[TaskFlow.Submitter.Name]] , [[FundingIdea.CreatedBy.Name]] , or [[Idea.CreatedBy.Name]] , please check if they should be updated to [[TaskActorName]] instead. | [Card](https://trello.com/c/9s2Srmf1/5508-4s-idea-task-reassign-sent-emails-should-be-more-precise) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | If you want to show Inactive user from UserOptions, put this flag to CoreAnalyzeColumns' FieldCharacteristic | During Upgrade | Client Dev | If you want to show Inactive user from UserOptions, put this flag to CoreAnalyzeColumns' FieldCharacteristic<br>FieldCharacteristic . isAlwaysShowInactive = true | [Card](https://trello.com/c/WP3RDffZ/5605-analyse-and-inactive-users) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Review release note | During Upgrade | Client Dev | Review release note | [Card](https://trello.com/c/dYcw3tZP/5652-s-analyse-support-more-field-characteristic-for-configoptions) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | If you want to show Inactive user from ConfigOptionsMapper, put this flag to CoreAnalyzeColumns' FieldCharacteristic | During Upgrade | Client Dev | - If you want to show Inactive user from ConfigOptionsMapper, put this flag to CoreAnalyzeColumns' FieldCharacteristic<br>FieldCharacteristic . isAlwaysShowInactive = true | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Backend | If you want to enable Readonly options of ConfigOptionsMapper, put this flag to CoreAnalyzeColumns' FieldCharacteristic | Matched key changes: M `ngo-api-core/NGO/NGO.Core.Repositories/Mapping/OptionsMapper/ConfigOptionsMapper.cs` | No explicit client action was stated in the release source. | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

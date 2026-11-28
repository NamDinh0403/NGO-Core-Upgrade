# NGO Core 5.1.0 Release Notes

- **Version:** 5.1.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/5.1.0.json)
- **Quick Summary:** Mandatory Actions **1** | Conditional Actions **0** | New Features **0** | Bug Fixes **0** | Needs Review **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Update CustomQueue in client project | During Upgrade | Client Dev | Updates to Azure storage/queues packages<br>Please check any custom WebJob code that uses the function " JsonTo64BaseString" and replace with "ToJsonBytes".<br>Update CustomQueue in client project<br>Remove all the code in Queue Class, change the AzureBaseStorage to QueueBase, IQueue ( if normal queue) or QueueBaseWithFallback, IQueueWithFallback if it is a blob queue | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Remove resource string module Active flag | During Upgrade | Client Dev | [S] Remove resource string module Active flag<br>[S] Remove resource string module Active flag on Current sprint - Core \| Trello<br>[Before deployments] Check scripts if using Active flag in CoreResourceStringModules and remove it. | [Card](https://trello.com/c/XyjiGV0t/3938-s-remove-resource-string-module-active-flag?filter=resource) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

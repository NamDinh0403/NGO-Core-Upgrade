# NGO Core 5.7.2 Release Notes

- **Version:** 5.7.2
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **4** | Conditional Actions **0** | New Features **0** | Bug Fixes **0**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Patch from latest core version Client wants to always run the custom script before Core script | During Upgrade | Deployer | Patch from latest core version [S] [Deployment] Client wants to always run the custom script before Core script | [Card](https://trello.com/c/RmvNDK6d/) |
| Add "BeforeCoreFolder": "BeforeCore" to deployment's appSettings.json | During Upgrade | Client Dev | - Add "BeforeCoreFolder": "BeforeCore" to deployment's appSettings.json | - |
| Add copy always to "BeforeCore" folder in NGO.Deployment.csproj | During Upgrade | Client Dev | - Add copy always to "BeforeCore" folder in NGO.Deployment.csproj | - |
| Add "Core:Deployment:BeforeCoreFolder" with value BeforeCore to Release > Variables > Pipeline variables | During Upgrade | Client Dev | - Add "Core:Deployment:BeforeCoreFolder" with value BeforeCore to Release > Variables > Pipeline variables | - |

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
| None identified. | - | - | - | - |

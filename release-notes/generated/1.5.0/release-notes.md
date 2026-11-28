# NGO Core 1.5.0 Release Notes

- **Version:** 1.5.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **2** | Conditional Actions **0** | New Features **0** | Bug Fixes **0**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Deployment | During Upgrade | Client Dev | 1. Deployment<br>New parameters for Deploy.ps1. Release pipelines and Azure AppServices needs to be updated:<br>-ScreenshotQueue "screenshotqueue-dev"<br>2. Config<br>New appsettings needed in web config:<br><add key="sp:ScreenshotQueue" value="screenshotqueue-dev" /> | - |
| add WebJobs.ScreenshotAsyncManagement to client project with services references from itself and core. This also needs to be added to release pipeline. | During Upgrade | Client Dev | 3. WebJob<br>add WebJobs.ScreenshotAsyncManagement to client project with services references from itself and core. This also needs to be added to release pipeline. | - |

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

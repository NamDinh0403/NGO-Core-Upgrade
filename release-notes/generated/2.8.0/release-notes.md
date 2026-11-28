# NGO Core 2.8.0 Release Notes

- **Version:** 2.8.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **3** | Conditional Actions **1** | New Features **0** | Bug Fixes **0** | Needs Review **2**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Add the following line to environment.ts and environment.prod.ts: | During Upgrade | Client Dev | Iframe<br>Add the following line to environment.ts and environment.prod.ts:<br>entityIframe: 'api/core/iframe', | - |
| Add the following line to environment.ts and environment.prod.ts: | During Upgrade | Client Dev | Exchange rates<br>Add the following line to environment.ts and environment.prod.ts:<br>exchangeRate: 'api/core/exchangeRates' | - |
| Add the following FieldInstanceLocations to enable fields on global indicators, custom indicators and YTD tracking: | During Upgrade | Client Dev | Add the following FieldInstanceLocations to enable fields on global indicators, custom indicators and YTD tracking:<br>-- global indicator form<br>(16011, 7650, 3, 2, NULL, NULL,NULL, 1, 2, 1, NULL, N'{ "defaultValue": false, "setDefaultValueOnNewFormOnly": true, "booleanTrueDisplayText": "logframe.is_cumulative_true", "booleanFalseDisplayText": "logframe.is_cumulative_false" } ', NULL, NULL, NULL, NULL, NULL),<br>-- entity indicator form<br>(16021,6629,10,1, NULL, NULL,NULL,1,2,1, 120, N'{ "customGroupedBy": "2072", "hideLabel": true, "defaultValue": false, "setDefaultValueOnNewFormOnly": true, "booleanTrueDisplayText": "logframe.is_cumulative_true", "booleanFalseDisplayText": "logframe.is_cumulative_false" } ', NULL, 5, 'px', NULL, NULL),<br>(16022,6629,10,1, NULL, NULL,NULL,1,2,1, 120, N'{ "customGroupedBy": "2071", "hideLabel": true, "readOnly": true, "autoCopyValueFromDependentProp": true, "autoCopyValueFromDependentFieldName": "globalIndicator", "booleanTrueDisplayText": "logframe.is_cumulative_true", "booleanFalseDisplayText": "logframe.is_cumulative_false" } ', NULL, 5, 'px', NULL, NULL),<br>--table tracker<br>(16031,6729,15,6, NULL, NULL,NULL,1,1,1, 100, N'{ "customGroupedBy": "2071;2072", "hideLabel": true } ', NULL, 1, 'px', NULL, NULL), --actual YTD indicator<br>(16032,6783,15,8, NULL, NULL,NULL,1,1,1, 100, N'{ "hideLabel": true, "customCssClass": "text-italic text-gray-out" } ', NULL, 1, 'px', NULL, NULL) --actual YTD breakdown | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| UPDATE CoreLogframeIndicators SET IsCumulativeInput = 1 | Run the following script to set existing indicators to cumulative if desired: | During Upgrade | Client Dev | Run the following script to set existing indicators to cumulative if desired:<br>UPDATE CoreLogframeIndicators SET IsCumulativeInput = 1<br>UPDATE CoreLogframeGlobalIndicators SET IsCumulativeInput = 1 | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Import awesome font icons in app module: | During Upgrade | Client Dev | Import awesome font icons in app module:<br>faPercent (free-solid-svg-icons) | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Logframe indicator cumulative/non-cumulative | During Upgrade | Client Dev | Logframe indicator cumulative/non-cumulative<br>The setting for cumulative/non-cumulative values is now per indicator. If no config is added, it defaults to non-cumulative for existing and new indicators. | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

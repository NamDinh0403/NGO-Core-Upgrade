# NGO Core 2.16.0 Release Notes

- **Version:** 2.16.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **4** | Conditional Actions **0** | New Features **1** | Bug Fixes **1** | Needs Review **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Update email template for send document | During Upgrade | Deployer | Update email template for send document<br>DataFixes/20210821_UpdateEmailTemplateForDocument.sql | - |
| My Recent documents pop up - File paths spill out (should be wrapped) | After Deploy | Deployer | My Recent documents pop up - File paths spill out (should be wrapped)<br>[After deployment]<br>DataFixes/ 20210803_UpdateFieldCharacteristicsForDocumentsBox.sql | - |
| CoreNews: Update value of old columns to new columns | After Deploy | Deployer | CoreNews: Update value of old columns to new columns<br>[After deployment]<br>DataFixes\20210705_UpdateColumnDataOfNews.sql | - |
| Logframe : | During Upgrade | Deployer | Logframe :<br>Change name of breakdown option: DataFixes\20210726_UpdateResourceStrings.sql | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | IdeaMemberFields in CoreConfigurations Update JSON format from } ] to } ]} ] | During Upgrade | Client Dev | IdeaMemberFields in CoreConfigurations Update JSON format from [{ "entityId": number, "fields":string[]} ] to [{ "entityId": number, "roles":[{ "id": number, "fields":string[]} ]} ] | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | CoreNews: Update value of old columns to new columns | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. CoreNews: Update value of old columns to new columns | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | Admin UI - Metadata - Update error message confirm dialog when deleting any options. | No deterministic git-diff evidence was supplied for this note. | None stated in the release source. | - |

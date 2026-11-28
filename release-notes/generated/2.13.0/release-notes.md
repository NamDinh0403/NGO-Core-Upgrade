# NGO Core 2.13.0 Release Notes

- **Version:** 2.13.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **10** | Conditional Actions **0** | New Features **5** | Bug Fixes **2** | Needs Review **10**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Run SQL script: Datafixes\20210408_Validation_VisibilityDependency.sql | After Deploy | Deployer | Validation visibility dependency migration<br>[After deployment] Run SQL script: Datafixes\20210408_Validation_VisibilityDependency.sql | - |
| Run DataFixes\ 20210415_Update_fundingPlanCurrentVersion .sql | After Deploy | Deployer | Fix IsCurrentPublishedVersion for Funding Plan Version<br>[After deployment] Run DataFixes\ 20210415_Update_fundingPlanCurrentVersion .sql | [Card](https://trello.com/c/JO7uhLzm) |
| : Run DataFixes\20210419_Budget_Multi_Currency.sql | Before Deploy | Deployer | [Before deployment / version upgrade]: Run DataFixes\20210419_Budget_Multi_Currency.sql | - |
| Update Type value for documentLinks field in Log and Logs, change it from 3(Single choice) to 4 (Multiple choice) | After Deploy | Deployer | Update Type value for documentLinks field in Log and Logs, change it from 3(Single choice) to 4 (Multiple choice)<br>[After deployment]<br>DataFixes\ 20210428_CoreFieldInstances_UpdateTypeForDocumentLinkField_LogsAndLog2.sql | - |
| Run DataFixes\20210429_AddContactNameFieldAsFirstLastName.sql | During Upgrade | Deployer | - Run DataFixes\20210429_AddContactNameFieldAsFirstLastName.sql | - |
| CoreFieldInstances: Fix RelId from 13 to 14 for Stakeholders2 in Log | After Deploy | Deployer | CoreFieldInstances: Fix RelId from 13 to 14 for Stakeholders2 in Log<br>[After deployment]<br>DataFixes\20210429_UpdateRelIdForStakeholders2InLog.sql | - |
| Search label consistency: remove all old search label to updates the new text | Before Deploy | Deployer | Search label consistency: remove all old search label to updates the new text<br>[Before deployment]<br>DataFixes\20210429_MakeSearchLabelConsistent.sql | - |
| Add "Download secure file" as first step under "Deploy sharepoint" | During Upgrade | Client Dev | - Add "Download secure file" as first step under "Deploy sharepoint" | - |
| Add another step under "Download secure file", task should be "PowerShell" | During Upgrade | Client Dev | - Add another step under "Download secure file", task should be "PowerShell" | - |
| Review tagged release instruction | After Deploy | Deployer | [After deployment]<br>To run deployments the release pipeline needs to be updated: | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Extend number of digits in decimal part | During Upgrade | Client Dev | - Extend number of digits in decimal part | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Multi-currency in admin allocation/private funds: ensure that | During Upgrade | Client Dev | - Multi-currency in admin allocation/private funds: ensure that | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Edit / view form: Amount field is replaced by AmountCur field | During Upgrade | Client Dev | - Edit / view form: Amount field is replaced by AmountCur field | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Private fund allocation list: ensure there is a currency filter in list settings, and AmountOutCur field in list fields | During Upgrade | Client Dev | - Private fund allocation list: ensure there is a currency filter in list settings, and AmountOutCur field in list fields | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Regenerate browse view | During Upgrade | Client Dev | - Regenerate browse view | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Deployment update | During Upgrade | Client Dev | Deployment update | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Select the secure file "NGOOnline.pfx" | During Upgrade | Client Dev | - Select the secure file "NGOOnline.pfx" | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Under Output Variables set the Reference name to "appCertificate" | During Upgrade | Client Dev | - Under Output Variables set the Reference name to "appCertificate" | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Under Type select Inline and pase this script: | During Upgrade | Client Dev | - Under Type select Inline and pase this script: | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | Finance / Budget / Support multi currency: | During Upgrade | Client Dev | Finance / Budget / Support multi currency: | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | Edit / view form: Currency and Exchange rate fields are added to field locations (compared with Core) of each tab function (admin allocation: 62; private fund allocation: 19) | No deterministic git-diff evidence was supplied for this note. | No explicit client action was stated in the release source. | - |
| Shared / Cross-track | Contact: add format to combine title + first name + last name for field in browse list | No deterministic git-diff evidence was supplied for this note. | No explicit client action was stated in the release source. | - |
| Database / Deployment | Search label consistency: remove all old search label to updates the new text | No deterministic git-diff evidence was supplied for this note. | Action applies during the upgrade. Search label consistency: remove all old search label to updates the new text | - |
| System.Security.Cryptography.X509Certificates.X509KeyStorageFlags / System.Security.Cryptography.X509Certificates.OpenFlags | Write-Host "Start adding the PFX file to the certificate store." ￼ $pfxpath = '$(appCertificate.secureFilePath)' ￼ $password = '<FROM_SECRET_PROVIDER>' ￼ Add-Type -AssemblyName System.Security ￼ $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2 ￼ $cert.Import($pfxpath, $password, [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]"PersistKeySet") ￼ $store = new-object system.security.cryptography.X509Certificates.X509Store -argumentlist "MY", CurrentUser ￼ $store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]"ReadWrite") ￼ $store.Add($cert) ￼ $store.Close() | No deterministic git-diff evidence was supplied for this note. | No explicit client action was stated in the release source. | - |
| Shared / Cross-track | 6. Add two new Variables to the release, AppCerticatePassword, value: ask Niklas | No deterministic git-diff evidence was supplied for this note. | No explicit client action was stated in the release source. | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | Fix IsCurrentPublishedVersion for Funding Plan Version | No deterministic git-diff evidence was supplied for this note. | Run DataFixes\ 20210415_Update_fundingPlanCurrentVersion .sql | [Card](https://trello.com/c/JO7uhLzm) |
| Database / Deployment | CoreFieldInstances: Fix RelId from 13 to 14 for Stakeholders2 in Log | No deterministic git-diff evidence was supplied for this note. | CoreFieldInstances: Fix RelId from 13 to 14 for Stakeholders2 in Log | - |

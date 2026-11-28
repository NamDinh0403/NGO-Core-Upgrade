# NGO Core 7.2.0 Release Notes

- **Version:** 7.2.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/7.2.0.json)
- **Quick Summary:** Mandatory Actions **5** | Conditional Actions **0** | New Features **1** | Bug Fixes **0**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Update Documents/ PdfTemplates/ExpenditureTaskTemplate.docx follow client requirement | During Upgrade | Client Dev | - Overrides LandscapeFunctionIds in ExportPdfService to support landscape by tabid<br>Update Documents/ PdfTemplates/ExpenditureTaskTemplate.docx follow client requirement | - |
| Run SharePoint Deployment | During Upgrade | Client Dev | - Run SharePoint Deployment | - |
| P/S: this SQL After-script will run automatically if PdfTemplates on CoreTaskApprovalSettings is null or empty. | During Upgrade | Deployer | - P/S: this SQL After-script will run automatically if PdfTemplates on CoreTaskApprovalSettings is null or empty.<br>20250801_SetupPartnerExpenditureApprovalScreenshotTemplate.sql | - |
| overview box | During Upgrade | Client Dev | [M][Funding & Summary] [Income planned vs received] overview box<br>[For upgrade person] Find the text 'DateAndValueFields' in your custom SQL scripts, if any, please update it to the new format (see new config format in the description of card) | [Card](https://trello.com/c/ngBU5eEx/4967-mfunding-summary-income-planned-vs-received-overview-box) |
| Ensure in API permission of entra app registrations has permission Mail.Read (type: Application) and Granted admin consent | During Upgrade | Deployer | [M] Outlook add-in stops working due to recent MS changes on Current sprint - Core \| Trello<br>[For deployment person] Ensure in API permission of entra app registrations has permission Mail.Read (type: Application) and Granted admin consent | [Card](https://trello.com/c/IWyi7qRy/5035-m-outlook-add-in-stops-working-due-to-recent-ms-changes) |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| None identified. | - | - | - | - | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Database / Deployment | [M] Outlook add-in stops working due to recent MS changes on Current sprint - Core \| Trello | No deterministic note-to-file match. Release diff covers 190 files (backend: 71, frontend: 87, shared: 32); representative changes: M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/AdminWebJobMonitoringController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/PageImportController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/PartnerExpenditureReportingImportController.cs`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/UserController.cs`, M `ngo-api-core/NGO/NGO.Core.Common/Auth/HttpClientSPWebRequestExecutor.cs`, M `ngo-api-core/NGO/NGO.Core.Common/Constants/ErrorException.cs`. | Action applies during the upgrade. Ensure in API permission of entra app registrations has permission Mail.Read (type: Application) and Granted admin consent | [Card](https://trello.com/c/IWyi7qRy/5035-m-outlook-add-in-stops-working-due-to-recent-ms-changes) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

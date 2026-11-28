# NGO Core 9.1.0 Release Notes

- **Version:** 9.1.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html), [Candidate record](ingest/knowledge/candidates/releases/9.1.0.json)
- **Quick Summary:** Mandatory Actions **3** | Conditional Actions **2** | New Features **1** | Bug Fixes **2** | Needs Review **4**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Update/Add nuget package " Microsoft.EntityFrameworkCore.Design" version 10.0.7 for NGO.API | During Upgrade | Client Dev | Update/Add nuget package " Microsoft.EntityFrameworkCore.Design" version 10.0.7 for NGO.API<br>Update/Add nuget package " Microsoft.EntityFrameworkCore.Tools" version 10.0.7 for NGO.API<br>[For upgrade person] If your computer is installed both EF Core and EF 6, use "EntityFrameworkCore\Add-migration" to make sure it will using EF Core instead of EF 6 by default | - |
| Add to IndicatorStructureFields if it belongs to Indicator | During Upgrade | Client Dev | - Add to IndicatorStructureFields if it belongs to Indicator | - |
| Add to ObjectiveStructureFields if it belongs to Objective | During Upgrade | Client Dev | - Add to ObjectiveStructureFields if it belongs to Objective | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| If client is using another icon (means current characteristic " iconWhenHaveValue" is null or empty | Datafix 20260527_UpdateIconForNewTextAreaControl.sql is setting characteristic " iconWhenHaveValue" and " iconWhenHaveNoValue" = "pen" by default . If client is using another icon | During Upgrade | Deployer | Datafix 20260527_UpdateIconForNewTextAreaControl.sql is setting characteristic " iconWhenHaveValue" and " iconWhenHaveNoValue" = "pen" by default . If client is using another icon (means current characteristic " iconWhenHaveValue" is null or empty, " iconWhenHaveNoValue" is null or empty but " fileIcon" have value), dev needs to manually update " iconWhenHaveValue" and " iconWhenHaveNoValue" = value of " iconWhenHaveValue" | [Card](https://trello.com/c/2WTobq0v/5509-4s-logframe-report-on-indicators-text-previous-period-showing-pen-icon) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | If you want the field is multiple, change type of field instances in code | During Upgrade | Client Dev | If you want the field is multiple, change type of field instances in code | [Card](https://trello.com/c/HRVFghna/5454-s-add-new-relatedentity-fields-to-log-log2-log3) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | ﷟HYPERLINK " Migration tool for saved analyse queries on Current sprint - Core \| Trello Migration tool for saved analyse queries on Current sprint - Core \| Trello | During Upgrade | Client Dev | ﷟HYPERLINK " Migration tool for saved analyse queries on Current sprint - Core \| Trello Migration tool for saved analyse queries on Current sprint - Core \| Trello<br>If using Logframe2: Run NGO.Core.Tools.Logframe2SavedQueryMigration to verify and migrate saved analysis queries from Logframe1. Please start with review mode , resolve all warnings (search for " See warnings for details" in console or log file) , then run update mode . | [Card](https://trello.com/c/3TaYSPQr/5519-slogframe2-migration-tool-for-saved-analyse-queries) |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | " Unable to determine if field …": Check CoreAnalyseLogframeObjectiveView (Core/Client if available) to determine whether the field belongs to the Objective or Indicator table | During Upgrade | Client Dev | - " Unable to determine if field …": Check CoreAnalyseLogframeObjectiveView (Core/Client if available) to determine whether the field belongs to the Objective or Indicator table | - |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | If any structure fields were renamed in Logframe2, remap them in IndicatorStructureFieldMappings or ObjectiveStructureFieldMappings | During Upgrade | Client Dev | - If any structure fields were renamed in Logframe2, remap them in IndicatorStructureFieldMappings or ObjectiveStructureFieldMappings | - |
| optional approval subfolder for "Mark as Paid" or "Cancel" actions | Add new system config SPSignedOffAdditionalDocumentsFolderName to control the optional approval subfolder for "Mark as Paid" or "Cancel" actions. | After Deploy | Deployer | [8][M] Files uploaded using "mark as paid" or "mark as cancelled" should be copied to 99 approval on Current sprint - Core \| Trello<br>Add new system config SPSignedOffAdditionalDocumentsFolderName to control the optional approval subfolder for "Mark as Paid" or "Cancel" actions.<br>Default: "Additional documents" . Can be changed or set empty per client needs. Please ask client's PM/ AM about this before running tool below<br>[After Deployment] Check if the client uses "Mark as Paid" or "Cancel" on payments.<br>If yes, update appsettings.json and run:<br>NGO.Core.Tools.UpdatePaymentDocumentLinks | [Card](https://trello.com/c/r6gg5amB/5499-8m-files-uploaded-using-mark-as-paid-or-mark-as-cancelled-should-be-copied-to-99-approval) |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| Backend | Datafix 20260527_UpdateIconForNewTextAreaControl.sql is setting characteristic " iconWhenHaveValue" and " iconWhenHaveNoValue" = "pen" by default . If client is using another icon (means current characteristic " iconWhenHaveValue" is null or empty, " iconWhenHaveNoValue" is null or empty but " fileIcon" have value), dev needs to manually update " iconWhenHaveValue" and " iconWhenHaveNoValue" = value of " iconWhenHaveValue" | Matched key changes: A `ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20260527_UpdateIconForNewTextAreaControl.sql` | If client is using another icon (means current characteristic " iconWhenHaveValue" is null or empty Datafix 20260527_UpdateIconForNewTextAreaControl.sql is setting characteristic " iconWhenHaveValue" and " iconWhenHaveNoValue" = "pen" by default . If client is using another icon | [Card](https://trello.com/c/2WTobq0v/5509-4s-logframe-report-on-indicators-text-previous-period-showing-pen-icon) |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| Shared / Cross-track | "Missing analyse table relation for …": Add the corresponding analyse table relation for Logframe2 | No deterministic note-to-file match. Release diff covers 193 files (backend: 92, frontend: 69, shared: 32); representative changes: A `.github/copilot-instructions.md`, A `.github/instructions/backend.instructions.md`, A `.github/instructions/dw.instructions.md`, A `.github/instructions/frontend.instructions.md`, D `ngo-api-core/NGO/.github/copilot-instructions.md`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/BudgetController.cs`. | None stated in the release source. | - |
| Shared / Cross-track | " Missing analyse column for field …": Identify the new field in the relevant tab function and add it as new analyse column | No deterministic note-to-file match. Release diff covers 193 files (backend: 92, frontend: 69, shared: 32); representative changes: A `.github/copilot-instructions.md`, A `.github/instructions/backend.instructions.md`, A `.github/instructions/dw.instructions.md`, A `.github/instructions/frontend.instructions.md`, D `ngo-api-core/NGO/.github/copilot-instructions.md`, M `ngo-api-core/NGO/NGO.Core.API/BaseControllers/BudgetController.cs`. | None stated in the release source. | - |

# NGO Core 2.20.0 Release Notes

- **Version:** 2.20.0
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **7** | Conditional Actions **0** | New Features **0** | Bug Fixes **0** | Needs Review **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Remove itemTask.Checklist | Before Deploy | Deployer | [Before Deployment] [Analyse] Remove itemTask.Checklist<br>20211122_Analyse_Remove_Column_Task_Checklist.sql | - |
| CoreResourceStrings: Admin portal, Exchange Rates - Rename "Exchange rate" to "Exchange rates" | During Upgrade | Deployer | CoreResourceStrings: Admin portal, Exchange Rates - Rename "Exchange rate" to "Exchange rates"<br>DataFixes/20211025_UpdateReourceStrings.sql | - |
| Remove OrgUnit/Program Finance | During Upgrade | Client Dev | Remove OrgUnit/Program Finance<br>Remove OrgUnit/Program Finance allocation list + form + view form + allocations list, controller, service | - |
| Update ShowFundingSourceInAllocation config from boolean to GenericItems with parentId: entityId, id: tabFunctionId, Active: show/hide funding source. If parentId is not set, the c | During Upgrade | Client Dev | Update ShowFundingSourceInAllocation config from boolean to GenericItems with parentId: entityId, id: tabFunctionId, Active: show/hide funding source. If parentId is not set, the configuration will apply to tab function of all entities. | - |
| Run DataFixes\20211116_FundingAllocationUpdates.sql before Deployment | Before Deploy | Deployer | Run DataFixes\20211116_FundingAllocationUpdates.sql before Deployment | - |
| Run DataFixes\20211124_EntityTab_Remove_Function_Announcement_EntityStatus.sql | During Upgrade | Deployer | Summary page Standard box - Entity Overall Status<br>Run DataFixes\20211124_EntityTab_Remove_Function_Announcement_EntityStatus.sql | - |
| Remove attachments from any email templates | During Upgrade | Deployer | Remove attachments from any email templates<br>Run script "UPDATE [dbo].[CoreEmailTemplates] SET Attachments = NULL" | - |

### Table 2: Conditional Actions (Client-Specific - Run ONLY if Condition Matches)

> Rows marked **Needs Review** are intentionally retained, but must not be treated as mandatory or skippable until an owner confirms applicability.

| Applicability Condition (When to Run) | Tool / Action | Timing | Owner | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- | --- |
| ⚠ Needs Review - Confirm whether every client or only matching clients must run this item. | AdminUI / Entity Configuration / Only show Folder Structure tab | During Upgrade | Client Dev | AdminUI / Entity Configuration / Only show Folder Structure tab<br>If in client projects, admin can see all tabs (General, Fields, Overview boxes, Browse, and Folder Structure), please add Permission Id (1804, 1805, 1806, 1807, and 1808) to admin role | - |

## Section B - Release Tracking & Lookup (Features & Bug Fixes)

### Table 3: New Features & Enhancements

| Module / Scope | Feature / Change | Technical Summary (from Git Diff) | Client Impact | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

### Table 4: Bug Fixes

| Module / Scope | Bug Description | Root Cause / Key Files Changed (from Git Diff) | Extra Client Action? | Card / PR |
| --- | --- | --- | --- | --- |
| None identified. | - | - | - | - |

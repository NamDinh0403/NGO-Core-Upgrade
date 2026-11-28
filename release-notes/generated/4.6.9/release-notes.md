# NGO Core 4.6.9 Release Notes

- **Version:** 4.6.9
- **Status:** RELEASED
- **Release Date:** Not specified
- **Source Refs:** [OneNote export](docs/onenote-core-release-notes.html)
- **Quick Summary:** Mandatory Actions **1** | Conditional Actions **0** | New Features **0** | Bug Fixes **1**

## Section A - Upgrade & Deployment Guide (Actionable)

### Table 1: Mandatory Actions (Default - Run for ALL Clients)

| Tool / Action | Timing (Before Deploy / During Upgrade / After Deploy) | Owner (Client Dev / Deployer) | Instructions & Notes | Card / PR |
| --- | --- | --- | --- | --- |
| Run the script in this card when do the upgrade: 20231006_1200_MigrateFundingEntityToFundingAllocationTransaction.sql | Before Deploy | Deployer | [Allocation] Funding Source should not be added to/gotten from the CoreFunctionalItemEntityRelations (<br>[Before deployment] Run the script in this card when do the upgrade: 20231006_1200_MigrateFundingEntityToFundingAllocationTransaction.sql | [Card](https://trello.com/c/KXErJ2Jc) |

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
| Allocation | [Allocation] Funding Source should not be added to/gotten from the CoreFunctionalItemEntityRelations ( | No deterministic git-diff evidence was supplied for this note. | Run the script in this card when do the upgrade: 20231006_1200_MigrateFundingEntityToFundingAllocationTransaction.sql | [Card](https://trello.com/c/KXErJ2Jc) |

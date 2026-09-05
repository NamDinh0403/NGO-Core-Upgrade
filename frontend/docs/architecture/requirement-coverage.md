# Architecture - Requirement coverage and missing-step detection

Coverage turns "we resolved a release range" into "every applicable requirement has a
disposition, a client mapping, an owner, and a verification" - and blocks planning and
completion until that is true.

## Inputs

- Resolved release requirements (`tools/lib/release-range.js`).
- Applicability disposition per requirement (`tools/lib/applicability.js`), evaluated
  against structured client evidence.
- Client mapping per requirement (`tools/lib/requirement-map.js`), resolving semantic roles
  to the client's actual files.
- Plan membership, changed files, verification results, and assigned owners.

## Per-requirement status

`tools/lib/requirement-coverage.js` derives exactly one status per requirement:

| Status | Meaning |
| --- | --- |
| `NOT_APPLICABLE_WITH_EVIDENCE` | applicability evaluated false, with evidence |
| `DECISION_PENDING` | needs a PM/developer decision (e.g. `IF_PM_APPROVES`) |
| `RESEARCH_REQUIRED` | applicability or mapping unresolved |
| `PLANNED` | applicable, mapped, and in the plan |
| `IMPLEMENTED` | changed but not yet verified |
| `VERIFIED` | change verified by the audit |
| `MANUAL_ACTION_PENDING` | manual/deployment action with an assigned owner |
| `FAILED` / `BLOCKED` | failed, or applicable but unmapped/unplanned |

## Gates

- **Planning gate** (`planReady`): rejects a plan while any applicable, automatable
  requirement is `BLOCKED` (unmapped or absent from the plan) or any manual item lacks an
  owner. A release note that says "edit app.module.ts" is not enough - the requirement must
  map to the client's real point and be planned.
- **Completion gate** (`completionReady`): a run cannot complete while any applicable
  requirement is not `VERIFIED`, `NOT_APPLICABLE_WITH_EVIDENCE`, or a
  `MANUAL_ACTION_PENDING` item **with** a full handover owner.

## Run artifacts

`tools/lib/planning-release.js` writes, under `runs/<client>/<run-id>/`:

- `release-range.yaml` - selected versions, dropped duplicates/superseded, reusable migrations
- `applicable-requirements.yaml` - applicable / not-applicable / ambiguous with evidence
- `requirement-coverage.yaml` - per-requirement status (`schemas/requirement-coverage.schema.json`)
- `missing-steps.yaml` - everything blocking planning/completion, with reasons
- `deployment-checklist.yaml` - owner/timing/instructions/risk/verification per manual item
- `appsettings-inventory.json`, `appsettings-coverage.yaml`, `missing-appsettings.yaml`,
  `azure-app-settings-checklist.yaml`

## Manual deployment items

A manual item may remain pending only when it carries an owner, action, timing,
instructions, risk, and verification (`deploymentChecklist`). Otherwise it blocks
completion. See [../operations/review-missing-steps.md](../operations/review-missing-steps.md).

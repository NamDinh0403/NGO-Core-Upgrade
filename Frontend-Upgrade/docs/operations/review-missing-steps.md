# Operations - Reviewing missing steps

The missing-step detector guarantees no applicable release requirement is silently dropped.
After `start`, review these run artifacts before executing or completing.

## Where to look

Under `runs/<client>/<run-id>/`:

- `applicable-requirements.yaml` - what applies (applicable / not-applicable / ambiguous),
  each with evidence.
- `requirement-coverage.yaml` - one status per requirement.
- `missing-steps.yaml` - everything blocking planning or completion, with a reason.
- `deployment-checklist.yaml` - manual/deployment items with owner, timing, instructions,
  risk, and verification.
- `missing-appsettings.yaml` + `azure-app-settings-checklist.yaml` - backend config gaps.

## Reasons you will see

| Reason | What to do |
| --- | --- |
| applicable but no client implementation point mapped | provide/confirm the client file; resolve the mapping |
| applicable and mapped but absent from the plan | add it to the plan (planning will not be READY otherwise) |
| applicability or mapping unresolved; research required | research the client; classify the requirement |
| requires a developer/PM decision | record the decision (e.g. optional/AI/feature-flagged items) |
| manual action without an assigned owner | assign an owner (deployment / pipeline / PM) |

## Gates

- The plan will not become **READY** while any applicable automatable requirement is
  `BLOCKED` or any manual item lacks an owner.
- The run will not become **COMPLETE** while any applicable requirement is unmapped,
  unplanned, unimplemented, unverified, or a manual item without an owner.

## Manual deployment items

Before-deployment and after-deployment actions (queues, Azure variables, SQL/data fixes,
SharePoint deployment, tool runs such as review-before-update migrations) are expected to
remain **manual** and are carried into the deployment checklist with an owner. They do not
block completion once they have a full handover entry - but destructive SQL always stays
manual unless an approved safe-execution policy explicitly permits it.

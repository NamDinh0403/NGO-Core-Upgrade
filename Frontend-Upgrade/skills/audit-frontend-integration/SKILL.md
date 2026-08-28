---
name: audit-frontend-integration
description: Mandatory blocking audit that the client integrates the target Core correctly.
metadata:
  id: audit-frontend-integration
  version: 1.0.0
  status: active
  risk: medium
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose

Independently verify the upgraded client correctly integrates the target Core.
This audit is mandatory and blocking: the run cannot complete successfully if the
audit fails.

# Trigger conditions

Execution reported success or partial success and a production build has been
attempted.

# Exclusions

Read-only. The audit never mutates the client or Core.

# Preconditions

Plan applied; client dependencies installed; production build attempted.

# Required capabilities

`read-client-repository`, `read-core-repository`, `run-shell-command`,
`validate-json-schema`.

# Inputs

See `schemas/input.schema.json`.

# Procedure

Verify, with evidence, that: exact target package versions are installed and
resolved; no disallowed ranges/wildcards were introduced; the production build
succeeds; every planned change was applied to the exact files; every applicable
Core requirement is satisfied at its authoritative point; environment/runtime
config keys required by the target exist in the authoritative source (and were not
sprayed across candidates); required modules/providers/initializers are registered
exactly once; the effective route graph is valid and client overrides preserved;
tsconfig field-level changes are correct and no whole file was replaced and
`skipLibCheck` was not used as a workaround; assets/styles/scripts/manifests are
present; the Core repository is unchanged (fingerprint match); and no manual
snapshot/second-session artifacts were required.

Fail the audit (`BLOCKED_*`) when any mandatory check fails - for example a
required runtime config key is missing, the production build fails, or Core was
modified.

# Evidence requirements

Every audit check records pass/fail with the exact evidence (files, versions,
build result, fingerprint comparison).

# Uncertainty behavior

An audit check that cannot be evaluated is treated as a failure requiring
developer attention, never silently passed.

# Completion criteria

`frontend-audit-report.yaml` written with an overall PASSED or BLOCKED result.

# Retry behavior

Re-runnable after fixes.

# Escalation behavior

Any BLOCKED result routes to `developer-escalation`.

# Outputs

See `schemas/output.schema.json`.

# Allowed next skills

`learn-from-frontend-run`, `developer-escalation`.

# Prohibited behavior

No mutation. No skipped mandatory checks. No pass on unverifiable checks.

# Evaluations

See `evals/`. Covers audit-blocks-missing-config, production-build-required, and
no-manual-snapshot.

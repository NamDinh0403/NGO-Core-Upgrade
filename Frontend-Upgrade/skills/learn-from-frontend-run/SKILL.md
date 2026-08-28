---
name: learn-from-frontend-run
description: Capture redacted, candidate-only learnings from a completed run.
metadata:
  id: learn-from-frontend-run
  version: 1.0.0
  status: active
  risk: low
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose

Capture reusable knowledge from a completed run as **candidates only**. Nothing is
promoted to approved knowledge automatically.

# Trigger conditions

The audit produced a terminal result (PASSED or BLOCKED) and the run is closing.

# Exclusions

Read-only against both repositories. Never writes approved memory. Never records
client-identifying or secret material.

# Preconditions

A completed or escalated run state exists.

# Required capabilities

`read-run-state`, `redact-sensitive-data`.

# Inputs

See `schemas/input.schema.json`.

# Procedure

1. Summarize the run: versions, workspace type, dispositions, uncertainties,
   fixes, and audit outcome.
2. Extract candidate patterns (error patterns, fix patterns, version-knowledge)
   using the shared schemas.
3. Redact all client-identifying data, absolute paths, tokens, and secrets using
   the core redactor.
4. Write candidates to the run's learning artifacts and the candidates memory
   area only.

# Evidence requirements

Every candidate references the run evidence it was derived from.

# Uncertainty behavior

Low-confidence candidates are marked as such and left for human review.

# Completion criteria

`learning-candidates.yaml` written; redaction verified; no approved memory
touched.

# Retry behavior

Idempotent.

# Escalation behavior

Not applicable; failures are recorded and the run still closes.

# Outputs

See `schemas/output.schema.json`.

# Allowed next skills

`developer-escalation`.

# Prohibited behavior

No auto-approval. No unredacted client data. No secrets.

# Evaluations

See `evals/`. Covers learning-candidates-only and redaction.

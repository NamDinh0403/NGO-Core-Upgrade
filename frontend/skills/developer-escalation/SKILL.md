---
name: developer-escalation
description: Hand off to a developer with an exact, actionable next step.
metadata:
  id: developer-escalation
  version: 1.0.0
  status: active
  risk: low
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose

Produce a clear, actionable developer handoff whenever the agent is blocked or
uncertain. Reachable from every other skill.

# Trigger conditions

Any blocking status, unresolved HIGH/CRITICAL uncertainty, exhausted retry budget,
detected Core modification, or an invalid request/repository.

# Exclusions

Read-only. Never mutates repositories. Never fabricates a resolution.

# Preconditions

Run state exists (even a minimal doctor-only state).

# Required capabilities

`read-run-state`, `write-escalation`.

# Inputs

See `schemas/input.schema.json`.

# Procedure

1. Summarize what was attempted and the exact blocking reason.
2. List the relevant evidence (files, versions, fingerprints, failure output).
3. State the single exact next action the developer must take.
4. Preserve durable run state so the developer can `resume` after acting.
5. Redact client-identifying data and secrets.

# Evidence requirements

The escalation cites the exact run artifacts and evidence behind the block.

# Uncertainty behavior

Uncertainty is stated explicitly with its category and impact, never hidden.

# Completion criteria

`developer-escalation.md` written with a single exact next action and a resume
instruction.

# Retry behavior

Idempotent.

# Escalation behavior

Terminal for the run until the developer acts and resumes.

# Outputs

See `schemas/output.schema.json`.

# Allowed next skills

None (terminal handoff). The developer resumes the prior skill after acting.

# Prohibited behavior

No mutation. No fabricated fixes. No vague "investigate further" guidance.

# Evaluations

See `evals/`. Covers exact-next-action and resume-after-escalation.

# ADR 0002 — Explicit state machine and durable, isolated runs

- Status: accepted
- Date: 2026-08-13

## Context
Progress was tracked in a single `.upgrade-state.json` and, implicitly, in chat
memory. Stop conditions were limited to `COMPLETED`/`BLOCKED` with no
differentiation, and there was no checkpoint history or per-run isolation.

## Decision
Model the upgrade as an explicit state machine
(`workflows/core-upgrade/workflow.yaml`) with a differentiated per-step status
enum. Give every run an isolated directory `runs/<client>/<run-id>/` with a
`state.json` snapshot, append-only JSONL event streams, and numbered checkpoints.
Encode progression/resume/idempotency/escalation/doc-gate as pure logic in
`tools/orchestration/state-machine.js` so it is testable.

## Consequences
- No ambiguous or silent stop: any blocked/failed status routes to `HANDOVER` with a resume instruction.
- Resume is deterministic and never repeats a completed mutating action (idempotency keys).
- Behaviour is regression-tested (`tools/run-evals.js`).

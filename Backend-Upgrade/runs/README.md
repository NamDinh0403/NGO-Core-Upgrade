# Runs

Each execution gets an isolated, client-scoped directory:

```
runs/<sanitized-client-id>/<run-id>/
├── request.json            # schemas/run-request.schema.json
├── inventory.json
├── plan.json
├── state.json              # authoritative snapshot; schemas/run-state.schema.json
├── checkpoints/            # numbered checkpoints of state.json
├── observations.jsonl      # append-only; schemas/workflow-event.schema.json
├── actions.jsonl           # append-only (each mutating action has idempotencyKey)
├── failures.jsonl          # append-only
├── decisions.jsonl         # append-only (developer decisions)
├── changed-files.json
├── test-results.json
├── documentation-status.json
└── final-report.md
```

Run directories hold raw client evidence and are governed by
`config/retention-policy.yaml`. They must not be copied into global memory
unredacted. A worked example lives under `evals/simulated-upgrades/`.

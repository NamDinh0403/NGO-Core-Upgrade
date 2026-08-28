# evals/

Regression scenarios and scoring for the Core upgrade workflow. All fixtures are
**synthetic and clearly labelled** — no real client data is used here.

- `regression-cases/` — declarative scenario definitions exercised by
  `node tools/run-evals.js`.
- `simulated-upgrades/` — synthetic run directories (e.g. `synthetic-acme/`)
  used for resume / completion / documentation-gate scenarios.
- `scoring/` — evaluation metrics and a scorecard template.

Run:
```
node tools/run-evals.js
```
The silent-stop rate is expected to be exactly 0 across these scenarios.

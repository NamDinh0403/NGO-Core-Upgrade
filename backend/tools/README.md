# tools/

Support tooling for the Core upgrade workflow. The workflow itself is executed by
an LLM agent following `workflows/`, but these tools make behaviour deterministic
and verifiable.

- `orchestration/` — `state-machine.js`: pure state-machine logic (transitions,
  resume, idempotency, escalation, documentation gate). The authority for progression.
- `bootstrap/` — TOOL_BOOTSTRAP: environment/tool detection, policy-driven install,
  smoke tests, manifest generation (`lib/`, plus `check-tools`, `install-tools`,
  `validate-tools`, `generate-tool-manifest`, and `tests/bootstrap.test.js`).
- `wrappers/` — capability wrappers (`nuget`, `dotnet`, `api-compat`, `ilspy`, `npm`,
  `typescript`, `angular`, `repository-search`). Resolve the executable from the
  manifest, refuse client mutation, redact secrets, and return structured JSON.
- `upgrade-agent.js` (+ `.ps1` / POSIX shim) — CLI: `tools bootstrap|check|install-missing|validate|manifest|doctor`.
- `build/` — build/restore invocation contract (`dotnet restore --force`, `dotnet build --no-restore`).
- `test/` — test + EF-migration invocation contract.
- `repository/` — repository helpers (e.g. `Fix-Mojibake.ps1` lives in `../tools` legacy path; encoding + lock-file helpers).
- `documentation/` — documentation-status contract and report assembly notes.
- `memory/` — episode/candidate creation + isolation verification contract.

Runnable entry points:
- `node tools/upgrade-agent.js tools bootstrap` — detect, install permitted+applicable tools, validate, write manifest.
- `node tools/upgrade-agent.js tools doctor` — diagnose environment (no install, no client modification).
- `node tools/bootstrap/tests/bootstrap.test.js` — 20-scenario tool bootstrap tests.
- `node tools/validate.js` — structural, schema, reference and invariant checks.
- `node tools/run-evals.js` — behavioural regression scenarios.

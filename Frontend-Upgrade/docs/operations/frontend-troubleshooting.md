# Troubleshooting

## Doctor / preflight

**`BLOCKED_INVALID_REQUEST`** - one of the four inputs is missing or malformed. Check
`requestErrors` in the doctor output and supply `--client-path`, `--core-path`,
`--source-version`, and `--target-version` (or `--target-ref`).

**`BLOCKED_INVALID_CLIENT_REPOSITORY`** - `--client-path` is not an Angular/NGO client
(no `package.json`, no `ngo-core` dependency, or no Angular workspace). Point it at the
client repository root.

**`BLOCKED_INVALID_CORE_REPOSITORY`** - `--core-path` is not the NGO Core repository. It
must be the repository whose `package.json` name is `ngo-core`.

**`BLOCKED_VERSION_MISMATCH`** - the client's declared `ngo-core` version does not equal
`--source-version`. Confirm which Core version the client currently integrates and set
`--source-version` to match, or check out the correct client state.

**Contradiction / nested paths** - client and Core must be two distinct directories and
neither may contain the other.

## Core integrity

**`BLOCKED_CORE_MODIFIED`** - a stage detected that Core changed during the run. Core is a
read-only source of truth; restore it to its inspected state and `resume`. If you needed a
different Core state, restart with the correct `--target-version` / `--target-ref` (the
target is read via a disposable worktree, never by switching the Core checkout).

## Planning and mutation gate

**Mutation will not start.** The gate (`tools/lib/engine.js -> mutationGate`) reports the
failing condition(s). Common causes:
- plan not READY -> review/rebuild the plan (`plan`),
- no client checkpoint -> ensure the client is in a clean, checkpoint-able state,
- open HIGH/CRITICAL uncertainty -> resolve or annotate the uncertainty register,
- planning fingerprints no longer match -> the client or Core drifted; re-inspect/replan,
- action not in plan -> only planned actions are applied.

**Vague plan rejected.** Planning requires exact files and evidence; a step that cannot
name its target file/evidence is rejected by design. Resolve the underlying uncertainty.

## Build and integration

**`BLOCKED_BUILD`** (audit) - the production build failed. The reported error is routed to
`investigate-frontend-failure`, which classifies it and applies bounded fixes (max retries
per `config/escalation-policy.yaml`) or triggers replanning. Persistent failure escalates.

**`BLOCKED_INTEGRATION`** (audit) - the build passed but a required config key, provider,
or route is missing at its resolved point, or an installed version is not the exact target.
Check the audit report for the specific unmet requirement.

**Wrong dependency versions.** The agent only ever pins the exact versions Core declares.
If an installed version looks unexpected, confirm it against the target Core `package.json`
- the agent never uses `latest`, wildcards, or ranges.

## Environment

**Node too old** - requires Node 14+. `node -v`.

**Git not found** - install Git and ensure it is on `PATH`; Core inspection and client
checkpoints use it.

**Windows terminal quirks** - the tools are dependency-free and write ASCII only. If a test
run appears to "hang" after printing its summary, it has already completed (exit 0); this is
a terminal idle-detection artifact from a spawned git child, not a failure. Redirecting a
test's output to a file and reading the file avoids it.

## Runs and state

**Where is everything?** Under `runs/<client>/<run-id>/`: `state.json`, decisions/actions
logs, checkpoints, evidence, and artifacts. There are no snapshot/delta files anywhere -
that workflow was removed.

**Resume after any blocker** - see [frontend-resume.md](frontend-resume.md).

## Validation

If something structural seems wrong, run the suite:

```
node tools/validate.js
node tools/repo-layout.test.js
node tools/skills.test.js
node tools/run-evals.js
```

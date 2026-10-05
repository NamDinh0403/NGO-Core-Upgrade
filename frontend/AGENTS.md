# AGENTS.md - NGO Core Upgrade (Front-end)

Concise entry point for any LLM agent running a client front-end upgrade against a
local NGO Core. Keep detail in the linked files; do not inline it here.

## The single-session, dual-repository contract
One process, one run, inspects **both** repositories:
- **Client front-end repository** - the ONLY mutable repository.
- **Local NGO Core repository** - a strictly **read-only** source of truth.
No second session, no manual copying, no snapshot/delta hand-off. The Core working
tree is never modified or switched; the target reference (if different) is read via a
disposable `git worktree` under `runs/<client>/<run-id>/research/core-target/`.

## Authoritative files (in priority order)
1. Current run state - `runs/<client>/<run-id>/state.json` (+ `decisions.jsonl`).
2. Policies - `config/*.yaml` and `skills/registry.yaml`.
3. The local NGO Core repository itself - for any exact dependency version, config key,
   provider, route, or asset requirement, **the target Core wins over any written note**.
4. Canonical knowledge - `knowledge/canonical/` (release requirements, migrations, appsettings, version manifest, patterns).

## Release-knowledge non-negotiables
- **Never load raw release notes at runtime.** Only the applicable, resolved subset of
  canonical requirements enters context. `knowledge/raw/` is import material only.
- **Resolve the release range deterministically**: select `sourceVersion < v <= targetVersion`,
  drop backport duplicates (`duplicateOf`) and superseded records (`supersededBy`), and
  trigger reusable migrations (Angular 10 -> 15) on Angular-major increase.
- **A note that names a client file is a hint, not an instruction.** The requirement mapper
  resolves the client's ACTUAL point (config precedence, module/provider style, router
  composition, tsconfig inheritance).
- **Every applicable requirement must be dispositioned.** Planning is not READY while any
  applicable, automatable requirement is unmapped/unplanned or any manual item lacks an
  owner; a run is not COMPLETE until every applicable requirement is verified,
  not-applicable-with-evidence, or a manual item with a full handover owner.
- **Backend AppSettings are knowledge**: preserve existing client values, represent file key
  and Azure key separately, keep SQL/deployment actions manual with an owner, and **reject
  committed secret values** (use the secret provider).
- **Learning writes candidates only** (`knowledge/candidates/`), redacted, never
  auto-promoted and never cross-client.

## Start a run
```
node tools/frontend-upgrade-agent.js start \
  --client-path <client> --core-path <core> \
  --source-version <src> --target-version <tgt>   # or --target-ref <ref>
```
`start` runs the read-only pipeline through planning. Add `--execute` to continue to
gated mutation. `--request <file.yaml>` supplies all inputs from one request file.

## Pipeline (skills, selected deterministically by tools/lib/engine.js)
`validate-local-repositories -> inventory-client-frontend -> inspect-local-core ->
resolve-target-packages -> derive-release-requirements -> map-core-to-client ->
plan-frontend-upgrade -> execute-frontend-upgrade -> investigate-frontend-failure
(loop) -> audit-frontend-integration -> learn-from-frontend-run`.
`developer-escalation` is reachable from every skill; no skill silently stops.

## Shared Orchestration
An orchestrator seed at `orchestrator/runs/<client>/<runId>/requirements/frontend.yaml`
is additional, unconfirmed read-only evidence, never a replacement for planning.
Keep your own run state and report terminal/blocked status with exact safe-resume
instructions. Do not write the shared run. Use the shared ingestion CLI for
freshness checks; file existence alone does not prove a fresh release.
Disposition seed findings in your own `release-finding-dispositions.yaml` during
normal planning/verification: findings with seed id, VERIFIED or
NOT_APPLICABLE_WITH_EVIDENCE status and concrete evidence. Alternatively, link
sourceCandidateIds in evidenced verified/not-applicable requirement coverage.
This traceability never promotes or blindly applies candidate hints.

## Resume a run
Read `state.json`; continue from `state.json.nextAction`, restoring the most recent
valid checkpoint. Never repeat a mutating action whose idempotency key is already
recorded. Re-verify Core fingerprint and planning fingerprints still match.

## Non-negotiables
- **Only the client repository is written.** Every skill that could touch Core is
  read-only; Core is fingerprinted before/after and must be unchanged (`coreUnchanged`).
- **Exact versions from Core only** - never `latest`, wildcards, or ranges. `ngo-core`
  is never bumped alone; Angular/CLI/TypeScript/RxJS/Zone.js/peers are aligned.
- **Requirements are semantic then mapped** to the client's real implementation point
  (config precedence, provider/module registration, route composition, tsconfig
  inheritance) - never a blind "edit environment.ts".
- **Reference host-app diff is mandatory.** Requirement mapping alone is not enough:
  `inspect-local-core` captures the target Core reference host app (`src/app` module,
  route service, routing module, environment service/files, `main.ts`, `index.html`,
  global styles, polyfills) as a full baseline, and `map-core-to-client` structurally
  diffs it against the client to emit concrete deltas (modules, providers, routes,
  guards, env/runtime keys, icons, HTML/styles). New Core elements the client lacks are
  dispositioned MISSING - never scoped away because "the client did not already use it" -
  while client `-Ext`/override providers, custom modules/routes, and customized config
  values are preserved.
- **Planning is mandatory and read-only.** Mutation passes `engine.mutationGate`:
  READY plan + client rollback checkpoint + recorded Core fingerprint + matching
  planning fingerprints + no unresolved HIGH/CRITICAL uncertainty + action-in-plan.
- **Separate facts from uncertainty:** KNOWN / ASSUMED / UNCERTAIN / CONTRADICTORY /
  NOT_APPLICABLE; KNOWN cites evidence. Maintain the uncertainty register.
- **Audit is a completion gate** - a run cannot complete until the client provably
  integrates the target Core (exact versions installed, production build green,
  required config/providers/routes present, Core unchanged).
- **Documentation is a gate** - required run documentation must be complete.
- **Candidate memory is not approved knowledge** - `learn-from-frontend-run` writes
  candidates only; one client's candidates never enter another client's context.

## Every step ends with exactly one status and an exact next action
Any blocked/failed status routes to `developer-escalation`, which always emits a
`resumeCommand`. Never leave a run appearing active without a `nextAction`.

## Validate
`node tools/validate.js` (structural) and `node tools/run-evals.js` (behavioural);
`node tools/skills.test.js` and `node tools/repo-layout.test.js` complete the suite.

## Details
`skills/README.md`, `docs/architecture/local-core-frontend-upgrade.md`,
`docs/architecture/core-requirement-mapping.md`, `docs/operations/*`.

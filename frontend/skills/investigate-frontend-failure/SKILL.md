---
name: investigate-frontend-failure
description: Classify a build or integration failure and apply a surgical, evidence-based fix within budget.
metadata:
  id: investigate-frontend-failure
  version: 1.1.1
  status: active
  risk: medium
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose

When a client install, build, or integration step fails, classify the failure and
apply a minimal, evidence-based fix within a defined budget. Do not brute-force.

# Trigger conditions

An execution or build-and-fix step reported a retryable failure.

# Exclusions

Read-only against Core. No speculative wide edits. No disabling of type checks or
lint as a shortcut. **No `as any`/`@ts-ignore`/`// eslint-disable` to paper over a
real API change** — read the dependency's new contract in `node_modules/<dep>/**/*.d.ts`
and adapt the calling code's types and calls (e.g. `ngo-core` UploaderDirective:
`UploadFile`->`FileItem`, `startUpload(obj)`->`updateEvent(obj)`+`startUpload()`,
`cancelUpload(file)`/`removeFile(file)` pass the item not an id). `any` is only for
genuinely un-typable dynamic data, and must be flagged. No unbounded retries.

# Preconditions

A failure record with captured output exists in the run state.

# Required capabilities

`read-client-repository`, `read-core-repository`, `run-shell-command`,
`parse-build-output`.

# Inputs

See `schemas/input.schema.json`.

# Procedure

1. Parse the failure output and classify: dependency resolution, peer conflict,
   compiler option, Angular compiler option, missing module/provider, route
   error, environment/config error, asset/style error, TypeScript type error,
   test/build config error, or unknown.
2. Correlate against the plan, the alignment map, and Core evidence.
3. Propose one surgical fix targeting exact files, or determine the failure needs
   replanning or developer input.
4. Apply the fix behind the mutation gate; re-run the failed step.
5. Enforce the retry/attempt budget from `config/quality-gates.yaml`; repeated
   identical failures escalate.

**Two oracles (scope boundary).** The build/compiler is the oracle for *things that
exist* (versions, imports, API signatures, templates) — fix those here. It is
**silent about things that are absent** (un-adopted Core modules/routes/config keys/
icons) and about the runtime behavior of `any`-cast code. A "missing module" or
"missing env key" does not error — it silently omits a feature. Do NOT try to invent
those here; if a whole category of Core integration is missing, route back to
`map-core-to-client` (reference host-app diff) rather than patching symptoms.

# Known failure catalog & safe fixes (learned: Angular 9->15 + ngo-core 5->9)

These are recurring, evidence-backed classifications for this upgrade family. Prefer
these exact fixes; each is minimal and cites a concrete root cause.
- **`Cannot find module '<pkg>'` from Core's fesm/`.d.ts`** -> a `CORE_IMPLICIT_PEER`
  (imported by compiled Core, not declared as a peer; `--legacy-peer-deps` skips it).
  Add it to the client `package.json` and reinstall. Resolve the whole set at once
  (file-upload, popper, date libs, app-insights) from `node_modules/<core>/**/*.d.ts`.
- **`Cannot find module 'webpack'` (or other build-angular dep) after a failed/interrupted install**
  -> inconsistent `node_modules`. Delete `node_modules` + lockfile and clean-install; do
  not incrementally patch a partial tree.
- **`E401 Unable to authenticate` on every feed `.tgz`** -> expired private-feed token,
  NOT a Node/version issue. Refresh credentials (e.g. Azure Artifacts:
  `vsts-npm-auth -R -config .npmrc` via the `.cmd` shim), verify with `npm view <pkg> version`.
- **`NG2003 No suitable injection token`** on a class with an untyped ctor param that
  Core injects via `deps:[TOKEN]` -> set `angularCompilerOptions.strictInjectionParameters:false`
  to match Core (do not over-strict); or add `@Inject(TOKEN)` if no import cycle results.
- **`NG2007 Class is using Angular features but is not decorated`** -> abstract/base class
  using DI/lifecycle without a decorator; add `@Directive()` (Ivy requirement).
- **`error TS2305/TS2724` removed/renamed export** -> read the new symbol from the dep's
  `.d.ts` and rename (e.g. `ChartsModule`->`NgChartsModule`, `ChartDataSets`->`ChartDataset`,
  `@Effect`->`createEffect`, `NgbTabset`->`NgbNav`). A rename must cover EVERY occurrence
  (imports, fields, locals, casts), not just the import -- grep the identifier tree-wide.
- **`error TS2554/TS2345` changed constructor/method signature** in a Core base class the
  client extends -> read the new signature in `node_modules/<core>/**/*.d.ts` and update the
  `super(...)`/call args; inject any newly-required service.
- **`NG8002 Can't bind to '<x>'`** on an element -> removed/renamed directive input
  (e.g. ng2-charts `[chartType]`->`[type]`) or a directive whose module is no longer imported.
- **SCSS build failure on `@import '~pkg/...'`** -> remove the leading `~` (dropped in
  Angular 13+/webpack 5).
- **`Module not found '~/src/app/...'`** path-alias import -> webpack won't resolve the TS
  `paths` alias here; use a relative import.

# Operational safety (learned)

- **Codemods on this codebase:** files are **CRLF** and may have **trailing spaces** after
  `);`. Split on `/\r?\n/`, join with the detected EOL, and match structural lines with
  `line.replace(/\s+$/,'') === target` (never exact equality). **Verify per-file transform
  counts** -- a multi-item file reporting `count=1` means it broke. **`git checkout -- <file>`
  and re-run** the fixed codemod; never hand-patch a half-transformed file. Confirm with `get_errors`.
- **Long build/install commands block the shell and buffer output.** Redirect to an ASCII
  file (`... *>&1 | Out-File -Encoding ascii <log>`) and read the file after completion;
  do not pipe through `Select-Object`/`Where-Object` (it hides prompts and swallows output).
- **A subagent/LLM delta is a lead, not a fact** -- re-diff against the actual current file
  before editing (e.g. an env-key "missing" list that the client already contains).

# Evidence requirements

Every fix cites the failure classification, the exact files changed, and the
evidence linking the fix to the root cause.

# Uncertainty behavior

If the root cause is ambiguous or exceeds budget, stop and route to escalation or
replanning rather than guessing.

# Completion criteria

Failure resolved and the step re-run, or a clear stop/escalation state recorded.

# Retry behavior

Bounded; identical repeated failure triggers `shouldEscalateRepeat`.

# Escalation behavior

Budget exhaustion or ambiguity routes to `developer-escalation`.

# Outputs

See `schemas/output.schema.json`.

# Allowed next skills

`execute-frontend-upgrade`, `audit-frontend-integration`, `developer-escalation`.

# Prohibited behavior

No Core edits. No check-disabling shortcuts. No unbounded retries. No wide
speculative edits.

# Evaluations

See `evals/`. Covers failure classification, surgical fix within budget, and
retry-limit escalation.

# Frontend Upgrade Report - {ClientName} - ngo-core {SourceVersion} -> {TargetVersion}

> **MANDATORY.** Produced under `runs/<client>/<run-id>/` before the run finishes (SUCCEEDED,
> PARTIAL, or BLOCKED). It records what was **actually** done to the **client** repository and
> the result of the mandatory integration audit. The local NGO Core repository is read-only
> and unchanged. Replace every `{placeholder}`; write "N/A" rather than leaving a section blank.

---

## Result

- **Status:** {SUCCEEDED | PARTIAL | BLOCKED}
- **Client repository (mutable):** {path}
- **Local NGO Core repository (read-only):** {path} - **Core unchanged:** {yes}
- **Previous ngo-core:** {X.Y.Z} -> **Target ngo-core:** {X.Y.Z or ref}
- **Client workspace type:** {NGMODULE | STANDALONE | HYBRID}
- **Production build:** `ng build --configuration production` {succeeded | failed ({n} errors)}
- **Build-fix iterations:** {n} of {max}
- **Audit:** {PASSED | BLOCKED_INTEGRATION | BLOCKED_BUILD | BLOCKED_CORE_MODIFIED | BLOCKED_NEEDS_DEVELOPER}
- **Date:** {YYYY-MM-DD}

---

## Exact package alignment applied

| Package | Old | New (exact, from Core) |
|---------|-----|------------------------|
| ngo-core | {old} | {new} |
| @angular/core | {old} | {new} |
| {pkg} | {old} | {new} |

Installed versions verified against target Core: {yes}. No ranges/`latest` used.

---

## Requirements verified by audit

| Requirement | Client point | Verification result |
|-------------|--------------|---------------------|
| {"provider X required"} | {file} | {present} |
| {"config key Y required"} | {resolved layer} | {present} |
| {"route Z required"} | {file} | {present} |

---

## Client files changed

| File | Change summary |
|------|----------------|
| `package.json` | {exact bumps} |
| `tsconfig.app.json` | {option at level} |
| {src/app/...} | {edit} |

Total client files modified: **{n}**. Core files modified: **0**.

---

## Failures investigated and resolved

| Symptom | Classification | Fix applied | Files |
|---------|----------------|-------------|-------|
| {TS2554 ctor arity} | {build} | {aligned constructor from Core symbol} | {file} |
| {symptom} | {class} | {steps} | {files} |

---

## Deviations from plan / assumptions recorded

- {deviation or assumption, with rationale, or "None"}

---

## Next action

- {exact next action, or "None - run complete"}. If blocked, resume with:
  `node tools/frontend-upgrade-agent.js resume --run {run-id}`

# Frontend Upgrade Plan - {ClientName} - ngo-core {SourceVersion} -> {TargetVersion}

> **MANDATORY, read-only.** `plan-frontend-upgrade` produces this plan (as `plan/plan.json`
> and this human-readable summary) under `runs/<client>/<run-id>/` **before any client
> change**. Nothing here is applied until the mutation gate passes. Every planned action
> names an exact file and cites evidence; vague actions are rejected.
> Replace every `{placeholder}`; write "N/A" rather than leaving a section blank.

---

## Summary

- **Client repository (mutable):** {path}
- **Local NGO Core repository (read-only):** {path}
- **Current ngo-core:** {X.Y.Z} -> **Target ngo-core:** {X.Y.Z or ref}
- **Client workspace type:** {NGMODULE | STANDALONE | HYBRID} (bootstrap: {bootstrapModule | bootstrapApplication})
- **Core fingerprint recorded:** {hash / HEAD} - Core verified unchanged: {yes}
- **Plan status:** {READY | READY_WITH_ASSUMPTIONS}
- **Date:** {YYYY-MM-DD}

---

## Exact package alignment (from target Core - no ranges)

> Source: target Core `package.json` / manifests. `ngo-core` is never bumped alone.

| Package | Current | Selected target (exact) | Classification |
|---------|---------|-------------------------|----------------|
| ngo-core | {X.Y.Z} | {X.Y.Z} | CORE_ALIGNED |
| @angular/core | {old} | {exact} | CORE_ALIGNED |
| rxjs | {old} | {exact} | CORE_ALIGNED |
| {peer/client-only pkg} | {old} | {exact} | {PEER | CLIENT_ONLY | NOT_APPLICABLE} |

---

## Core requirements mapped to client implementation points

> Each semantic requirement is resolved to the client's real point (config precedence,
> provider/module registration, route composition, tsconfig level) with a verification
> predicate the audit will re-check.

| Requirement (semantic) | Category | Client implementation point (exact file) | Planned change | Verification |
|------------------------|----------|-------------------------------------------|----------------|--------------|
| {"provider X required"} | PROVIDER | {src/app/app.module.ts providers[]} | {add provider} | {provider registered} |
| {"config key Y required"} | CONFIG | {resolved layer: environment.prod.ts / runtime config service} | {add key} | {key present} |
| {"route Z required"} | ROUTE | {src/app/app-routing.module.ts} | {compose route} | {route present} |

---

## Planned client changes (declared up front)

| # | File | Change | Evidence |
|---|------|--------|----------|
| 1 | {package.json} | {exact version bumps} | {target Core package.json} |
| 2 | {tsconfig.app.json} | {compiler option at correct level} | {Core requirement} |
| 3 | {src/app/...} | {syntax/provider/route edit} | {Knowledge / Core symbol} |

---

## Uncertainty register (must be clear of open HIGH/CRITICAL before mutation)

| Item | Classification | Impact | Resolution / next action |
|------|----------------|--------|--------------------------|
| {item} | {KNOWN/ASSUMED/UNCERTAIN/CONTRADICTORY/NOT_APPLICABLE} | {high/med/low} | {research / developer} |

---

## Gate preconditions

- [ ] Plan READY (or READY_WITH_ASSUMPTIONS where policy permits)
- [ ] Client rollback checkpoint recorded
- [ ] Core fingerprint recorded and Core unchanged
- [ ] Planning fingerprints match current client and Core
- [ ] No open HIGH/CRITICAL uncertainty

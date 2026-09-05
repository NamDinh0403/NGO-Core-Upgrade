---
name: resolve-target-packages
description: Resolve exact target client dependencies from the local NGO Core repository.
metadata:
  id: resolve-target-packages
  version: 1.1.0
  status: active
  risk: low
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose

Determine the correct target client dependencies from the local Core repository.
Do not update only `ngo-core`. Implemented by `tools/lib/resolve-packages.js`.

# Trigger conditions

Core inspection complete; packages not yet resolved.

# Exclusions

Read-only. Never modifies package files. Never introduces `latest`, wildcards, or
broad ranges. Never installs into Core.

# Preconditions

Valid Core `package.json`; client `package.json` parsed.

# Required capabilities

`read-core-repository`, `parse-package-json`, `parse-lockfile`. Optional:
`inspect-npm-registry-metadata`, `probe-dependency-resolution`.

# Inputs

See `schemas/input.schema.json`.

# Procedure

1. Inspect Core dependency sources: `package.json`, `package-lock.json`,
   `npm-shrinkwrap.json`, `yarn.lock`, `pnpm-lock.yaml`, Angular workspace config,
   version/compatibility manifests, build scripts, and publishing config.
2. Determine target versions for ngo-core, Angular packages, Angular CLI/DevKit,
   TypeScript, RxJS, Zone.js, NgRx, TS helpers, testing, lint, package-specific
   deps and peers, required Node range, and client-relevant UI/utility packages.
3. Apply the authority order: approved manifest > Core `package.json` exact >
   Core lockfile resolved > published metadata > resolution probe > developer.
4. Classify each package: `CORE_REQUIRED_DIRECT`, `CORE_REQUIRED_PEER`,
   `CORE_IMPLICIT_PEER`, `CLIENT_AND_CORE_SHARED`, `CLIENT_ONLY_KEEP`,
   `CORE_ONLY_NOT_APPLICABLE`, `REMOVED_FROM_CORE_REVIEW`, `VERSION_CONFLICT`,
   `REQUIRES_RESEARCH`. `CORE_IMPLICIT_PEER` = a package the installed Core's
   **compiled output** imports (its `fesm*/*.mjs` or `*.d.ts` contain
   `import ... from '<pkg>'`) but which Core does **not** declare in
   `peerDependencies`. Detect these by scanning `node_modules/<core>/**/*.d.ts`
   and the fesm bundles for bare-specifier imports, not just Core's manifest.
5. Apply the merge rules (see `config/package-alignment-policy.yaml`): align
   shared packages to exact Core versions; **add every `CORE_REQUIRED_PEER` and
   `CORE_IMPLICIT_PEER` package unconditionally** — the app must satisfy them so the
   *installed* Core resolves at build time, even if the client's own source never
   imports them; add a `CORE_REQUIRED_DIRECT` package when the client imports it
   directly; preserve client-only deps; do not add every Core dev dependency; flag
   client `ngo-*` packages absent from Core.
   - Rationale (learned): installs use `--legacy-peer-deps` (a hard Core peer
     conflict such as angular-fontawesome vs fontawesome-svg-core forces it), and
     `--legacy-peer-deps` does NOT auto-install peers. So peer/implicit deps must be
     listed explicitly or the production build fails one-by-one with
     `Cannot find module '<pkg>'` (each miss costs a full build+install cycle).
     Resolve the whole peer/implicit set up front from the installed Core, not lazily.
6. Emit exact `selectedTargetVersion` per package with evidence, risk, and
   validation.

# Evidence requirements

Every alignment entry cites `core:package.json#<section>` and, where used, the
Core lockfile file name.

# Uncertainty behavior

Unparseable versions, client-ahead-of-Core, non-exact Core versions with no
resolvable lockfile version, and client `ngo-*` packages absent from Core each
create an uncertainty record. HIGH-impact uncertainties block related mutation.

# Completion criteria

`target-package-manifest.yaml` and `package-alignment-map.yaml` are written; each
entry has all required fields.

# Retry behavior

Idempotent; safe to re-run.

# Escalation behavior

`BLOCKED_INVALID_CORE_PACKAGE` (invalid Core package.json) routes to
`developer-escalation`.

# Outputs

See `schemas/output.schema.json`.

# Allowed next skills

`derive-release-requirements`, `developer-escalation`.

# Prohibited behavior

No `latest`/wildcards/ranges. No file mutation. No blanket copy of Core dev deps.
Never gate a `CORE_REQUIRED_PEER`/`CORE_IMPLICIT_PEER` package on "does the client
import it directly" — that under-scopes transitive/peer deps and breaks the build.

# Evaluations

See `evals/`. Covers exact resolution, client-only preserved, Core-only dev deps
not added, shared aligned, and version conflict → uncertainty.

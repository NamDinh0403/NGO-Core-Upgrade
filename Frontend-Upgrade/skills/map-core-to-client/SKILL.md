---
name: map-core-to-client
description: Map each Core requirement to the actual client implementation point.
metadata:
  id: map-core-to-client
  version: 1.1.1
  status: active
  risk: low
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose

For every target Core requirement, determine whether it applies to the client and
where it is (or should be) implemented, using the client semantic graph. Resolve
environment/runtime configuration, modules/providers, routing, and TypeScript
inheritance correctly, at the effective implementation point.

# Trigger conditions

Normalized Core requirements exist; mapping not yet produced.

# Exclusions

Read-only. Produces mappings, not client edits. AMBIGUOUS requirements cannot
produce automatic client mutations.

# Preconditions

`core-target-requirements.yaml`, `core-host-app-baseline.yaml`, and
`frontend-semantic-graph.json` exist.

# Required capabilities

`read-client-repository`, `resolve-typescript-inheritance`.

# Inputs

See `schemas/input.schema.json`.

# Procedure

For every requirement determine: whether it applies; client implementation
candidates; the effective implementation point; candidate confidence; supporting
evidence; current satisfaction status; missing evidence; the exact planned
action; the exact files where resolved; uncertainty; risk; and validation.

**Reference host-app diff (mandatory).** In addition to requirement mapping,
structurally diff the Core reference host application
(`core-host-app-baseline.yaml`: app module, route service, routing module,
environment service, environment files, `main.ts`, `index.html`, global styles,
polyfills) against the client's corresponding files. Emit CONCRETE, itemized
deltas with exact names: modules to import, providers to register, routes/guards
to add, environment/runtime keys to add, icons to register, and HTML/style
changes. Write them to `frontend-host-app-delta.yaml`. Newly-added Core modules,
routes, providers, config keys, and icons that the client lacks are dispositioned
`MISSING` (or `PARTIALLY_SATISFIED`), never silently dropped because the client
did not already use them. Critically, PRESERVE client customizations: `-Ext`/
override providers, client-only modules, client-only or client-renamed routes,
and client-customized config values and API paths must never be overwritten with
the Core default. A requirement-only mapping that produces no host-app delta for
an app-level release is incomplete.

Resolve each domain correctly:
- **Configuration**: discover every file replacement, environment/config service,
  `assets/config/*.json`, `APP_INITIALIZER`/`provideAppInitializer`, runtime HTTP
  loading, window-based config, generated settings, and deployment substitution.
  Classify sources and determine precedence. Add only evidence-required keys to
  the authoritative source; never add the same key to every candidate file.
  When reconciling a key set (e.g. `apiControllerPrefix`), extract the COMPLETE key
  list from the ENTIRE reference file AND the ENTIRE client file programmatically
  (parse the whole object / grep every key), never from a truncated or partial read —
  a partial read of a long config file silently drops deltas (a real miss: keys past
  the first ~90 lines of Core `environment.ts` such as adminIATIPage/minimumRequirements/
  aiwriter were dropped because only the file head was compared). Then add every missing
  key to EVERY applicable env file (e.g. `environment.ts` AND `environment.prod.ts`), and
  verify the client key set is a superset of the reference's before marking it done.
- **Modules/providers**: classify NGMODULE/STANDALONE/HYBRID; inspect root/shared/
  feature modules, `importProvidersFrom`, `provide*`, `forRoot`, route providers,
  initializers, factories. Do not blind-copy all Core AppModule imports; instead
  diff the Core reference host-app baseline against the client and add only the
  modules/providers the client lacks, preserving every client `-Ext`/override
  provider and client-only module.
- **Routing**: discover `app-routing.module.ts`, `app-route.service.ts`, route
  arrays/factories, `forRoot`/`forChild`/`provideRouter`, dynamic composition,
  `resetConfig`, lazy routes, client overrides. Compare the effective route graph;
  preserve overrides; validate wildcard position.
- **TypeScript**: resolve all `extends` inheritance; apply field-level changes to
  the controlling tsconfig; never replace whole files; never enable `skipLibCheck`
  as a default workaround.

Allowed dispositions: `SATISFIED_DIRECTLY`, `SATISFIED_TRANSITIVELY`,
`SATISFIED_BY_CLIENT_EQUIVALENT`, `PARTIALLY_SATISFIED`, `MISSING`, `DUPLICATED`,
`CLIENT_FEATURE_DISABLED`, `NOT_APPLICABLE_WITH_EVIDENCE`, `AMBIGUOUS`,
`REQUIRES_RESEARCH`, `REQUIRES_DEVELOPER`.

# Evidence requirements

Every mapping cites client evidence (exact files) and the Core requirement ID.

# Uncertainty behavior

`AMBIGUOUS`, `REQUIRES_RESEARCH`, and `REQUIRES_DEVELOPER` dispositions create or
reference uncertainty records and never yield automatic mutations.

# Completion criteria

`frontend-requirement-map.yaml`, `frontend-impact-map.yaml`, and
`frontend-host-app-delta.yaml` are written.

# Retry behavior

Idempotent.

# Escalation behavior

Unresolvable ambiguity routes to `developer-escalation`.

# Outputs

See `schemas/output.schema.json`.

# Allowed next skills

`plan-frontend-upgrade`, `developer-escalation`.

# Prohibited behavior

No client mutation. No same-key-everywhere config edits. No whole-file tsconfig
replacement. No blind-copying all Core AppModule imports — the reference host-app
diff must be evidence-based and preserve client overrides, but it must NOT skip a
newly-added Core module/provider/route/config-key/icon merely because the client
did not already use it.

# Evaluations

See `evals/`. Covers `app-environment.service.ts`, `assets/config`, precedence
resolved/ambiguous, `app-route.service.ts`, dynamic routes, transitive module,
provider already registered, missing module, disabled feature, multi-level
tsconfig, nonstandard file mapping, and reference host-app diff (new Core module/
provider/route/config-key/icon surfaced as MISSING while client overrides are
preserved).

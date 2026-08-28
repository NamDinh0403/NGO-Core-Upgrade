# Source cleanup report

New and changed source (Node.js/CommonJS under `tools/lib/`, adapting the target
architecture's `src/<domain>` to this project's conventions - see decision D-1).

## New modules (single, explicit responsibilities)

| Module | Responsibility (target-architecture interface) |
| --- | --- |
| `tools/lib/release-knowledge.js` | `IReleaseKnowledgeStore` - load/query canonical release records, migrations, appsettings, version manifest |
| `tools/lib/release-range.js` | `IReleaseRangeResolver` - select `S < v <= T`, dedup backports, apply supersession, trigger reusable migrations |
| `tools/lib/applicability.js` | `IRequirementApplicabilityEvaluator` - disposition per requirement against client evidence |
| `tools/lib/requirement-map.js` | `IRequirementToClientMapper` - resolve semantic roles to the client's real files (config precedence, module/provider style, router composition, tsconfig inheritance) |
| `tools/lib/requirement-coverage.js` | `IRequirementCoverageValidator` + `IMissingStepDetector` - per-requirement status, planning/completion gates, deployment checklist |
| `tools/lib/appsettings-inventory.js` | `IAppSettingsInventory` + mapper - discover config surfaces, map settings, preserve values, reject secrets |
| `tools/lib/client-model.js` | Build the normalized client model + evidence from the read-only inventory |
| `tools/lib/planning-release.js` | Orchestrate the above into read-only run artifacts and gates |
| `tools/lib/knowledge-context.js` | Build the minimal per-decision context packet (keeps prompts small) |
| `tools/lib/knowledge-candidate.js` | `IKnowledgeCandidateGenerator` - redacted CANDIDATE records only |

## Changed source

- `tools/lib/release-knowledge.js` strips the leading `#` comment lines from the version
  manifest before parsing (the manifest is documented JSON).
- `tools/frontend-upgrade-agent.js` `start` now resolves the release range, evaluates
  applicability, maps requirements, builds coverage/missing-steps/deployment-checklist and
  AppSettings coverage, writes the artifacts, records `releasePlanReady`, and prints a
  release summary. Secret rejections raise a failure event.
- `tools/lib/engine.js` skill selection references `derive-release-requirements`.
- `skills/registry.yaml` + the renamed skill: `derive-core-requirements` ->
  `derive-release-requirements`.

## Boundaries honoured

- Wrappers/adapters (deterministic technical operations - npm, git, build) stay under
  `tools/`; orchestration/business logic lives in the `tools/lib/` domain modules above.
- No module reads the raw release notes; only canonical structured records are loaded.
- No oversized service: each module has one responsibility and a small exported surface.

## Removed / avoided anti-patterns

- No direct parsing of the root `release-notes.md` at runtime.
- No loading of all knowledge into context (only the resolved, applicable subset).
- No duplicate semver/range logic (reuses `core.compareVersions` / `core.parseVersion`).
- No hardcoded client paths (`app.module.ts` / `environment.ts`) - resolved by the mapper.
- No broad catch-and-succeed: gates fail closed; secret values are rejected, not copied.

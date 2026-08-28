# Repository cleanup plan

Ordered, safe, reversible execution plan. Each step lists its validation. The git root is
shared by both tracks, so cross-track root files are handled conservatively (MANUAL_BLOCKER
rather than silent deletion).

## Guiding constraints
- **Node.js/CommonJS project**, mirrors `Backend-Upgrade/`. No `src/` C# tree, no
  `.config/dotnet-tools.json`. Business logic lives in `tools/lib/<domain>.js`.
- **Client repo is the only mutable target at runtime**; this cleanup only touches the
  agent repository, never a client.
- **No runtime module reads** `Knowledge/`, `Templates/`, or `release-notes.md` (verified),
  so renames/imports cannot break runtime behaviour.
- Secrets must never enter knowledge, logs, or reports.

## Steps
1. **Inventory + reference map** (this set of docs). Validation: files exist, dispositions
   are concrete.
2. **Repository layout policy + cleanliness test**: forbid `Knowledge/`, `Templates/`, root
   `release-notes.md`, root `compiler-error-fix-loop.png`, duplicate READMEs, committed run
   output, and runtime reads of raw notes. Validation: `node tools/repo-layout.test.js`.
3. **Release-requirement schemas**: `release-requirement`, `release-manifest`,
   `appsettings-requirement`, `requirement-coverage`. Validation: `node tools/validate.js`.
4. **Structured release knowledge**: import `release-notes.md` into
   `knowledge/canonical/releases/<version>/*.yaml` (only non-empty scopes) with atomic
   requirement records; redact secrets. Validation: schema validation of every record.
5. **Migration + appsettings canonical**: `knowledge/canonical/migrations/angular-10-to-15.yaml`
   and `knowledge/canonical/appsettings/backend-appsettings.yaml` (+ derived `.md`).
6. **Rename** `Knowledge/`->`knowledge/`, `Templates/`->`templates/`; move version manifest
   into `knowledge/canonical/versions/`; update all references. Validation: layout test +
   grep for stale references.
7. **Source modules** (`tools/lib/`): release-knowledge store, release-range resolver,
   applicability evaluator, requirement->client mapper, requirement coverage + missing-step
   detector, appsettings inventory, knowledge-context packet builder. Validation: unit tests.
8. **Integrate planning gate**: plan cannot be READY unless the release range is resolved and
   every applicable requirement has a disposition and mapping/owner. Validation: gate tests.
9. **Integrate execution + audit/completion gate**: only applicable+mapped+planned+policy-
   permitted+in-phase requirements may apply; completion requires requirement coverage.
   Validation: coverage tests.
10. **Tests + evals**: add `tests/` (unit/integration/release-coverage/fixtures) with the 30
    deterministic tests; add agent evaluations. Validation: `node tests/run.js`, `run-evals`.
11. **Documentation**: architecture (release-knowledge, requirement-coverage,
    appsettings-knowledge), operations (import/update release notes, review missing steps,
    new-developer-setup), refactor reports.
12. **CHANGELOG.md**: mine reusable episodes/candidates; move human-readable copy to
    `docs/release-knowledge/historical-frontend-upgrade-changelog.md`; remove root copy.
13. **Raw notes normalization**: sanitized copy to
    `knowledge/raw/release-note-import/release-notes-sanitized.md` + import manifest; confirm
    no runtime reader; the git-root `release-notes.md` removal is a MANUAL_BLOCKER (shared
    with backend) and is documented, not silently deleted.
14. **compiler-error-fix-loop.png**: copy into `docs/assets/`; root copy removal is a
    MANUAL_BLOCKER (shared with backend).
15. **gitignore**: ignore run output/temp/node_modules/logs; keep a `runs/` placeholder.
16. **Final validation**: layout, schemas, records, migration, appsettings, tests, evals,
    range/mapping/coverage/appsettings/secret/ownership, confirm raw notes excluded at
    runtime, confirm root clutter policy, inspect final tree.

## Rollback
Every change is a file add/move within the agent repo tracked by git; `git` history
preserves removed files. No client repository is touched.

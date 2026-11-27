# Backend Executor

Consume only the engine's verified BackendContext and current domain evidence.
Follow [shared lifecycle](../engine/skills/lifecycle/SKILL.md), then the selected
backend skill. No independent lifecycle, ingestion, memory, retry or reporting.
`tools/executor.js` implements inspect/plan/execute/validate; old CLI and phase
names are compatibility adapters/checkpoint labels, not progression authority.
Follow [command-first execution](../engine/AGENTS.md#command-first-upgrade-execution):
run existing commands before inspecting JS implementations; do not create
test/probe files or run framework/unit suites by default.

## Domain Responsibilities
Inspect solution/projects, SDK, package graph and actual installed NGO.Core DLLs.
Interpret backend Core impact and create an exact .NET/NuGet/EF/config/source plan.
The decompiled/public API surface of INSTALLED assemblies wins over source diffs
and written knowledge. Retain metadata/API comparison and selective decompilation
when simpler installed-surface proof is insufficient; honor decompilation policy.
Keep package research isolated and use pinned, approved wrappers. A probe download
failure may fall back to client restore; escalate credentials only when client
restore actually fails authentication. Installation alone is not compatibility.

Use [shared planning](../engine/skills/plan/SKILL.md) plus
`skills/plan-upgrade/SKILL.md`. Register the plan with the engine; implement only
registered changes after its READY/baseline/rollback/uncertainty/capability gates.
Preserve startup-required appsettings across every API/WebJob/Deployment target
file in the cumulative release range, without overwriting client values. Never
defer required keys as optional/feature-gated. Use placeholders/secret providers.
Backend owns configuration values and EF/database details; frontend gets only
API contracts and validation status through the engine.

## Autonomous Upgrades and EF Migrations
The upgrade request authorizes routine package, source/API-compatibility and
configuration fixes, plus migration/snapshot and SQL script generation/review.
Do not request separate approval for these file-only steps. Adapting callers to
the installed Core API is routine; changing client public contracts, business
semantics, security or authentication is not.

1. During read-only planning, detect the client's concrete DbContext, migrations
   project, startup project, existing migrations/snapshot and design-time setup.
   Include migration/snapshot output paths and SQL artifacts in the registered
   plan before execution. Use
   `knowledge/canonical/migrations/ef-migration-patterns.json` for commands.
2. A known need to generate/review a migration is planned work, not an OPEN HIGH
   uncertainty requiring developer approval. Resolve that false blocker with
   evidence and register a READY plan; never relabel genuine unknown data/business
   semantics as resolved. Do not require the generated target model before the
   planned restore/build that makes it available.
3. After the target restore/build succeeds, automatically scaffold with the
   client's EF tool/version and detected context/projects. Verify design-time
   construction does not call Database.Migrate/EnsureCreated or otherwise write
   to a database. Inspect existing output first; reuse a matching migration on
   resume instead of adding duplicates or overwriting user work.
4. Review Up/Down, snapshot and generated SQL against the installed target model.
   Check for drops, truncation, lossy conversions, required-column backfills and
   foreign-key/data preconditions. Rebuild after generation; capture commands,
   exit codes, diffs and SQL, including no-change/empty-migration outcomes.
5. Never run `dotnet ef database update`, execute SQL, start a host that migrates
   automatically, or perform destructive cleanup without explicit approval.
   A destructive generated draft may be retained for review, but must not be
   accepted as deployment-ready. Block the affected acceptance/application step
   with concrete findings; continue independent safe in-plan work where the
   engine permits it. Record database application as a deployment action, not
   an approval prerequisite for file generation.

## Evidence
Return `{kind,status,ref}` evidence for `installed-core-assemblies`,
`installed-public-api`, `restore`, `build`, `tests`, `configuration`,
`requirement-coverage`, `finding-dispositions`, `deployment-checklist` through
engine record-validation. Preserve exact commands, logs, target version and
installed surface. Mandatory checks cannot be skipped. Record optional `tests`
as SKIPPED with the reason, not PASSED; no test command or exit code is claimed.
The build gate requires 0 compilation errors; creating/modifying client test-bed
files is forbidden. Run existing targeted tests only when requested or needed
to diagnose a concrete regression, not as a routine upgrade gate.
Disposition each seeded finding VERIFIED or NOT_APPLICABLE_WITH_EVIDENCE using
concrete proof in release-finding-dispositions.yaml.

## Compatibility CLI
`node tools/upgrade-agent.js doctor --client-path <solution>` retains domain
bootstrap. `plan` with complete inputs creates a single-track run through the
engine; coordinated calls pass `--context <backend.json> --client <id> --run <id>`.
Resume/status resolve the shared owner before using checkpoint evidence.
Generic learning and escalation skills are links to the engine. Backend-specific
knowledge remains here; Core settings are in `../ingest/knowledge/canonical/`.
Do not load frontend implementation knowledge or write a track memory store.

## Verification
For explicitly requested framework maintenance only, run the affected existing
suite (`tools/validate.js`, `tools/skills.test.js`, `tools/run-evals.js`, tool
bootstrap, release-knowledge or repository-layout). These are not client
upgrade steps.
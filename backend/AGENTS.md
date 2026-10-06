# Backend Executor

Consume only the engine's verified BackendContext and current domain evidence.
Follow [shared lifecycle](../engine/skills/lifecycle/SKILL.md), then the selected
backend skill. No independent lifecycle, ingestion, memory, retry or reporting.
`tools/executor.js` implements inspect/plan/execute/validate; old CLI and phase
names are compatibility adapters/checkpoint labels, not progression authority.

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

## Evidence
Return `{kind,status,ref}` evidence for `installed-core-assemblies`,
`installed-public-api`, `restore`, `build`, `tests`, `configuration`,
`requirement-coverage`, `finding-dispositions`, `deployment-checklist` through
engine record-validation. Preserve exact commands, logs, target version and
installed surface. Missing/skipped validation is not PASSED. Migration decisions
and destructive/public-API/security/auth changes require appropriate approval.
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
Existing `tools/validate.js`, `tools/skills.test.js`, `tools/run-evals.js`, tool
bootstrap, release-knowledge and repository-layout tests remain required.
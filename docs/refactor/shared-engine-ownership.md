# Shared Engine Ownership Map

Audit source revision: f14cbc0, clean working tree before refactoring. The map
was built from require/call paths, state transitions, schemas, configuration and
agent/skill entry points, not directory names. Historical runs were not rewritten.

| Component | Previous Owner And Caller | Generic Or Domain | Duplicated? | Safe Shared Owner | LLM Reasoning? | Domain Details Needed? |
| --- | --- | --- | --- | --- | --- | --- |
| Core Git/diff/notes/cache | ingest; shared context calls ensureReleases | Core deterministic | no; track wrappers repeated responsibility | ingest, preserved | no | classification rules only |
| CoreChangeSet production | orchestrator context after ingest | Core contract | wrapper outside producer | ingest/tools/lib/core-change-set.js | no | scoped reference counts only |
| Context/discovery | orchestrator; CLI and track attach/guard | generic coordination plus domain inspection | track utilities repeated discovery | engine; inspect delegated to executors | interpretation only | track fact schema, not opposite implementation |
| Global lifecycle | two track FSMs plus orchestrator phase projection | generic | two authorities | engine lifecycle/coordinator | no for progression | no |
| Historical checkpoints | track FSMs/run store | compatibility data and generic storage | common routing/resume/idempotency | engine primitives/artifacts/checkpoint profiles | no | domain evidence requirements |
| Planning gate | backend/frontend skill engines and plan skills | common gate, domain plans | two mechanisms | engine policy/skill-engine/coordinator | domain compatibility decisions | injected .NET/Angular checks |
| Registry/IO/capability activation | track engines; CLIs/tests | generic mechanism, domain tables | two implementations | engine skill-engine/schema | no | capability tables/selectors only |
| Retry/diagnosis | track policies/skills/FSMs | generic budget, domain diagnosis | duplicate budgets/procedures | engine policy/coordinator/diagnose skill | ambiguous failures only | scoped failure surface |
| Safety/retention | track agent/escalation/retention policies | generic plus package policy | common safety/status/lifecycle data | engine execution/retention policy | ambiguous/destructive approval | package-acquisition rules stay domain |
| Core knowledge | frontend canonical releases/settings/version manifest; backend configuration knowledge | Core | shared facts located in tracks | ingest canonical; engine reader | interpretation only | scope filtering and API boundary |
| .NET compatibility knowledge | backend versions/errors/symbols/EF migrations | backend | distinct domain evidence | backend, retained | semantic compatibility | yes, .NET/NuGet/EF |
| Angular migration knowledge | frontend migrations and semantic mapping | frontend | distinct domain evidence | frontend, retained | semantic mapping | yes, Angular/TS/NgRx |
| Memory | backend tier folders and two learning procedures | generic lifecycle, scoped content | two procedural mechanisms | engine memory; existing records moved unchanged | reusable finding selection/review | scope metadata only |
| Escalation/learning skills | backend/frontend skill bodies | generic with different legacy output shapes | duplicate procedures | engine skills; ID/schema adapters retained | escalation decisions/findings | domain evidence is input |
| Coverage/handover/report | orchestrator merge plus domain reports | generic composition, domain evidence | independent track closure instructions | engine; new executor envelopes | no extra reasoning on composition | structured coverage/deployment data |
| Configuration inspection | backend adapter; frontend compatibility proxy | backend | shared caller, not duplicated implementation | backend through engine capability dispatch | ambiguous applicability only | values stay backend-owned |
| NuGet/installed DLL/API/EF wrappers | backend tools and skills | backend | no useful duplicate removed | backend executor | signature/migration decisions | yes |
| Angular inventory/toolchain/host diff | frontend tools and skills | frontend | no useful duplicate removed | frontend executor | composition/compatibility decisions | yes |
| Agent/skill discovery/install | .github and installer stamps | entry routing | independent framework descriptions | main engine entry plus executor contracts | routing/semantic work | selected track contract only |
| Complete validation | tools/validate-all.js and existing suites | generic gate plus domain tests | not replaced | same validator, engine suite added | no | domain tests retained |

## Dependency Direction
Core ingestion produces immutable evidence; the engine owns its lifetime and
dispatches domain executors. Executors consume engine contracts. They do not
import the other executor or orchestrator implementation. Engine-owned API
impact/validation status is the cross-track boundary. Compatibility facades
contain no independent generic implementation.

## Migration Evidence
Extraction validated with backend 12/12 and frontend 19/19 evals. Relocation and
new lifecycle retained 30/30 orchestration tests. Generic skill migration retained
backend 40/40 and frontend 53/53 contracts. Canonical relocation retained 72
requirements, 13 domain migration requirements, 14 settings and 29 manifests,
with 38/38 knowledge tests. Final command/results are in shared-engine-report.md.
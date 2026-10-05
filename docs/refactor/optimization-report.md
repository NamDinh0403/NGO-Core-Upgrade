# Preserve-Workflow Optimization

## Outcome

The existing ingest/orchestrator/backend/frontend architecture is preserved.
No client or Core checkout was upgraded or modified. No canonical records,
mutation policies, track engines, checkpoints, failure-recovery loops or
build/test/integration gates were removed. No commit was created.

## Files And Ownership

- No files removed. The current tracked census has no byte-identical duplicate
  groups and provides no safe dead-file deletion evidence.
- Procedural duplication in the six existing .github discovery files was merged
  into root/module AGENTS.md contracts. All three agents and three skills remain.
- Track mutation engines and independent schemas/state/knowledge remain separate;
  superficially similar gates have different safeguards and consumers.
- Scoped rewrites: existing ingestion CLI/Git helper/tests/schema; orchestrator
  freshness, cumulative seeds, evidence/completion gates/tests/state schema;
  frontend knowledge loader/range/tests; discovery/contracts/installers/onboarding.
- New documentation only: this report and optimization-file-inventory.json.
  Temporary audit tooling and test tasks are not part of the shipped framework.

The generated inventory includes every one of 501 baseline tracked files,
explicit references/resolved relative imports/links, declared dynamic consumers,
context bytes and conservative KEEP/MERGE/REWRITE dispositions. 118 files have
explicit textual/import/link consumers; absence of such references is not dead
code proof. Exact dynamic validator/tool use remains marked for review rather
than guessed. The inventory/report themselves are on-demand audit artifacts,
not default agent context. Historical refactor reports are preserved.

## Core Ingestion

- Release bounds use explicit source/target tags and immutable resolved commits.
  Client engagements require a discovered source version. Maintenance target-only
  ingestion uses the preceding release tag, not a client's inferred source.
- Adjacent deltas for all intermediate releases feed the shared requirement seed;
  canonical version presence no longer skips necessary release extraction.
- NUL-safe Git parsing preserves added/modified/deleted/renamed status and both
  rename paths, including spaces. Extraction never re-resolves mutable tags.
- Structured package versions/dependencies and JSON config key change kinds,
  migration paths and API declaration hints reduce raw-source rediscovery.
- Exact XML project references and semantic API/breaking-change interpretation
  still require existing structured inspection/signature tools and reasoning;
  project-file flags, API counts and filename-note matches are explicitly hints.
- Config values are omitted. Known credential patterns, query parameters and
  URL userinfo are redacted. Source/notes remain untrusted evidence, not commands.
- Dirty-to-dirty Core content drift and unreadable Git/ref evidence are detected.
  Candidates publish only after verification, using temporary-file replacement;
  failed refreshes retain previously valid records.

## Reuse And Context

One shared candidate identity combines baseline/target commits, relevant note
content hash and analyzer version. Content integrity and required record shape
are checked. Legacy/corrupt/mismatched records refresh. Identical hits skip file
extraction and candidate rewriting; they still perform cheap identity and Core
checks. This caches shared facts, not client memory or canonical approval.

Frontend runtime knowledge now reads only the requested release range. Unscoped
interfaces remain for validators. Framework fallback manifests, reusable Angular
migrations, duplicate/supersession behavior and startup appsettings coverage are
preserved. Full reference-host integration auditing is not narrowed by diff size.

Agent contracts route to the current run, selected skill and applicable evidence,
not all skills, raw logs, historical runs or unrelated knowledge. Discovery files
point to those contracts instead of repeating their procedures. The generated
final report is surfaced, not re-reasoned by another reporting pass.

## Copilot And Auto Mode

Select `ngo-core-upgrade` in the agent picker and request:

```text
Upgrade this repository from Core 9.2 to 9.3.
```

The existing primary agent file exposes that public name; existing track names
and discoverable skill identities remain. Local paths/source metadata are
discovered first; only material missing/conflicting inputs are collected once.
Target versions are not inferred from the highest installed package.

Safe deterministic checks and execution continue through existing READY gates.
Ambiguous/destructive changes, conflicts, required approvals, manual SQL and
exhausted retry budgets still escalate. Parallel tracks run only on independent
working trees. Installed-root stamps now explicitly cover root AGENTS.md and
orchestrator as well as ingest/backend/frontend.

## Safety And Traceability

Ingest failure/missing source blocks delegation with a resumable next action.
Every requested track must supply terminal evidence. Seed findings need an
evidenced disposition or linkage to verified/not-applicable coverage, produced
during the existing planning/verification pass, not a new reasoning phase.
Candidates are evaluated rather than treated as automatic obligations.

Release provenance is hashed from the records used to generate seeds, preventing
concurrent cache replacement from silently changing their authority. Track,
coverage, seed, disposition and deployment evidence are snapshotted. Missing or
changed source/generated handover evidence invalidates completion and requires
re-verification. Blocked track resume instructions remain visible verbatim.

This intentionally stops cases that previously appeared READY/COMPLETE with
missing or stale evidence. It does not remove a supported upgrade capability.

## Measurements

| Metric | Before | After | Method |
| --- | --- | --- | --- |
| Six discovery files | 20,105 bytes | 6,225 bytes | Git HEAD vs working UTF-8 size; 69.0% reduction |
| Discovery plus four contracts | 40,711 bytes | 29,475 bytes | Same census; 27.6% reduction |
| Release YAML reads, 9.1.0 to 9.2.0 | 68 | 6 | Instrumented existing reader; equivalent requirements |
| Same range, repeated in-process | 0 additional reads | 0 additional reads | Existing cache behavior preserved; scoped startup reduction above |
| Valid shared release cache hit | Existence-only, unverified | No file extraction/rewrite | Regression makes extraction fail if invoked on hit |
| Agents / discoverable skills | 3 / 3 | 3 / 3 | No extra execution abstraction |
| Actual LLM turns, tokens, credits, large-context calls | Uninstrumented | Uninstrumented | No billing savings invented |

Bytes/file reads are proxies, not billed input tokens. No direct LLM API calls
were located in the audited deterministic CLI paths; Copilot reasoning remains
runtime-driven. Comparable real-session telemetry is needed to measure credits,
repeated context/tool reads and reasoning loops.

## Verification

- Initial baseline: 14/14 framework suites passed, exit 0, tracked hashes unchanged.
- Focused ingestion: 23/23; ranges, cache reuse/invalidation, renamed/deleted/spaced
  files, config redaction, dirty drift, failed refresh and immutable extraction.
- Focused orchestrator: 22/22; failure/source/missing-track gates, cumulative seeds,
  discovery links, stale coverage, seed dispositions, concurrency and malformed handover.
- Frontend release knowledge: 34/34; selection/appsettings/migrations/supersession,
  scoped equivalence/cache reads/framework fallback. Independent review compared
  552 existing/scoped range combinations with matching results.
- Full framework validation through node tools/validate-all.js: 14/14 suites pass,
  including backend/frontend failure recovery, skill/mutation checks and evals;
  tests leave tracked working-tree content unchanged.
- PowerShell installer attempt used an isolated temporary profile but was blocked
  by the system's script execution policy. That policy was not bypassed.
- Source discovery frontmatter/contract links and installer stamp guidance pass
  deterministic tests. Actual installed-profile discovery, live Copilot UI and
  Bash installer execution remain manual verification.
- Real NuGet/Angular/EF client rehearsal is not covered by framework fixtures and
  needs a developer-selected disposable client; no real-client success claimed.

## Phase Coverage

1. Architecture/file audit: current owners mapped, every tracked file inventoried;
   uncertain dynamic consumers remain explicit, not deleted.
2. Redundancy: repeated discovery procedures consolidated; useful skills/schemas
   and intentionally separate track state/gates retained.
3. Ingestion: deterministic bounds/status/facts/drift improved; semantic limits named.
4. Reuse: shared commit/note/analyzer identity and integrity-checked cache.
5. Context: range loading and owning-contract progressive reads.
6. LLM calls: deterministic work remains tools; repeated discovery/report reasoning
   discouraged; billing/turn telemetry unavailable rather than fabricated.
7. Deterministic-first: Git/fact extraction/execution/validation stay tool-owned.
8. Copilot UX: public name on the existing primary agent, discovery-first inputs.
9. Auto mode: safe execution within existing gates, escalation only at real stops.
10. Source simplification: MERGE procedures; KEEP unproven-unused files, no redesign.
11. Validation: focused/full fixture coverage; installer/client/UI limits above.
12. Efficiency: measured source bytes, file reads and cache behavior; no credit claim.

## Architecture

```mermaid
flowchart LR
  U[User] --> A[Same primary agent]
  A --> I[Shared ingest and identity cache]
  I --> P[Scoped impact and plans]
  P --> T[Backend and frontend]
  T --> G[Existing mutation gates]
  G --> V[Build test and bounded diagnosis]
  V --> R[Evidence-checked merged report]
```

Before: same stages, filename-based reuse and repeated procedures/full release loading.
After: immutable shared facts, validated reuse, scoped reads and stronger reporting gates.
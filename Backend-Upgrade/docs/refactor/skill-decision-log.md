# Skill Implementation Decision Log

| # | Decision | Rationale |
|---|----------|-----------|
| S1 | Skills are SKILL.md procedures + per-skill schemas + a deterministic engine | Stable across LLM model changes; behaviour lives in files + enforced logic, not one big prompt. |
| S2 | Engine in Node under `tools/skills/lib/` | Matches existing dep-free tooling; testable; reuses the YAML reader. |
| S3 | Deterministic selection (rules, not similarity) | The brief forbids similarity-only selection; rules use phase/plan/failure/mutation context. |
| S4 | Client-mutation gate + uncertainty gate implemented as pure functions | Makes "planning before mutation" and "HIGH/CRITICAL blocks mutation" enforceable and testable. |
| S5 | Lazy capability activation with a 4-level model | Optional Level 2/3 tools must not block planning; only plan-required capabilities activate. |
| S6 | CLI extends `upgrade-agent` with doctor/plan/research/run/resume/status/learn | One stable cross-platform entry point (no duplicated PowerShell/Bash logic). |
| S7 | `research-version` output schema pins `clientUnchanged: true` (const) | Encodes "research does not modify the client" as a validated invariant. |
| S8 | `learn-from-run` output pins `wroteToCanonical:false`, `approvedOwnCandidates:false` | Encodes "candidates only, no self-approval" as validated invariants. |
| S9 | `audit-frontend-integration` output pins `installOnlySuccess:false` | Encodes "not a pass just because npm install succeeded". |
| S10 | Skills registered in `config/repository-layout-policy.yaml` | Keeps the cleanliness/layout test authoritative over the new root directory. |
| S11 | Did not build an LLM execution runtime | Out of scope and model-dependent; the deterministic harness + gates + schemas satisfy "functional" without one. |

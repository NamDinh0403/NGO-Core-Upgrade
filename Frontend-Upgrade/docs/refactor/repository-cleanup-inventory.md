# Repository cleanup inventory

Ground-truth inventory of the repository as inspected on the filesystem, not the
merged tree shown in the task. The **git repository root** is
`d:/NGO Client/NGO Core Upgrade/` and contains **both** the `Backend-Upgrade/` and
`Frontend-Upgrade/` agent projects plus three shared root files. `Frontend-Upgrade/`
is a sub-project, so several "root clutter" items (`release-notes.md`,
`compiler-error-fix-loop.png`, the workspace `README.md`) live at the git root and are
**shared with the Backend track**. This constraint drives several dispositions below.

Columns: path | content type | responsibility | authority | consumers | source/generated |
duplicate | sensitivity | target path | transformation | validation | disposition.

## Git root (`d:/NGO Client/NGO Core Upgrade/`)

| Path | Type | Responsibility | Authority | Consumers | Src/Gen | Duplicate | Sensitivity | Target | Transformation | Validation | Disposition |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `.git/` | VCS | version control | tooling | git | source | no | none | (unchanged) | none | n/a | KEEP_AS_CANONICAL |
| `README.md` (root) | doc | workspace/two-track orientation | canonical (workspace) | developers | source | not a true dup of Frontend README (different scope) | none | (unchanged) | de-link removed legacy flow | layout test | KEEP_AS_CANONICAL |
| `release-notes.md` (root) | raw knowledge | raw NGO Core release notes | raw import ONLY | both tracks (currently) | source | no | **contains IATI subscription key** | `Frontend-Upgrade/knowledge/raw/release-note-import/release-notes-sanitized.md` (frontend copy) | sanitize + import to structured; root copy shared with backend | secret-redaction-report; import-manifest | SPLIT_AND_REMOVE_SOURCE (frontend import) + MANUAL_BLOCKER (root removal is a cross-track decision) |
| `compiler-error-fix-loop.png` (root) | asset | build-fix loop diagram | doc asset | root README | source | no | none | `Frontend-Upgrade/docs/assets/` (copy) | referenced by root README, shared | reference check | MANUAL_BLOCKER (root removal is cross-track); copy into frontend docs assets |
| `Backend-Upgrade/` | project | backend agent | canonical | backend track | source | no | none | (unchanged) | out of scope | n/a | KEEP_AS_CANONICAL (out of scope) |
| `Frontend-Upgrade/` | project | frontend agent | canonical | frontend track | source | no | none | (unchanged) | this refactor | full suite | KEEP_AS_CANONICAL |

## Frontend-Upgrade sub-project

| Path | Type | Responsibility | Authority | Consumers | Src/Gen | Duplicate | Sensitivity | Target | Transformation | Validation | Disposition |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `README.md` | doc | frontend agent overview | canonical (frontend) | developers/agents | source | distinct scope from root README | none | (unchanged) | update knowledge/ links after rename | layout test | KEEP_AS_CANONICAL |
| `AGENTS.md` | doc | agent contract | canonical | LLM agents | source | no | none | (unchanged) | add release-knowledge rules; fix `Knowledge/` link | validate | KEEP_AS_CANONICAL |
| `CHANGELOG.md` | doc | WVUK v5.14->v8.3 client-upgrade history | historical evidence (NOT workflow) | reference | source | no | low (client name) | `docs/release-knowledge/historical-frontend-upgrade-changelog.md` | move; mine reusable episodes/candidates | reference check | CONVERT_TO_MEMORY + CONVERT_TO_DOCUMENTATION (move) |
| `config/` | policy | agent/app policies | canonical | engine | source | no | none | (unchanged) | add release-coverage-policy, retry-policy, knowledge-priority | validate | KEEP_AS_CANONICAL |
| `docs/` | doc | architecture/operations/refactor | canonical | developers | source | no | none | (unchanged) | add release-knowledge docs + assets | layout test | KEEP_AS_CANONICAL |
| `evals/` | eval | agent behaviour scenarios + fixtures | canonical | run-evals | mixed | fixtures also used by tests | none | keep evals; fixtures shared via `tests/fixtures` or reused | separate deterministic tests into `tests/` | run-evals | KEEP_AS_CANONICAL (+ add tests/) |
| `Knowledge/` | knowledge | vendor migration KB (human-readable) | canonical | agents/docs | source | no | none | `knowledge/` (lowercase) + `knowledge/canonical/...` | rename; convert to structured YAML canonical; keep md as derived | layout test (Knowledge/ forbidden) | MOVE + CONVERT_TO_STRUCTURED_KNOWLEDGE |
| `Knowledge/version-manifest.json` | knowledge | version matrix | canonical | resolver | source | no | none | `knowledge/canonical/versions/version-manifest.json` | move; consumed by resolver | tests | MOVE / KEEP_AS_CANONICAL |
| `Templates/` | template | plan/report templates | canonical | documentation | source | no | none | `templates/` (lowercase) | rename; update refs | layout test (Templates/ forbidden) | MOVE |
| `runs/` | generated | per-run state/evidence | generated | agent | generated | no | may contain client data | (unchanged) | gitignore contents; keep placeholder | layout test | EXCLUDE_AS_GENERATED |
| `schemas/` | schema | draft-07 schemas | canonical | validate | source | no | none | (unchanged) | add release-requirement, appsettings, requirement-coverage schemas | validate | KEEP_AS_CANONICAL |
| `skills/` | skill | 12 skills + registry | canonical | engine | source | no | none | (unchanged) | rename derive-core-requirements->derive-release-requirements; reference req IDs | validate/skills.test | KEEP_AS_CANONICAL |
| `tools/` | source+test | CLI, lib engine, tests | canonical | node | source | tests mixed with tools | none | move deterministic tests to `tests/`; keep wrappers/adapters in tools | tests | KEEP_AS_CANONICAL (+ reorganize) |
| `tools/lib/*.js` | source | business logic modules | canonical | CLI | source | no | none | keep in `tools/lib/` (Node convention, mirrors Backend-Upgrade which has no src/) | add release-knowledge modules | tests | KEEP_AS_CANONICAL |
| `tools/{validate,skills.test,repo-layout.test,run-evals}.js` | test/tooling | validators + evals | canonical | node | source | evals vs tests boundary | none | deterministic tests -> `tests/`; evals stay | run all | MOVE (partial) |

## Notes on the target-architecture adaptation

The task's target tree is expressed in .NET terms (`.config/dotnet-tools.json`, C#-style
`src/`, `IInterface` names). **This project is Node.js/CommonJS** and deliberately mirrors
the sibling `Backend-Upgrade/`, which keeps business logic under `tools/lib/` with **no
`src/` tree and no dotnet manifest**. Per the task instruction "use the existing project
language and conventions" and "adapt names to current project conventions", the adaptation
is:

- `src/<domain>/` -> `tools/lib/<domain>.js` modules with single, explicit responsibilities.
- `.config/dotnet-tools.json` -> **not applicable** (no .NET tooling); omitted deliberately.
- `IReleaseKnowledgeStore` etc. -> plain CommonJS modules exporting a small API surface.
- `tests/` -> new top-level `tests/` dir for deterministic Node tests (moved out of `evals/`).

# Tool capabilities — lazy activation

Skills request **capabilities**, not executables. Capabilities resolve to validated
tools via the tool manifest (`runs/_bootstrap/tool-manifest.json`) and the wrappers
under `tools/wrappers/`. Do not install every tool up front.

## Levels
| Level | What | Install? |
|-------|------|----------|
| 0 | repository inspection (read structure/manifests/config, search, read approved knowledge, create plan + uncertainty records, validate JSON) | none |
| 1 | normal dev prerequisites (Git, .NET SDK, Node.js, npm/pnpm/Yarn) | checked per detected tech; never auto-installed |
| 2 | local research tools (ApiCompat, ILSpyCmd, TypeScript scanner, ts-morph, Roslyn scanner) | repository-local / run-local, **only when an approved plan requires** |
| 3 | deep research (containers, runtime tracing, generated reference projects, binary analysis) | only when standard research cannot resolve HIGH/CRITICAL uncertainty |

Optional Level 2/3 tools being absent must **never** block planning
(`engine.planningReadiness` returns `READY_FOR_PLANNING` on Level 0/1 alone).

## Before activating a missing capability, record
capability; reason required; uncertainty it resolves; selected tool; installation
scope; client files affected (must be none for research); installation policy;
fallback options. Use the least expensive sufficient capability.

- Do not install ILSpyCmd speculatively.
- Do not install ApiCompat if package metadata + a compile probe already suffice.

## Missing prerequisite guidance
If a Level 1 prerequisite is missing, the doctor/plan output states: the missing
prerequisite, why it is required, recommended installation guidance, the current
checkpoint, and the exact resume command. The agent never `sudo`-installs system
prerequisites.

## Capability names (examples)
`acquire-nuget-package`, `inspect-nuget-metadata`, `restore-nuget-dependency-graph`,
`compare-package-content`, `inspect-dotnet-public-api`, `compare-dotnet-public-api`,
`selectively-decompile-dotnet`, `scan-csharp-symbols`, `acquire-npm-package`,
`inspect-npm-registry-metadata`, `compare-npm-package-content`, `typecheck-typescript`,
`inspect-angular-workspace`, `scan-typescript-symbols`, `build-angular-development`,
`build-angular-production`, `create-git-checkpoint`, `create-git-worktree`, `run-tests`,
`validate-json-schema`. Level map: `tools/skills/lib/engine.js#CAPABILITY_LEVEL`.

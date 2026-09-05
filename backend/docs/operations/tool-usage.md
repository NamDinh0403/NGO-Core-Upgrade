# Tool Usage

Future agents must request **capabilities** and invoke **wrappers** — never
construct ad-hoc shell commands or install research packages into the client.

## Read the manifest first

```
node tools/upgrade-agent.js tools manifest
# or read: runs/_bootstrap/tool-manifest.json
```

A tool is usable only when its `status` is `AVAILABLE` and both
`validation.versionCheck` and `validation.smokeTest` are `PASSED`.

## Capability → wrapper map

| Capability | Wrapper |
|-----------|---------|
| acquire-nuget-package | `tools/wrappers/nuget` |
| restore/build/test .NET | `tools/wrappers/dotnet` |
| compare-dotnet-public-api | `tools/wrappers/api-compat` |
| inspect / selectively-decompile .NET | `tools/wrappers/ilspy` (policy-gated) |
| acquire-npm-package / registry metadata | `tools/wrappers/npm` |
| typecheck-typescript | `tools/wrappers/typescript` |
| inspect-angular-workspace | `tools/wrappers/angular` |
| search-repository | `tools/wrappers/repository-search` (ripgrep, git-grep fallback) |

Each wrapper returns a structured `tool-execution-result` JSON: status, exit
code, hashed stdout/stderr artifacts, tool version, and a recommended next
action. Full output is saved under `runs/_bootstrap/wrapper-logs/`.

## Rules

- Never invoke unpinned "latest" tooling (`npx <pkg>` without an exact version).
- Never treat package installation as compatibility proof — use ApiCompat/decompile evidence.
- Never bypass a wrapper that reports `REFUSED_CLIENT_MUTATION` or a failed validation.
- Use selective decompilation only when the `decompilation-permitted` policy gate is on.
- Save every output as an artifact.
- Escalate when a required capability stays unavailable.

## Example

```
# acquire a package for research (never added to the client project)
node tools/wrappers/nuget install NGO.Core.Services -Version 8.0.0 -OutputDirectory <isolated>
# compare public API of two assemblies
node tools/wrappers/api-compat <left.dll> <right.dll>
```

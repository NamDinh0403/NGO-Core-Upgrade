# Tool Bootstrap

TOOL_BOOTSTRAP prepares and validates the research tooling the agent needs
*before* any package research, decompilation, build analysis, or front-end
analysis. It never modifies the client application's dependency files.

## Run it

```
# any of:
node tools/upgrade-agent.js tools bootstrap      # cross-platform
pwsh tools/upgrade-agent.ps1 tools bootstrap     # PowerShell shim
./tools/upgrade-agent tools bootstrap            # POSIX shim
```

Other commands: `tools check`, `tools install-missing`, `tools validate`,
`tools manifest`, `tools doctor`.

## What it does

1. Detects OS, architecture, shell, SDKs, package managers, container support.
2. Computes applicable tool requirements from `config/tool-requirements.yaml`
   using repository evidence (`*.sln/*.csproj`, `package.json`, `angular.json`, `tsconfig`).
3. Checks each tool (path, version, minimum, conflicts).
4. Installs only permitted + applicable missing tools (repository-local / run-local).
5. Runs a smoke test per capability.
6. Writes durable artifacts under `runs/_bootstrap/<run-id>/`:
   `tool-checks.json`, `tool-manifest.json`, `tool-installation-log.jsonl`,
   and a `developer-escalation.md` when a required capability is unavailable.
7. Returns a non-zero exit code when a REQUIRED capability is missing.

## Automatic vs manual installation

- **Automatic (permitted):** `.NET` local tools (`Microsoft.DotNet.ApiCompat.Tool`,
  `ilspycmd`) into `.config/dotnet-tools.json`; isolated npm dev tooling
  (`typescript`, `@angular/cli`) into `tools/frontend-runtime/` — only when a
  matching client is present. That directory is generated per run and is
  git-ignored: npm tool versions are resolved from the client repository
  (`versionSource: client-compatible`) and never committed.
- **Manual (escalated):** the .NET SDK, Node.js, Git, certificates, private-feed
  access, or anything needing administrator rights. The bootstrap never uses
  `sudo`, never installs machine-global tools, and never edits machine PATH.

## Private feeds, proxies, certificates

If a NuGet feed or npm registry requires credentials, a proxy, or a custom
certificate that is not already configured, installation stops and an escalation
is written. Configure the credential/cert outside the agent (per your org's
process) and re-run `tools bootstrap`. Secrets are never written to logs or the
manifest.

## Restore local tools

```
dotnet tool restore     # restores tools pinned in .config/dotnet-tools.json
```

## Update pinned versions

Edit `.config/dotnet-tools.json` for .NET tools. npm tool versions are not pinned in
this repository: they are read from the client repository's `package.json`
(`typescript`, `@angular/cli`) each run. If neither a client version nor an explicit
`pinnedVersion` can be resolved, the bootstrap reports `INSTALLATION_BLOCKED` rather
than installing an arbitrary release. To override, set `installation.pinnedVersion`
in `config/tool-requirements.yaml`, then re-run `tools bootstrap`. Record the decision
in the run's installation log.

## Approve a new tool source

Add the registry/feed to `config/tool-installation-policy.yaml`
(`sources.allowedNuGetSources` / `allowedNpmRegistries`). Arbitrary URL downloads
are forbidden.

## Remove run-local tools and caches

Delete `runs/_bootstrap/` (bootstrap artifacts) and `tools/frontend-runtime/`
(isolated npm tooling, regenerated on the next run). `.config/dotnet-tools.json` can
be reset with `dotnet new tool-manifest --force`.

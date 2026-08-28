# Tool bootstrap, capability discovery, and enforced tool usage

Before performing package research, version comparison, client modification,
decompilation, build analysis, or front-end analysis, implement and execute a
TOOL_BOOTSTRAP phase.

The workflow must not assume that required tools are already installed.

The TOOL_BOOTSTRAP phase must:

1. Detect the current operating system, architecture, shell, installed SDKs,
   available package managers, container support, and repository technology.
2. Determine which capabilities are required for the current repository.
3. Check whether each required tool exists.
4. Check the installed version of every discovered tool.
5. Compare discovered versions against configurable minimum and recommended
   versions.
6. Install missing tools when installation is safe and permitted.
7. Prefer repository-local, run-local, or container-local installation over
   machine-global installation.
8. Validate each discovered or installed tool with a smoke test.
9. Record the executable path, version, source, installation scope, validation
   status, and capabilities in a machine-readable tool manifest.
10. Generate wrappers or adapters so future agents invoke tools consistently.
11. Update AGENTS.md and operational documentation with exact tool usage.
12. Block the workflow with an actionable developer escalation if a required
    capability cannot be installed or validated.

Do not modify the client application's project files, solution files,
package.json, lockfiles, source files, or normal dependency configuration while
installing research tooling.

Tool installation is infrastructure setup and must remain separate from package
upgrade changes.

# Required implementation files

Create or adapt the following structure:

    config/
    ├── tool-requirements.yaml
    ├── tool-installation-policy.yaml
    └── tool-capabilities.yaml

    schemas/
    ├── tool-manifest.schema.json
    ├── tool-check-result.schema.json
    └── tool-execution-result.schema.json

    tools/
    ├── bootstrap/
    │   ├── check-tools
    │   ├── install-tools
    │   ├── validate-tools
    │   └── generate-tool-manifest
    ├── wrappers/
    │   ├── nuget
    │   ├── dotnet
    │   ├── api-compat
    │   ├── ilspy
    │   ├── npm
    │   ├── typescript
    │   ├── angular
    │   └── repository-search
    └── README.md

    .config/
    └── dotnet-tools.json

    runs/<client>/<run-id>/
    ├── tool-checks.json
    ├── tool-manifest.json
    └── tool-installation-log.jsonl

If an equivalent structure already exists, extend it instead of creating a
duplicate implementation.

# Installation safety policy

Implement the following default policy:

- Never use administrator or root privileges automatically.
- Never run sudo automatically.
- Never modify machine-wide PATH automatically.
- Never install a global npm package unless explicitly permitted by policy.
- Never install a global .NET tool unless a local tool manifest is impossible
  and policy explicitly permits a global installation.
- Never modify the client solution to install a research tool.
- Never store feed credentials, npm tokens, access tokens, passwords, or secret
  environment values in logs or manifests.
- Never download executable tools from an unverified arbitrary URL.
- Prefer official registries, approved internal feeds, operating-system package
  managers, or existing container images.
- Pin tool versions where practical.
- Record package source, version, and integrity information.
- Use an isolated cache and temporary directory for research tools.
- Treat package lifecycle scripts as potentially mutating or unsafe.
- Do not enable automatic decompilation unless policy permits it.
- Do not continue with an unvalidated executable.
- Do not silently replace a missing tool with an LLM-based approximation.

If installation requires administrator access, license acceptance, unavailable
credentials, proxy changes, certificate changes, or security-policy approval,
do not work around the restriction. Generate a developer escalation containing
the exact missing capability, attempted installation, error, and manual command
or action required.

# Tool scopes

Use these installation scopes in priority order:

1. EXISTING_APPROVED
   A valid existing executable available in the environment.

2. REPOSITORY_LOCAL
   A tool version pinned inside this repository, such as a local .NET tool
   manifest.

3. RUN_LOCAL
   A tool installed in the isolated research or execution directory.

4. CONTAINER_LOCAL
   A tool installed in a pinned disposable container image.

5. USER_LOCAL
   A tool installed for the current user only.

6. MACHINE_GLOBAL
   Allowed only by explicit policy.

Record the selected scope for every tool.

# Capability-based requirements

Do not depend only on specific product names.

Represent requirements as capabilities. Example capabilities include:

- acquire-nuget-package
- restore-nuget-dependency-graph
- extract-archive
- compare-package-content
- compare-dotnet-public-api
- inspect-dotnet-assembly-metadata
- selectively-decompile-dotnet
- scan-csharp-symbols
- acquire-npm-package
- inspect-npm-registry-metadata
- compare-npm-package-content
- install-isolated-npm-dependencies
- typecheck-typescript
- inspect-angular-workspace
- run-angular-build
- scan-typescript-symbols
- search-repository
- create-git-worktree
- validate-json-schema
- generate-sbom

A tool may provide more than one capability.

The workflow should request a capability from the tool registry rather than
hardcoding an executable in every prompt or workflow phase.

For example:

    capability: compare-dotnet-public-api

may resolve to:

    tool: Microsoft.DotNet.ApiCompat.Tool
    wrapper: tools/wrappers/api-compat
    executable: dotnet
    argumentsPrefix:
      - tool
      - run
      - apicompat

# Default tool requirements

Create config/tool-requirements.yaml with requirements appropriate to the
repository.

For a .NET and Angular/TypeScript repository, assess and support at least these
tools:

## Core environment

- Git
- .NET SDK
- Node.js
- npm
- an archive extractor
- a fast repository search tool
- JSON Schema validation support

## Backend research

- NuGet CLI or an equivalent approved NuGet acquisition implementation
- dotnet restore
- Microsoft.DotNet.ApiCompat.Tool
- ILSpyCmd for selective decompilation when permitted
- a Roslyn-based solution and symbol scanner
- optional NuGet Package Explorer for developer-driven manual inspection

## Front-end research

- npm view
- npm pack
- npm diff
- npm ci
- TypeScript compiler
- Angular CLI when Angular is detected
- a TypeScript semantic scanner using the TypeScript Compiler API or ts-morph
- a custom Angular workspace inspector

## Isolation and verification

- Git worktree support
- container runtime when available and permitted
- test result parsers
- checksum utilities
- process timeout support

Do not require Angular CLI when no Angular workspace is detected.
Do not require ILSpy when no managed .NET packages are involved.
Do not require a container runtime when local isolation is sufficient.

Classify every tool as:

- REQUIRED
- REQUIRED_IF_APPLICABLE
- RECOMMENDED
- OPTIONAL
- FORBIDDEN

# Example tool requirements shape

Use a structure similar to:

    schemaVersion: 1

    tools:
      - id: git
        classification: REQUIRED
        capabilities:
          - repository-version-control
          - create-git-worktree
          - generate-diff
        commands:
          detect:
            - git
            - --version
        minimumVersion: null
        installScopePreference:
          - EXISTING_APPROVED
          - USER_LOCAL
        autoInstall: false

      - id: dotnet-sdk
        classification: REQUIRED_IF_APPLICABLE
        appliesWhen:
          repositoryContains:
            - "*.sln"
            - "*.slnx"
            - "*.csproj"
        capabilities:
          - restore-nuget-dependency-graph
          - build-dotnet
          - test-dotnet
          - run-local-dotnet-tools
        commands:
          detect:
            - dotnet
            - --info
        autoInstall: false

      - id: dotnet-apicompat
        classification: REQUIRED_IF_APPLICABLE
        appliesWhen:
          managedPackageComparison: true
        capabilities:
          - compare-dotnet-public-api
        installation:
          type: dotnet-local-tool
          package: Microsoft.DotNet.ApiCompat.Tool
          pinnedVersion: SET_A_TESTED_VERSION
        installScopePreference:
          - REPOSITORY_LOCAL
          - RUN_LOCAL
        autoInstall: true

      - id: ilspycmd
        classification: REQUIRED_IF_APPLICABLE
        appliesWhen:
          selectiveDecompilationApproved: true
        capabilities:
          - inspect-dotnet-assembly-metadata
          - selectively-decompile-dotnet
        installation:
          type: dotnet-local-tool
          package: ilspycmd
          pinnedVersion: SET_A_TESTED_VERSION
        autoInstall: true
        policyGate:
          - decompilation-permitted

      - id: npm
        classification: REQUIRED_IF_APPLICABLE
        appliesWhen:
          repositoryContains:
            - package.json
        capabilities:
          - inspect-npm-registry-metadata
          - acquire-npm-package
          - compare-npm-package-content
          - install-isolated-npm-dependencies
        commands:
          detect:
            - npm
            - --version
        autoInstall: false

      - id: typescript
        classification: REQUIRED_IF_APPLICABLE
        appliesWhen:
          typescriptDetected: true
        capabilities:
          - typecheck-typescript
          - scan-typescript-symbols
        installation:
          type: isolated-npm-dev-dependency
          package: typescript
          versionSource: client-compatible
        autoInstall: true
        clientMutationAllowed: false

Do not use placeholder versions in the final implementation. Determine tested,
compatible versions from the environment and tool documentation, pin them, and
record the decision.

# Tool discovery rules

For each tool:

1. Resolve all candidate executables.
2. Record the executable path.
3. Execute a non-mutating version command.
4. Parse the version into a normalized value when possible.
5. Check architecture and platform compatibility.
6. Compare the discovered version with policy.
7. Check whether the tool comes from an approved location.
8. Detect conflicting installations.
9. Select one installation deterministically.
10. Run a smoke test.
11. Record the result.

Do not rely only on PATH.

Also inspect common local locations, including:

- repository-local tool manifests
- repository-local node_modules/.bin
- run-local bin directories
- configured SDK locations
- configured package-manager paths
- approved container images

If multiple installations exist, select according to:

1. Repository-pinned version.
2. Approved exact version.
3. Compatible existing user installation.
4. Approved container version.
5. Other permitted fallback.

Record why the selected installation was chosen.

# Local .NET tool installation

When the repository uses .NET and a local tool manifest is appropriate:

1. Create or reuse .config/dotnet-tools.json.
2. Install tools as local .NET tools.
3. Pin versions.
4. Restore tools using the manifest.
5. Invoke tools through `dotnet tool run` or an approved wrapper.
6. Do not install global .NET tools by default.

Use a workflow equivalent to:

    dotnet new tool-manifest

only if no manifest exists.

Then use a workflow equivalent to:

    dotnet tool install <package> --version <tested-version>

or update the existing manifest safely.

After installation, execute:

    dotnet tool restore

Then validate each tool through its non-mutating help or version command and a
small controlled fixture.

Do not assume the command name from the package name. Read the resulting tool
manifest and validate the actual command.

# Node and npm tool installation

Do not add research tools to the client package.json by default.

Prefer one of these approaches:

1. Use an existing repository-pinned tool when compatible.
2. Create a separate tools/frontend/package.json under the agent tooling area.
3. Install tools in a run-local research workspace.
4. Use an approved pinned container image.

Example isolated location:

    tools/frontend-runtime/
    ├── package.json
    ├── package-lock.json
    └── node_modules/

This tooling package must be separate from the client application's package
manifest and lockfile.

Use exact versions for autonomous tooling. Generate and retain a lockfile.

Use `npm ci` after the tooling lockfile exists.

Do not use an unpinned `npx` command that silently downloads the latest package.
If npx is used, require an exact package version or resolve the command from an
existing pinned local dependency.

Run package lifecycle scripts only when required and approved. Record whether
scripts were enabled.

Angular CLI version selection must be compatible with the Angular version being
researched. Do not automatically use the globally installed latest Angular CLI.

# NuGet acquisition tool

The package acquisition wrapper must support:

- package ID
- exact package version
- approved package source
- optional approved configuration file
- isolated output directory
- direct download where supported
- noninteractive execution
- process timeout
- exit-code capture
- stdout and stderr capture
- token and credential redaction
- artifact hashing
- package provenance recording

The wrapper must never add the package to a client project during research.

# npm acquisition tool

The npm acquisition wrapper must support:

- exact package specification
- approved registry
- isolated tarball destination
- JSON output
- process timeout
- exit-code capture
- stdout and stderr capture
- token and credential redaction
- tarball hashing
- package provenance recording

The wrapper must use retrieval operations such as registry metadata inspection
and tarball acquisition. It must not run npm install in the client repository
during package discovery.

# Smoke tests

A successful version command is not enough.

Implement controlled smoke tests for important capabilities.

Examples:

## NuGet acquisition

- Acquire a known permitted package or the requested target package.
- Verify that the expected package artifact exists.
- Verify that the artifact can be opened.
- Verify the package ID and version.
- Record a checksum.

## ApiCompat

- Compare two tiny fixture assemblies or fixture packages.
- Confirm that a known removed public API produces an incompatibility result.
- Confirm that the output parser captures the incompatibility.

## ILSpyCmd

- Inspect a small permitted fixture assembly.
- Confirm that type listing works.
- Do not use client assemblies for the bootstrap smoke test.

## npm pack

- Acquire a known permitted fixture or requested package version.
- Confirm that a tarball is produced.
- Confirm that package/package.json can be extracted.
- Confirm package name and version.

## TypeScript

- Compile a tiny fixture using --noEmit.
- Confirm that a known type error is reported.
- Confirm that the output parser captures file, line, and error code.

## Angular workspace inspector

- Inspect both an NgModule fixture and a standalone fixture.
- Confirm correct bootstrap classification.
- Confirm tsconfig inheritance and environment replacements are resolved.

## Git worktree

- Check whether the repository and current environment support worktrees.
- Do not create a permanent worktree during a simple version check.
- Use a temporary fixture or controlled dry run where possible.

A tool is AVAILABLE only when detection, version validation, and smoke testing
all pass.

# Tool manifest

Generate a manifest similar to:

    {
      "schemaVersion": "1.0",
      "generatedAt": "ISO-8601-UTC",
      "platform": {
        "os": "...",
        "architecture": "...",
        "shell": "..."
      },
      "tools": [
        {
          "id": "dotnet-apicompat",
          "status": "AVAILABLE",
          "classification": "REQUIRED_IF_APPLICABLE",
          "version": "...",
          "executable": "...",
          "scope": "REPOSITORY_LOCAL",
          "source": "...",
          "capabilities": [
            "compare-dotnet-public-api"
          ],
          "validation": {
            "versionCheck": "PASSED",
            "smokeTest": "PASSED",
            "validatedAt": "ISO-8601-UTC"
          }
        }
      ],
      "missingRequiredCapabilities": [],
      "warnings": []
    }

Allowed tool statuses must include:

- AVAILABLE
- AVAILABLE_WITH_WARNING
- MISSING
- INSTALLATION_REQUIRED
- INSTALLATION_BLOCKED
- VERSION_TOO_OLD
- VERSION_UNSUPPORTED
- VALIDATION_FAILED
- POLICY_BLOCKED
- NOT_APPLICABLE

# Tool execution wrappers

Do not tell agents to construct arbitrary shell commands repeatedly.

Implement wrappers that:

- resolve the selected executable from the manifest
- validate arguments
- enforce allowed working directories
- prevent client mutation during research
- set timeouts
- capture exit code
- capture stdout and stderr
- redact secrets
- save full logs as artifacts
- return structured JSON
- record the tool version
- record exact package versions
- record the current workflow phase
- calculate artifact hashes
- update event history
- provide a normalized status

A wrapper result should resemble:

    {
      "schemaVersion": "1.0",
      "toolId": "npm-pack",
      "toolVersion": "...",
      "capability": "acquire-npm-package",
      "status": "SUCCEEDED",
      "workingDirectory": "<sanitized-path>",
      "startedAt": "...",
      "completedAt": "...",
      "exitCode": 0,
      "artifacts": [
        {
          "path": "...",
          "sha256": "..."
        }
      ],
      "stdoutArtifact": "...",
      "stderrArtifact": "...",
      "warnings": [],
      "nextRecommendedAction": "extract-package"
    }

Future agents must invoke wrappers rather than bypassing them unless the wrapper
itself is unavailable and the workflow has entered an approved recovery path.

# Enforce tool usage in workflows

Update workflow phases with required capabilities.

For example:

    VERSION_RESEARCH:
      requiredCapabilities:
        - acquire-nuget-package
        - compare-package-content
        - compare-dotnet-public-api
        - acquire-npm-package
        - inspect-npm-registry-metadata
        - typecheck-typescript

      optionalCapabilities:
        - selectively-decompile-dotnet

      preconditions:
        - toolBootstrap.status == PASSED
        - requiredCapabilities.status == AVAILABLE

      blockedWhen:
        - anyRequiredCapabilityMissing
        - anyRequiredToolValidationFailed
        - requiredCredentialUnavailable

The workflow engine must resolve each required capability through
tool-manifest.json before starting the phase.

If a required capability is unavailable:

1. Attempt installation if policy allows.
2. Validate the installed tool.
3. Retry capability resolution.
4. If still unavailable, create a developer escalation.
5. Mark the phase BLOCKED_NEEDS_DEVELOPER or BLOCKED_NEEDS_CONTEXT.
6. Save an exact resume instruction.

Do not allow an LLM to declare that a required technical check was completed
without a successful structured tool result.

# Tell future agents how to use the tools

Update AGENTS.md with a concise section that states:

- Run TOOL_BOOTSTRAP before VERSION_RESEARCH.
- Read runs/<client>/<run-id>/tool-manifest.json.
- Request capabilities, not arbitrary executable names.
- Invoke approved wrappers under tools/wrappers/.
- Never install research packages into the client solution during discovery.
- Never invoke unpinned latest package tooling.
- Never bypass a failed tool validation.
- Never treat package installation as compatibility proof.
- Save every output as an artifact.
- Use selective decompilation only after the policy gate passes.
- Escalate when a required capability remains unavailable.

Also create:

    docs/operations/tool-bootstrap.md
    docs/operations/tool-usage.md
    docs/operations/tool-troubleshooting.md

Document:

- automatic installation behavior
- manual installation behavior
- private-feed authentication expectations
- proxy and certificate limitations
- how to restore local tools
- how to validate the environment
- how to update pinned tool versions
- how to approve a new tool source
- how to remove run-local tools and caches
- how to inspect failed tool installation
- how to resume after installation is completed manually

# Required commands or entry points

Provide stable repository entry points appropriate to the existing technology.

The repository should expose equivalent operations for:

    tools bootstrap
    tools check
    tools install-missing
    tools validate
    tools manifest
    tools doctor

Prefer one consistent entry point, for example:

    ./upgrade-agent tools bootstrap
    ./upgrade-agent tools doctor

or the appropriate PowerShell and cross-platform equivalents.

If the repository must support Windows and Linux, provide a cross-platform
implementation rather than duplicating business logic in unrelated shell
scripts.

The command:

    tools bootstrap

must:

1. Detect the repository technology.
2. Calculate applicable tool requirements.
3. Check tools.
4. Install permitted missing tools.
5. Validate tools.
6. Write the manifest.
7. Return a nonzero exit code when a required capability is unavailable.
8. Print a concise summary for the developer.

The command:

    tools doctor

must perform no client source modification. It should provide diagnosis,
versions, failed validation, required action, and applicable resume
instructions.

# Tool bootstrap workflow state

Add TOOL_BOOTSTRAP before VERSION_KNOWLEDGE_CHECK:

    DISCOVERY
      -> TOOL_BOOTSTRAP
      -> VERSION_KNOWLEDGE_CHECK
          -> VERSION_RESEARCH when necessary
          -> PLAN when approved knowledge is sufficient

TOOL_BOOTSTRAP must finish with one of:

- SUCCEEDED
- RETRYABLE_FAILURE
- BLOCKED_NEEDS_CONTEXT
- BLOCKED_NEEDS_DEVELOPER
- FAILED_POLICY
- FAILED_BUDGET

After every installation attempt:

- append an event
- save the command in redacted form
- save stdout and stderr
- record the exit code
- update the tool manifest
- write a checkpoint
- determine the next action

# Required tests

Add automated tests for:

1. All required tools already available.
2. One repository-local .NET tool missing and installed successfully.
3. One run-local npm tool missing and installed successfully.
4. Required SDK missing and automatic installation forbidden.
5. Installed tool version below minimum.
6. Multiple versions found and repository-pinned version selected.
7. Tool version command succeeds but smoke test fails.
8. Tool installation requires administrator access.
9. Private feed credentials unavailable.
10. Tool output contains a token and the token is redacted.
11. Angular not detected and Angular tools marked NOT_APPLICABLE.
12. .NET not detected and .NET analysis tools marked NOT_APPLICABLE.
13. Decompilation forbidden by policy.
14. Required capability unavailable and workflow blocked.
15. Tool becomes available after manual installation and workflow resumes.
16. Research wrapper refuses to modify the client project.
17. Agent attempts to bypass the wrapper and policy rejects the action.
18. Tool installation does not modify client project manifests or lockfiles.
19. Bootstrap can be rerun safely without reinstalling valid tools.
20. Tool manifest passes schema validation.

# Final validation

Before declaring this work complete:

- Execute the tool bootstrap command.
- Inspect the generated manifest.
- Validate every required capability.
- Confirm exact executable paths and versions.
- Run all smoke tests.
- Confirm that missing optional tools do not block unrelated workflows.
- Confirm that missing required tools do block the relevant workflow.
- Confirm that installation does not modify client package manifests,
  solution files, project files, source code, or client lockfiles.
- Confirm that wrappers preserve full evidence and return structured results.
- Confirm that secrets are redacted.
- Confirm that AGENTS.md tells future agents to use the wrappers.
- Confirm that VERSION_RESEARCH cannot begin without required capabilities.
- Confirm that the workflow can resume after a tool is manually installed.

Implement this phase; do not only document suggested commands.
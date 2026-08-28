# Phase 01b — Tool Bootstrap

- **Phase ID:** `01b-tool-bootstrap`
- **State:** `TOOL_BOOTSTRAP`
- **Implementation:** `tools/upgrade-agent.js tools bootstrap` (see `docs/operations/tool-bootstrap.md`)

## Purpose
Prepare and validate the research tooling required before any package research,
decompilation, build analysis, or front-end analysis. Runs before BASELINE.

## Required inputs
`inventory.json` (repository evidence), `config/tool-requirements.yaml`, `config/tool-installation-policy.yaml`.

## Preconditions
Discovery completed. The client's dependency files must not be modified by this phase.

## Required actions
1. Detect OS/arch/shell/SDKs/package managers/container support.
2. Compute applicable tool requirements from repository evidence.
3. Check each tool (path, version, minimum, conflicts).
4. Install only permitted + applicable missing tools (repository-local / run-local).
5. Smoke-test each capability.
6. Write `tool-checks.json`, `tool-manifest.json`, `tool-installation-log.jsonl` into the run directory.

## Allowed tools
`git`, `dotnet` (local tools), `npm` (isolated tooling), `node`, `tar`, `docker`. Never `sudo`, never machine-global, never client dependency files.

## Required evidence
The generated `tool-manifest.json` with per-tool version + validation status.

## Required outputs
A tool manifest where every **required** capability is `AVAILABLE`.

## Completion criteria
`missingRequiredCapabilities` is empty; bootstrap status `SUCCEEDED`; `nextAction = "Load phases/02-baseline.md"`.

## Documentation responsibilities
Record the tool manifest path and any installation decisions in `state.json`.

## Checkpoint requirements
Checkpoint after each installation attempt and after the manifest is written.

## Retry behaviour
Transient install/network failures are `RETRYABLE_FAILURE` within policy budget; the bootstrap is idempotent and does not reinstall valid tools.

## Escalation conditions
- A required system prerequisite (.NET SDK, Node.js, Git) is missing and auto-install is forbidden → `BLOCKED_NEEDS_DEVELOPER`.
- Private-feed credentials / proxy / certificate / admin rights required → `BLOCKED_NEEDS_DEVELOPER` (an escalation doc is generated).
- A required tool fails validation and cannot be repaired → `BLOCKED_NEEDS_DEVELOPER`.

## Allowed next states
`BASELINE`, or `HANDOVER` on a blocked status.

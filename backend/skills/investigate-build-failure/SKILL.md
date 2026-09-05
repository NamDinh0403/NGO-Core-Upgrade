---
name: investigate-build-failure
description: Diagnoses backend restore/build/compiler/MSBuild/dependency/runtime failures using evidence, not trial and error.
metadata:
  id: investigate-build-failure
  version: 1.0.0
  status: active
  risk: medium
  input-schema: schemas/input.schema.json
  output-schema: schemas/output.schema.json
---

# Purpose
Turn a build/runtime failure into one low-risk, evidence-supported corrective action,
verified by the smallest useful rebuild — within retry limits.

# Trigger conditions
- A restore, build, compiler, MSBuild, dependency, or startup failure occurred during execution.

# Exclusions
- Must not repeat an unchanged action, exceed retry policy, apply a rejected pattern, or treat candidate knowledge as authoritative.

# Preconditions
- Normalized failure evidence and a current checkpoint exist.

# Required capabilities
`read-repository`, `inspect-approved-knowledge` (Level 0).

# Optional capabilities
`restore-nuget-dependency-graph`, `build-dotnet`, `compare-dotnet-public-api`, `selectively-decompile-dotnet` (Level 2/3, only if evidence demands).

# Inputs
See `schemas/input.schema.json` — normalized failure, exact command, exit code, log artifact, plan, run state, package versions, changed files, previous attempts.

# Procedure
1. Normalize the failure signature. 2. Classify. 3. Determine pre-existing vs upgrade-introduced. 4. Retrieve approved error knowledge. 5. Retrieve approved fix patterns. 6. Retrieve relevant successful episodes. 7. Retrieve relevant failed attempts. 8. Inspect package/client evidence. 9. Rank causes. 10. Select one low-risk evidence-supported action. 11. Checkpoint. 12. Apply. 13. Rebuild the smallest useful verification. 14. Record outcome. 15. Continue / retry / research / escalate.

# Failure categories
package-resolution, feed-auth, target-framework, dependency-conflict, compiler-error, missing-symbol, changed-api, msbuild, generated-source, configuration, dependency-injection, database-migration, runtime-startup, test-regression, unknown.

# Evidence requirements
Every attempt records the evidence that justified it and the verification result.

# Uncertainty handling
If evidence is insufficient and impact is HIGH/CRITICAL → RESEARCH_REQUIRED (return via execute-upgrade / research-version).

# Completion criteria
Failure family resolved and verified, or retry budget reached → escalate. Status one of SUCCEEDED / RETRYABLE_FAILURE / RESEARCH_REQUIRED / BLOCKED_NEEDS_DEVELOPER / FAILED_BUDGET.

# Retry behavior
Enforces `config/escalation-policy.yaml` budgets (max attempts per identical fix; no repeated unchanged action). Preserves failed attempts.

# Escalation behavior
Budget exhausted or business decision required → `developer-escalation`.

# Outputs
See `schemas/output.schema.json` — failure classification, ranked causes, action taken, verification, attempt count, failed attempts preserved, nextAction.

# Allowed next skills
`execute-upgrade`, `research-version`, `developer-escalation`.

# Prohibited behavior
No unchanged retries. No rejected patterns. No unverified "success".

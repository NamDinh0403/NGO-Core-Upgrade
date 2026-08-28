# Developer Escalation — TOOL_BOOTSTRAP (_bootstrap-2026-08-13T10-32-32Z)

Status: `BLOCKED_NEEDS_DEVELOPER`

## Missing required capabilities
- repository-version-control
- create-git-worktree
- generate-diff

## Blocked tools and required action
### git — VALIDATION_FAILED
- Reason: resolved on PATH; approved existing installation
- Manual action: install/repair `git` (see docs/operations/tool-troubleshooting.md), then re-run `upgrade-agent tools bootstrap`.

## Safe resume instruction
After the missing prerequisite is installed manually, re-run `upgrade-agent tools bootstrap`. VERSION_RESEARCH remains blocked until the required capabilities resolve to AVAILABLE.

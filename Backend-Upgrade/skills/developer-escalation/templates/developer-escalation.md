# Developer Escalation — {ClientId} / {RunId}

> Actionable handoff. Never merely "automation could not continue."

## Context
- Run ID: `{RunId}`
- Workflow phase: `{phase}` · Current skill: `{skillId}`
- Current checkpoint: `{checkpointRef}`
- Repository safety state: `{clean | partially-modified-safe | needs-rollback}`

## Blocker
- Exact blocker: {what and where}
- Impact: {what is broken / not upgraded}
- Related uncertainty IDs: {U-...}

## What was attempted
| # | Action | Evidence | Result |
|---|--------|----------|--------|
| 1 | {action} | {ref} | {result} |

## Evidence inspected / tools used
- {evidence refs}
- Exact commands executed: {commands (redacted)}

## Changed / reverted files
- Changed: {list}
- Reverted: {list}

## Why automation cannot continue safely
{reason referencing config/escalation-policy.yaml}

## Decision or information required
{precise ask}

## Options
| Option | Risk | Notes |
|--------|------|-------|
| {A} | {risk} | {notes} |
- Recommended (if evidence supports one): {option}

## Safe rollback & resume
- Rollback instruction: {command}
- Safe resume point: checkpoint `{checkpointRef}`
- Exact resume command: `node tools/upgrade-agent.js resume --client {ClientId} --run {RunId}`

## Outcome
`{WAITING_FOR_CONTEXT | WAITING_FOR_DEVELOPER_DECISION | WAITING_FOR_APPROVAL | WAITING_FOR_TOOL | WAITING_FOR_CREDENTIAL | WAITING_FOR_VENDOR | TERMINAL_UNSAFE | CANCELLED}`

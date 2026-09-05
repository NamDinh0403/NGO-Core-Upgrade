# Planning — operations

Planning is **mandatory and read-only**. The `plan-upgrade` skill runs before any
client mutation and may write only under the run directory.

## Run it
```
node tools/upgrade-agent.js plan --client <id> --run <run-id>
# then execute skills/plan-upgrade/SKILL.md
```

## Client mutation (never during planning)
Planning must not change: solution/project files, package manifests/lockfiles,
source, application/front-end configuration, database migrations, deployment files,
or client documentation. It writes only:
```
runs/<client>/<run-id>/
├── plan.yaml
├── uncertainty-register.yaml
├── assumptions.yaml
├── repository-inventory.json
├── capability-requirements.json
└── planning-report.md
```

## The plan must include
objective; source/target Core version; repository inventory; detected technologies;
backend + front-end projects; package managers; existing references; lockfiles;
workspace config; bootstrap style; KNOWN facts; assumptions; uncertainty;
contradictions; missing info; known vs missing version knowledge; potential affected
areas; proposed phases; required research; required/optional/deferred capabilities;
expected file categories; verification strategy; rollback strategy; documentation
requirements; risks; escalation conditions; exact next action.

## Plan end-status
`READY` · `READY_WITH_ASSUMPTIONS` · `RESEARCH_REQUIRED` · `BLOCKED_NEEDS_CONTEXT` ·
`BLOCKED_NEEDS_DEVELOPER` · `FAILED_POLICY`.

Client mutation is permitted only for `READY`, or `READY_WITH_ASSUMPTIONS` when policy
explicitly permits the remaining assumptions.

---
name: developer-escalation
description: Backend compatibility adapter to the shared developer escalation procedure.
---
# Backend Escalation Adapter
Follow [shared escalation](../../../engine/skills/escalate/SKILL.md).
Supply backend installed-surface, package/restore/build/test/migration evidence.
Use this directory's input/output schemas and preserve exactResumeCommand.
The engine owns blocked state and retry policy; do not start another lifecycle.
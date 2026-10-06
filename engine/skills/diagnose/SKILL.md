---
name: shared-upgrade-diagnose
description: Diagnose a captured domain failure within one shared retry policy, using deterministic evidence before semantic reasoning.
---
# Procedure
1. Capture exact failure signature, command, logs, installed target surface and current checkpoint.
2. Check approved scoped patterns, preserving applicability/exclusions and rejected fixes. Candidates are never authoritative.
3. Use domain semantic diagnosis only for unresolved compatibility or ambiguous code. Select one smallest evidenced fix.
4. Record each changed attempt through the engine retry policy, rerun the narrow failing check, and preserve failures. Never repeat an unchanged command after the same failure.
5. On exhausted budget, required approval or unresolved blocking uncertainty, use the shared escalation procedure; do not silently stop.
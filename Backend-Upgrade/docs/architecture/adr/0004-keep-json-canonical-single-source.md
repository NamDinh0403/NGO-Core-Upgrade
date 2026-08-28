# ADR 0004 — Keep JSON as the canonical knowledge format

- Status: accepted
- Date: 2026-08-13

## Context
The target architecture sketch suggested YAML for some records. The existing
tooling and routing (`knowledge/index/routing-table.json` + granular `*.json`) already rely on
JSON, and the refactor brief warns against maintaining duplicate hand-edited YAML
and JSON representations of the same record.

## Decision
Keep canonical machine-consumed knowledge in JSON. Use YAML only for the new
human-authored policy/config files (`config/*.yaml`, `workflows/*.yaml`) where no
duplication exists. Provide JSON Schemas under `schemas/` for validation.

## Consequences
- No duplicate authoritative representations; single source of truth preserved.
- Validation is uniform via the dependency-free checker in `tools/validate.js`.

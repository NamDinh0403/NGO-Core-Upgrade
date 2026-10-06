# Orchestrator Compatibility

The implementation moved to [the shared engine](../engine/AGENTS.md).
This directory preserves existing CLI/import paths, integration tests and the
historical shared-run location. It does not coordinate independent track frameworks.

`node tools/orchestrator.js <command>` delegates to the engine. New runs use
registered plans, executor dispatch, bound validation evidence and one shared
coverage/handover/report flow. Historical result snapshots remain readable;
they cannot substitute for new engine-run evidence.

Run `node tests/orchestrator.test.js` here, or `node tools/validate-all.js` from
repository root. See [the refactor report](../docs/refactor/shared-engine-report.md)
for ownership, migrated files and compatibility limits.
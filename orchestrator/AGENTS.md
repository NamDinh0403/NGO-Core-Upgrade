# Orchestrator Compatibility

Follow [engine/AGENTS.md](../engine/AGENTS.md). The shared engine owns all generic
behavior; this directory preserves public CLI/import/skill paths and historical
shared run artifacts. It is not a separate orchestrator framework.

`node tools/orchestrator.js <command>` delegates to the engine implementation.
Old `tools/lib/*` imports are facades only. Track run files are domain evidence
and checkpoint projections, not independent lifecycle authorities.

Keep `node tests/orchestrator.test.js` as the existing compatibility/integration
suite. Root validation also exercises the new engine behavior and boundaries.
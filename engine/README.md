# Shared Upgrade Engine

Read [AGENTS.md](AGENTS.md) and the [lifecycle skill](skills/lifecycle/SKILL.md).
The engine owns generic lifecycle, planning/safety, executor dispatch, validation,
diagnosis/retry/recovery, memory, coverage, handover and reporting. It does not
implement NuGet/EF or Angular/NgRx source mutations.

Ingest provides one immutable CoreChangeSet; backend/frontend receive sliced
contexts and implement domain behavior. Track state-machine/CLI/skill paths are
compatibility adapters, not independent upgrade frameworks.

Run `node engine/tests/engine.test.js` or the existing complete validator
`node tools/validate-all.js` from repository root.
---
name: ingest-core-release
description: Compatibility adapter returning Core release analysis to the shared owner.
---
# Core Analysis Adapter
Follow [shared lifecycle](../../../engine/skills/lifecycle/SKILL.md).
Only the engine ensures Core ingestion. Consume the verified frontend context;
never independently ingest for an existing run. Use input/output schemas here
only to read historical skill results. Core remains read-only.
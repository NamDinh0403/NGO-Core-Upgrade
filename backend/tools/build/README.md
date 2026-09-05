# tools/build

Build invocation contract for Phase 05 (Build and Fix).

```
dotnet restore --force
dotnet build --no-restore
```

- Capture stdout/stderr to `runs/<client>/<run-id>/build.log`.
- Parse errors as `{ code, file, line, symbol }` and group by root-cause family.
- Emit one `observation` event per build with error count and families.
- A failing build is not a phase failure; it drives the bounded fix loop
  (`config/escalation-policy.yaml.budgets.maxBuildFixIterations`).

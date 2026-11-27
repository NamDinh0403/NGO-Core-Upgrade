# Definition of Done — Core Upgrade

A run may be marked `COMPLETE` only when **every** item is true. If implementation
items pass but documentation items do not, the status is `DOCUMENTATION_PENDING`,
never `COMPLETE`.

## Implementation
- [ ] Upgrade plan written before any mutation (`upgrade-plan-YYYY-MM-DD.md`).
- [ ] All `NGO.Core.*` packages and target frameworks updated to target version.
- [ ] `packages.lock.json` files handled.
- [ ] Required appsettings keys merged without overwriting client values.
- [ ] `dotnet restore --force` completed.
- [ ] `dotnet build --no-restore` reports 0 errors.
- [ ] Optional tests recorded as SKIPPED with the reason, or actual requested/diagnostic test results captured; no test files/projects created.
- [ ] Client EF migration/snapshot and SQL automatically generated/reviewed where a DbContext exists; no-change/empty outcomes recorded and generated code rebuilt.
- [ ] Destructive/data-semantic risks resolved or explicitly approved; database application left as a separately approved deployment step.
- [ ] No unresolved regressions versus baseline (or each is documented + escalated).

## Documentation (mandatory gate)
- [ ] Changed files recorded (`changed-files.json`).
- [ ] Configuration changes documented.
- [ ] Breaking changes documented.
- [ ] Deployment implications documented.
- [ ] Unresolved issues documented.
- [ ] Developer decisions recorded.
- [ ] Upgrade report generated (`upgrade-report-YYYY-MM-DD.md`) with Deviations-from-Plan section.
- [ ] `documentation-status.json` all-true.

## Closure
- [ ] Episode produced under `../engine/memory/episodes/backend/` (success or blocked).
- [ ] `state.json` carries exactly one terminal/blocked status and a non-empty `safeResumeInstruction`.

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
- [ ] Required tests executed (or `noTests` recorded).
- [ ] EF migration attempted where a DbContext exists.
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
- [ ] Episode produced under `memory/episodes/` (success or blocked).
- [ ] `state.json` carries exactly one terminal/blocked status and a non-empty `safeResumeInstruction`.

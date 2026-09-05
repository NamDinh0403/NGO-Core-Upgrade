# Checklist — Angular NgModule application

Classify each role: RESOLVED_AND_INSPECTED / NOT_APPLICABLE_WITH_EVIDENCE /
MISSING_BLOCKING / MISSING_NON_BLOCKING / REQUIRES_DEVELOPER. Resolve real paths
via `angular.json` + tsconfig inheritance; do not assume `app.module.ts`.

- [ ] Root `@NgModule` located (via bootstrap entry, not by filename guess)
- [ ] Root module `imports` reviewed for moved/renamed Core modules
- [ ] `providers` reviewed for changed DI tokens
- [ ] `forRoot()` registrations still valid for the target versions
- [ ] `HttpClientModule` / HTTP setup present and compatible
- [ ] HTTP interceptors registered and compatible
- [ ] State management (NgRx/other) module registration
- [ ] Translation/i18n setup (`forRoot`/loader)
- [ ] Animations module
- [ ] `APP_INITIALIZER` and other initializers
- [ ] Global `ErrorHandler`
- [ ] Routing module + root routes resolved
- [ ] Environment file replacements resolved via `angular.json` configurations
- [ ] Peer-dependency compatibility for the Angular target

Verification: dependency resolution, `tsc --noEmit`, framework compile, dev build,
prod build, tests, bootstrap smoke, routing smoke.

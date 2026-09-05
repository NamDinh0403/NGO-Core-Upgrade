# Checklist — Angular standalone application

Classify each role: RESOLVED_AND_INSPECTED / NOT_APPLICABLE_WITH_EVIDENCE /
MISSING_BLOCKING / MISSING_NON_BLOCKING / REQUIRES_DEVELOPER. Resolve real paths
via `angular.json` + tsconfig inheritance and the bootstrap entry.

- [ ] `bootstrapApplication(...)` entry located
- [ ] `ApplicationConfig` reviewed
- [ ] Provider functions (`provideRouter`, `provideHttpClient`, ...) present and compatible
- [ ] `importProvidersFrom(...)` for legacy modules still valid
- [ ] Root routes resolved (`provideRouter`)
- [ ] HTTP setup (`provideHttpClient(withInterceptors(...))`)
- [ ] Interceptors (functional or DI) registered
- [ ] State management providers
- [ ] Initializers (`provideAppInitializer` / `APP_INITIALIZER`)
- [ ] Zone configuration where applicable (`provideZoneChangeDetection` / zoneless)
- [ ] Environment file replacements resolved via `angular.json`
- [ ] Peer-dependency compatibility for the Angular target

Verification: dependency resolution, `tsc --noEmit`, framework compile, dev build,
prod build, tests, bootstrap smoke, routing smoke.

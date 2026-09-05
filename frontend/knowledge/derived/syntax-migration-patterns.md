# Syntax Migration Patterns

**Pattern-oriented catalogue for Phase 1 (TypeScript fix) and Phase 2 (build loop).**
**Verbatim source:** `upgrade-angular-10-15.pdf` §8.

Every pattern has a **detect** regex-like signature the agent scans for, and an **apply** transform that replaces it. Patterns are ordered by how frequently they appear in real client migrations.

---

## 1. NgRx `@Effect()` → `createEffect()`

**Scope:** `**/*.effects.ts`
**Risk:** `AUTO_WITH_WARNING` (rewrite must preserve inner pipe operators verbatim)

### Detect

```typescript
@Effect()
loadX$: Observable<Action> = this.actions$.pipe(...);
```

or the non-dispatching variant:

```typescript
@Effect({ dispatch: false })
saveX$: Observable<Action> = this.actions$.pipe(...);
```

### Apply

**Standard (dispatching):**

```typescript
loadX$ = createEffect(() => this.actions$.pipe(
  ofType(...),
  // ...inner operators unchanged...
));
```

**Non-dispatching:**

```typescript
saveX$ = createEffect(
  () => this.actions$.pipe(
    ofType(...),
    // ...inner operators unchanged...
  ),
  { dispatch: false }
);
```

### Import edits

```typescript
- import { Actions, Effect, ofType } from "@ngrx/effects";
+ import { Actions, createEffect, ofType } from "@ngrx/effects";
```

Also remove `Action` and `Observable` imports if they are only used for the effect type annotation (they typically are).

### Agent prompt (verbatim from PDF, recommended for bulk fix)

> Update to NgRx `createEffect`: replace `import { Actions, Effect, ofType }` with `import { Actions, createEffect, ofType }`. Remove unused `Action` and `Observable` imports. Change `@Effect() foo: Observable<Action> = this.actions$.pipe(...)` to `foo = createEffect(() => this.actions$.pipe(...))`. Keep inner operators unchanged. Do this for every file that has `@Effect`.

### Verify

- No file still contains `@Effect(`
- Every `createEffect(` has a matching closing `);`
- `import { Effect ... }` is gone from every `.effects.ts`

---

## 2. `zone.js` import path

**Scope:** `polyfills.ts` only
**Risk:** `AUTO_SAFE`

```typescript
- import 'zone.js/dist/zone';
+ import 'zone.js';
```

---

## 3. SCSS `~` prefix removal

**Scope:** `**/*.scss`
**Risk:** `AUTO_SAFE`

Angular 13+ webpack no longer needs the `~` prefix for `node_modules` imports.

```scss
- @import '~ngx-toastr/toastr';
+ @import 'ngx-toastr/toastr';
```

Apply to every `~`-prefixed import (not just ngx-toastr). Common examples: `~bootstrap`, `~@fortawesome`, `~ngx-*`.

---

## 4. Lodash default import

**Scope:** `**/*.ts`
**Risk:** `AUTO_SAFE` (relies on `allowSyntheticDefaultImports: true` in tsconfig)

```typescript
- import * as _imported from 'lodash'; const _ = _imported;
+ import _ from 'lodash';
```

---

## 5. Moment default import

**Scope:** `**/*.ts`
**Risk:** `AUTO_SAFE`

```typescript
- import * as momentImported from 'moment'; const moment = momentImported;
+ import moment from 'moment';
```

---

## 6. Marked — `require` → ES import

**Scope:** `**/*.ts`
**Risk:** `AUTO_SAFE`

```typescript
- var marked = require("marked");
+ import { marked } from 'marked';
```

Note that `marked` is now a named export, not the default.

---

## 7. Angular typed forms migration

**Scope:** `**/*.ts`
**Risk:** `AUTO_SAFE`

Angular 14 introduced strictly typed forms. To defer the type migration, rename to the `Untyped*` equivalents everywhere:

| Before | After |
|--------|-------|
| `FormGroup` | `UntypedFormGroup` |
| `FormControl` | `UntypedFormControl` |
| `FormBuilder` | `UntypedFormBuilder` |
| `FormArray` | `UntypedFormArray` |

### Import edit

```typescript
- import { FormGroup, FormControl, FormBuilder, FormArray } from '@angular/forms';
+ import { UntypedFormGroup, UntypedFormControl, UntypedFormBuilder, UntypedFormArray } from '@angular/forms';
```

### Apply to

- Constructor injection: `constructor(private fb: UntypedFormBuilder)`
- Field declarations: `form: UntypedFormGroup;`
- Type parameters: `Map<string, UntypedFormGroup>`
- Return types: `(): UntypedFormGroup { ... }`

Do NOT change:
- `FormsModule` (unrelated Angular module import)
- `ReactiveFormsModule`
- `FormGroupDirective`, `FormControlDirective`, `FormControlName` (still used, still typed)

---

## 8. Lazy-loaded routes — string → dynamic import

**Scope:** any file that defines Angular routes
**Risk:** `AUTO_WITH_WARNING`

```typescript
- { path: 'feature', loadChildren: './feature/feature.module#FeatureModule' }
+ { path: 'feature', loadChildren: () => import('./feature/feature.module').then(m => m.FeatureModule) }
```

String syntax was removed in Angular 12. Extract the module name from after the `#`.

---

## 9. Router `initialNavigation`

**Scope:** `app-routing.module.ts`
**Risk:** `AUTO_SAFE`

```typescript
- initialNavigation: 'enabled'
+ initialNavigation: 'enabledNonBlocking'
```

---

## 10. `entryComponents` removal

**Scope:** every `*.module.ts`
**Risk:** `AUTO_SAFE`

Delete the entire `entryComponents:` array. Not needed with Ivy (Angular 13+).

---

## 11. `@ViewChild` / `@ContentChild` static flag

**Scope:** `**/*.ts`
**Risk:** `AUTO_WITH_WARNING`

Only relevant if migrating **from** Angular 8 or earlier; usually a no-op on Angular 10+ codebases but worth scanning:

```typescript
- @ViewChild('name')
+ @ViewChild('name', { static: false })
```

Do not set `static: true` — that changes lifecycle semantics.

---

## 12. RxJS 6 → 7

**Scope:** `**/*.ts`
**Risk:** `AUTO_WITH_WARNING` — behaviour change, needs verification

| Before | After |
|--------|-------|
| `observable.toPromise()` | `lastValueFrom(observable)` |
| `observable.toPromise().then(v => …)` | `lastValueFrom(observable).then(v => …)` |

Also: some operators renamed (e.g. `combineLatest(a, b)` → `combineLatest([a, b])`). Check the build output — RxJS 7 issues surface as `TS2769: No overload matches`.

Add the import if you introduce `lastValueFrom`:

```typescript
+ import { lastValueFrom } from 'rxjs';
```

---

## 13. `InfoFieldFactory.getComponentFactory()` → `getComponentType()` (Core 9.0.0, BREAKING)

**Scope:** any custom code calling `InfoFieldFactory`
**Risk:** `MANUAL` — return type changed, call sites need rework

Core 9.0.0 removes `ComponentFactoryResolver` / `entryComponents`. The factory method was renamed and its return type changed:

| Before | After |
|--------|-------|
| `getComponentFactory()` | `getComponentType()` |
| returns `ComponentFactory<any>` | returns `Type<any>` |

```typescript
// Before
const factory = this.infoFieldFactory.getComponentFactory(type);
const ref = viewContainerRef.createComponent(factory);

// After
const componentType = this.infoFieldFactory.getComponentType(type);
const ref = viewContainerRef.createComponent(componentType);
```

`ViewContainerRef.createComponent()` accepts a `Type<T>` directly in Angular 13+, so the intermediate `ComponentFactory` and any `ComponentFactoryResolver` injection can be deleted.

---

## 14. Application Insights — `applicationinsights-js` → `@microsoft/applicationinsights-web` (Core 9.0.0)

**Scope:** the App Insights bootstrap/service file
**Risk:** `MANUAL` — package + API surface changed

`package.json`: remove `@types/applicationinsights-js` and `applicationinsights-js`; add `@microsoft/applicationinsights-web@^3.0.4`.

```typescript
// Before
import { AppInsights } from 'applicationinsights-js';
AppInsights.downloadAndSetup({ instrumentationKey: key });
AppInsights.trackPageView();

// After
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
const appInsights = new ApplicationInsights({ config: { instrumentationKey: key } });
appInsights.loadAppInsights();
appInsights.trackPageView();
```

---

## 15. Context menu — `ngx-contextmenu` → `ngo-context-menu` (Core 9.0.0, BREAKING)

**Scope:** templates with custom context menus (`**/*.html`)
**Risk:** `MANUAL` — only clients with custom context menus

`package.json`: remove `ngx-contextmenu` (and `@angular/flex-layout`).

| Before | After |
|--------|-------|
| `<context-menu>` | `<ngo-context-menu>` |
| `contextMenuItem` | `ngoContextMenuItem` |

```html
<!-- Before -->
<context-menu>
  <ng-template contextMenuItem let-item> ... </ng-template>
</context-menu>

<!-- After -->
<ngo-context-menu>
  <ng-template ngoContextMenuItem let-item> ... </ng-template>
</ngo-context-menu>
```

---

## Order of application

When Phase 2 loops over these patterns, apply in this order to minimise redundant edits and unstable intermediate builds:

```text
1. zone.js import                 (single-file, no cascade)
2. entryComponents removal        (single-key deletion, no cascade)
3. Router initialNavigation       (single-string change)
4. SCSS ~ prefix                  (global find/replace)
5. lodash / moment / marked       (per-file, no cascade)
6. FormGroup → UntypedFormGroup   (batch rename, single import edit per file)
7. @Effect() → createEffect()     (structural, needs care per file)
8. Lazy-load string → dynamic     (structural, per-route)
9. @ViewChild static flag         (rare, do last)
10. RxJS 6 → 7                    (only if build errors surface)
11. getComponentFactory → getComponentType   (Core 9.0.0, per call site)
12. applicationinsights-js swap                (Core 9.0.0, single service)
13. context-menu → ngo-context-menu            (Core 9.0.0, per template)
```

---

## What NOT to touch

The following patterns must be **left alone** during a Core upgrade, even if the agent sees them:

- Any `-ext` file's method bodies (`ngOnInit`, `onSubmit`, `buildForm`, etc.) — override integrity
- Existing NgRx action definitions, selectors, reducers
- Existing service classes (except constructor signature when Phase 1 detects a base-class change)
- Existing HTML templates (that is the HTML Pass's job, not the syntax pass)
- Third-party library configuration files (`karma.conf.js`, `.eslintrc`, `jest.config.js`)

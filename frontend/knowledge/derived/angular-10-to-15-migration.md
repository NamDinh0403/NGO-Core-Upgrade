# Angular 10 → 15 Migration — Canonical Reference

**Source:** `upgrade-angular-10-15.pdf` (vendor document, verbatim)
**Applies to:** Any NGO client project moving from Angular 10 to Angular 15 (typically bundled with ngo-core v5.x → v8.x).
**Reference PR:** <https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-onlineshelterbox/pullrequest/30523>

> This document is the **single source of truth**. Every code fragment here is copied directly from the vendor PDF. If the agent needs to know *what* to change in a config file or *how* to rewrite a syntax pattern, it comes here first.

---

## 1. `package.json`

Replace the `dependencies` and `devDependencies` with the content from the Core repository, plus add `"ngo-core"` to `dependencies`.

> **Do not use `^`, `~`, or `latest`. Use the exact version strings from the Core repository's `package.json`.**

---

## 2. Install and compile

Remove cache and installed files:

```powershell
npm cache clean --force
Remove-Item -Recurse -Force .\node_modules
rm package-lock.json
```

Then run:

```powershell
npm install
ng serve
```

---

## 3. `tsconfig.json`

### 3.1 Update `compilerOptions.target` to `ES2022`

```json
"target": "ES2022",
```

### 3.2 Add new key to `compilerOptions` (below `moduleResolution`)

```json
"allowSyntheticDefaultImports": true,
```

### 3.3 Add new key below `lib`

```json
"useDefineForClassFields": false
```

---

## 4. `app-routing.module.ts`

Change `initialNavigation: 'enabled'` to `initialNavigation: 'enabledNonBlocking'`.

```typescript
@NgModule({
  imports: [
    RouterModule.forRoot([], {
      initialNavigation:
        !BrowserUtils.isInIframe() && !BrowserUtils.isInPopup()
          ? 'enabledNonBlocking'   // ← was 'enabled'
          : 'disabled'
    })
  ],
  exports: [RouterModule]
})
```

---

## 5. `app.module.ts`

Remove the entire `entryComponents:` section (no longer needed with Ivy in Angular 13+).

```typescript
@NgModule({
  // ...
  // entryComponents: [ ... ]   ← DELETE this key and its array
})
```

---

## 6. `polyfills.ts`

Change:

```typescript
import 'zone.js/dist/zone';
```

To:

```typescript
import 'zone.js';
```

---

## 7. `angular.json`

### 7.1 `ngo-nxt.architect.build.options`

**Remove:**

```json
"aot": true,
```

**Add to the end of the `options` object:**

```json
"vendorChunk": true,
"extractLicenses": false,
"buildOptimizer": false,
"sourceMap": true,
"optimization": false,
"namedChunks": true
```

### 7.2 `ngo-nxt.architect.build.configurations.production`

**Remove:**

```json
"extractCss": true,
"aot": true,
```

### 7.3 Add a new key below `ngo-nxt.architect.build.configurations`

```json
"defaultConfiguration": ""
```

### 7.4 `ngo-nxt.architect.test.options.scripts`

**Add:**

```json
"node_modules/tinymce/plugins/link/plugin.min.js",
"node_modules/tinymce/plugins/code/plugin.min.js"
```

### 7.5 Remove all `"lint"` sections

Every top-level `lint` architect target under every project must be deleted.

### 7.6 Remove

```json
"defaultProject": "ngo-nxt"
```

---

## 8. Change code syntax

### 8.1 Change syntax of `@Effect()`

Import `createEffect` instead of `Effect` from `"@ngrx/effects"`:

```typescript
import { Actions, createEffect, ofType } from "@ngrx/effects";
```

Change syntax **from:**

```typescript
@Effect()
loadResourceEquipments$: Observable<Action> = this.actions$.pipe(
  ofType(resourceEquipmentActions.ResourceEquipmentActionTypes.LoadResourceEquipments),
  map((action: resourceEquipmentActions.LoadResourceEquipments) => action.payload),
  switchMap(arg =>
    this.resourceEquipmentService.getResourceEquipments(arg.entityId, arg.parameter).pipe(
      map(items => new resourceEquipmentActions.LoadResourceEquipmentsSuccess({ entityId: arg.entityId, items })),
      catchError(error => of(new resourceEquipmentActions.LoadResourceEquipmentsFail(error)))
    )
  )
);
```

**To:**

```typescript
loadResourceEquipments$ = createEffect(() => this.actions$.pipe(
  ofType(resourceEquipmentActions.ResourceEquipmentActionTypes.LoadResourceEquipments),
  map((action: resourceEquipmentActions.LoadResourceEquipments) => action.payload),
  switchMap(arg =>
    this.resourceEquipmentService.getResourceEquipments(arg.entityId, arg.parameter).pipe(
      map(items => new resourceEquipmentActions.LoadResourceEquipmentsSuccess({ entityId: arg.entityId, items })),
      catchError(error => of(new resourceEquipmentActions.LoadResourceEquipmentsFail(error)))
    )
  )
));
```

**Agent prompt (recommended, apply to every file that contains `@Effect`):**

> Update to NgRx `createEffect`: replace `import { Actions, Effect, ofType }` with `import { Actions, createEffect, ofType }`. Remove unused `Action` and `Observable` imports. Change `@Effect() foo: Observable<Action> = this.actions$.pipe(...)` to `foo = createEffect(() => this.actions$.pipe(...))`. Keep inner operators unchanged. Do this for every file that has `@Effect`.

### 8.2 Remove `~` from `ngx-toastr` in SCSS files

Change:

```scss
@import '~ngx-toastr/toastr';
```

To:

```scss
@import 'ngx-toastr/toastr';
```

> The tilde prefix is no longer needed in Angular 13+ (webpack module resolution).

### 8.3 Change import syntax

**Lodash** — from:

```typescript
import * as _imported from 'lodash'; const _ = _imported;
```

To:

```typescript
import _ from 'lodash';
```

**Moment** — from:

```typescript
import * as momentImported from 'moment'; const moment = momentImported;
```

To:

```typescript
import moment from 'moment';
```

**Marked** — from:

```typescript
var marked = require("marked");
```

To:

```typescript
import { marked } from 'marked';
```

### 8.4 Typed forms migration

Change `FormGroup` to `UntypedFormGroup`, and `FormControl` to `UntypedFormControl`.

> Applies to `import` statements and every type annotation. Also change `FormBuilder` → `UntypedFormBuilder` and `FormArray` → `UntypedFormArray` when present.

---

## 9. `build-pipeline-angular.yml`

Change **from:**

```yaml
'node --max_old_space_size=8192 node_modules/@angular/cli/bin/ng build --prod'
```

**To:**

```yaml
'node --max_old_space_size=8192 node_modules/@angular/cli/bin/ng build --configuration production'
```

> `--prod` was removed in Angular 12. The named configuration must be used explicitly.

---

## Reference PR

For a complete, working example of all of the above applied to a real client:

<https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-onlineshelterbox/pullrequest/30523>

---

## Cross-references

- Per-file exact edits: [config-files-reference.md](config-files-reference.md)
- Machine-readable syntax patterns: [syntax-migration-patterns.md](syntax-migration-patterns.md)
- Version matrix: [version-manifest.json](version-manifest.json)
- Per-release manual steps (v6.x, v7, v8.0/8.1/8.3/8.4): [breaking-changes-by-version.md](breaking-changes-by-version.md)

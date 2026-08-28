# Config Files Reference

**Per-file, precise edits required for the Angular 10 → 15 / ngo-core 5.x → 8.x migration.**
**Verbatim source:** `upgrade-angular-10-15.pdf` §3, §4, §5, §6, §7 + client-tested instructions.md deltas.

This document is the operational lookup: given a filename, what exactly changes?

---

## `package.json`

**Rule:** Take every `dependencies` and `devDependencies` entry **verbatim** from the target Core project's `package.json`. Add `"ngo-core"` to `dependencies` with the exact version string.

**Do:**
- Update all packages Core lists, using exact version strings (no `^`, no `~`, no `latest`).
- Add any package Core lists that the client does not have.
- Keep client-only packages (not in Core) — unless they are `ngo-*` packages, in which case flag `HUMAN_REQUIRED`.

**Version-specific additions/removals** — apply only when upgrading **through or past** the listed version:

| From → To passes | Add | Remove |
|-------------------|-----|--------|
| ≤ 6.x → ≥ 7.0.0 | `ng2-file-upload@^1.3.0` · `ngx-file-drop@^10.0.0` | `ngx-uploader` |

---

## `tsconfig.json`

Three edits inside `compilerOptions`:

| Location | Change | Value |
|----------|--------|-------|
| `compilerOptions.target` | Update | `"ES2022"` |
| below `moduleResolution` | Add if missing | `"allowSyntheticDefaultImports": true` |
| below `lib` | Add if missing | `"useDefineForClassFields": false` |

**Post-install hazard:** `npm install` on some environments rewrites `tsconfig.json`'s `target` back to `es2015`. Restore from `.upgrade-lock.json.lockedSettings.esTarget` immediately after every install.

---

## `polyfills.ts`

Single change:

```typescript
- import 'zone.js/dist/zone';
+ import 'zone.js';
```

---

## `app-routing.module.ts`

Single string change inside `RouterModule.forRoot([...], { ... })`:

```typescript
- initialNavigation: 'enabled'
+ initialNavigation: 'enabledNonBlocking'
```

The full corrected block:

```typescript
@NgModule({
  imports: [
    RouterModule.forRoot([], {
      initialNavigation:
        !BrowserUtils.isInIframe() && !BrowserUtils.isInPopup()
          ? 'enabledNonBlocking'
          : 'disabled'
    })
  ],
  exports: [RouterModule]
})
```

---

## `app.module.ts`

Delete the entire `entryComponents:` array (Ivy makes it unnecessary in Angular 13+).

```typescript
@NgModule({
  declarations: [ ... ],
  imports:      [ ... ],
- entryComponents: [
-   SomeDialogComponent,
-   AnotherModalComponent
- ],
  providers:    [ ... ],
  bootstrap:    [AppComponent]
})
```

**Version-specific module additions** — add to the `imports` array only if not already present:

| Upgrading to | Modules | Font-Awesome icons |
|-------------|---------|--------------------|
| v7.0.0+ | `IATIModule` · `PartnerExpenditureReportingImportModule` · `Logframe2Module` | `faCommentLines` (`@fortawesome/pro-light-svg-icons`) |
| v8.0.0+ | `MinimumRequirementModule` | `faExclamationCircle as farExclamationCircle` (`pro-regular`) · `faLock` (`pro-light`) |
| v8.1.0+ | `EmergencyFinanceModule` · `NonProjectFinanceModule` | — |

Never remove client-only modules.

---

## `angular.json`

Multi-section overhaul. Apply all sub-changes.

### §7.1 — `projects.<project>.architect.build.options`

**Remove:**
```json
"aot": true,
```

**Add to the end of the object:**
```json
"vendorChunk": true,
"extractLicenses": false,
"buildOptimizer": false,
"sourceMap": true,
"optimization": false,
"namedChunks": true
```

### §7.2 — `projects.<project>.architect.build.configurations.production`

**Remove:**
```json
"extractCss": true,
"aot": true,
```

### §7.3 — Add new sibling key below `architect.build.configurations`

```json
"defaultConfiguration": ""
```

Full skeleton after the change:
```json
"build": {
  "builder": "@angular-devkit/build-angular:browser",
  "options": { ... },
  "configurations": {
    "production": { ... },
    "development": { ... }
  },
  "defaultConfiguration": ""
}
```

### §7.4 — `projects.<project>.architect.test.options.scripts`

**Add** (append to the array):
```json
"node_modules/tinymce/plugins/link/plugin.min.js",
"node_modules/tinymce/plugins/code/plugin.min.js"
```

### §7.5 — Remove all `lint` architect targets

For every project in `angular.json`, delete the entire `architect.lint` object. Linting is handled outside `angular.json` in Angular 12+.

> **Core 9.0.0 reverses this:** a `lint` target is re-added using `@angular-eslint/builder:lint`. See the Core 9.0.0 deltas section below.

### §7.6 — Remove top-level `defaultProject`

```json
- "defaultProject": "ngo-nxt"
```

---

## Core 9.0.0 config deltas

These layer **on top of** the Angular 10→15 baseline above. Apply them when the target is ngo-core **9.0.0+**. Full context in [breaking-changes-by-version.md](breaking-changes-by-version.md) §v9.0.0.

### `tsconfig.json` — `lib`

```json
- "lib": ["es2018", "dom"]
+ "lib": ["ES2022", "dom"]
```

### `polyfills.js`

Replace the entire file contents with the version from **Core**.

### `package.json`

- Replace the entire `dependencies` and `devDependencies` sections with the versions from **Core** (this also pulls in the ESLint toolchain).
- Explicitly: `@angular/cdk` → `15.2.0`, `@angular/animations` → `15.2.10`; remove `@angular/flex-layout`, `ngx-contextmenu`, `@types/applicationinsights-js`, `applicationinsights-js`; add `@microsoft/applicationinsights-web@^3.0.4`.

### ESLint (replaces TSLint)

- Delete `src/tslint.json` and `tslint.json`.
- Add `.eslintrc.json` (copy from Core).
- `angular.json` — re-add a `lint` target under `projects.<project>.architect`, **after** `test`:
  ```json
  "lint": {
    "builder": "@angular-eslint/builder:lint",
    "options": {
      "lintFilePatterns": ["src/**/*.ts", "src/**/*.html"]
    }
  }
  ```

### `angular.json` — spinner style

Under `projects.<project>.architect.build.options.styles`, add:
```json
"node_modules/ngx-spinner/animations/ball-clip-rotate-multiple.css"
```

### `angular.json` — CSP optimization object

Under `architect.build.configurations` (the production configuration), change the `optimization` boolean to the object form:
```json
"optimization": {
  "scripts": true,
  "styles": { "minify": true, "inlineCritical": false },
  "fonts": true
}
```

### `src/index.html`

- Update the Bootstrap CSS `<link>` to include `integrity` (SRI) + `crossorigin="anonymous"`.
- Add the Font-Awesome 4.7.0 CSS `<link>` **below** the Bootstrap link (fixes lost context-box icons).
- Remove the `FontAwesomeConfig` `<script>` block (CSP).

### `main.ts`

- `addinLoadingElement.innerHtml = msg;` → `addinLoadingElement.textContent = msg;`
- After the `office.js` script line, add the CSP nonce propagation (see breaking-changes doc §9).

### `Assets/skins/content/default/custom.css`

Replace the entire file with the same file from the **ngo-online-core** repository.

### `src/environments/environment.ts` / `environment.prod.ts`

Add: `aiwriter: 'api/core/aiwriter'` (Write-with-AI; backend/Azure setup only if the client uses AI).

---

## `src/environments/environment.ts` and `environment.prod.ts`

Same keys in both. Add only if missing. Never remove existing client-only keys.

| Upgrading to | Keys to add |
|-------------|-------------|
| v7.0.0+ | `adminIATIPage: 'api/core/adminIATIPage'` · `entityIATI: 'api/core/entity'` · `iatiDocument: 'api/core/entity'` · `iatitransactions: 'api/core/entity'` · `partnerExpenditureImport: 'api/core/entity'` · `logframeImported: 'api/core/entity'` · `summary: 'api/core/summary'` · `logframes2: 'api/core/entity'` |
| v8.0.0+ | `adminMinimumRequirements: 'api/core/adminMinimumRequirements'` · `minimumRequirements: 'api/core/minimumRequirements'` |
| v8.1.0+ | `nonProjectFinance: 'api/core/entity'` · `emergencyFinance: 'api/core/entity'` |

---

## `src/styles.scss`

Bootstrap 4 → 5 during the v8.0.0 upgrade.

**Remove** every reference to Bootstrap 4 CDNs:
```scss
- @import url("https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css");
```

**Add** at the end of the file:
```scss
/* Bootstrap 5 compatibility */
.modal-backdrop { z-index: 1050 !important; }
```

Also strip the tilde prefix from every ngx-toastr import:
```scss
- @import '~ngx-toastr/toastr';
+ @import 'ngx-toastr/toastr';
```

---

## `src/app/app-route.service.ts` (or equivalent routing file)

**Applies:** v8.3.0+.

Add a wildcard redirect **as the last route at its nesting level**, after the `outlook-addin` route:

```typescript
{ path: 'outlook-addin', loadChildren: () => import(...) },
{ path: '**', redirectTo: 'start' }   // ← ADD THIS
```

---

## `src/index.html`

**Applies:** v8.4.0+.

Remove the Google Analytics script block:

```html
<!-- REMOVE this entire block -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-XXXXXXX-X"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'UA-XXXXXXX-X');
</script>
```

---

## `build-pipeline-angular.yml`

**Applies:** any upgrade that crosses Angular 12+ (i.e. any v8.x target).

```yaml
- 'node --max_old_space_size=8192 node_modules/@angular/cli/bin/ng build --prod'
+ 'node --max_old_space_size=8192 node_modules/@angular/cli/bin/ng build --configuration production'
```

See [build-pipeline-changes.md](build-pipeline-changes.md) for the full YAML context.

---

## Order of operations

The agent must apply these files in this order so intermediate builds succeed:

```text
1. package.json          → npm install
2. tsconfig.json         → restore ES target from lock
3. polyfills.ts
4. app-routing.module.ts
5. app.module.ts         → remove entryComponents, add version-specific modules
6. angular.json          → 7.1–7.6 in that order
7. environment.ts / .prod.ts
8. styles.scss
9. app-route.service.ts  (v8.3.0+)
10. index.html           (v8.4.0+)
11. build-pipeline-angular.yml
```

Every step is idempotent: re-running the agent must not duplicate keys, imports, or modules.

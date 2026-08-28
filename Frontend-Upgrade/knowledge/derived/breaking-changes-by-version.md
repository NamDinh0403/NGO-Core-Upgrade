# Breaking Changes by Version

**Per-release list of Core changes that require action in the client.**
**Sources:** vendor PDF · `../CHANGELOG.md` (WVUK v5.14 → v8.3 real migration) · `../instructions.md`.

Read this file **top-down**: when upgrading from v5.14 to v8.3, apply every applicable section from v6.x through v8.3 in order.

---

## Quick reference — manual steps by version

| Version | Before Upgrade | After Upgrade Manual Step | Agent-automated Step |
|---------|---------------|---------------------------|----------------------|
| **v9.1.0** | — | — | (backend-led release — see backend KB) |
| **v9.0.0** | Node 18.20.0 · Read the whole v9.0.0 section | Set up Write-with-AI (if used) · Replace `custom.css` from ngo-online-core · Review custom context menus + `javascript:void(0)` links | Rename `getComponentFactory`→`getComponentType` · ESLint migration · ngx-contextmenu→ngo-context-menu · App Insights swap · CSP + security headers · `faExternalLink` |
| **v8.4.0** | — | Remove GA script from `src/index.html` | — |
| **v8.3.0** | — | Add `'**'` wildcard redirect to routing | Verify wildcard route exists |
| **v8.1.0** | — | — | Add EmergencyFinance / NonProjectFinance modules |
| **v8.0.0** | Read this document top-to-bottom · Node 18+ · Read the vendor PDF | Remove Bootstrap 4 CDN · Add modal override | Add MinimumRequirement module + icons |
| **v7.0.0** | — | Update `.csproj` to `net9.0` · Check custom Logframe Excel service | Add IATI, PartnerExpenditureReportingImport, Logframe2 modules |
| **v6.x** | — | Run SQL scripts (backend) | — |

---

## v6.x

**Angular:** stays on 10.x
**Client action:** only backend SQL scripts to run — no frontend changes.

---

## v7.0.0

**Angular:** stays on 10.x (last release before the jump to 14)
**Backend:** target framework moves `net8.0` → `net9.0`.

### `.csproj` files (backend but frontend team must know)

```xml
- <TargetFramework>net8.0</TargetFramework>
+ <TargetFramework>net9.0</TargetFramework>
```

### `build-pipeline-api.yml`

```yaml
- netVersion: '8.0'
- dotnetEfVersion: '8.0.10'
+ netVersion: '9.0'
+ dotnetEfVersion: '9.0.1'
```

### `src/environments/environment.ts` and `environment.prod.ts` — add

```typescript
adminIATIPage:            'api/core/adminIATIPage',
entityIATI:               'api/core/entity',
iatiDocument:             'api/core/entity',
iatitransactions:         'api/core/entity',
partnerExpenditureImport: 'api/core/entity',
logframeImported:         'api/core/entity',
summary:                  'api/core/summary',
logframes2:               'api/core/entity',
```

### `src/app/app.module.ts` — add

```typescript
import { faCommentLines } from '@fortawesome/pro-light-svg-icons';
// in constructor:
library.addIcons(faCommentLines);

import {
  IATIModule,
  PartnerExpenditureReportingImportModule,
  Logframe2Module
} from 'ngo-core';

// in @NgModule imports:
IATIModule,
PartnerExpenditureReportingImportModule,
Logframe2Module,
```

### `package.json` — dependencies

Add:
```json
"ng2-file-upload": "^1.3.0",
"ngx-file-drop":  "^10.0.0"
```

Remove:
```json
"ngx-uploader": "..."
```

### Custom-code checks

- **`LogframeExcelService`** — if the client has a custom subclass, check whether it needs to override `SetupReadonlyFieldByDependencies()` in the new Logframe2 architecture. Mark `HUMAN_REQUIRED` when uncertain.

### After-upgrade verification

- Admin > IATI page loads
- A project with Logframe2 shows indicators + objectives
- File upload works in any module that uses it

---

## v8.0.0

**Angular:** 10.x → 14.x (major jump — apply everything in `angular-10-to-15-migration.md` up to and including §7)
**Node:** 18+ required
**Bootstrap:** 4 → 5

### Prerequisites (before upgrade)

- Read `../upgrade-angular-10-15.pdf` (or `angular-10-to-15-migration.md` in this KB)
- Confirm `node --version` reports 18.x or higher

### `src/styles.scss`

**Remove:**
```scss
@import url("https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css");
```

**Add** at the end:
```scss
/* Bootstrap 5 compatibility */
.modal-backdrop { z-index: 1050 !important; }
```

### `src/app/app.module.ts` — add

```typescript
import { faExclamationCircle as farExclamationCircle } from '@fortawesome/pro-regular-svg-icons';
import { faLock } from '@fortawesome/pro-light-svg-icons';

// in constructor:
library.addIcons(
  // ... existing icons ...
  farExclamationCircle,
  faLock,
);

import { MinimumRequirementModule } from 'ngo-core';

// in @NgModule imports:
MinimumRequirementModule,
```

### `src/environments/environment.ts` and `environment.prod.ts` — add

```typescript
adminMinimumRequirements: 'api/core/adminMinimumRequirements',
minimumRequirements:      'api/core/minimumRequirements',
```

### Custom-code checks

- **`AddIdea` / `AddFundingIdea` components** — client custom overrides must call `sequenceNumberService` to generate entity numbers (never a manual ID field).
- **`getCurrentConfiguration` usages** — every call must have `.pipe(filter(config => config != null))` to avoid null propagation issues. Grep the whole codebase.

### After-upgrade verification

- Open an entity with locking (e.g. Project) — lock icon appears and functions
- Admin > Minimum Requirements page loads
- Any modal opens correctly over the page backdrop

---

## v8.1.0

**Angular:** 14.x (no framework change)

### `src/app/app.module.ts` — add

```typescript
import {
  EmergencyFinanceModule,
  NonProjectFinanceModule
} from 'ngo-core';

// in @NgModule imports:
EmergencyFinanceModule,
NonProjectFinanceModule,
```

### `src/environments/environment.ts` and `environment.prod.ts` — add

```typescript
nonProjectFinance: 'api/core/entity',
emergencyFinance:  'api/core/entity',
```

### After-upgrade verification

- Emergency Finance section loads without errors
- Non-Project Finance section loads without errors

---

## v8.3.0

**Angular:** 14.x → 15.x (second big jump — TypeScript to 4.9, ES target to 2022)

### `src/app/app-route.service.ts` (or equivalent)

Add wildcard as the last route at its nesting level, after `outlook-addin`:

```typescript
{ path: 'outlook-addin', loadChildren: () => import(...) },
{ path: '**', redirectTo: 'start' }   // ← ADD THIS
```

### After-upgrade verification

- Navigate to a non-existent URL — app redirects to the start page

---

## v8.4.0

### `src/index.html` — remove the Google Analytics block

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

## v9.0.0

**Angular:** stays on 15.x · **Node:** 18.20.0 · **Backend:** target framework moves to **net10.0**.

This is a wide release. Apply every subsection below.

### 1. Remove deprecated `ComponentFactoryResolver` / `entryComponents` (BREAKING)

`InfoFieldFactory.getComponentFactory()` has been **renamed** and its return type changed:

| | Before | After |
|---|--------|-------|
| Method | `getComponentFactory()` | `getComponentType()` |
| Returns | `ComponentFactory<any>` | `Type<any>` |

Any custom code that calls `getComponentFactory()` must call `getComponentType()` and be adjusted to the new return type. See `syntax-migration-patterns.md` §13.

### 2. Angular ESLint migration (replaces TSLint)

- **Delete:** `ngo-client/src/tslint.json` and `ngo-client/tslint.json`
- **Add:** `ngo-client/.eslintrc.json` (copy contents from Core)
- **`angular.json`** — under `projects.ngo-nxt.architect`, add a `lint` target **after** `test`:

```jsonc
"lint": {
  "builder": "@angular-eslint/builder:lint",
  "options": {
    "lintFilePatterns": ["src/**/*.ts", "src/**/*.html"]
  }
}
```

- **`package.json`** — copy the entire `devDependencies` section from Core so all ESLint packages are present.

### 3. Modernize Angular deps + migrate off `ngx-contextmenu`

**`package.json`:**
- Upgrade `@angular/cdk` → `15.2.0`
- Upgrade `@angular/animations` → `15.2.10`
- Remove `@angular/flex-layout`
- Remove `ngx-contextmenu`

**Context menu migration (BREAKING — only if the client has custom context menus):**

```html
<!-- Old -->
<context-menu>
  <ng-template contextMenuItem> ... </ng-template>
</context-menu>

<!-- New -->
<ngo-context-menu>
  <ng-template ngoContextMenuItem> ... </ng-template>
</ngo-context-menu>
```

Replace `<context-menu>` → `<ngo-context-menu>` and `contextMenuItem` → `ngoContextMenuItem` everywhere.

### 4. Update spinner + refresh libraries

- **`package.json`** — replace the entire `dependencies` **and** `devDependencies` sections with the versions from Core.
- **`polyfills.js`** — replace its contents with the version from Core.
- **`angular.json`** — under `projects.ngo-next.architect.build.options.styles`, add:
  `"node_modules/ngx-spinner/animations/ball-clip-rotate-multiple.css"`
- **`tsconfig.json`** — `compilerOptions.lib`: `["es2018", "dom"]` → `["ES2022", "dom"]`

### 5. Node 18 + pipeline

- **`build-pipeline-angular.yml`** — set the NodeTool `versionSpec` to `18.20.0`; remove the `npm@1` "npm version" task. See `build-pipeline-changes.md`.

### 6. User tracking in Application Insights

**`package.json`:**
- Remove `@types/applicationinsights-js` `^1.0.9` (from `dependencies` **and** `devDependencies`)
- Remove `applicationinsights-js` `^1.0.20`
- Add `@microsoft/applicationinsights-web` `^3.0.4`

See `syntax-migration-patterns.md` §14 for the import/usage swap.

### 7. Write with AI (optional — may incur subscription cost)

> Confirm with the customer before enabling — this feature can incur costs.

- **`src/environments/environment.ts` / `environment.prod.ts`** — add: `aiwriter: 'api/core/aiwriter'`

**If the client will use AI**, also (backend/Azure):
1. Set system config `AIConfiguration.UsingWriteWithAI = true`.
2. Create (or reuse) a Microsoft Foundry resource; deploy a base model (Core currently uses **GPT-4o mini**); save its endpoint + deployment name.
3. In the Foundry resource → Access Control → grant the **Cognitive Services OpenAI Contributor** role to the Entra App client.
4. `appsettings.json` → `Core` section:
   ```json
   "AzureOpenAISettings": {
     "Endpoint": "your-end-point",
     "DeploymentName": "your-deployment-name"
   }
   ```
5. Deployment vars: `Core:AzureOpenAISettings:Endpoint`, `Core:AzureOpenAISettings:DeploymentName`.

If the client does **not** use AI, add only the `aiwriter` environment entry and skip the rest.

### 8. Security headers

- **NGO.API `web.config`** (backend) — see backend KB: `removeServerHeader="true"` + remove `X-Powered-By`.
- **`src/index.html`** — update the Bootstrap CSS `<link>` to include SRI + `crossorigin`:

```html
<link rel="stylesheet"
      href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css"
      integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm"
      crossorigin="anonymous">
```

### 9. Content Security Policy (CSP)

- **`src/index.html`** — remove the `FontAwesomeConfig` script block:
  ```html
  <script type="text/javascript">
    // window.FontAwesomeConfig = { autoReplaceSvg: false }
  </script>
  ```
- **`main.ts`** — change `addinLoadingElement.innerHtml = msg;` → `addinLoadingElement.textContent = msg;`
- **`main.ts`** — after the `office.js` script line, add the CSP nonce:
  ```typescript
  const cspNonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content');
  if (cspNonce) {
    script.setAttribute('nonce', cspNonce);
  }
  ```
- **`angular.json`** — `architect.build.configurations.optimization`: `true` → object form:
  ```json
  "optimization": {
    "scripts": true,
    "styles": { "minify": true, "inlineCritical": false },
    "fonts": true
  }
  ```
- **`Assets/skins/content/default/custom.css`** — replace the entire file with the same file from the **ngo-online-core** repository.
- **Customizations** — replace any `<a href="javascript:void(0);">` with `<button class="inline-btn">`.

### 10. Workflow / task templates admin UI

- **`app.module.ts`** — import the icon `faExternalLink` from `@fortawesome/pro-light-svg-icons` and register it.

### 11. Lost icons in context box

- **`src/index.html`** — add this link **below** the existing Bootstrap CSS link:

```html
<link rel="stylesheet"
      href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"
      integrity="sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN"
      crossorigin="anonymous">
```

---

## v9.1.0

**Angular:** stays on 15.x. This is a **backend-led release** — see the backend KB (`Backend-Upgrade/Knowledge/breaking-changes-registry.md`) for `RelatedEntity` Log fields, EF Core tooling packages, and the `SPSignedOffAdditionalDocumentsFolderName` config. No frontend-specific changes.

---

## Multi-version-hop cheat sheet

For a client doing a big skip, apply in order:

| Client is on | Client wants | Apply sections |
|--------------|--------------|----------------|
| 5.14 or 6.x | 8.3 | v7.0.0 → v8.0.0 → v8.1.0 → v8.3.0 (and everything in `angular-10-to-15-migration.md`) |
| 7.x | 8.3 | v8.0.0 → v8.1.0 → v8.3.0 |
| 8.0 | 8.4 | v8.1.0 → v8.3.0 → v8.4.0 |
| 8.2 | 8.4 | v8.3.0 → v8.4.0 |
| 8.3 | 8.4 | v8.4.0 only |
| 8.4 | 9.1 | v9.0.0 → v9.1.0 |
| 8.0 | 9.1 | v8.1.0 → v8.3.0 → v8.4.0 → v9.0.0 → v9.1.0 |

---

## When a target version is NOT in this file

The vendor released a new version and this KB has not been updated yet. Process:

1. Read the vendor release notes for the new version.
2. Add a new section to this file following the same shape.
3. If the release contains an Angular major bump, also add a section to `angular-10-to-15-migration.md` (or spin off a new `Angular_15_to_XX_Migration.md`).
4. Update `version-manifest.json` with the new row.

Until the KB is updated, the agent should:
- Do best-effort based on `angular-10-to-15-migration.md` and `config-files-reference.md`
- Mark anything unknown as `HUMAN_REQUIRED`
- Log the gap in the final report so the KB can be updated for the next run

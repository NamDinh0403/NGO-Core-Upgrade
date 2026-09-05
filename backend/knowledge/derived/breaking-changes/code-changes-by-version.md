# NGO Core - Code & Script Changes by Version

> **Purpose:** Code changes developers need to make when upgrading  
> **Last Updated:** May 2026

---

## CHECKLIST — COPY TO TRELLO

> Copy the relevant version blocks below into a Trello card checklist

### 9.1.0
- `Log` / `Log2` / `Log3` — new `RelatedEntity` fields; if a field must hold multiple values, change its type to `instances` in code
- `NGO.API.csproj` — add/update `Microsoft.EntityFrameworkCore.Design` `10.0.7` and `Microsoft.EntityFrameworkCore.Tools` `10.0.7`
- `appsettings.json` — add system config `SPSignedOffAdditionalDocumentsFolderName` (default `Additional documents`; confirm with client PM/AM)
- Migrations — if both EF Core and EF 6 are installed, use `EntityFrameworkCore\Add-Migration` to force the EF Core provider

### 9.0.0
- **All `.csproj`** — update `<TargetFramework>` to `net10.0` **before** upgrading Core packages
- `build-pipeline-api.yml` — `netVersion: '8.0'` → `'10.0'`
- **All `appSettings.json`** — add `"SyncPublishedWorkflowQueue": "syncpublishedworkflowqueue"`
- `NGO.API` `web.config` — add `removeServerHeader="true"` to `requestFiltering`; add `httpProtocol/customHeaders` removing `X-Powered-By`
- Frontend (ngo-client) — see frontend KB: ComponentFactoryResolver removal, ESLint migration, ngx-contextmenu migration, spinner/library updates, App Insights swap, Write-with-AI, CSP + security headers, `faExternalLink`, context-box icons

### 8.4.0
- `src/index.html` — Remove Google Analytics `<script>` block

### 8.3.0
- `app-route.service.ts` — Add `{ path: '**', redirectTo: 'start' }` below 'outlook-addin' route
- DB — If client overrides `GetTaskThatUserHasViewPermission` → inner join Tasks with CoreEntities

### 8.1.0
- `app.module.ts` — Add `EmergencyFinanceModule`, `NonProjectFinanceModule` to @NgModule
- `environment.ts` / `environment.prod.ts` — Add `nonProjectFinance`, `emergencyFinance` API URLs
- Check if client extends `BudgetFormComponent` — verify RefField options in 2nd/3rd levels

### 8.0.0
- Frontend — Follow `Upgrade Angular 10-15.docx`
- `src/styles.css` — Remove Bootstrap 4 CDN import, add Bootstrap 5 modal-backdrop override
- `app.module.ts` — Import `farExclamationCircle` from pro-regular-svg-icons, add after `faMoneyBill`, add `MinimumRequirementModule`
- `environment.ts` / `environment.prod.ts` — Add `adminMinimumRequirements`, `minimumRequirements` API URLs
- `app.module.ts` — Import `faLock` from pro-light-svg-icons, add to constructor
- Check custom `AddIdea` / `AddFundingIdea` — use `sequenceNumberService` if entity number not generated
- Check custom code using `getCurrentConfiguration` — ensure `filter(config => config != null)` is present

### 7.3.1
- Logframe — If user wants new objective form behaviour, follow dev notes checklist

### 7.3.0
- **If Logframe1:** Override `entity-route.service.ts`, replace 'logframe' path with `logframeRouteService`, add `20250930_DisableLogframe2.sql` as always-run script
- **If Logframe2:** Manual run `20250917_DisableLogframe1.sql`

### 7.2.0
- Override `LandscapeFunctionIds` in `ExportPdfService` to support landscape by tabid
- Update `Documents/PdfTemplates/ExpenditureTaskTemplate.docx` per client requirement
- Find `DateAndValueFields` in custom SQL scripts — update to new config format

### 7.0.0
- All `.csproj` files — Replace `net8.0` with `net9.0`
- `build-pipeline-api.yml` — Update `netVersion` to `9.0`, EF tool version to `9.0.1`
- `environment.ts` / `environment.prod.ts` — Add `adminIATIPage`, `entityIATI`, `iatiDocument`, `iatitransactions` URLs
- `app.module.ts` — Add `IATIModule`, import `faCommentLines`, add to `library.addIcons`
- `environment.prod.ts` — Add `partnerExpenditureImport` URL
- `app.module.ts` — Add `PartnerExpenditureReportingImportModule`
- `environment.prod.ts` — Add `logframeImported` URL
- Check `LogframeExcelService` — override `SetupReadonlyFieldByDependencies()` if needed
- `environment.ts` / `environment.prod.ts` — Add `summary` URL
- `environment.ts` / `environment.prod.ts` — Add `logframes2` URL
- `app.module.ts` — Add `Logframe2Module`
- `package.json` — Add `ng2-file-upload`, `ngx-file-drop`; remove `ngx-uploader`

### 6.4.0
- DB — If client customs `GetLogframeIndicatorTrackers` → replace `isnull(obj.ObjectiveNo, glObj.ObjectiveNo)` with `obj.[ObjectiveNo]`

---

## DETAIL BY VERSION

---

## 8.4.0

### Remove Google Analytics Script
**File:** `src/index.html`

Remove this block:
```html
<!-- Global site tag (gtag.js) - Google Analytics -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
</script>
```

---

## 8.3.0

### Fix Default Page Redirect
**File:** `app-route.service.ts`

Add at below of 'outlook-addin' route (same level):
```typescript
{ path: '**', redirectTo: 'start' }
```

### DB Function Override Check
If client overrides `GetTaskThatUserHasViewPermission`, update to inner join Tasks table with CoreEntities to ensure only view accessible entities.

---

## 8.1.0

### Enable Finance Tabs for Emergency & Non-Project
**File:** `app.module.ts`
```typescript
// Add to @NgModule imports:
EmergencyFinanceModule,
NonProjectFinanceModule
```

**Files:** `environment.ts`, `environment.prod.ts`
```typescript
nonProjectFinance: 'api/core/entity',
emergencyFinance: 'api/core/entity'
```

### BudgetFormComponent Check
If client extends `BudgetFormComponent`, check for issues with RefField options in 2nd/3rd levels.

---

## 8.0.0

### Frontend Upgrade (Angular 10-15)
See `Upgrade Angular 10-15.docx` for detailed instructions.

### Bootstrap CSS Changes
**File:** `src/styles.css`

Remove:
```css
@import url("https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css");
```

Add at end of file:
```css
/* Override to adapt for Bootstrap 5 */
.modal-backdrop {
  z-index:1050 !important;
}
```

### Minimum Requirements Module
**File:** `app.module.ts`
```typescript
// Add import:
import { faExclamationCircle as farExclamationCircle } from '@fortawesome/pro-regular-svg-icons';

// Add to constructor after faMoneyBill:
farExclamationCircle

// Add to @NgModule imports:
MinimumRequirementModule
```

**Files:** `environment.ts`, `environment.prod.ts`
```typescript
adminMinimumRequirements: 'api/core/adminMinimumRequirements',
minimumRequirements: 'api/core/minimumRequirements'
```

### Lock Entities Feature
**File:** `app.module.ts`
```typescript
// Add import:
import { faLock } from '@fortawesome/pro-light-svg-icons';

// Add to constructor:
faLock
```

### Entity Number Generation Check
Check if any custom `AddIdea` or `AddFundingIdea` cannot generate entity number - use `sequenceNumberService` to handle.

### getCurrentConfiguration Check
If custom code uses `getCurrentConfiguration`, ensure having:
```typescript
filter(config => config != null),
```

---

## 7.3.1

### Logframe Objective Form Behavior
If user wants new behaviour for standard/custom indicators, follow dev notes checklist.

---

## 7.3.0

### Logframe1 vs Logframe2 Override
**If Logframe1 is used:**
- Override `entity-route.service.ts`
- Replace 'logframe' path with `logframeRouteService`
- Add always-run core override script `20250930_DisableLogframe2.sql`

**If Logframe2 is used:**
- Manual run after script `20250917_DisableLogframe1.sql`

---

## 7.2.0

### Partner Expenditure PDF Template
- Override `LandscapeFunctionIds` in `ExportPdfService` to support landscape by tabid
- Update `Documents/PdfTemplates/ExpenditureTaskTemplate.docx` per client requirement

### DateAndValueFields Format Update
Find text `DateAndValueFields` in custom SQL scripts and update to new format (see Trello card for new config format).

---

## 7.0.0

### .NET 9 Upgrade
**All .csproj files:**
```xml
<!-- Find and replace -->
<TargetFramework>net8.0</TargetFramework>
<!-- With -->
<TargetFramework>net9.0</TargetFramework>
```

**File:** `build-pipeline-api.yml`
- Update `netVersion` parameter from `8.0` to `9.0`
- Update EF tool version from `8.0.7` to `9.0.1`

### IATI Module
**Files:** `environment.ts`, `environment.prod.ts`
```typescript
adminIATIPage: 'api/core/adminIATIPage',
entityIATI: 'api/core/entity',
iatiDocument: 'api/core/entity',
iatitransactions: 'api/core/entity'
```

**File:** `app.module.ts`
```typescript
// Add to @NgModule imports:
IATIModule

// Add import:
import { faCommentLines } from '@fortawesome/pro-light-svg-icons';
// Add to library.addIcons:
faCommentLines
```

### Partner Expenditure Import Module
**File:** `environment.prod.ts`
```typescript
partnerExpenditureImport: 'api/core/entity'
```

**File:** `app.module.ts`
```typescript
// Add to imports:
PartnerExpenditureReportingImportModule
```

### Logframe Import/Export
**File:** `environment.prod.ts`
```typescript
logframeImported: 'api/core/entity'
```

**Override:** `LogframeExcelService` → can override `SetupReadonlyFieldByDependencies()` to update `FieldDependencies`

Example:
```csharp
public virtual Dictionary<string, string> FieldDependencies
{
    get => _fieldDependencies;
    set => _fieldDependencies = value ?? new Dictionary<string, string>
    { { "numField1", "3;5" }}
}
```

### Summary Finance Module
**Files:** `environment.ts`, `environment.prod.ts`
```typescript
summary: 'api/core/summary'
```

### Logframe2 Module
**Files:** `environment.ts`, `environment.prod.ts`
```typescript
logframes2: 'api/core/entity'
```

**File:** `app.module.ts`
```typescript
// Add to imports:
Logframe2Module
```

### File Upload Dependencies
**File:** `package.json`
```json
// Add:
"ng2-file-upload": "^1.3.0",
"ngx-file-drop": "^10.0.0"

// Remove:
"ngx-uploader"
```

---

## 6.4.0

### Logframe Indicator Tracker Custom Procedure
If client customs `GetLogframeIndicatorTrackers` procedure, update:
```sql
-- Change from:
isnull(obj.ObjectiveNo, glObj.ObjectiveNo)
-- To:
obj.[ObjectiveNo]
```

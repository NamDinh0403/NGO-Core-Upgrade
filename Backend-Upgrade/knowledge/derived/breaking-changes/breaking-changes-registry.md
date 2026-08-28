# Breaking Changes Registry

> **Version:** 2.1.0  
> **Last Updated:** July 2026

A legacy human-readable summary of breaking changes by version. For agent routing, start with [index.json](index.json), then load the matching JSON entry under `versions/`, `errors/`, `symbols/`, `appsettings/`, or `migrations/`.

> **Package-first reminder:** the entries below are corroborating evidence. The authoritative signature is always the installed `NGO.Core.*.dll` on disk — inspect it per [../../../workflows/core-upgrade/the Build-and-Fix phase](../../../workflows/core-upgrade/phases/05-build-and-fix.md) before patching.

---

## Version 9.1.0 (.NET 10)

### Log / Log2 / Log3 — new RelatedEntity fields

**Impact:** LOW | **Auto-fix:** No

New `RelatedEntity` fields were added to `Log`, `Log2`, and `Log3`. If the client needs a field to hold **multiple** related entities, change that field's type to `instances` in code.

---

### NGO.API — EF Core tooling packages

**Impact:** LOW | **Auto-fix:** Yes (add package references)

Add / update on the **NGO.API** project:

```xml
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.0.7" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="10.0.7" />
```

> **Upgrade-person note:** if the machine has **both** EF Core and EF 6 installed, run migrations with `EntityFrameworkCore\Add-Migration ...` so the EF Core provider is used instead of EF 6.

---

### SPSignedOffAdditionalDocumentsFolderName (system config)

**Impact:** MEDIUM | **Auto-fix:** No (needs client confirmation)

New system config controlling the optional approval subfolder used when files are uploaded via **"Mark as Paid"** or **"Cancel"** (these are now copied to the *99 approval* location).

| Config | Default | Notes |
|--------|---------|-------|
| `SPSignedOffAdditionalDocumentsFolderName` | `Additional documents` | Can be changed or set empty per client. **Ask the client PM/AM before running the tool below.** |

**After deployment:** if the client uses *Mark as Paid* or *Cancel* on payments, update `appsettings.json` then run `NGO.Core.Tools.UpdatePaymentDocumentLinks`.

---

## Version 9.0.0 (.NET 10)

### Framework Upgrade — .NET 10

**Impact:** HIGH | **Auto-fix:** Yes | **Error Code:** `NU1201`

Update **all** projects to target `net10.0` **before** upgrading the Core packages.

```xml
<TargetFramework>net10.0</TargetFramework>
```

Also update `build-pipeline-api.yml` (`netVersion: '8.0'` → `'10.0'`) and, at deploy time, the Azure App Service / Web App runtime to .NET 10.

---

### Workflow instances moved to relational tables

**Impact:** HIGH | **Auto-fix:** No (deployment tool required)

Workflow instances are no longer stored as JSON config; they live in new tables `CorePhaseInstances` and `CorePhaseTemplateInstances`.

**After deployment**, run the `ConvertWorkflowInstanceJsonConfigToTables` tool to migrate existing JSON configurations into the new tables. If skipped, the **Workflow Cycle tab** will not display workflow cycle data correctly.

---

### Draft / Published workflow — new queue key

**Impact:** MEDIUM | **Auto-fix:** Yes

Add to **every** `appSettings.json`:

```json
"SyncPublishedWorkflowQueue": "syncpublishedworkflowqueue"
```

At deploy time add the Azure App Setting `Core:Queue:SyncPublishedWorkflowQueue = syncpublishedworkflowqueue`.

---

### NGO.API web.config — security headers

**Impact:** LOW | **Auto-fix:** Yes

In `NGO.API` `web.config`:

- Add `removeServerHeader="true"` to `<system.webServer><security><requestFiltering>`.
- Add, after the `<security>` element:

```xml
<httpProtocol>
  <customHeaders>
    <remove name="X-Powered-By" />
  </customHeaders>
</httpProtocol>
```

> The Angular-side security-header and CSP changes for this release live in the Frontend-Upgrade knowledge base.

---

## Version 8.0.0 (.NET 9)

### Framework Upgrade

**Impact:** HIGH | **Auto-fix:** Yes

All projects must update `<TargetFramework>` from `net8.0` to `net9.0`.

```xml
<TargetFramework>net9.0</TargetFramework>
```

---

### EntityService (Core Change)

**Impact:** HIGH | **Error Codes:** CS7036, CS0305, CS0311

#### Generic Type Arguments: 31 → 34

Three new type parameters added at the end:

| Position | Type | Constraint |
|----------|------|------------|
| 32 | `DtoPartnerExpenditureReporting` | `Core.Model.PartnerExpenditureReporting` |
| 33 | `DtoBudgetVersion` | `Core.Model.BudgetVersion` |
| 34 | `TIATIDocument` | `Core.Model.IATIDocument` |

⚠️ **Note:** These use `Core.Model.*` not `Core.Model.Dto.*`!

#### Constructor Parameters: +6 New

```csharp
// Add these parameters:
IConfigurationRepository configurationRepository,
IIATITransactionService<Core.Model.IATITransaction> iatiTransactionService,
IIATIDocumentRepository<TIATIDocument> iatiDocumentRepository,
ILogframe2ExportExcelService logframe2ExportExcelService,
IBankAccountRepository<Core.Model.BankAccount> bankAccountRepository,
IMinimumRequirementExportExcelService minimumRequirementExportExcelService
```

#### Type Change

```csharp
// BEFORE
IPartnerExpenditureReportingExportExcelService partnerExpenditureReportingExportExcelService

// AFTER (Lazy wrapper added)
Lazy<IPartnerExpenditureReportingExportExcelService<DtoPartnerExpenditureReporting, DtoBudgetVersion>> partnerExpenditureReportingExportExcelService
```

---

### ExportPdfService (Core Change)

**Impact:** HIGH | **Error Codes:** CS7036, CS0305, CS1503

#### Generic Type Arguments: 40 → 44

Four new type parameters:

| Position | Type | Constraint |
|----------|------|------------|
| 41 | `TBeneficiaryVersion` | `Core.Model.BeneficiaryVersion` |
| 42 | `DBeneficiaryVersion` | `Core.Model.Dto.BeneficiaryVersion` |
| 43 | `DLogframeVersion` | `Core.Model.Dto.LogframeVersion` |
| 44 | `DLogframeReporting` | `Core.Model.Dto.LogframeReporting` |

#### Constructor Parameters: +8 New

```csharp
IFieldDefinitionRepository<Core.Model.FieldConfiguration> fieldDefinitionRepository,
IExchangeRateService<Core.Model.ExchangeRateObject, Core.Model.Dto.ExchangeRateObject> exchangeRateService,
IPartnerExpenditureReportingExportExcelService<TPartnerExpenditureReporting, TBudgetVersion> partnerExpenditureReportingExportExcelService,
IBeneficiaryService<TBeneficiaryVersion, Core.Model.BeneficiaryReporting, Core.Model.BeneficiaryProjectLifeTotal> beneficiaryService,
IDtoMapper<DBeneficiaryVersion, TBeneficiaryVersion> beneficiaryVersionMapper,
ILogframe2Service<TLogframeVersion, Core.Model.LogframeObjective, TLogframeReporting> logframe2Service,
IDtoMapper<DLogframeVersion, TLogframeVersion> logframeVersionMapper,
IDtoMapper<DLogframeReporting, TLogframeReporting> logframeReportingMapper
```

#### Parameter Type Change

```csharp
// BEFORE (concrete types)
ILogframeService<Core.Model.LogframeVersion, Core.Model.LogframeObjective, Core.Model.LogframeReporting>

// AFTER (generic types)
ILogframeService<TLogframeVersion, Core.Model.LogframeObjective, TLogframeReporting>
```

---

### PaymentMapper (Core Change)

**Impact:** MEDIUM | **Error Code:** CS7036

#### Constructor Parameter: +1

```csharp
// Add this parameter:
IDtoMapper<Dto.IncomeSchedule, IncomeSchedule> incomeScheduleMapper

// Pass to base():
: base(userMapper, entityMapper, entityDefMapper, genericMapper, fieldOptionMapper, incomeScheduleMapper)
```

---

### PaymentService (Core Change)

**Impact:** MEDIUM | **Error Code:** CS7036

#### Constructor Parameters: +3

```csharp
IFieldOptionService fieldOptionService,
IProjectService<Project, Entity, Core.Model.Dto.Project> projectService,
IEmailService emailService
```

---

### TaskService Family (Core Change)

**Impact:** MEDIUM | **Error Code:** CS7036

All task-related services received new dependencies:

| Service | New Parameters |
|---------|----------------|
| TaskService | `logframe2Service`, `taskFlowRepository`, `minimumRequirementRepository` |
| TaskFlowService | `logframe2Service` |
| TaskAssignmentService | `logframe2Service` |

---

### Method Signature Changes

#### GetAllocationsForEntity

**Impact:** HIGH | **Error Code:** CS1503

```csharp
// BEFORE
List<FA> GetAllocationsForEntity(Entity entity, Filter filter, params int[] excludedIds)

// AFTER
List<FA> GetAllocationsForEntity(Entity entity, Filter filter, bool includeDeleted = false)
```

**Fix:** Update all call sites to pass `false` instead of int arrays.

#### PushEntityToQueueManagement

**Impact:** MEDIUM | **Error Code:** CS7036

```csharp
// BEFORE
await PushEntityToQueueManagement(task.Id, currentUser.Id, pushAsNullFolderPath);

// AFTER (2 new parameters)
await PushEntityToQueueManagement(task.Id, currentUser.Id, taskflow.Id, pushAsNullFolderPath, false);
```

---

### New Required Settings

#### Queue Settings (appsettings.json)

```json
{
  "Core": {
    "Queue": {
      "IATITransactionImportQueue": "iatitransactionimportqueue-{env}",
      "GenerateIATIFileQueue": "generateiatifilequeue-{env}",
      "SwitchCurrentSiteCollectionQueue": "switchcurrentsitecollectionqueue-{env}",
      "ReminderTaskDeadlineQueue": "remindertaskdeadlinequeue-{env}"
    }
  }
}
```

#### Core Settings

```json
{
  "Core": {
    "IATIDocumentsBlob": "iati-documents",
    "IATIValidationApi": "https://api.iatistandard.org/validator/validate",
    "IATISubscriptionKey": "e05a6d92d39f445ca81fb90c2f485c8d",
    "GenerateIATIFileSchedule": "0 2 * * *",
    "SwitchCurrentSiteCollectionSchedule": "0 4 * * *",
    "ReminderTaskDeadlineSchedule": "0 2 * * *"
  }
}
```

---

## Version 7.4.0

### FundingAllocationService Change

**Impact:** HIGH | **Error Code:** CS1503

Method signature change for `GetAllocationsForEntity` - see 8.0.0 section.

---

## Version 7.3.0

### Task Services

Multiple task-related services received `ILogframe2Service` dependency - see 8.0.0 section.

---

## Version 7.2.0

### Minor Constructor Changes

Various services received minor constructor parameter additions. See `knowledge/derived/version-changes/7.2.0/02-Services/` for details.

---

## Common Traps

### Trap 1: Model vs Dto Namespace

```csharp
// WRONG - Dto type when Model required
where T : Core.Model.BudgetVersion
// Used: Core.Model.Dto.BudgetVersion ❌

// RIGHT
// Used: Core.Model.BudgetVersion ✓
```

### Trap 2: Changing override to new

```csharp
// WRONG - Breaks polymorphism
public new void ProcessEntity(Entity e) { ... }

// RIGHT - Match new signature
public override void ProcessEntity(dynamic e) { ... }
```

### Trap 3: Forgetting DI Registration

After adding constructor parameters, ALWAYS update:
- `CommonDIRegistrations.cs`
- `*ServiceRegistration.cs`
- `Startup.cs` / `Program.cs`

### Trap 4: Partial Generic Updates

If class has 34 type args, ALL usages must have 34:
- Class definition
- Interface declaration  
- DI registration
- Variable declarations

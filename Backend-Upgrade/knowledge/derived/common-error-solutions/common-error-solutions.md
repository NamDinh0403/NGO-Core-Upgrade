# Common Error Solutions

> Quick reference for the most frequently encountered errors during NGO Core upgrades.

---

## CS7036: Missing Constructor Parameter

### Quick Solution

```csharp
// 1. Find the new signature in knowledge/derived/version-changes/{version}/02-Services.diff
// 2. Add the parameter to your constructor
// 3. Pass it to base()
// 4. UPDATE DI REGISTRATION!
```

### Common Missing Parameters (Core 8.x)

| Service | Missing Parameters |
|---------|-------------------|
| EntityService | `configurationRepository`, `iatiTransactionService`, `iatiDocumentRepository`, `logframe2ExportExcelService`, `bankAccountRepository`, `minimumRequirementExportExcelService` |
| ExportPdfService | `fieldDefinitionRepository`, `exchangeRateService`, `partnerExpenditureReportingExportExcelService`, `beneficiaryService`, `beneficiaryVersionMapper`, `logframe2Service`, `logframeVersionMapper`, `logframeReportingMapper` |
| TaskService | `logframe2Service`, `taskFlowRepository`, `minimumRequirementRepository` |
| PaymentService | `fieldOptionService`, `projectService`, `emailService` |
| PaymentMapper | `incomeScheduleMapper` |

---

## CS0305: Wrong Generic Argument Count

### Quick Solution

```csharp
// 1. Error tells you required count (e.g., "requires 34 type arguments")
// 2. Find new type args in knowledge/derived/version-changes/{version}/03-Models-DTOs.diff
// 3. Add missing types (usually at the end)
// 4. Update ALL usages: class, interface, DI
```

### Common Generic Changes (Core 8.x)

| Class | Before | After | New Types |
|-------|--------|-------|-----------|
| EntityService | 31 | 34 | `DtoPartnerExpenditureReporting`, `DtoBudgetVersion`, `TIATIDocument` |
| ExportPdfService | 40 | 44 | `TBeneficiaryVersion`, `DBeneficiaryVersion`, `DLogframeVersion`, `DLogframeReporting` |

---

## CS0311: Type Constraint Violation

### Quick Solution

Check what the constraint requires:

```csharp
// Constraint says:
where TBudgetVersion : Core.Model.BudgetVersion

// You MUST use:
Core.Model.BudgetVersion  // NOT Core.Model.Dto.BudgetVersion!
```

### Common Mistakes

| Wrong | Correct |
|-------|---------|
| `Core.Model.Dto.BudgetVersion` | `Core.Model.BudgetVersion` |
| `Model.Dto.X` when constraint is `Core.Model.X` | `Core.Model.X` |
| Using client type when Core type required | Use Core namespace |

---

## CS0115: Override Mismatch

### Quick Solution

**⚠️ DO NOT change `override` to `new`!**

```csharp
// 1. Decompile Core DLL or find in diff
// 2. Match the EXACT new signature:
//    - Return type
//    - Parameter types
//    - Nullability
// 3. Update your method to match
```

### Common Signature Changes

| Method | Before | After |
|--------|--------|-------|
| `GetNextEntityNo` | `(Entity entity)` | `(dynamic entity)` |
| `AddProgram` | `Task<TModel>` | `Task<(TModel, List<int>)>` |
| `GetAllocationsForEntity` | `(Entity, Filter, int[])` | `(Entity, Filter, bool)` |

---

## CS0246: Type Not Found

### Quick Solution

```csharp
// Option 1: Add using statement
using NGO.Core.Model;
using NGO.Core.Repositories;

// Option 2: Use full namespace
NGO.Core.Repositories.IIATIDocumentRepository<TIATIDocument>

// Option 3: Type was renamed - search diffs for old name
```

---

## CS1503: Argument Type Mismatch

### Quick Solution

Method parameter type changed. Update all call sites:

```csharp
// BEFORE
GetAllocationsForEntity(entity, filter, new[] { 1, 2, 3 });

// AFTER (int[] → bool)
GetAllocationsForEntity(entity, filter, false);
```

---

## NU1201: Target Framework Mismatch

### Quick Solution

```xml
<!-- Update .csproj -->
<TargetFramework>net9.0</TargetFramework>
```

```powershell
# Find all projects to update
Get-ChildItem -Recurse -Filter "*.csproj" | 
    Select-String "<TargetFramework>net8.0</TargetFramework>"
```

---

## DI Registration Errors

### Quick Solution

After constructor changes, update DI:

```csharp
// In CommonDIRegistrations.cs or similar:

// 1. Add new type args if count changed
services.AddScoped<IEntityService<..., 34 args>, EntityService<..., 34 args>>();

// 2. Register new services if not already registered
services.AddScoped<IIATITransactionService<IATITransaction>, IATITransactionService<IATITransaction>>();
```

---

## Error Resolution Checklist

When you fix an error:

- [ ] Did you update the constructor parameters?
- [ ] Did you update the `base()` call?
- [ ] Did you update DI registration?
- [ ] Did you update ALL usages of changed types?
- [ ] Did you use the correct namespace (Model vs Dto)?
- [ ] Did error count decrease after build?

---

## If Still Stuck

1. **Decompile Core DLL** - Get exact signatures
2. **Search all version diffs** - Change may be in earlier version
3. **Check client Knowledge** - May be documented already
4. **Look for "error families"** - Fix root cause, not symptoms

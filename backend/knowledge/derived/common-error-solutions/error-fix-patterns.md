# Error Fix Patterns

> **Version:** 3.0.0
> **Last Updated:** June 2026

Fix templates for build errors during NGO Core package upgrades, organized by error code.

> **⚠️ Read [Build-and-Fix phase](../../../workflows/core-upgrade/phases/05-build-and-fix.md) first.** Every entry below is an *illustration* of the universal 7-step pattern applied to a specific error code. The pattern itself — BUILD → CLASSIFY → INSPECT (decompile installed package) → CROSS-CHECK → PATCH → VERIFY → RECORD — is mandatory. The code snippets here are examples to recognise the shape of the fix, not a substitute for inspecting the actual installed `NGO.Core.*.dll`.

---

## Table of Contents

1. [NU1201 - Target Framework Mismatch](#nu1201---target-framework-mismatch)
2. [CS7036 - Missing Constructor Parameter](#cs7036---missing-constructor-parameter)
3. [CS0305 - Generic Type Arguments](#cs0305---generic-type-arguments)
4. [CS0311 - Type Constraint Violation](#cs0311---type-constraint-violation)
5. [CS0115 - Override Mismatch](#cs0115---override-mismatch)
6. [CS0246 - Type Not Found](#cs0246---type-not-found)
7. [CS1503 - Argument Type Mismatch](#cs1503---argument-type-mismatch)
8. [CS0029 - Cannot Convert](#cs0029---cannot-convert)
9. [DI Registration Errors](#di-registration-errors)

---

## NU1201 - Target Framework Mismatch

### Error Pattern
```
error NU1201: Project NGO.Services is not compatible with net8.0.
Project NGO.Services supports: net9.0
```

### Root Cause
Core packages upgraded to .NET 9, but project still targets .NET 8.

### Fix

**In .csproj:**
```xml
<!-- Before -->
<TargetFramework>net8.0</TargetFramework>

<!-- After -->
<TargetFramework>net9.0</TargetFramework>
```

**Automated fix:**
```powershell
Get-ChildItem -Recurse -Filter "*.csproj" | ForEach-Object {
    (Get-Content $_.FullName) -replace '<TargetFramework>net8\.0</TargetFramework>', '<TargetFramework>net9.0</TargetFramework>' |
    Set-Content $_.FullName
}
```

### Anti-Patterns
❌ Don't just update one project — update ALL projects in solution  
❌ Don't mix frameworks within the solution

---

## CS7036 - Missing Constructor Parameter

### Error Pattern
```
error CS7036: There is no argument given that corresponds to the required 
parameter 'logframe2Service' of 'TaskServiceBase.TaskServiceBase(...)'
```

### Root Cause
Base class constructor added new required dependency.

### Fix Process

Follow the [Fix Pattern Workflow](../../../workflows/core-upgrade/phases/05-build-and-fix.md). Concretely for CS7036:

1. **OBSERVE / CLASSIFY** — parse the error to extract the class name and the missing parameter.
2. **INSPECT** the installed package — decompile the base class to read the current constructor signature:
   ```powershell
   ilspycmd "$nuget\ngo.core.services\<ver>\lib\<tfm>\NGO.Core.Services.dll" `
            --type "NGO.Core.Services.<BaseClassName>" -o .\.decompiled
   ```
   Read only the ctor signature. Cache it in `.upgrade-state.json.resolvedSignatures`.
3. **CROSS-CHECK** (optional) — confirm with `knowledge/derived/version-changes/{ver}/02-Services/*.diff` if a diff happens to cover this class. If the diff and decompile disagree, the decompile wins.
4. **PATCH** atomically — in one batch:
   - Add the new parameter to the client subclass constructor.
   - Pass it through to `base(...)`.
   - Register the new dependency in `*Registration*.cs` / `Startup.cs` / `Program.cs`.
   - Update every direct `new SubclassName(...)` call site.
5. **VERIFY** — rebuild; CS7036 family count for this symbol must reach zero.
6. **RECORD** — append the mapping to `migration-memory.json`.

### Example: TaskService

```csharp
// BEFORE
public TaskService(
    ITaskRepository<TTask> taskRepository,
    IUserService<User> userService)
    : base(taskRepository, userService)
{
}

// AFTER
public TaskService(
    ITaskRepository<TTask> taskRepository,
    IUserService<User> userService,
    ILogframe2Service<TLogframeVersion, Core.Model.LogframeObjective, TLogframeReporting> logframe2Service,  // +NEW
    ITaskFlowRepository<TTaskFlow> taskFlowRepository,  // +NEW
    IMinimumRequirementRepository<MinimumRequirement> minimumRequirementRepository)  // +NEW
    : base(taskRepository, userService, logframe2Service, taskFlowRepository, minimumRequirementRepository)
{
}
```

### Common New Dependencies (Core 8.x)

| Service | New Parameter | Notes |
|---------|---------------|-------|
| TaskService | `ILogframe2Service`, `ITaskFlowRepository`, `IMinimumRequirementRepository` | Generic types required |
| EntityService | `IIATITransactionService`, `IIATIDocumentRepository`, `IBankAccountRepository`, `IMinimumRequirementExportExcelService` | 6+ new params |
| ExportPdfService | `IFieldDefinitionRepository`, `IExchangeRateService`, `ILogframe2Service` + mappers | 8+ new params |
| PaymentService | `IFieldOptionService`, `IProjectService`, `IEmailService` | |
| LogframeService | `ITabDefinitionRepository<TabDefinition>` | Add at end |
| EmailService | `ITaskTemplateRepository<Core.Model.TaskTemplate>` | |
| ConfigurationController | `IUserService<Core.Model.User>` | |

### Anti-Patterns
❌ Don't just add the parameter — also pass it to `base()`  
❌ Don't forget to update DI registration if service is new  
❌ Don't assume parameter order — check the diff carefully

---

## CS0305 - Generic Type Arguments

### Error Pattern
```
error CS0305: Using the generic type 'ExportPdfService<...>' requires 44 type arguments
```

### Root Cause
Generic class/interface added new type parameters.

### Fix Process

1. **Count current type args** in your code
2. **Find required count** from error message or diff
3. **Identify new types** from diff (`03-Models-DTOs.diff` or class diff)
4. **Add types** in correct position (usually at the end)
5. **Update all usages** — class declaration, DI registration, interfaces

### Example: EntityService (31 → 34 args)

```csharp
// BEFORE (31 type args)
public class EntityService<T, TProgram, TProject, TEmergency, TFunding, TStakeholder, 
    TOrgUnit, TGeography, TNonProject, TIdea, TFundingIdea, TStrategy, TLog, TRisk, 
    TPayment, TFinancialTransaction, TIncomeSchedule, TAgreement, TContact, 
    DtoProgram, DtoProject, DtoEmergency, DtoFunding, DtoStakeholder, DtoOrgUnit, 
    DtoGeography, DtoNonProject, DtoIdea, DtoFundingIdea, DtoStrategy>

// AFTER (34 type args) - 3 NEW at end
public class EntityService<T, TProgram, TProject, TEmergency, TFunding, TStakeholder, 
    TOrgUnit, TGeography, TNonProject, TIdea, TFundingIdea, TStrategy, TLog, TRisk, 
    TPayment, TFinancialTransaction, TIncomeSchedule, TAgreement, TContact, 
    DtoProgram, DtoProject, DtoEmergency, DtoFunding, DtoStakeholder, DtoOrgUnit, 
    DtoGeography, DtoNonProject, DtoIdea, DtoFundingIdea, DtoStrategy,
    DtoPartnerExpenditureReporting,  // +NEW
    DtoBudgetVersion,                 // +NEW
    TIATIDocument>                    // +NEW
```

### Type Constraints

New type args often have constraints:
```csharp
where DtoPartnerExpenditureReporting : Core.Model.PartnerExpenditureReporting, new()
where DtoBudgetVersion : Core.Model.BudgetVersion, new()
where TIATIDocument : Core.Model.IATIDocument, new()
```

### DI Registration Update

```csharp
// DI must also include new type args
services.AddScoped<IEntityService<...>, EntityService<..., 
    Core.Model.PartnerExpenditureReporting,  // Match constraint
    Core.Model.BudgetVersion,
    Core.Model.IATIDocument>>();
```

### Anti-Patterns
❌ Don't use `Dto.BudgetVersion` when constraint requires `Model.BudgetVersion`  
❌ Don't forget to update DI registration  
❌ Don't miss other usages (interfaces, base classes)

---

## CS0311 - Type Constraint Violation

### Error Pattern
```
error CS0311: The type 'Model.Dto.BudgetVersion' cannot be used as type parameter 
'TBudgetVersion' in the generic type or method. There is no implicit reference 
conversion from 'Model.Dto.BudgetVersion' to 'Core.Model.BudgetVersion'.
```

### Root Cause
Generic constraint requires a base type, but derived/wrong type is provided.

### Fix

**Check the constraint requirement:**
```csharp
// Constraint says:
where TBudgetVersion : Core.Model.BudgetVersion, new()

// You provided:
Model.Dto.BudgetVersion  // WRONG - this is DTO, not Model

// Correct:
Core.Model.BudgetVersion  // Use the Model type
```

### Type Namespace Guide

| Namespace | Use For | Example |
|-----------|---------|---------|
| `Core.Model.*` | Model types, entity base types | `Core.Model.BudgetVersion` |
| `Core.Model.Dto.*` | DTO types for API responses | `Core.Model.Dto.BudgetVersion` |
| `Model.*` | Client-specific models | `Model.BudgetVersion` |
| `Model.Dto.*` | Client-specific DTOs | `Model.Dto.BudgetVersion` |

### Anti-Patterns
❌ Don't confuse Model and Dto namespaces  
❌ Don't use client namespace when Core namespace is required

---

## CS0115 - Override Mismatch

### Error Pattern
```
error CS0115: 'SequenceNumberService.GetNextEntityNo(Entity)': no suitable 
method found to override
```

### Root Cause
Base class method signature changed (parameters, return type, or removed).

### Fix Process

1. **Find the method** in decompiled Core DLL or diff
2. **Compare signatures** exactly — parameters, return type, nullability
3. **Match the new signature** precisely
4. **Consider if method was renamed** — search for similar names

### Example: Parameter Type Changed

```csharp
// BEFORE - Entity parameter
public override string GetNextEntityNo(Core.Model.Entity entity)
{
    return base.GetNextEntityNo(entity);
}

// AFTER - Changed to dynamic
public override string GetNextEntityNo(dynamic entity)
{
    EntityTypeId typeId = (EntityTypeId)entity.TypeId;  // Cast from dynamic
    return base.GetNextEntityNo(entity);
}
```

### Example: Return Type Changed

```csharp
// BEFORE
public override async Task<TModel> AddProgram(TModel program, User currentUser)

// AFTER - Return type changed to tuple + new parameter
public override async Task<(TModel addedEntity, List<int> memberIds)> AddProgram(
    TModel program, User currentUser, bool pushToQueue = true)
{
    var result = await base.AddProgram(program, currentUser, pushToQueue);
    return result;
}
```

### Anti-Patterns
❌ **NEVER** blindly change `override` to `new` — breaks polymorphism  
❌ Don't assume method was deleted — it may have been renamed  
❌ Don't match just parameter names — types must match exactly

---

## CS0246 - Type Not Found

### Error Pattern
```
error CS0246: The type or namespace name 'GenerateLogframeReportQueue' 
could not be found
```

### Root Cause
Type was removed, renamed, or moved to different namespace.

### Fix Process

1. **Search diff** for the type name
2. **If removed** → Remove from constructor/usage
3. **If renamed** → Update to new name
4. **If moved** → Add correct `using` statement

### Example: Type Removed and Replaced

```csharp
// BEFORE - Old queue type
public ProgramService(
    ...existing params...,
    GenerateLogframeReportQueue logframeQueue)  // Removed

// AFTER - Use new service instead
public ProgramService(
    ...existing params...,
    ILogframe2Service<TLogframeVersion, Core.Model.LogframeObjective, TLogframeReporting> logframe2Service)
```

### Example: Missing Using

```csharp
// Error: IIATIDocumentRepository not found

// Add using:
using NGO.Core.Repositories;
// Or use full namespace:
NGO.Core.Repositories.IIATIDocumentRepository<TIATIDocument>
```

---

## CS1503 - Argument Type Mismatch

### Error Pattern
```
error CS1503: Argument 3: cannot convert from 'int[]' to 'bool'
```

### Root Cause
Method signature parameter type changed.

### Fix

**Find the new signature and update call sites:**

```csharp
// BEFORE
public List<FA> GetAllocationsForEntity(Entity entity, FundingAllocationFilter filter, params int[] excludedIds)

// Call:
var allocations = GetAllocationsForEntity(entity, filter, new[] { 1, 2, 3 });

// AFTER - Third param is now bool
public List<FA> GetAllocationsForEntity(Entity entity, FundingAllocationFilter filter, bool includeDeleted = false)

// Updated call:
var allocations = GetAllocationsForEntity(entity, filter, false);
```

---

## CS0029 - Cannot Convert

### Error Pattern
```
error CS0029: Cannot implicitly convert type 'List<Foo>' to 'List<Bar>'
```

### Root Cause
Type changed, or generic variance issue.

### Fix
Check if:
- Return type changed in base method
- Generic type parameter changed
- Need explicit cast or mapping

---

## DI Registration Errors

### Common Patterns

After constructor changes, DI registrations must be updated:

**Generic type arg count changed:**
```csharp
// BEFORE
services.AddScoped<IEntityService<..., 31 args>, EntityService<..., 31 args>>();

// AFTER
services.AddScoped<IEntityService<..., 34 args>, EntityService<..., 34 args>>();
```

**New service added:**
```csharp
// If constructor now requires ILogframe2Service, ensure it's registered:
services.AddScoped<ILogframe2Service<...>, Logframe2Service<...>>();
```

**Lazy<T> wrapper:**
```csharp
// Some services now use Lazy<T> for circular dependency resolution
// BEFORE
IPartnerExpenditureReportingExportExcelService service

// AFTER  
Lazy<IPartnerExpenditureReportingExportExcelService<TDto, TBudget>> service
```

### Finding DI Files

```powershell
# Search for DI registration files
Get-ChildItem -Recurse -Filter "*.cs" | 
    Select-String -Pattern "AddScoped|AddTransient|AddSingleton" | 
    Select-Object -Unique Path
```

Common files:
- `*ServiceRegistration*.cs`
- `*DIRegistration*.cs`  
- `Startup.cs`
- `Program.cs`
- `CommonDIRegistrations.cs`

---

## Mutation Strategies

When standard fixes don't work, try variations:

| Original Attempt | Mutation 1 | Mutation 2 | Mutation 3 |
|-----------------|------------|------------|------------|
| Add parameter X | Add X AND remove obsolete Y | Add X with default value | X might be optional (nullable) |
| Change type A→B | Maybe A→B<T> (generic) | Maybe A renamed to B | Maybe A split into B and C |
| Fix override signature | Method was renamed | Method moved to different base | Method became non-virtual |
| Add generic param T | T has constraints | T must match another T elsewhere | Interface also has new T |

### The "What If" Protocol

When stuck:
- What if the error message is misleading? → Read actual code
- What if I'm fixing symptom, not cause? → Trace back to root
- What if TWO changes are needed? → Some fixes are atomic pairs
- What if the diff is incomplete? → Decompile and verify
- What if this error is a SIDE EFFECT? → Fix different error first

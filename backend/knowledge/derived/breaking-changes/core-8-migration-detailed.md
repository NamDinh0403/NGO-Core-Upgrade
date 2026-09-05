# NGO Core 8.3.0 Migration Knowledge Base

> **Version**: 8.3.0  
> **Migration Date**: 2025  
> **Source Version**: 5.12.2  
> **Target Framework**: .NET 9  

This document serves as a reference for AI agents and developers performing Core package upgrades. It documents all breaking changes encountered and their solutions.

---

## Table of Contents
1. [Constructor Parameter Changes](#1-constructor-parameter-changes)
2. [Method Signature Changes](#2-method-signature-changes)
3. [Generic Type Parameter Changes](#3-generic-type-parameter-changes)
4. [Override to New Keyword Changes](#4-override-to-new-keyword-changes)
5. [DI Registration Updates](#5-di-registration-updates)
6. [Common Error Patterns and Solutions](#6-common-error-patterns-and-solutions)
7. [Audit Log Changes](#7-audit-log-changes)

---

## 1. Constructor Parameter Changes

### 1.1 TaskService
**Error**: `CS7036: There is no argument given that corresponds to the required parameter 'logframe2Service'`

**Solution**: Add three new parameters to constructor and base call:
```csharp
// Add to constructor parameters:
ILogframe2Service<TLogframeVersion, Core.Model.LogframeObjective, TLogframeReporting> logframe2Service,
ITaskFlowRepository<TTaskFlow> taskFlowRepository,
IMinimumRequirementRepository<MinimumRequirement> minimumRequirementRepository

// Add to base() call:
: base(...existing params..., logframe2Service, taskFlowRepository, minimumRequirementRepository)
```

### 1.2 TaskFlowService
**Error**: `CS7036: Missing 'logframe2Service' parameter`

**Solution**: Add ILogframe2Service parameter:
```csharp
// Add to constructor:
ILogframe2Service<TLogframeVersion, Core.Model.LogframeObjective, TLogframeReporting> logframe2Service

// Add to base() call at the end
```

### 1.3 TaskAssignmentService
**Error**: `CS7036: Missing 'logframe2Service' parameter`

**Solution**: Add ILogframe2Service parameter:
```csharp
ILogframe2Service<TLogframeVersion, Core.Model.LogframeObjective, TLogframeReporting> logframe2Service
```

### 1.4 EntityService
**Error**: `CS7036: Missing multiple parameters`

**Solution**: Add these parameters:
```csharp
IIATITransactionService<Core.Model.IATITransaction> iatiTransactionService,
IIATIDocumentRepository<TIATIDocument> iatiDocumentRepository,
ILogframe2ExportExcelService logframe2ExportExcelService,
IBankAccountRepository<Core.Model.BankAccount> bankAccountRepository,
IMinimumRequirementExportExcelService minimumRequirementExportExcelService
```

**Note**: Also change `IPartnerExpenditureReportingExportExcelService` to `Lazy<IPartnerExpenditureReportingExportExcelService<DtoPartnerExpenditureReporting, DtoBudgetVersion>>`

### 1.5 ExportPdfService
**Error**: `CS7036: Missing 'fieldDefinitionRepository' and other parameters`

**Solution**: Add these parameters:
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

**Important**: Change `ILogframeService` type parameter from concrete types to generic:
```csharp
// Before:
ILogframeService<Core.Model.LogframeVersion, Core.Model.LogframeObjective, Core.Model.LogframeReporting>
// After:
ILogframeService<TLogframeVersion, Core.Model.LogframeObjective, TLogframeReporting>
```

### 1.6 PaymentService
**Error**: `CS7036: Missing 'fieldOptionService' parameter`

**Solution**: Add three parameters:
```csharp
IFieldOptionService fieldOptionService,
IProjectService<Project, Entity, Core.Model.Dto.Project> projectService,
IEmailService emailService
```

### 1.7 ProjectService
**Error**: `CS7036: Missing 'partnerExpenditureReportingService' parameter`

**Solution**: Add parameter:
```csharp
IPartnerExpenditureReportingService<PartnerExpenditureReporting, Core.Model.BudgetVersion> partnerExpenditureReportingService
```

**Note**: Use `Core.Model.BudgetVersion` to avoid ambiguity with `Model.Dto.BudgetVersion`.

### 1.8 BudgetService
**Error**: `CS7036: Missing 'expenditureReportingService' parameter`

**Solution**: Add Lazy wrapper parameter:
```csharp
Lazy<IPartnerExpenditureReportingService<PartnerExpenditureReporting, T>> expenditureReportingService
```

### 1.9 FinancialActualService
**Error**: `CS7036: Missing 'overviewBoxDefRepository' parameter`

**Solution**: Add parameter:
```csharp
IOverviewBoxDefinitionRepository overviewBoxDefRepository
```

### 1.10 LogframeService
**Error**: `CS7036: Missing 'tabRepository' parameter`

**Solution**: Add parameter at end:
```csharp
ITabDefinitionRepository<TabDefinition> tabRepository
```

### 1.11 LogframeExportExcelService
**Error**: `CS7036: Missing 'securityService' parameter`

**Solution**: Add parameter:
```csharp
ISecurityService securityService
```

### 1.12 SendGridMailService
**Error**: `CS7036: Missing 'taskTemplateRepository' parameter`

**Solution**: Add parameter:
```csharp
ITaskTemplateRepository<Core.Model.TaskTemplate> taskTemplateRepository
```

### 1.13 ConfigurationController
**Error**: `CS7036: Missing 'userService' parameter`

**Solution**: Add parameter:
```csharp
IUserService<Core.Model.User> userService
```

### 1.14 BudgetController
**Error**: `CS7036: Missing 'rowNoValidator' parameter`

**Solution**: Add parameter:
```csharp
IObjectValidationService<System.Collections.Generic.List<Model.Dto.BudgetRow>> rowNoValidator
```

---

## 2. Method Signature Changes

### 2.1 GetAllocationsForEntity
**Error**: `CS1503: Argument 3: cannot convert from 'int[]' to 'bool'`

**Before**:
```csharp
public new List<FA> GetAllocationsForEntity(Entity entity, FundingAllocationFilter parameter, params int[] excludedAllocationIds)
```

**After**:
```csharp
public new List<FA> GetAllocationsForEntity(Entity entity, FundingAllocationFilter parameter, bool includeDeleted = false)
```

**Impact**: All call sites using `parameter.Id` or int arrays must be updated to pass `false` or `true`.

### 2.2 PushEntityToQueueManagement
**Error**: `CS7036: Missing 'lockRelatedDocuments' parameter`

**Before**:
```csharp
await PushEntityToQueueManagement(task.Id, currentUser.Id, pushAsNullFolderPath);
```

**After**:
```csharp
await PushEntityToQueueManagement(task.Id, currentUser.Id, taskflow.Id, pushAsNullFolderPath, false);
```

**New signature requires**: `taskFlowId`, `lockRelatedDocuments`, `sendEmail`

### 2.3 OnBuildScreenshotNameAndFolderPath
**Error**: `CS1061: 'T' does not contain a definition for 'TabFunctionId'`

**Before**:
```csharp
public new TaskScreenshotTuple OnBuildScreenshotNameAndFolderPath<T>(T task, TaskScreenshotTuple tuple)
```

**After**:
```csharp
public new TaskScreenshotTuple OnBuildScreenshotNameAndFolderPath<T, TF>(T task, TF taskFlow, TaskScreenshotTuple tuple) 
    where T : ITask 
    where TF : Core.Model.TaskFlow
```

### 2.4 GetChildRowValues (Removed)
**Error**: `CS1503: Argument 4: cannot convert from 'List<object>' to 'Dictionary<string, object>'`

**Solution**: Remove the `GetChildRowValues` call entirely if not needed, or adapt to new signature.

---

## 3. Generic Type Parameter Changes

### 3.1 EntityService
**Before**: 31 type parameters  
**After**: 33 type parameters (+`DtoPartnerExpenditureReporting`, `DtoBudgetVersion`, `TIATIDocument`)

```csharp
// Add these type parameters and constraints:
where DtoPartnerExpenditureReporting : PartnerExpenditureReporting, new()
where DtoBudgetVersion : BudgetVersion, new()
where TIATIDocument : Core.Model.IATIDocument, new()
```

### 3.2 ExportPdfService
**Before**: 38 type parameters  
**After**: 42 type parameters (+`TBeneficiaryVersion`, `DBeneficiaryVersion`, `DLogframeVersion`, `DLogframeReporting`)

```csharp
// Add these type parameters and constraints:
where TBeneficiaryVersion : Core.Model.BeneficiaryVersion, new()
where DBeneficiaryVersion : Core.Model.Dto.BeneficiaryVersion, new()
where DLogframeVersion : Core.Model.Dto.LogframeVersion, new()
where DLogframeReporting : Core.Model.Dto.LogframeReporting, new()
```

### 3.3 IExchangeRateRepository
**Before**: 1 type parameter  
**After**: 2 type parameters

### 3.4 IPartnerExpenditureReportingExportExcelService
**Before**: 0 type parameters  
**After**: 2 type parameters

---

## 4. Override to New Keyword Changes

When base class methods are removed or signatures change incompatibly, change `override` to `new`:

### 4.1 BudgetService.BindVersionInfo
```csharp
// Before:
protected override T BindVersionInfo<T>(T version)
// After:
protected new T BindVersionInfo<T>(T version)
```

### 4.2 TaskService.BuildLockedPartialFolderUrl
```csharp
// Before:
protected override string BuildLockedPartialFolderUrl(...)
// After:
protected new string BuildLockedPartialFolderUrl(...)
```

### 4.3 FundingFinancialService methods
```csharp
// Change these from override to new:
protected new decimal GetTotalActual(...)
protected new decimal GetTotalActualCur(...)
public new List<FA> GetAllocationsForEntity(...)
```

### 4.4 ExtractInjectedMetadataService.GenerateEntityLink
```csharp
// Before:
protected override string GenerateEntityLink(...)
// After:
protected new string GenerateEntityLink(...)
```

### 4.5 BudgetTaskActionService.OnBeforeTaskApproved
```csharp
// Before:
public override void OnBeforeTaskApproved<T>(T task)
// After:
public new void OnBeforeTaskApproved<T, TF>(T task, TF taskFlow) where T : ITask where TF : Core.Model.TaskFlow
```

---

## 5. DI Registration Updates

### 5.1 EntityService Registration
```csharp
// Before (31 types):
services.AddScoped<Core.Services.IEntityService<Core.Model.Entity>, 
    Services.EntityService<..., Core.Model.Dto.Strategy>>();

// After (33 types):
services.AddScoped<Core.Services.IEntityService<Core.Model.Entity>, 
    Services.EntityService<..., Core.Model.Dto.Strategy, 
    Core.Model.PartnerExpenditureReporting, Core.Model.BudgetVersion, Core.Model.IATIDocument>>();
```

**Important**: Use `Core.Model.PartnerExpenditureReporting` (domain model), NOT `Core.Model.Dto.PartnerExpenditureReporting`.

### 5.2 ExportPdfService Registration
```csharp
// Before (38 types):
services.AddScoped<Core.Services.IExportPdfService, 
    Services.ExportPdfService<..., Core.Model.Dto.FundingPlanVersion>>();

// After (42 types):
services.AddScoped<Core.Services.IExportPdfService, 
    Services.ExportPdfService<..., Core.Model.Dto.FundingPlanVersion,
    Core.Model.BeneficiaryVersion, Core.Model.Dto.BeneficiaryVersion, 
    Core.Model.Dto.LogframeVersion, Core.Model.Dto.LogframeReporting>>();
```

### 5.3 PartnerExpenditureReportingService Registration
**Runtime Error**: `InvalidOperationException: No constructor for type 'PartnerExpenditureReportingExportExcelService'...`

**Cause**: Type constraint requires `Core.Model.BudgetVersion`, not custom `Model.BudgetVersion`

**Before (incorrect)**:
```csharp
services.AddScoped<Core.Services.IPartnerExpenditureReportingService<Core.Model.PartnerExpenditureReporting, Model.BudgetVersion>, 
    Core.Services.PartnerExpenditureReportingService<Core.Model.PartnerExpenditureReporting, Model.BudgetVersion>>();
services.AddScoped<Core.Services.IPartnerExpenditureReportingExportExcelService<Core.Model.PartnerExpenditureReporting, Model.BudgetVersion>, 
    Core.Services.PartnerExpenditureReportingExportExcelService<Core.Model.PartnerExpenditureReporting, Model.BudgetVersion, Core.Model.Dto.BudgetVersion>>();
```

**After (correct)**:
```csharp
services.AddScoped<Core.Services.IPartnerExpenditureReportingService<Core.Model.PartnerExpenditureReporting, Core.Model.BudgetVersion>, 
    Core.Services.PartnerExpenditureReportingService<Core.Model.PartnerExpenditureReporting, Core.Model.BudgetVersion>>();
services.AddScoped<Core.Services.IPartnerExpenditureReportingExportExcelService<Core.Model.PartnerExpenditureReporting, Core.Model.BudgetVersion>, 
    Core.Services.PartnerExpenditureReportingExportExcelService<Core.Model.PartnerExpenditureReporting, Core.Model.BudgetVersion, Core.Model.Dto.BudgetVersion>>();
```

**Why**: `PartnerExpenditureReportingExportExcelService<T, B, BDto>` has constraint `where B : Core.Model.BudgetVersion`, so custom `Model.BudgetVersion` (even if inherits from it) may not satisfy DI resolution.

---

## 6. Common Error Patterns and Solutions

### Pattern 1: CS7036 - Missing Constructor Parameter
**Cause**: Base class constructor added new required parameters.  
**Solution**: 
1. Check the error message for the parameter name
2. Add the parameter to derived class constructor
3. Pass it to the base() call

### Pattern 2: CS0305 - Wrong Number of Type Arguments
**Cause**: Base generic class added new type parameters.  
**Solution**:
1. Check the base class definition for new type parameters
2. Add matching type parameters to derived class
3. Add corresponding `where` constraints
4. Update all DI registrations

### Pattern 3: CS0115 - No Suitable Method to Override
**Cause**: Base class method was removed or signature changed significantly.  
**Solution**: Change `override` to `new` keyword.

### Pattern 4: CS1503 - Argument Type Mismatch
**Cause**: Method parameter types changed.  
**Solution**:
1. Check the new method signature
2. Update call sites to match new parameter types
3. Common changes: `params int[]` → `bool`, `List<>` → `Dictionary<>`

### Pattern 5: CS0311 - Type Constraint Violation
**Cause**: Generic type argument doesn't match constraint (e.g., using Dto type where domain type expected).  
**Solution**: Use the correct type (usually domain model, not DTO).

### Pattern 6: CS0104 - Ambiguous Reference
**Cause**: Same type name exists in multiple namespaces (e.g., `BudgetVersion`).  
**Solution**: Use fully qualified name: `Core.Model.BudgetVersion` or `Model.Dto.BudgetVersion`.

### Pattern 7: CS0246 - Type Not Found (Lazy<>)
**Cause**: Missing `using System;` directive.  
**Solution**: Add `using System;` to the file.

---

## 7. Audit Log Changes

### 7.1 Compress Method Signature Change
**Location**: `NGO.Core.Common.Extensions.MiscExtensions.Compress<T>()`

**Version 5.12.2 (old)**:
```csharp
public static byte[] Compress<T>(this T obj)
// Internally uses: new AuditLogContractResolver()
```

**Version 8.3.0 (new)**:
```csharp
public static byte[] Compress<T>(this T obj, JsonSerializerSettings settings = null)
// If settings == null: uses CamelCasePropertyNamesContractResolver + NullValueHandling.Ignore
// If settings != null: uses the provided settings
```

### 7.2 Required Code Change
**File**: `NgoContext.cs` (or any class overriding `SaveChanges()` for audit)

**Before**:
```csharp
byte[] message = audit.Entries.Compress(new JsonSerializerSettings { ContractResolver = new AuditLogContractResolver() });
```

**After** (Recommended - use singleton):
```csharp
byte[] message = audit.Entries.Compress(new JsonSerializerSettings { ContractResolver = AuditLogContractResolver.Instance });
```

### 7.3 Why This Change Matters
- **Performance**: `AuditLogContractResolver.Instance` is a static singleton, avoiding object creation on every save
- **Consistency**: The default behavior changed from `AuditLogContractResolver` to `CamelCasePropertyNamesContractResolver`
- **Breaking Change**: If you don't pass `JsonSerializerSettings`, the audit log format will be different (camelCase vs original casing)

---

## Migration Checklist

- [ ] Update all NGO.Core.* package references to 8.3.0
- [ ] Update TargetFramework to net9.0 (if required)
- [ ] Fix EntityRepository constructor (ISitePermissionBackupRepository)
- [ ] Fix PaymentMapper constructor (IIncomeScheduleMapper)
- [ ] Fix TaskService constructor (3 new params)
- [ ] Fix TaskFlowService constructor (ILogframe2Service)
- [ ] Fix TaskAssignmentService constructor + PushEntityToQueueManagement call
- [ ] Fix EntityService (5 new params + 3 new type params)
- [ ] Fix ExportPdfService (8 new params + 4 new type params)
- [ ] Fix PaymentService (3 new params)
- [ ] Fix ProjectService (IPartnerExpenditureReportingService)
- [ ] Fix BudgetService (Lazy<IPartnerExpenditureReportingService>)
- [ ] Fix FinancialActualService (IOverviewBoxDefinitionRepository)
- [ ] Fix LogframeService (ITabDefinitionRepository)
- [ ] Fix LogframeExportExcelService (ISecurityService)
- [ ] Fix SendGridMailService (ITaskTemplateRepository)
- [ ] Fix ConfigurationController (IUserService)
- [ ] Fix BudgetController (rowNoValidator)
- [ ] Fix FundingFinancialService.GetAllocationsForEntity signature
- [ ] Fix BudgetTaskActionService method signatures
- [ ] Update DI registrations in CustomCommonDIRegistrations.cs
- [ ] Update tools (LogframeServiceTool, LogframeExportExcelToolService)
- [ ] **Fix NgoContext.SaveChanges() - use AuditLogContractResolver.Instance**
- [ ] Run full build to verify all errors resolved

---

## Files Modified During Migration

### Repositories Layer
- `NGO.Repositories\NgoContext.cs` - Audit log Compress() method change
- `NGO.Repositories\EntityRepository.cs`
- `NGO.Repositories\Mapping\PaymentMapper.cs`
- `NGO.Repositories\Mapping\OptionsMapper\EntityRoleOptionsMapperExt.cs`

### Services Layer
- `NGO.Services\TaskService.cs`
- `NGO.Services\TaskFlowService.cs`
- `NGO.Services\TaskAssignmentService.cs`
- `NGO.Services\EntityService.cs`
- `NGO.Services\ExportPdfServices\ExportPdfService.cs`
- `NGO.Services\ExportPdfServices\ExtractInjectedMetadataService.cs`
- `NGO.Services\PaymentService.cs`
- `NGO.Services\ProjectService.cs`
- `NGO.Services\BudgetService.cs`
- `NGO.Services\FinancialActualService.cs`
- `NGO.Services\FundingFinancialService.cs`
- `NGO.Services\LogframeService.cs`
- `NGO.Services\LogframeExportExcelService.cs`
- `NGO.Services\EmailService\SendGridMailService.cs`
- `NGO.Services\TaskActions\BudgetTaskActionService.cs`

### Model Layer
- `NGO.Model\Mapping\OverviewBoxDefinitionDtoMapper.cs`

### Infrastructure Layer
- `NGO.Infrastructure\CustomCommonDIRegistrations.cs`

### API Layer
- `NGO\ConfigurationController.cs`
- `NGO\Controllers\BudgetController.cs`

### Tools
- `NGO.Tools\NGO.Tools.ExportReportData\Services\LogframeExportExcelToolService.cs`
- `NGO.Tools\NGO.Tools.LogframeMigration\Services\LogframeServiceTool.cs`

---

*This knowledge base was generated during the Core 5.12.2 → 8.3.0 migration and can be used as a reference for future upgrades.*

# NGO Core Release Notes: 9.4.1

## Summary
Core 9.4.1 changes: 59 database, 905 backend, 236 frontend, 380 shared.

## Database Migrations
- [CHG-9.4.1-DB-001](changes/database.json#CHG-9.4.1-DB-001): MODIFIED ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20250319_RemoveWorkflowRedundantPermissions.sql
- [CHG-9.4.1-DB-002](changes/database.json#CHG-9.4.1-DB-002): MODIFIED ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20250701_InitIdeaMembers.sql
- [CHG-9.4.1-DB-003](changes/database.json#CHG-9.4.1-DB-003): ADDED ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20260410_UpdateMissingSQLDtoWorkflowType.sql
- [CHG-9.4.1-DB-004](changes/database.json#CHG-9.4.1-DB-004): ADDED ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20260413_UpdateTasksBoxPermissions.sql
- [CHG-9.4.1-DB-005](changes/database.json#CHG-9.4.1-DB-005): ADDED ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20260423_EnsureIdFields.sql
- [CHG-9.4.1-DB-006](changes/database.json#CHG-9.4.1-DB-006): ADDED ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20260507_UpdateFieldInstanceOverallStatus.sql
- [CHG-9.4.1-DB-007](changes/database.json#CHG-9.4.1-DB-007): ADDED ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20260521_UpdateEmailTemplates.sql
- [CHG-9.4.1-DB-008](changes/database.json#CHG-9.4.1-DB-008): ADDED ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20260527_UpdateIconForNewTextAreaControl.sql
- [CHG-9.4.1-DB-009](changes/database.json#CHG-9.4.1-DB-009): ADDED ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20260706_UpdateRollupForProgramFinanceMonitoringBoxes.sql
- [CHG-9.4.1-DB-010](changes/database.json#CHG-9.4.1-DB-010): ADDED ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20260811_UpdateActualsValidation.sql
- [CHG-9.4.1-DB-011](changes/database.json#CHG-9.4.1-DB-011): ADDED ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20260820_AutoExpandStructureObjectives.sql
- [CHG-9.4.1-DB-012](changes/database.json#CHG-9.4.1-DB-012): ADDED ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20260820_UpdateResxForBreakdownTemplate.sql
- [CHG-9.4.1-DB-013](changes/database.json#CHG-9.4.1-DB-013): ADDED ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20260827_FixSqlMappingForTaskExtraFields.sql
- [CHG-9.4.1-DB-014](changes/database.json#CHG-9.4.1-DB-014): ADDED ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20260915_UpdateSqlMappingForIATIAnalyse.sql
- [CHG-9.4.1-DB-015](changes/database.json#CHG-9.4.1-DB-015): ADDED ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20260916_SetupIATIAnalysePermissions.sql
- [CHG-9.4.1-DB-016](changes/database.json#CHG-9.4.1-DB-016): ADDED ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20260925_AddIndicatorReportingConfigsToLogframeSetting.sql
- [CHG-9.4.1-DB-017](changes/database.json#CHG-9.4.1-DB-017): ADDED ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20261005_UpdateResourceStringsForEntityTabs.sql
- [CHG-9.4.1-DB-018](changes/database.json#CHG-9.4.1-DB-018): ADDED ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/AfterDeployment/20261006_RemoveCoreReviewApprovalSent.sql
- [CHG-9.4.1-DB-019](changes/database.json#CHG-9.4.1-DB-019): ADDED ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/BeforeDeployment/20251128_DropGetEntitiesByRelatedEntitiesViewFunction.sql
- [CHG-9.4.1-DB-020](changes/database.json#CHG-9.4.1-DB-020): ADDED ngo-api-core/NGO/NGO.Core.Deployment/DataFixes/BeforeDeployment/20260616_RemoveUnusedLogframe2FieldDependency.sql
- ... and 39 more database changes

## Backend High Risk / Breaking Changes
- [CHG-9.4.1-BE-014](changes/backend.json#CHG-9.4.1-BE-014): dotnet-target-framework-or-package-refs in ngo-api-core/NGO/NGO.Core.API/NGO.Core.API.csproj
- [CHG-9.4.1-BE-015](changes/backend.json#CHG-9.4.1-BE-015): dotnet-target-framework-or-package-refs in ngo-api-core/NGO/NGO.Core.Common.Tests/NGO.Core.Common.Tests.csproj
- [CHG-9.4.1-BE-027](changes/backend.json#CHG-9.4.1-BE-027): dotnet-target-framework-or-package-refs in ngo-api-core/NGO/NGO.Core.Common/NGO.Core.Common.csproj
- [CHG-9.4.1-BE-032](changes/backend.json#CHG-9.4.1-BE-032): dotnet-target-framework-or-package-refs in ngo-api-core/NGO/NGO.Core.Deployment/NGO.Core.Deployment.csproj
- [CHG-9.4.1-BE-035](changes/backend.json#CHG-9.4.1-BE-035): dotnet-target-framework-or-package-refs in ngo-api-core/NGO/NGO.Core.Infrastructure/NGO.Core.Infrastructure.csproj
- [CHG-9.4.1-BE-101](changes/backend.json#CHG-9.4.1-BE-101): dotnet-target-framework-or-package-refs in ngo-api-core/NGO/NGO.Core.Model/NGO.Core.Model.csproj
- [CHG-9.4.1-BE-102](changes/backend.json#CHG-9.4.1-BE-102): dotnet-target-framework-or-package-refs in ngo-api-core/NGO/NGO.Core.Repositories.Tests/NGO.Core.Repositories.Tests.csproj
- [CHG-9.4.1-BE-121](changes/backend.json#CHG-9.4.1-BE-121): dotnet-source in ngo-api-core/NGO/NGO.Core.Repositories/DataModel/View/CoreReviewAndApprovalSent.cs
- [CHG-9.4.1-BE-152](changes/backend.json#CHG-9.4.1-BE-152): dotnet-source in ngo-api-core/NGO/NGO.Core.Repositories/MigrationsEF6/201905270909438_Initial.Designer.cs
- [CHG-9.4.1-BE-153](changes/backend.json#CHG-9.4.1-BE-153): dotnet-source in ngo-api-core/NGO/NGO.Core.Repositories/MigrationsEF6/201905270909438_Initial.cs
- [CHG-9.4.1-BE-154](changes/backend.json#CHG-9.4.1-BE-154): dotnet-source in ngo-api-core/NGO/NGO.Core.Repositories/MigrationsEF6/201905310318504_InitTopNavigation.Designer.cs
- [CHG-9.4.1-BE-155](changes/backend.json#CHG-9.4.1-BE-155): dotnet-source in ngo-api-core/NGO/NGO.Core.Repositories/MigrationsEF6/201905310318504_InitTopNavigation.cs
- [CHG-9.4.1-BE-156](changes/backend.json#CHG-9.4.1-BE-156): dotnet-source in ngo-api-core/NGO/NGO.Core.Repositories/MigrationsEF6/201906060609244_UpdateSPContentType.Designer.cs
- [CHG-9.4.1-BE-157](changes/backend.json#CHG-9.4.1-BE-157): dotnet-source in ngo-api-core/NGO/NGO.Core.Repositories/MigrationsEF6/201906060609244_UpdateSPContentType.cs
- [CHG-9.4.1-BE-158](changes/backend.json#CHG-9.4.1-BE-158): dotnet-source in ngo-api-core/NGO/NGO.Core.Repositories/MigrationsEF6/201906100320305_UpdateEntityDefinition.Designer.cs
- [CHG-9.4.1-BE-159](changes/backend.json#CHG-9.4.1-BE-159): dotnet-source in ngo-api-core/NGO/NGO.Core.Repositories/MigrationsEF6/201906100320305_UpdateEntityDefinition.cs
- [CHG-9.4.1-BE-160](changes/backend.json#CHG-9.4.1-BE-160): dotnet-source in ngo-api-core/NGO/NGO.Core.Repositories/MigrationsEF6/201906120450163_Store_GetNextEntityNo.Designer.cs
- [CHG-9.4.1-BE-161](changes/backend.json#CHG-9.4.1-BE-161): dotnet-source in ngo-api-core/NGO/NGO.Core.Repositories/MigrationsEF6/201906120450163_Store_GetNextEntityNo.cs
- [CHG-9.4.1-BE-162](changes/backend.json#CHG-9.4.1-BE-162): dotnet-source in ngo-api-core/NGO/NGO.Core.Repositories/MigrationsEF6/201906120834365_ListSettings.Designer.cs
- [CHG-9.4.1-BE-163](changes/backend.json#CHG-9.4.1-BE-163): dotnet-source in ngo-api-core/NGO/NGO.Core.Repositories/MigrationsEF6/201906120834365_ListSettings.cs
- ... and 661 more backend review items

## Frontend High Risk / Dependencies
- [CHG-9.4.1-FE-001](changes/frontend.json#CHG-9.4.1-FE-001): npm-dependency in ngo-client-core/package-lock.json

## Upgrade Instructions
1. Review and apply database migrations before deploying API services.

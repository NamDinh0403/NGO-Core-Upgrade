# Core 8.0.0 – Backend changes theo class

> Tự động trích từ **Core 8.0.0 diff.txt** và nhóm theo File → Class → Hàm. Mỗi thay đổi có nhãn phân loại (constructor, thêm tham số, thêm model/generic, sửa logic, đổi HTTP verb, đổi route, v.v.).

## File: `ngo-api-core/NGO/NGO.Core.API/BaseControllers/AdminIATIPageController.cs`
### Class: `(global)`
- **using · Microsoft.AspNetCore.Mvc** — _using_
  
  Thay đổi using: +using Microsoft.AspNetCore.Mvc;

```diff
+using Microsoft.AspNetCore.Mvc;
```
- **using · Microsoft.Extensions.Options** — _using_
  
  Thay đổi using: +using Microsoft.Extensions.Options;

```diff
+using Microsoft.Extensions.Options;
```
- **using · Newtonsoft.Json.Linq** — _using_
  
  Thay đổi using: +using Newtonsoft.Json.Linq;

```diff
+using Newtonsoft.Json.Linq;
```
- **using · NGO.Core.Common.Configurations** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Configurations;

```diff
+using NGO.Core.Common.Configurations;
```
- **using · NGO.Core.Common.Utilities** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Utilities;

```diff
+using NGO.Core.Common.Utilities;
```
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```
- **using · System.Globalization** — _using_
  
  Thay đổi using: +using System.Globalization;

```diff
+using System.Globalization;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · Microsoft.Extensions.Logging** — _using_
  
  Thay đổi using: +using Microsoft.Extensions.Logging;

```diff
+using Microsoft.Extensions.Logging;
```

### Class: `AdminIATIPageController<TIATIForm, TIATITransactionImport>`
- **class · AdminIATIPageController<TIATIForm, TIATITransactionImport>** — _class:generic-change_
  
  Thay đổi khai báo class: class AdminIATIPageController<TIATIForm, TIATITransactionImport>

```diff
+    public abstract class AdminIATIPageController<TIATIForm, TIATITransactionImport> : NGOControllerBase 
```
- **field · _appContext** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IApplicationContext _appContext;

```diff
+        protected readonly IApplicationContext _appContext;
```
- **field · _importMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<Model.Dto.IATITransactionImport, Model.IATITransactionImport> _importMapper;

```diff
+        protected readonly IDtoMapper<Model.Dto.IATITransactionImport, Model.IATITransactionImport> _importMapper;
```
- **field · _appSettings** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IOptions<CoreAppSettings> _appSettings;

```diff
+        protected readonly IOptions<CoreAppSettings> _appSettings;
```
- **field · _resourceStringService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IResourceStringService _resourceStringService;

```diff
+        protected readonly IResourceStringService _resourceStringService;
```
- **field · _logger** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ILogger _logger;

```diff
+        protected readonly ILogger _logger;
```
- **field · _importService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IIATITransactionImportService<TIATITransactionImport> _importService;

```diff
+        protected readonly IIATITransactionImportService<TIATITransactionImport> _importService;
```
- **field · _importExcelService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IIATITransactionImportExcelService _importExcelService;

```diff
+        protected readonly IIATITransactionImportExcelService _importExcelService;
```
- **field · _iatiTransactionService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IIATITransactionService<Model.IATITransaction> _iatiTransactionService;

```diff
+        protected readonly IIATITransactionService<Model.IATITransaction> _iatiTransactionService;
```
- **constructor · AdminIATIPageController** — _logic-change_
  
  -        public AdminIATIPageController(IIATIPageService<TIATIForm> service,

```diff
         protected readonly IUserService<Core.Model.User> _userService;
         protected readonly IDtoMapper<Model.Dto.User, Core.Model.User> _userMapper;
         protected readonly GenerateIATIFileQueue _generateIATIFileQueue;
+        protected readonly IDtoMapper<Model.Dto.IATITransactionImport, Model.IATITransactionImport> _importMapper;
+        protected readonly IOptions<CoreAppSettings> _appSettings;
+        protected readonly IResourceStringService _resourceStringService;
+        protected readonly ILogger _logger;
+        protected readonly IIATITransactionImportService<TIATITransactionImport> _importService;
+        protected readonly IIATITransactionImportExcelService _importExcelService;
+        protected readonly IIATITransactionService<Model.IATITransaction> _iatiTransactionService;
 
-        public AdminIATIPageController(IIATIPageService<TIATIForm> service,
```
- **constructor · AdminIATIPageController** — _logic-change_
  
  +        public AdminIATIPageController(IApplicationContext appContext,

```diff
         protected readonly GenerateIATIFileQueue _generateIATIFileQueue;
+        protected readonly IDtoMapper<Model.Dto.IATITransactionImport, Model.IATITransactionImport> _importMapper;
+        protected readonly IOptions<CoreAppSettings> _appSettings;
+        protected readonly IResourceStringService _resourceStringService;
+        protected readonly ILogger _logger;
+        protected readonly IIATITransactionImportService<TIATITransactionImport> _importService;
+        protected readonly IIATITransactionImportExcelService _importExcelService;
+        protected readonly IIATITransactionService<Model.IATITransaction> _iatiTransactionService;
 
-        public AdminIATIPageController(IIATIPageService<TIATIForm> service,
-            IConfigurationService<Core.Model.EntityDefinition, Core.Model.TabDefinition> configurationService,
+        public AdminIATIPageController(IApplicationContext appContext, 
```
- **method · GetBrowseIATIFiles** — _—_
  
  -        [HttpGet]
+        [HttpPost]
-        public List<Model.IATIFile> GetBrowseIATIFiles()

```diff
@@ -53,12 +89,16 @@ namespace NGO.Core.API.BaseControllers
             return true;
         }
 
-        [HttpGet]
+        [HttpPost]
         [NGOCheckPermission(Action = (int)PermissionActionId.Edit)]
         [Route("browseIATIFiles")]
-        public List<Model.IATIFile> GetBrowseIATIFiles()
```
- **method · GetBrowseIATIFiles** — _param:+FromBody_
  
  +        public Model.BrowseListResult<Model.IATIFile> GetBrowseIATIFiles([FromBody] int currentFilesLength)

```diff
@@ -53,12 +89,16 @@ namespace NGO.Core.API.BaseControllers
             return true;
         }
 
-        [HttpGet]
+        [HttpPost]
         [NGOCheckPermission(Action = (int)PermissionActionId.Edit)]
         [Route("browseIATIFiles")]
-        public List<Model.IATIFile> GetBrowseIATIFiles()
+        public Model.BrowseListResult<Model.IATIFile> GetBrowseIATIFiles([FromBody] int currentFilesLength)
```
- **method · DownloadExportedStructure** — _logic-change, param:+FromBody_
  
  +        [Route("browseTransactionImports")]
+        [HttpGet]
+        [NGOCheckPermission(Action = (int)PermissionActionId.Edit)]
+        [HttpPost]
+        [NGOCheckPermission(Action = (int)PermissionActionId.Edit)]
+        [Route("exportTransactionTemplate")]
+        public IActionResult DownloadExportedStructure([FromBody] ListParameter parameter)

```diff
+        [Route("browseTransactionImports")]
+        [HttpGet]
+        [NGOCheckPermission(Action = (int)PermissionActionId.Edit)]
+        public virtual List<Model.Dto.IATITransactionImport> GetTransactionImports()
+        {
+            return _importService.GetTransactionImports().Select(_importMapper.ToDto).OrderByDescending(p => p.ModifiedDate).ToList();
+        }
+
+        [HttpPost]
+        [NGOCheckPermission(Action = (int)PermissionActionId.Edit)]
+        [Route("exportTransactionTemplate")]
+        public IActionResult DownloadExportedStructure([FromBody] ListParameter parameter)
```
- **method · GetMaxEmailAttachmentFileSizeMb** — _logic-change_
  
  +        [Route("uploadTransactionImport/{entityTypeId}")]
+        [HttpPost]
+        [NGOCheckPermission(Action = (int)PermissionActionId.Edit)]
+        [HttpGet]
+        [NGOCheckPermission(Action = (int)PermissionActionId.Edit)]
+        [Route("getMaxEmailAttachmentFileSizeMb")]
+        public int GetMaxEmailAttachmentFileSizeMb()

```diff
+                {
+                    throw new Model.NGOFriendlyMessageException(errorMessage);
+                }
+            }
+
+            return true;
+        }
+
+        [HttpGet]
+        [NGOCheckPermission(Action = (int)PermissionActionId.Edit)]
+        [Route("getMaxEmailAttachmentFileSizeMb")]
+        public int GetMaxEmailAttachmentFileSizeMb()
```

### Class: `AdminIATIPageController<TIATIForm>`
- **class · AdminIATIPageController<TIATIForm>** — _class:generic-change_
  
  Thay đổi khai báo class: class AdminIATIPageController<TIATIForm>

```diff
-    public abstract class AdminIATIPageController<TIATIForm> : NGOControllerBase where TIATIForm: Model.IATIForm, new()
```


## File: `ngo-api-core/NGO/NGO.Core.API/BaseControllers/AdminMinimumRequirementsController.cs`
### Class: `(global)`
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```
- **using · NGO.Core.Model.Mapping** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Mapping;

```diff
+using NGO.Core.Model.Mapping;
```
- **using · NGO.Core.Services** — _using_
  
  Thay đổi using: +using NGO.Core.Services;

```diff
+using NGO.Core.Services;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```

### Class: `AdminMinimumRequirementsController<TModel, TDto>`
- **class · AdminMinimumRequirementsController<TModel, TDto>** — _class:generic-change_
  
  Thay đổi khai báo class: class AdminMinimumRequirementsController<TModel, TDto>

```diff
+    public abstract class AdminMinimumRequirementsController<TModel, TDto> : NGOControllerBase
```
- **field · _service** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IMinimumRequirementService<TModel> _service;

```diff
+        protected readonly IMinimumRequirementService<TModel> _service;
```
- **field · _dtoMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<TDto, TModel> _dtoMapper;

```diff
+        protected readonly IDtoMapper<TDto, TModel> _dtoMapper;
```
- **field · _context** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IApplicationContext _context;

```diff
+        protected readonly IApplicationContext _context;
```
- **constructor · AdminMinimumRequirementsController** — _logic-change_
  
  +        public AdminMinimumRequirementsController(

```diff
+namespace NGO.Core.API.BaseControllers
+{
+    [NGOEntityContext(TabFunctionId = (int)TabFunctionId.AdminMinimumRequirements, FunctionId = (int)FunctionDefinitionTypeId.AdminPage)]
+    public abstract class AdminMinimumRequirementsController<TModel, TDto> : NGOControllerBase
+        where TModel : Model.MinimumRequirement, new()
+        where TDto : Model.Dto.MinimumRequirement, new()
+    {
+        protected readonly IMinimumRequirementService<TModel> _service;
+        protected readonly IDtoMapper<TDto, TModel> _dtoMapper;
+        protected readonly IApplicationContext _context;
+
+        public AdminMinimumRequirementsController(
```


## File: `ngo-api-core/NGO/NGO.Core.API/BaseControllers/AdminWebJobMonitoringController.cs`
### Class: `(global)`
- **using · NGO.Core.Model.Dto.Configuration** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Dto.Configuration;

```diff
+using NGO.Core.Model.Dto.Configuration;
```


## File: `ngo-api-core/NGO/NGO.Core.API/BaseControllers/BudgetController.cs`
### Class: `(global)`
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **field · _rowNoValidator** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IObjectValidationService<List<BRDto>> _rowNoValidator;

```diff
+        protected readonly IObjectValidationService<List<BRDto>> _rowNoValidator;
```


## File: `ngo-api-core/NGO/NGO.Core.API/BaseControllers/ConfigurationController.cs`
### Class: `(global)`
- **field · _userService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IUserService<Model.User> _userService;

```diff
+        protected readonly IUserService<Model.User> _userService;
```


## File: `ngo-api-core/NGO/NGO.Core.API/BaseControllers/EntityIATIPageController.cs`
### Class: `(global)`
- **field · _appContext** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IApplicationContext _appContext;

```diff
+        protected readonly IApplicationContext _appContext;
```
- **method · GetSetting** — _logic-change, param:+FromRoute_
  
  +        [NGOCheckPermission(Action = (int)PermissionActionId.List)]
+        [HttpGet("setting")]
+        public Model.IATISetting GetSetting([FromRoute] int entityId)

```diff
+            IApplicationContext appContext)
         {
             _service = service;
             _configurationService = configurationService;
             _validator = validator;
             _mapper = mapper;
+            _appContext = appContext;
+        }
+
+        [NGOCheckPermission(Action = (int)PermissionActionId.List)]
+        [HttpGet("setting")]
+        public Model.IATISetting GetSetting([FromRoute] int entityId)
```
- **method · Get** — _logic-change_
  
  -        [NGOCheckPermission(Action = (int)PermissionActionId.Edit)]
+        [NGOCheckPermission(Action = (int)PermissionActionId.List)]
public TDto Get(int entityId)

```diff
+        [NGOCheckPermission(Action = (int)PermissionActionId.List)]
+        [HttpGet("setting")]
+        public Model.IATISetting GetSetting([FromRoute] int entityId)
+        {
+            return _service.GetSetting();
         }
 
         [HttpGet]
-        [NGOCheckPermission(Action = (int)PermissionActionId.Edit)]
+        [NGOCheckPermission(Action = (int)PermissionActionId.List)]
         [Route("")]
         public TDto Get(int entityId)
```
- **method · Put** — _—_
  
  public bool Put(int entityId, TDto form)

```diff
@@ -44,7 +54,7 @@ namespace NGO.Core.API.BaseControllers
         public bool Put(int entityId, TDto form)
```


## File: `ngo-api-core/NGO/NGO.Core.API/BaseControllers/ExchangeRateController.cs`
### Class: `(global)`
- **using · System.IO** — _using_
  
  Thay đổi using: +using System.IO;

```diff
+using System.IO;
```
- **using · System.IO.Compression** — _using_
  
  Thay đổi using: +using System.IO.Compression;

```diff
+using System.IO.Compression;
```
- **using · System.Text** — _using_
  
  Thay đổi using: +using System.Text;

```diff
+using System.Text;
```
- **using · System.Text.Json** — _using_
  
  Thay đổi using: +using System.Text.Json;

```diff
+using System.Text.Json;
```
- **field · _service** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly IExchangeRateService<E> _service;

```diff
-        protected readonly IExchangeRateService<E> _service;
```
- **field · _service** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IExchangeRateService<E, EDto> _service;

```diff
+        protected readonly IExchangeRateService<E, EDto> _service;
```
- **method · Get** — _—_
  
  -        public List<EDto> Get()

```diff
@@ -89,9 +93,9 @@ namespace NGO.Core.API.BaseControllers
 
         [Route("all")]
         [HttpPost]
-        public List<EDto> Get()
```


## File: `ngo-api-core/NGO/NGO.Core.API/BaseControllers/FundingIdeaController.cs`
### Class: `(global)`
- **field · _sequenceNumberService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ISequenceNumberService _sequenceNumberService;

```diff
+        protected readonly ISequenceNumberService _sequenceNumberService;
```


## File: `ngo-api-core/NGO/NGO.Core.API/BaseControllers/IdeasController.cs`
### Class: `(global)`
- **field · _sequenceNumberService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ISequenceNumberService _sequenceNumberService;

```diff
+        protected readonly ISequenceNumberService _sequenceNumberService;
```


## File: `ngo-api-core/NGO/NGO.Core.API/BaseControllers/LogframeImportedController.cs`
### Class: `(global)`
- **method · GetBrowseImports** — _—_
  
  -        [NGOCheckPermission(Action = (int)Core.Model.Enums.PermissionActionId.View)]
+        [NGOCheckPermission(Action = (int)Core.Model.Enums.PermissionActionId.View, TabFunctionId = (int)TabFunctionId.Logframe2IndicatorTracker)]
public List<Model.Dto.ImportedFile> GetBrowseImports(int entityId)

```diff
@@ -115,7 +115,7 @@ namespace NGO.Core.API.BaseControllers
 
         [Route("logframeImported/browseImports")]
         [HttpPost]
-        [NGOCheckPermission(Action = (int)Core.Model.Enums.PermissionActionId.View)]
+        [NGOCheckPermission(Action = (int)Core.Model.Enums.PermissionActionId.View, TabFunctionId = (int)TabFunctionId.Logframe2IndicatorTracker)]
         public List<Model.Dto.ImportedFile> GetBrowseImports(int entityId)
```


## File: `ngo-api-core/NGO/NGO.Core.API/BaseControllers/Logframes2Controller.cs`
### Class: `(global)`
- **using · Microsoft.AspNetCore.Mvc** — _using_
  
  Thay đổi using: -using Microsoft.AspNetCore.Mvc;

```diff
-using Microsoft.AspNetCore.Mvc;
```
- **using · NGO.Core.Model.SharePoint** — _using_
  
  Thay đổi using: -using NGO.Core.Model.SharePoint;

```diff
-using NGO.Core.Model.SharePoint;
```
- **field · _logframeGlobalService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ILogframeGlobalService<LogframeGlobalObjective, LogframeGlobalIndicator> _logframeGlobalService;

```diff
+        protected readonly ILogframeGlobalService<LogframeGlobalObjective, LogframeGlobalIndicator> _logframeGlobalService;
```
- **field · _globalIndicatorMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<Model.Dto.LogframeGlobalIndicator, LogframeGlobalIndicator> _globalIndicatorMapper;

```diff
+        protected readonly IDtoMapper<Model.Dto.LogframeGlobalIndicator, LogframeGlobalIndicator> _globalIndicatorMapper;
```


## File: `ngo-api-core/NGO/NGO.Core.API/BaseControllers/MinimumRequirementsController.cs`
### Class: `(global)`
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```
- **using · NGO.Core.Model.Mapping** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Mapping;

```diff
+using NGO.Core.Model.Mapping;
```
- **using · NGO.Core.Services** — _using_
  
  Thay đổi using: +using NGO.Core.Services;

```diff
+using NGO.Core.Services;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```

### Class: `MinimumRequirementsController<TModel, TDto>`
- **class · MinimumRequirementsController<TModel, TDto>** — _class:generic-change_
  
  Thay đổi khai báo class: class MinimumRequirementsController<TModel, TDto>

```diff
+    public abstract class MinimumRequirementsController<TModel, TDto> : NGOControllerBase
```
- **field · _service** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IMinimumRequirementService<TModel> _service;

```diff
+        protected readonly IMinimumRequirementService<TModel> _service;
```
- **field · _mapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<TDto, TModel> _mapper;

```diff
+        protected readonly IDtoMapper<TDto, TModel> _mapper;
```
- **field · _entityService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IEntityService<Entity> _entityService;

```diff
+        protected readonly IEntityService<Entity> _entityService;
```
- **field · _resourceStringService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IResourceStringService _resourceStringService;

```diff
+        protected readonly IResourceStringService _resourceStringService;
```
- **field · _configService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IConfigurationService<EntityDefinition, TabDefinition> _configService;

```diff
+        protected readonly IConfigurationService<EntityDefinition, TabDefinition> _configService;
```
- **field · _appContext** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IApplicationContext _appContext;

```diff
+        protected readonly IApplicationContext _appContext;
```
- **constructor · MinimumRequirementsController** — _logic-change_
  
  +        public MinimumRequirementsController(IMinimumRequirementService<TModel> service,

```diff
+    public abstract class MinimumRequirementsController<TModel, TDto> : NGOControllerBase
+        where TModel : Model.MinimumRequirement, new()
+        where TDto : Model.Dto.MinimumRequirement, new()
+    {
+        protected readonly IMinimumRequirementService<TModel> _service;
+        protected readonly IDtoMapper<TDto, TModel> _mapper;
+        protected readonly IEntityService<Entity> _entityService;
+        protected readonly IResourceStringService _resourceStringService;
+        protected readonly IConfigurationService<EntityDefinition, TabDefinition> _configService;
+        protected readonly IApplicationContext _appContext;
+
+        public MinimumRequirementsController(IMinimumRequirementService<TModel> service,
```


## File: `ngo-api-core/NGO/NGO.Core.API/BaseControllers/PartnerExpenditureReportingImportController.cs`
### Class: `PartnerExpenditureReportingImportController<RDomain, RDto, BVDomain>`
- **field · _exchangeRateService** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly IExchangeRateService<ExchangeRateObject> _exchangeRateService;

```diff
-        protected readonly IExchangeRateService<ExchangeRateObject> _exchangeRateService;
```
- **field · _exchangeRateService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IExchangeRateService<ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;

```diff
+        protected readonly IExchangeRateService<ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;
```
- **constructor · PartnerExpenditureReportingImportController** — _—_
  
  public PartnerExpenditureReportingImportController(IExpenditureReportingImportedService service,

```diff
@@ -35,7 +35,7 @@ namespace NGO.Core.API.BaseControllers
         protected readonly IOptions<CoreAppSettings> _coreAppSettings;
         protected readonly ILogger _logger;
         protected readonly IFieldOptionService _fieldOptionService; 
-        protected readonly IExchangeRateService<ExchangeRateObject> _exchangeRateService;
+        protected readonly IExchangeRateService<ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;
 
         public PartnerExpenditureReportingImportController(IExpenditureReportingImportedService service,
```
- **method · DownloadExportedStructure** — _param:+FromBody_
  
  -        [NGOCheckPermission(Action = (int)Core.Model.Enums.PermissionActionId.List, TabFunctionId = (int)Model.Enums.TabFunctionId.PartnerExpenditureExportStructure)]
+        [NGOCheckPermission(Action = (int)Core.Model.Enums.PermissionActionId.Edit)]
public IActionResult DownloadExportedStructure(int entityId, [FromBody] ListParameter parameter)

```diff
@@ -105,7 +105,7 @@ namespace NGO.Core.API.BaseControllers
         }
 
         [HttpPost]
-        [NGOCheckPermission(Action = (int)Core.Model.Enums.PermissionActionId.List, TabFunctionId = (int)Model.Enums.TabFunctionId.PartnerExpenditureExportStructure)]
+        [NGOCheckPermission(Action = (int)Core.Model.Enums.PermissionActionId.Edit)]
         [Route("partnerExpenditureImport/exportStructure")]
         public IActionResult DownloadExportedStructure(int entityId, [FromBody] ListParameter parameter)
```


## File: `ngo-api-core/NGO/NGO.Core.API/BaseControllers/ResourceStringController.cs`
### Class: `(global)`
- **using · NGO.Core.Model.Mapping** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Mapping;

```diff
+using NGO.Core.Model.Mapping;
```
- **field · _resourceStringDtoMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IResourceStringDtoMapper<Model.Dto.Configuration.ResourceString, Model.ResourceString> _resourceStringDtoMapper;

```diff
+        protected readonly IResourceStringDtoMapper<Model.Dto.Configuration.ResourceString, Model.ResourceString> _resourceStringDtoMapper;
```
- **method · GetActiveResourceStrings** — _logic-change_
  
  -        public Model.BrowseListResult<Model.ResourceString> GetActiveResourceStrings(Model.ListParameter parameter)

```diff
         {
             this.service = service;
             _configService = configService;
             _logger = logger;
             _resourceStringService = resourceStringService;
+            _resourceStringDtoMapper = resourceStringDtoMapper;
         }
 
         [Route("resourceStrings")]
         [HttpPost]
         [NGOCheckPermission(Action = (int)PermissionActionId.Edit, TabFunctionId = (int)TabFunctionId.AdminResourceString)]
-        public Model.BrowseListResult<Model.ResourceString> GetActiveResourceStrings(Model.ListParameter parameter)
```
- **method · GetActiveResourceStrings** — _logic-change_
  
  +        public Model.BrowseListResult<Model.Dto.Configuration.ResourceString> GetActiveResourceStrings(Model.ListParameter parameter)

```diff
             this.service = service;
             _configService = configService;
             _logger = logger;
             _resourceStringService = resourceStringService;
+            _resourceStringDtoMapper = resourceStringDtoMapper;
         }
 
         [Route("resourceStrings")]
         [HttpPost]
         [NGOCheckPermission(Action = (int)PermissionActionId.Edit, TabFunctionId = (int)TabFunctionId.AdminResourceString)]
-        public Model.BrowseListResult<Model.ResourceString> GetActiveResourceStrings(Model.ListParameter parameter)
+        public Model.BrowseListResult<Model.Dto.Configuration.ResourceString> GetActiveResourceStrings(Model.ListParameter parameter)
```
- **method · Put** — _param:+FromBody_
  
  -        public void Put([FromBody] List<Model.ResourceString> resources)

```diff
@@ -70,53 +74,49 @@ namespace NGO.Core.API.BaseControllers
         [Route("resourceStrings")]
         [HttpPut]
         [NGOCheckPermission(Action = (int)PermissionActionId.Edit, TabFunctionId = (int)TabFunctionId.AdminResourceString)]
-        public void Put([FromBody] List<Model.ResourceString> resources)
```
- **method · Put** — _param:+FromBody_
  
  +        public void Put([FromBody] List<Model.Dto.Configuration.ResourceString> resources)

```diff
@@ -70,53 +74,49 @@ namespace NGO.Core.API.BaseControllers
         [Route("resourceStrings")]
         [HttpPut]
         [NGOCheckPermission(Action = (int)PermissionActionId.Edit, TabFunctionId = (int)TabFunctionId.AdminResourceString)]
-        public void Put([FromBody] List<Model.ResourceString> resources)
+        public void Put([FromBody] List<Model.Dto.Configuration.ResourceString> resources)
```


## File: `ngo-api-core/NGO/NGO.Core.API/BaseControllers/SPDocumentController.cs`
### Class: `(global)`
- **method · Validate** — _logic-change_
  
  +        [Route("{id}/Rename")]
+        [HttpPut]
protected void Validate(TDto value)

```diff
@@ -401,7 +411,7 @@ namespace NGO.Core.API.BaseControllers
         public async Task<TDto> UpdateLink(int entityId, [FromBody]TDto listItem)
         {
             Validate(listItem);
-            return await _spDocumentService.UpdateDocumentLink(listItem);
+            return await _spDocumentService.UpdateLinkDocument(listItem);
         }
 
         protected void Validate(TDto value)
```


## File: `ngo-api-core/NGO/NGO.Core.API/BaseControllers/TaskTemplateController.cs`
### Class: `(global)`
- **using · System.Web.Services.Description** — _using_
  
  Thay đổi using: +using System.Web.Services.Description;

```diff
+using System.Web.Services.Description;
```
- **field · service** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly ITaskTemplateService<TModel> service;

```diff
-        protected readonly ITaskTemplateService<TModel> service;
```
- **field · mapper** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly ITaskTemplateDtoMapper<TDto, TModel> mapper;

```diff
-        protected readonly ITaskTemplateDtoMapper<TDto, TModel> mapper;
```
- **field · genericMapper** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly IDtoMapper<Model.Dto.GenericItem, Model.GenericItem> genericMapper;

```diff
-        protected readonly IDtoMapper<Model.Dto.GenericItem, Model.GenericItem> genericMapper;
```
- **field · appContext** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly IApplicationContext appContext;

```diff
-        protected readonly IApplicationContext appContext;
```
- **field · _service** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ITaskTemplateService<TModel> _service;

```diff
+        protected readonly ITaskTemplateService<TModel> _service;
```
- **field · _mapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ITaskTemplateDtoMapper<TDto, TModel> _mapper;

```diff
+        protected readonly ITaskTemplateDtoMapper<TDto, TModel> _mapper;
```
- **field · _genericMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<Model.Dto.GenericItem, Model.GenericItem> _genericMapper;

```diff
+        protected readonly IDtoMapper<Model.Dto.GenericItem, Model.GenericItem> _genericMapper;
```
- **field · _appContext** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IApplicationContext _appContext;

```diff
+        protected readonly IApplicationContext _appContext;
```


## File: `ngo-api-core/NGO/NGO.Core.API/Controllers/AdminIATIPageController.cs`
### Class: `(global)`
- **using · Microsoft.Extensions.Logging** — _using_
  
  Thay đổi using: +using Microsoft.Extensions.Logging;

```diff
+using Microsoft.Extensions.Logging;
```
- **using · Microsoft.Extensions.Options** — _using_
  
  Thay đổi using: +using Microsoft.Extensions.Options;

```diff
+using Microsoft.Extensions.Options;
```
- **using · NGO.Core.Common.Configurations** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Configurations;

```diff
+using NGO.Core.Common.Configurations;
```

### Class: `CoreAdminIATIPageController`
- **class · CoreAdminIATIPageController** — _—_
  
  Thay đổi khai báo class: class CoreAdminIATIPageController

```diff
-    public class CoreAdminIATIPageController : AdminIATIPageController<Model.IATIForm>
```
- **class · CoreAdminIATIPageController** — _—_
  
  Thay đổi khai báo class: class CoreAdminIATIPageController

```diff
+    public class CoreAdminIATIPageController : AdminIATIPageController<Model.IATIForm, Model.IATITransactionImport>
```
- **constructor · CoreAdminIATIPageController** — _—_
  
  -        public CoreAdminIATIPageController(IIATIPageService<Model.IATIForm> service,

```diff
@@ -7,14 +10,22 @@ using NGO.Core.Services;
 namespace NGO.Core.API.Controllers
 {
     [Route("api/core/adminIATIPage")]
-    public class CoreAdminIATIPageController : AdminIATIPageController<Model.IATIForm>
+    public class CoreAdminIATIPageController : AdminIATIPageController<Model.IATIForm, Model.IATITransactionImport>
     {
-        public CoreAdminIATIPageController(IIATIPageService<Model.IATIForm> service,
```
- **constructor · CoreAdminIATIPageController** — _—_
  
  +        public CoreAdminIATIPageController(IApplicationContext appContext, IIATIPageService<Model.IATIForm> service,

```diff
@@ -7,14 +10,22 @@ using NGO.Core.Services;
 namespace NGO.Core.API.Controllers
 {
     [Route("api/core/adminIATIPage")]
-    public class CoreAdminIATIPageController : AdminIATIPageController<Model.IATIForm>
+    public class CoreAdminIATIPageController : AdminIATIPageController<Model.IATIForm, Model.IATITransactionImport>
     {
-        public CoreAdminIATIPageController(IIATIPageService<Model.IATIForm> service,
+        public CoreAdminIATIPageController(IApplicationContext appContext, IIATIPageService<Model.IATIForm> service,
```


## File: `ngo-api-core/NGO/NGO.Core.API/Controllers/AdminMinimumRequirementsController.cs`
### Class: `(global)`
- **using · NGO.Core.API.BaseControllers** — _using_
  
  Thay đổi using: +using NGO.Core.API.BaseControllers;

```diff
+using NGO.Core.API.BaseControllers;
```
- **using · NGO.Core.Model.Mapping** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Mapping;

```diff
+using NGO.Core.Model.Mapping;
```
- **using · NGO.Core.Services** — _using_
  
  Thay đổi using: +using NGO.Core.Services;

```diff
+using NGO.Core.Services;
```

### Class: `AdminMinimumRequirementsController`
- **class · AdminMinimumRequirementsController** — _—_
  
  Thay đổi khai báo class: class AdminMinimumRequirementsController

```diff
+    public class AdminMinimumRequirementsController : AdminMinimumRequirementsController<Model.MinimumRequirement, Model.Dto.MinimumRequirement>
```
- **constructor · AdminMinimumRequirementsController** — _logic-change_
  
  +        public AdminMinimumRequirementsController(

```diff
@@ -0,0 +1,18 @@
+﻿using Microsoft.AspNetCore.Mvc;
+using NGO.Core.API.BaseControllers;
+using NGO.Core.Model.Mapping;
+using NGO.Core.Services;
+
+namespace NGO.Core.API.Controllers
+{
+    [Route("api/core/adminMinimumRequirements")]
+    public class AdminMinimumRequirementsController : AdminMinimumRequirementsController<Model.MinimumRequirement, Model.Dto.MinimumRequirement>
+    {
+        public AdminMinimumRequirementsController(
```


## File: `ngo-api-core/NGO/NGO.Core.API/Controllers/BudgetController.cs`
### Class: `(global)`
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```


## File: `ngo-api-core/NGO/NGO.Core.API/Controllers/EmergenciesController.cs`
### Class: `(global)`
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```


## File: `ngo-api-core/NGO/NGO.Core.API/Controllers/ExchangeRateController.cs`
### Class: `ExchangeRateController`
- **constructor · ExchangeRateController** — _—_
  
  -        public ExchangeRateController(IExchangeRateService<ExchangeRateObject> service, IApplicationContext context,

```diff
@@ -10,7 +10,7 @@ namespace NGO.Core.API.Controllers
     [Route("api/core/exchangeRates")]
     public class ExchangeRateController : Core.API.BaseControllers.ExchangeRateController<Model.Dto.ExchangeRateObject, Model.ExchangeRateObject>
     {
-        public ExchangeRateController(IExchangeRateService<ExchangeRateObject> service, IApplicationContext context,
```
- **constructor · ExchangeRateController** — _—_
  
  +        public ExchangeRateController(IExchangeRateService<ExchangeRateObject, Model.Dto.ExchangeRateObject> service, IApplicationContext context,

```diff
@@ -10,7 +10,7 @@ namespace NGO.Core.API.Controllers
     [Route("api/core/exchangeRates")]
     public class ExchangeRateController : Core.API.BaseControllers.ExchangeRateController<Model.Dto.ExchangeRateObject, Model.ExchangeRateObject>
     {
-        public ExchangeRateController(IExchangeRateService<ExchangeRateObject> service, IApplicationContext context,
+        public ExchangeRateController(IExchangeRateService<ExchangeRateObject, Model.Dto.ExchangeRateObject> service, IApplicationContext context,
```


## File: `ngo-api-core/NGO/NGO.Core.API/Controllers/Logframes2Controller.cs`
### Class: `(global)`
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```

### Class: `CoreLogframes2Controller`
- **class · CoreLogframes2Controller** — _—_
  
  Thay đổi khai báo class: class CoreLogframes2Controller

```diff
-    public class CoreLogframes2Controller : Logframes2Controller<Model.LogframeVersion, Model.Dto.LogframeVersion, Model.LogframeObjective, Model.Dto.LogframeObjective, Model.Dto.LogframeIndicator, Model.LogframeReporting, Model.Dto.LogframeReporting>
```
- **class · CoreLogframes2Controller** — _—_
  
  Thay đổi khai báo class: class CoreLogframes2Controller

```diff
+    public class CoreLogframes2Controller : Logframes2Controller<LogframeVersion, Model.Dto.LogframeVersion, LogframeObjective, Model.Dto.LogframeObjective, Model.Dto.LogframeIndicator, LogframeReporting, Model.Dto.LogframeReporting>
```
- **constructor · CoreLogframes2Controller** — _—_
  
  public CoreLogframes2Controller(

```diff
@@ -7,33 +8,35 @@ using NGO.Core.Services.Validation;
 namespace NGO.Core.API.Controllers
 {
     [Route("api/core/entity/{entityId}")]
-    public class CoreLogframes2Controller : Logframes2Controller<Model.LogframeVersion, Model.Dto.LogframeVersion, Model.LogframeObjective, Model.Dto.LogframeObjective, Model.Dto.LogframeIndicator, Model.LogframeReporting, Model.Dto.LogframeReporting>
+    public class CoreLogframes2Controller : Logframes2Controller<LogframeVersion, Model.Dto.LogframeVersion, LogframeObjective, Model.Dto.LogframeObjective, Model.Dto.LogframeIndicator, LogframeReporting, Model.Dto.LogframeReporting>
     {
         public CoreLogframes2Controller(
```


## File: `ngo-api-core/NGO/NGO.Core.API/Controllers/MinimumRequirementsController.cs`
### Class: `(global)`
- **using · NGO.Core.API.BaseControllers** — _using_
  
  Thay đổi using: +using NGO.Core.API.BaseControllers;

```diff
+using NGO.Core.API.BaseControllers;
```
- **using · NGO.Core.Model.Mapping** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Mapping;

```diff
+using NGO.Core.Model.Mapping;
```
- **using · NGO.Core.Services** — _using_
  
  Thay đổi using: +using NGO.Core.Services;

```diff
+using NGO.Core.Services;
```

### Class: `MinimumRequirementsController`
- **class · MinimumRequirementsController** — _—_
  
  Thay đổi khai báo class: class MinimumRequirementsController

```diff
+    public class MinimumRequirementsController : MinimumRequirementsController<Model.MinimumRequirement, Model.Dto.MinimumRequirement>
```
- **constructor · MinimumRequirementsController** — _logic-change_
  
  +        public MinimumRequirementsController(

```diff
@@ -0,0 +1,22 @@
+﻿using Microsoft.AspNetCore.Mvc;
+using NGO.Core.API.BaseControllers;
+using NGO.Core.Model.Mapping;
+using NGO.Core.Services;
+
+namespace NGO.Core.API.Controllers
+{
+    [Route("api/core/minimumRequirements/{entityId}")]
+    public class MinimumRequirementsController : MinimumRequirementsController<Model.MinimumRequirement, Model.Dto.MinimumRequirement>
+    {
+        public MinimumRequirementsController(
```


## File: `ngo-api-core/NGO/NGO.Core.API/Controllers/ResourceStringController.cs`
### Class: `(global)`
- **using · NGO.Core.Model.Mapping** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Mapping;

```diff
+using NGO.Core.Model.Mapping;
```


## File: `ngo-api-core/NGO/NGO.Core.Common.Tests/Attributes/BaseAutoMoqDataAttribute.cs`
### Class: `(global)`
- **using · Azure** — _using_
  
  Thay đổi using: +using Azure;

```diff
+using Azure;
```
- **using · Azure.Storage.Queues.Models** — _using_
  
  Thay đổi using: +using Azure.Storage.Queues.Models;

```diff
+using Azure.Storage.Queues.Models;
```


## File: `ngo-api-core/NGO/NGO.Core.Common/Auth/NgoClaimsTransformation.cs`
### Class: `(global)`
- **using · System** — _using_
  
  Thay đổi using: -using System;

```diff
-using System;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: -using System.Collections.Generic;

```diff
-using System.Collections.Generic;
```
- **using · System.DirectoryServices.AccountManagement** — _using_
  
  Thay đổi using: -using System.DirectoryServices.AccountManagement;

```diff
-using System.DirectoryServices.AccountManagement;
```
- **using · System.Text** — _using_
  
  Thay đổi using: -using System.Text;

```diff
-using System.Text;
```

### Class: `NgoClaimsTransformation`
- **method · TransformAsync** — _—_
  
  -        public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)

```diff
-using System.Collections.Generic;
-using System.DirectoryServices.AccountManagement;
 using System.Linq;
 using System.Security.Claims;
-using System.Text;
 using System.Threading.Tasks;
 
 namespace NGO.Core.Common
 {
     public class NgoClaimsTransformation : IClaimsTransformation
     {
-        public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
```
- **method · TransformAsync** — _logic-change_
  
  +        public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)

```diff
         {
-            ClaimsIdentity ngoIdentity = new();
+            ClaimTypes.Upn,           // http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn
+            ClaimTypes.Email,         // http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress
+            ClaimTypes.Name           // http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name
+        };
 
-            var loginName = principal.Claims.Where(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn").Select(c => c.Value).SingleOrDefault();
-            
-            if (string.IsNullOrEmpty(loginName))
-                loginName = principal.Claims.Where(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress").Select(c => c.Value).SingleOrDefault();
+        public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
```


## File: `ngo-api-core/NGO/NGO.Core.Common/Constants/DbConfigurationKeys.cs`
### Class: `CoreCacheKeys`
- **class · CoreCacheKeys** — _—_
  
  Thay đổi khai báo class: class CoreCacheKeys

```diff
+    public static class CoreCacheKeys
```


## File: `ngo-api-core/NGO/NGO.Core.Common/Constants/IATISettingKeys.cs`
### Class: `IATIConstant`
- **class · IATIConstant** — _—_
  
  Thay đổi khai báo class: class IATIConstant

```diff
+    public static class IATIConstant
```


## File: `ngo-api-core/NGO/NGO.Core.Common/Extensions/ObjectExtensions.cs`
### Class: `(global)`
- **using · System.Dynamic** — _using_
  
  Thay đổi using: +using System.Dynamic;

```diff
+using System.Dynamic;
```

### Class: `with properties in`
- **class · with properties in** — _—_
  
  Thay đổi khai báo class: class with properties in

```diff
+        /// ~2–3x faster than CloneJson(), BUT NOT USE FOR class with properties in 'object' type
```


## File: `ngo-api-core/NGO/NGO.Core.Common/Queue/IATITransactionImportQueue.cs`
### Class: `IATITransactionImportQueue`
- **class · IATITransactionImportQueue** — _—_
  
  Thay đổi khai báo class: class IATITransactionImportQueue

```diff
+    public class IATITransactionImportQueue : QueueBase, IQueue
```


## File: `ngo-api-core/NGO/NGO.Core.Common/Utilities/SPUtilities.cs`
### Class: `(global)`
- **using · NGO.Core.Common.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Extensions;

```diff
+using NGO.Core.Common.Extensions;
```


## File: `ngo-api-core/NGO/NGO.Core.Infrastructure/CommonDIRegistrations.cs`
### Class: `(global)`
- **using · NGO.Core.Services.Validation** — _using_
  
  Thay đổi using: +using NGO.Core.Services.Validation;

```diff
+using NGO.Core.Services.Validation;
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/Agreement.cs`
### Class: `Agreement`
- **class · Agreement** — _—_
  
  Thay đổi khai báo class: class Agreement

```diff
-    public class Agreement : BaseModelSubEntity
```
- **class · Agreement** — _—_
  
  Thay đổi khai báo class: class Agreement

```diff
+    public class Agreement : BaseModelSubEntity, IApprovalEntry
```
- **constructor · Agreement** — _—_
  
  public Agreement()

```diff
@@ -4,7 +4,7 @@ using System.Collections.Generic;
 
 namespace NGO.Core.Model
 {
-    public class Agreement : BaseModelSubEntity
+    public class Agreement : BaseModelSubEntity, IApprovalEntry
     {
         public Agreement()
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/BankAccount.cs`
### Class: `BankAccount`
- **class · BankAccount** — _—_
  
  Thay đổi khai báo class: class BankAccount

```diff
-    public class BankAccount : BaseModelSubEntity
```
- **class · BankAccount** — _—_
  
  Thay đổi khai báo class: class BankAccount

```diff
+    public class BankAccount : BaseModelSubEntity, IApprovalEntry
```
- **constructor · BankAccount** — _—_
  
  public BankAccount()

```diff
@@ -7,7 +7,7 @@ using System.Threading.Tasks;
 
 namespace NGO.Core.Model
 {
-    public class BankAccount : BaseModelSubEntity
+    public class BankAccount : BaseModelSubEntity, IApprovalEntry
     {
         public BankAccount()
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/Beneficiary/BeneficiaryReporting.cs`
### Class: `BeneficiaryReporting`
- **class · BeneficiaryReporting** — _—_
  
  Thay đổi khai báo class: class BeneficiaryReporting

```diff
-    public class BeneficiaryReporting : BaseModelSubEntity
```
- **class · BeneficiaryReporting** — _—_
  
  Thay đổi khai báo class: class BeneficiaryReporting

```diff
+    public class BeneficiaryReporting : BaseModelSubEntity, IApprovalEntry
```
- **constructor · BeneficiaryReporting** — _—_
  
  public BeneficiaryReporting()

```diff
@@ -5,7 +5,7 @@ using System.Linq.Expressions;
 
 namespace NGO.Core.Model
 {
-    public class BeneficiaryReporting : BaseModelSubEntity
+    public class BeneficiaryReporting : BaseModelSubEntity, IApprovalEntry
     {
         public BeneficiaryReporting()
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/Beneficiary/BeneficiaryVersion.cs`
### Class: `BeneficiaryVersion`
- **class · BeneficiaryVersion** — _—_
  
  Thay đổi khai báo class: class BeneficiaryVersion

```diff
-    public class BeneficiaryVersion : BaseModelSubEntity
```
- **class · BeneficiaryVersion** — _—_
  
  Thay đổi khai báo class: class BeneficiaryVersion

```diff
+    public class BeneficiaryVersion : BaseModelSubEntity, IApprovalEntry
```
- **constructor · BeneficiaryVersion** — _—_
  
  public BeneficiaryVersion()

```diff
@@ -5,7 +5,7 @@ using System.Linq.Expressions;
 
 namespace NGO.Core.Model
 {
-    public class BeneficiaryVersion : BaseModelSubEntity
+    public class BeneficiaryVersion : BaseModelSubEntity, IApprovalEntry
     {
         public BeneficiaryVersion()
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/Change.cs`
### Class: `Change`
- **class · Change** — _—_
  
  Thay đổi khai báo class: class Change

```diff
-    public class Change : BaseModelSubEntity
```
- **class · Change** — _—_
  
  Thay đổi khai báo class: class Change

```diff
+    public class Change : BaseModelSubEntity, IApprovalEntry
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/ExportPdf/RegionTable.cs`
### Class: `(global)`
- **using · System.Linq** — _using_
  
  Thay đổi using: -using System.Linq;

```diff
-using System.Linq;
```
- **using · System.Text** — _using_
  
  Thay đổi using: -using System.Text;

```diff
-using System.Text;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: -using System.Threading.Tasks;

```diff
-using System.Threading.Tasks;
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/Finance/BudgetVersion.cs`
### Class: `BudgetVersion`
- **class · BudgetVersion** — _—_
  
  Thay đổi khai báo class: class BudgetVersion

```diff
-    public class BudgetVersion : BaseFinancialModelVersion
```
- **class · BudgetVersion** — _—_
  
  Thay đổi khai báo class: class BudgetVersion

```diff
+    public class BudgetVersion : BaseFinancialModelVersion, IApprovalEntry
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/Finance/FundingAllocation.cs`
### Class: `FundingAllocation`
- **class · FundingAllocation** — _—_
  
  Thay đổi khai báo class: class FundingAllocation

```diff
-    public class FundingAllocation : BaseModelSubEntity
```
- **class · FundingAllocation** — _—_
  
  Thay đổi khai báo class: class FundingAllocation

```diff
+    public class FundingAllocation : BaseModelSubEntity, IApprovalEntry
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/Finance/PartnerExpenditureReporting.cs`
### Class: `PartnerExpenditureReporting`
- **class · PartnerExpenditureReporting** — _—_
  
  Thay đổi khai báo class: class PartnerExpenditureReporting

```diff
-    public class PartnerExpenditureReporting : ReportItem
```
- **class · PartnerExpenditureReporting** — _—_
  
  Thay đổi khai báo class: class PartnerExpenditureReporting

```diff
+    public class PartnerExpenditureReporting : ReportItem, IApprovalEntry
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/IATI/IATITransactionImport.cs`
### Class: `(global)`
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```

### Class: `IATITransactionImport`
- **class · IATITransactionImport** — _—_
  
  Thay đổi khai báo class: class IATITransactionImport

```diff
+    public class IATITransactionImport : IModification
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/IATITransactionImportQueueItem.cs`
### Class: `IATITransactionImportQueueItem`
- **class · IATITransactionImportQueueItem** — _—_
  
  Thay đổi khai báo class: class IATITransactionImportQueueItem

```diff
+    public class IATITransactionImportQueueItem
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/LockPage/RoleAssignmentBackup.cs`
### Class: `(global)`
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```

### Class: `RoleAssignmentBackup`
- **class · RoleAssignmentBackup** — _—_
  
  Thay đổi khai báo class: class RoleAssignmentBackup

```diff
+    public class RoleAssignmentBackup
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/LockPage/SitePermissionBackup.cs`
### Class: `(global)`
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```

### Class: `SitePermissionBackup`
- **class · SitePermissionBackup** — _—_
  
  Thay đổi khai báo class: class SitePermissionBackup

```diff
+    public class SitePermissionBackup
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/Log.cs`
### Class: `Log`
- **class · Log** — _—_
  
  Thay đổi khai báo class: class Log

```diff
-    public class Log : BaseModelSubEntity
```
- **class · Log** — _—_
  
  Thay đổi khai báo class: class Log

```diff
+    public class Log : BaseModelSubEntity, IApprovalEntry
```
- **constructor · Log** — _—_
  
  public Log()

```diff
@@ -4,7 +4,7 @@ using System.Collections.Generic;
 
 namespace NGO.Core.Model
 {
-    public class Log : BaseModelSubEntity
+    public class Log : BaseModelSubEntity, IApprovalEntry
     {
         public Log()
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/Logframe/LogframeIndicatorType.cs`
### Class: `(global)`
- **using · System** — _using_
  
  Thay đổi using: -using System;

```diff
-using System;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: -using System.Collections.Generic;

```diff
-using System.Collections.Generic;
```
- **using · System.Linq.Expressions** — _using_
  
  Thay đổi using: -using System.Linq.Expressions;

```diff
-using System.Linq.Expressions;
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/Logframe/LogframeReporting.cs`
### Class: `LogframeReporting`
- **class · LogframeReporting** — _—_
  
  Thay đổi khai báo class: class LogframeReporting

```diff
-    public class LogframeReporting : BaseModelSubEntity
```
- **class · LogframeReporting** — _—_
  
  Thay đổi khai báo class: class LogframeReporting

```diff
+    public class LogframeReporting : BaseModelSubEntity, IApprovalEntry
```
- **constructor · LogframeReporting** — _—_
  
  public LogframeReporting()

```diff
@@ -5,7 +5,7 @@ using System.Linq.Expressions;
 
 namespace NGO.Core.Model
 {
-    public class LogframeReporting : BaseModelSubEntity
+    public class LogframeReporting : BaseModelSubEntity, IApprovalEntry
     {
         public LogframeReporting()
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/Logframe/LogframeVersion.cs`
### Class: `LogframeVersion`
- **class · LogframeVersion** — _—_
  
  Thay đổi khai báo class: class LogframeVersion

```diff
-    public class LogframeVersion : BaseModelSubEntity
```
- **class · LogframeVersion** — _—_
  
  Thay đổi khai báo class: class LogframeVersion

```diff
+    public class LogframeVersion : BaseModelSubEntity, IApprovalEntry
```
- **constructor · LogframeVersion** — _—_
  
  public LogframeVersion()

```diff
@@ -7,7 +7,7 @@ using System.Linq.Expressions;
 namespace NGO.Core.Model
 {
     [Abbreviation("Version")]
-    public class LogframeVersion : BaseModelSubEntity
+    public class LogframeVersion : BaseModelSubEntity, IApprovalEntry
     {
         public LogframeVersion()
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/MinimumRequirement/MinimumRequirement.cs`
### Class: `(global)`
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```

### Class: `MinimumRequirement`
- **class · MinimumRequirement** — _—_
  
  Thay đổi khai báo class: class MinimumRequirement

```diff
+    public class MinimumRequirement : IModification
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/MinimumRequirement/MinimumRequirementTaskTemplate.cs`
### Class: `MinimumRequirementTaskTemplate`
- **class · MinimumRequirementTaskTemplate** — _—_
  
  Thay đổi khai báo class: class MinimumRequirementTaskTemplate

```diff
+    public class MinimumRequirementTaskTemplate
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/Payment.cs`
### Class: `Payment`
- **class · Payment** — _—_
  
  Thay đổi khai báo class: class Payment

```diff
-    public class Payment: BaseModelSubEntity
```
- **class · Payment** — _—_
  
  Thay đổi khai báo class: class Payment

```diff
+    public class Payment: BaseModelSubEntity, IApprovalEntry
```
- **constructor · Payment** — _—_
  
  public Payment() {

```diff
@@ -4,7 +4,7 @@ using System.Collections.Generic;
 
 namespace NGO.Core.Model
 {
-    public class Payment: BaseModelSubEntity
+    public class Payment: BaseModelSubEntity, IApprovalEntry
     {
         public Payment() {
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/Permission/EntityPermission.cs`
### Class: `(global)`
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · System.Text** — _using_
  
  Thay đổi using: +using System.Text;

```diff
+using System.Text;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: +using System.Threading.Tasks;

```diff
+using System.Threading.Tasks;
```

### Class: `EntityPermission`
- **class · EntityPermission** — _—_
  
  Thay đổi khai báo class: class EntityPermission

```diff
+    public class EntityPermission : Permission
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Domain/Task/TaskAssignment.cs`
### Class: `(global)`
- **using · NGO.Core.Common.Constants** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Constants;

```diff
+using NGO.Core.Common.Constants;
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Dto/Configuration/OverviewChartBoxConfiguration.cs`
### Class: `DateAndValueFields`
- **class · DateAndValueFields** — _—_
  
  Thay đổi khai báo class: class DateAndValueFields

```diff
+    public class DateAndValueFields
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Dto/Configuration/ResourceString.cs`
### Class: `(global)`
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · System.Text** — _using_
  
  Thay đổi using: +using System.Text;

```diff
+using System.Text;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: +using System.Threading.Tasks;

```diff
+using System.Threading.Tasks;
```

### Class: `ResourceString`
- **class · ResourceString** — _—_
  
  Thay đổi khai báo class: class ResourceString

```diff
+    public class ResourceString
```

### Class: `ResourceStringValue`
- **class · ResourceStringValue** — _—_
  
  Thay đổi khai báo class: class ResourceStringValue

```diff
+    public class ResourceStringValue
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Dto/Configuration/TriggerWebjobInfo.cs`
### Class: `(global)`
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · System.Text** — _using_
  
  Thay đổi using: +using System.Text;

```diff
+using System.Text;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: +using System.Threading.Tasks;

```diff
+using System.Threading.Tasks;
```

### Class: `TriggerWebjobInfo`
- **class · TriggerWebjobInfo** — _—_
  
  Thay đổi khai báo class: class TriggerWebjobInfo

```diff
+    public class TriggerWebjobInfo
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Dto/EntityExportSetting.cs`
### Class: `EntityExportSetting`
- **class · EntityExportSetting** — _—_
  
  Thay đổi khai báo class: class EntityExportSetting

```diff
+    public class EntityExportSetting
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Dto/ExcelDefinedCell.cs`
### Class: `(global)`
- **using · NGO.Core.Model.Dto** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Dto;

```diff
+using NGO.Core.Model.Dto;
```
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · System.Text** — _using_
  
  Thay đổi using: +using System.Text;

```diff
+using System.Text;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: +using System.Threading.Tasks;

```diff
+using System.Threading.Tasks;
```

### Class: `ExcelDefinedCell`
- **class · ExcelDefinedCell** — _—_
  
  Thay đổi khai báo class: class ExcelDefinedCell

```diff
+    public class ExcelDefinedCell : Core.Model.Dto.GenericItem
```
- **constructor · ExcelDefinedCell** — _logic-change_
  
  +        public ExcelDefinedCell()

```diff
+using NGO.Core.Model.Enums;
+using System;
+using System.Collections.Generic;
+using System.Linq;
+using System.Text;
+using System.Threading.Tasks;
+
+namespace NGO.Model.Dto
+{
+    public class ExcelDefinedCell : Core.Model.Dto.GenericItem
+    {
+        public ExcelDefinedCell()
```

### Class: `ExcelObjectCell`
- **class · ExcelObjectCell** — _—_
  
  Thay đổi khai báo class: class ExcelObjectCell

```diff
+    public class ExcelObjectCell 
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Dto/IATI/IATITransactionImport.cs`
### Class: `(global)`
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```

### Class: `IATITransactionImport`
- **class · IATITransactionImport** — _—_
  
  Thay đổi khai báo class: class IATITransactionImport

```diff
+    public class IATITransactionImport : IModification
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Dto/Logframe/Logframe.cs`
### Class: `LogframeRollupItemGroupItemIds`
- **class · LogframeRollupItemGroupItemIds** — _—_
  
  Thay đổi khai báo class: class LogframeRollupItemGroupItemIds

```diff
+    public class LogframeRollupItemGroupItemIds
```

### Class: `LogframeTargetPeriodAvailable`
- **class · LogframeTargetPeriodAvailable** — _—_
  
  Thay đổi khai báo class: class LogframeTargetPeriodAvailable

```diff
+    public class LogframeTargetPeriodAvailable
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Dto/MinimumRequirement/MinimumRequirement.cs`
### Class: `(global)`
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```

### Class: `MinimumRequirement`
- **class · MinimumRequirement** — _—_
  
  Thay đổi khai báo class: class MinimumRequirement

```diff
+    public class MinimumRequirement : IModification
```
- **constructor · MinimumRequirement** — _logic-change_
  
  +        public MinimumRequirement()

```diff
@@ -0,0 +1,25 @@
+﻿using NGO.Core.Model.Attributes;
+using System;
+using System.Collections.Generic;
+
+namespace NGO.Core.Model.Dto
+{
+    public class MinimumRequirement : IModification
+    {
+        public MinimumRequirement()
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Dto/MinimumRequirement/MinimumRequirementStatus.cs`
### Class: `(global)`
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```

### Class: `EntityMinimumRequirementStatus`
- **class · EntityMinimumRequirementStatus** — _—_
  
  Thay đổi khai báo class: class EntityMinimumRequirementStatus

```diff
+    public class EntityMinimumRequirementStatus
```

### Class: `MinimumRequirementStatus`
- **class · MinimumRequirementStatus** — _—_
  
  Thay đổi khai báo class: class MinimumRequirementStatus

```diff
+    public class MinimumRequirementStatus
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Dto/MinimumRequirement/MinimumRequirementStatusColorSetting.cs`
### Class: `MinimumRequirementStatusColorSetting`
- **class · MinimumRequirementStatusColorSetting** — _—_
  
  Thay đổi khai báo class: class MinimumRequirementStatusColorSetting

```diff
+    public class MinimumRequirementStatusColorSetting
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Dto/MinimumRequirement/MinimumRequirementSummary.cs`
### Class: `MinimumRequirementSummary`
- **class · MinimumRequirementSummary** — _—_
  
  Thay đổi khai báo class: class MinimumRequirementSummary

```diff
+    public class MinimumRequirementSummary
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Dto/MinimumRequirement/MinimumRequirementTaskTemplate.cs`
### Class: `MinimumRequirementTaskTemplate`
- **class · MinimumRequirementTaskTemplate** — _—_
  
  Thay đổi khai báo class: class MinimumRequirementTaskTemplate

```diff
+    public class MinimumRequirementTaskTemplate
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Dto/OutlookAddinRequest.cs`
### Class: `FileAttachmentResult`
- **class · FileAttachmentResult** — _—_
  
  Thay đổi khai báo class: class FileAttachmentResult

```diff
+    public class FileAttachmentResult
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Dto/Parameters/EntityMemberParameter.cs`
### Class: `EntityMemberParameter`
- **class · EntityMemberParameter** — _—_
  
  Thay đổi khai báo class: class EntityMemberParameter

```diff
-    public class EntityMemberParameter
```

### Class: `EntityMemberParameter<EN>`
- **class · EntityMemberParameter<EN>** — _class:generic-change_
  
  Thay đổi khai báo class: class EntityMemberParameter<EN>

```diff
+    public class EntityMemberParameter<EN>
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Dto/Parameters/RevertToPreviousPhaseInfo.cs`
### Class: `(global)`
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · System.Text** — _using_
  
  Thay đổi using: +using System.Text;

```diff
+using System.Text;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: +using System.Threading.Tasks;

```diff
+using System.Threading.Tasks;
```

### Class: `RevertToPreviousPhaseInfo`
- **class · RevertToPreviousPhaseInfo** — _—_
  
  Thay đổi khai báo class: class RevertToPreviousPhaseInfo

```diff
+    public class RevertToPreviousPhaseInfo
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Dto/SystemInfo.cs`
### Class: `(global)`
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · System.Text** — _using_
  
  Thay đổi using: +using System.Text;

```diff
+using System.Text;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: +using System.Threading.Tasks;

```diff
+using System.Threading.Tasks;
```

### Class: `SystemInfo`
- **class · SystemInfo** — _—_
  
  Thay đổi khai báo class: class SystemInfo

```diff
+    public class SystemInfo
```

### Class: `SystemInfoSiteCollections`
- **class · SystemInfoSiteCollections** — _—_
  
  Thay đổi khai báo class: class SystemInfoSiteCollections

```diff
+    public class SystemInfoSiteCollections
```

### Class: `SystemInfoUsers`
- **class · SystemInfoUsers** — _—_
  
  Thay đổi khai báo class: class SystemInfoUsers

```diff
+    public class SystemInfoUsers
```

### Class: `SystemInfoVersions`
- **class · SystemInfoVersions** — _—_
  
  Thay đổi khai báo class: class SystemInfoVersions

```diff
+    public class SystemInfoVersions
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Dto/Versions.cs`
### Class: `(global)`
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: -using System.Collections.Generic;

```diff
-using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: -using System.Linq;

```diff
-using System.Linq;
```
- **using · System.Text** — _using_
  
  Thay đổi using: -using System.Text;

```diff
-using System.Text;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: -using System.Threading.Tasks;

```diff
-using System.Threading.Tasks;
```

### Class: `Versions`
- **class · Versions** — _—_
  
  Thay đổi khai báo class: class Versions

```diff
-    public class Versions
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Enums/LogframeIATICode.cs`
### Class: `(global)`
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · System.Text** — _using_
  
  Thay đổi using: +using System.Text;

```diff
+using System.Text;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: +using System.Threading.Tasks;

```diff
+using System.Threading.Tasks;
```

### Class: `LogframeIATICodeExtensions`
- **class · LogframeIATICodeExtensions** — _—_
  
  Thay đổi khai báo class: class LogframeIATICodeExtensions

```diff
+    public static class LogframeIATICodeExtensions
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Enums/ReportingFrequencyMonths.cs`
### Class: `(global)`
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · System.Text** — _using_
  
  Thay đổi using: +using System.Text;

```diff
+using System.Text;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: +using System.Threading.Tasks;

```diff
+using System.Threading.Tasks;
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Mapping/IATITransactionImportDtoMapper.cs`
### Class: `(global)`
- **using · NGO.Core.Model.Attributes** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Attributes;

```diff
+using NGO.Core.Model.Attributes;
```
- **using · System.ComponentModel.DataAnnotations** — _using_
  
  Thay đổi using: +using System.ComponentModel.DataAnnotations;

```diff
+using System.ComponentModel.DataAnnotations;
```

### Class: `IATITransactionImportDtoMapper<T, K>`
- **class · IATITransactionImportDtoMapper<T, K>** — _class:generic-change_
  
  Thay đổi khai báo class: class IATITransactionImportDtoMapper<T, K>

```diff
+    public class IATITransactionImportDtoMapper<T, K> : BaseSubEntityDtoMapper, IDtoMapper<T, K> where T :
```
- **field · _entityDefMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<Dto.EntityDefinition, EntityDefinition> _entityDefMapper;

```diff
+        protected readonly IDtoMapper<Dto.EntityDefinition, EntityDefinition> _entityDefMapper;
```
- **constructor · IATITransactionImportDtoMapper** — _logic-change_
  
  +        public IATITransactionImportDtoMapper(IExtendedDtoMapper<Dto.Entity, Entity> entityMapper,

```diff
@@ -0,0 +1,53 @@
+﻿
+using NGO.Core.Model.Attributes;
+using System.ComponentModel.DataAnnotations;
+
+namespace NGO.Core.Model.Mapping
+{
+    public class IATITransactionImportDtoMapper<T, K> : BaseSubEntityDtoMapper, IDtoMapper<T, K> where T :
+        Dto.IATITransactionImport, new() where K : IATITransactionImport, new()
+    {
+        protected readonly IDtoMapper<Dto.EntityDefinition, EntityDefinition> _entityDefMapper;
+        public IATITransactionImportDtoMapper(IExtendedDtoMapper<Dto.Entity, Entity> entityMapper,
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Mapping/MinimumRequirementDtoMapper.cs`
### Class: `MinimumRequirementDtoMapper<T, K>`
- **class · MinimumRequirementDtoMapper<T, K>** — _class:generic-change_
  
  Thay đổi khai báo class: class MinimumRequirementDtoMapper<T, K>

```diff
+    public class MinimumRequirementDtoMapper<T, K> : BaseSubEntityDtoMapper, IDtoMapper<T, K>
```
- **field · _taskTemplateMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ITaskTemplateDtoMapper<Dto.TaskTemplate, TaskTemplate> _taskTemplateMapper;

```diff
+        protected readonly ITaskTemplateDtoMapper<Dto.TaskTemplate, TaskTemplate> _taskTemplateMapper;
```
- **field · _entityDefMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<Dto.EntityDefinition, EntityDefinition> _entityDefMapper;

```diff
+        protected readonly IDtoMapper<Dto.EntityDefinition, EntityDefinition> _entityDefMapper;
```
- **constructor · MinimumRequirementDtoMapper** — _logic-change_
  
  +        public MinimumRequirementDtoMapper(IExtendedDtoMapper<Dto.Entity, Entity> entityMapper,

```diff
@@ -0,0 +1,65 @@
+﻿using System.Linq;
+
+namespace NGO.Core.Model.Mapping
+{
+    public class MinimumRequirementDtoMapper<T, K> : BaseSubEntityDtoMapper, IDtoMapper<T, K>
+        where T : Dto.MinimumRequirement, new() where K : MinimumRequirement, new()
+    {
+        protected readonly ITaskTemplateDtoMapper<Dto.TaskTemplate, TaskTemplate> _taskTemplateMapper;
+        protected readonly IDtoMapper<Dto.EntityDefinition, EntityDefinition> _entityDefMapper;
+        public MinimumRequirementDtoMapper(IExtendedDtoMapper<Dto.Entity, Entity> entityMapper,
```


## File: `ngo-api-core/NGO/NGO.Core.Model/Mapping/ResourceStringDtoMapper.cs`
### Class: `(global)`
- **using · PnP.Core.Model** — _using_
  
  Thay đổi using: +using PnP.Core.Model;

```diff
+using PnP.Core.Model;
```
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · System.Text** — _using_
  
  Thay đổi using: +using System.Text;

```diff
+using System.Text;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: +using System.Threading.Tasks;

```diff
+using System.Threading.Tasks;
```

### Class: `ResourceStringDtoMapper<T, K>`
- **class · ResourceStringDtoMapper<T, K>** — _class:generic-change_
  
  Thay đổi khai báo class: class ResourceStringDtoMapper<T, K>

```diff
+    public class ResourceStringDtoMapper<T, K> : IResourceStringDtoMapper<T, K> where T : Dto.Configuration.ResourceString, new() where K : ResourceString, new()
```
- **constructor · ResourceStringDtoMapper** — _logic-change_
  
  +        public ResourceStringDtoMapper()

```diff
+using System.Threading.Tasks;
+
+namespace NGO.Core.Model.Mapping
+{
+    public interface IResourceStringDtoMapper<T, K>
+    {
+        List<T> ToDto(List<K> domObjects);
+        List<K> ToModel(List<T> dtos);
+    }
+    public class ResourceStringDtoMapper<T, K> : IResourceStringDtoMapper<T, K> where T : Dto.Configuration.ResourceString, new() where K : ResourceString, new()
+    {
+        public ResourceStringDtoMapper()
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/BaseRepository.cs`
### Class: `(global)`
- **method · AddFunctionalItem** — _—_
  
  -        protected CoreFunctionalItem AddFunctionalItem(int itemId, int? tabDefinitionId = null, int? tabFunctionId = null)

```diff
@@ -19,11 +19,13 @@ namespace NGO.Core.Repositories
             this._context = context;
         }        
 
-        protected CoreFunctionalItem AddFunctionalItem(int itemId, int? tabDefinitionId = null, int? tabFunctionId = null)
```
- **method · AddFunctionalItem** — _—_
  
  +        protected CoreFunctionalItem AddFunctionalItem(int itemId, int? tabDefinitionId = null, int? tabFunctionId = null, bool withNoAudit = false)

```diff
@@ -19,11 +19,13 @@ namespace NGO.Core.Repositories
             this._context = context;
         }        
 
-        protected CoreFunctionalItem AddFunctionalItem(int itemId, int? tabDefinitionId = null, int? tabFunctionId = null)
+        protected CoreFunctionalItem AddFunctionalItem(int itemId, int? tabDefinitionId = null, int? tabFunctionId = null, bool withNoAudit = false)
```
- **method · GetEntityMinimumRequirementFields** — _logic-change_
  
  +        protected IEnumerable<CoreFieldInstance> GetEntityMinimumRequirementFields(EntityTypeId entityTypeId, FieldLocation location)

```diff
@@ -197,5 +199,15 @@ namespace NGO.Core.Repositories
             }
             return null;
         }
+
+        protected IEnumerable<CoreFieldInstance> GetEntityMinimumRequirementFields(EntityTypeId entityTypeId, FieldLocation location)
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/BeneficiaryRepository.cs`
### Class: `(global)`
- **method · GetBeneficiaryReportings** — _—_
  
  -        public List<TReporting> GetBeneficiaryReportings(int beneficiaryVersionId, bool isFromList = false)

```diff
@@ -277,18 +277,19 @@ namespace NGO.Core.Repositories
             return beneficiaryReporting;
         }
 
-        public List<TReporting> GetBeneficiaryReportings(int beneficiaryVersionId, bool isFromList = false)
```
- **method · GetBeneficiaryReportings** — _—_
  
  +        public List<TReporting> GetBeneficiaryReportings(int beneficiaryVersionId, bool shouldUseOverwriteData, bool shouldForceGetOverwriteValue = false)

```diff
@@ -277,18 +277,19 @@ namespace NGO.Core.Repositories
             return beneficiaryReporting;
         }
 
-        public List<TReporting> GetBeneficiaryReportings(int beneficiaryVersionId, bool isFromList = false)
+        public List<TReporting> GetBeneficiaryReportings(int beneficiaryVersionId, bool shouldUseOverwriteData, bool shouldForceGetOverwriteValue = false)
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/ConfigurationRepository.cs`
### Class: `(global)`
- **using · Newtonsoft.Json** — _using_
  
  Thay đổi using: +using Newtonsoft.Json;

```diff
+using Newtonsoft.Json;
```
- **using · Microsoft.EntityFrameworkCore** — _using_
  
  Thay đổi using: -using Microsoft.EntityFrameworkCore;

```diff
-using Microsoft.EntityFrameworkCore;
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/CoreContext.cs`
### Class: `(global)`
- **method · GetEntityMemberBrowseView** — _—_
  
  public IQueryable<CoreEntityMemberBrowseView> GetEntityMemberBrowseView(int localeId, int entityId)

```diff
@@ -282,6 +282,11 @@ namespace NGO.Core.Repositories
         public DbSet<CoreImportedFile> CoreImportedFiles { get; set; }
         public DbSet<CoreCalculatedFinancialValue> CoreCalculatedFinancialValues { get; set; }
         public DbSet<CorePageImport> CorePageImports { get; set; }
+        public DbSet<CoreIATITransationsImport> CoreIATITransationsImports { get; set; }
+        public DbSet<CoreMinimumRequirement> CoreMinimumRequirements { get; set; }
+        public DbSet<CoreMinimumRequirementTaskTemplate> CoreMinimumRequirementTaskTemplates { get; set; }
+        public DbSet<CoreSitePermissionBackup> CoreSitePermissionBackups { get; set; }
+        public DbSet<CoreRoleAssignmentBackup> CoreRoleAssignmentBackups { get; set; }
 
         public IQueryable<CoreEntityMemberBrowseView> GetEntityMemberBrowseView(int localeId, int entityId)
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/DataModel/IATI/CoreIATITransationsImport.cs`
### Class: `(global)`
- **using · NGO.Core.Repositories.DataModel.Configuration** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.DataModel.Configuration;

```diff
+using NGO.Core.Repositories.DataModel.Configuration;
```
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```
- **using · System.ComponentModel.DataAnnotations.Schema** — _using_
  
  Thay đổi using: +using System.ComponentModel.DataAnnotations.Schema;

```diff
+using System.ComponentModel.DataAnnotations.Schema;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```

### Class: `CoreIATITransationsImport`
- **class · CoreIATITransationsImport** — _—_
  
  Thay đổi khai báo class: class CoreIATITransationsImport

```diff
+    public class CoreIATITransationsImport : ICreatedModified
```
- **constructor · CoreIATITransationsImport** — _logic-change_
  
  +        public CoreIATITransationsImport()

```diff
@@ -0,0 +1,47 @@
+﻿using Microsoft.EntityFrameworkCore;
+using NGO.Core.Repositories.DataModel.Configuration;
+using System;
+using System.ComponentModel.DataAnnotations.Schema;
+using System.Linq;
+
+namespace NGO.Core.Repositories.DataModel
+{
+    public class CoreIATITransationsImport : ICreatedModified
+    {
+        public CoreIATITransationsImport()
```

### Class: `CoreIATITransationsImportDbSetExtenstions`
- **class · CoreIATITransationsImportDbSetExtenstions** — _—_
  
  Thay đổi khai báo class: class CoreIATITransationsImportDbSetExtenstions

```diff
+    public static class CoreIATITransationsImportDbSetExtenstions
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/DataModel/LockPage/CoreRoleAssignmentBackup.cs`
### Class: `(global)`
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.ComponentModel.DataAnnotations.Schema** — _using_
  
  Thay đổi using: +using System.ComponentModel.DataAnnotations.Schema;

```diff
+using System.ComponentModel.DataAnnotations.Schema;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · Microsoft.EntityFrameworkCore** — _using_
  
  Thay đổi using: +using Microsoft.EntityFrameworkCore;

```diff
+using Microsoft.EntityFrameworkCore;
```
- **using · NGO.Core.Repositories.DataModel.Configuration** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.DataModel.Configuration;

```diff
+using NGO.Core.Repositories.DataModel.Configuration;
```

### Class: `CoreRoleAssignmentBackup`
- **class · CoreRoleAssignmentBackup** — _—_
  
  Thay đổi khai báo class: class CoreRoleAssignmentBackup

```diff
+    public class CoreRoleAssignmentBackup
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/DataModel/LockPage/CoreSitePermissionBackup.cs`
### Class: `(global)`
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.ComponentModel.DataAnnotations.Schema** — _using_
  
  Thay đổi using: +using System.ComponentModel.DataAnnotations.Schema;

```diff
+using System.ComponentModel.DataAnnotations.Schema;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · Microsoft.EntityFrameworkCore** — _using_
  
  Thay đổi using: +using Microsoft.EntityFrameworkCore;

```diff
+using Microsoft.EntityFrameworkCore;
```
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · NGO.Core.Repositories.DataModel.Configuration** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.DataModel.Configuration;

```diff
+using NGO.Core.Repositories.DataModel.Configuration;
```

### Class: `CoreSitePermissionBackup`
- **class · CoreSitePermissionBackup** — _—_
  
  Thay đổi khai báo class: class CoreSitePermissionBackup

```diff
+    public class CoreSitePermissionBackup
```
- **constructor · CoreSitePermissionBackup** — _logic-change_
  
  +        public CoreSitePermissionBackup()

```diff
+using System.Collections.Generic;
+using System.ComponentModel.DataAnnotations.Schema;
+using System.Linq;
+using Microsoft.EntityFrameworkCore;
+using NGO.Core.Model;
+using NGO.Core.Repositories.DataModel.Configuration;
+
+namespace NGO.Core.Repositories.DataModel
+{
+    public class CoreSitePermissionBackup
+    {
+        public CoreSitePermissionBackup()
```

### Class: `CoreSitePermissionBackupDbSetExtensions`
- **class · CoreSitePermissionBackupDbSetExtensions** — _—_
  
  Thay đổi khai báo class: class CoreSitePermissionBackupDbSetExtensions

```diff
+    public static class CoreSitePermissionBackupDbSetExtensions
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/DataModel/MinimumRequirement/CoreMinimumRequirement.cs`
### Class: `(global)`
- **using · NGO.Core.Repositories.DataModel.Configuration** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.DataModel.Configuration;

```diff
+using NGO.Core.Repositories.DataModel.Configuration;
```
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.ComponentModel.DataAnnotations.Schema** — _using_
  
  Thay đổi using: +using System.ComponentModel.DataAnnotations.Schema;

```diff
+using System.ComponentModel.DataAnnotations.Schema;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```

### Class: `CoreMinimumRequirement`
- **class · CoreMinimumRequirement** — _—_
  
  Thay đổi khai báo class: class CoreMinimumRequirement

```diff
+    public class CoreMinimumRequirement : ICreatedModified
```
- **constructor · CoreMinimumRequirement** — _logic-change_
  
  +        public CoreMinimumRequirement()

```diff
+﻿using Microsoft.EntityFrameworkCore;
+using NGO.Core.Repositories.DataModel.Configuration;
+using System;
+using System.Collections.Generic;
+using System.ComponentModel.DataAnnotations.Schema;
+using System.Linq;
+
+namespace NGO.Core.Repositories.DataModel
+{
+    public class CoreMinimumRequirement : ICreatedModified
+    {
+        public CoreMinimumRequirement()
```

### Class: `CoreMinimumRequirementDbSetExtenstions`
- **class · CoreMinimumRequirementDbSetExtenstions** — _—_
  
  Thay đổi khai báo class: class CoreMinimumRequirementDbSetExtenstions

```diff
+    public static class CoreMinimumRequirementDbSetExtenstions
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/DataModel/MinimumRequirement/CoreMinimumRequirementTaskTemplate.cs`
### Class: `(global)`
- **using · NGO.Core.Model.Attributes** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Attributes;

```diff
+using NGO.Core.Model.Attributes;
```
- **using · System.ComponentModel.DataAnnotations.Schema** — _using_
  
  Thay đổi using: +using System.ComponentModel.DataAnnotations.Schema;

```diff
+using System.ComponentModel.DataAnnotations.Schema;
```

### Class: `CoreMinimumRequirementTaskTemplate`
- **class · CoreMinimumRequirementTaskTemplate** — _—_
  
  Thay đổi khai báo class: class CoreMinimumRequirementTaskTemplate

```diff
+    public class CoreMinimumRequirementTaskTemplate
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/DataModel/Task/CoreTaskTemplate.cs`
### Class: `(global)`
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```

### Class: `CoreTaskTemplateDbSetExtenstions`
- **class · CoreTaskTemplateDbSetExtenstions** — _—_
  
  Thay đổi khai báo class: class CoreTaskTemplateDbSetExtenstions

```diff
+    public static class CoreTaskTemplateDbSetExtenstions
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/EmergencyRepository.cs`
### Class: `(global)`
- **using · System** — _using_
  
  Thay đổi using: -using System;

```diff
-using System;
```
- **using · System.Text** — _using_
  
  Thay đổi using: -using System.Text;

```diff
-using System.Text;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: -using System.Threading.Tasks;

```diff
-using System.Threading.Tasks;
```
- **using · System.Globalization** — _using_
  
  Thay đổi using: -using System.Globalization;

```diff
-using System.Globalization;
```
- **using · LinqKit** — _using_
  
  Thay đổi using: -using LinqKit;

```diff
-using LinqKit;
```
- **using · NGO.Core.Repositories.DataModel.View** — _using_
  
  Thay đổi using: -using NGO.Core.Repositories.DataModel.View;

```diff
-using NGO.Core.Repositories.DataModel.View;
```
- **using · NGO.Core.Common.Constants** — _using_
  
  Thay đổi using: -using NGO.Core.Common.Constants;

```diff
-using NGO.Core.Common.Constants;
```
- **using · System.Diagnostics** — _using_
  
  Thay đổi using: -using System.Diagnostics;

```diff
-using System.Diagnostics;
```
- **using · System.Linq.Expressions** — _using_
  
  Thay đổi using: -using System.Linq.Expressions;

```diff
-using System.Linq.Expressions;
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/EntityRepository.cs`
### Class: `EntityRepository<T>`
- **field · _siteBackupRepo** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ISitePermissionBackupRepository<Model.SitePermissionBackup, Model.RoleAssignmentBackup> _siteBackupRepo;

```diff
+        protected readonly ISitePermissionBackupRepository<Model.SitePermissionBackup, Model.RoleAssignmentBackup> _siteBackupRepo;
```
- **constructor · EntityRepository** — _constructor:param-change, logic-change_
  
  -        public EntityRepository(CoreContext context, IEntityMapper<T> entityMapper, IFieldDefinitionMapper fieldDefinitionMapper, IQueryRepository queryRepository)

```diff
+        List<int> GetRelatedEntityIdsByTabConditions(T entity, List<Model.Dto.FieldFilter> conditions);
+        void SetLockEntity(int entityId, bool isLocked);
+        EntityLockStatus? GetEntityLockingStatus(int entityId);
     }
 
     public class EntityRepository<T> : BaseEntityRepository<T>, IEntityRepository<T> where T : Entity, new()
     {
         protected readonly IFieldDefinitionMapper _fieldDefinitionMapper;
         protected readonly IQueryRepository _queryRepository;
+        protected readonly ISitePermissionBackupRepository<Model.SitePermissionBackup, Model.RoleAssignmentBackup> _siteBackupRepo;
 
-        public EntityRepository(CoreContext context, IEntityMapper<T> entityMapper, IFieldDefinitionMapper fieldDefinitionMapper, IQueryRepository queryRepository)
```
- **constructor · EntityRepository** — _logic-change_
  
  +        public EntityRepository(CoreContext context, IEntityMapper<T> entityMapper, IFieldDefinitionMapper fieldDefinitionMapper,

```diff
+        void SetLockEntity(int entityId, bool isLocked);
+        EntityLockStatus? GetEntityLockingStatus(int entityId);
     }
 
     public class EntityRepository<T> : BaseEntityRepository<T>, IEntityRepository<T> where T : Entity, new()
     {
         protected readonly IFieldDefinitionMapper _fieldDefinitionMapper;
         protected readonly IQueryRepository _queryRepository;
+        protected readonly ISitePermissionBackupRepository<Model.SitePermissionBackup, Model.RoleAssignmentBackup> _siteBackupRepo;
 
-        public EntityRepository(CoreContext context, IEntityMapper<T> entityMapper, IFieldDefinitionMapper fieldDefinitionMapper, IQueryRepository queryRepository)
+        public EntityRepository(CoreContext context, IEntityMapper<T> entityMapper, IFieldDefinitionMapper fieldDefinitionMapper,
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/ExchangeRateRepository.cs`
### Class: `ExchangeRateRepository<E, EDto>`
- **class · ExchangeRateRepository<E, EDto>** — _class:generic-change_
  
  Thay đổi khai báo class: class ExchangeRateRepository<E, EDto>

```diff
+    public class ExchangeRateRepository<E, EDto>: BaseRepository, IExchangeRateRepository<E, EDto> 
```
- **method · GetAllExchangeRates** — _—_
  
  public List<E> GetAllExchangeRates()

```diff
@@ -104,9 +109,41 @@ namespace NGO.Core.Repositories
 
         public List<E> GetAllExchangeRates()
```
- **method · GetMinimalAllExchangeRates** — _logic-change_
  
  +        public List<EDto> GetMinimalAllExchangeRates()

```diff
@@ -104,9 +109,41 @@ namespace NGO.Core.Repositories
 
         public List<E> GetAllExchangeRates()
         {
-
             var efObject = _context.CoreExchangeRates.WithDefaultIncludes();
             return efObject.ToList().Select(e => _mapper.ToModel(e)).ToList();
         }
+
+        public List<EDto> GetMinimalAllExchangeRates()
```

### Class: `ExchangeRateRepository<E>`
- **class · ExchangeRateRepository<E>** — _class:generic-change_
  
  Thay đổi khai báo class: class ExchangeRateRepository<E>

```diff
-    public class ExchangeRateRepository<E>: BaseRepository, IExchangeRateRepository<E> where E: Core.Model.ExchangeRateObject, new()
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/FundingIdeaRepository.cs`
### Class: `(global)`
- **using · System.Globalization** — _using_
  
  Thay đổi using: -using System.Globalization;

```diff
-using System.Globalization;
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/GeographyRepository.cs`
### Class: `(global)`
- **using · System.Linq.Dynamic** — _using_
  
  Thay đổi using: -using System.Linq.Dynamic;

```diff
-using System.Linq.Dynamic;
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/IATI/IATITransactionImportRepository.cs`
### Class: `(global)`
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · NGO.Core.Repositories.DataModel** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.DataModel;

```diff
+using NGO.Core.Repositories.DataModel;
```
- **using · NGO.Core.Repositories.Mapping** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.Mapping;

```diff
+using NGO.Core.Repositories.Mapping;
```
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```

### Class: `IATITransactionImportRepository<T>`
- **class · IATITransactionImportRepository<T>** — _class:generic-change_
  
  Thay đổi khai báo class: class IATITransactionImportRepository<T>

```diff
+    public class IATITransactionImportRepository<T> : BaseRepository, IIATITransactionImportRepository<T>
```
- **field · _mapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IIATITransactionImportMapper<T> _mapper;

```diff
+        protected readonly IIATITransactionImportMapper<T> _mapper;
```
- **field · _queryRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IQueryRepository _queryRepository;

```diff
+        protected readonly IQueryRepository _queryRepository;
```
- **constructor · IATITransactionImportRepository** — _logic-change_
  
  +        public IATITransactionImportRepository(CoreContext context,

```diff
+        int AddTransactionImport(T TransactionImport);
+        bool UpdateTransactionImportStatusAndError(T TransactionImport, bool includeLastImportedRow = false);
+        void RemoveImport(int id);
+    }
+
+    public class IATITransactionImportRepository<T> : BaseRepository, IIATITransactionImportRepository<T>
+        where T: IATITransactionImport, new()
+    {
+        protected readonly IIATITransactionImportMapper<T> _mapper;
+        protected readonly IQueryRepository _queryRepository;
+
+        public IATITransactionImportRepository(CoreContext context,
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/IATI/IATITransactionRepository.cs`
### Class: `(global)`
- **using · SqlKata** — _using_
  
  Thay đổi using: -using SqlKata;

```diff
-using SqlKata;
```
- **using · System.Globalization** — _using_
  
  Thay đổi using: -using System.Globalization;

```diff
-using System.Globalization;
```
- **using · System.Data** — _using_
  
  Thay đổi using: +using System.Data;

```diff
+using System.Data;
```
- **using · Dapper** — _using_
  
  Thay đổi using: +using Dapper;

```diff
+using Dapper;
```
- **using · System.Data.SqlClient** — _using_
  
  Thay đổi using: +using System.Data.SqlClient;

```diff
+using System.Data.SqlClient;
```

### Class: `IATITransactionRepository<T>`
- **constructor · IATITransactionRepository** — _constructor:param-change, logic-change_
  
  -        public IATITransactionRepository(CoreContext context, IIATITransactionMapper<T> mapper, IQueryRepository queryRepository) : base(context)

```diff
-        int AddIATITransaction(T IATITransaction);
+        int AddIATITransaction(T IATITransaction, bool withNoAudit = false);
         int UpdateIATITransaction(T IATITransaction);
         void RemoveIATITransaction(int id);
         List<T> GetAllExportingIATITransactions(List<int> entityIds);
+        System.Threading.Tasks.Task RemoveIATITransactionByImportId(int importId);
     }
     public class IATITransactionRepository<T> : BaseRepository, IIATITransactionRepository<T> where T : IATITransaction, new()
     {
         protected readonly IIATITransactionMapper<T> _mapper;
         protected readonly IQueryRepository _queryRepository;
-        public IATITransactionRepository(CoreContext context, IIATITransactionMapper<T> mapper, IQueryRepository queryRepository) : base(context)
```
- **field · _connectionFactory** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ISqlConnectionFactory _connectionFactory;

```diff
+        protected readonly ISqlConnectionFactory _connectionFactory;
```
- **constructor · IATITransactionRepository** — _logic-change_
  
  +        public IATITransactionRepository(CoreContext context, IIATITransactionMapper<T> mapper

```diff
         int UpdateIATITransaction(T IATITransaction);
         void RemoveIATITransaction(int id);
         List<T> GetAllExportingIATITransactions(List<int> entityIds);
+        System.Threading.Tasks.Task RemoveIATITransactionByImportId(int importId);
     }
     public class IATITransactionRepository<T> : BaseRepository, IIATITransactionRepository<T> where T : IATITransaction, new()
     {
         protected readonly IIATITransactionMapper<T> _mapper;
         protected readonly IQueryRepository _queryRepository;
-        public IATITransactionRepository(CoreContext context, IIATITransactionMapper<T> mapper, IQueryRepository queryRepository) : base(context)
+        protected readonly ISqlConnectionFactory _connectionFactory;
+        public IATITransactionRepository(CoreContext context, IIATITransactionMapper<T> mapper
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/IdeaRepository.cs`
### Class: `(global)`
- **using · NGO.Core.Common.Extensions** — _using_
  
  Thay đổi using: -using NGO.Core.Common.Extensions;

```diff
-using NGO.Core.Common.Extensions;
```
- **using · System.Globalization** — _using_
  
  Thay đổi using: -using System.Globalization;

```diff
-using System.Globalization;
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/Logframe2Repository.cs`
### Class: `Logframe2Repository<TVersion, TObjective, TReporting>`
- **method · GetReportings** — _—_
  
  -        public List<TReporting> GetReportings(int versionId, bool includeOverwriteData = false)

```diff
@@ -414,12 +417,12 @@ namespace NGO.Core.Repositories
             return efReportings;
         }
 
-        public List<TReporting> GetReportings(int versionId, bool includeOverwriteData = false)
```
- **method · GetReportings** — _—_
  
  +        public List<TReporting> GetReportings(int versionId, bool includeOverwriteData = false, bool excludeActualData = false)

```diff
@@ -414,12 +417,12 @@ namespace NGO.Core.Repositories
             return efReportings;
         }
 
-        public List<TReporting> GetReportings(int versionId, bool includeOverwriteData = false)
+        public List<TReporting> GetReportings(int versionId, bool includeOverwriteData = false, bool excludeActualData = false)
```
- **method · GetAllReportingFrequencyAvailable** — _—_
  
  +        public List<ReportingFrequency> GetAllReportingFrequencyAvailable(int? versionFrequencyMonth, TVersion version)

```diff
@@ -1183,6 +1192,40 @@ namespace NGO.Core.Repositories
                 .Select(i => _mapper.ToModel(i, _context))
                 .ToList();
         }
+        public List<ReportingFrequency> GetAllReportingFrequencyAvailable(int? versionFrequencyMonth, TVersion version)
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/Logframe2ViewDataRepository.cs`
### Class: `(global)`
- **using · Microsoft.Data.SqlClient** — _using_
  
  Thay đổi using: -using Microsoft.Data.SqlClient;

```diff
-using Microsoft.Data.SqlClient;
```
- **using · Microsoft.Extensions.Options** — _using_
  
  Thay đổi using: +using Microsoft.Extensions.Options;

```diff
+using Microsoft.Extensions.Options;
```
- **using · NGO.Core.Common.Configurations** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Configurations;

```diff
+using NGO.Core.Common.Configurations;
```
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · System.Collections.Concurrent** — _using_
  
  Thay đổi using: +using System.Collections.Concurrent;

```diff
+using System.Collections.Concurrent;
```
- **using · NGO.Core.Common.Configurations** — _using_
  
  Thay đổi using: -using NGO.Core.Common.Configurations;

```diff
-using NGO.Core.Common.Configurations;
```
- **using · Microsoft.Extensions.Options** — _using_
  
  Thay đổi using: -using Microsoft.Extensions.Options;

```diff
-using Microsoft.Extensions.Options;
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/Mapping/BaseEntityMapper.cs`
### Class: `(global)`
- **using · NGO.Core.Common.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Extensions;

```diff
+using NGO.Core.Common.Extensions;
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/Mapping/IATITransactionImportMapper.cs`
### Class: `(global)`
- **using · NGO.Core.Model.Mapping** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Mapping;

```diff
+using NGO.Core.Model.Mapping;
```
- **using · NGO.Core.Repositories.DataModel** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.DataModel;

```diff
+using NGO.Core.Repositories.DataModel;
```

### Class: `IATITransactionImportMapper<T>`
- **class · IATITransactionImportMapper<T>** — _class:generic-change_
  
  Thay đổi khai báo class: class IATITransactionImportMapper<T>

```diff
+    public class IATITransactionImportMapper<T> : BaseMapper, IIATITransactionImportMapper<T>
```
- **field · _entityDefinitionMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IEntityDefinitionMapper<EntityDefinition> _entityDefinitionMapper;

```diff
+        protected readonly IEntityDefinitionMapper<EntityDefinition> _entityDefinitionMapper;
```
- **constructor · IATITransactionImportMapper** — _constructor:param-change, logic-change_
  
  +        public IATITransactionImportMapper(IUserMapper<User> userMapper, IEntityDefinitionMapper<EntityDefinition> entityDefinitionMapper)

```diff
+        where T : IATITransactionImport
+    {
+        T ToModel(CoreIATITransationsImport efObject);
+        CoreIATITransationsImport ToDataModel(T domObject, CoreIATITransationsImport efObject, CoreContext context);
+    }
+
+    public class IATITransactionImportMapper<T> : BaseMapper, IIATITransactionImportMapper<T>
+        where T : IATITransactionImport, new()
+    {
+        protected readonly IEntityDefinitionMapper<EntityDefinition> _entityDefinitionMapper;
+
+        public IATITransactionImportMapper(IUserMapper<User> userMapper, IEntityDefinitionMapper<EntityDefinition> entityDefinitionMapper) 
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/Mapping/ListFilterSettingMapper.cs`
### Class: `(global)`
- **using · NGO.Core.Common.Utilities** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Utilities;

```diff
+using NGO.Core.Common.Utilities;
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/Mapping/Logframe2Mapper.cs`
### Class: `Logframe2Mapper<TVersion, TObjective, TReporting>`
- **method · ToModel** — _logic-change_
  
  +        public ReportingFrequency ToModel(CoreReportingFrequency efReporting)

```diff
@@ -1075,5 +1083,10 @@ namespace NGO.Core.Repositories.Mapping
             ToModificationInfoDataModel(dmObject, efObject);
             return efObject;
         }
+        
+        public ReportingFrequency ToModel(CoreReportingFrequency efReporting)
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/Mapping/MinimumRequirementMapper.cs`
### Class: `(global)`
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · NGO.Core.Model.Mapping** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Mapping;

```diff
+using NGO.Core.Model.Mapping;
```
- **using · NGO.Core.Repositories.DataModel** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.DataModel;

```diff
+using NGO.Core.Repositories.DataModel;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```

### Class: `MinimumRequirementMapper<T>`
- **class · MinimumRequirementMapper<T>** — _class:generic-change_
  
  Thay đổi khai báo class: class MinimumRequirementMapper<T>

```diff
+    public class MinimumRequirementMapper<T> : BaseMapper, IMinimumRequirementMapper<T>
```
- **field · _taskTemplateMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ITaskTemplateMapper<Model.TaskTemplate> _taskTemplateMapper;

```diff
+        protected readonly ITaskTemplateMapper<Model.TaskTemplate> _taskTemplateMapper;
```
- **field · _globalMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ILogframeGlobalMapper<LogframeGlobalObjective, LogframeGlobalIndicator> _globalMapper;

```diff
+        protected readonly ILogframeGlobalMapper<LogframeGlobalObjective, LogframeGlobalIndicator> _globalMapper;
```
- **field · _entityDefinitionMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IEntityDefinitionMapper<EntityDefinition> _entityDefinitionMapper;

```diff
+        protected readonly IEntityDefinitionMapper<EntityDefinition> _entityDefinitionMapper;
```
- **constructor · MinimumRequirementMapper** — _logic-change_
  
  +        public MinimumRequirementMapper(IEntityMapper<Model.Entity> entityMapper, IUserMapper<User> userMapper,

```diff
+        T ToModel(CoreMinimumRequirement efObject);
+        CoreMinimumRequirement ToDataModel(T domObject, CoreMinimumRequirement efObject, CoreContext context);
+    }
+
+    public class MinimumRequirementMapper<T> : BaseMapper, IMinimumRequirementMapper<T>
+        where T : MinimumRequirement, new()
+    {
+        protected readonly ITaskTemplateMapper<Model.TaskTemplate> _taskTemplateMapper;
+        protected readonly ILogframeGlobalMapper<LogframeGlobalObjective, LogframeGlobalIndicator> _globalMapper;
+        protected readonly IEntityDefinitionMapper<EntityDefinition> _entityDefinitionMapper;
+
+        public MinimumRequirementMapper(IEntityMapper<Model.Entity> entityMapper, IUserMapper<User> userMapper,
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/Mapping/OptionsMapper/AssignmentUsersOptionsMapper.cs`
### Class: `(global)`
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/Mapping/OptionsMapper/FundingAllocationStatusOptionsMapper.cs`
### Class: `(global)`
- **using · NGO.Core.Repositories.Mapping.OptionsMapper** — _using_
  
  Thay đổi using: -using NGO.Core.Repositories.Mapping.OptionsMapper;

```diff
-using NGO.Core.Repositories.Mapping.OptionsMapper;
```
- **method · LoadOptions** — _—_
  
  public IEnumerable<IGenericItem> LoadOptions()

```diff
@@ -19,19 +18,24 @@ namespace NGO.Core.Repositories.Mapping.OptionsMapper
 
         public IEnumerable<IGenericItem> LoadOptions()
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/Mapping/OptionsMapper/TaskTemplateOptionsMapper.cs`
### Class: `(global)`
- **using · NGO.Core.Common.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Extensions;

```diff
+using NGO.Core.Common.Extensions;
```
- **using · NGO.Core.Repositories.DataModel** — _using_
  
  Thay đổi using: -using NGO.Core.Repositories.DataModel;

```diff
-using NGO.Core.Repositories.DataModel;
```
- **using · System.Text** — _using_
  
  Thay đổi using: -using System.Text;

```diff
-using System.Text;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: -using System.Threading.Tasks;

```diff
-using System.Threading.Tasks;
```

### Class: `TaskTemplateOptionsMapper`
- **field · _taskTemplateMapper** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly ITaskTemplateMapper<Model.TaskTemplate> _taskTemplateMapper;

```diff
-        protected readonly ITaskTemplateMapper<Model.TaskTemplate> _taskTemplateMapper;
```
- **field · _taskTemplateMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ITaskTemplateMapper<TaskTemplate> _taskTemplateMapper;

```diff
+        protected readonly ITaskTemplateMapper<TaskTemplate> _taskTemplateMapper;
```
- **field · _minimumRequirementRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IMinimumRequirementRepository<MinimumRequirement> _minimumRequirementRepository;

```diff
+        protected readonly IMinimumRequirementRepository<MinimumRequirement> _minimumRequirementRepository;
```
- **constructor · TaskTemplateOptionsMapper** — _—_
  
  public TaskTemplateOptionsMapper(CoreContext context,

```diff
 namespace NGO.Core.Repositories.Mapping.OptionsMapper
 {
     public class TaskTemplateOptionsMapper : SearchAsTypeOptionsMapper<EntityGenericItem>, IFieldOptionsMapper
     {
         public const string ConfigurationId = "TaskTemplateOptions";
-        protected readonly ITaskTemplateMapper<Model.TaskTemplate> _taskTemplateMapper;
+        protected readonly ITaskTemplateMapper<TaskTemplate> _taskTemplateMapper;
         protected readonly IResourceStringRepository _languageService;
+        protected readonly IMinimumRequirementRepository<MinimumRequirement> _minimumRequirementRepository;
         protected string TooltipPrefix;
 
         public TaskTemplateOptionsMapper(CoreContext context,
```
- **method · GetTooltipTitle** — _logic-change_
  
  public string GetTooltipTitle(List<GenericItem> entityTypes)

```diff
@@ -59,8 +59,10 @@ namespace NGO.Core.Repositories.Mapping.OptionsMapper
                 result = result.DistinctBy(x => new { x.Id });
             }
 
-            return FilterOptions(result.ToList(), _parameter);
-        }
+            result = FilterOptions(result.ToList(), _parameter);
+            result = SetIconRendering(result);
+            return result;
+        }        
 
         public string GetTooltipTitle(List<GenericItem> entityTypes)
```
- **method · SetIconRendering** — _logic-change_
  
  +        public IEnumerable<EntityGenericItem> SetIconRendering(IEnumerable<EntityGenericItem> options)

```diff
@@ -74,5 +76,31 @@ namespace NGO.Core.Repositories.Mapping.OptionsMapper
 
             return result;
         }
+
+        public IEnumerable<EntityGenericItem> SetIconRendering(IEnumerable<EntityGenericItem> options)
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/Mapping/SitePermissionBackupMapper.cs`
### Class: `(global)`
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```
- **using · NGO.Core.Model.Mapping** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Mapping;

```diff
+using NGO.Core.Model.Mapping;
```
- **using · NGO.Core.Repositories.DataModel** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.DataModel;

```diff
+using NGO.Core.Repositories.DataModel;
```
- **using · NGO.Core.Repositories.DataModel.Configuration** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.DataModel.Configuration;

```diff
+using NGO.Core.Repositories.DataModel.Configuration;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```

### Class: `SitePermissionBackupMapper<TSitePermission, TRoleAssignment>`
- **class · SitePermissionBackupMapper<TSitePermission, TRoleAssignment>** — _class:generic-change_
  
  Thay đổi khai báo class: class SitePermissionBackupMapper<TSitePermission, TRoleAssignment>

```diff
+    public class SitePermissionBackupMapper<TSitePermission, TRoleAssignment> : ISitePermissionBackupMapper<TSitePermission, TRoleAssignment>
```
- **field · _userMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IUserMapper<User> _userMapper;

```diff
+        protected readonly IUserMapper<User> _userMapper;
```
- **field · _entityConfigMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IEntityDefinitionMapper<Model.EntityDefinition> _entityConfigMapper;

```diff
+        protected readonly IEntityDefinitionMapper<Model.EntityDefinition> _entityConfigMapper;
```
- **field · _configurationRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IConfigurationRepository _configurationRepository;

```diff
+        protected readonly IConfigurationRepository _configurationRepository;
```
- **field · _entityMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IEntityMapper<Model.Entity> _entityMapper;

```diff
+        protected readonly IEntityMapper<Model.Entity> _entityMapper;
```
- **field · _resourceStringRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IResourceStringRepository _resourceStringRepository;

```diff
+        protected readonly IResourceStringRepository _resourceStringRepository;
```
- **constructor · SitePermissionBackupMapper** — _logic-change_
  
  +        public SitePermissionBackupMapper(IUserMapper<User> userMapper,

```diff
+    }
+
+    public class SitePermissionBackupMapper<TSitePermission, TRoleAssignment> : ISitePermissionBackupMapper<TSitePermission, TRoleAssignment>
+        where TSitePermission : Model.SitePermissionBackup, new()
+        where TRoleAssignment : Model.RoleAssignmentBackup, new()
+    {
+        protected readonly IUserMapper<User> _userMapper;
+        protected readonly IEntityDefinitionMapper<Model.EntityDefinition> _entityConfigMapper;
+        protected readonly IConfigurationRepository _configurationRepository;
+        protected readonly IEntityMapper<Model.Entity> _entityMapper;
+        protected readonly IResourceStringRepository _resourceStringRepository;
+        public SitePermissionBackupMapper(IUserMapper<User> userMapper,
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/MinimumRequirementRepository.cs`
### Class: `(global)`
- **using · Dapper** — _using_
  
  Thay đổi using: +using Dapper;

```diff
+using Dapper;
```
- **using · NGO.Core.Common.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Extensions;

```diff
+using NGO.Core.Common.Extensions;
```
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```
- **using · NGO.Core.Repositories.DataModel** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.DataModel;

```diff
+using NGO.Core.Repositories.DataModel;
```
- **using · NGO.Core.Repositories.Mapping** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.Mapping;

```diff
+using NGO.Core.Repositories.Mapping;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```

### Class: `MinimumRequirementRepository<T>`
- **class · MinimumRequirementRepository<T>** — _class:generic-change_
  
  Thay đổi khai báo class: class MinimumRequirementRepository<T>

```diff
+    public class MinimumRequirementRepository<T> : BaseRepository, IMinimumRequirementRepository<T>
```
- **field · _mapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IMinimumRequirementMapper<T> _mapper;

```diff
+        protected readonly IMinimumRequirementMapper<T> _mapper;
```
- **field · _queryRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IQueryRepository _queryRepository;

```diff
+        protected readonly IQueryRepository _queryRepository;
```
- **field · _connectionFactory** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ISqlConnectionFactory _connectionFactory;

```diff
+        protected readonly ISqlConnectionFactory _connectionFactory;
```
- **constructor · MinimumRequirementRepository** — _logic-change_
  
  +        public MinimumRequirementRepository(CoreContext context,

```diff
+        T GetMinimumRequirementByEntityTypeId(int entityTypeId);
+        List<Model.Dto.MinimumRequirementStatus> GetMinimumRequirementStatus(int entityTypeId, List<int> entityIds);
+    }
+
+    public class MinimumRequirementRepository<T> : BaseRepository, IMinimumRequirementRepository<T>
+        where T : MinimumRequirement, new()
+    {
+        protected readonly IMinimumRequirementMapper<T> _mapper;
+        protected readonly IQueryRepository _queryRepository;
+        protected readonly ISqlConnectionFactory _connectionFactory;
+
+        public MinimumRequirementRepository(CoreContext context,
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/NonProjectRepository.cs`
### Class: `(global)`
- **using · System** — _using_
  
  Thay đổi using: -using System;

```diff
-using System;
```
- **using · System.Text** — _using_
  
  Thay đổi using: -using System.Text;

```diff
-using System.Text;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: -using System.Threading.Tasks;

```diff
-using System.Threading.Tasks;
```
- **using · System.Globalization** — _using_
  
  Thay đổi using: -using System.Globalization;

```diff
-using System.Globalization;
```
- **using · LinqKit** — _using_
  
  Thay đổi using: -using LinqKit;

```diff
-using LinqKit;
```
- **using · NGO.Core.Repositories.DataModel.View** — _using_
  
  Thay đổi using: -using NGO.Core.Repositories.DataModel.View;

```diff
-using NGO.Core.Repositories.DataModel.View;
```
- **using · NGO.Core.Common.Constants** — _using_
  
  Thay đổi using: -using NGO.Core.Common.Constants;

```diff
-using NGO.Core.Common.Constants;
```
- **using · System.Diagnostics** — _using_
  
  Thay đổi using: -using System.Diagnostics;

```diff
-using System.Diagnostics;
```
- **using · System.Linq.Expressions** — _using_
  
  Thay đổi using: -using System.Linq.Expressions;

```diff
-using System.Linq.Expressions;
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/OrgUnitRepository.cs`
### Class: `(global)`
- **using · System** — _using_
  
  Thay đổi using: -using System;

```diff
-using System;
```
- **using · System.Text** — _using_
  
  Thay đổi using: -using System.Text;

```diff
-using System.Text;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: -using System.Threading.Tasks;

```diff
-using System.Threading.Tasks;
```
- **using · System.Linq.Dynamic** — _using_
  
  Thay đổi using: -using System.Linq.Dynamic;

```diff
-using System.Linq.Dynamic;
```
- **using · System.Linq.Expressions** — _using_
  
  Thay đổi using: -using System.Linq.Expressions;

```diff
-using System.Linq.Expressions;
```
- **using · System.Globalization** — _using_
  
  Thay đổi using: -using System.Globalization;

```diff
-using System.Globalization;
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/PartnerExpenditureReportingRepository.cs`
### Class: `(global)`
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/ProgramRepository.cs`
### Class: `(global)`
- **using · Microsoft.EntityFrameworkCore** — _using_
  
  Thay đổi using: -using Microsoft.EntityFrameworkCore;

```diff
-using Microsoft.EntityFrameworkCore;
```
- **using · NGO.Core.Common.Constants** — _using_
  
  Thay đổi using: -using NGO.Core.Common.Constants;

```diff
-using NGO.Core.Common.Constants;
```
- **using · System.Globalization** — _using_
  
  Thay đổi using: -using System.Globalization;

```diff
-using System.Globalization;
```
- **using · System.Linq.Dynamic** — _using_
  
  Thay đổi using: -using System.Linq.Dynamic;

```diff
-using System.Linq.Dynamic;
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/QueryRepository.cs`
### Class: `(global)`
- **using · Microsoft.Extensions.Options** — _using_
  
  Thay đổi using: -using Microsoft.Extensions.Options;

```diff
-using Microsoft.Extensions.Options;
```
- **using · NGO.Core.Common.Configurations** — _using_
  
  Thay đổi using: -using NGO.Core.Common.Configurations;

```diff
-using NGO.Core.Common.Configurations;
```
- **using · System.Collections.Concurrent** — _using_
  
  Thay đổi using: -using System.Collections.Concurrent;

```diff
-using System.Collections.Concurrent;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: -using System.Threading.Tasks;

```diff
-using System.Threading.Tasks;
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/ResourceStringRepository.cs`
### Class: `(global)`
- **using · SqlKata** — _using_
  
  Thay đổi using: +using SqlKata;

```diff
+using SqlKata;
```
- **using · NGO.Core.Common.Constants** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Constants;

```diff
+using NGO.Core.Common.Constants;
```
- **using · SqlKata.Compilers** — _using_
  
  Thay đổi using: +using SqlKata.Compilers;

```diff
+using SqlKata.Compilers;
```
- **using · SqlKata.Execution** — _using_
  
  Thay đổi using: +using SqlKata.Execution;

```diff
+using SqlKata.Execution;
```
- **using · NGO.Core.Common.Utilities** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Utilities;

```diff
+using NGO.Core.Common.Utilities;
```
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```
- **method · GetResourceStringBrowsePage** — _logic-change, param:+out_
  
  +        protected List<int> GetResourceStringBrowsePage(Model.ListParameter parameter, out int totalRows)

```diff
@@ -253,5 +265,54 @@ namespace NGO.Core.Repositories
         {
             return _context.CoreResourceStringModules.ToList().Select(m => new GenericItem { Id = m.Id, Name = m.Name }).ToList();
         }
+
+        protected List<int> GetResourceStringBrowsePage(Model.ListParameter parameter, out int totalRows)
```
- **method · GetIdLanguageColumnForSelect** — _logic-change_
  
  +        protected string GetIdLanguageColumnForSelect(Language language)

```diff
+            else
+            {
+                foreach (Language language in languages)
+                {
+                    listIds.AddRange(query.Get().Select(i => (int?)CommonUtilities.GetValueFromDynamic(i, GetIdLanguageColumnForSelect(language))).Where(id => id != null).Select(id => (int)id).ToList());
+                }
+                totalRows = query.Get().Select(i => i.Key).Count();
+            }
+            return listIds;
+        }
+
+        protected string GetIdLanguageColumnForSelect(Language language)
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/SitePermissionBackupRepository.cs`
### Class: `(global)`
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```
- **using · NGO.Core.Repositories.DataModel** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.DataModel;

```diff
+using NGO.Core.Repositories.DataModel;
```
- **using · NGO.Core.Repositories.DataModel.Configuration** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.DataModel.Configuration;

```diff
+using NGO.Core.Repositories.DataModel.Configuration;
```
- **using · NGO.Core.Repositories.Mapping** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.Mapping;

```diff
+using NGO.Core.Repositories.Mapping;
```
- **using · SqlKata** — _using_
  
  Thay đổi using: +using SqlKata;

```diff
+using SqlKata;
```
- **using · SqlKata.Execution** — _using_
  
  Thay đổi using: +using SqlKata.Execution;

```diff
+using SqlKata.Execution;
```
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Globalization** — _using_
  
  Thay đổi using: +using System.Globalization;

```diff
+using System.Globalization;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · Microsoft.EntityFrameworkCore** — _using_
  
  Thay đổi using: +using Microsoft.EntityFrameworkCore;

```diff
+using Microsoft.EntityFrameworkCore;
```

### Class: `SitePermissionBackupRepository<TSitePermission, TRoleAssignment>`
- **class · SitePermissionBackupRepository<TSitePermission, TRoleAssignment>** — _class:generic-change_
  
  Thay đổi khai báo class: class SitePermissionBackupRepository<TSitePermission, TRoleAssignment>

```diff
+    public class SitePermissionBackupRepository<TSitePermission, TRoleAssignment> : BaseRepository, ISitePermissionBackupRepository<TSitePermission, TRoleAssignment>
```
- **field · _mapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ISitePermissionBackupMapper<TSitePermission, TRoleAssignment> _mapper;

```diff
+        protected readonly ISitePermissionBackupMapper<TSitePermission, TRoleAssignment> _mapper;
```
- **field · _queryRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IQueryRepository _queryRepository;

```diff
+        protected readonly IQueryRepository _queryRepository;
```
- **constructor · SitePermissionBackupRepository** — _constructor:param-change, logic-change_
  
  +        public SitePermissionBackupRepository(CoreContext context, ISitePermissionBackupMapper<TSitePermission, TRoleAssignment> mapper, IQueryRepository queryRepository) : base(context)

```diff
+        int AddSiteBackup(TSitePermission siteBackup);
+        int UpdateSiteBackup(TSitePermission siteBackup);
+        void RemoveSiteBackup(int entityid);
+        void UpdateSiteBackupStatus(int siteBackupId, EntityLockStatus status, string message = "");
+    }
+    public class SitePermissionBackupRepository<TSitePermission, TRoleAssignment> : BaseRepository, ISitePermissionBackupRepository<TSitePermission, TRoleAssignment>
+         where TSitePermission : Model.SitePermissionBackup, new()
+        where TRoleAssignment : Model.RoleAssignmentBackup, new()
+    {
+        protected readonly ISitePermissionBackupMapper<TSitePermission, TRoleAssignment> _mapper;
+        protected readonly IQueryRepository _queryRepository;
+        public SitePermissionBackupRepository(CoreContext context, ISitePermissionBackupMapper<TSitePermission, TRoleAssignment> mapper, IQueryRepository queryRepository) : base(context)
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/StakeholderRepository.cs`
### Class: `(global)`
- **using · System** — _using_
  
  Thay đổi using: -using System;

```diff
-using System;
```
- **using · System.Text** — _using_
  
  Thay đổi using: -using System.Text;

```diff
-using System.Text;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: -using System.Threading.Tasks;

```diff
-using System.Threading.Tasks;
```
- **using · System.Globalization** — _using_
  
  Thay đổi using: -using System.Globalization;

```diff
-using System.Globalization;
```
- **using · NGO.Core.Repositories.DataModel.View** — _using_
  
  Thay đổi using: -using NGO.Core.Repositories.DataModel.View;

```diff
-using NGO.Core.Repositories.DataModel.View;
```
- **using · NGO.Core.Common.Constants** — _using_
  
  Thay đổi using: -using NGO.Core.Common.Constants;

```diff
-using NGO.Core.Common.Constants;
```
- **using · LinqKit** — _using_
  
  Thay đổi using: -using LinqKit;

```diff
-using LinqKit;
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/TaskRepository.cs`
### Class: `(global)`
- **using · System.Runtime.CompilerServices** — _using_
  
  Thay đổi using: -using System.Runtime.CompilerServices;

```diff
-using System.Runtime.CompilerServices;
```
- **using · SqlKata** — _using_
  
  Thay đổi using: -using SqlKata;

```diff
-using SqlKata;
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/TaskTemplateRepository.cs`
### Class: `(global)`
- **using · NGO.Core.Common.Constants** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Constants;

```diff
+using NGO.Core.Common.Constants;
```
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · NGO.Core.Common.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Extensions;

```diff
+using NGO.Core.Common.Extensions;
```
- **using · Newtonsoft.Json** — _using_
  
  Thay đổi using: +using Newtonsoft.Json;

```diff
+using Newtonsoft.Json;
```

### Class: `TaskTemplateRepository<T>`
- **class · TaskTemplateRepository<T>** — _class:generic-change_
  
  Thay đổi khai báo class: class TaskTemplateRepository<T>

```diff
-    public class TaskTemplateRepository<T> : ITaskTemplateRepository<T> where T : Model.TaskTemplate, new()
```
- **class · TaskTemplateRepository<T>** — _class:generic-change_
  
  Thay đổi khai báo class: class TaskTemplateRepository<T>

```diff
+    public class TaskTemplateRepository<T> : BaseRepository, ITaskTemplateRepository<T> where T : Model.TaskTemplate, new()
```
- **field · context** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly CoreContext context;

```diff
-        protected readonly CoreContext context;
```
- **field · mapper** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly ITaskTemplateMapper<T> mapper;

```diff
-        protected readonly ITaskTemplateMapper<T> mapper;
```
- **field · _context** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly CoreContext _context;

```diff
+        protected readonly CoreContext _context;
```
- **field · _mapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ITaskTemplateMapper<T> _mapper;

```diff
+        protected readonly ITaskTemplateMapper<T> _mapper;
```
- **field · _queryRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IQueryRepository _queryRepository;

```diff
+        protected readonly IQueryRepository _queryRepository;
```
- **constructor · TaskTemplateRepository** — _logic-change_
  
  public TaskTemplateRepository(CoreContext context,

```diff
+        IEnumerable<T> GetBrowseItems(ListParameter parameter, out int total);
+        List<string> GetCCUserEmailTemplate(int templateId);
     }
-    public class TaskTemplateRepository<T> : ITaskTemplateRepository<T> where T : Model.TaskTemplate, new()
+    public class TaskTemplateRepository<T> : BaseRepository, ITaskTemplateRepository<T> where T : Model.TaskTemplate, new()
     {
-        protected readonly CoreContext context;
-        protected readonly ITaskTemplateMapper<T> mapper;
+        protected readonly CoreContext _context;
+        protected readonly ITaskTemplateMapper<T> _mapper;
+        protected readonly IQueryRepository _queryRepository;
         public TaskTemplateRepository(CoreContext context,
```
- **method · GetIQueryable** — _logic-change_
  
  private IQueryable<CoreTaskTemplate> GetIQueryable()

```diff
         {
-            return mapper.ToModel(GetIQueryable().Where(t => t.Id == templateId).SingleOrDefault());
+            return _mapper.ToModel(GetIQueryable().Where(t => t.Id == templateId).SingleOrDefault());
         }
 
         public virtual List<T> GetTaskTemplatesByIds(int[] templateIds)
         {
-            return GetIQueryable().Where(t => templateIds.Contains(t.Id)).ToList().Select(t => mapper.ToModel(t)).ToList();
+            return GetIQueryable().Where(t => templateIds.Contains(t.Id)).ToList().Select(t => _mapper.ToModel(t)).ToList();
         }
 
         private IQueryable<CoreTaskTemplate> GetIQueryable()
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/UserRepository.cs`
### Class: `(global)`
- **using · NGO.Core.Common.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Extensions;

```diff
+using NGO.Core.Common.Extensions;
```
- **using · System.Data.SqlClient** — _using_
  
  Thay đổi using: +using System.Data.SqlClient;

```diff
+using System.Data.SqlClient;
```
- **using · Microsoft.AspNetCore.Connections** — _using_
  
  Thay đổi using: +using Microsoft.AspNetCore.Connections;

```diff
+using Microsoft.AspNetCore.Connections;
```
- **field · _queryRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IQueryRepository _queryRepository;

```diff
+        protected readonly IQueryRepository _queryRepository;
```


## File: `ngo-api-core/NGO/NGO.Core.Repositories/WebJobRepository.cs`
### Class: `(global)`
- **using · NGO.Core.Common.Constants** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Constants;

```diff
+using NGO.Core.Common.Constants;
```
- **using · System.Data.Entity** — _using_
  
  Thay đổi using: -using System.Data.Entity;

```diff
-using System.Data.Entity;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/BaseEntityService.cs`
### Class: `(global)`
- **method · GetEntityMembersFromEntityObjectAndValidateDuplicate** — _logic-change_
  
  internal List<EntityMember> GetEntityMembersFromEntityObjectAndValidateDuplicate(T curObject, EntityTypeId typeId, List<RoleEntityDefinition> roleEntities)

```diff
@@ -195,7 +198,7 @@ namespace NGO.Core.Services
             var oldEntityMembers = _entityMemberService.GetEntityMembers(curObject.EntityId).ToList();
             var newAddedMembers = GetEntityMembersFromEntityObject(curObject, oldEntityMembers, curObject.TypeId, roleEntities);
             _entityMemberService.UpdateForEntityForm(curObject.EntityId, newAddedMembers); //Rebind Member Or Partner role to entity object
-            return await _entityMemberService.UpdateEntityMembers(curObject.EntityId, newAddedMembers, false, false, triggeredRestrictedByUser: false);
+            return await _entityMemberService.UpdateEntityMembers(curObject.EntityId, newAddedMembers, false, false, triggeredRestrictedBy: TriggeredRestrictedBy.Entity);
         }
 
         internal List<EntityMember> GetEntityMembersFromEntityObjectAndValidateDuplicate(T curObject, EntityTypeId typeId, List<RoleEntityDefinition> roleEntities)
```


## File: `ngo-api-core/NGO/NGO.Core.Services/BaseTaskService.cs`
### Class: `(global)`
- **using · Microsoft.Extensions.Logging** — _using_
  
  Thay đổi using: -using Microsoft.Extensions.Logging;

```diff
-using Microsoft.Extensions.Logging;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/BudgetExportExcelService.cs`
### Class: `(global)`
- **field · _exchangeRateService** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly IExchangeRateService<Model.ExchangeRateObject> _exchangeRateService;

```diff
-        protected readonly IExchangeRateService<Model.ExchangeRateObject> _exchangeRateService;
```
- **field · _exchangeRateService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IExchangeRateService<Model.ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;

```diff
+        protected readonly IExchangeRateService<Model.ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/BudgetMonitoringExportExcelService.cs`
### Class: `(global)`
- **field · _exchangeRateService** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly IExchangeRateService<ExchangeRateObject> _exchangeRateService;

```diff
-        protected readonly IExchangeRateService<ExchangeRateObject> _exchangeRateService;
```
- **field · _exchangeRateService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IExchangeRateService<ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;

```diff
+        protected readonly IExchangeRateService<ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/ConfigurationService.cs`
### Class: `(global)`
- **method · GetBase64ImageSizeInMB** — _logic-change_
  
  public double GetBase64ImageSizeInMB(string base64Image)

```diff
@@ -290,7 +289,7 @@ namespace NGO.Core.Services
             }
 
             //Clear cache item basicconfiguration
-            _cacheRepository.RemoveValuesBySearchString(DbConfigurationKeys.SiteLogoImg);
+            _cacheRepository.RemoveValuesBySearchString(CoreCacheKeys.BasicConfiguration);
         }
 
         public double GetBase64ImageSizeInMB(string base64Image)
```
- **method · UpdateSystemConfiguration** — _—_
  
  -        public Model.Configuration UpdateSystemConfiguration(Configuration config)

```diff
@@ -585,7 +589,7 @@ namespace NGO.Core.Services
             return basicConfig;
         }
 
-        public Model.Configuration UpdateSystemConfiguration(Configuration config)
```
- **method · GetFolderConfigurationsByEntityType** — _logic-change_
  
  public List<Model.FolderDefinition> GetFolderConfigurationsByEntityType(int entityTypeId)

```diff
-            //Clear cache item basicconfiguration
-            _cacheRepository.RemoveValuesBySearchString(config.Key);
+            ClearSystemConfigurationCache();
             return _configurationRepository.GetConfigurationsByKey(config.Key).FirstOrDefault();
         }
 
+        protected virtual void ClearSystemConfigurationCache()
+        {
+            _cacheRepository.RemoveValuesBySearchString(CoreCacheKeys.BasicConfiguration);
+        }
+
         public List<Model.FolderDefinition> GetFolderConfigurationsByEntityType(int entityTypeId)
```
- **method · GetMaximumUser** — _—_
  
  -        public int? GetMaximumUser()

```diff
@@ -680,11 +688,6 @@ namespace NGO.Core.Services
             }
         }
 
-        public int? GetMaximumUser()
```


## File: `ngo-api-core/NGO/NGO.Core.Services/EntityService.cs`
### Class: `(global)`
- **using · NGO.Core.Common.Constants** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Constants;

```diff
+using NGO.Core.Common.Constants;
```
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```

### Class: `EntityService<T, TProgram, TProject, TEmergency, TFunding, TStakeholder, TOrgUnit, TGeography, TNonProject, TIdea, TFundingIdea, TStrategy, TLog, TRisk, TPayment, TFinancialTransaction, TIncomeShedule, TAgreement, TContact,`
- **field · _bankAccountRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IBankAccountRepository<Model.BankAccount> _bankAccountRepository;

```diff
+        protected readonly IBankAccountRepository<Model.BankAccount> _bankAccountRepository;
```
- **field · _minimumRequirementExportExcelService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IMinimumRequirementExportExcelService _minimumRequirementExportExcelService;

```diff
+        protected readonly IMinimumRequirementExportExcelService _minimumRequirementExportExcelService;
```
- **constructor · EntityService** — _—_
  
  public EntityService(IEntityRepository<T> entityRepository,

```diff
@@ -115,6 +119,8 @@ namespace NGO.Core.Services
         protected readonly IIATITransactionService<Model.IATITransaction> _iatiTransactionService;
         protected readonly IIATIDocumentRepository<TIATIDocument> _iatiDocumentRepository;
         protected readonly ILogframe2ExportExcelService _logframe2ExportExcelService;
+        protected readonly IBankAccountRepository<Model.BankAccount> _bankAccountRepository;
+        protected readonly IMinimumRequirementExportExcelService _minimumRequirementExportExcelService;
 
         public EntityService(IEntityRepository<T> entityRepository,
```


## File: `ngo-api-core/NGO/NGO.Core.Services/ExchangeRateService.cs`
### Class: `ExchangeRateService<E, EDto>`
- **class · ExchangeRateService<E, EDto>** — _class:generic-change_
  
  Thay đổi khai báo class: class ExchangeRateService<E, EDto>

```diff
+    public class ExchangeRateService<E, EDto> : IExchangeRateService<E, EDto> 
```
- **field · _repository** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly IExchangeRateRepository<E> _repository;

```diff
-        protected readonly IExchangeRateRepository<E> _repository;
```
- **field · _repository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IExchangeRateRepository<E, EDto> _repository;

```diff
+        protected readonly IExchangeRateRepository<E, EDto> _repository;
```
- **constructor · ExchangeRateService** — _logic-change_
  
  -        public ExchangeRateService(IExchangeRateRepository<E> repository,

```diff
+    public class ExchangeRateService<E, EDto> : IExchangeRateService<E, EDto> 
+        where E : Model.ExchangeRateObject, new()
+        where EDto : Model.Dto.ExchangeRateObject, new()
     {
-        protected readonly IExchangeRateRepository<E> _repository;
+        protected readonly IExchangeRateRepository<E, EDto> _repository;
         protected readonly IUnityOfWorkFactory _uowFactory;
         protected readonly IResourceStringService _resourceStringService;
         protected readonly IFieldOptionRepository _fieldOptionRepository;
         protected readonly IServiceProvider _serviceProvider;
 
-        public ExchangeRateService(IExchangeRateRepository<E> repository,
```
- **constructor · ExchangeRateService** — _logic-change_
  
  +        public ExchangeRateService(IExchangeRateRepository<E, EDto> repository,

```diff
+        where E : Model.ExchangeRateObject, new()
+        where EDto : Model.Dto.ExchangeRateObject, new()
     {
-        protected readonly IExchangeRateRepository<E> _repository;
+        protected readonly IExchangeRateRepository<E, EDto> _repository;
         protected readonly IUnityOfWorkFactory _uowFactory;
         protected readonly IResourceStringService _resourceStringService;
         protected readonly IFieldOptionRepository _fieldOptionRepository;
         protected readonly IServiceProvider _serviceProvider;
 
-        public ExchangeRateService(IExchangeRateRepository<E> repository,
+        public ExchangeRateService(IExchangeRateRepository<E, EDto> repository,
```
- **method · GetAllExchangeRates** — _—_
  
  -        public List<E> GetAllExchangeRates()

```diff
@@ -80,11 +85,16 @@ namespace NGO.Core.Services
             }
         }
 
-        public List<E> GetAllExchangeRates()
```
- **method · GetById** — _logic-change_
  
  public E GetById(int id)

```diff
-        public List<E> GetAllExchangeRates()
+        public virtual List<E> GetAllExchangeRates()
         {
             return _repository.GetAllExchangeRates();
         }
 
+        public virtual List<EDto> GetAllMinimalExchangeRates()
+        {
+            return _repository.GetMinimalAllExchangeRates();
+        }
+
         public E GetById(int id)
```

### Class: `ExchangeRateService<E>`
- **class · ExchangeRateService<E>** — _class:generic-change_
  
  Thay đổi khai báo class: class ExchangeRateService<E>

```diff
-    public class ExchangeRateService<E> : IExchangeRateService<E> where E : Model.ExchangeRateObject, new()
```


## File: `ngo-api-core/NGO/NGO.Core.Services/ExportExcelService/IATITransactionExcelService.cs`
### Class: `(global)`
- **using · AngleSharp.Css.Values** — _using_
  
  Thay đổi using: +using AngleSharp.Css.Values;

```diff
+using AngleSharp.Css.Values;
```
- **using · DocumentFormat.OpenXml** — _using_
  
  Thay đổi using: +using DocumentFormat.OpenXml;

```diff
+using DocumentFormat.OpenXml;
```
- **using · DocumentFormat.OpenXml.Extensions** — _using_
  
  Thay đổi using: +using DocumentFormat.OpenXml.Extensions;

```diff
+using DocumentFormat.OpenXml.Extensions;
```
- **using · DocumentFormat.OpenXml.Packaging** — _using_
  
  Thay đổi using: +using DocumentFormat.OpenXml.Packaging;

```diff
+using DocumentFormat.OpenXml.Packaging;
```
- **using · DocumentFormat.OpenXml.Spreadsheet** — _using_
  
  Thay đổi using: +using DocumentFormat.OpenXml.Spreadsheet;

```diff
+using DocumentFormat.OpenXml.Spreadsheet;
```
- **using · Microsoft.Extensions.Options** — _using_
  
  Thay đổi using: +using Microsoft.Extensions.Options;

```diff
+using Microsoft.Extensions.Options;
```
- **using · Newtonsoft.Json** — _using_
  
  Thay đổi using: +using Newtonsoft.Json;

```diff
+using Newtonsoft.Json;
```
- **using · NGO.Core.Common.Configurations** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Configurations;

```diff
+using NGO.Core.Common.Configurations;
```
- **using · NGO.Core.Common.Constants** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Constants;

```diff
+using NGO.Core.Common.Constants;
```
- **using · NGO.Core.Common.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Extensions;

```diff
+using NGO.Core.Common.Extensions;
```
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · NGO.Core.Model.Attributes** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Attributes;

```diff
+using NGO.Core.Model.Attributes;
```
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```
- **using · NGO.Core.Model.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Extensions;

```diff
+using NGO.Core.Model.Extensions;
```
- **using · NGO.Core.Repositories.DataModel** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.DataModel;

```diff
+using NGO.Core.Repositories.DataModel;
```
- **using · NGO.Core.Services.ExportExcelService.Templates** — _using_
  
  Thay đổi using: +using NGO.Core.Services.ExportExcelService.Templates;

```diff
+using NGO.Core.Services.ExportExcelService.Templates;
```
- **using · NGO.Core.Services.Validation** — _using_
  
  Thay đổi using: +using NGO.Core.Services.Validation;

```diff
+using NGO.Core.Services.Validation;
```
- **using · NGO.Model.Dto** — _using_
  
  Thay đổi using: +using NGO.Model.Dto;

```diff
+using NGO.Model.Dto;
```
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Globalization** — _using_
  
  Thay đổi using: +using System.Globalization;

```diff
+using System.Globalization;
```
- **using · System.IO** — _using_
  
  Thay đổi using: +using System.IO;

```diff
+using System.IO;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · System.Reflection** — _using_
  
  Thay đổi using: +using System.Reflection;

```diff
+using System.Reflection;
```
- **using · System.Reflection.Metadata** — _using_
  
  Thay đổi using: +using System.Reflection.Metadata;

```diff
+using System.Reflection.Metadata;
```
- **using · System.Text** — _using_
  
  Thay đổi using: +using System.Text;

```diff
+using System.Text;
```
- **using · System.Text.RegularExpressions** — _using_
  
  Thay đổi using: +using System.Text.RegularExpressions;

```diff
+using System.Text.RegularExpressions;
```

### Class: `IATITransactionExcelService<TTransaction>`
- **class · IATITransactionExcelService<TTransaction>** — _class:generic-change_
  
  Thay đổi khai báo class: class IATITransactionExcelService<TTransaction>

```diff
+    public class IATITransactionExcelService<TTransaction> : Core.Services.ExportExcelService.ExportExcelService<TTransaction>
```
- **field · _appSettings** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly CoreAppSettings _appSettings;

```diff
+        protected readonly CoreAppSettings _appSettings;
```
- **constructor · IATITransactionExcelService** — _logic-change_
  
  +        public IATITransactionExcelService(

```diff
+
+namespace NGO.Core.Services
+{
+    public class IATITransactionExcelService<TTransaction> : Core.Services.ExportExcelService.ExportExcelService<TTransaction>
+        where TTransaction : IATITransaction, new()
+    {
+        //protected readonly IIATITransactionService<TTransaction> _iatiTransactionService;
+
+        protected Dictionary<string, string> _optionResources = new Dictionary<string, string>();
+        protected readonly CoreAppSettings _appSettings;
+
+        public IATITransactionExcelService(
```


## File: `ngo-api-core/NGO/NGO.Core.Services/ExportIATIServices/CoreLogframeIATIProvider.cs`
### Class: `(global)`
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · NGO.Core.Common.Constants** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Constants;

```diff
+using NGO.Core.Common.Constants;
```
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```
- **using · NGO.Core.Repositories** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories;

```diff
+using NGO.Core.Repositories;
```

### Class: `CoreLogframeIATIProvider`
- **class · CoreLogframeIATIProvider** — _—_
  
  Thay đổi khai báo class: class CoreLogframeIATIProvider

```diff
+    public class CoreLogframeIATIProvider : IATIArrangeSectionProvider, IIATISectionProvider<result[]>
```
- **field · _logframeRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ILogframe2Repository<Model.LogframeVersion, Model.LogframeObjective, Model.LogframeReporting> _logframeRepository;

```diff
+        protected readonly ILogframe2Repository<Model.LogframeVersion, Model.LogframeObjective, Model.LogframeReporting> _logframeRepository;
```
- **field · _logframeService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ILogframe2Service<Model.LogframeVersion, Model.LogframeObjective, Model.LogframeReporting> _logframeService;

```diff
+        protected readonly ILogframe2Service<Model.LogframeVersion, Model.LogframeObjective, Model.LogframeReporting> _logframeService;
```
- **field · _configurationRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IConfigurationRepository _configurationRepository;

```diff
+        protected readonly IConfigurationRepository _configurationRepository;
```
- **field · _entityRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IEntityRepository<Model.Entity> _entityRepository;

```diff
+        protected readonly IEntityRepository<Model.Entity> _entityRepository;
```
- **field · _resourceStringRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IResourceStringRepository _resourceStringRepository;

```diff
+        protected readonly IResourceStringRepository _resourceStringRepository;
```
- **constructor · CoreLogframeIATIProvider** — _logic-change_
  
  +        public CoreLogframeIATIProvider(

```diff
+    {
+        protected readonly ILogframe2Repository<Model.LogframeVersion, Model.LogframeObjective, Model.LogframeReporting> _logframeRepository;
+        protected readonly ILogframe2Service<Model.LogframeVersion, Model.LogframeObjective, Model.LogframeReporting> _logframeService;
+        protected readonly IConfigurationRepository _configurationRepository;
+        protected readonly IEntityRepository<Model.Entity> _entityRepository;
+        protected readonly IResourceStringRepository _resourceStringRepository;
+
+        protected List<Model.LogframeVersion> LogframeVersions { get; set; }
+        protected List<ResourceString> ResourceStrings = new List<ResourceString>();
+        protected bool isReplaceEOYEOPTurnOn;
+
+        public CoreLogframeIATIProvider(
```
- **method · GetSectionData** — _logic-change_
  
  +        public result[] GetSectionData(IATISection section, IATIForm iatiForm, Model.Dto.BaseEntityDto entity)

```diff
+        public virtual IATISectionId SectionId { get; } = IATISectionId.Logframe;
+
+
+        protected override void Arrange(List<int> entityIds)
+        {
+            LogframeVersions = _logframeRepository.GetAllExportingLogframeVersions(entityIds);
+
+            var defaultLang = _resourceStringRepository.GetDefaultLanguage();
+            ResourceStrings = _resourceStringRepository.GetResourceStringsByLocaleId(defaultLang.LocalId);
+        }
+
+        public result[] GetSectionData(IATISection section, IATIForm iatiForm, Model.Dto.BaseEntityDto entity)
```
- **method · GetResultIndicators** — _logic-change_
  
  +        protected resultIndicator[] GetResultIndicators(Model.Dto.BaseEntityDto entity, Model.LogframeObjective obj, LogframeVersion logframeVersion, List<LogframeReporting> reportings, List<Model.Dto.LogframeTargetPeriodAvailable> allTargetPeriodAvailable)

```diff
+                {
+                    type = obj.Level?.Code,
+                    title = new textRequiredType
+                    {
+                        narrative = [new narrative { Value = $"{obj.ObjectiveNo} {GetResouceString(obj.Name)}" }]
+                    },
+                    indicator = GetResultIndicators(entity, obj, logframeVersion, reportings, allTargetPeriodAvailable)
+                }
+            ).ToArray();
+        }
+
+        protected resultIndicator[] GetResultIndicators(Model.Dto.BaseEntityDto entity, Model.LogframeObjective obj, LogframeVersion logframeVersion, List<LogframeReporting> reportings, List<Model.Dto.LogframeTargetPeriodAvailable> allTargetPeriodAvailable)
```
- **method · GetResultIndicatorBaseline** — _logic-change_
  
  +        protected resultIndicatorBaseline[] GetResultIndicatorBaseline(Model.Dto.BaseEntityDto entity, Model.LogframeIndicator ind, FieldType? fieldType, bool isNonQualitative)

```diff
+                    measure = ind.IndicatorType?.Code,
+                    title = new textRequiredType
+                    {
+                        narrative = [new narrative { Value = GetResouceString(ind.Name) }]
+                    },
+                    baseline = GetResultIndicatorBaseline(entity, ind, fieldType, isNonQualitative),
+                    period = GetResultIndicatorPeriod(entity, ind, logframeVersion, reportings, allTargetPeriodAvailable, fieldType, isNonQualitative),
+                };
+            }).ToList();
+            return result.ToArray();
+        }
+        protected resultIndicatorBaseline[] GetResultIndicatorBaseline(Model.Dto.BaseEntityDto entity, Model.LogframeIndicator ind, FieldType? fieldType, bool isNonQualitative)
```
- **method · GetResultIndicatorPeriod** — _logic-change_
  
  +        protected resultIndicatorPeriod[] GetResultIndicatorPeriod(Model.Dto.BaseEntityDto entity, Model.LogframeIndicator ind, LogframeVersion logframeVersion, List<LogframeReporting> reportings, List<Model.Dto.LogframeTargetPeriodAvailable> allTargetPeriodAvailable, FieldType? fieldType, bool isNonQualitative)

```diff
+                        }
+                    }.ToArray(),
+                    comment = isNonQualitative ? null : new textRequiredType
+                    {
+                        narrative = [new narrative { Value = baselineBreakdownValue }]
+                    },
+                };
+            }))*/
+            .Where(r => r != null).ToArray();
+        }
+
+        protected resultIndicatorPeriod[] GetResultIndicatorPeriod(Model.Dto.BaseEntityDto entity, Model.LogframeIndicator ind, LogframeVersion logframeVersion, List<LogframeReporting> reportings, List<Model.Dto.LogframeTargetPeriodAvailable> allTargetPeriodAvailable, FieldType? fieldType, bool isNonQualitative)
```
- **method · GetResultIndicatorPeriodItems** — _logic-change_
  
  +        protected List<resultIndicatorPeriod> GetResultIndicatorPeriodItems(Model.Dto.BaseEntityDto entity, Model.LogframeIndicator ind, LogframeVersion logframeVersion, List<LogframeReporting> reportings, List<LogframePeriod> targetPeriods, List<LogframePeriod> actualPeriods, FieldType? fieldType, bool isNonQualitative, bool sameFrequency, bool isTarget)

```diff
+                {
+                    result.AddRange(actualResults);
+                }
+            }
+            else
+            {
+                result = GetResultIndicatorPeriodItems(entity, ind, logframeVersion, reportings, targetPeriods, actualPeriods, fieldType, isNonQualitative, true, false);
+            }
+            return result.Count > 0 ? result.ToArray() : null;
+        }
+
+        protected List<resultIndicatorPeriod> GetResultIndicatorPeriodItems(Model.Dto.BaseEntityDto entity, Model.LogframeIndicator ind, LogframeVersion logframeVersion, List<LogframeReporting> reportings, List<LogframePeriod> targetPeriods, List<LogframePeriod> actualPeriods, FieldType? fieldType, bool isNonQualitative, bool sameFrequency, bool isTarget)
```
- **method · GetResultIndicatorTargetItem** — _logic-change_
  
  +        protected List<resultIndicatorPeriodTarget> GetResultIndicatorTargetItem(LogframeIndicator ind, bool isNonQualitative, LogframeVersion logframeVersion, FieldType? fieldType, LogframePeriod periodAvailable)

```diff
+                    periodstart = new resultIndicatorPeriodPeriodstart { isodate = periodAvailable.EOP == true ? entity.StartDate.Value : periodAvailable.StartDate },
+                    periodend = new resultIndicatorPeriodPeriodend { isodate = periodAvailable.EOP == true ? entity.EndDate.Value : periodAvailable.EndDate },
+                    target = (targetItems != null && targetItems.Count > 0) ? targetItems.ToArray() : null,
+                    actual = (actualItems != null && actualItems.Count > 0) ? actualItems.ToArray() : null
+                };
+                result.Add(item);
+            }
+
+            return result;
+        }
+        
+        protected List<resultIndicatorPeriodTarget> GetResultIndicatorTargetItem(LogframeIndicator ind, bool isNonQualitative, LogframeVersion logframeVersion, FieldType? fieldType, LogframePeriod periodAvailable)
```
- **method · GetResultIndicatorActualItem** — _logic-change, param:+out_
  
  +        protected List<resultIndicatorPeriodActual> GetResultIndicatorActualItem(LogframeIndicator ind, bool isNonQualitative, List<LogframeReporting> reportings, FieldType? fieldType, LogframePeriod periodAvailable, out bool existReporting)

```diff
+                            comment = isNonQualitative ? null : new textRequiredType
+                            {
+                                narrative = [new narrative { Value = targetBreakdownValue }]
+                            },
+                        });
+                    }
+                }
+            }*/
+            return targetItem;
+        }
+
+        protected List<resultIndicatorPeriodActual> GetResultIndicatorActualItem(LogframeIndicator ind, bool isNonQualitative, List<LogframeReporting> reportings, FieldType? fieldType, LogframePeriod periodAvailable, out bool existReporting)
```
- **method · GetResouceString** — _logic-change_
  
  +        protected string GetResouceString(string key)

```diff
+                            {
+                                narrative = [new narrative { Value = reportingBreakdownValue }]
+                            },
+                        });
+                    }
+                }
+            }*/
+
+            return actualItem;
+        }
+
+        protected string GetResouceString(string key)
```
- **method · IsValueNullAndIsNonQualitative** — _logic-change_
  
  +        protected bool IsValueNullAndIsNonQualitative(string value, bool isNonQualitative)

```diff
+            }*/
+
+            return actualItem;
+        }
+
+        protected string GetResouceString(string key)
+        {
+            var str = ResourceStrings.FirstOrDefault(f => f.FullKey == key);
+            return str != null ? str.Value : key;
+        }
+
+        protected bool IsValueNullAndIsNonQualitative(string value, bool isNonQualitative)
```
- **method · FilterInvalidObjectiveAndIndicator** — _logic-change_
  
  +        protected List<LogframeObjective> FilterInvalidObjectiveAndIndicator(LogframeVersion logframeVersion)

```diff
+        protected string GetResouceString(string key)
+        {
+            var str = ResourceStrings.FirstOrDefault(f => f.FullKey == key);
+            return str != null ? str.Value : key;
+        }
+
+        protected bool IsValueNullAndIsNonQualitative(string value, bool isNonQualitative)
+        {
+            return value == null && isNonQualitative;
+        }
+
+        protected List<LogframeObjective> FilterInvalidObjectiveAndIndicator(LogframeVersion logframeVersion)
```


## File: `ngo-api-core/NGO/NGO.Core.Services/ExportIATIServices/ExportIATIService.cs`
### Class: `(global)`
- **using · Microsoft.Extensions.Options** — _using_
  
  Thay đổi using: +using Microsoft.Extensions.Options;

```diff
+using Microsoft.Extensions.Options;
```
- **using · NGO.Core.Common.Configurations** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Configurations;

```diff
+using NGO.Core.Common.Configurations;
```

### Class: `ExportIATIService<TIATIForm, TEntity, TProjectDto, TProgramDto, TOrgUnitDto, TStakeholderDto, TFundingDto, TGeographyDto, TEmergencyDto, TStrategyDto, TNonProjectDto>`
- **field · _coreAppSettings** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly CoreAppSettings _coreAppSettings;

```diff
+        protected readonly CoreAppSettings _coreAppSettings;
```
- **method · GetIATIActivityId** — _—_
  
  +        public string GetIATIActivityId(Entity entity)

```diff
@@ -345,6 +360,74 @@ namespace NGO.Core.Services
             }
         }
 
+        public string GetIATIActivityId(Entity entity)
```


## File: `ngo-api-core/NGO/NGO.Core.Services/ExportIATIServices/RecipientCountryMtfProvider.cs`
### Class: `(global)`
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```

### Class: `RecipientCountryMtfProvider`
- **constructor · RecipientCountryMtfProvider** — _constructor:param-change_
  
  -        public RecipientCountryMtfProvider(IIATISectionProviderHelper providerHelper)

```diff
@@ -6,17 +7,22 @@ namespace NGO.Core.Services
     public class RecipientCountryMtfProvider : IIATISectionProvider<recipientcountry[]>
     {
         protected readonly IIATISectionProviderHelper _providerHelper;
-        public RecipientCountryMtfProvider(IIATISectionProviderHelper providerHelper)
```
- **field · _configService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IConfigurationService<Model.EntityDefinition, Model.TabDefinition> _configService;

```diff
+        protected readonly IConfigurationService<Model.EntityDefinition, Model.TabDefinition> _configService;
```
- **constructor · RecipientCountryMtfProvider** — _constructor:param-change_
  
  +        public RecipientCountryMtfProvider(IIATISectionProviderHelper providerHelper, IConfigurationService<Model.EntityDefinition, Model.TabDefinition> configService)

```diff
@@ -6,17 +7,22 @@ namespace NGO.Core.Services
     public class RecipientCountryMtfProvider : IIATISectionProvider<recipientcountry[]>
     {
         protected readonly IIATISectionProviderHelper _providerHelper;
-        public RecipientCountryMtfProvider(IIATISectionProviderHelper providerHelper)
+        protected readonly IConfigurationService<Model.EntityDefinition, Model.TabDefinition> _configService;
+        public RecipientCountryMtfProvider(IIATISectionProviderHelper providerHelper, IConfigurationService<Model.EntityDefinition, Model.TabDefinition> configService)
```


## File: `ngo-api-core/NGO/NGO.Core.Services/ExportIATIServices/RecipientRegionsMtfProvider.cs`
### Class: `(global)`
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```

### Class: `RecipientRegionsMtfProvider`
- **constructor · RecipientRegionsMtfProvider** — _constructor:param-change_
  
  -        public RecipientRegionsMtfProvider(IIATISectionProviderHelper providerHelper)

```diff
@@ -6,17 +7,22 @@ namespace NGO.Core.Services
     public class RecipientRegionsMtfProvider : IIATISectionProvider<recipientregion[]>
     {
         protected readonly IIATISectionProviderHelper _providerHelper;
-        public RecipientRegionsMtfProvider(IIATISectionProviderHelper providerHelper)
```
- **field · _configService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IConfigurationService<Model.EntityDefinition, Model.TabDefinition> _configService;

```diff
+        protected readonly IConfigurationService<Model.EntityDefinition, Model.TabDefinition> _configService;
```
- **constructor · RecipientRegionsMtfProvider** — _constructor:param-change_
  
  +        public RecipientRegionsMtfProvider(IIATISectionProviderHelper providerHelper, IConfigurationService<Model.EntityDefinition, Model.TabDefinition> configService)

```diff
@@ -6,17 +7,22 @@ namespace NGO.Core.Services
     public class RecipientRegionsMtfProvider : IIATISectionProvider<recipientregion[]>
     {
         protected readonly IIATISectionProviderHelper _providerHelper;
-        public RecipientRegionsMtfProvider(IIATISectionProviderHelper providerHelper)
+        protected readonly IConfigurationService<Model.EntityDefinition, Model.TabDefinition> _configService;
+        public RecipientRegionsMtfProvider(IIATISectionProviderHelper providerHelper, IConfigurationService<Model.EntityDefinition, Model.TabDefinition> configService)
```


## File: `ngo-api-core/NGO/NGO.Core.Services/ExportIATIServices/SectorMtfProvider.cs`
### Class: `(global)`
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```

### Class: `SectorMtfProvider`
- **constructor · SectorMtfProvider** — _constructor:param-change_
  
  -        public SectorMtfProvider(IIATISectionProviderHelper providerHelper)

```diff
@@ -1,22 +1,28 @@
 ﻿using NGO.Core.Model.Enums;
 using System.Linq;
+using System.Collections.Generic;
 
 namespace NGO.Core.Services
 {
     public class SectorMtfProvider : IIATISectionProvider<sector[]>
     {
         protected readonly IIATISectionProviderHelper _providerHelper;
-        public SectorMtfProvider(IIATISectionProviderHelper providerHelper)
```
- **field · _configService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IConfigurationService<Model.EntityDefinition, Model.TabDefinition> _configService;

```diff
+        protected readonly IConfigurationService<Model.EntityDefinition, Model.TabDefinition> _configService;
```
- **constructor · SectorMtfProvider** — _constructor:param-change_
  
  +        public SectorMtfProvider(IIATISectionProviderHelper providerHelper, IConfigurationService<Model.EntityDefinition, Model.TabDefinition> configService)

```diff
 ﻿using NGO.Core.Model.Enums;
 using System.Linq;
+using System.Collections.Generic;
 
 namespace NGO.Core.Services
 {
     public class SectorMtfProvider : IIATISectionProvider<sector[]>
     {
         protected readonly IIATISectionProviderHelper _providerHelper;
-        public SectorMtfProvider(IIATISectionProviderHelper providerHelper)
+        protected readonly IConfigurationService<Model.EntityDefinition, Model.TabDefinition> _configService;
+        public SectorMtfProvider(IIATISectionProviderHelper providerHelper, IConfigurationService<Model.EntityDefinition, Model.TabDefinition> configService)
```


## File: `ngo-api-core/NGO/NGO.Core.Services/ExportPdfServices/ExportPdfBeneficiaryService.cs`
### Class: `(global)`
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · Aspose.Words** — _using_
  
  Thay đổi using: +using Aspose.Words;

```diff
+using Aspose.Words;
```
- **using · NGO.Core.Model.Domain.Beneficiary** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Domain.Beneficiary;

```diff
+using NGO.Core.Model.Domain.Beneficiary;
```
- **using · NGO.Core.Model.Dto.Parameters** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Dto.Parameters;

```diff
+using NGO.Core.Model.Dto.Parameters;
```
- **using · System.Drawing** — _using_
  
  Thay đổi using: +using System.Drawing;

```diff
+using System.Drawing;
```
- **using · Aspose.Words.Tables** — _using_
  
  Thay đổi using: +using Aspose.Words.Tables;

```diff
+using Aspose.Words.Tables;
```

### Class: `ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement, TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount, DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStakeholderDto, DFundingDto, DEmerDto, DStrategyDto, DNonProjectDto, DGeoDto, DPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, DFundingPlan, TBeneficiaryVersion, DBeneficiaryVersion, DLogframeVersion, DLogframeReporting>`
- **class · ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement, TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount, DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStakeholderDto, DFundingDto, DEmerDto, DStrategyDto, DNonProjectDto, DGeoDto, DPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, DFundingPlan, TBeneficiaryVersion, DBeneficiaryVersion, DLogframeVersion, DLogframeReporting>** — _class:generic-change_
  
  Thay đổi khai báo class: class ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement, TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount, DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DSt…

```diff
+    public partial class ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement, TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount, DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStakeholderDto, DFundingDto, DEmerDto, DStrategyDto, DNonProjectDto, DGeoDto, DPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, DFundingPlan, TBeneficiaryVersion, DBeneficiaryVersion, DLogframeVersion, DLogframeReporting>
```


## File: `ngo-api-core/NGO/NGO.Core.Services/ExportPdfServices/ExportPdfBudgetService.cs`
### Class: `(global)`
- **using · NGO.Core.Common.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Extensions;

```diff
+using NGO.Core.Common.Extensions;
```
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · NGO.Core.Model.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Extensions;

```diff
+using NGO.Core.Model.Extensions;
```
- **using · Aspose.Words** — _using_
  
  Thay đổi using: +using Aspose.Words;

```diff
+using Aspose.Words;
```
- **using · Newtonsoft.Json** — _using_
  
  Thay đổi using: +using Newtonsoft.Json;

```diff
+using Newtonsoft.Json;
```
- **using · System.Drawing** — _using_
  
  Thay đổi using: +using System.Drawing;

```diff
+using System.Drawing;
```
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```
- **using · Aspose.Words.Tables** — _using_
  
  Thay đổi using: +using Aspose.Words.Tables;

```diff
+using Aspose.Words.Tables;
```

### Class: `ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement, TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount, DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStakeholderDto, DFundingDto, DEmerDto, DStrategyDto, DNonProjectDto, DGeoDto, DPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, DFundingPlan, TBeneficiaryVersion, DBeneficiaryVersion, DLogframeVersion, DLogframeReporting>`
- **class · ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement, TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount, DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStakeholderDto, DFundingDto, DEmerDto, DStrategyDto, DNonProjectDto, DGeoDto, DPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, DFundingPlan, TBeneficiaryVersion, DBeneficiaryVersion, DLogframeVersion, DLogframeReporting>** — _class:generic-change_
  
  Thay đổi khai báo class: class ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement, TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount, DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DSt…

```diff
+    public partial class ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement, TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount, DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStakeholderDto, DFundingDto, DEmerDto, DStrategyDto, DNonProjectDto, DGeoDto, DPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, DFundingPlan, TBeneficiaryVersion, DBeneficiaryVersion, DLogframeVersion, DLogframeReporting>
```


## File: `ngo-api-core/NGO/NGO.Core.Services/ExportPdfServices/ExportPdfFinanceService.cs`
### Class: `(global)`
- **using · NGO.Core.Common.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Extensions;

```diff
+using NGO.Core.Common.Extensions;
```
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · NGO.Core.Model.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Extensions;

```diff
+using NGO.Core.Model.Extensions;
```
- **using · Aspose.Words** — _using_
  
  Thay đổi using: +using Aspose.Words;

```diff
+using Aspose.Words;
```
- **using · Newtonsoft.Json** — _using_
  
  Thay đổi using: +using Newtonsoft.Json;

```diff
+using Newtonsoft.Json;
```
- **using · System.Drawing** — _using_
  
  Thay đổi using: +using System.Drawing;

```diff
+using System.Drawing;
```
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```
- **using · Aspose.Words.Tables** — _using_
  
  Thay đổi using: +using Aspose.Words.Tables;

```diff
+using Aspose.Words.Tables;
```

### Class: `ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement, TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount, DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStakeholderDto, DFundingDto, DEmerDto, DStrategyDto, DNonProjectDto, DGeoDto, DPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, DFundingPlan, TBeneficiaryVersion, DBeneficiaryVersion, DLogframeVersion, DLogframeReporting>`
- **class · ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement, TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount, DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStakeholderDto, DFundingDto, DEmerDto, DStrategyDto, DNonProjectDto, DGeoDto, DPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, DFundingPlan, TBeneficiaryVersion, DBeneficiaryVersion, DLogframeVersion, DLogframeReporting>** — _class:generic-change_
  
  Thay đổi khai báo class: class ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement, TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount, DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DSt…

```diff
+    public partial class ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement, TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount, DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStakeholderDto, DFundingDto, DEmerDto, DStrategyDto, DNonProjectDto, DGeoDto, DPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, DFundingPlan, TBeneficiaryVersion, DBeneficiaryVersion, DLogframeVersion, DLogframeReporting>
```


## File: `ngo-api-core/NGO/NGO.Core.Services/ExportPdfServices/ExportPdfLogframeService.cs`
### Class: `(global)`
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · NGO.Core.Model.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Extensions;

```diff
+using NGO.Core.Model.Extensions;
```
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```
- **using · NGO.Core.Common.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Extensions;

```diff
+using NGO.Core.Common.Extensions;
```
- **using · NGO.Core.Common.Constants** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Constants;

```diff
+using NGO.Core.Common.Constants;
```
- **using · LinqKit** — _using_
  
  Thay đổi using: +using LinqKit;

```diff
+using LinqKit;
```
- **using · NGO.Core.Model.Dto.Logframe** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Dto.Logframe;

```diff
+using NGO.Core.Model.Dto.Logframe;
```
- **using · NGO.Core.Common.Utilities** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Utilities;

```diff
+using NGO.Core.Common.Utilities;
```
- **using · System.Data** — _using_
  
  Thay đổi using: +using System.Data;

```diff
+using System.Data;
```

### Class: `ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement,TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount,DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStakeholderDto, DFundingDto, DEmerDto, DStrategyDto, DNonProjectDto, DGeoDto, DPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, DFundingPlan, TBeneficiaryVersion, DBeneficiaryVersion, DLogframeVersion, DLogframeReporting>`
- **class · ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement,TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount,DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStakeholderDto, DFundingDto, DEmerDto, DStrategyDto, DNonProjectDto, DGeoDto, DPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, DFundingPlan, TBeneficiaryVersion, DBeneficiaryVersion, DLogframeVersion, DLogframeReporting>** — _class:generic-change_
  
  Thay đổi khai báo class: class ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement,TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount,DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStak…

```diff
+    public partial class ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement,TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount,DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStakeholderDto, DFundingDto, DEmerDto, DStrategyDto, DNonProjectDto, DGeoDto, DPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, DFundingPlan, TBeneficiaryVersion, DBeneficiaryVersion, DLogframeVersion, DLogframeReporting>
```
- **method · ToLogframeStructureModel** — _logic-change_
  
  +        public Model.Dto.Logframe.ExportLogframeReporting ToLogframeStructureModel(TLogframeVersion version, EEntity entity, List<Model.Dto.FieldConfiguration> dtoFields)

```diff
+            });
+        }
+
+        #endregion [Hierarchy Indicator tracker]
+
+        #region [Flat Logframe]
+        protected virtual Model.Dto.Logframe.ExportLogframeReporting GetLogframeExportTable(TLogframeVersion version, TTask task, List<Model.Dto.FieldConfiguration> dtoFields)
+        {
+            return ToLogframeStructureModel(version, task.Entity as EEntity, dtoFields);
+        }
+
+        public Model.Dto.Logframe.ExportLogframeReporting ToLogframeStructureModel(TLogframeVersion version, EEntity entity, List<Model.Dto.FieldConfiguration> dtoFields)
```
- **method · ToReportingModel** — _logic-change_
  
  +        public Model.Dto.Logframe.ExportLogframeReporting ToReportingModel(TLogframeReporting reporting, TLogframeVersion version, EEntity entity, List<Model.Dto.FieldConfiguration> dtoFields)

```diff
+                exportObjective.TargetText = target.TargetText;
+            }
+        }
+        #endregion [Flat Logframe]
+
+        #region [Flat Indicator tracker]
+        protected virtual ExportLogframeReporting GetIndicatorLogframeReporting(TLogframeVersion version, TLogframeReporting reporting, TTask task, List<Model.Dto.FieldConfiguration> dtoFields)
+        {
+            return ToReportingModel(reporting, version, task.Entity as EEntity, dtoFields);
+        }
+
+        public Model.Dto.Logframe.ExportLogframeReporting ToReportingModel(TLogframeReporting reporting, TLogframeVersion version, EEntity entity, List<Model.Dto.FieldConfiguration> dtoFields)
```


## File: `ngo-api-core/NGO/NGO.Core.Services/ExportPdfServices/ExportPdfService.cs`
### Class: `(global)`
- **using · NGO.Core.Model.Dto.Logframe** — _using_
  
  Thay đổi using: -using NGO.Core.Model.Dto.Logframe;

```diff
-using NGO.Core.Model.Dto.Logframe;
```
- **using · NGO.Core.Model.Extensions** — _using_
  
  Thay đổi using: -using NGO.Core.Model.Extensions;

```diff
-using NGO.Core.Model.Extensions;
```

### Class: `ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement,TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount,DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStakeholderDto, DFundingDto, DEmerDto, DStrategyDto, DNonProjectDto, DGeoDto, DPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, DFundingPlan, TBeneficiaryVersion, DBeneficiaryVersion, DLogframeVersion, DLogframeReporting>`
- **class · ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement,TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount,DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStakeholderDto, DFundingDto, DEmerDto, DStrategyDto, DNonProjectDto, DGeoDto, DPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, DFundingPlan, TBeneficiaryVersion, DBeneficiaryVersion, DLogframeVersion, DLogframeReporting>** — _class:generic-change_
  
  Thay đổi khai báo class: class ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement,TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount,DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStak…

```diff
+    public partial class ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement,TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount,DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStakeholderDto, DFundingDto, DEmerDto, DStrategyDto, DNonProjectDto, DGeoDto, DPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, DFundingPlan, TBeneficiaryVersion, DBeneficiaryVersion, DLogframeVersion, DLogframeReporting>
```
- **field · _partnerExpenditureReportingExportExcelService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IPartnerExpenditureReportingExportExcelService<TPartnerExpenditureReporting, TBudgetVersion> _partnerExpenditureReportingExportExcelService;

```diff
+        protected readonly IPartnerExpenditureReportingExportExcelService<TPartnerExpenditureReporting, TBudgetVersion> _partnerExpenditureReportingExportExcelService;
```
- **field · _logframeVersionMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<DLogframeVersion, TLogframeVersion> _logframeVersionMapper;

```diff
+        protected readonly IDtoMapper<DLogframeVersion, TLogframeVersion> _logframeVersionMapper;
```
- **field · _logframeReportingMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<DLogframeReporting, TLogframeReporting> _logframeReportingMapper;

```diff
+        protected readonly IDtoMapper<DLogframeReporting, TLogframeReporting> _logframeReportingMapper;
```
- **field · _logframeService** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly ILogframeService<LogframeVersion, LogframeObjective, LogframeReporting> _logframeService;

```diff
-        protected readonly ILogframeService<LogframeVersion, LogframeObjective, LogframeReporting> _logframeService;
```
- **field · _logframeService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ILogframeService<TLogframeVersion, LogframeObjective, TLogframeReporting> _logframeService;

```diff
+        protected readonly ILogframeService<TLogframeVersion, LogframeObjective, TLogframeReporting> _logframeService;
```
- **field · _exchangeRateService** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly IExchangeRateService<ExchangeRateObject> _exchangeRateService;

```diff
-        protected readonly IExchangeRateService<ExchangeRateObject> _exchangeRateService;
```
- **field · _exchangeRateService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IExchangeRateService<ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;

```diff
+        protected readonly IExchangeRateService<ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;
```
- **field · _beneficiaryService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IBeneficiaryService<TBeneficiaryVersion, BeneficiaryReporting, BeneficiaryProjectLifeTotal> _beneficiaryService;

```diff
+        protected readonly IBeneficiaryService<TBeneficiaryVersion, BeneficiaryReporting, BeneficiaryProjectLifeTotal> _beneficiaryService;
```
- **field · _beneficiaryVersionMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<DBeneficiaryVersion, TBeneficiaryVersion> _beneficiaryVersionMapper;

```diff
+        protected readonly IDtoMapper<DBeneficiaryVersion, TBeneficiaryVersion> _beneficiaryVersionMapper;
```
- **field · _logframe2Service** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ILogframe2Service<TLogframeVersion, LogframeObjective, TLogframeReporting> _logframe2Service;

```diff
+        protected readonly ILogframe2Service<TLogframeVersion, LogframeObjective, TLogframeReporting> _logframe2Service;
```
- **constructor · ExportPdfService** — _logic-change_
  
  public ExportPdfService(IExtractInjectedMetadataService helper,

```diff
         protected readonly IFieldDefinitionRepository<FieldConfiguration> _fieldDefinitionRepository;
-        protected readonly IExchangeRateService<ExchangeRateObject> _exchangeRateService;
+        protected readonly IExchangeRateService<ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;
+        protected readonly IBeneficiaryService<TBeneficiaryVersion, BeneficiaryReporting, BeneficiaryProjectLifeTotal> _beneficiaryService;
+        protected readonly IDtoMapper<DBeneficiaryVersion, TBeneficiaryVersion> _beneficiaryVersionMapper;
         protected BudgetIncomingHelperService _helperService = new BudgetIncomingHelperService();
+        protected readonly ILogframe2Service<TLogframeVersion, LogframeObjective, TLogframeReporting> _logframe2Service;
+        const ParagraphAlignment NumberAlignment = ParagraphAlignment.Right;
+        const ParagraphAlignment TextAlignment = ParagraphAlignment.Left;
+        protected Dictionary<string, string> _configs = new Dictionary<string, string>();
 
         public ExportPdfService(IExtractInjectedMetadataService helper,
```
- **method · GetResouceString** — _logic-change_
  
  -        private string GetResouceString(string key)

```diff
         {
-            InitResouceString();
-            return ToReportingModel(reporting, version, task.Entity as EEntity, dtoFields);
-        }
-
-        protected virtual ExportLogframeReporting GetLogframeExportTable(TLogframeVersion version,  TTask task, List<Model.Dto.FieldConfiguration> dtoFields)
-        {
-            InitResouceString();
-            return ToLogframeStructureModel(version, task.Entity as EEntity, dtoFields);
-        }
-
-        private string GetResouceString(string key)
```
- **method · InitResouceString** — _logic-change_
  
  -        private void InitResouceString()

```diff
-        {
-            InitResouceString();
-            return ToLogframeStructureModel(version, task.Entity as EEntity, dtoFields);
-        }
-
-        private string GetResouceString(string key)
-        {
-            var str = ResourceStrings.FirstOrDefault(f => f.FullKey == key);
-            return str != null ? str.Value : key;
-        }
-
-        private void InitResouceString()
```
- **method · ToReportingModel** — _logic-change_
  
  -        public ExportLogframeReporting ToReportingModel(TLogframeReporting reporting, TLogframeVersion version, EEntity entity, List<Model.Dto.FieldConfiguration> dtoFields)

```diff
+            if (ResourceStrings.Count == 0)
             {
-                return;
+                ResourceStrings = _resourceRepository.GetResourceStringsByLocaleId(DefaultLanguage.LocalId);
             }
-
-            var defaultLang = _resourceRepository.GetDefaultLanguage();
-            ResourceStrings = _resourceRepository.GetResourceStringsByLocaleId(defaultLang.LocalId);
-        }
-
-
-        public ExportLogframeReporting ToReportingModel(TLogframeReporting reporting, TLogframeVersion version, EEntity entity, List<Model.Dto.FieldConfiguration> dtoFields)
```
- **method · ToLogframeStructureModel** — _logic-change_
  
  -        public ExportLogframeReporting ToLogframeStructureModel(TLogframeVersion version, EEntity entity, List<Model.Dto.FieldConfiguration> dtoFields)

```diff
-                    }
-
-                    exportModel.Objectives.Add(exportObjective);
-                    indicatorIndex++;
-                });
-            });
-            return exportModel;
+            var str = ResourceStrings.FirstOrDefault(f => f.FullKey == key);
+            return str != null ? str.Value : key;
         }
 
-        public ExportLogframeReporting ToLogframeStructureModel(TLogframeVersion version, EEntity entity, List<Model.Dto.FieldConfiguration> dtoFields)
```
- **method · SetBaseLineVal** — _logic-change_
  
  -        private void SetBaseLineVal(ExportLogframeObjective exportObjective, LogframeIndicator indicator, string formatBaselineNumber)

```diff
-                else
-                {
-                    var exportObjective = new ExportLogframeObjective();
-                    exportObjective.Level = (objective.IsGlobal ? objective.GlobalObjective.Name : objective.Name);
-                    exportObjective.LogframeObjective = _logframeObjectiveMapper.ToDto(objective);
-                    exportModel.Objectives.Add(exportObjective);
-                }
-            }
-            return exportModel;
-        }
-
-        private void SetBaseLineVal(ExportLogframeObjective exportObjective, LogframeIndicator indicator, string formatBaselineNumber)
```
- **method · SetTargetVal** — _logic-change_
  
  -        private void SetTargetVal(ExportLogframeObjective exportObjective, LogframeIndicatorTarget target, string targetFormatNumber)

```diff
-            else if (indicator.BaselineRef != null)
-            {
-                exportObjective.BaselineRef = _genericMapper.ToDto(indicator.BaselineRef);
-            }
-            else if (!string.IsNullOrEmpty(indicator.BaselineText))
-            {
-                exportObjective.BaselineText = indicator.BaselineText;
+                return _defaultLanguage;
             }
         }
 
-        private void SetTargetVal(ExportLogframeObjective exportObjective, LogframeIndicatorTarget target, string targetFormatNumber)
```
- **method · IsLogframeIndicatorTracker** — _logic-change_
  
  -        protected bool IsLogframeIndicatorTracker(TTask task)

```diff
-            }
-            else if (target.TargetRef != null)
-            {
-                exportObjective.TargetRef = _genericMapper.ToDto(target.TargetRef);
-            }
-            else if (!string.IsNullOrEmpty(target.TargetText))
-            {
-                exportObjective.TargetText = target.TargetText;
-            }
-        }
-
-        protected bool IsLogframeIndicatorTracker(TTask task)
```
- **method · IsLogframeStructure** — _logic-change_
  
  -        protected bool IsLogframeStructure(Core.Model.Dto.Task task)

```diff
-                exportObjective.TargetText = target.TargetText;
-            }
-        }
-
-        protected bool IsLogframeIndicatorTracker(TTask task)
-        {
-            return task.RelatedItemId.HasValue
-                && task.TabFunctionId == (Core.Model.Enums.TabFunctionId.LogframeIndicatorTracker)
-                && task.Template != null;
-        }
-
-        protected bool IsLogframeStructure(Core.Model.Dto.Task task)
```
- **method · GetConfigValue** — _logic-change_
  
  +        protected string GetConfigValue(string configKey)

```diff
@@ -1988,5 +1444,21 @@ namespace NGO.Core.Services
             return fields.Where(f => !ignoreFieldNames.Contains(f.FieldName) && f.Active == true && f.TabFunctionId == (int)TabFunctionId.Document).ToList();
         }
 
+        protected virtual void ExtendObject(List<Model.ExportTable> regionTables,
+            DBeneficiaryVersion dtoObject,
+            List<Model.Dto.FieldConfiguration> dtoFields)
+        {
+            dtoObject.ApprovalDate = DateTime.Now;
+        }
+
+        protected string GetConfigValue(string configKey)
```

### Class: `ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement,TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount,DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStakeholderDto, DFundingDto, DEmerDto, DStrategyDto, DNonProjectDto, DGeoDto, DPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, DFundingPlan>`
- **class · ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement,TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount,DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStakeholderDto, DFundingDto, DEmerDto, DStrategyDto, DNonProjectDto, DGeoDto, DPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, DFundingPlan>** — _class:generic-change_
  
  Thay đổi khai báo class: class ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement,TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount,DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStak…

```diff
-    public class ExportPdfService<TTask, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, TBankAccount, TAgreement,TLog, TBudgetVersion, TPayment, TFundingAllocation, TChange, TPartnerExpenditureReporting, DAgreement, DBankAccount,DLog, DFundingIdea, DIdea, DPayment, DBudgetVersion, DFundingAllocation, DProjectDto, DProgramDto, DOrgUnitDto, DStakeholderDto, DFundingDto, DEmerDto, DStrategyDto, DNonProjectDto, DGeoDto, DPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, DFundingPlan>
```


## File: `ngo-api-core/NGO/NGO.Core.Services/FinancialChartService.cs`
### Class: `(global)`
- **using · System.Web.Services.Description** — _using_
  
  Thay đổi using: -using System.Web.Services.Description;

```diff
-using System.Web.Services.Description;
```
- **field · _exchangeRateService** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly IExchangeRateService<ExchangeRateObject> _exchangeRateService;

```diff
-        protected readonly IExchangeRateService<ExchangeRateObject> _exchangeRateService;
```
- **field · _exchangeRateService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IExchangeRateService<ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;

```diff
+        protected readonly IExchangeRateService<ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;
```
- **method · GetIncomeScheduleChart** — _—_
  
  -        public ICS GetIncomeScheduleChart(Entity entity, Model.Dto.OverviewFinanceChartBoxConfiguration boxConfig, ListParameter param)

```diff
@@ -640,7 +639,7 @@ namespace NGO.Core.Services
             return null;
         }
 
-        public ICS GetIncomeScheduleChart(Entity entity, Model.Dto.OverviewFinanceChartBoxConfiguration boxConfig, ListParameter param)
```


## File: `ngo-api-core/NGO/NGO.Core.Services/FundingFinancialExportExcelService.cs`
### Class: `(global)`
- **field · _exchangeRateService** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly IExchangeRateService<Model.ExchangeRateObject> _exchangeRateService;

```diff
-        protected readonly IExchangeRateService<Model.ExchangeRateObject> _exchangeRateService;
```
- **field · _exchangeRateService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IExchangeRateService<Model.ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;

```diff
+        protected readonly IExchangeRateService<Model.ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/FundingFinancialService.cs`
### Class: `(global)`
- **field · _exchangeRateRepository** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly IExchangeRateRepository<Model.ExchangeRateObject> _exchangeRateRepository;

```diff
-        protected readonly IExchangeRateRepository<Model.ExchangeRateObject> _exchangeRateRepository;
```
- **field · _exchangeRateRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IExchangeRateRepository<Model.ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateRepository;

```diff
+        protected readonly IExchangeRateRepository<Model.ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateRepository;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/FundingPlanService.cs`
### Class: `(global)`
- **field · _exchangeRateRepository** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly IExchangeRateRepository<Model.ExchangeRateObject> _exchangeRateRepository;

```diff
-        protected readonly IExchangeRateRepository<Model.ExchangeRateObject> _exchangeRateRepository;
```
- **field · _exchangeRateRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IExchangeRateRepository<Model.ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateRepository;

```diff
+        protected readonly IExchangeRateRepository<Model.ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateRepository;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/GeographyService.cs`
### Class: `(global)`
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/IATIPageService.cs`
### Class: `(global)`
- **using · NGO.Core.Common.Configurations** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Configurations;

```diff
+using NGO.Core.Common.Configurations;
```
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```

### Class: `IATIPageService<TModel>`
- **class · IATIPageService<TModel>** — _class:generic-change_
  
  Thay đổi khai báo class: class IATIPageService<TModel>

```diff
-    public class IATIPageService<TModel>: IIATIPageService<TModel> where TModel : Model.IATIForm, new()
```
- **class · IATIPageService<TModel>** — _class:generic-change_
  
  Thay đổi khai báo class: class IATIPageService<TModel>

```diff
+    public class IATIPageService<TModel> : IIATIPageService<TModel> where TModel : Model.IATIForm, new()
```
- **field · _exportIATIFileService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IExportIATIService _exportIATIFileService;

```diff
+        protected readonly IExportIATIService _exportIATIFileService;
```
- **field · _coreAppSettings** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly CoreAppSettings _coreAppSettings;

```diff
+        protected readonly CoreAppSettings _coreAppSettings;
```
- **constructor · IATIPageService** — _constructor:param-change, logic-change_
  
  -        public IATIPageService(IExportIATIRepository<TModel> exportIATIRepository, IEmailService emailService, IUserService<Model.User> userService, ISPDocumentService<Model.Dto.SPListItem> documentService, IMemoryCacheRepository<Model.SPSite> memoryCacheRepository)

```diff
-    public class IATIPageService<TModel>: IIATIPageService<TModel> where TModel : Model.IATIForm, new()
+    public class IATIPageService<TModel> : IIATIPageService<TModel> where TModel : Model.IATIForm, new()
     {
+        protected readonly IExportIATIService _exportIATIFileService;
         protected readonly IExportIATIRepository<TModel> _exportIATIRepository;
         protected readonly IEmailService _emailService;
         protected readonly IUserService<Model.User> _userService;
         protected readonly ISPDocumentService<Model.Dto.SPListItem> _documentService;
         protected readonly IMemoryCacheRepository<Model.SPSite> _memoryCacheRepository;
+        protected readonly CoreAppSettings _coreAppSettings;
 
-        public IATIPageService(IExportIATIRepository<TModel> exportIATIRepository, IEmailService emailService, IUserService<Model.User> userService, ISPDocumentService<Model.Dto.SPListItem> documentService, IMemoryCacheRepository<Model.SPSite> memoryCacheRepository)
```
- **constructor · IATIPageService** — _constructor:param-change, logic-change_
  
  +        public IATIPageService(IExportIATIRepository<TModel> exportIATIRepository, IEmailService emailService, IUserService<Model.User> userService, ISPDocumentService<Model.Dto.SPListItem> documentService, IMemoryCacheRepository<Model.SPSite> memoryCacheRepository, IOptions<CoreAppSettings> coreAppSettings, IExportIATIService exportIATIFileService)

```diff
+    public class IATIPageService<TModel> : IIATIPageService<TModel> where TModel : Model.IATIForm, new()
     {
+        protected readonly IExportIATIService _exportIATIFileService;
         protected readonly IExportIATIRepository<TModel> _exportIATIRepository;
         protected readonly IEmailService _emailService;
         protected readonly IUserService<Model.User> _userService;
         protected readonly ISPDocumentService<Model.Dto.SPListItem> _documentService;
         protected readonly IMemoryCacheRepository<Model.SPSite> _memoryCacheRepository;
+        protected readonly CoreAppSettings _coreAppSettings;
 
-        public IATIPageService(IExportIATIRepository<TModel> exportIATIRepository, IEmailService emailService, IUserService<Model.User> userService, ISPDocumentService<Model.Dto.SPListItem> documentService, IMemoryCacheRepository<Model.SPSite> memoryCacheRepository)
+        public IATIPageService(IExportIATIRepository<TModel> exportIATIRepository, IEmailService emailService, IUserService<Model.User> userService, ISPDocumentService<Model.Dto.SPListItem> documentService, IMemoryCacheRepository<Model.SPSite> memoryCacheRepository, IOptions<CoreAppSettings> coreAppSettings, IExportIATIService exportIATIFileService)
```
- **method · UpdateEntityIATI** — _—_
  
  -        public void UpdateEntityIATI(int entityId, TModel form)

```diff
@@ -62,9 +71,20 @@ namespace NGO.Core.Services
             return _exportIATIRepository.GetIATIForm(entityId);
         }
 
-        public void UpdateEntityIATI(int entityId, TModel form)
```
- **method · UpdateEntityIATI** — _—_
  
  +        public void UpdateEntityIATI(Entity entity, TModel form)

```diff
@@ -62,9 +71,20 @@ namespace NGO.Core.Services
             return _exportIATIRepository.GetIATIForm(entityId);
         }
 
-        public void UpdateEntityIATI(int entityId, TModel form)
+        public void UpdateEntityIATI(Entity entity, TModel form)
```
- **method · GetMaxEmailAttachmentFileSizeMb** — _logic-change_
  
  +        public int GetMaxEmailAttachmentFileSizeMb()

```diff
+        public void UpdateEntityIATI(Entity entity, TModel form)
         {
-            _exportIATIRepository.UpdateEntityIATI(entityId, form);
+            form.CalculatedIATIActivityId = _exportIATIFileService.GetIATIActivityId(entity);
+            _exportIATIRepository.UpdateEntityIATI(entity.EntityId, form);
         }
+        public async System.Threading.Tasks.Task UpdateEntityIATIsAsync(List<Model.Dto.BaseEntityDto> entities)
+        {
+            await _exportIATIRepository.UpdateEntityIATIsAsync(entities);
+        }
+
+        public int GetMaxEmailAttachmentFileSizeMb()
```


## File: `ngo-api-core/NGO/NGO.Core.Services/IATITransactionImportExcelService.cs`
### Class: `(global)`
- **using · DocumentFormat.OpenXml.Packaging** — _using_
  
  Thay đổi using: +using DocumentFormat.OpenXml.Packaging;

```diff
+using DocumentFormat.OpenXml.Packaging;
```
- **using · DocumentFormat.OpenXml.Spreadsheet** — _using_
  
  Thay đổi using: +using DocumentFormat.OpenXml.Spreadsheet;

```diff
+using DocumentFormat.OpenXml.Spreadsheet;
```
- **using · NGO.Core.Common.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Extensions;

```diff
+using NGO.Core.Common.Extensions;
```
- **using · NGO.Core.Common.Constants** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Constants;

```diff
+using NGO.Core.Common.Constants;
```
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```
- **using · NGO.Core.Repositories** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories;

```diff
+using NGO.Core.Repositories;
```
- **using · NGO.Core.Services.Utilities** — _using_
  
  Thay đổi using: +using NGO.Core.Services.Utilities;

```diff
+using NGO.Core.Services.Utilities;
```
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.IO** — _using_
  
  Thay đổi using: +using System.IO;

```diff
+using System.IO;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · Microsoft.AspNetCore.Http** — _using_
  
  Thay đổi using: +using Microsoft.AspNetCore.Http;

```diff
+using Microsoft.AspNetCore.Http;
```
- **using · NGO.Core.Common.Utilities** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Utilities;

```diff
+using NGO.Core.Common.Utilities;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: +using System.Threading.Tasks;

```diff
+using System.Threading.Tasks;
```
- **using · System.Reflection** — _using_
  
  Thay đổi using: +using System.Reflection;

```diff
+using System.Reflection;
```
- **using · System.Globalization** — _using_
  
  Thay đổi using: +using System.Globalization;

```diff
+using System.Globalization;
```
- **using · Microsoft.IdentityModel.Tokens** — _using_
  
  Thay đổi using: +using Microsoft.IdentityModel.Tokens;

```diff
+using Microsoft.IdentityModel.Tokens;
```
- **using · NGO.Core.Services.ExportExcelService** — _using_
  
  Thay đổi using: +using NGO.Core.Services.ExportExcelService;

```diff
+using NGO.Core.Services.ExportExcelService;
```
- **using · NGO.Core.Common.Queue** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Queue;

```diff
+using NGO.Core.Common.Queue;
```
- **using · NGO.Core.Model.Mapping** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Mapping;

```diff
+using NGO.Core.Model.Mapping;
```
- **using · Newtonsoft.Json** — _using_
  
  Thay đổi using: +using Newtonsoft.Json;

```diff
+using Newtonsoft.Json;
```
- **using · NGO.Core.Model.Dto.Parameters** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Dto.Parameters;

```diff
+using NGO.Core.Model.Dto.Parameters;
```
- **using · NGO.Core.Repositories.Mapping.OptionsMapper** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.Mapping.OptionsMapper;

```diff
+using NGO.Core.Repositories.Mapping.OptionsMapper;
```
- **using · NGO.Core.Common.DI** — _using_
  
  Thay đổi using: +using NGO.Core.Common.DI;

```diff
+using NGO.Core.Common.DI;
```
- **using · Microsoft.Extensions.Logging** — _using_
  
  Thay đổi using: +using Microsoft.Extensions.Logging;

```diff
+using Microsoft.Extensions.Logging;
```
- **using · LinqKit** — _using_
  
  Thay đổi using: +using LinqKit;

```diff
+using LinqKit;
```

### Class: `IATITransactionImportExcelService<TModel>`
- **class · IATITransactionImportExcelService<TModel>** — _class:generic-change_
  
  Thay đổi khai báo class: class IATITransactionImportExcelService<TModel>

```diff
+    public class IATITransactionImportExcelService<TModel> : IIATITransactionImportExcelService
```
- **field · _iatiTransactionImportService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IIATITransactionImportService<TModel> _iatiTransactionImportService;

```diff
+        protected readonly IIATITransactionImportService<TModel> _iatiTransactionImportService;
```
- **field · _iatiPageService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IIATIPageService<Model.IATIForm> _iatiPageService;

```diff
+        protected readonly IIATIPageService<Model.IATIForm> _iatiPageService;
```
- **field · _fieldRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IFieldDefinitionRepository<FieldConfiguration> _fieldRepository;

```diff
+        protected readonly IFieldDefinitionRepository<FieldConfiguration> _fieldRepository;
```
- **field · _spSiteRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ISPSiteRepository<SPSite> _spSiteRepository;

```diff
+        protected readonly ISPSiteRepository<SPSite> _spSiteRepository;
```
- **field · _folderService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ISPFolderService<Model.Dto.SPFolder> _folderService;

```diff
+        protected readonly ISPFolderService<Model.Dto.SPFolder> _folderService;
```
- **field · _documentService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ISPDocumentService<Model.Dto.SPListItem> _documentService;

```diff
+        protected readonly ISPDocumentService<Model.Dto.SPListItem> _documentService;
```
- **field · _memoryCacheRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IMemoryCacheRepository<SPSite> _memoryCacheRepository;

```diff
+        protected readonly IMemoryCacheRepository<SPSite> _memoryCacheRepository;
```
- **field · _resourceStringService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IResourceStringService _resourceStringService;

```diff
+        protected readonly IResourceStringService _resourceStringService;
```
- **field · _iatiTransactionImportQueue** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IATITransactionImportQueue _iatiTransactionImportQueue;

```diff
+        protected readonly IATITransactionImportQueue _iatiTransactionImportQueue;
```
- **field · _serviceProvider** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IServiceProvider _serviceProvider;

```diff
+        protected readonly IServiceProvider _serviceProvider;
```
- **field · _iatiTransactionService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IIATITransactionService<IATITransaction> _iatiTransactionService;

```diff
+        protected readonly IIATITransactionService<IATITransaction> _iatiTransactionService;
```
- **field · _iatiTransactionMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<Model.Dto.IATITransaction, Model.IATITransaction> _iatiTransactionMapper;

```diff
+        protected readonly IDtoMapper<Model.Dto.IATITransaction, Model.IATITransaction> _iatiTransactionMapper;
```
- **field · _exportIATIFileService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IExportIATIService _exportIATIFileService;

```diff
+        protected readonly IExportIATIService _exportIATIFileService;
```
- **constructor · IATITransactionImportExcelService** — _logic-change_
  
  +        public IATITransactionImportExcelService(IIATITransactionImportService<TModel> iatiTransactionImportService,

```diff
+            }
+        }
+
+        protected virtual bool IsExcelDateTimeFormat(DocumentFormat.OpenXml.UInt32Value numberFormatId)
+        {
+            return (14 <= numberFormatId && numberFormatId <= 22) || numberFormatId == 30 || numberFormatId == 34 ||
+                (45 <= numberFormatId && numberFormatId <= 47) || (51 <= numberFormatId && numberFormatId <= 53) ||
+                 numberFormatId == 55 || numberFormatId == 56 || numberFormatId == 58 ||
+                (164 <= numberFormatId && numberFormatId <= 187);
+        }
+
+        public IATITransactionImportExcelService(IIATITransactionImportService<TModel> iatiTransactionImportService,
```


## File: `ngo-api-core/NGO/NGO.Core.Services/IATITransactionImportService.cs`
### Class: `(global)`
- **using · DocumentFormat.OpenXml.Spreadsheet** — _using_
  
  Thay đổi using: +using DocumentFormat.OpenXml.Spreadsheet;

```diff
+using DocumentFormat.OpenXml.Spreadsheet;
```
- **using · Microsoft.AspNetCore.Http** — _using_
  
  Thay đổi using: +using Microsoft.AspNetCore.Http;

```diff
+using Microsoft.AspNetCore.Http;
```
- **using · Microsoft.Extensions.Logging** — _using_
  
  Thay đổi using: +using Microsoft.Extensions.Logging;

```diff
+using Microsoft.Extensions.Logging;
```
- **using · Newtonsoft.Json** — _using_
  
  Thay đổi using: +using Newtonsoft.Json;

```diff
+using Newtonsoft.Json;
```
- **using · NGO.Core.Common.Constants** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Constants;

```diff
+using NGO.Core.Common.Constants;
```
- **using · NGO.Core.Common.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Extensions;

```diff
+using NGO.Core.Common.Extensions;
```
- **using · NGO.Core.Common.Utilities** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Utilities;

```diff
+using NGO.Core.Common.Utilities;
```
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```
- **using · NGO.Core.Repositories** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories;

```diff
+using NGO.Core.Repositories;
```
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.IO** — _using_
  
  Thay đổi using: +using System.IO;

```diff
+using System.IO;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: +using System.Threading.Tasks;

```diff
+using System.Threading.Tasks;
```
- **using · NGO.Core.Services.ExportExcelService** — _using_
  
  Thay đổi using: +using NGO.Core.Services.ExportExcelService;

```diff
+using NGO.Core.Services.ExportExcelService;
```
- **using · System.Globalization** — _using_
  
  Thay đổi using: +using System.Globalization;

```diff
+using System.Globalization;
```
- **using · DocumentFormat.OpenXml.Extensions** — _using_
  
  Thay đổi using: +using DocumentFormat.OpenXml.Extensions;

```diff
+using DocumentFormat.OpenXml.Extensions;
```

### Class: `IATITransactionImportService<T>`
- **class · IATITransactionImportService<T>** — _class:generic-change_
  
  Thay đổi khai báo class: class IATITransactionImportService<T>

```diff
+    public class IATITransactionImportService<T> : BaseService, IIATITransactionImportService<T>
```
- **field · _repository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IIATITransactionImportRepository<T> _repository;

```diff
+        protected readonly IIATITransactionImportRepository<T> _repository;
```
- **field · _uowFactory** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IUnityOfWorkFactory _uowFactory;

```diff
+        protected readonly IUnityOfWorkFactory _uowFactory;
```
- **field · _configurationService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IConfigurationService<EntityDefinition, TabDefinition> _configurationService;

```diff
+        protected readonly IConfigurationService<EntityDefinition, TabDefinition> _configurationService;
```
- **field · _resourceStringService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IResourceStringService _resourceStringService;

```diff
+        protected readonly IResourceStringService _resourceStringService;
```
- **field · _fieldRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IFieldDefinitionRepository<FieldConfiguration> _fieldRepository;

```diff
+        protected readonly IFieldDefinitionRepository<FieldConfiguration> _fieldRepository;
```
- **constructor · IATITransactionImportService** — _logic-change_
  
  +        public IATITransactionImportService(

```diff
+    public class IATITransactionImportService<T> : BaseService, IIATITransactionImportService<T>
+        where T : Model.IATITransactionImport
+    {
+        protected readonly IIATITransactionImportRepository<T> _repository;
+        protected readonly IUnityOfWorkFactory _uowFactory;
+        protected readonly IConfigurationService<EntityDefinition, TabDefinition> _configurationService;
+        protected ILogger<IATITransactionImportService<T>> _logger;
+        protected readonly IResourceStringService _resourceStringService;
+        protected readonly IFieldDefinitionRepository<FieldConfiguration> _fieldRepository;
+        protected ExportExcelService<ExcelTableToExportObject> _exportService;
+
+        public IATITransactionImportService(
```


## File: `ngo-api-core/NGO/NGO.Core.Services/IATITransactionService.cs`
### Class: `(global)`
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: +using System.Threading.Tasks;

```diff
+using System.Threading.Tasks;
```

### Class: `IATITransactionService<T>`
- **constructor · IATITransactionService** — _logic-change_
  
  public IATITransactionService(IIATITransactionRepository<T> repository,

```diff
         void RemoveIATITransaction(int id);
+        void AddBulkIATITransactions(List<T> iatiTransactions, User currentUser);
+        System.Threading.Tasks.Task RemoveIATITransactionsByImportId(int importId);
     }
 
     public class IATITransactionService<T> : BaseSubEntityService, IIATITransactionService<T> where T : IATITransaction
     {
         protected IIATITransactionRepository<T> _repository;
         protected readonly IUnityOfWorkFactory _uowFactory;
+        protected ILogger<IATITransactionService<T>> _logger;
 
         public IATITransactionService(IIATITransactionRepository<T> repository,
```


## File: `ngo-api-core/NGO/NGO.Core.Services/ImportExcelService/ExpenditureReportingImportedService.cs`
### Class: `(global)`
- **field · _exchangeRateService** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly IExchangeRateService<ExchangeRateObject> _exchangeRateService;

```diff
-        protected readonly IExchangeRateService<ExchangeRateObject> _exchangeRateService;
```
- **field · _exchangeRateService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IExchangeRateService<ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;

```diff
+        protected readonly IExchangeRateService<ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/ImportExcelService/PartnerExpenditureReportingImportExcelService.cs`
### Class: `(global)`
- **using · Microsoft.CodeAnalysis.CSharp.Syntax** — _using_
  
  Thay đổi using: -using Microsoft.CodeAnalysis.CSharp.Syntax;

```diff
-using Microsoft.CodeAnalysis.CSharp.Syntax;
```
- **field · _exchangeRateService** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly IExchangeRateService<ExchangeRateObject> _exchangeRateService;

```diff
-        protected readonly IExchangeRateService<ExchangeRateObject> _exchangeRateService;
```
- **field · _exchangeRateService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IExchangeRateService<ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;

```diff
+        protected readonly IExchangeRateService<ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;
```
- **method · GetActualsReport** — _—_
  
  -        protected MemoryStream GetActualsReport(PartnerExpenditure<Model.PartnerExpenditureReporting, Model.BudgetVersion> report

```diff
@@ -672,8 +671,10 @@ namespace NGO.Core.Services
             return _languageService.GetResourceStringByKey(sortByField, _langCode);
         }
 
-        protected MemoryStream GetActualsReport(PartnerExpenditure<Model.PartnerExpenditureReporting, Model.BudgetVersion> report
```
- **method · GetActualsReport** — _logic-change_
  
  +        protected MemoryStream GetActualsReport(PartnerExpenditure<Model.PartnerExpenditureReporting, Model.BudgetVersion> report,

```diff
@@ -672,8 +671,10 @@ namespace NGO.Core.Services
             return _languageService.GetResourceStringByKey(sortByField, _langCode);
         }
 
-        protected MemoryStream GetActualsReport(PartnerExpenditure<Model.PartnerExpenditureReporting, Model.BudgetVersion> report
-            , ListParameter parameters, List<Model.PartnerExpenditureReporting> allConfirmedReports, Entity entity)
+        protected MemoryStream GetActualsReport(PartnerExpenditure<Model.PartnerExpenditureReporting, Model.BudgetVersion> report, 
```


## File: `ngo-api-core/NGO/NGO.Core.Services/IncomingFundingExportExcelService.cs`
### Class: `(global)`
- **field · _exchangeRateService** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly IExchangeRateService<ExchangeRateObject> _exchangeRateService;

```diff
-        protected readonly IExchangeRateService<ExchangeRateObject> _exchangeRateService;
```
- **field · _exchangeRateService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IExchangeRateService<ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;

```diff
+        protected readonly IExchangeRateService<ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/Logframe2ExportExcelService.cs`
### Class: `(global)`
- **using · NGO.Core.Common.Constants** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Constants;

```diff
+using NGO.Core.Common.Constants;
```
- **using · NGO.Core.Repositories** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories;

```diff
+using NGO.Core.Repositories;
```

### Class: `Logframe2ExportExcelService<TVersion, TObjective, TReporting, TVersionDto, TReportingDto>`
- **field · _configurationRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IConfigurationRepository _configurationRepository;

```diff
+        protected readonly IConfigurationRepository _configurationRepository;
```
- **method · IsRollupIndicatorOnly** — _logic-change_
  
  +        protected bool IsRollupIndicatorOnly(Entity entity)

```diff
+            var closedIndicatorIncluded = false;
+            (levelIds, closedIndicatorIncluded) = _logframeService.GetFilterValue(parameter);
+
+            Model.Dto.Logframe<TVersion, TReporting> logframe = new Model.Dto.Logframe<TVersion, TReporting>();
+            List<int> entityIds = _logframeService.GetCurrentAndRelatedEntityIds(entity, tabDefinitionId, tabFunctionId);
+
+            logframe = _logframeService.GetRollUpLogframes(entityIds, entity, parameter, breakdownIncluded: true, isExporting: true, levelIds: levelIds, closedIndicatorIncluded: closedIndicatorIncluded);
+            result.Version = GetExportVersion(entity, logframe.LogframeVersion, parameter);
+            result.Reportings = logframe.Reports?.Select(r => _reportingMapper.ToDto(r)).ToList();
+        }
+
+        protected bool IsRollupIndicatorOnly(Entity entity)
```


## File: `ngo-api-core/NGO/NGO.Core.Services/Logframe2Service.cs`
### Class: `Logframe2Service<TVersion, TObjective, TReporting>`
- **field · _securityService** — _field:+/-_
  
  Thay đổi field readonly: -        private readonly ISecurityService _securityService;

```diff
-        private readonly ISecurityService _securityService;
```
- **field · _securityService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ISecurityService _securityService;

```diff
+        protected readonly ISecurityService _securityService;
```
- **method · IsIndicatorIncludedRollup** — _—_
  
  -        protected bool IsIndicatorIncludedRollup(Model.Dto.GenericItem objectiveConfig, Model.Dto.GenericItem indicatorConfig)

```diff
@@ -4496,7 +4598,7 @@ namespace NGO.Core.Services
             }
         }
 
-        protected bool IsIndicatorIncludedRollup(Model.Dto.GenericItem objectiveConfig, Model.Dto.GenericItem indicatorConfig)
```
- **method · IsRollupIndicatorOnly** — _—_
  
  +        public bool IsRollupIndicatorOnly(Model.Dto.GenericItem objectiveConfig, Model.Dto.GenericItem indicatorConfig)

```diff
@@ -4496,7 +4598,7 @@ namespace NGO.Core.Services
             }
         }
 
-        protected bool IsIndicatorIncludedRollup(Model.Dto.GenericItem objectiveConfig, Model.Dto.GenericItem indicatorConfig)
+        public bool IsRollupIndicatorOnly(Model.Dto.GenericItem objectiveConfig, Model.Dto.GenericItem indicatorConfig)
```
- **method · BindPeriodNameForIndicatorTarget** — _logic-change_
  
  +        public void BindPeriodNameForIndicatorTarget(LogframeVersion version, List<LogframeIndicator> lstIndicators, Entity entity)

```diff
+                }
+                result.Add(new Model.Dto.LogframeTargetPeriodAvailable
+                {
+                    FrequencyId = frequency.Id,
+                    TargetPeriod = dummyVersion.TargetPeriods,
+                });
+            }
+
+            return result;
+        }
+
+        public void BindPeriodNameForIndicatorTarget(LogframeVersion version, List<LogframeIndicator> lstIndicators, Entity entity)
```
- **method · GetVersionLabel** — _logic-change_
  
  +        public string GetVersionLabel(TVersion version, int localeId)

```diff
+                            }
+                            else
+                            {
+                                indicatorActual.PeriodName = cloneReport.Name;
+                            }
+                        }
+                    }
+                }
+            }
+        }
+
+        public string GetVersionLabel(TVersion version, int localeId)
```


## File: `ngo-api-core/NGO/NGO.Core.Services/LogframeService.cs`
### Class: `LogframeService<TVersion, TObjective, TReporting>`
- **method · GetVersionLabel** — _logic-change_
  
  +        public string GetVersionLabel(TVersion version, int localeId)

```diff
@@ -3992,5 +3996,62 @@ namespace NGO.Core.Services
 
             return periods;
         }
+
+        public string GetVersionLabel(TVersion version, int localeId)
```


## File: `ngo-api-core/NGO/NGO.Core.Services/LookupDataService.cs`
### Class: `(global)`
- **using · NGO.Core.Common.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Extensions;

```diff
+using NGO.Core.Common.Extensions;
```
- **field · minimumRequirementRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IMinimumRequirementRepository<MinimumRequirement> minimumRequirementRepository;

```diff
+        protected readonly IMinimumRequirementRepository<MinimumRequirement> minimumRequirementRepository;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/MetadataDocumentInjection/BaseDocumentInjectionService.cs`
### Class: `(global)`
- **method · CalculateColumnPercents** — _logic-change_
  
  +        protected List<double> CalculateColumnPercents(List<Model.Dto.FieldConfiguration> fields)

```diff
+            var tables = builder.CurrentSection.Body.Tables;
+            int tableIdx = tables.Count - 1;
+            int rowIdx = tables[tableIdx].Rows.Count - 1;
+            builder.MoveToCell(tableIdx, rowIdx, 0, 0);
+            foreach (var childTable in children)
+            {
+                AddTableToDocument(childTable, builder, ignoreTypes, true);
+            }
+            builder.EndRow();
+        }
+
+        protected List<double> CalculateColumnPercents(List<Model.Dto.FieldConfiguration> fields)
```


## File: `ngo-api-core/NGO/NGO.Core.Services/MetadataDocumentInjection/ExtractInjectedMetadataService.cs`
### Class: `(global)`
- **using · Newtonsoft.Json** — _using_
  
  Thay đổi using: +using Newtonsoft.Json;

```diff
+using Newtonsoft.Json;
```
- **using · NGO.Core.Common.Constants** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Constants;

```diff
+using NGO.Core.Common.Constants;
```
- **using · System.Data** — _using_
  
  Thay đổi using: +using System.Data;

```diff
+using System.Data;
```
- **using · System.Text.RegularExpressions** — _using_
  
  Thay đổi using: -using System.Text.RegularExpressions;

```diff
-using System.Text.RegularExpressions;
```
- **using · System.Threading** — _using_
  
  Thay đổi using: -using System.Threading;

```diff
-using System.Threading;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/MinimumRequirementExportExcelService.cs`
### Class: `(global)`
- **using · NGO.Core.Common.Constants** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Constants;

```diff
+using NGO.Core.Common.Constants;
```
- **using · NGO.Core.Common.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Extensions;

```diff
+using NGO.Core.Common.Extensions;
```
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · NGO.Core.Model.Attributes** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Attributes;

```diff
+using NGO.Core.Model.Attributes;
```
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```
- **using · NGO.Core.Repositories** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories;

```diff
+using NGO.Core.Repositories;
```
- **using · NGO.Core.Services.Utilities** — _using_
  
  Thay đổi using: +using NGO.Core.Services.Utilities;

```diff
+using NGO.Core.Services.Utilities;
```
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Dynamic** — _using_
  
  Thay đổi using: +using System.Dynamic;

```diff
+using System.Dynamic;
```
- **using · System.Globalization** — _using_
  
  Thay đổi using: +using System.Globalization;

```diff
+using System.Globalization;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · System.Security.AccessControl** — _using_
  
  Thay đổi using: +using System.Security.AccessControl;

```diff
+using System.Security.AccessControl;
```

### Class: `MinimumRequirementExportExcelService<T, TStatus>`
- **class · MinimumRequirementExportExcelService<T, TStatus>** — _class:generic-change_
  
  Thay đổi khai báo class: class MinimumRequirementExportExcelService<T, TStatus>

```diff
+    public class MinimumRequirementExportExcelService<T, TStatus> : IMinimumRequirementExportExcelService
```
- **field · _service** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IMinimumRequirementService<T> _service;

```diff
+        protected readonly IMinimumRequirementService<T> _service;
```
- **field · _tabRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ITabDefinitionRepository<TabDefinition> _tabRepository;

```diff
+        protected readonly ITabDefinitionRepository<TabDefinition> _tabRepository;
```
- **field · _resourceStringRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IResourceStringRepository _resourceStringRepository;

```diff
+        protected readonly IResourceStringRepository _resourceStringRepository;
```
- **field · _configurationRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IConfigurationRepository _configurationRepository;

```diff
+        protected readonly IConfigurationRepository _configurationRepository;
```
- **constructor · MinimumRequirementExportExcelService** — _logic-change_
  
  +        public MinimumRequirementExportExcelService(

```diff
+        protected readonly IMinimumRequirementService<T> _service;
+        protected readonly ITabDefinitionRepository<TabDefinition> _tabRepository;
+        protected readonly IResourceStringRepository _resourceStringRepository;
+        protected readonly IConfigurationRepository _configurationRepository;
+
+        protected Dictionary<string, string> ResourceStrings = null;
+        protected string isAmountProp = "IsAmount";
+        protected List<FieldConfiguration> ConfigFields;
+        protected List<FieldConfiguration> AmountFields;
+        protected int LocaleId = CultureConfig.Eng_LCID;
+
+        public MinimumRequirementExportExcelService(
```


## File: `ngo-api-core/NGO/NGO.Core.Services/MinimumRequirementService.cs`
### Class: `(global)`
- **using · Newtonsoft.Json** — _using_
  
  Thay đổi using: +using Newtonsoft.Json;

```diff
+using Newtonsoft.Json;
```
- **using · NGO.Core.Common.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Extensions;

```diff
+using NGO.Core.Common.Extensions;
```
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · NGO.Core.Model.Attributes** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Attributes;

```diff
+using NGO.Core.Model.Attributes;
```
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```
- **using · NGO.Core.Model.Mapping** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Mapping;

```diff
+using NGO.Core.Model.Mapping;
```
- **using · NGO.Core.Repositories** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories;

```diff
+using NGO.Core.Repositories;
```
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```

### Class: `MinimumRequirementService<T>`
- **class · MinimumRequirementService<T>** — _class:generic-change_
  
  Thay đổi khai báo class: class MinimumRequirementService<T>

```diff
+    public class MinimumRequirementService<T> : IMinimumRequirementService<T>
```
- **field · _repository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IMinimumRequirementRepository<T> _repository;

```diff
+        protected readonly IMinimumRequirementRepository<T> _repository;
```
- **field · _uowFactory** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IUnityOfWorkFactory _uowFactory;

```diff
+        protected readonly IUnityOfWorkFactory _uowFactory;
```
- **field · _tabRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ITabDefinitionRepository<TabDefinition> _tabRepository;

```diff
+        protected readonly ITabDefinitionRepository<TabDefinition> _tabRepository;
```
- **field · _entityRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IEntityRepository<Model.Entity> _entityRepository;

```diff
+        protected readonly IEntityRepository<Model.Entity> _entityRepository;
```
- **field · _workflowRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IWorkflowRepository<Workflow> _workflowRepository;

```diff
+        protected readonly IWorkflowRepository<Workflow> _workflowRepository;
```
- **field · _projectRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IProjectRepository<Project, Entity, Model.Dto.Project> _projectRepository;

```diff
+        protected readonly IProjectRepository<Project, Entity, Model.Dto.Project> _projectRepository;
```
- **field · _orgUnitRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IOrgUnitRepository<OrgUnit, Entity, Model.Dto.OrgUnit> _orgUnitRepository;

```diff
+        protected readonly IOrgUnitRepository<OrgUnit, Entity, Model.Dto.OrgUnit> _orgUnitRepository;
```
- **field · _stakeHolderRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IStakeholderRepository<Stakeholder, Entity, Model.Dto.Stakeholder> _stakeHolderRepository;

```diff
+        protected readonly IStakeholderRepository<Stakeholder, Entity, Model.Dto.Stakeholder> _stakeHolderRepository;
```
- **field · _programRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IProgramRepository<Program, Entity, Model.Dto.Program> _programRepository;

```diff
+        protected readonly IProgramRepository<Program, Entity, Model.Dto.Program> _programRepository;
```
- **field · _ideaRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IIdeaRepository<Idea, Entity, Model.Dto.Idea> _ideaRepository;

```diff
+        protected readonly IIdeaRepository<Idea, Entity, Model.Dto.Idea> _ideaRepository;
```
- **field · _fundingRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IFundingRepository<Funding, Entity, Model.Dto.Funding> _fundingRepository;

```diff
+        protected readonly IFundingRepository<Funding, Entity, Model.Dto.Funding> _fundingRepository;
```
- **field · _geographyRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IGeographyRepository<Geography, Entity, Model.Dto.Geography> _geographyRepository;

```diff
+        protected readonly IGeographyRepository<Geography, Entity, Model.Dto.Geography> _geographyRepository;
```
- **field · _emergencyRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IEmergencyRepository<Emergency, Entity, Model.Dto.Emergency> _emergencyRepository;

```diff
+        protected readonly IEmergencyRepository<Emergency, Entity, Model.Dto.Emergency> _emergencyRepository;
```
- **field · _strategyRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IStrategyRepository<Strategy, Entity, Model.Dto.Strategy> _strategyRepository;

```diff
+        protected readonly IStrategyRepository<Strategy, Entity, Model.Dto.Strategy> _strategyRepository;
```
- **field · _nonProjectRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly INonProjectRepository<NonProject, Entity, Model.Dto.NonProject> _nonProjectRepository;

```diff
+        protected readonly INonProjectRepository<NonProject, Entity, Model.Dto.NonProject> _nonProjectRepository;
```
- **field · _fundingIdeaRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IFundingIdeaRepository<FundingIdea, Entity, Model.Dto.FundingIdea> _fundingIdeaRepository;

```diff
+        protected readonly IFundingIdeaRepository<FundingIdea, Entity, Model.Dto.FundingIdea> _fundingIdeaRepository;
```
- **field · _taskService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly Lazy<ITaskService<Task>> _taskService;

```diff
+        protected readonly Lazy<ITaskService<Task>> _taskService;
```
- **field · _taskMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<Model.Dto.Task, Task> _taskMapper;

```diff
+        protected readonly IDtoMapper<Model.Dto.Task, Task> _taskMapper;
```
- **field · _projectMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<Model.Dto.Project, Project> _projectMapper;

```diff
+        protected readonly IDtoMapper<Model.Dto.Project, Project> _projectMapper;
```
- **field · _orgUnitMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<Model.Dto.OrgUnit, OrgUnit> _orgUnitMapper;

```diff
+        protected readonly IDtoMapper<Model.Dto.OrgUnit, OrgUnit> _orgUnitMapper;
```
- **field · _stakeHolderMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<Model.Dto.Stakeholder, Stakeholder> _stakeHolderMapper;

```diff
+        protected readonly IDtoMapper<Model.Dto.Stakeholder, Stakeholder> _stakeHolderMapper;
```
- **field · _programMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<Model.Dto.Program, Program> _programMapper;

```diff
+        protected readonly IDtoMapper<Model.Dto.Program, Program> _programMapper;
```
- **field · _ideaMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<Model.Dto.Idea, Idea> _ideaMapper;

```diff
+        protected readonly IDtoMapper<Model.Dto.Idea, Idea> _ideaMapper;
```
- **field · _fundingMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<Model.Dto.Funding, Funding> _fundingMapper;

```diff
+        protected readonly IDtoMapper<Model.Dto.Funding, Funding> _fundingMapper;
```
- **field · _geographyMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<Model.Dto.Geography, Geography> _geographyMapper;

```diff
+        protected readonly IDtoMapper<Model.Dto.Geography, Geography> _geographyMapper;
```
- **field · _emergencyMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<Model.Dto.Emergency, Emergency> _emergencyMapper;

```diff
+        protected readonly IDtoMapper<Model.Dto.Emergency, Emergency> _emergencyMapper;
```
- **field · _strategyMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<Model.Dto.Strategy, Strategy> _strategyMapper;

```diff
+        protected readonly IDtoMapper<Model.Dto.Strategy, Strategy> _strategyMapper;
```
- **field · _nonProjectMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<Model.Dto.NonProject, NonProject> _nonProjectMapper;

```diff
+        protected readonly IDtoMapper<Model.Dto.NonProject, NonProject> _nonProjectMapper;
```
- **field · _fundingIdeaMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<Model.Dto.FundingIdea, FundingIdea> _fundingIdeaMapper;

```diff
+        protected readonly IDtoMapper<Model.Dto.FundingIdea, FundingIdea> _fundingIdeaMapper;
```
- **constructor · MinimumRequirementService** — _logic-change_
  
  +        public MinimumRequirementService(IMinimumRequirementRepository<T> repository,

```diff
+        protected readonly IDtoMapper<Model.Dto.OrgUnit, OrgUnit> _orgUnitMapper;
+        protected readonly IDtoMapper<Model.Dto.Stakeholder, Stakeholder> _stakeHolderMapper;
+        protected readonly IDtoMapper<Model.Dto.Program, Program> _programMapper;
+        protected readonly IDtoMapper<Model.Dto.Idea, Idea> _ideaMapper;
+        protected readonly IDtoMapper<Model.Dto.Funding, Funding> _fundingMapper;
+        protected readonly IDtoMapper<Model.Dto.Geography, Geography> _geographyMapper;
+        protected readonly IDtoMapper<Model.Dto.Emergency, Emergency> _emergencyMapper;
+        protected readonly IDtoMapper<Model.Dto.Strategy, Strategy> _strategyMapper;
+        protected readonly IDtoMapper<Model.Dto.NonProject, NonProject> _nonProjectMapper;
+        protected readonly IDtoMapper<Model.Dto.FundingIdea, FundingIdea> _fundingIdeaMapper;
+
+        public MinimumRequirementService(IMinimumRequirementRepository<T> repository,
```


## File: `ngo-api-core/NGO/NGO.Core.Services/NonProjectService.cs`
### Class: `(global)`
- **using · Microsoft.Extensions.Configuration** — _using_
  
  Thay đổi using: +using Microsoft.Extensions.Configuration;

```diff
+using Microsoft.Extensions.Configuration;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/OutlookAddinService.cs`
### Class: `(global)`
- **using · Microsoft.Graph** — _using_
  
  Thay đổi using: +using Microsoft.Graph;

```diff
+using Microsoft.Graph;
```
- **using · NGO.Core.Common** — _using_
  
  Thay đổi using: +using NGO.Core.Common;

```diff
+using NGO.Core.Common;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: +using System.Threading.Tasks;

```diff
+using System.Threading.Tasks;
```

### Class: `OutlookAddinService<T>`
- **field · _graphContextProvider** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IGraphContextProvider _graphContextProvider;

```diff
+        protected readonly IGraphContextProvider _graphContextProvider;
```
- **constructor · OutlookAddinService** — _constructor:param-change_
  
  -        public OutlookAddinService(ISPDocumentService<Model.Dto.SPListItem> spDocumentService)

```diff
@@ -15,65 +18,77 @@ namespace NGO.Core.Services
     public class OutlookAddinService<T> : IOutlookAddinService<T> where T : Model.Dto.OutlookAddinRequest, new()
     {
         protected readonly ISPDocumentService<Model.Dto.SPListItem> _spDocumentService;
+        protected readonly IGraphContextProvider _graphContextProvider;
 
-        public OutlookAddinService(ISPDocumentService<Model.Dto.SPListItem> spDocumentService)
```
- **constructor · OutlookAddinService** — _constructor:param-change_
  
  +        public OutlookAddinService(ISPDocumentService<Model.Dto.SPListItem> spDocumentService, IGraphContextProvider graphContextProvider)

```diff
@@ -15,65 +18,77 @@ namespace NGO.Core.Services
     public class OutlookAddinService<T> : IOutlookAddinService<T> where T : Model.Dto.OutlookAddinRequest, new()
     {
         protected readonly ISPDocumentService<Model.Dto.SPListItem> _spDocumentService;
+        protected readonly IGraphContextProvider _graphContextProvider;
 
-        public OutlookAddinService(ISPDocumentService<Model.Dto.SPListItem> spDocumentService)
+        public OutlookAddinService(ISPDocumentService<Model.Dto.SPListItem> spDocumentService, IGraphContextProvider graphContextProvider)
```


## File: `ngo-api-core/NGO/NGO.Core.Services/OverallEntityStatusService.cs`
### Class: `(global)`
- **using · NGO.Core.Services.Utilities** — _using_
  
  Thay đổi using: +using NGO.Core.Services.Utilities;

```diff
+using NGO.Core.Services.Utilities;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/PageImportExcelService.cs`
### Class: `(global)`
- **using · NGO.Core.Common.Extensions** — _using_
  
  Thay đổi using: -using NGO.Core.Common.Extensions;

```diff
-using NGO.Core.Common.Extensions;
```
- **using · Microsoft.AspNetCore.Http** — _using_
  
  Thay đổi using: +using Microsoft.AspNetCore.Http;

```diff
+using Microsoft.AspNetCore.Http;
```
- **using · Microsoft.Extensions.Logging** — _using_
  
  Thay đổi using: +using Microsoft.Extensions.Logging;

```diff
+using Microsoft.Extensions.Logging;
```
- **using · Newtonsoft.Json** — _using_
  
  Thay đổi using: +using Newtonsoft.Json;

```diff
+using Newtonsoft.Json;
```
- **using · NGO.Core.Common.DI** — _using_
  
  Thay đổi using: +using NGO.Core.Common.DI;

```diff
+using NGO.Core.Common.DI;
```
- **using · NGO.Core.Common.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Extensions;

```diff
+using NGO.Core.Common.Extensions;
```
- **using · NGO.Core.Common.Queue** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Queue;

```diff
+using NGO.Core.Common.Queue;
```
- **using · NGO.Core.Common.Utilities** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Utilities;

```diff
+using NGO.Core.Common.Utilities;
```
- **using · NGO.Core.Model.Dto.Parameters** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Dto.Parameters;

```diff
+using NGO.Core.Model.Dto.Parameters;
```
- **using · NGO.Core.Model.Mapping** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Mapping;

```diff
+using NGO.Core.Model.Mapping;
```
- **using · NGO.Core.Repositories.Mapping.OptionsMapper** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.Mapping.OptionsMapper;

```diff
+using NGO.Core.Repositories.Mapping.OptionsMapper;
```
- **using · NGO.Core.Services.ExportExcelService** — _using_
  
  Thay đổi using: +using NGO.Core.Services.ExportExcelService;

```diff
+using NGO.Core.Services.ExportExcelService;
```
- **using · System.Globalization** — _using_
  
  Thay đổi using: +using System.Globalization;

```diff
+using System.Globalization;
```
- **using · Microsoft.AspNetCore.Http** — _using_
  
  Thay đổi using: -using Microsoft.AspNetCore.Http;

```diff
-using Microsoft.AspNetCore.Http;
```
- **using · NGO.Core.Common.Utilities** — _using_
  
  Thay đổi using: -using NGO.Core.Common.Utilities;

```diff
-using NGO.Core.Common.Utilities;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: -using System.Threading.Tasks;

```diff
-using System.Threading.Tasks;
```
- **using · System.Globalization** — _using_
  
  Thay đổi using: -using System.Globalization;

```diff
-using System.Globalization;
```
- **using · Microsoft.IdentityModel.Tokens** — _using_
  
  Thay đổi using: -using Microsoft.IdentityModel.Tokens;

```diff
-using Microsoft.IdentityModel.Tokens;
```
- **using · NGO.Core.Services.ExportExcelService** — _using_
  
  Thay đổi using: -using NGO.Core.Services.ExportExcelService;

```diff
-using NGO.Core.Services.ExportExcelService;
```
- **using · NGO.Core.Common.Queue** — _using_
  
  Thay đổi using: -using NGO.Core.Common.Queue;

```diff
-using NGO.Core.Common.Queue;
```
- **using · NGO.Core.Model.Mapping** — _using_
  
  Thay đổi using: -using NGO.Core.Model.Mapping;

```diff
-using NGO.Core.Model.Mapping;
```
- **using · Newtonsoft.Json** — _using_
  
  Thay đổi using: -using Newtonsoft.Json;

```diff
-using Newtonsoft.Json;
```
- **using · NGO.Core.Model.Dto.Parameters** — _using_
  
  Thay đổi using: -using NGO.Core.Model.Dto.Parameters;

```diff
-using NGO.Core.Model.Dto.Parameters;
```
- **using · NGO.Core.Repositories.Mapping.OptionsMapper** — _using_
  
  Thay đổi using: -using NGO.Core.Repositories.Mapping.OptionsMapper;

```diff
-using NGO.Core.Repositories.Mapping.OptionsMapper;
```
- **using · NGO.Core.Common.DI** — _using_
  
  Thay đổi using: -using NGO.Core.Common.DI;

```diff
-using NGO.Core.Common.DI;
```
- **using · Microsoft.Extensions.Logging** — _using_
  
  Thay đổi using: -using Microsoft.Extensions.Logging;

```diff
-using Microsoft.Extensions.Logging;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: +using System.Threading.Tasks;

```diff
+using System.Threading.Tasks;
```
- **field · _sequenceNumberService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ISequenceNumberService _sequenceNumberService;

```diff
+        protected readonly ISequenceNumberService _sequenceNumberService;
```
- **field · _entityService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IEntityService<Entity> _entityService;

```diff
+        protected readonly IEntityService<Entity> _entityService;
```
- **field · _taskService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ITaskService<Model.Task> _taskService;

```diff
+        protected readonly ITaskService<Model.Task> _taskService;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/PageImportService.cs`
### Class: `(global)`
- **using · NGO.Core.Repositories** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories;

```diff
+using NGO.Core.Repositories;
```
- **using · System.Security.AccessControl** — _using_
  
  Thay đổi using: +using System.Security.AccessControl;

```diff
+using System.Security.AccessControl;
```
- **field · _serviceProvider** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IServiceProvider _serviceProvider;

```diff
+        protected readonly IServiceProvider _serviceProvider;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/PartnerExpenditureReportingExportExcelService.cs`
### Class: `PartnerExpenditureReportingExportExcelService<T, B, BDto>`
- **class · PartnerExpenditureReportingExportExcelService<T, B, BDto>** — _class:generic-change_
  
  Thay đổi khai báo class: class PartnerExpenditureReportingExportExcelService<T, B, BDto>

```diff
-    public class PartnerExpenditureReportingExportExcelService<T, B, BDto> : IPartnerExpenditureReportingExportExcelService<T, B> 
```
- **class · PartnerExpenditureReportingExportExcelService<T, B, BDto>** — _class:generic-change_
  
  Thay đổi khai báo class: class PartnerExpenditureReportingExportExcelService<T, B, BDto>

```diff
+    public class PartnerExpenditureReportingExportExcelService<T, B, BDto> : IPartnerExpenditureReportingExportExcelService<T, B>
```
- **field · _exchangeRateService** — _field:+/-_
  
  Thay đổi field readonly: -        protected readonly IExchangeRateService<Model.ExchangeRateObject> _exchangeRateService;

```diff
-        protected readonly IExchangeRateService<Model.ExchangeRateObject> _exchangeRateService;
```
- **field · _exchangeRateService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IExchangeRateService<Model.ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;

```diff
+        protected readonly IExchangeRateService<Model.ExchangeRateObject, Model.Dto.ExchangeRateObject> _exchangeRateService;
```
- **constructor · PartnerExpenditureReportingExportExcelService** — _—_
  
  public PartnerExpenditureReportingExportExcelService(IPartnerExpenditureReportingService<T, B> partnerExpenditureReportingService,

```diff
@@ -100,12 +102,12 @@ namespace NGO.Core.Services
         protected int LocalId;
         protected PeriodGenericItem SelectedPeriod;
         protected List<PartnerExpenditureActual> ListActualRows;
-        protected Model.Dto.Parameters.CustomExchangeRatePeriod _customExchangeRatePeriod;  
+        protected Model.Dto.Parameters.CustomExchangeRatePeriod _customExchangeRatePeriod;
 
         public PartnerExpenditureReportingExportExcelService(IPartnerExpenditureReportingService<T, B> partnerExpenditureReportingService,
```


## File: `ngo-api-core/NGO/NGO.Core.Services/PartnerExpenditureReportingService.cs`
### Class: `(global)`
- **method · GetPartnerExpenditureById** — _—_
  
  public T GetPartnerExpenditureById(int id)

```diff
@@ -892,7 +911,7 @@ namespace NGO.Core.Services
 
         public T GetPartnerExpenditureById(int id)
```
- **method · UpdatePartnerExpenditureProperties** — _logic-change_
  
  public void UpdatePartnerExpenditureProperties(T domObject)

```diff
@@ -892,7 +911,7 @@ namespace NGO.Core.Services
 
         public T GetPartnerExpenditureById(int id)
         {
-            return _repository.GetById(id);
+            return _repository.GetById(id, isCheckingOverwriteData: false);
         }
 
         public void UpdatePartnerExpenditureProperties(T domObject)
```


## File: `ngo-api-core/NGO/NGO.Core.Services/PaymentService.cs`
### Class: `(global)`
- **using · Newtonsoft.Json** — _using_
  
  Thay đổi using: +using Newtonsoft.Json;

```diff
+using Newtonsoft.Json;
```
- **using · NGO.Core.Common.Utilities** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Utilities;

```diff
+using NGO.Core.Common.Utilities;
```
- **using · System.Globalization** — _using_
  
  Thay đổi using: +using System.Globalization;

```diff
+using System.Globalization;
```
- **using · System.Threading** — _using_
  
  Thay đổi using: +using System.Threading;

```diff
+using System.Threading;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/ProgramService.cs`
### Class: `(global)`
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/ProjectService.cs`
### Class: `(global)`
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/ResourceStringService.cs`
### Class: `(global)`
- **using · NGO.Core.Model.Mapping** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Mapping;

```diff
+using NGO.Core.Model.Mapping;
```
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```

### Class: `ResourceStringService`
- **field · _resourceStringDtoMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IResourceStringDtoMapper<Model.Dto.Configuration.ResourceString, Model.ResourceString> _resourceStringDtoMapper;

```diff
+        protected readonly IResourceStringDtoMapper<Model.Dto.Configuration.ResourceString, Model.ResourceString> _resourceStringDtoMapper;
```
- **constructor · ResourceStringService** — _—_
  
  public ResourceStringService(IResourceStringRepository repository, IUnityOfWorkFactory uowFactory,

```diff
@@ -38,13 +40,18 @@ namespace NGO.Core.Services
         protected readonly IResourceStringRepository repository;
         protected readonly IUnityOfWorkFactory uowFactory;
         protected readonly IConfigurationRepository _configurationRepository;
+        protected readonly IResourceStringDtoMapper<Model.Dto.Configuration.ResourceString, Model.ResourceString> _resourceStringDtoMapper;
+        private readonly int _headerRowIndex = 2;
+        private readonly int _startRowIndex = 3;
 
         public ResourceStringService(IResourceStringRepository repository, IUnityOfWorkFactory uowFactory,
```
- **method · ImportDataFromExcelFile** — _—_
  
  -        public void ImportDataFromExcelFile(Stream fileStream, int languageId)

```diff
@@ -324,9 +284,10 @@ namespace NGO.Core.Services
             return repository.GetResourceStringsByLocaleId(localeId);
         }
 
-        public void ImportDataFromExcelFile(Stream fileStream, int languageId)
```
- **method · ImportDataFromExcelFile** — _—_
  
  +        public List<string> ImportDataFromExcelFile(Stream fileStream)

```diff
@@ -324,9 +284,10 @@ namespace NGO.Core.Services
             return repository.GetResourceStringsByLocaleId(localeId);
         }
 
-        public void ImportDataFromExcelFile(Stream fileStream, int languageId)
+        public List<string> ImportDataFromExcelFile(Stream fileStream)
```
- **method · BindResouceStringModel** — _logic-change_
  
  +        private void BindResouceStringModel(SharedStringTable sst, List<Model.GenericItem> allModules, Row row, List<Model.ResourceString> result, Dictionary<int, int> languageIndex, List<string> invalidFullKeys)

```diff
                     {
-                        repository.UpdateResourceStrings(resourceStrings);
+                        repository.UpdateResourceStrings(resourceStrings, invalidFullKeys: invalidFullKeys);
                     }
                     uow.Commit();
                 }
             }
+            return invalidFullKeys.Distinct().ToList();
         }
 
-        private static void BindResouceStringModel(SharedStringTable sst, List<Model.GenericItem> allModules, Row row, List<Model.ResourceString> result, int languageId)
+        private void BindResouceStringModel(SharedStringTable sst, List<Model.GenericItem> allModules, Row row, List<Model.ResourceString> result, Dictionary<int, int> languageIndex, List<string> invalidFullKeys)
```


## File: `ngo-api-core/NGO/NGO.Core.Services/SPBaseDocumentService.cs`
### Class: `(global)`
- **method · CheckIfAnyFileIsLocked** — _—_
  
  -        private void CheckIfAnyFileIsLocked(ClientContext ctx, List<string> lockedLogs, FileCollection files)

```diff
@@ -797,7 +798,7 @@ namespace NGO.Core.Services
             }
         }
 
-        private void CheckIfAnyFileIsLocked(ClientContext ctx, List<string> lockedLogs, FileCollection files)
```
- **method · CheckIfAnyFileIsLocked** — _—_
  
  +        protected void CheckIfAnyFileIsLocked(ClientContext ctx, List<string> lockedLogs, FileCollection files)

```diff
@@ -797,7 +798,7 @@ namespace NGO.Core.Services
             }
         }
 
-        private void CheckIfAnyFileIsLocked(ClientContext ctx, List<string> lockedLogs, FileCollection files)
+        protected void CheckIfAnyFileIsLocked(ClientContext ctx, List<string> lockedLogs, FileCollection files)
```
- **method · CheckIfFileIsLocked** — _—_
  
  -        private void CheckIfFileIsLocked(ClientContext ctx, List<string> lockedLogs, Microsoft.SharePoint.Client.File f)

```diff
@@ -805,7 +806,7 @@ namespace NGO.Core.Services
             });
         }
 
-        private void CheckIfFileIsLocked(ClientContext ctx, List<string> lockedLogs, Microsoft.SharePoint.Client.File f)
```
- **method · CheckIfFileIsLocked** — _—_
  
  +        protected void CheckIfFileIsLocked(ClientContext ctx, List<string> lockedLogs, Microsoft.SharePoint.Client.File f)

```diff
@@ -805,7 +806,7 @@ namespace NGO.Core.Services
             });
         }
 
-        private void CheckIfFileIsLocked(ClientContext ctx, List<string> lockedLogs, Microsoft.SharePoint.Client.File f)
+        protected void CheckIfFileIsLocked(ClientContext ctx, List<string> lockedLogs, Microsoft.SharePoint.Client.File f)
```


## File: `ngo-api-core/NGO/NGO.Core.Services/SPDocumentService.cs`
### Class: `(global)`
- **using · System.Web** — _using_
  
  Thay đổi using: +using System.Web;

```diff
+using System.Web;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/SPSecurityService.cs`
### Class: `(global)`
- **using · Newtonsoft.Json** — _using_
  
  Thay đổi using: +using Newtonsoft.Json;

```diff
+using Newtonsoft.Json;
```
- **using · Microsoft.SharePoint.Client.Utilities** — _using_
  
  Thay đổi using: +using Microsoft.SharePoint.Client.Utilities;

```diff
+using Microsoft.SharePoint.Client.Utilities;
```
- **using · NGO.Core.Repositories.DataModel** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.DataModel;

```diff
+using NGO.Core.Repositories.DataModel;
```

### Class: `SPSecurityService`
- **field · _siteBackupRepo** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ISitePermissionBackupRepository<Model.SitePermissionBackup, Model.RoleAssignmentBackup> _siteBackupRepo;

```diff
+        protected readonly ISitePermissionBackupRepository<Model.SitePermissionBackup, Model.RoleAssignmentBackup> _siteBackupRepo;
```
- **constructor · SPSecurityService** — _—_
  
  public SPSecurityService(ISharepointContextProvider ctxProvider,

```diff
@@ -40,6 +48,7 @@ namespace NGO.Core.Services
         protected readonly CoreAppSettings _coreAppSettings;
         protected readonly SPPermissionManagementQueue _queue;
         protected readonly ISPSiteRepository<Model.SPSite> _spSiteRepository;
+        protected readonly ISitePermissionBackupRepository<Model.SitePermissionBackup, Model.RoleAssignmentBackup> _siteBackupRepo;
 
         public SPSecurityService(ISharepointContextProvider ctxProvider,
```


## File: `ngo-api-core/NGO/NGO.Core.Services/SPSiteService.cs`
### Class: `(global)`
- **using · Microsoft.SharePoint.Client.Utilities** — _using_
  
  Thay đổi using: +using Microsoft.SharePoint.Client.Utilities;

```diff
+using Microsoft.SharePoint.Client.Utilities;
```
- **using · Newtonsoft.Json** — _using_
  
  Thay đổi using: +using Newtonsoft.Json;

```diff
+using Newtonsoft.Json;
```
- **using · NGO.Core.Repositories.DataModel** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.DataModel;

```diff
+using NGO.Core.Repositories.DataModel;
```
- **using · System.Linq.Dynamic.Core.Tokenizer** — _using_
  
  Thay đổi using: +using System.Linq.Dynamic.Core.Tokenizer;

```diff
+using System.Linq.Dynamic.Core.Tokenizer;
```

### Class: `SPSiteService`
- **field · _tokenReplacer** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly ITokenReplacerService _tokenReplacer;

```diff
+        protected readonly ITokenReplacerService _tokenReplacer;
```
- **constructor · SPSiteService** — _—_
  
  public SPSiteService(ISharepointContextProvider ctxProvider,

```diff
@@ -37,6 +42,7 @@ namespace NGO.Core.Services
         protected readonly IMemoryCacheRepository<Model.SPSite> _memoryCacheRepository;
         protected readonly CoreAppSettings _coreAppSettings;
         protected readonly SPPermissionManagementQueue _queue;
+        protected readonly ITokenReplacerService _tokenReplacer;
 
         public SPSiteService(ISharepointContextProvider ctxProvider,
```


## File: `ngo-api-core/NGO/NGO.Core.Services/StakeholderComplianceService.cs`
### Class: `(global)`
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · NGO.Core.Services.Utilities** — _using_
  
  Thay đổi using: +using NGO.Core.Services.Utilities;

```diff
+using NGO.Core.Services.Utilities;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/StakeholderService.cs`
### Class: `(global)`
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/StrategyService.cs`
### Class: `(global)`
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/SummaryService.cs`
### Class: `(global)`
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/TaskFlowService.cs`
### Class: `TaskFlowService<T, TTask, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, DtoFundingIdea, DtoIdea, DtoFunding, TBankAccount, TAgreement, TBudgetVersion, TPayment, TAllocation, TChange, TPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, TBeneficiary, TBeneficiaryReporting, TProjectLifeTotal, TLog>`
- **class · TaskFlowService<T, TTask, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, DtoFundingIdea, DtoIdea, DtoFunding, TBankAccount, TAgreement, TBudgetVersion, TPayment, TAllocation, TChange, TPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, TBeneficiary, TBeneficiaryReporting, TProjectLifeTotal, TLog>** — _class:generic-change_
  
  Thay đổi khai báo class: class TaskFlowService<T, TTask, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, DtoFundingIdea, DtoIdea, DtoFunding, TBankAccount, TAgreement, TBudgetVersion, TPayment, TAllocation, TChange, TPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, TBeneficiary, TBeneficiaryReporting, TProjectLifeTotal, TLog>

```diff
-    public class TaskFlowService<T, TTask, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, DtoFundingIdea, DtoIdea, DtoFunding, TBankAccount, TAgreement, TBudgetVersion, TPayment, TAllocation, TChange, TPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, TBeneficiary, TBeneficiaryReporting, TProjectLifeTotal, TLog> : 
```
- **class · TaskFlowService<T, TTask, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, DtoFundingIdea, DtoIdea, DtoFunding, TBankAccount, TAgreement, TBudgetVersion, TPayment, TAllocation, TChange, TPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, TBeneficiary, TBeneficiaryReporting, TProjectLifeTotal, TLog>** — _class:generic-change_
  
  Thay đổi khai báo class: class TaskFlowService<T, TTask, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, DtoFundingIdea, DtoIdea, DtoFunding, TBankAccount, TAgreement, TBudgetVersion, TPayment, TAllocation, TChange, TPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, TBeneficiary, TBeneficiaryReporting, TProjectLifeTotal, TLog>

```diff
+    public class TaskFlowService<T, TTask, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, DtoFundingIdea, DtoIdea, DtoFunding, TBankAccount, TAgreement, TBudgetVersion, TPayment, TAllocation, TChange, TPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, TBeneficiary, TBeneficiaryReporting, TProjectLifeTotal, TLog> :
```


## File: `ngo-api-core/NGO/NGO.Core.Services/TaskService.cs`
### Class: `(global)`
- **using · Microsoft.AspNetCore.Components.Forms** — _using_
  
  Thay đổi using: +using Microsoft.AspNetCore.Components.Forms;

```diff
+using Microsoft.AspNetCore.Components.Forms;
```
- **using · Microsoft.Extensions.Logging** — _using_
  
  Thay đổi using: +using Microsoft.Extensions.Logging;

```diff
+using Microsoft.Extensions.Logging;
```

### Class: `TaskService<T, TTaskFlow, TWorkFlow, FIdeaEntity, EEntity, FundingEntity, PIdeaEntity, ProjectEntity, DtoFundingIdea, DtoIdea, DtoFunding, TBankAccount, TAgreement, TBudgetVersion, TPayment, TAllocation, TChange, TPartnerExpenditureReporting, TLogframeVersion, TLogframeReporting, TFundingPlan, TBeneficiary, TBeneficiaryReporting, TProjectLifeTotal, TLog>`
- **field · _minimumRequirementRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IMinimumRequirementRepository<Model.MinimumRequirement> _minimumRequirementRepository;

```diff
+        protected readonly IMinimumRequirementRepository<Model.MinimumRequirement> _minimumRequirementRepository;
```
- **constructor · TaskService** — _logic-change_
  
  public TaskService(ITaskFlowService<TTaskFlow> taskFlowService,

```diff
@@ -127,7 +133,7 @@ namespace NGO.Core.Services
         protected readonly IConfigurationService<Model.EntityDefinition, Model.TabDefinition> _configService;
         protected readonly IIncomeScheduleRepository<IncomeSchedule> _incomeScheduleRepository;
         protected readonly ITabFunctionRepository<TabFunction> _tabFunctionRepository;
-
+        protected readonly IMinimumRequirementRepository<Model.MinimumRequirement> _minimumRequirementRepository;
 
         public TaskService(ITaskFlowService<TTaskFlow> taskFlowService,
```
- **method · IsTaskAvailable** — _—_
  
  -        public bool IsTaskAvailable(GenericItem taskSatus)

```diff
@@ -1318,10 +1369,47 @@ namespace NGO.Core.Services
             return _repository.GetTaskByRelateItem(relatedItemId, entityTypeId, tabDefinitionId, tabFunctionId);
         }
 
-        public bool IsTaskAvailable(GenericItem taskSatus)
```


## File: `ngo-api-core/NGO/NGO.Core.Services/TaskTemplateService.cs`
### Class: `(global)`
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/UserService.cs`
### Class: `UserService<T>`
- **method · GetMaximumUser** — _—_
  
  +        public int GetMaximumUser()

```diff
@@ -531,12 +541,42 @@ namespace NGO.Core.Services
             await _userRepository.CacheRestrictedUserEntitiesByEntity(entityId);
         }
 
-        protected virtual void ValidateMaximumUser(IEnumerable<User> listAllUser, IEnumerable<User> domainObjects)
+        public int GetMaximumUser()
```
- **method · GetUserByLoginNames** — _logic-change_
  
  +        public IEnumerable<T> GetUserByLoginNames(bool asReferences = false, params string[] loginNames)

```diff
             await _userRepository.CacheRestrictedUserEntitiesByEntity(entityId);
         }
 
-        protected virtual void ValidateMaximumUser(IEnumerable<User> listAllUser, IEnumerable<User> domainObjects)
+        public int GetMaximumUser()
         {
-            if(!_coreAppSettings.MaximumUsers.HasValue || _coreAppSettings.MaximumUsers.Value <= 0)
+            int? maximumUser = _coreAppSettings.MaximumUsers;
+            return maximumUser.HasValue ? maximumUser.Value : 0;
+        }
+
+        public IEnumerable<T> GetUserByLoginNames(bool asReferences = false, params string[] loginNames)
```
- **method · UpdateUserInformation** — _logic-change_
  
  +        public bool UpdateUserInformation(List<T> users, User currentUser)

```diff
         {
-            if(!_coreAppSettings.MaximumUsers.HasValue || _coreAppSettings.MaximumUsers.Value <= 0)
+            int? maximumUser = _coreAppSettings.MaximumUsers;
+            return maximumUser.HasValue ? maximumUser.Value : 0;
+        }
+
+        public IEnumerable<T> GetUserByLoginNames(bool asReferences = false, params string[] loginNames)
+        {
+            return _userRepository.GetUserByLoginNames(asReferences, loginNames);
+        }
+
+        public bool UpdateUserInformation(List<T> users, User currentUser)
```
- **method · GetUserByLoginNames** — _logic-change_
  
  -        public IEnumerable<T> GetUserByLoginNames(bool asReferences = false, params string[] loginNames)

```diff
@@ -563,20 +613,5 @@ namespace NGO.Core.Services
             return definition != null && user.Roles.Where(r => r.ParentId != (int)RoleType.EntityRole
               && definition.Roles.Any(rr => rr.Id == r.Id)).Count() > 0;
         }
-
-
-        public IEnumerable<T> GetUserByLoginNames(bool asReferences = false, params string[] loginNames)
```
- **method · UpdateUserInformation** — _logic-change_
  
  -        public bool UpdateUserInformation(List<T> users, User currentUser)

```diff
@@ -563,20 +613,5 @@ namespace NGO.Core.Services
             return definition != null && user.Roles.Where(r => r.ParentId != (int)RoleType.EntityRole
               && definition.Roles.Any(rr => rr.Id == r.Id)).Count() > 0;
         }
-
-
-        public IEnumerable<T> GetUserByLoginNames(bool asReferences = false, params string[] loginNames)
-        {
-            return _userRepository.GetUserByLoginNames(asReferences, loginNames);
-        }
-
-        public bool UpdateUserInformation(List<T> users, User currentUser)
```


## File: `ngo-api-core/NGO/NGO.Core.Services/Utilities/FieldHelperService.cs`
### Class: `(global)`
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/Utilities/ValidationUtilities.cs`
### Class: `(global)`
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```
- **using · System.Reflection** — _using_
  
  Thay đổi using: +using System.Reflection;

```diff
+using System.Reflection;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/Validation/BudgetRowNoValidationService.cs`
### Class: `(global)`
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: +using System.Linq;

```diff
+using System.Linq;
```

### Class: `BudgetRowNoValidationService`
- **class · BudgetRowNoValidationService** — _—_
  
  Thay đổi khai báo class: class BudgetRowNoValidationService

```diff
+    public class BudgetRowNoValidationService : BaseValidationService<List<Model.Dto.BudgetRow>>
```
- **field · _appContext** — _field:+/-_
  
  Thay đổi field readonly: +        private readonly IApplicationContext _appContext;

```diff
+        private readonly IApplicationContext _appContext;
```
- **constructor · BudgetRowNoValidationService** — _logic-change_
  
  +        public BudgetRowNoValidationService(IConfigurationService<EntityDefinition, TabDefinition> configService, IServiceProvider serviceProvider,

```diff
+﻿using NGO.Core.Model;
+using NGO.Core.Model.Enums;
+using System;
+using System.Collections.Generic;
+using System.Linq;
+
+namespace NGO.Core.Services.Validation
+{
+    public class BudgetRowNoValidationService : BaseValidationService<List<Model.Dto.BudgetRow>>
+    {
+        private readonly IApplicationContext _appContext;
+        public BudgetRowNoValidationService(IConfigurationService<EntityDefinition, TabDefinition> configService, IServiceProvider serviceProvider,
```


## File: `ngo-api-core/NGO/NGO.Core.Services/Validation/InteractiveConditionValidator/BaseInteractiveConditionValidator.cs`
### Class: `(global)`
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/Validation/Logframe2ObjectiveValidationService.cs`
### Class: `(global)`
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: -using NGO.Core.Model.Enums;

```diff
-using NGO.Core.Model.Enums;
```
- **using · System** — _using_
  
  Thay đổi using: -using System;

```diff
-using System;
```
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: -using System.Collections.Generic;

```diff
-using System.Collections.Generic;
```
- **using · System.Linq** — _using_
  
  Thay đổi using: -using System.Linq;

```diff
-using System.Linq;
```

### Class: `Logframe2ObjectiveValidationService`
- **class · Logframe2ObjectiveValidationService** — _—_
  
  Thay đổi khai báo class: class Logframe2ObjectiveValidationService

```diff
-    public class Logframe2ObjectiveValidationService : BaseValidationService<Model.Dto.LogframeObjective>
```
- **field · _appContext** — _field:+/-_
  
  Thay đổi field readonly: -        private readonly IApplicationContext _appContext;

```diff
-        private readonly IApplicationContext _appContext;
```
- **constructor · Logframe2ObjectiveValidationService** — _logic-change_
  
  -        public Logframe2ObjectiveValidationService(IConfigurationService<EntityDefinition, TabDefinition> configService, IServiceProvider serviceProvider,

```diff
-﻿using NGO.Core.Model;
-using NGO.Core.Model.Enums;
-using System;
-using System.Collections.Generic;
-using System.Linq;
-
-namespace NGO.Core.Services.Validation
-{
-    public class Logframe2ObjectiveValidationService : BaseValidationService<Model.Dto.LogframeObjective>
-    {
-        private readonly IApplicationContext _appContext;
-        public Logframe2ObjectiveValidationService(IConfigurationService<EntityDefinition, TabDefinition> configService, IServiceProvider serviceProvider,
```


## File: `ngo-api-core/NGO/NGO.Core.Services/Validation/LogframeVersionValidationService.cs`
### Class: `(global)`
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```


## File: `ngo-api-core/NGO/NGO.Core.Services/WorkflowService.cs`
### Class: `(global)`
- **using · Microsoft.ProjectServer.Client** — _using_
  
  Thay đổi using: +using Microsoft.ProjectServer.Client;

```diff
+using Microsoft.ProjectServer.Client;
```
- **using · NGO.Core.Repositories.DataModel** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.DataModel;

```diff
+using NGO.Core.Repositories.DataModel;
```
- **using · NGO.Core.Services.Utilities** — _using_
  
  Thay đổi using: +using NGO.Core.Services.Utilities;

```diff
+using NGO.Core.Services.Utilities;
```
- **using · System.Text** — _using_
  
  Thay đổi using: -using System.Text;

```diff
-using System.Text;
```

### Class: `WorkflowService<T>`
- **field · _entityMapper** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IDtoMapper<Core.Model.Dto.Entity, Model.Entity> _entityMapper;

```diff
+        protected readonly IDtoMapper<Core.Model.Dto.Entity, Model.Entity> _entityMapper;
```
- **field · _minimumRequirementRepository** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IMinimumRequirementRepository<Model.MinimumRequirement> _minimumRequirementRepository;

```diff
+        protected readonly IMinimumRequirementRepository<Model.MinimumRequirement> _minimumRequirementRepository;
```
- **field · _permissionQueue** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly SPPermissionManagementQueue _permissionQueue;

```diff
+        protected readonly SPPermissionManagementQueue _permissionQueue;
```
- **constructor · WorkflowService** — _—_
  
  public WorkflowService(IWorkflowRepository<T> repository,

```diff
@@ -57,9 +60,12 @@ namespace NGO.Core.Services
         protected readonly IUnityOfWorkFactory _uowFactory;
         protected readonly IEntityRepository<Core.Model.Entity> _entityRepository;
         protected readonly IDtoMapper<Core.Model.ByPassPhaseInfo, Model.Phase> _bypassPhaseMapper;
+        protected readonly IDtoMapper<Core.Model.Dto.Entity, Model.Entity> _entityMapper;
         protected readonly IConfigurationRepository _configurationRepository;
         protected readonly IWorkflowSyncLogService<Core.Model.WorkflowSyncLog> _workflowSyncLogService;
         protected readonly WorkflowBypassManagementQueue _queue;
+        protected readonly IMinimumRequirementRepository<Model.MinimumRequirement> _minimumRequirementRepository;
+        protected readonly SPPermissionManagementQueue _permissionQueue;
 
         public WorkflowService(IWorkflowRepository<T> repository,
```


## File: `ngo-api-core/NGO/NGO.Core.Tools.RebindPeriodNameForIndicatorTargetReport/Program.cs`
### Class: `(global)`
- **using · Microsoft.EntityFrameworkCore** — _using_
  
  Thay đổi using: +using Microsoft.EntityFrameworkCore;

```diff
+using Microsoft.EntityFrameworkCore;
```
- **using · Microsoft.Extensions.Configuration** — _using_
  
  Thay đổi using: +using Microsoft.Extensions.Configuration;

```diff
+using Microsoft.Extensions.Configuration;
```
- **using · Microsoft.Extensions.DependencyInjection** — _using_
  
  Thay đổi using: +using Microsoft.Extensions.DependencyInjection;

```diff
+using Microsoft.Extensions.DependencyInjection;
```
- **using · Microsoft.Extensions.Logging** — _using_
  
  Thay đổi using: +using Microsoft.Extensions.Logging;

```diff
+using Microsoft.Extensions.Logging;
```
- **using · NGO.Core.Infrastructure** — _using_
  
  Thay đổi using: +using NGO.Core.Infrastructure;

```diff
+using NGO.Core.Infrastructure;
```
- **using · NGO.Core.Model** — _using_
  
  Thay đổi using: +using NGO.Core.Model;

```diff
+using NGO.Core.Model;
```
- **using · NGO.Core.Model.Enums** — _using_
  
  Thay đổi using: +using NGO.Core.Model.Enums;

```diff
+using NGO.Core.Model.Enums;
```
- **using · NGO.Core.Repositories** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories;

```diff
+using NGO.Core.Repositories;
```
- **using · NGO.Core.Repositories.DataModel** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.DataModel;

```diff
+using NGO.Core.Repositories.DataModel;
```
- **using · NGO.Core.Repositories.Mapping** — _using_
  
  Thay đổi using: +using NGO.Core.Repositories.Mapping;

```diff
+using NGO.Core.Repositories.Mapping;
```
- **using · NGO.Core.Services** — _using_
  
  Thay đổi using: +using NGO.Core.Services;

```diff
+using NGO.Core.Services;
```
- **using · System.Linq.Dynamic.Core** — _using_
  
  Thay đổi using: +using System.Linq.Dynamic.Core;

```diff
+using System.Linq.Dynamic.Core;
```

### Class: `Program`
- **class · Program** — _logic-change_
  
  Thay đổi khai báo class: class Program

```diff
+    class Program
```


## File: `ngo-api-core/NGO/NGO.Webjobs/NGO.Core.WebJobs.Common/Functions/IATITransactionImportAddDataFunction.cs`
### Class: `(global)`
- **using · Microsoft.Extensions.Logging** — _using_
  
  Thay đổi using: +using Microsoft.Extensions.Logging;

```diff
+using Microsoft.Extensions.Logging;
```
- **using · NGO.Core.Common.Constants** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Constants;

```diff
+using NGO.Core.Common.Constants;
```
- **using · NGO.Core.WebJobs.Common.Services** — _using_
  
  Thay đổi using: +using NGO.Core.WebJobs.Common.Services;

```diff
+using NGO.Core.WebJobs.Common.Services;
```
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: +using System.Threading.Tasks;

```diff
+using System.Threading.Tasks;
```

### Class: `IATITransactionImportFunction`
- **class · IATITransactionImportFunction** — _—_
  
  Thay đổi khai báo class: class IATITransactionImportFunction

```diff
+    public class IATITransactionImportFunction
```
- **field · _asyncService** — _field:+/-_
  
  Thay đổi field readonly: +        private readonly IIATITransactionImportService _asyncService;

```diff
+        private readonly IIATITransactionImportService _asyncService;
```
- **field · _executor** — _field:+/-_
  
  Thay đổi field readonly: +        private readonly IWebJobExecutor _executor;

```diff
+        private readonly IWebJobExecutor _executor;
```
- **field · _logger** — _field:+/-_
  
  Thay đổi field readonly: +        private readonly ILogger<IATITransactionImportFunction> _logger;

```diff
+        private readonly ILogger<IATITransactionImportFunction> _logger;
```
- **constructor · IATITransactionImportFunction** — _logic-change_
  
  +        public IATITransactionImportFunction(IIATITransactionImportService asyncService, IWebJobExecutor executor

```diff
+using System.Threading.Tasks;
+
+namespace NGO.Core.WebJobs.Common.Functions
+{
+    public class IATITransactionImportFunction
+    {
+        private const string ResolvedQueueName = "%" + CoreAppSettingKeys.IATITransactionImportQueue + "%";
+        private readonly IIATITransactionImportService _asyncService;
+        private readonly IWebJobExecutor _executor;
+        private readonly ILogger<IATITransactionImportFunction> _logger;
+
+        public IATITransactionImportFunction(IIATITransactionImportService asyncService, IWebJobExecutor executor
```


## File: `ngo-api-core/NGO/NGO.Webjobs/NGO.Core.WebJobs.Common/Services/GenerateIATIFileService.cs`
### Class: `(global)`
- **using · System.Collections.Generic** — _using_
  
  Thay đổi using: +using System.Collections.Generic;

```diff
+using System.Collections.Generic;
```
- **field · _iatiPageService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IIATIPageService<Model.IATIForm> _iatiPageService;

```diff
+        protected readonly IIATIPageService<Model.IATIForm> _iatiPageService;
```


## File: `ngo-api-core/NGO/NGO.Webjobs/NGO.Core.WebJobs.Common/Services/IATITransactionImportAddDataService.cs`
### Class: `(global)`
- **using · NGO.Core.Common.Extensions** — _using_
  
  Thay đổi using: +using NGO.Core.Common.Extensions;

```diff
+using NGO.Core.Common.Extensions;
```
- **using · NGO.Core.Services** — _using_
  
  Thay đổi using: +using NGO.Core.Services;

```diff
+using NGO.Core.Services;
```
- **using · System.Collections.Concurrent** — _using_
  
  Thay đổi using: +using System.Collections.Concurrent;

```diff
+using System.Collections.Concurrent;
```
- **using · System.Threading.Tasks** — _using_
  
  Thay đổi using: +using System.Threading.Tasks;

```diff
+using System.Threading.Tasks;
```

### Class: `IATITransactionImportService<T>`
- **class · IATITransactionImportService<T>** — _class:generic-change_
  
  Thay đổi khai báo class: class IATITransactionImportService<T>

```diff
+    public class IATITransactionImportService<T> : IIATITransactionImportService
```
- **field · _iatiTransactionImportExcelService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IIATITransactionImportExcelService _iatiTransactionImportExcelService;

```diff
+        protected readonly IIATITransactionImportExcelService _iatiTransactionImportExcelService;
```
- **field · _importservice** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IIATITransactionImportService<T> _importservice;

```diff
+        protected readonly IIATITransactionImportService<T> _importservice;
```
- **field · _userService** — _field:+/-_
  
  Thay đổi field readonly: +        protected readonly IUserService<Core.Model.User> _userService;

```diff
+        protected readonly IUserService<Core.Model.User> _userService;
```
- **field · _logger** — _field:+/-_
  
  Thay đổi field readonly: +        private readonly ILogger<IATITransactionImportService<T>> _logger;

```diff
+        private readonly ILogger<IATITransactionImportService<T>> _logger;
```
- **constructor · IATITransactionImportService** — _logic-change_
  
  +        public IATITransactionImportService(IIATITransactionImportExcelService iatiTransactionImportExcelService,

```diff
+    }
+
+    public class IATITransactionImportService<T> : IIATITransactionImportService
+        where T : Core.Model.IATITransactionImport, new()
+    {
+        protected readonly IIATITransactionImportExcelService _iatiTransactionImportExcelService;
+        protected readonly IIATITransactionImportService<T> _importservice;
+        protected readonly IUserService<Core.Model.User> _userService;
+        private readonly ILogger<IATITransactionImportService<T>> _logger;
+        private static ConcurrentDictionary<string, string> _proccessingImportIds = new ConcurrentDictionary<string, string>();
+
+        public IATITransactionImportService(IIATITransactionImportExcelService iatiTransactionImportExcelService,
```


## File: `ngo-api-core/NGO/NGO.Webjobs/NGO.Core.WebJobs.Common/Services/ScreenshotAsyncService.cs`
### Class: `(global)`
- **using · System** — _using_
  
  Thay đổi using: +using System;

```diff
+using System;
```


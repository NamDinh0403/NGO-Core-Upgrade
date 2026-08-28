# Backend AppSettings Upgrade Release Note

> **Purpose:** Canonical backend configuration checklist for NGO Core upgrades  
> **Applies to:** `appsettings.json`, environment-specific appsettings files, WebJob settings, deployment variables, and Azure App Settings  
> **Rule:** Apply requirements where `sourceVersion < releaseVersion <= targetVersion`  
> **Safety:** Never write secrets, credentials, or customer-specific values into canonical knowledge

---

## [For Upgrade Person] Mandatory Configuration Guards

### 1. Discover all configuration targets before editing

Recursively locate and classify:

- API `appsettings.json`
- API environment files such as `appsettings.Development.json` and `appsettings.Production.json`
- WebJob `appsettings.json` files
- Tool or migration-runner appsettings files
- deployment appsettings templates
- pipeline variables
- Azure App Settings mappings
- configuration transforms and token-replacement files
- configuration classes bound through `IOptions<T>`, `IOptionsSnapshot<T>`, or direct configuration access

Do not assume one root `appsettings.json` is the complete configuration system.

### 2. Separate source settings from deployment settings

Represent file settings and Azure settings independently.

Example:

```yaml
fileSetting:
  section: Core
  key: CspAdditionalFrameSrc

azureSetting:
  key: Core:CspAdditionalFrameSrc
```

Do not write colon-delimited Azure keys directly into JSON files unless the project explicitly uses flat-key JSON.

### 3. Preserve client values

- Add missing required keys.
- Do not overwrite an existing client value without an explicit release requirement and evidence.
- Do not remove client-only settings solely because the target Core repository does not contain them.
- Record contradictions between Core defaults and client values.
- Ask for a developer, PM, or AM decision when the value depends on client behavior.

### 4. Protect sensitive data

Never store real subscription keys, passwords, storage connection strings, API keys, model endpoints, or deployment credentials in this release note, knowledge records, logs, or generated examples.

Use placeholders and external secret sources:

```json
{
  "IATISubscriptionKey": "<FROM_SECRET_PROVIDER>"
}
```

Any previously committed real secret must be reported for rotation.

### 5. Validate configuration binding

For each setting:

1. Search the target Core repository for the consuming symbol.
2. Confirm the owning section and key name.
3. Confirm expected type and whether empty values are valid.
4. Confirm which applications require the setting: API, WebJob, Tool, or all.
5. Confirm whether an Azure variable is also required.
6. Add the setting only to applicable files.
7. Validate JSON syntax and application startup.

### 6. Track every requirement

Each applicable setting must finish with one status:

- `NOT_APPLICABLE_WITH_EVIDENCE`
- `DECISION_PENDING`
- `PLANNED`
- `IMPLEMENTED`
- `VERIFIED`
- `MANUAL_DEPLOYMENT_PENDING`
- `RESEARCH_REQUIRED`
- `BLOCKED`

The upgrade cannot complete while an applicable required setting remains unplanned or unverified.

---

# 9.2.0

## [Upgrade Person] Content Security Policy additional frame sources

### Applicability

Always add the setting when upgrading through 9.2.0 if the target Core code consumes `Core:CspAdditionalFrameSrc`.

### Add to applicable `appsettings.json` files

```json
{
  "Core": {
    "CspAdditionalFrameSrc": ""
  }
}
```

### Add to Azure App Settings

```text
Core:CspAdditionalFrameSrc=
```

### Behavior

- The empty string means no additional frame source is configured.
- Additional iframe or frame sources may be configured as a semicolon-separated list.
- Do not add permissive wildcard sources without security review.

### Verification

- Confirm all applicable API appsettings files contain the key.
- Confirm deployed Azure configuration contains the matching key.
- Start the API and confirm configuration binding succeeds.
- Smoke-test client iframe and map functionality.
- Verify the resulting CSP header contains only intended sources.

---

# 9.1.0

## [Upgrade Person] Signed-off payment document subfolder

### Applicability

Apply only when the client uses **Mark as Paid** or **Cancel Payment** and the PM or AM has confirmed the desired behavior.

### Decision required

Ask the client's PM or AM:

- Does the client use Mark as Paid or Cancel Payment?
- Should signed-off additional documents be placed in a subfolder?
- What should the folder name be?
- Should the value be empty to disable the optional subfolder?

### Add to applicable appsettings

```json
{
  "Core": {
    "SPSignedOffAdditionalDocumentsFolderName": "Additional documents"
  }
}
```

If the application binds this setting outside the `Core` section, use the location proven by target Core source inspection. Do not guess the section.

### Azure App Setting

Resolve the exact deployed key from the target Core configuration binding. Expected semantic key:

```text
Core:SPSignedOffAdditionalDocumentsFolderName
```

Mark `RESEARCH_REQUIRED` if the target Core source uses a different hierarchy.

### After deployment

Run only after PM/AM confirmation and configuration update:

```text
NGO.Core.Tools.UpdatePaymentDocumentLinks
```

### Verification

- Confirm relevant payment functions are enabled.
- Confirm the configured folder name matches the approved decision.
- Confirm the tool result contains no unresolved errors.
- Verify document links and optional approval subfolder behavior.

---

# 9.0.0

## [Upgrade Person] Published workflow synchronization queue

### Add to applicable API, WebJob, and deployment appsettings

```json
{
  "Core": {
    "Queue": {
      "SyncPublishedWorkflowQueue": "syncpublishedworkflowqueue"
    }
  }
}
```

### Add to Azure App Settings

```text
Core:Queue:SyncPublishedWorkflowQueue=syncpublishedworkflowqueue
```

### Verification

- Confirm the queue setting exists in every process that publishes or consumes the queue.
- Confirm the Azure queue resource exists.
- Confirm deployed applications resolve the same queue name.
- Smoke-test draft-to-published workflow synchronization.

## [Upgrade Person] Write with AI configuration

### Applicability

Apply only when the customer explicitly approves the Write with AI feature. This feature can incur subscription costs.

### Decision required

Record:

- customer approval;
- Foundry resource selection;
- model deployment selection;
- endpoint secret reference;
- deployment name;
- owning environment.

### Add to applicable appsettings

```json
{
  "Core": {
    "AzureOpenAISettings": {
      "Endpoint": "<FROM_SECRET_OR_ENVIRONMENT_PROVIDER>",
      "DeploymentName": "<APPROVED_MODEL_DEPLOYMENT_NAME>"
    }
  }
}
```

Do not commit real endpoint credentials or access keys.

### Add to Azure App Settings

```text
Core:AzureOpenAISettings:Endpoint=<FROM_SECRET_PROVIDER>
Core:AzureOpenAISettings:DeploymentName=<APPROVED_MODEL_DEPLOYMENT_NAME>
```

### Related system configuration

The `AIConfiguration` system configuration must set `UsingWriteWithAI` to `true` only after customer approval and infrastructure readiness.

### Verification

- Confirm the Entra application has the approved role assignment.
- Confirm endpoint and deployment name resolve in the deployed environment.
- Confirm no secret is committed to source control.
- Start the API and verify configuration binding.
- Run an approved non-production feature smoke test.

---

# 8.6.0

## [Upgrade Person] Signed-off payment document subfolder

The 8.6.0 release contains the same client decision and tool requirement later listed under 9.1.0.

Use the canonical requirement under **9.1.0** unless release provenance proves the setting was introduced or backported differently.

Set one of:

- `NOT_APPLICABLE_WITH_EVIDENCE`
- `IMPLEMENTED_BY_EARLIER_RELEASE`
- `RESEARCH_REQUIRED`

Do not apply the same setting or tool twice.

---

# 8.3.0

## [Deployment Person] SharePoint deployment feature switch

### Applicability

Apply only for the deployment operation that requires SharePoint fields and content types to be deployed.

### Azure App Setting

```text
Core:Deployment:DeploySPFieldsAndCTypesEnabled=true
```

### Guard

- Record the original value before changing it.
- Use `true` only for the required deployment window.
- Restore the original value after deployment.
- Do not permanently change the value without explicit approval.

### Verification

- Confirm the original value is recorded.
- Confirm required SharePoint deployment steps completed.
- Confirm the setting was restored after deployment.

## [Upgrade Person] UpdateIdeaMembers tool configuration

The release note requires appsettings changes before running `NGO.Core.Tools.UpdateIdeaMembers`, but exact required keys and values are not present in the source note.

Status must be:

```text
RESEARCH_REQUIRED
```

Required research:

- inspect target Core tool configuration classes;
- inspect tool documentation and sample appsettings;
- identify required SharePoint, Core, queue, storage, and database settings;
- do not invent values;
- generate a tool-specific configuration checklist before execution.

---

# 8.2.0

## [Upgrade Person] SetAzureAdIdForUser tool configuration

The source note requires updating appsettings before running:

```text
NGO.Core.Tools.SetAzureAdIdForUser
```

The exact settings are not provided.

Status must be:

```text
RESEARCH_REQUIRED
```

Inspect the target Core tool entry point and options/configuration classes before execution. Confirm database and Entra access without storing secrets in knowledge or logs.

---

# 8.0.0

## [Upgrade Person] IATI transaction import queue

### Applicability

Apply when the client uses IATI transaction import.

### Add to applicable appsettings

Preferred normalized structure:

```json
{
  "Core": {
    "Queue": {
      "IATITransactionImportQueue": "<ENVIRONMENT_SPECIFIC_QUEUE_NAME>"
    }
  }
}
```

The historical example used an environment-specific value. Do not copy a client-specific suffix into another client.

### Add to Azure App Settings

```text
Core:Queue:IATITransactionImportQueue=<ENVIRONMENT_SPECIFIC_QUEUE_NAME>
```

### Verification

- Confirm the client uses IATI transaction import.
- Confirm the queue resource exists in the target environment.
- Confirm API/WebJob producers and consumers use the same value.
- Run an IATI transaction import smoke test.

## [Upgrade Person] UpdateIdeaMembers tool configuration

The source note states that appsettings must be updated before running `NGO.Core.Tools.UpdateIdeaMembers`, but it does not list an exact complete configuration contract.

Mark as `RESEARCH_REQUIRED` and inspect target Core tool configuration before running.

---

# 7.1.0

## [Upgrade Person] Maximum IATI email attachment size

### Add to API and WebJob appsettings

```json
{
  "Core": {
    "MaxEmailAttachmentFileSizeMb": 20
  }
}
```

If target Core binds the key outside the `Core` section, use the proven target location.

### Add to Azure App Settings

```text
Core:MaxEmailAttachmentFileSizeMb=20
```

### Applicability and value

- Use `20` only as the documented default when the customer has no different requirement.
- Preserve an approved client-specific value.
- Validate the expected data type from target Core source.

### Verification

- Confirm API and WebJob processes resolve the same value.
- Verify boundary behavior for email attachment size.
- Confirm the value is represented as the correct type.

---

# 7.0.0

## [Upgrade Person] IATI module backend configuration

### Add to applicable appsettings files

```json
{
  "Core": {
    "IATIDocumentsBlob": "iati-documents",
    "IATIValidationApi": "https://api.iatistandard.org/validator/validate",
    "IATISubscriptionKey": "<FROM_SECRET_PROVIDER>",
    "GenerateIATIFileSchedule": "0 2 * * *",
    "Queue": {
      "GenerateIATIFileQueue": "generateiatifilequeue"
    }
  }
}
```

### Add to Azure App Settings

```text
Core:IATIDocumentsBlob=iati-documents
Core:IATIValidationApi=https://api.iatistandard.org/validator/validate
Core:IATISubscriptionKey=<FROM_SECRET_PROVIDER>
Core:GenerateIATIFileSchedule=0 2 * * *
Core:Queue:GenerateIATIFileQueue=generateiatifilequeue
```

### Security guard

- Never store the actual IATI subscription key in source-controlled files or canonical knowledge.
- If a real key was previously exposed, report it for rotation.
- Use the approved secret provider or secured Azure setting.

### Verification

- Blob container exists.
- Queue exists.
- Schedule is valid and approved.
- Validation API is reachable from the deployment environment.
- Subscription key resolves securely.
- IATI generation and validation smoke tests pass.

## [Upgrade Person] Site collection switch schedule and queue

### Add to applicable appsettings

```json
{
  "Core": {
    "SwitchCurrentSiteCollectionSchedule": "0 4 * * *",
    "Queue": {
      "SwitchCurrentSiteCollectionQueue": "switchcurrentsitecollectionqueue"
    }
  }
}
```

### Add to Azure App Settings

```text
Core:SwitchCurrentSiteCollectionSchedule=0 4 * * *
Core:Queue:SwitchCurrentSiteCollectionQueue=switchcurrentsitecollectionqueue
```

### Guard

The schedule may be adjusted for client requirements. Preserve an approved client-specific schedule.

### Verification

- Cron expression is valid.
- Queue exists.
- Producer and consumer values match.
- Scheduled process is enabled only in intended environments.

## [Upgrade Person] Reminder task deadline queue

### Add to applicable appsettings

```json
{
  "Core": {
    "Queue": {
      "ReminderTaskDeadlineQueue": "remindertaskdeadlinequeue"
    }
  }
}
```

### Add to Azure App Settings

```text
Core:Queue:ReminderTaskDeadlineQueue=remindertaskdeadlinequeue
```

### Verification

- Queue exists.
- Producer and consumer configuration matches.
- Reminder workflow smoke test passes.

---

# 6.3.0

## [Upgrade Person] Partner expenditure migration tool configuration

Before running:

```text
UpdateExistingPartnerExpenditureReportings
```

The source note requires configuration of queue names, Core context, Azure WebJobs storage, and:

```json
{
  "RemoveRedundantPeriods": false
}
```

### Guard

The source note does not provide a complete safe configuration contract for queue names, connection values, or storage settings.

Required status:

```text
RESEARCH_REQUIRED
```

Required actions:

- inspect target Core tool options and sample configuration;
- use secure external values for connection and storage settings;
- default `RemoveRedundantPeriods` to `false`;
- set `true` only after an explicit client decision;
- run a review/preview mode if supported;
- do not execute against production without backup and approval.

---

# 6.0.0

## [Upgrade Person] Page import queue

### Add to applicable appsettings

```json
{
  "Core": {
    "Queue": {
      "PageImportAddDataQueue": "pageimportadddataqueue"
    }
  }
}
```

### Add to Azure App Settings

```text
Core:Queue:PageImportAddDataQueue=pageimportadddataqueue
```

### Verification

- Queue exists.
- API/WebJob producer and consumer values match.
- Page import smoke test passes.

## [Upgrade Person] Reminder deadline schedule

### Add to applicable WebJob appsettings

```json
{
  "Core": {
    "ReminderTaskDeadlineSchedule": "0 2 * * *"
  }
}
```

### Add to Azure App Settings

```text
Core:ReminderTaskDeadlineSchedule=0 2 * * *
```

### Guard

The schedule may be changed for a client requirement. Preserve approved client-specific values.

### Verification

- Cron expression is valid.
- Only intended WebJob environments schedule the process.
- Reminder execution is observed successfully.

## [Upgrade Person] Azure AD synchronization queues and schedules

### Add to applicable API and WebJob appsettings

```json
{
  "Core": {
    "ADSyncGroupsSchedule": "0 */4 * * *",
    "ADSyncUsersSchedule": "0 * * * *",
    "Queue": {
      "ADSyncGroupsQueue": "adsyncgroupqueue",
      "ADSyncUsersQueue": "adsyncuserqueue"
    }
  }
}
```

### Add to Azure App Settings

```text
Core:ADSyncGroupsSchedule=0 */4 * * *
Core:ADSyncUsersSchedule=0 * * * *
Core:Queue:ADSyncGroupsQueue=adsyncgroupqueue
Core:Queue:ADSyncUsersQueue=adsyncuserqueue
```

### Verification

- Both queue resources exist.
- Cron expressions are valid.
- API/WebJob processes use matching settings.
- Group and user synchronization smoke tests pass.

---

# Requirement Coverage and Missing-Key Detection

For an upgrade from version `S` to version `T`, load every setting where:

```text
S < releaseVersion <= T
```

Generate:

```text
runs/<client>/<run-id>/appsettings-inventory.json
runs/<client>/<run-id>/appsettings-requirements.yaml
runs/<client>/<run-id>/appsettings-coverage.yaml
runs/<client>/<run-id>/missing-appsettings.yaml
runs/<client>/<run-id>/azure-app-settings-checklist.yaml
```

## Coverage entry format

```yaml
requirementId: REL-9.2.0-APPSETTING-CSP-FRAME-SRC
releaseVersion: 9.2.0
logicalKey: Core:CspAdditionalFrameSrc
applicability: APPLICABLE

fileTargets:
  - path: src/NGO.API/appsettings.json
    status: VERIFIED
  - path: src/NGO.API/appsettings.Production.json
    status: IMPLEMENTED

azureTarget:
  key: Core:CspAdditionalFrameSrc
  status: MANUAL_DEPLOYMENT_PENDING
  owner: deployment-person

verification:
  configurationBinding: PASSED
  startup: PASSED
  runtimeSmokeTest: PENDING
```

## Missing-key severity

- `CRITICAL`: secret or connection requirement missing and application cannot start safely.
- `HIGH`: required queue, schedule, endpoint, or security setting missing.
- `MEDIUM`: optional feature setting applicable but not configured.
- `LOW`: documented default absent but target Core supplies a safe internal default.

Do not infer that a setting is safe to omit merely because the application builds.

---

# Tool-Specific Configuration Guard

Before running any `NGO.Core.Tools.*` command:

1. Identify the exact target Core tool version.
2. Inspect its configuration binding and required options.
3. Generate a tool-specific configuration checklist.
4. Confirm database backup and execution environment where applicable.
5. Use review mode before update mode when supported.
6. Preserve command output and warnings.
7. Do not store secrets in the command line, logs, or knowledge.
8. Do not continue to update mode while warnings remain unresolved.

---

# Final Backend Configuration Validation

- [ ] All appsettings files inventoried
- [ ] Environment-specific appsettings files inspected
- [ ] API, WebJob, Tool, and deployment ownership classified
- [ ] Applicable release range resolved
- [ ] Every applicable setting has a disposition
- [ ] Existing client values preserved or explicitly changed
- [ ] Required defaults applied
- [ ] Sensitive values use secure providers
- [ ] No real secret appears in source control or generated reports
- [ ] JSON syntax validated
- [ ] Options/configuration binding validated
- [ ] API startup validated
- [ ] Relevant WebJobs start successfully
- [ ] Queue and schedule resources confirmed
- [ ] Azure App Settings checklist generated
- [ ] Manual deployment settings assigned to an owner
- [ ] Tool-specific settings researched before execution
- [ ] Runtime smoke tests completed
- [ ] Missing or ambiguous settings documented
- [ ] Final upgrade report updated
- [ ] Candidate knowledge corrections created without automatic promotion

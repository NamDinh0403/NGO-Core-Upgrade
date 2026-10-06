# Architecture - AppSettings knowledge

Backend configuration is knowledge too. The AppSettings subsystem turns release-note
configuration changes into atomic, owned requirements and checks them against the client's
real configuration surface - without ever committing a secret.

## Canonical requirements

`../ingest/knowledge/canonical/appsettings/backend-appsettings.yaml`
(`schemas/appsettings-requirement.schema.json`). Each setting carries: `key`, `section`,
`owningProcess` (API / WEBJOB / TOOL / DEPLOYMENT / ALL), `azureKey`, `dataType`,
`defaultValue`, `preserveClientValue`, `sensitive`, `timing`, `automation`, `validation`,
`risk`, `confidence`, `status`, and `owner`. Secrets are stored only as placeholders
(`<FROM_SECRET_PROVIDER>`) with `sensitive: true`.

## Inventory and mapping

`tools/lib/appsettings-inventory.js`:

- **discover(root)** finds every `appsettings*.json` and classifies its owning process from
  the path (webjob / tool / deploy / api), flattening nested config into `Section:Key`.
- **mapRequirements(inventory, requirements)** matches each requirement to the files of its
  owning process (an `API` setting is not expected in a WebJob file, and vice-versa),
  producing:
  - **coverage** - present/absent per key, with the existing client value preserved;
  - **missing** - required keys absent from the relevant process, with an owner;
  - **azureChecklist** - the Azure variable per key, separate from the file key;
  - **secretRejections** - a concrete value on a `sensitive` key is rejected: the value must
    come from the secret provider, never from committed config.

Key matching tolerates both unqualified (`key` + `section`) and pre-qualified canonical
keys, matching against the flattened `Section:Key` inventory keys.

## Guarantees

- **Existing client values are preserved** - the agent adds missing keys, it does not
  overwrite client-tuned values.
- **File key and Azure key are represented separately** - a setting can be present in
  `appsettings.json` and still need its Azure App Service variable, and vice-versa.
- **No secret leakage** - secret-backed settings use placeholders and deployment-owned
  values; a real value found in committed config is flagged (and, if it was a real
  credential, must be rotated - see
  [../operations/secret-redaction.md](../operations/secret-redaction.md)).
- **Manual deployment ownership** - deployment/Azure keys are assigned an owner and appear
  in `azure-app-settings-checklist.yaml`.

## Run artifacts

`appsettings-inventory.json`, `appsettings-coverage.yaml`, `missing-appsettings.yaml`,
`azure-app-settings-checklist.yaml` under `runs/<client>/<run-id>/`.

## Front-end-only runs

When the upgrade scope is front-end only and no backend configuration surface is present,
the inventory is empty and every backend setting is surfaced as
`MANUAL_ACTION_PENDING`/missing with a deployment owner - never silently satisfied.

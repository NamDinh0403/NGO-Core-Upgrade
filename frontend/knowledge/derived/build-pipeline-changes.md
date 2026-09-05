# Build Pipeline Changes

**CI/CD YAML edits required by the Angular 10 → 15 upgrade.**
**Verbatim source:** `upgrade-angular-10-15.pdf` §9 + tested against real client pipelines.

---

## `build-pipeline-angular.yml`

### Change

**From:**
```yaml
'node --max_old_space_size=8192 node_modules/@angular/cli/bin/ng build --prod'
```

**To:**
```yaml
'node --max_old_space_size=8192 node_modules/@angular/cli/bin/ng build --configuration production'
```

**Why:** The `--prod` shortcut flag was removed in Angular 12. The named build configuration (`--configuration production`) must be used explicitly.

### Full pipeline step context

The change typically lives inside a script step under a build stage. Locate it by grepping for either `--prod` or `ng build`:

```yaml
- script: |
    node --max_old_space_size=8192 node_modules/@angular/cli/bin/ng build --configuration production
  displayName: 'ng build (production)'
  workingDirectory: '$(System.DefaultWorkingDirectory)/src'
```

---

## `build-pipeline-api.yml` (frontend-adjacent)

The API pipeline is upgraded in step with ngo-core because both share a `netVersion` variable and the EF tool version.

**Applies:** any upgrade that crosses ngo-core v7.0.0.

```yaml
- variables:
-   netVersion: '8.0'
-   dotnetEfVersion: '8.0.10'
+ variables:
+   netVersion: '9.0'
+   dotnetEfVersion: '9.0.1'
```

Both variables are typically defined once near the top of the YAML file. Search for `netVersion:` and confirm every occurrence uses the new value.

---

## Optional: Node version bump

Angular 15 requires Node 16.14+ (18 LTS strongly recommended). If the pipeline pins a Node version, update it:

```yaml
- - task: NodeTool@0
-   inputs:
-     versionSpec: '14.x'
+ - task: NodeTool@0
+   inputs:
+     versionSpec: '18.x'
```

Verify locally first: `node --version` on the build agent.

---

## v9.0.0 — Node 18.20.0 + .NET 10 pipeline

Core **9.0.0** pins the exact Node version and moves the API pipeline to **.NET 10**.

### `build-pipeline-angular.yml`

Set the NodeTool task to `18.20.0` and **remove** the `npm@1` "npm version" task:

```yaml
- task: NodeTool@0
  inputs:
    versionSpec: '18.20.0'
  displayName: 'Install Node.js'
```

```yaml
# REMOVE this task entirely
- task: npm@1
  displayName: 'npm version'
  ...
```

### `build-pipeline-api.yml`

```yaml
- netVersion: '8.0'
+ netVersion: '10.0'
```

Also update the Azure App Service / Web App runtime to **.NET 10** at deploy time (backend KB).

---

## Verification checklist

After patching the YAML:

- [ ] Kick off a pipeline run against a throwaway branch — build must succeed
- [ ] Verify the produced `dist/` output size is in the expected range (Angular 15 bundles are typically 10–15% smaller than Angular 10 for the same code)
- [ ] Confirm no warnings about deprecated `--prod` in the build logs

---

## Reference PR

<https://dev.azure.com/preciofishbone/NGO%20Online/_git/ngo-onlineshelterbox/pullrequest/30523>

The above PR demonstrates the pipeline changes applied end-to-end against a real client (Shelterbox).

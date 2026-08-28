# Install Procedure

**Applies to:** Phase 0 (Version Discovery & Install) of the Main Upgrade.
**Verbatim source:** `upgrade-angular-10-15.pdf` §2.

---

## Canonical command sequence

Run each command in order, from the client project root. Do **not** skip the cache clean or the `package-lock.json` removal — stale lock files cause deterministic failures during major version bumps.

```powershell
# 1. Clean npm cache (mandatory before major version jump)
npm cache clean --force

# 2. Delete node_modules
Remove-Item -Recurse -Force .\node_modules -ErrorAction SilentlyContinue

# 3. Delete package-lock.json
Remove-Item -Force .\package-lock.json -ErrorAction SilentlyContinue

# 4. Install
npm install

# 5. Verify (do NOT ng build yet — that happens in Phase 2)
ng serve --port 4300
# Ctrl+C once you see "Compiled successfully"
```

---

## Fallback ladder

Try in order; only escalate when the current level fails.

| Level | Command | When to use |
|-------|---------|-------------|
| 1 (normal) | `npm install` | Default. Should succeed for well-formed `package.json`. |
| 2 (peer conflicts) | `npm install --legacy-peer-deps` | Peer-dependency conflicts between ngo-core and third-party packages (common on major bumps). |
| 3 (last resort) | `npm install --force` | Only if level 2 fails. Log the failure into `.upgrade-state.json.issues` with reason. |

---

## Post-install verification

Check that the installed versions match `.upgrade-lock.json`:

```powershell
$lock = Get-Content ".upgrade-lock.json" | ConvertFrom-Json
$pkg  = Get-Content "package.json"       | ConvertFrom-Json

foreach ($key in @('@angular/core','typescript','ngo-core')) {
    $installed = $pkg.dependencies.$key
    if (-not $installed) { $installed = $pkg.devDependencies.$key }
    Write-Host "$key => $installed"
}
```

If any package pinned in `.upgrade-lock.json` does not match, restore it and re-run `npm install`.

---

## Common install failures

| Error | Root cause | Fix |
|-------|-----------|-----|
| `Unexpected token in JSON` during `ConvertFrom-Json` | Trailing comma in `package.json` (usually left over from a manual edit) | `$fixed = (Get-Content package.json -Raw) -replace ',(\s*[\}\]])','$1'; $fixed \| Set-Content package.json -NoNewline` |
| `ERESOLVE could not resolve` | Peer conflict — package X requires a different major of shared dep than package Y | Go to fallback level 2 (`--legacy-peer-deps`) |
| `EACCES` on Windows | node_modules directory locked by IDE or antivirus | Close all editors, disable AV real-time on the folder, retry |
| `npm ERR! network` | Corporate proxy blocking registry | Verify `npm config get registry` matches the internal mirror; set via `.npmrc` if needed |
| `Cannot find module '@angular-devkit/build-angular'` | `angular.json` references CLI version that mismatches installed CLI | Ensure `@angular/cli` and `@angular-devkit/build-angular` share the same major as `@angular/core` |
| tsconfig `target` reverted to `es2015` after install | Some Angular schematics rewrite `tsconfig.json` | Restore from `.upgrade-lock.json.lockedSettings.esTarget` immediately after install completes |

---

## Exit conditions

The agent may proceed to Phase 1 only when **all** of these hold:

- `npm install` exit code is 0
- `.upgrade-lock.json` exists with `esTarget`, `angularVersion`, `typescriptVersion`, `ngoCoreVersion` populated
- `tsconfig.json`'s `compilerOptions.target` equals `.upgrade-lock.json.lockedSettings.esTarget`
- `ng serve` successfully compiled (or was skipped by agent policy — either way, Phase 2 will surface any residual issues)

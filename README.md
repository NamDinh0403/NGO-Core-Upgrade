# NGO Core Upgrade

Upgrade a client's **NGO.Core (.NET backend) packages and Angular frontend** through VS Code GitHub Copilot Chat, the deterministic CLI engine, or the local Web UI platform—with a verified preflight check, a registered upgrade plan, and a unified verification report.

---

## 🤖 Which Agent to Select in VS Code Copilot Chat

In the VS Code Copilot Chat input bar (click the agent selector dropdown next to the **`+`** icon), you will see **three custom agents**:

| Agent Name in Dropdown | When to Select It |
| --- | --- |
| ✅ **`ngo-core-upgrade-orchestrator`** | **(Recommended Default)** Use for full-stack upgrades (Backend + Frontend), release checks, or any end-to-end upgrade. Coordinates the shared engine and dispatches both tracks. |
| **`ngo-core-backend-upgrade`** | Use only when you want to run the `.NET / NuGet / EF / appsettings.json` backend executor directly. |
| **`ngo-core-frontend-upgrade`** | Use only when you want to run the `Angular / TypeScript / npm` frontend executor directly. |

> **Important:** Always select **`ngo-core-upgrade-orchestrator`** from the dropdown for standard upgrades.

---

## 📍 Where to Add & Check All Paths Before Running the Agent

Before you run `ngo-core-upgrade-orchestrator` on a new machine, there are **4 places** where paths are configured or checked. Setting these up once prevents path-discovery failures.

| What Path | Where to Add / Edit It | Purpose |
| --- | --- | --- |
| **1. VS Code Workspace Folders** | [`ngo-core-upgrade.code-workspace`](ngo-core-upgrade.code-workspace) | Opens both this agent repo and your client repo in one VS Code window so Copilot can access both folders. |
| **2. Platform & Auto-Discovery Paths** | [`platform/config/settings.json`](platform/config/settings.json) | Stores `"approvedWorkspaceRoots"` and `"corePath"` for the Web UI and preflight auto-discovery. |
| **3. User Environment Variables** | PowerShell (`NGO_CORE_PATH`, `NGO_WORKSPACE_ROOTS`) | Machine-wide fallback so `check-environment.js` and `core-discovery.js` find your repos automatically even if `settings.json` is reset. |
| **4. Your Copilot Chat Prompt** | Inside your message to **`ngo-core-upgrade-orchestrator`** | Explicitly passes `Core path`, `Client path`, and `Target version` so the orchestrator starts immediately without pausing to ask. |

### 1. Edit [`ngo-core-upgrade.code-workspace`](ngo-core-upgrade.code-workspace) (VS Code Multi-Root Workspace)
Open [`ngo-core-upgrade.code-workspace`](ngo-core-upgrade.code-workspace) and replace `"../PATH/TO/YOUR/CLIENT/SOLUTION"` with the actual path to your client repository (and optionally add your `ngo-online-core` folder):

```json
{
  "folders": [
    {
      "name": "NGO Core Upgrade Agent",
      "path": "."
    },
    {
      "name": "Client Solution",
      "path": "C:/repos/ngo-online-shelterbox"
    },
    {
      "name": "NGO Online Core (Read-Only)",
      "path": "C:/repos/ngo-online-core"
    }
  ],
  "settings": {
    "chat.useCustomizationsInParentRepositories": true
  }
}
```
Then open the workspace in VS Code via **File -> Open Workspace from File...** -> select `ngo-core-upgrade.code-workspace`.

### 2. Edit [`platform/config/settings.json`](platform/config/settings.json) (Agent & Web UI Config)
By default in the repository, [`platform/config/settings.json`](platform/config/settings.json) contains paths from the original author's machine (`"D:\\NGO Client"`). Update lines 2–5 to match **your** machine's folder layout:

```json
{
  "approvedWorkspaceRoots": [
    "C:\\repos"
  ],
  "corePath": "C:\\repos\\ngo-online-core",
```
*(Note: You can also edit these directly in the browser UI by running `node platform/start.js` -> clicking **Settings** at `http://127.0.0.1:3800/`).*

### 3. Set User Environment Variables (Optional, Recommended on New Machines)
Run this once in PowerShell so the CLI and preflight scripts always know where your `ngo-online-core` and client workspace roots live:

```powershell
[Environment]::SetEnvironmentVariable("NGO_CORE_PATH", "C:\repos\ngo-online-core", "User")
[Environment]::SetEnvironmentVariable("NGO_WORKSPACE_ROOTS", "C:\repos", "User")
```
*(Restart VS Code / terminal after setting environment variables so the new values take effect.)*

### 4. Include the 3 Required Inputs in Your Chat Prompt
By rule, **`ngo-core-upgrade-orchestrator`** never guesses paths—if you don't include them in your prompt, it will stop and ask you for them first. To start immediately without extra prompts, paste all 3 in your first message:

```text
Upgrade my client project to NGO Core 9.4.1:
- Core path: C:\repos\ngo-online-core
- Client path: C:\repos\ngo-online-shelterbox
- Target version: 9.4.1
```

---

## 🛠️ Complete First-Time Machine Setup Checklist (5 Steps)

Follow these 5 steps on a new developer machine before running your first upgrade:

### Step 1 — Install Required Runtimes & Tools

The preflight checker verifies only the tools required for your active tracks (`backend`, `frontend`, or `backend,frontend`):

| Tool | Required When | Minimum Version | Windows Install Command (`winget`) |
| --- | --- | --- | --- |
| **Git** (`git`) | Always | `>= 2.20` | `winget install --id Git.Git -e --source winget` |
| **Node.js** (`node`) | Always | `>= 14.x` (`18+` LTS recommended) | `winget install OpenJS.NodeJS.LTS` |
| **GitHub CLI** (`gh`) | Optional (Recommended) | `>= 2.0` | `winget install --id GitHub.cli -e --source winget` |
| **.NET SDK** (`dotnet`) | `backend` track active | Matches client `<TargetFramework>` (`.NET 6` / `8` / `9`) | `winget install Microsoft.DotNet.SDK.8` |
| **EF Core CLI** (`dotnet-ef`) | Optional (EF migration checks) | Matches `.NET SDK` | `dotnet tool install --global dotnet-ef` |
| **Azure CLI** (`az`) | Optional (Azure Artifacts auth fallback) | `>= 2.0` | `winget install Microsoft.AzureCLI` |
| **npm CLI** (`npm`) | `frontend` track active | `>= 6.x` (`9+` recommended) | Bundled with Node.js LTS |

---

### Step 2 — Configure Git Identity & GitHub Authentication

Logging into `gh` alone does **not** automatically configure `git fetch` / `git ls-remote` over HTTPS unless `gh auth setup-git` is run. Run all 4 commands in PowerShell:

```powershell
# 1. Configure your Git author identity (required for upgrade commits)
git config --global user.name "Your Full Name"
git config --global user.email "your.email@organization.com"

# 2. Log in to GitHub CLI interactively (never paste PATs into chat)
gh auth login --hostname github.com --web

# 3. Link GitHub CLI as Git's HTTPS credential helper
gh auth setup-git --hostname github.com

# 4. Verify login status
gh auth status
```

- **If your repos use SSH remotes (`git@github.com:...`)**: ensure your SSH key is loaded (`ssh-add`) and uploaded to GitHub (`gh ssh-key add`).
- **If your organization requires SAML SSO**: run `gh auth refresh -h github.com -s read:org,repo` and authorize SSO in the browser.

---

### Step 3 — Clone & Fetch `ngo-online-core` (Read-Only)

The agent reads tags (`v<version>`), release branches (`releases/*`), and commits from a local `ngo-online-core` checkout. **Core is strictly READ-ONLY**—the agent never checks out branches or modifies files in `ngo-online-core`.

```powershell
# Clone ngo-online-core if you don't have it yet
git clone https://github.com/<your-org>/ngo-online-core.git C:\repos\ngo-online-core

# Always fetch all tags and release branches before upgrading
cd C:\repos\ngo-online-core
git fetch --all --tags
```

---

### Step 4 — Authenticate NuGet & Azure Artifacts (.NET Backend Track)

NGO Core backend packages (`NGO.Core`, `NGO.Core.API`, etc.) are hosted on a private Azure Artifacts NuGet feed.

**Where NuGet configuration lives on your machine:**
- **Project level:** `<client-path>\ngo-api\NuGet.Config` or `<client-path>\NuGet.Config`
- **User level:** `%APPDATA%\NuGet\NuGet.Config` (`C:\Users\<you>\AppData\Roaming\NuGet\NuGet.Config`)

**How to set it up:**
1. **Install the Azure Artifacts Credential Provider** (if not already installed via Visual Studio):
   ```powershell
   iex "& { $(irm https://aka.ms/install-artifacts-credprovider.ps1) } -AddNetfx"
   ```
2. **Authenticate interactively once** inside your client's backend folder (`ngo-api/`):
   ```powershell
   cd "C:\repos\ngo-online-shelterbox\ngo-api"
   dotnet restore --interactive
   ```
   *(Alternatively, run `az login` via Azure CLI, or set `$env:AZURE_DEVOPS_EXT_PAT = "<your-pat>"` in your user environment).*
3. **Check `<packageSourceMapping>` (if present in your `NuGet.Config`):**
   If your `NuGet.Config` uses `<packageSourceMapping>`, make sure your NGO feed includes `<package pattern="NGO.*" />`.

---

### Step 5 — Authenticate npm & `.npmrc` (Angular Frontend Track)

Client frontend projects (`<client-path>\ngo-client\`) consume scoped packages from private registries (`@ngo:registry=...`, `@fortawesome:registry=...`).

**Where `.npmrc` files live on your machine:**
- **Project level (committed to git):** `<client-path>\ngo-client\.npmrc` — should only contain registry URLs (or `${ENV_VAR}` placeholders), **never** hardcoded personal tokens or a bare `:username=VssSessionToken` without a password.
- **User level (your personal credentials):** `%USERPROFILE%\.npmrc` (`C:\Users\<you>\.npmrc`) — holds your private `: _authToken` or `:_password` entries.

**How to authenticate your user `%USERPROFILE%\.npmrc`:**
```powershell
# For Azure Artifacts npm feeds on Windows:
cd "C:\repos\ngo-online-shelterbox\ngo-client"
npx vsts-npm-auth -config .npmrc

# Or for standard npm v9+ web login:
npm login --auth-type=web --registry=<registry-url>
```

---

## 🔍 Verify Everything Before Running the Agent (`check-environment.js`)

After completing the setup above, run the **8-stage preflight check** from the `NGO Core Upgrade` repository root to verify all paths, tools, and credentials **before** invoking `ngo-core-upgrade-orchestrator`:

```powershell
node tools/check-environment.js `
  --core-path "C:\repos\ngo-online-core" `
  --client-path "C:\repos\ngo-online-shelterbox" `
  --target 9.4.1 `
  --tracks backend,frontend
```

### What `check-environment.js` Checks
1. **Stage 1 — Runtime & Tool Availability:** Checks `git`, `node`, `gh`, `dotnet` (verifying SDK compatibility with the client's `<TargetFramework>`), `dotnet-ef`, `az`, and `npm` (only required when `frontend` track is active).
2. **Stage 2 — Git Identity & GitHub Remote Access:** Verifies `git config user.name` / `user.email`, `gh auth status`, `credential.helper`, and `git ls-remote`.
3. **Stage 3 — Local NGO Core Repository Discovery & Validation:** Validates Core `.git` root boundaries, remote URL, and project structure (`ngo-api-core/`, `ngo-client-core/`), and rejects client repositories.
4. **Stage 4 — NuGet & Azure Artifacts 5-Stage Check:** Separates (1) `NuGet.Config` & `<packageSourceMapping>` validity, (2) Credential Provider discovery, (3) auth token acquisition, (4) private feed HTTP probe (`200` vs `401` vs `403`), and (5) target package version availability.
5. **Stage 5 — npm & `.npmrc` Configuration:** Inspects `<client>\ngo-client\.npmrc` and `%USERPROFILE%\.npmrc` (with secrets redacted), checks private scoped registries for valid credentials, and selects `npm ci --legacy-peer-deps` vs `npm install --legacy-peer-deps`.
6. **Stage 6 — Target Client Project & Working Tree Safety:** Detects installed backend (`.csproj`) and frontend (`package.json`) Core versions and checks `git status --porcelain`.
7. **Stage 7 — Release Resolution Preconditions:** Verifies source and target release evidence (tags `v<version>`, `releases/*` branches, or published package artifacts).
8. **Stage 8 — Readiness Verdict & Exact Command:** Outputs `READY TO UPGRADE` (or `BLOCKED` with exact fix commands) and prints the ready-to-run `upgrade-engine.js` command.

---

## 💻 How to Run an Upgrade

### Method 1 — Via VS Code Copilot Chat (`ngo-core-upgrade-orchestrator`)
1. Open Copilot Chat and select **`ngo-core-upgrade-orchestrator`** from the agent dropdown.
2. Send your prompt with the paths you verified in preflight:

| Goal | Example Prompt for `ngo-core-upgrade-orchestrator` |
| --- | --- |
| **Full-Stack Upgrade (Backend + Frontend)** | `Upgrade client C:\repos\ngo-online-shelterbox using Core C:\repos\ngo-online-core to 9.4.1.` |
| **Latest Release on a Branch** | `Upgrade C:\repos\ngo-online-shelterbox to the latest 9.4 release using Core at C:\repos\ngo-online-core.` |
| **Backend Only** | `Upgrade only the backend NGO.Core packages in C:\repos\ngo-online-shelterbox to 9.4.1 (Core path: C:\repos\ngo-online-core).` |
| **Frontend Only** | `Align only the frontend in C:\repos\ngo-online-shelterbox with Core 9.4.1 (Core path: C:\repos\ngo-online-core).` |
| **Resume a Saved Run** | `Resume the upgrade for ngo-online-shelterbox using its saved run state.` |

### Method 2 — Via the Local Web UI Platform (`node platform/start.js`)
```powershell
node platform/start.js
```
Open **`http://127.0.0.1:3800/`**:
1. Click **Settings** (top right) -> set **Approved Workspace Roots** (e.g. `C:\repos`) and **NGO Core Repository Path** (`C:\repos\ngo-online-core`).
2. Select your client repository and target version.
3. Review the **Preflight & Impact Preview** panel, then click **Start Upgrade**.

### Method 3 — Via the Deterministic Engine CLI (`engine/tools/upgrade-engine.js`)
```powershell
node engine/tools/upgrade-engine.js create-run `
  --client shelterbox `
  --tracks backend,frontend `
  --core-path "C:\repos\ngo-online-core" `
  --source-version 9.2.0 `
  --target-version 9.4.1 `
  --backend-client-path "C:\repos\ngo-online-shelterbox"
```

---

## 🔧 Troubleshooting Common Path & Auth Errors

| Error / Status | Cause | Exact Fix |
| --- | --- | --- |
| Agent asks for paths or cannot find `ngo-online-core` | Paths were not passed in the prompt and [`platform/config/settings.json`](platform/config/settings.json) still has `"D:\\NGO Client"`. | Update `corePath` and `approvedWorkspaceRoots` in [`platform/config/settings.json`](platform/config/settings.json), or include `Core path:` and `Client path:` in your prompt. |
| `GH_AUTH_OK_BUT_GIT_CREDENTIAL_MISSING` | `gh auth status` is logged in, but Git's `credential.helper` is not linked. | Run: `gh auth setup-git --hostname github.com` |
| `MULTIPLE_CANDIDATES_FOUND` | More than one valid `ngo-online-core` folder exists under your workspace roots. | Pass `--core-path "<chosen-path>"` explicitly or set `NGO_CORE_PATH`. |
| `SOURCE_MAPPING_BLOCKED` | `NuGet.Config` has `<packageSourceMapping>` without an `NGO.*` pattern. | Add `<packageSource key="<YourNGOFeed>"><package pattern="NGO.*" /></packageSource>` to `NuGet.Config`. |
| `UNAUTHENTICATED` (`HTTP 401` on NuGet) | Missing or expired Azure Artifacts token. | Run `dotnet restore --interactive` inside `<client>\ngo-api\` or run `az login`. |
| `FORBIDDEN` (`HTTP 403` on NuGet) | Logged-in Azure account lacks Reader permission on the feed. | Request **Feed Reader** access in Azure DevOps -> Artifacts -> Feed Settings -> Permissions. |
| `NPM_AUTH_REQUIRED` / `INCOMPLETE_VSS_OR_BASIC_AUTH` | `<client>\ngo-client\.npmrc` has a private registry or `username=VssSessionToken` without a token in `%USERPROFILE%\.npmrc`. | Run `npx vsts-npm-auth -config .npmrc` inside `<client>\ngo-client\` or add your token to `%USERPROFILE%\.npmrc`. |

---

## 📋 Where Results Go

| Output | Location |
| --- | --- |
| Combined report and deployment handover | `orchestrator/runs/<client>/<run-id>/` |
| Backend state, checkpoints, and evidence | `backend/runs/<client>/<run-id>/` |
| Frontend state, checkpoints, and evidence | `frontend/runs/<client>/<run-id>/` |
| Reusable Core candidate facts | `ingest/knowledge/candidates/releases/` |
| Shared `core-change-set.json` & `upgrade-context.json` | `orchestrator/runs/<client>/<run-id>/` |

---

## 📦 Install or Package for Another Machine

**Install into VS Code user profile from a Git repository:**
```powershell
# Windows
.\install.ps1 -RepoUrl https://github.com/<your-org>/NGO-Core-Upgrade.git

# Or from an existing local folder
.\install.ps1 -InstallDir "C:\repos\NGO-Core-Upgrade" -SkillsOnly
```

**Create a clean, portable `.zip` archive to share with coworkers:**
```powershell
.\package-agent.ps1 -OutputPath ".\dist"
```
`package-agent.ps1` strips machine-specific paths (`D:\NGO Client`), local run histories, and credential files so the zip is clean for any coworker's machine. See [IMPORT.md](IMPORT.md).

---

<a id="tests--validation"></a>

## 🧪 Tests & Framework Validation

Run from this repository's root:

```powershell
node tools/validate-all.js
```

This runs all **20 validation suites** and verifies that no tracked files were modified during testing.

---

## 📚 Developer Reference

| Area | Documentation |
| --- | --- |
| Routing, multi-machine protocol, and safety contract | [AGENTS.md](AGENTS.md) |
| Shared engine lifecycle and contracts | [engine/AGENTS.md](engine/AGENTS.md) |
| Shared release ingestion | [ingest/README.md](ingest/README.md) |
| Shared-run coordination | [orchestrator/README.md](orchestrator/README.md) |
| Backend executor workflow | [backend/README.md](backend/README.md) |
| Frontend executor workflow | [frontend/README.md](frontend/README.md) |
| Local Web UI platform | [platform/README.md](platform/README.md) |
| Portable packaging & import guide | [IMPORT.md](IMPORT.md) |

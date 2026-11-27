# NGO Core Upgrade 🚀

Plug-and-play upgrade agent & dashboard for **NGO.Core (.NET backend)** and **Angular frontend**.

Automates the entire upgrade lifecycle: verifies your environment, resolves target versions, aligns NuGet & npm packages, updates code, and validates **0 compile errors** before finishing.

Client upgrades are **command-first and build-gated**: the agent runs existing
tools instead of reading their JavaScript to simulate results, reads only the
relevant release/client slices, and reuses valid build evidence. It does not
create test/probe projects or run framework/unit/browser suites by default.
Optional tests are explicitly reported as **SKIPPED**, not passed; existing
targeted tests can still be requested or used for a concrete regression.
Installed-package, configuration/integration and planned EF migration/SQL
checks remain required. See [execution policy](engine/AGENTS.md#command-first-upgrade-execution).

---

## ⚡ Quick Start: 2 Ways to Run

### Option 1: Web UI Dashboard (Recommended)

Run the local web server:
```powershell
node platform/start.js
```
Open **`http://127.0.0.1:3800`** in your browser:
1. Select your client project from the dropdown.
2. Pick the target Core version (e.g. `9.4.1`, `9.5.0`).
3. Click **Preflight Check** &rarr; **Start Upgrade**.

---

### Option 2: Copilot / Antigravity Chat

1. Open this repo in VS Code.
2. Open chat, select the agent **`@ngo-core-upgrade-orchestrator`** (or paste directly).
3. Send your prompt:

```text
Upgrade my client project to NGO Core 9.4.1:
- Core path: D:\NGO Client\ngo-online-core
- Client path: D:\NGO Client\ngo-online-shelterbox
- Target version: 9.4.1
```

#### 💡 More Prompt Examples

| What You Want | Prompt |
| --- | --- |
| **Latest release on branch** (e.g. `9.4.x`) | `Upgrade client to latest 9.4 release:`<br>`- Core path: D:\NGO Client\ngo-online-core`<br>`- Client path: D:\NGO Client\ngo-online-shelterbox`<br>`- Target version: 9.4` |
| **Backend only** (`.NET / NuGet`) | `Upgrade only backend NGO.Core packages to 9.4.1:`<br>`- Core path: D:\NGO Client\ngo-online-core`<br>`- Client path: D:\NGO Client\ngo-online-shelterbox`<br>`- Target version: 9.4.1` |
| **Frontend only** (`Angular / npm`) | `Align only frontend with NGO Core 9.4.1:`<br>`- Core path: D:\NGO Client\ngo-online-core`<br>`- Client path: D:\NGO Client\ngo-online-shelterbox`<br>`- Target version: 9.4.1` |

---

## 🛠️ Common Fixes & Auth Setup

If preflight or package restore fails due to authentication or feeds:

| Issue | Solution (Run in PowerShell) |
| --- | --- |
| **NuGet 401 / Credential Provider** | `iex "& { $(irm https://aka.ms/install-artifacts-credprovider.ps1) }"` |
| **npm private feed 401** | `npx vsts-npm-auth -config .npmrc -Force` |
| **Core refs missing** | Run in Core repo: `git fetch --all --tags` |

> [!IMPORTANT]
> **Core is strictly READ-ONLY:** Never switch branches or modify files inside the `ngo-online-core` directory.

---

## 📂 Project Structure

```text
├── platform/      # Local Web UI dashboard (server, UI, diagnostics)
├── engine/        # Upgrade lifecycle coordinator & planning engine
├── backend/       # .NET / NuGet package alignment & verification
├── frontend/      # Angular / npm dependency alignment & verification
├── ingest/        # Core release evidence & version change analysis
└── tools/         # CLI preflight and verification utilities
```

---

<details>
<summary><strong>🔧 Developer CLI & Testing Reference</strong></summary>

### Manual Preflight Check
```powershell
node tools/check-environment.js --core-path "D:\NGO Client\ngo-online-core" --client-path "D:\NGO Client\ngo-online-shelterbox" --target 9.4.1 --save-settings
```

### Run Validation Tests
```powershell
# Targeted tests
node engine/tests/engine.test.js
node backend/tools/validate.js
node platform/tests/nuget-sources.test.js

# Complete framework validation
node tools/validate-all.js
```

### Package Portable Distribution
```powershell
.\package-agent.ps1 -OutputPath ".\dist"
```

**Architecture Contracts:** [AGENTS.md](AGENTS.md) · [engine/AGENTS.md](engine/AGENTS.md) · [backend/README.md](backend/README.md) · [frontend/README.md](frontend/README.md) · [platform/README.md](platform/README.md)

</details>

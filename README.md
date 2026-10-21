# NGO Core Upgrade

Plug-and-play upgrade agent for **NGO.Core (.NET backend)** and **Angular frontend**.

No manual configuration or script setup needed—just paste your prompt in Copilot Chat. The agent automatically checks your environment, saves your paths, guides you through any missing login, and executes the upgrade.

---

## ⚡ Plug & Play: How to Run

1. Open this repo in VS Code.
2. Open **Copilot Chat**, click the agent dropdown (next to `+`), and select **`ngo-core-upgrade-orchestrator`**.
3. Paste this prompt (replace with your paths and target version):

```text
Upgrade my client project to NGO Core 9.4.1:
- Core path: C:\repos\ngo-online-core
- Client path: C:\repos\ngo-online-shelterbox
- Target version: 9.4.1
```

### ✨ What the Agent Does Automatically

- **Auto-Configures Paths:** Saves your `Core path` and `Client path` to settings automatically.
- **Preflight Check:** Verifies Git, GitHub access, Core release branches/packages, NuGet feeds, and npm.
- **Guided Fixes:** If any login or feed is missing, the agent gives you the exact one-click command to fix it and re-verifies automatically.
- **Executes Upgrade:** Upgrades Backend and Frontend in parallel, ensuring **0 build errors** before completion.

---

## 💬 Prompt Examples

| What You Want | Copy-Paste Prompt |
| --- | --- |
| **Full Upgrade (Backend + Frontend)** | `Upgrade my client project to NGO Core 9.4.1:`<br>`- Core path: C:\repos\ngo-online-core`<br>`- Client path: C:\repos\ngo-online-shelterbox`<br>`- Target version: 9.4.1` |
| **Latest Release on Branch (e.g. `9.4.x`)** | `Upgrade my client project to the latest 9.4 release:`<br>`- Core path: C:\repos\ngo-online-core`<br>`- Client path: C:\repos\ngo-online-shelterbox`<br>`- Target version: 9.4` |
| **Backend Only (`.NET / NuGet`)** | `Upgrade only the backend NGO.Core packages:`<br>`- Core path: C:\repos\ngo-online-core`<br>`- Client path: C:\repos\ngo-online-shelterbox`<br>`- Target version: 9.4.1` |
| **Frontend Only (`Angular / npm`)** | `Align only the frontend with NGO Core 9.4.1:`<br>`- Core path: C:\repos\ngo-online-core`<br>`- Client path: C:\repos\ngo-online-shelterbox`<br>`- Target version: 9.4.1` |

---

## 🌐 Optional: Local Web UI Dashboard

Prefer a visual dashboard instead of chat?
```powershell
node platform/start.js
```
Open **`http://127.0.0.1:3800/`** to select projects, preview impact, and run upgrades visually.

---

<a id="tests--validation"></a>

<details>
<summary><strong>🛠️ Developer Reference & Validation</strong></summary>

### Preflight CLI (Manual Check)
```powershell
node tools/check-environment.js --core-path "C:\repos\ngo-online-core" --client-path "C:\repos\ngo-online-shelterbox" --target 9.4.1 --save-settings
```

### Run Framework Tests
```powershell
node tools/validate-all.js
```

### Package for Distribution
```powershell
.\package-agent.ps1 -OutputPath ".\dist"
```

**Architecture Contracts:** [AGENTS.md](AGENTS.md) · [engine/AGENTS.md](engine/AGENTS.md) · [backend/README.md](backend/README.md) · [frontend/README.md](frontend/README.md) · [platform/README.md](platform/README.md)

</details>

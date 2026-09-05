# Importing the NGO Core Upgrade Agent Onto Another Computer

**This "agent" is just files.** There is no installer, binary, server, or license.
The engine that runs it is **GitHub Copilot** (VS Code or the Copilot CLI), which you
already have. "Installing" it on another machine means *getting this folder onto that
machine where Copilot can see it.* Pick ONE of the three options below.

---

## Prerequisites on the target computer
- **VS Code** + the **GitHub Copilot** extension, signed in to an account with Copilot access.
- **Node.js 14+** — only needed when the agent runs its CLI / validation scripts
  (`node tools/validate.js`, etc.). Both CLIs are dependency-free, so there is **no
  `npm install`** step.
- **Git** — for the recommended install path below.

---

## Option 0 — One-command install from Git (recommended) 🚀
This clones the repo **and** registers the skills + custom agents into your Copilot user
profile (`~/.copilot/skills`, `~/.copilot/agents`), so they work in **every** VS Code
workspace and the Copilot CLI — you don't have to open this folder each time.

**Windows (PowerShell):**
```powershell
git clone <repo-url> "$HOME\NGO-Core-Upgrade"
& "$HOME\NGO-Core-Upgrade\install.ps1" -InstallDir "$HOME\NGO-Core-Upgrade"
```
Or, once you have the folder (clone or unzip), just run the installer — it can clone for you:
```powershell
.\install.ps1 -RepoUrl <repo-url>
```

**macOS / Linux (bash):**
```bash
git clone <repo-url> "$HOME/NGO-Core-Upgrade"
"$HOME/NGO-Core-Upgrade/install.sh" --dir "$HOME/NGO-Core-Upgrade"
# or: ./install.sh --repo <repo-url>
```

**Update later** (pulls latest and re-registers): re-run the same command.
**Uninstall:** `./uninstall.ps1` (or `./uninstall.sh`) — unregisters the skills/agents but
keeps the cloned folder.

> The installer stamps each registered file with the absolute install location, so the
> agent still finds the `backend/` and `frontend/` workflow folders even
> though the skill files now live under `~/.copilot/`.

Prefer to keep it scoped to just this workspace instead of user-wide? Skip the installer
and use Option A or B below — the `.github/skills` and `.github/agents` in the repo are
auto-discovered whenever the folder is open in VS Code.

---

## Option A — Git clone (recommended for a team)
Keeps everyone in sync; future updates are a `git pull`.

1. **Once, on the source computer**, push this repo to a Git host (GitHub / Azure DevOps):
   ```powershell
   cd "<path>\NGO Core Upgrade"
   git remote add origin <empty-repo-url>
   git push -u origin master
   ```
2. **On the target computer**, clone it:
   ```powershell
   git clone <same-repo-url> "NGO Core Upgrade"
   ```
3. Open the cloned folder in VS Code. Done — the clone *is* the install.

## Option B — Zip / copy (no Git host needed)
1. On the source computer, build a zip (excludes `.git` and local run state):
   ```powershell
   .\package-agent.ps1
   ```
   (or manually: `Compress-Archive -Path .\* -DestinationPath ngo-core-upgrade-agent.zip`)
2. Move the zip to the target computer (USB / network share / OneDrive) and unzip it
   anywhere.
3. Open the unzipped folder in VS Code. Same result as a clone.

## Option C — Make the agents available in EVERY workspace (user-level)
Options A/B expose the agents only when *this folder* is open. To make the two upgrade
agents show up in **all** of your VS Code workspaces on the target machine, also copy the
entry-point files into your user profile there:
```powershell
Copy-Item ".\.github\agents\*.agent.md" "$env:USERPROFILE\.copilot\agents\" -Force
Copy-Item ".\.github\skills\*" "$env:USERPROFILE\.copilot\skills\" -Recurse -Force
```
> The skills/agents still reference the `backend\` and `frontend\`
> folders for the actual workflow, so those folders must still exist on the machine
> (via Option A or B). Option C only makes the *entry points* globally visible.

---

## Verify it worked (on the target computer)
1. Open Copilot Chat → agent mode → confirm **NGO Core Upgrade Orchestrator**, **NGO Core
   Backend Upgrade Agent**, and **NGO Core Frontend Upgrade Agent** all appear in the
   agent picker.
2. Command Palette → **Chat: Open Customizations** → **Skills** tab → all three of
   `ngo-core-upgrade-orchestrator`, `ngo-core-backend-upgrade`, and
   `ngo-core-frontend-upgrade` are listed.
3. Sanity-check the tooling:
   ```powershell
   cd ingest;         node tools/ingest.test.js
   cd ..\backend;  node tools/validate.js
   cd ..\frontend; node tools/validate.js; node tools/repo-layout.test.js
   ```
4. Start a run by either picking an agent from the picker, or just typing a request like
   `Upgrade NGO Core packages to 9.2.1 for <client>` — Copilot auto-discovers the matching
   skill (the orchestrator if no single track is named).

---

## Handing off an in-progress run
Per-run state lives under `backend\runs\<client>\<run-id>\` (and the Frontend
equivalent). To continue a run started on another machine, copy just that specific
`runs\<client>\<run-id>\` folder across, then tell the agent to resume it. Shared
Core-release knowledge lives under `ingest\knowledge\candidates\releases\` — copy it
too if you want the target machine to skip re-ingesting a version already covered.

---

## Using the agent against a client project (two-folder model)
You do **not** copy this agent into the client repo. Keep two separate folders:

```
NGO Core Upgrade\      <- this agent (clone/unzip ONCE, reuse for every client)
YourClientSolution\    <- the project to upgrade (its own repo, stays clean)
```

The agent reads/edits the client solution and writes its plan/report to the client's
solution root, but its own machinery (skills, workflow, CLIs, run state) stays in this
folder. Two ways to run it:

- **Recommended — one VS Code window with both folders.** Use the provided
  [`ngo-core-upgrade.code-workspace`](ngo-core-upgrade.code-workspace) template: copy it,
  edit the second folder path to your client solution, then open it. Copilot then sees the
  agent's skills *and* the client code together.
- **Simpler — open only this folder** and give the client path in the prompt, e.g.
  `Upgrade NGO Core packages to 9.2.1. Client solution: D:\Clients\Acme\Acme.sln`.


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
> The skills/agents still reference the `Backend-Upgrade\` and `Frontend-Upgrade\`
> folders for the actual workflow, so those folders must still exist on the machine
> (via Option A or B). Option C only makes the *entry points* globally visible.

---

## Verify it worked (on the target computer)
1. Open Copilot Chat → agent mode → confirm **NGO Core Backend Upgrade Agent** and
   **NGO Core Frontend Upgrade Agent** appear in the agent picker.
2. Command Palette → **Chat: Open Customizations** → **Skills** tab → both
   `ngo-core-backend-upgrade` and `ngo-core-frontend-upgrade` are listed.
3. Sanity-check the tooling:
   ```powershell
   cd Backend-Upgrade;  node tools/validate.js
   cd ..\Frontend-Upgrade; node tools/validate.js; node tools/repo-layout.test.js
   ```
4. Start a run by either picking an agent from the picker, or just typing a request like
   `Upgrade NGO Core packages to 9.2.1 for <client>` — Copilot auto-discovers the skill.

---

## Handing off an in-progress run
Per-run state lives under `Backend-Upgrade\runs\<client>\<run-id>\` (and the Frontend
equivalent). To continue a run started on another machine, copy just that specific
`runs\<client>\<run-id>\` folder across, then tell the agent to resume it.

# NGO Core Upgrade Platform

A local, UI-driven upgrade platform for managing NGO Core upgrades across client applications.

The platform provides a browser-based user interface for configuring, starting, monitoring, verifying, and committing NGO Core upgrades. It uses **deterministic local tools** for version discovery, package inspection, compilation, and testing, invoking **GitHub Copilot CLI** strictly for semantic reasoning, code changes, justified repairs, and final diff reviews.

---

## 🚀 Quick Start

From the repository root:

```bash
# Start the local server on default port 3800 (bound strictly to 127.0.0.1)
node platform/start.js

# Or specify a custom port:
node platform/start.js 4000
```

Open your browser to: **`http://127.0.0.1:3800/`**

---

## 🖥️ UI Workflow

1. **Client Project Selection**: Select a client repository from the dropdown. The platform scans sibling workspaces (e.g. `d:\NGO Client\ngo-online-*`) and extracts installed backend (`.csproj`) and frontend (`package.json`) versions.
2. **Target Version Selection**: Pick from available Core release versions discovered via package manifests, candidate records, and Core Git tags.
3. **Preflight Inspection**: Click **Run Preflight Check** to execute deterministic release resolution via the evidence-based resolver. The UI reports the resolution mode (`FULL`, `PACKAGE_FIRST`, or `REDUCED_EVIDENCE`), package publication status, source diff availability, and any blockers or warnings.
4. **Execution & Live Monitoring**: Click **Start Upgrade**. The UI switches to the live monitor:
   - Stepper tracks stages: `Preflight` &rarr; `Core Ingest` &rarr; `Plan` &rarr; `Implement` &rarr; `Verify` &rarr; `Review`.
   - Real-time execution log terminal streams live output.
   - Interactive **Cancel** and **Resume** buttons provide process control.
5. **Deterministic Local Verification**: View the results of local builds, tests, and package surface checks in an interactive table with exact durations and exit codes.
6. **Final Diff Review & Commit Gate**:
   - Inspect the visual Git diff.
   - Read the Copilot semantic review summary.
   - Review or edit the commit message.
   - Click **Approve & Commit Locally** to commit changes to the client repository. (The platform **never** automatically pushes to a remote Git repository).

---

## 🧠 Copilot CLI Integration

The platform includes a dedicated Copilot CLI adapter ([`platform/copilot-cli.js`](copilot-cli.js)):
- **Subprocess Execution**: Spawns `copilot` or `gh copilot` as a child process with a scoped task and relevant context files.
- **Auto-Discovery**: Automatically discovers `gh copilot` or standalone `copilot` from system PATH or via the `COPILOT_CLI_PATH` environment variable.
- **Safety & Secret Scrubbing**: Redacts tokens, passwords, and sensitive keys from task prompts and output logs.
- **Timeout & Cancellation**: Enforces a 180s process timeout; supports immediate graceful cancellation (`SIGTERM`).
- **Offline / Simulator Mode**: Check **Simulation Mode** in the UI or set `COPILOT_SIMULATOR=true` to test and run upgrades in offline or test environments without requiring active Copilot CLI authentication.

---

## 🛡️ Deterministic Local Verification

Verification runs locally **without LLM dependency**:
- **Package Versions**: Validates `<PackageReference Include="NGO.Core*" Version="..." />` and `package.json`.
- **.NET Solution Build**: Runs `dotnet build` on the backend solution.
- **.NET Tests**: Runs `dotnet test` on test projects when available.
- **Frontend Build**: Runs `npm run build` or Angular verification checks.
- **Git Surface**: Inspects `git status --porcelain` and `git diff --stat` to verify changes are bounded.

### Bounded Repair Loop
If local verification fails, the worker enters an automated repair loop (strictly capped at **2 attempts**):
1. Summarizes the build/test error.
2. Invokes Copilot CLI for semantic diagnosis and code adjustment.
3. Re-runs deterministic verification checks.

---

## 📁 Run State & Log Locations

All run state and evidence are persisted under the shared orchestrator runs directory:
```
orchestrator/runs/<client-id>/<run-id>/platform/
├── job.json          # Durable job state, stages, verification and review records
├── worker.log        # Full sequential execution logs
└── candidates/       # Ingested Core candidate facts
```

---

## 🔒 Security Boundaries

- **Localhost Binding**: Server binds strictly to `127.0.0.1`.
- **Workspace Isolation**: Execution is restricted to valid workspace paths; arbitrary command injection is disallowed.
- **Workspace Locking**: Prevents concurrent conflicting upgrades on the same client repository.
- **Read-Only Core**: The local NGO Core repository checkout is strictly read-only.
- **No Remote Push**: Commits are strictly local. Pushing to remote repositories requires manual developer action.

---

## 🧪 Testing

Run the automated platform test matrix (10 regression tests):
```bash
node platform/tests/platform.test.js
```

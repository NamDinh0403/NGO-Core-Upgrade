# New developer setup

You do **not** need every specialist tool to start. Planning works with only
repository inspection and normal development prerequisites.

## Steps
1. Clone the repository.
2. Read `README.md`.
3. Run the doctor:
   ```
   node tools/upgrade-agent.js doctor
   ```
   It reports required prerequisites (per detected technology), lists optional
   capabilities without forcing you to install them, and prints
   `READY_FOR_PLANNING` when planning can proceed.
4. See which normal prerequisites are available (Git, .NET SDK, package manager).
5. See optional tools (ApiCompat, ILSpyCmd, TypeScript scanner) — you are **not**
   required to install them. They are activated lazily only when a plan needs them.
6. Create a plan (read-only):
   ```
   node tools/upgrade-agent.js plan --client <id> --run <run-id>
   ```
7. Review `runs/<id>/<run-id>/plan.yaml` and `uncertainty-register.yaml`.
8. Let the system activate only the Level 2 tools the plan actually requires.
9. Run or resume through one stable entry point:
   ```
   node tools/upgrade-agent.js run    --client <id> --run <run-id>
   node tools/upgrade-agent.js resume --client <id> --run <run-id>
   ```
10. Inspect progress:
   ```
   node tools/upgrade-agent.js status --client <id> --run <run-id>
   ```

## Notes
- Optional tools missing is **not** a setup failure.
- Only Level 1 prerequisites (Git, and the SDK/package manager for the detected
  technology) are required, and they are never auto-installed — if missing, doctor
  tells you exactly what to install and how to resume.
- Cross-platform: the same `node tools/upgrade-agent.js ...` entry point works on
  Windows and Linux; `tools/upgrade-agent.ps1` and `tools/upgrade-agent` are thin shims.

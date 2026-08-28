# tools/repository

Repository helpers.

- Lock files: delete `packages.lock.json` before restore (shell-appropriate command).
- Encoding repair: `../tools/Fix-Mojibake.ps1` (legacy path, retained).
- Change tracking: every mutation is appended to `actions.jsonl` with an
  `idempotencyKey` so resume never re-applies a completed mutation.

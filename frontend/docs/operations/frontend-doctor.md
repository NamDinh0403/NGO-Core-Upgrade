# Doctor - dual-repository preflight

`doctor` inspects both repositories from one process and changes nothing. It is the fast,
read-only way to confirm a run can proceed.

```
node tools/frontend-upgrade-agent.js doctor \
  --client-path <client> --core-path <core> \
  --source-version 8.3.0 --target-version 9.2.0
```

## What it checks

1. **Request validity** - all four inputs are present and well-formed
   (`tools/lib/request.js`). A missing path yields `BLOCKED_INVALID_REQUEST` with the exact
   field(s) at fault (rather than crashing).
2. **Client repository** - the path exists and looks like an Angular/NGO client
   (`package.json` present, depends on `ngo-core`, has an Angular workspace).
3. **Core repository** - the path exists and is the NGO Core repository
   (`package.json` name `ngo-core`, expected library layout).
4. **Source version agreement** - the client's declared `ngo-core` version matches
   `--source-version`; a mismatch is `BLOCKED_VERSION_MISMATCH`.
5. **Distinct, non-nested paths** - client and Core must be different repositories and
   neither may be nested inside the other (contradiction detection).
6. **Core fingerprint** - records Core's git identity and key-file hashes so later stages
   can prove Core was unchanged.

## Result statuses

| Status | Meaning |
| --- | --- |
| `READY_FOR_INVENTORY` | Both repositories valid; proceed to inventory/analysis. |
| `READY_FOR_PLANNING`  | Preconditions satisfied; planning may proceed. |
| `BLOCKED_INVALID_REQUEST` | An input is missing/malformed (see `requestErrors`). |
| `BLOCKED_INVALID_CLIENT_REPOSITORY` | Client path is not a valid client front-end. |
| `BLOCKED_INVALID_CORE_REPOSITORY`   | Core path is not the NGO Core repository. |
| `BLOCKED_VERSION_MISMATCH` | Client's `ngo-core` version != `--source-version`. |
| `BLOCKED_MISSING_PREREQUISITE` | A required tool/condition is absent. |
| `BLOCKED_NEEDS_DEVELOPER` | A contradiction or ambiguity needs a human. |

The doctor report validates against `schemas/doctor-report.schema.json`.

## Read-only guarantees

- Neither repository is written. Core is only read; its working tree/branch/index are
  never changed. If `--target-ref` differs from the Core checkout, the target is read via a
  disposable worktree under `runs/<client>/<run-id>/research/core-target/`.
- `doctor` is safe to run repeatedly.

## Typical fixes

- `BLOCKED_INVALID_REQUEST` - supply the missing `--client-path` / `--core-path` /
  `--source-version` / `--target-version` (or `--target-ref`).
- `BLOCKED_VERSION_MISMATCH` - confirm which Core version the client actually integrates;
  set `--source-version` to match `package.json`, or check out the right client branch.
- `BLOCKED_INVALID_CORE_REPOSITORY` - point `--core-path` at the NGO Core repository (the
  one whose `package.json` name is `ngo-core`), not the client.
- contradiction - ensure client and Core are two separate directories.

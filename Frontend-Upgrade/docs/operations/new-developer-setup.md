# New developer setup

The front-end upgrade agent has **no runtime dependencies** and installs nothing. If you
can run Node and Git, you can run it.

## Prerequisites

- **Node.js 14 or newer** - `node -v`.
- **Git** - `git --version` (used read-only against the local NGO Core; and to checkpoint
  the client if the client is a git repository).
- A local clone of the **client front-end repository** (you may modify this).
- A local clone of the **NGO Core repository** at, or containing, the target version/ref
  (this is read-only; it is never modified or switched).

There is no `npm install` step for the agent itself.

## Verify your checkout

From `Frontend-Upgrade/`:

```
node tools/validate.js         # schema / config / registry / skill integrity -> VALID
node tools/repo-layout.test.js # repository tree conforms -> LAYOUT OK
node tools/skills.test.js      # skill IO + behaviour -> all pass
node tools/run-evals.js        # end-to-end read-only pipeline + gates -> all pass
```

All four run offline against fixtures in `evals/fixtures/`.

## First run (read-only, safe)

`doctor` inspects both repositories and changes nothing:

```
node tools/frontend-upgrade-agent.js doctor \
  --client-path <path-to-client> \
  --core-path   <path-to-local-ngo-core> \
  --source-version 8.3.0 \
  --target-version 9.2.0
```

A `READY_FOR_INVENTORY` or `READY_FOR_PLANNING` result means both repositories are valid
and the versions agree. Anything `BLOCKED_*` explains what to fix (see
[frontend-doctor.md](frontend-doctor.md)).

## Start the pipeline

```
node tools/frontend-upgrade-agent.js start \
  --client-path <path-to-client> \
  --core-path   <path-to-local-ngo-core> \
  --source-version 8.3.0 \
  --target-version 9.2.0
```

`start` runs read-only through planning and writes all artifacts under
`runs/<client>/<run-id>/`. Review the plan and uncertainty register, then continue with
`--execute` (or the `run` command) to apply gated, client-only changes. See
[frontend-upgrade.md](frontend-upgrade.md).

## Convenience wrappers

- Windows: `tools/frontend-upgrade-agent.ps1 start -ClientPath ... -CorePath ...`
- bash: `tools/frontend-upgrade-agent start --client-path ... --core-path ...`

Both forward to `tools/frontend-upgrade-agent.js`.

## What you never have to do

- No second session, no opening the client and Core "separately".
- No copying `client-snapshot.md` / `html-snapshot.md` / `html-delta.md` between sessions -
  those artifacts are removed. All state lives under `runs/<client>/<run-id>/`.
- No manually choosing dependency versions - exact target versions come from Core.

# runs/

Durable, per-run working directories: `runs/<client>/<run-id>/`.

Each run holds its own `state.json`, decision/action/event logs, checkpoints,
evidence, and read-only planning artifacts (inventories, semantic graphs, package
manifest, release range, applicable requirements, requirement coverage, missing
steps, deployment checklist, AppSettings coverage, plan, uncertainty register,
audit report).

**Run output is generated and must not be committed** (see `.gitignore` and
`config/repository-layout-policy.yaml`). This `README.md` is the only tracked file
under `runs/`. Do not delete evidence from an active run just because it is
git-ignored.

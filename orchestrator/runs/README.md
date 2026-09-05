# orchestrator/runs/

Durable shared-run state, one directory per client engagement:
`runs/<client>/<run-id>/`. This is local execution state, not repository
content — actual run directories are git-ignored (see `../.gitignore`), only
this placeholder is tracked.

This directory holds the *shared* run this orchestrator module owns
(request, normalized requirements, composed results, merged coverage, merged
deployment handover, final report). It never duplicates or replaces either
track's own `backend/runs/<client>/<run-id>/` or
`frontend/runs/<client>/<run-id>/` — those remain each track's own execution
detail, referenced by path (`backendRunRef` / `frontendRunRef` in
`state.json`), not copied wholesale.

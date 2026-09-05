# Remove a client's retained memory

Follow `config/retention-policy.yaml#deletion`. This safely removes a client's
retained data without corrupting global, approved knowledge.

## Steps
1. Delete the run evidence: `runs/<sanitized-client-id>/` (raw client artifacts).
2. Delete episodes scoped to that client: any `memory/episodes/**` record with
   `clientScope == <client>`.
3. Detach or delete candidate patterns whose **only** evidence came from that
   client (`memory/candidates/**` where `successfulEvidence`/`failedEvidence`
   reference only that client's runs/episodes).
4. Keep approved patterns **only** if their evidence was already redacted and
   re-sourced (no client identifier remains). Otherwise deprecate them.

## Verify
- Search global/approved scope for the client id; there must be zero matches:
  ```
  # from backend/
  Get-ChildItem -Recurse memory/approved, Knowledge | Select-String -Pattern "<client>"
  ```
- Re-run `node tools/validate.js` and the cross-client isolation scenario in
  `node tools/run-evals.js`.

## Principle
Client-specific business rules and source-code bodies must never have entered
global memory in the first place (`config/retention-policy.yaml#redaction`). This
procedure is a backstop, not the primary control.

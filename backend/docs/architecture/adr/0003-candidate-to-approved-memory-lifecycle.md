# ADR 0003 — Candidate → approved memory lifecycle with client isolation

- Status: accepted
- Date: 2026-08-13

## Context
A successful client-specific fix could previously be copied straight into global
knowledge, risking corruption of canonical facts and leakage of client-specific
information.

## Decision
Introduce a four-tier memory model (`episodes` → `candidates` → `approved` →
`rejected`) with an explicit promotion lifecycle requiring validation, regression
replay, and developer approval before anything reaches `approved`/canonical.
Candidate memory is labelled and never applied as an authoritative fix. Records
are client-scoped; cross-client retrieval of unapproved memory is forbidden and
secrets/PII are redacted before any reusable record is created
(`config/retention-policy.yaml`).

## Consequences
- Global knowledge cannot be corrupted by a one-off success.
- Rejected patterns are retained with reasons so unsafe approaches are not rediscovered.
- Isolation is verifiable (`tools/run-evals.js` cross-client scenario).

# ADR 0001 — Additive, compatibility-preserving refactor

- Status: accepted
- Date: 2026-08-13

## Context
The existing repository is entirely prompt/markdown + JSON knowledge with no
executable orchestration. The knowledge layer (routing table + granular JSON
registries) is already well structured and is the single source of truth. The
missing pieces are durable orchestration, isolated runs, escalation, a memory
lifecycle, schemas, validation, and client isolation.

## Decision
Refactor additively. Preserve the legacy layer in place and build the new
durable-workflow machinery around it, wiring to the existing knowledge via
`knowledge/index/manifest.json` without duplicating any canonical record.

## Consequences
- No big-bang rewrite; in-flight runs keep working; low risk.
- Two entry points existed during the additive phase (`AGENTS.md` preferred, plus a legacy boot document) — the legacy entry point was removed in the FINAL_CUTOVER; `AGENTS.md` is now the sole entry point.
- Some narrative Markdown overlaps the JSON registries; it is explicitly labelled derived, not authoritative.

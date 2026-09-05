# tools/documentation

Documentation contract for Phase 07 (Document).

- Assemble `upgrade-report-YYYY-MM-DD.md` from `templates/client-upgrade-report.md`
  using run artifacts (`changed-files.json`, `test-results.json`, decisions).
- Write `documentation-status.json` with every required item
  (see `config/quality-gates.yaml.gates.documentation-complete.requiredItems`).
- The report is reproducible: given the same run artifacts, the same report is
  produced. The completion gate reads `documentation-status.json` — a run with any
  pending item becomes `DOCUMENTATION_PENDING`, never `COMPLETE`.

# Evaluation Metrics

Computed by `tools/run-evals.js` (behavioural) and tracked over real runs.

| Metric | Definition | Target |
|--------|-----------|--------|
| end-to-end-completion-rate | runs reaching COMPLETE / total | maximize |
| resume-success-rate | interrupted runs that resume correctly / interrupted | 100% (controlled) |
| silent-stop-rate | runs ending with no terminal/blocked status | **0** |
| repeated-failure-rate | issues hitting max attempts / total issues | minimize |
| build-success-rate | runs with green build / total | maximize |
| test-success-rate | runs with passing tests / runs with tests | maximize |
| documentation-completion-rate | runs with all doc items / total | 100% at COMPLETE |
| correct-escalation-rate | correct escalations / situations requiring escalation | maximize |
| incorrect-pattern-application-rate | candidate/inapplicable patterns applied as authoritative | **0** |
| cross-client-isolation-failures | approved/global records carrying a client id | **0** |
| developer-intervention-frequency | escalations / run | track |
| context-size-per-phase | tokens/records in the context packet per phase | bound |
| candidate-approval-rate | candidates later approved / candidates decided | track |

The controlled eval scenarios in `evals/regression-cases/cases.json` must yield a
silent-stop-rate of 0 and an incorrect-pattern-application-rate of 0.

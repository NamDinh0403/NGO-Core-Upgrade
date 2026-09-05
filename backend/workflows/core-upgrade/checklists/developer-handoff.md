# Developer Handoff Checklist

Use when a run reaches a blocked status. The handoff must be actionable — never
merely "the agent could not solve the problem."

- [ ] Run status is one of `BLOCKED_NEEDS_CONTEXT`, `BLOCKED_NEEDS_DEVELOPER`, `BLOCKED_NEEDS_APPROVAL`, `FAILED_POLICY`, `FAILED_BUDGET`, `CANCELLED`.
- [ ] A checkpoint was saved.
- [ ] Logs and diffs preserved under the run directory.
- [ ] Unverified changes reverted where safe and permitted.
- [ ] `templates/developer-escalation.md` generated and filled.
- [ ] Every attempted fix listed with the reason it failed.
- [ ] The exact decision or information required is stated.
- [ ] The safest resume point is stated.
- [ ] The exact resume instruction is stated (`state.json.safeResumeInstruction`).
- [ ] `documentation-status.json` reflects current reality.
- [ ] An episode was produced capturing the blocked outcome.

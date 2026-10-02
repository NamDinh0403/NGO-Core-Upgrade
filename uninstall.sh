#!/usr/bin/env bash
# Unregisters the NGO Core Upgrade skills and custom agents from your Copilot user profile.
# Does NOT delete the cloned agent folder itself.
set -euo pipefail
CH="$HOME/.copilot"
for t in \
  "$CH/skills/ngo-core-backend-upgrade" \
  "$CH/skills/ngo-core-frontend-upgrade" \
  "$CH/skills/ngo-core-upgrade-orchestrator" \
  "$CH/agents/ngo-core-backend-upgrade.agent.md" \
  "$CH/agents/ngo-core-frontend-upgrade.agent.md" \
  "$CH/agents/ngo-core-upgrade-orchestrator.agent.md"; do
  if [[ -e "$t" ]]; then rm -rf "$t"; echo "  - removed $t"; fi
done
echo "Unregistered. The cloned agent folder (if any) was left in place."

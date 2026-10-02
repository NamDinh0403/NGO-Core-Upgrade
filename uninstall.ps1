<#
.SYNOPSIS
  Unregisters the NGO Core Upgrade skills and custom agents from your Copilot user profile.

.DESCRIPTION
  Removes ~/.copilot/skills/ngo-core-* and ~/.copilot/agents/ngo-core-*.agent.md.
  Does NOT delete the cloned agent folder itself.

.EXAMPLE
  .\uninstall.ps1
#>
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$copilotHome = Join-Path $HOME '.copilot'
$targets = @(
    (Join-Path $copilotHome 'skills\ngo-core-backend-upgrade'),
    (Join-Path $copilotHome 'skills\ngo-core-frontend-upgrade'),
    (Join-Path $copilotHome 'skills\ngo-core-upgrade-orchestrator'),
    (Join-Path $copilotHome 'agents\ngo-core-backend-upgrade.agent.md'),
    (Join-Path $copilotHome 'agents\ngo-core-frontend-upgrade.agent.md'),
    (Join-Path $copilotHome 'agents\ngo-core-upgrade-orchestrator.agent.md')
)
foreach ($t in $targets) {
    if (Test-Path $t) { Remove-Item $t -Recurse -Force; Write-Host "  - removed $t" }
}
Write-Host "Unregistered. The cloned agent folder (if any) was left in place."

<#
.SYNOPSIS
  Unregisters the NGO Core Upgrade skills and custom agents from your Copilot user profile.

.DESCRIPTION
  Removes <CopilotHome>/skills/ngo-core-* and <CopilotHome>/agents/ngo-core-*.agent.md.
  Does NOT delete the cloned agent folder itself.

.PARAMETER CopilotHome
  Where the skills/agents were registered. Default: ~/.copilot.

.EXAMPLE
  .\uninstall.ps1
#>
[CmdletBinding()]
param(
    [string]$CopilotHome = (Join-Path $HOME '.copilot')
)
$ErrorActionPreference = 'Stop'
$copilotHome = $CopilotHome
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

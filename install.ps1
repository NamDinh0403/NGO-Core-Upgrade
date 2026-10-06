<#
.SYNOPSIS
  Installs (or updates) the NGO Core Upgrade agent from Git and registers its skills and
  custom agents with GitHub Copilot at the user level.

.DESCRIPTION
  1. Clones the repository (or `git pull`s it if already cloned) into -InstallDir.
  2. Copies the discoverable Agent Skills and custom agents into your Copilot user profile
     (~/.copilot/skills and ~/.copilot/agents) so they are available in EVERY VS Code
     workspace and in the Copilot CLI — no need to open this folder each time.

  Re-run any time to update to the latest version (idempotent).

.PARAMETER RepoUrl
  The Git URL to clone from (e.g. https://github.com/<org>/ngo-core-upgrade.git).
  Omit if the agent is already cloned and you only want to (re)register the skills — then
  pass -InstallDir pointing at the existing clone.

.PARAMETER InstallDir
  Where to clone/find the agent. Default: ~/NGO-Core-Upgrade.

.PARAMETER SkillsOnly
  Skip clone/update; only (re)register skills and agents from -InstallDir.

.PARAMETER CopilotHome
  Where to register the skills/agents. Default: ~/.copilot. Override to install into an
  alternate profile or to smoke-test the installer without touching your real profile.

.EXAMPLE
  # First install on a new machine, from a Git host:
  .\install.ps1 -RepoUrl https://github.com/acme/ngo-core-upgrade.git

.EXAMPLE
  # Update an existing install and re-register:
  .\install.ps1 -InstallDir "$HOME\NGO-Core-Upgrade"

.EXAMPLE
  # Register skills from an already-cloned/unzipped copy without touching Git:
  .\install.ps1 -InstallDir "D:\tools\NGO Core Upgrade" -SkillsOnly
#>
[CmdletBinding()]
param(
    [string]$RepoUrl,
    [string]$InstallDir = (Join-Path $HOME 'NGO-Core-Upgrade'),
    [switch]$SkillsOnly,
    [string]$CopilotHome = (Join-Path $HOME '.copilot')
)

$ErrorActionPreference = 'Stop'

function Write-Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }

# --- 1. Clone or update -------------------------------------------------------
if (-not $SkillsOnly) {
    if (Test-Path (Join-Path $InstallDir '.git')) {
        Write-Step "Updating existing clone at $InstallDir"
        git -C $InstallDir pull --ff-only
    }
    elseif ($RepoUrl) {
        Write-Step "Cloning $RepoUrl -> $InstallDir"
        git clone $RepoUrl $InstallDir
    }
    elseif (Test-Path $InstallDir) {
        Write-Step "No -RepoUrl given; using existing folder at $InstallDir (not a git clone)"
    }
    else {
        throw "No -RepoUrl provided and nothing found at $InstallDir. Pass -RepoUrl to clone."
    }
}

# --- 2. Locate the customization sources -------------------------------------
$skillsSrc = Join-Path $InstallDir '.github\skills'
$agentsSrc = Join-Path $InstallDir '.github\agents'
if (-not (Test-Path $skillsSrc)) { throw "Skills not found at $skillsSrc — is -InstallDir correct?" }

# --- 3. Register at the Copilot user level -----------------------------------
$copilotHome = $CopilotHome
$skillsDst   = Join-Path $copilotHome 'skills'
$agentsDst   = Join-Path $copilotHome 'agents'
New-Item -ItemType Directory -Force -Path $skillsDst, $agentsDst | Out-Null

$agentRoot = (Resolve-Path $InstallDir).Path
$stampHeader = '<!-- NGO-INSTALL-STAMP -->'
$stampNote = @"
$stampHeader
> **Installed agent location:** ``$agentRoot``
> This file was registered at the user level by ``install.ps1``. The relative links below
> may not resolve from here — resolve root ``AGENTS.md`` and every ``ingest/``, ``engine/``, ``orchestrator/``, ``backend/`` and ``frontend/``
> reference against the installed agent location above.
"@

function Add-InstallStamp([string]$file) {
    $content = Get-Content -Raw -LiteralPath $file
    if ($content -match [regex]::Escape($stampHeader)) { return }  # already stamped
    if ($content -match '(?s)^(---\r?\n.*?\r?\n---\r?\n)') {
        $fm = $Matches[1]
        $rest = $content.Substring($fm.Length)
        $content = $fm + "`r`n" + $stampNote + "`r`n" + $rest
    } else {
        $content = $stampNote + "`r`n" + $content
    }
    Set-Content -LiteralPath $file -Value $content -NoNewline
}

Write-Step "Registering skills -> $skillsDst"
Get-ChildItem -Directory $skillsSrc | ForEach-Object {
    $dest = Join-Path $skillsDst $_.Name
    if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
    Copy-Item $_.FullName $dest -Recurse -Force
    Add-InstallStamp (Join-Path $dest 'SKILL.md')
    Write-Host "    + skill: $($_.Name)"
}

if (Test-Path $agentsSrc) {
    Write-Step "Registering custom agents -> $agentsDst"
    Get-ChildItem -File -Filter '*.agent.md' $agentsSrc | ForEach-Object {
        $dest = Join-Path $agentsDst $_.Name
        Copy-Item $_.FullName $dest -Force
        Add-InstallStamp $dest
        Write-Host "    + agent: $($_.Name)"
    }
}

Write-Host ""
Write-Step "Done."
Write-Host "The skills and agents are now available in every VS Code workspace and the Copilot CLI."
Write-Host "Agent workflow + CLIs live at: $InstallDir"
Write-Host "Next: open Copilot Chat (agent mode) and pick 'ngo-core-upgrade',"
Write-Host "or just type e.g. 'Upgrade NGO Core packages to 9.2.1 for <client>'."

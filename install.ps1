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
# --- 4. Verify/Install Azure Artifacts Credential Provider --------------------
$pluginDir = Join-Path $HOME '.nuget\plugins\netcore\CredentialProvider.Microsoft'
if (-not (Test-Path (Join-Path $pluginDir 'CredentialProvider.Microsoft.dll'))) {
    Write-Step "Azure Artifacts Credential Provider not found in ~/.nuget/plugins. Installing official provider..."
    try {
        & ([scriptblock]::Create((Invoke-RestMethod -Uri 'https://aka.ms/install-artifacts-credprovider.ps1')))
        Write-Host "    + Azure Artifacts Credential Provider installed."
    } catch {
        Write-Warning "Could not automatically install Credential Provider. Run manually if using private Azure feeds:"
        Write-Warning "    iex '& { $(irm https://aka.ms/install-artifacts-credprovider.ps1) }'"
    }
} else {
    Write-Step "Azure Artifacts Credential Provider verified in $pluginDir"
}

Write-Host ""
# --- 5. New-Machine Readiness Summary ----------------------------------------
Write-Step "New-Machine Environment Readiness:"
$gitUser = (& git config user.name 2>$null)
$gitEmail = (& git config user.email 2>$null)
if ($gitUser -and $gitEmail) {
    Write-Host "    [OK]   Git Author: $gitUser <$gitEmail>"
} else {
    Write-Warning "    [WARN] Git author missing -> git config --global user.name 'Your Name' ; git config --global user.email 'you@company.com'"
}

$dotnetVer = (& dotnet --version 2>$null)
if ($dotnetVer) {
    Write-Host "    [OK]   .NET SDK: $dotnetVer"
} else {
    Write-Warning "    [WARN] dotnet SDK not found -> winget install Microsoft.DotNet.SDK.10"
}

$nodeVer = (& node --version 2>$null)
if ($nodeVer) {
    Write-Host "    [OK]   Node.js: $nodeVer (for private Azure npm feeds run inside <client>\ngo-client: npx vsts-npm-auth -config .npmrc -Force)"
} else {
    Write-Warning "    [WARN] Node.js not found -> winget install OpenJS.NodeJS.LTS"
}

$copilotCfg = Join-Path $HOME '.copilot\config.json'
if (Test-Path $copilotCfg) {
    if ($env:COPILOT_GITHUB_TOKEN) {
        Write-Warning "    [WARN] ~/.copilot/config.json OAuth session exists AND COPILOT_GITHUB_TOKEN is set (token env overrides OAuth & can break model catalog)."
    } else {
        Write-Host "    [OK]   Copilot CLI OAuth config found (~/.copilot/config.json)"
    }
} else {
    Write-Warning "    [WARN] Copilot CLI not logged in -> run 'copilot' then type '/login' (or configure in the Web UI)"
}

Write-Host ""
Write-Step "Done."
Write-Host "The skills and agents are now available in every VS Code workspace and the Copilot CLI."
Write-Host "Agent workflow + CLIs live at: $InstallDir"
Write-Host "First run check on this machine:"
Write-Host "  node `"$InstallDir\tools\check-environment.js`" --core-path `"<ngo-online-core>`" --client-path `"<client-repo>`" --target 9.4.1 --save-settings"
Write-Host "Web UI dashboard (optional): cd `"$InstallDir`" && node platform/server.js (http://127.0.0.1:3800)"
Write-Host "Copilot Agent mode: open VS Code Copilot Chat, pick 'ngo-core-upgrade', and say e.g. 'Upgrade NGO Core packages to 9.4.1 for <client>'."

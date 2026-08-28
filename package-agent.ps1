<#
.SYNOPSIS
  Builds a portable zip of the NGO Core Upgrade Agent to carry to another computer.

.DESCRIPTION
  Copies the whole workspace into a clean staging folder, excluding local-only state
  (.git history and per-run output under */runs/), then compresses it. Unzip on the
  target machine and open in VS Code with GitHub Copilot. See IMPORT.md.

.EXAMPLE
  .\package-agent.ps1
  .\package-agent.ps1 -OutputPath "C:\temp\agent.zip" -IncludeRuns
#>
[CmdletBinding()]
param(
    [string]$OutputPath = (Join-Path (Split-Path -Parent $PSScriptRoot) "ngo-core-upgrade-agent.zip"),
    [switch]$IncludeRuns,
    [switch]$IncludeGit
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$staging = Join-Path ([System.IO.Path]::GetTempPath()) ("ngo-agent-pkg-" + [guid]::NewGuid().ToString('N'))

Write-Host "Staging from: $root"
New-Item -ItemType Directory -Path $staging -Force | Out-Null

# Robocopy mirrors the tree; /XD excludes directories by name.
$excludeDirs = @()
if (-not $IncludeGit)  { $excludeDirs += (Join-Path $root '.git') }
if (-not $IncludeRuns) { $excludeDirs += 'runs' }   # any folder named 'runs' at any depth

$roboArgs = @($root, $staging, '/MIR', '/NFL', '/NDL', '/NJH', '/NJS', '/NP')
if ($excludeDirs.Count -gt 0) { $roboArgs += '/XD'; $roboArgs += $excludeDirs }

robocopy @roboArgs | Out-Null
# Robocopy exit codes 0-7 are success; 8+ are failures.
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE" }

if (Test-Path $OutputPath) { Remove-Item $OutputPath -Force }
Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $OutputPath -Force
Remove-Item $staging -Recurse -Force

$size = [math]::Round((Get-Item $OutputPath).Length / 1MB, 2)
Write-Host "Package created: $OutputPath ($size MB)"
Write-Host "Copy it to the target computer, unzip, open the folder in VS Code with GitHub Copilot. See IMPORT.md."

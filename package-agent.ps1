<#
.SYNOPSIS
  Builds a portable zip of the NGO Core Upgrade Agent to carry to another computer.

.DESCRIPTION
  Copies the whole workspace into a clean staging folder, excluding local-only state
  (.git history, per-run output under */runs/, and local credentials/machine settings),
  then compresses it. Unzip on the target machine and open in VS Code with GitHub Copilot. See IMPORT.md.

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

# Robocopy mirrors the tree; /XD excludes directories by name, /XF excludes sensitive/machine-local files.
$excludeDirs = @('node_modules', 'frontend-runtime', 'jobs')  # regenerated locally, never shipped
if (-not $IncludeGit)  { $excludeDirs += (Join-Path $root '.git') }
if (-not $IncludeRuns) { $excludeDirs += 'runs' }   # any folder named 'runs' at any depth
$excludeFiles = @('.credentials.json', 'platform-copilot-token.json', 'telemetry-ledger.jsonl', '*.pat', '*.token', '.env', '.env.*')

$roboArgs = @($root, $staging, '/MIR', '/NFL', '/NDL', '/NJH', '/NJS', '/NP')
if ($excludeDirs.Count -gt 0)  { $roboArgs += '/XD'; $roboArgs += $excludeDirs }
if ($excludeFiles.Count -gt 0) { $roboArgs += '/XF'; $roboArgs += $excludeFiles }

robocopy @roboArgs | Out-Null
# Robocopy exit codes 0-7 are success; 8+ are failures.
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE" }

# Sanitize machine-specific paths in staged platform/config/settings.json so target machines use portable defaults
$stagedSettings = Join-Path $staging 'platform\config\settings.json'
if (Test-Path $stagedSettings) {
    try {
        $cfg = Get-Content $stagedSettings -Raw | ConvertFrom-Json
        $cfg.PSObject.Properties.Remove('approvedWorkspaceRoots')
        $cfg.PSObject.Properties.Remove('corePath')
        $cfg.PSObject.Properties.Remove('azureDevOpsPat')
        $cfg | ConvertTo-Json -Depth 10 | Set-Content $stagedSettings -Encoding UTF8
    } catch {
        Remove-Item $stagedSettings -Force -ErrorAction SilentlyContinue
    }
}

if (Test-Path $OutputPath) { Remove-Item $OutputPath -Force }
Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $OutputPath -Force
Remove-Item $staging -Recurse -Force

$size = [math]::Round((Get-Item $OutputPath).Length / 1MB, 2)
Write-Host "Package created: $OutputPath ($size MB)"
Write-Host "Copy it to the target computer, unzip, open the folder in VS Code with GitHub Copilot. See IMPORT.md."

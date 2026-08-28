#!/usr/bin/env pwsh
# PowerShell entry shim for the upgrade-agent CLI.
$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
node (Join-Path $scriptDir 'upgrade-agent.js') @args
exit $LASTEXITCODE

#!/usr/bin/env pwsh
# frontend-upgrade-agent — PowerShell entry shim.
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
& node (Join-Path $here 'frontend-upgrade-agent.js') @args
exit $LASTEXITCODE

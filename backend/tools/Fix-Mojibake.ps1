<#
.SYNOPSIS
    Detect and (optionally) fix mojibake in text files caused by UTF-8 bytes
    being misread as Windows-1252 and re-encoded as UTF-8.

.DESCRIPTION
    Robust per-run algorithm (no hand-maintained character list):

      1. Build a reverse map: every char that Windows-1252 can produce when
         decoding a single byte 0x00..0xFF -> that byte.
      2. Scan the text for maximal runs of such "1252-decodable" characters that
         start with a classic mojibake leader (U+00E2 / U+00C2 / U+00C3 ...).
      3. For each run, re-encode it to the original byte stream (char -> 1252
         byte) and STRICTLY decode those bytes as UTF-8.
      4. If the strict decode succeeds and yields a different string with no
         replacement char, the run was genuinely double-encoded -> replace it.

    Because the decode is strict and per-run, legitimate standalone Latin-1
    characters (a real middle-dot, section sign, accented letter, etc.) are left
    untouched: on their own they are not valid UTF-8, the strict decode fails,
    and the run is skipped.

.PARAMETER Root
    Root folder to scan.

.PARAMETER Apply
    If set, rewrites files. Otherwise just reports what would change.

.PARAMETER Include
    File globs to include. Defaults to common text formats in this repo.

.PARAMETER Exclude
    Path fragments to skip (case-insensitive). Defaults to common build output.

.EXAMPLE
    .\Fix-Mojibake.ps1 -Root 'D:\NGO Client\NGO Core Upgrade'
    .\Fix-Mojibake.ps1 -Root 'D:\NGO Client\NGO Core Upgrade' -Apply
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$Root,

    [switch]$Apply,

    [string[]]$Include = @(
        '*.md','*.json','*.ps1','*.psm1','*.cs','*.csproj','*.props','*.targets',
        '*.txt','*.yml','*.yaml','*.config','*.xml','*.diff','*.patch','*.sql'
    ),

    [string[]]$Exclude = @('\bin\','\obj\','\node_modules\','\.git\','\.vs\')
)

$cp1252     = [System.Text.Encoding]::GetEncoding(1252)
$utf8Write  = New-Object System.Text.UTF8Encoding($false)         # no BOM (write)
$utf8Strict = New-Object System.Text.UTF8Encoding($false, $true)  # throw on invalid

# char -> the single 1252 byte that decodes to it. Built from all 256 bytes.
$charToByte = @{}
for ($b = 0; $b -le 255; $b++) {
    $ch = $cp1252.GetString([byte[]]@([byte]$b))
    if ($ch.Length -eq 1 -and -not $charToByte.ContainsKey($ch[0])) {
        $charToByte[$ch[0]] = [byte]$b
    }
}

# Classic leaders: a UTF-8 lead byte mis-shown as a Latin-1 letter.
$leaders = @([char]0x00E2, [char]0x00C2, [char]0x00C3, [char]0x00C5, [char]0x00C4, [char]0x00CB)

function Convert-MojibakeText {
    param([string]$Text)

    $sb    = New-Object System.Text.StringBuilder
    $i     = 0
    $n     = $Text.Length
    $count = 0

    while ($i -lt $n) {
        $c = $Text[$i]

        if (($leaders -contains $c) -and ($i + 1 -lt $n) -and ([int]$Text[$i + 1] -ge 0x80) -and ($charToByte.ContainsKey($Text[$i + 1]))) {
            $j = $i
            while ($j -lt $n -and [int]$Text[$j] -ge 0x80 -and $charToByte.ContainsKey($Text[$j])) { $j++ }

            $run   = $Text.Substring($i, $j - $i)
            $bytes = New-Object 'System.Collections.Generic.List[byte]'
            foreach ($rc in $run.ToCharArray()) { $bytes.Add($charToByte[$rc]) }

            $decoded = $null
            try { $decoded = $utf8Strict.GetString($bytes.ToArray()) } catch { $decoded = $null }

            if ($decoded -and $decoded -ne $run -and -not $decoded.Contains([char]0xFFFD)) {
                [void]$sb.Append($decoded)
                $count++
                $i = $j
                continue
            }
        }

        [void]$sb.Append($c)
        $i++
    }

    return [PSCustomObject]@{ Text = $sb.ToString(); Hits = $count }
}

# ---------------------------------------------------------------------------
# Scan
# ---------------------------------------------------------------------------
$root  = (Resolve-Path -LiteralPath $Root).Path
# Allowed extensions derived from $Include (e.g. '*.md' -> '.md'). Enforced
# explicitly so binary files are never read/written even if Get-ChildItem
# -Include behaves loosely with -LiteralPath + -Recurse.
$allowedExt = $Include | ForEach-Object { $_.TrimStart('*').ToLowerInvariant() }
$files = Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction SilentlyContinue
$report  = New-Object System.Collections.Generic.List[object]
$skipped = 0
$scanned = 0

foreach ($f in $files) {
    if ($allowedExt -notcontains $f.Extension.ToLowerInvariant()) { continue }
    $skip = $false
    foreach ($x in $Exclude) {
        if ($f.FullName -like "*$x*") { $skip = $true; break }
    }
    if ($skip) { $skipped++; continue }
    $scanned++

    $raw    = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $result = Convert-MojibakeText -Text $raw
    if ($result.Hits -eq 0) { continue }

    $report.Add([PSCustomObject]@{
        File = $f.FullName.Substring($root.Length).TrimStart('\','/')
        Runs = $result.Hits
    })

    if ($Apply) {
        [System.IO.File]::WriteAllText($f.FullName, $result.Text, $utf8Write)
    }
}

Write-Host ""
Write-Host "Scanned : $scanned files (skipped $skipped by Exclude pattern)" -ForegroundColor DarkGray
if ($report.Count -eq 0) {
    Write-Host "No mojibake found under: $root" -ForegroundColor Green
    return
}

$action = if ($Apply) { 'FIXED' } else { 'WOULD FIX' }
$total  = ($report | Measure-Object Runs -Sum).Sum
Write-Host "$action $($report.Count) file(s) ($total mojibake run(s)):" -ForegroundColor Yellow
$report | Sort-Object Runs -Descending | Format-Table -AutoSize

if (-not $Apply) {
    Write-Host ""
    Write-Host "Re-run with -Apply to write changes." -ForegroundColor Cyan
}

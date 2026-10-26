<#
.SYNOPSIS
    Builds the Aura Notes Windows desktop production release.

.DESCRIPTION
    Runs tests, maintains and bumps SemVer version numbers, builds the Vite web client
    and Electron main/preload scripts, and packages the Windows NSIS installer using electron-builder.

.PARAMETER SkipTests
    Skips running the Vitest test suite before building.

.PARAMETER DirOnly
    Builds unpacked directory (release/win-unpacked) without creating NSIS installer.

.PARAMETER PortableOnly
    Builds portable standalone executable only.

.PARAMETER Bump
    SemVer bump increment: 'patch', 'minor', or 'major'. Defaults to 'patch'.

.PARAMETER Version
    Explicit version to release (e.g. '1.2.0').

.PARAMETER NoBump
    Maintains current version without incrementing.

.EXAMPLE
    .\release.ps1
    .\release.ps1 -Bump minor
    .\release.ps1 -Version 2.0.0
    .\release.ps1 -SkipTests
    .\release.ps1 -NoBump
#>
[CmdletBinding()]
param(
    [switch]$SkipTests,
    [switch]$DirOnly,
    [switch]$PortableOnly,
    [string]$Bump,
    [string]$Version,
    [switch]$NoBump
)

$argsList = @()
if ($SkipTests) { $argsList += "--skip-tests" }
if ($DirOnly) { $argsList += "--dir" }
if ($PortableOnly) { $argsList += "--portable" }
if ($NoBump) { $argsList += "--no-bump" }
if ($Bump) { $argsList += "--bump"; $argsList += $Bump }
if ($Version) { $argsList += "--version"; $argsList += $Version }

Write-Host "Starting Aura Notes Windows Release..." -ForegroundColor Cyan
& node "$PSScriptRoot\scripts\release.js" @argsList $args

if ($LASTEXITCODE -ne 0) {
    Write-Error "Release script failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

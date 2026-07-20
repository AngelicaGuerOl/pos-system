param(
    [ValidateSet("db", "backend", "frontend")]
    [string]$Service,
    [switch]$Follow
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

try {
    Assert-DockerReady
    $arguments = @("logs", "--tail", "200")
    if ($Follow) {
        $arguments += "-f"
    }
    if (-not [string]::IsNullOrWhiteSpace($Service)) {
        $arguments += $Service
    }

    Invoke-Compose -Arguments $arguments
} catch {
    Write-Error $_.Exception.Message
    exit 1
}

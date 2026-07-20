Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

try {
    Assert-DockerReady
    Write-Info "Deteniendo contenedores de produccion. Los volumenes no se eliminan."
    Invoke-Compose -Arguments @("stop", "frontend", "backend", "db")
    Write-Info "NovaPOS quedo detenido sin borrar datos."
} catch {
    Write-Error $_.Exception.Message
    exit 1
}

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

try {
    Assert-FileExists -Path $Script:EnvFile
    Assert-DockerReady
    Assert-RequiredEnv

    Write-Info "Iniciando NovaPOS sin reconstruir imagenes."
    Invoke-Compose -Arguments @("up", "-d", "db", "backend", "frontend")
    Wait-ForServices -TimeoutSeconds 180

    & (Join-Path $PSScriptRoot "status.ps1")
} catch {
    Write-Error $_.Exception.Message
    exit 1
}

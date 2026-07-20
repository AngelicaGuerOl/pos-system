param(
    [switch]$Pull
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

try {
    Assert-DockerReady
    Assert-RequiredEnv

    if ($Pull) {
        if ($null -eq (Get-Command git -ErrorAction SilentlyContinue)) {
            throw "Git no esta instalado o no esta en PATH."
        }
        & git -C $Script:ProjectRoot rev-parse --is-inside-work-tree > $null 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "El directorio no es un repositorio Git."
        }
        $status = @(& git -C $Script:ProjectRoot status --porcelain)
        if ($status.Length -gt 0) {
            throw "Hay cambios locales. Cancela la actualizacion y revisa git status."
        }
    }

    Write-Info "Creando respaldo obligatorio antes de actualizar."
    & (Join-Path $PSScriptRoot "backup.ps1") -BackupDirectory $Script:DefaultBackupDirectory
    if ($LASTEXITCODE -ne 0) {
        throw "El respaldo fallo. Actualizacion cancelada."
    }

    if ($Pull) {
        Write-Info "Actualizando codigo con git pull --ff-only."
        & git -C $Script:ProjectRoot pull --ff-only
        if ($LASTEXITCODE -ne 0) {
            throw "git pull --ff-only fallo. No se hizo reset, clean ni force pull."
        }
    }

    Write-Info "Validando configuracion de produccion."
    Invoke-Compose -Arguments @("config", "--quiet")

    Write-Info "Reconstruyendo imagenes."
    Invoke-Compose -Arguments @("build", "backend", "frontend")

    Write-Info "Reiniciando servicios."
    Invoke-Compose -Arguments @("up", "-d", "db", "backend", "frontend")
    Wait-ForServices -TimeoutSeconds 240
    Test-FrontendUrl

    & (Join-Path $PSScriptRoot "status.ps1")
} catch {
    Write-Error $_.Exception.Message
    try {
        Write-Host ""
        Write-Info "Logs recientes:"
        Invoke-Compose -Arguments @("logs", "--tail", "80", "backend", "frontend")
    } catch {
    }
    exit 1
}

param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$restoreName = "novapos-restore-$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').dump"
$containerFile = "/tmp/$restoreName"
$servicesStopped = $false
$restoreCompleted = $false

try {
    Assert-DockerReady
    Assert-RequiredEnv
    $resolvedBackup = (Resolve-Path -LiteralPath $BackupFile).Path
    Assert-BackupFile -BackupFile $resolvedBackup

    Write-Host "Se restaurara el archivo: $resolvedBackup"
    Write-Host "Advertencia: la informacion actual de la base de produccion sera reemplazada."
    $confirmation = Read-Host "Escribe RESTORE para continuar"
    if ($confirmation -ne "RESTORE") {
        Write-Info "Restauracion cancelada."
        exit 0
    }

    Write-Info "Creando respaldo de seguridad antes de restaurar."
    & (Join-Path $PSScriptRoot "backup.ps1") -BackupDirectory $Script:DefaultBackupDirectory
    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo crear el respaldo de seguridad. Restauracion cancelada."
    }

    Write-Info "Deteniendo frontend y backend para impedir nuevas operaciones."
    Invoke-Compose -Arguments @("stop", "frontend", "backend")
    $servicesStopped = $true

    if (-not (Test-ComposeServiceRunning -Service "db")) {
        Write-Info "Iniciando db para restaurar."
        Invoke-Compose -Arguments @("up", "-d", "db")
    }

    Write-Info "Copiando respaldo al contenedor PostgreSQL."
    Invoke-Compose -Arguments @("cp", $resolvedBackup, "db:$containerFile")

    Write-Info "Validando archivo dentro del contenedor."
    Invoke-Compose -Arguments @("exec", "-T", "db", "sh", "-c", "pg_restore -l $containerFile >/dev/null")

    Write-Info "Cerrando conexiones activas de la base objetivo."
    Invoke-Compose -Arguments @("exec", "-T", "db", "sh", "-c", "psql -U `"`$POSTGRES_USER`" -d `"`$POSTGRES_DB`" -v ON_ERROR_STOP=1 -c `"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();`"")

    Write-Info "Restaurando respaldo."
    Invoke-Compose -Arguments @("exec", "-T", "db", "sh", "-c", "pg_restore -U `"`$POSTGRES_USER`" -d `"`$POSTGRES_DB`" --clean --if-exists --no-owner --no-privileges --single-transaction $containerFile")
    $restoreCompleted = $true

    Write-Info "Reiniciando backend y frontend."
    Invoke-Compose -Arguments @("up", "-d", "backend", "frontend")
    Wait-ForServices -TimeoutSeconds 240
    Test-FrontendUrl

    Write-Host ""
    Write-Info "Restauracion completada y servicios verificados."
    Write-Host "Checklist posterior:"
    Write-Host "  [ ] Inicio de sesion"
    Write-Host "  [ ] Productos"
    Write-Host "  [ ] Categorias"
    Write-Host "  [ ] Existencias"
    Write-Host "  [ ] Usuarios"
    Write-Host "  [ ] Proveedores"
    Write-Host "  [ ] Ventas"
    Write-Host "  [ ] Caja"
    Write-Host "  [ ] Cuentas por cobrar"
    Write-Host "  [ ] Cortes de proveedor"
} catch {
    Write-Error $_.Exception.Message
    if ($servicesStopped -and -not $restoreCompleted) {
        Write-Error "La restauracion no termino. Revisa logs antes de iniciar backend y frontend."
    }
    exit 1
} finally {
    try {
        Invoke-Compose -Arguments @("exec", "-T", "db", "sh", "-c", "rm -f $containerFile") | Out-Null
    } catch {
    }
}

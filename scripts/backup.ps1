param(
    [string]$BackupDirectory = "C:\NovaPOS-Backups",
    [string]$CloudBackupDirectory
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$fileName = "novapos-$timestamp.dump"
$containerFile = "/tmp/$fileName"
$backupPath = Join-Path $BackupDirectory $fileName
$cloudBackupPath = $null
$dbWasRunning = $false

try {
    Assert-DockerReady
    Assert-RequiredEnv
    New-Item -ItemType Directory -Force -Path $BackupDirectory | Out-Null

    $dbWasRunning = Test-ComposeServiceRunning -Service "db"
    if (-not $dbWasRunning) {
        throw "El servicio db no esta activo. Inicia NovaPOS antes de respaldar."
    }

    Write-Info "Creando respaldo dentro del contenedor PostgreSQL."
    Invoke-Compose -Arguments @("exec", "-T", "db", "sh", "-c", "pg_dump -U `"`$POSTGRES_USER`" -d `"`$POSTGRES_DB`" -Fc -f $containerFile")

    Write-Info "Validando respaldo con pg_restore -l."
    Invoke-Compose -Arguments @("exec", "-T", "db", "sh", "-c", "pg_restore -l $containerFile >/dev/null")

    Write-Info "Copiando respaldo al equipo Windows."
    Invoke-Compose -Arguments @("cp", "db:$containerFile", $backupPath)

    Assert-BackupFile -BackupFile $backupPath
    Write-Info "Respaldo creado: $backupPath"

    if (-not [string]::IsNullOrWhiteSpace($CloudBackupDirectory)) {
        Write-Info "Copiando respaldo a carpeta externa/nube."
        New-Item -ItemType Directory -Force -Path $CloudBackupDirectory | Out-Null
        $cloudBackupPath = Join-Path $CloudBackupDirectory $fileName
        Copy-Item -LiteralPath $backupPath -Destination $cloudBackupPath -Force
        Assert-BackupFile -BackupFile $cloudBackupPath
        Write-Info "Copia externa creada: $cloudBackupPath"
    }
} catch {
    Write-Error $_.Exception.Message
    exit 1
} finally {
    if ($dbWasRunning) {
        try {
            Invoke-Compose -Arguments @("exec", "-T", "db", "sh", "-c", "rm -f $containerFile") | Out-Null
        } catch {
        }
    }
}

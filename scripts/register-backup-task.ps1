param(
    [string]$Time = "12:30",
    [string]$BackupDirectory = "C:\NovaPOS-Backups",
    [string]$CloudBackupDirectory
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

try {
    Assert-Windows
    Assert-FileExists -Path (Join-Path $PSScriptRoot "backup.ps1")

    if ($Time -notmatch "^\d{2}:\d{2}$") {
        throw "La hora debe tener formato HH:mm, por ejemplo 12:30."
    }

    $taskName = "NovaPOS Daily Backup"
    & schtasks.exe /Query /TN $taskName > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        $answer = Read-Host "La tarea ya existe. Escribe REPLACE para reemplazarla"
        if ($answer -ne "REPLACE") {
            Write-Info "Registro cancelado. La tarea existente no se modifico."
            exit 0
        }
        Invoke-Checked -FilePath "schtasks.exe" -Arguments @("/Delete", "/TN", $taskName, "/F")
    }

    $backupScript = Join-Path $PSScriptRoot "backup.ps1"
    $taskRun = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$backupScript`" -BackupDirectory `"$BackupDirectory`""
    if (-not [string]::IsNullOrWhiteSpace($CloudBackupDirectory)) {
        $taskRun = "$taskRun -CloudBackupDirectory `"$CloudBackupDirectory`""
    }
    Invoke-Checked -FilePath "schtasks.exe" -Arguments @("/Create", "/SC", "DAILY", "/ST", $Time, "/TN", $taskName, "/TR", $taskRun)

    Write-Info "Tarea registrada: $taskName a las $Time"
    Write-Host "Respaldo local: $BackupDirectory"
    if (-not [string]::IsNullOrWhiteSpace($CloudBackupDirectory)) {
        Write-Host "Copia externa/nube: $CloudBackupDirectory"
    }
    Write-Host "La computadora debe estar encendida, Windows debe permitir ejecutar la tarea y Docker Desktop debe estar funcionando."
    Write-Host "Consultar: schtasks /Query /TN `"$taskName`""
    Write-Host "Eliminar:  schtasks /Delete /TN `"$taskName`" /F"
} catch {
    Write-Error $_.Exception.Message
    exit 1
}

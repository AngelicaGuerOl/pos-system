Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

try {
    Assert-DockerReady
    $config = Get-StoreConfig

    Write-Info "Estado de servicios:"
    foreach ($service in @("db", "backend", "frontend")) {
        $containerId = (Get-ComposeOutput -Arguments @("ps", "-q", $service) | Select-Object -First 1)
        if ([string]::IsNullOrWhiteSpace($containerId)) {
            Write-Host "  ${service}: inexistente"
            continue
        }

        $state = (& docker inspect --format "{{.State.Status}}" $containerId 2>$null)
        $health = (& docker inspect --format "{{if .State.Health}}{{.State.Health.Status}}{{else}}sin healthcheck{{end}}" $containerId 2>$null)
        Write-Host "  ${service}: $state, $health"
    }

    $volumeName = "pos_postgres_prod_data"
    & docker volume inspect $volumeName > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        $volumeExists = "si"
    } else {
        $volumeExists = "no"
    }
    Write-Host "  volumen ${volumeName}: $volumeExists"

    $lastBackup = Get-LastBackup
    if ($null -eq $lastBackup) {
        Write-Host "  ultimo respaldo: no encontrado en $Script:DefaultBackupDirectory"
    } else {
        Write-Host "  ultimo respaldo: $($lastBackup.FullName)"
    }

    Write-Info "URL local: $($config.Url)"
} catch {
    Write-Error $_.Exception.Message
    exit 1
}

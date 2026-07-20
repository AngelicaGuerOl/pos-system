Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

try {
    Assert-Windows
    Assert-FileExists -Path $Script:EnvFile
    Assert-FileExists -Path $Script:ComposeBaseFile
    Assert-FileExists -Path $Script:ComposeProdFile
    Assert-DockerReady
    Assert-RequiredEnv

    Write-Info "Creando carpeta de respaldos si no existe: $Script:DefaultBackupDirectory"
    New-Item -ItemType Directory -Force -Path $Script:DefaultBackupDirectory | Out-Null

    Write-Info "Validando docker compose de produccion."
    Invoke-Compose -Arguments @("config", "--quiet")

    Write-Info "Construyendo imagenes de produccion."
    Invoke-Compose -Arguments @("build", "backend", "frontend")

    Write-Info "Iniciando db, backend y frontend."
    Invoke-Compose -Arguments @("up", "-d", "db", "backend", "frontend")

    Write-Info "Esperando servicios."
    Wait-ForServices -TimeoutSeconds 240
    Test-FrontendUrl

    $config = Get-StoreConfig
    Write-Host ""
    Write-Info "NovaPOS esta disponible en: $($config.Url)"
    Write-Info "La base de produccion usa un volumen nuevo y empieza vacia hasta ejecutar restore.ps1 manualmente."

    $answer = Read-Host "Quieres crear el acceso directo de escritorio ahora? Escribe SI para crearlo"
    if ($answer -eq "SI") {
        & (Join-Path $PSScriptRoot "create-shortcut.ps1")
        if ($LASTEXITCODE -ne 0) {
            throw "No se pudo crear el acceso directo."
        }
    } else {
        Write-Info "Acceso directo omitido. Puedes crearlo despues con .\scripts\create-shortcut.ps1"
    }
} catch {
    Write-Error $_.Exception.Message
    exit 1
}

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Script:ProjectRoot = Split-Path -Parent $PSScriptRoot
$Script:EnvFile = Join-Path $Script:ProjectRoot ".env"
$Script:ComposeBaseFile = Join-Path $Script:ProjectRoot "docker-compose.yml"
$Script:ComposeProdFile = Join-Path $Script:ProjectRoot "docker-compose.prod.yml"
$Script:DefaultBackupDirectory = "C:\NovaPOS-Backups"
$Script:ComposeArgs = @(
    "--env-file", $Script:EnvFile,
    "-f", $Script:ComposeBaseFile,
    "-f", $Script:ComposeProdFile
)
$Script:RequiredEnvNames = @(
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
    "DB_PORT",
    "BACKEND_PORT",
    "FRONTEND_PORT",
    "VITE_API_BASE_URL",
    "PGADMIN_EMAIL",
    "PGADMIN_PASSWORD",
    "PGADMIN_PORT",
    "SPRING_PROFILES_ACTIVE",
    "JWT_SECRET",
    "JWT_EXPIRATION_MINUTES",
    "BOOTSTRAP_ADMIN_ENABLED",
    "BOOTSTRAP_ADMIN_USERNAME",
    "BOOTSTRAP_ADMIN_PASSWORD"
)

function Write-Info {
    param([Parameter(Mandatory = $true)][string]$Message)
    Write-Host "[NovaPOS] $Message"
}

function Assert-Windows {
    if ([Environment]::OSVersion.Platform -ne [PlatformID]::Win32NT) {
        throw "Estos scripts estan pensados para Windows con Docker Desktop."
    }
}

function Assert-FileExists {
    param([Parameter(Mandatory = $true)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        throw "No existe el archivo requerido: $Path"
    }
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "El comando fallo: $FilePath $($Arguments -join ' ')"
    }
}

function Invoke-Compose {
    param([Parameter(Mandatory = $true)][string[]]$Arguments)
    Invoke-Checked -FilePath "docker" -Arguments (@("compose") + $Script:ComposeArgs + $Arguments)
}

function Get-ComposeOutput {
    param([Parameter(Mandatory = $true)][string[]]$Arguments)
    $allArguments = @("compose") + $Script:ComposeArgs + $Arguments
    $output = & docker @allArguments
    if ($LASTEXITCODE -ne 0) {
        throw "El comando Docker Compose fallo."
    }
    return $output
}

function Test-ComposeServiceRunning {
    param([Parameter(Mandatory = $true)][string]$Service)

    $output = @(Get-ComposeOutput -Arguments @("ps", "--status", "running", "--services", $Service) 2>$null)
    return ($output | Where-Object { $_ -eq $Service }).Length -gt 0
}

function Assert-DockerReady {
    $dockerCommand = Get-Command docker -ErrorAction SilentlyContinue
    if ($null -eq $dockerCommand) {
        throw "Docker no esta instalado o no esta en PATH. Instala Docker Desktop."
    }

    $composeVersion = & docker compose version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Compose no esta disponible. Actualiza Docker Desktop."
    }

    & docker info > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Desktop no esta funcionando. Abre Docker Desktop y espera a que termine de iniciar."
    }
}

function Get-EnvMap {
    Assert-FileExists -Path $Script:EnvFile
    $map = @{}

    foreach ($line in Get-Content -LiteralPath $Script:EnvFile) {
        $trimmed = $line.Trim()
        if ($trimmed.Length -eq 0 -or $trimmed.StartsWith("#")) {
            continue
        }

        $separator = $trimmed.IndexOf("=")
        if ($separator -lt 1) {
            continue
        }

        $name = $trimmed.Substring(0, $separator).Trim()
        $value = $trimmed.Substring($separator + 1).Trim()
        $map[$name] = $value
    }

    return $map
}

function Assert-RequiredEnv {
    $envMap = Get-EnvMap
    $missing = @()

    foreach ($name in $Script:RequiredEnvNames) {
        if (-not $envMap.ContainsKey($name) -or [string]::IsNullOrWhiteSpace([string]$envMap[$name])) {
            $missing += $name
        }
    }

    if ($missing.Count -gt 0) {
        throw "Faltan variables en .env: $($missing -join ', ')"
    }
}

function Get-StoreConfig {
    $envMap = Get-EnvMap
    $bindAddress = "127.0.0.1"
    $frontendPort = "80"

    if ($envMap.ContainsKey("NOVAPOS_BIND_ADDRESS") -and -not [string]::IsNullOrWhiteSpace([string]$envMap["NOVAPOS_BIND_ADDRESS"])) {
        $bindAddress = [string]$envMap["NOVAPOS_BIND_ADDRESS"]
    }

    if ($envMap.ContainsKey("NOVAPOS_FRONTEND_PORT") -and -not [string]::IsNullOrWhiteSpace([string]$envMap["NOVAPOS_FRONTEND_PORT"])) {
        $frontendPort = [string]$envMap["NOVAPOS_FRONTEND_PORT"]
    }

    $hostName = $bindAddress
    if ($bindAddress -eq "127.0.0.1" -or $bindAddress -eq "localhost") {
        $hostName = "localhost"
    }

    $url = "http://$hostName"
    if ($frontendPort -ne "80") {
        $url = "${url}:$frontendPort"
    }

    return [pscustomobject]@{
        BindAddress = $bindAddress
        FrontendPort = $frontendPort
        Url = $url
    }
}

function Wait-ForServices {
    param([int]$TimeoutSeconds = 180)

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        $failed = $false
        foreach ($service in @("db", "backend", "frontend")) {
            if (-not (Test-ComposeServiceRunning -Service $service)) {
                $failed = $true
            }
        }

        if (-not $failed) {
            return
        }

        Start-Sleep -Seconds 5
    } while ((Get-Date) -lt $deadline)

    throw "Los servicios no quedaron en ejecucion dentro del tiempo esperado."
}

function Test-FrontendUrl {
    $config = Get-StoreConfig
    try {
        $response = Invoke-WebRequest -Uri $config.Url -UseBasicParsing -TimeoutSec 15
        if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 400) {
            throw "HTTP $($response.StatusCode)"
        }
    } catch {
        throw "El frontend no respondio en $($config.Url). Detalle: $($_.Exception.Message)"
    }
}

function Get-LastBackup {
    param([string]$BackupDirectory = $Script:DefaultBackupDirectory)
    if (-not (Test-Path -LiteralPath $BackupDirectory)) {
        return $null
    }

    return Get-ChildItem -LiteralPath $BackupDirectory -Filter "*.dump" -File |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
}

function Assert-BackupFile {
    param([Parameter(Mandatory = $true)][string]$BackupFile)
    if (-not (Test-Path -LiteralPath $BackupFile -PathType Leaf)) {
        throw "No existe el respaldo: $BackupFile"
    }

    $item = Get-Item -LiteralPath $BackupFile
    if ($item.Length -le 0) {
        throw "El respaldo esta vacio: $BackupFile"
    }
}

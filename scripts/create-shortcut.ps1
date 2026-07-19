param(
    [switch]$IncludeStartShortcut
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

try {
    Assert-FileExists -Path $Script:EnvFile
    $config = Get-StoreConfig
    $desktop = [Environment]::GetFolderPath("Desktop")
    if ([string]::IsNullOrWhiteSpace($desktop)) {
        throw "No se pudo resolver el escritorio del usuario."
    }

    $urlFile = Join-Path $desktop "NovaPOS.url"
    $content = "[InternetShortcut]`r`nURL=$($config.Url)`r`n"
    Set-Content -LiteralPath $urlFile -Value $content -Encoding ASCII
    Write-Info "Acceso directo creado: $urlFile"

    if ($IncludeStartShortcut) {
        $shell = New-Object -ComObject WScript.Shell
        $shortcutPath = Join-Path $desktop "Iniciar NovaPOS.lnk"
        $shortcut = $shell.CreateShortcut($shortcutPath)
        $shortcut.TargetPath = "powershell.exe"
        $startScript = Join-Path $PSScriptRoot "start.ps1"
        $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$startScript`""
        $shortcut.WorkingDirectory = $Script:ProjectRoot
        $shortcut.Save()
        Write-Info "Acceso directo de inicio creado: $shortcutPath"
    }
} catch {
    Write-Error $_.Exception.Message
    exit 1
}

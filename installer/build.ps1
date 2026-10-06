# Buduje instalator Monterio: frontend (statyczny eksport) + API (self-contained win-x64) -> Inno Setup.
# Wymaga: Node.js, .NET SDK 10, Inno Setup 6 (iscc.exe).
# Opcjonalnie: -Apk <ścieżka> dołącza gotowy APK instalatora (build przez EAS, patrz docs/instalacja.md).
param([string] $Apk = '')
$ErrorActionPreference = 'Stop'
$root  = Split-Path $PSScriptRoot -Parent
$stage = Join-Path $PSScriptRoot 'build\stage'

Remove-Item -Recurse -Force $stage -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path "$stage\app\wwwroot" | Out-Null

Write-Host '==> Frontend (statyczny eksport)'
Push-Location "$root\apps\web"
$env:NEXT_OUTPUT = 'export'
$env:NEXT_PUBLIC_API_URL = 'same-origin'   # API serwuje frontend (uwaga: pusta wartość env w PowerShell = usunięcie zmiennej)
npm install --no-audit --no-fund   # NIE `npm ci` - kasuje node_modules i psuje działający dev-server
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Build frontendu nieudany' }
Remove-Item Env:NEXT_OUTPUT, Env:NEXT_PUBLIC_API_URL
Pop-Location
Copy-Item "$root\apps\web\out\*" "$stage\app\wwwroot" -Recurse

Write-Host '==> API (dotnet publish)'
dotnet publish "$root\apps\api\Monterio.API\Monterio.API.csproj" -c Release -r win-x64 --self-contained true -o "$stage\app"
if ($LASTEXITCODE -ne 0) { throw 'Publish API nieudany' }
Remove-Item "$stage\app\appsettings.Development.json" -ErrorAction SilentlyContinue

if ($Apk) { Copy-Item $Apk "$stage\Monterio-Instalator.apk" }

Write-Host '==> Inno Setup'
$iscc = @("${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe", "$env:ProgramFiles\Inno Setup 6\ISCC.exe", "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe") |
    Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $iscc) { throw 'Brak Inno Setup 6 (iscc.exe) - zainstaluj: winget install JRSoftware.InnoSetup' }
& $iscc "$PSScriptRoot\Monterio.iss"
if ($LASTEXITCODE -ne 0) { throw 'Kompilacja instalatora nieudana' }
Write-Host "Gotowe: $PSScriptRoot\build\Monterio-Setup-*.exe"

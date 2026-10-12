# Buduje paczke Docker Monterio: obrazy (.tar) + compose + install.ps1 -> docker\dist\Monterio-Docker-<wersja>.zip
# Wymaga: Docker Desktop (uruchomiony) i internetu (pobranie obrazow bazowych/SQL Server).
# Wersja jest wspolna z instalatorem Windows: #define AppVersion w installer\Monterio.iss.
# Continue (nie Stop): w PowerShell 5.1 stderr natywnych polecen (postep docker build) bylby wyjatkiem; bledy pilnuje $LASTEXITCODE.
$ErrorActionPreference = 'Continue'
$root = Split-Path $PSScriptRoot -Parent

$iss = Get-Content (Join-Path $root 'installer\Monterio.iss') | Where-Object { $_ -match '^#define AppVersion' } | Select-Object -First 1
if ($iss -notmatch '"([^"]+)"') { throw 'Nie moge odczytac AppVersion z installer\Monterio.iss' }
$version = $Matches[1]
Write-Host "==> Wersja: $version"

docker info *> $null
if ($LASTEXITCODE -ne 0) { throw 'Docker nie dziala - uruchom Docker Desktop.' }

# compose wymaga zmiennych sekretow przy interpolacji; do budowania/zapisu obrazow wystarcza atrapy (nie trafiaja do obrazow).
$env:MONTERIO_VERSION = $version
$env:MONTERIO_SA_PASSWORD = 'build-only'
$env:MONTERIO_JWT_SECRET = 'build-only'
$env:MONTERIO_RATING_SECRET = 'build-only'

# Siec z inspekcja TLS (np. firmowe proxy): jesli jest docker\corp-ca.crt, build uzywa go jako sekretu
# (npm/NuGet/curl ufaja temu CA tylko w czasie budowania, certyfikat nie trafia do obrazu). Brak = pusty plik, build bez zmian.
$caFile = Join-Path $PSScriptRoot 'corp-ca.crt'
if (-not (Test-Path $caFile)) { New-Item -ItemType File -Path $caFile | Out-Null }
elseif ((Get-Item $caFile).Length -gt 0) { Write-Host '==> Uzywam firmowego CA z docker\corp-ca.crt (tylko na czas budowania)' }

Write-Host '==> Budowa obrazow: API i web'
docker compose -f "$PSScriptRoot\docker-compose.yml" build api web
if ($LASTEXITCODE -ne 0) { throw 'Budowa obrazu nieudana' }

Write-Host '==> Obraz SQL Server'
$db = (docker compose -f "$PSScriptRoot\docker-compose.yml" config --images | Where-Object { $_ -like '*mssql*' } | Select-Object -First 1)
docker pull $db
if ($LASTEXITCODE -ne 0) { throw 'Pobranie obrazu SQL Server nieudane' }

$pkgName = "Monterio-Docker-$version"
$pkg = Join-Path $PSScriptRoot "dist\$pkgName"
Remove-Item -Recurse -Force $pkg -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path "$pkg\images" | Out-Null

Write-Host '==> Zapis obrazow do .tar (setki MB)'
docker save -o "$pkg\images\monterio-images.tar" "petrosoft/monterio:$version" "petrosoft/monterio-web:$version" $db
if ($LASTEXITCODE -ne 0) { throw 'docker save nieudany' }

Copy-Item "$PSScriptRoot\docker-compose.yml" $pkg
Copy-Item "$PSScriptRoot\install.ps1" $pkg
Copy-Item "$PSScriptRoot\README-docker.txt" "$pkg\README.txt"
Set-Content -Path "$pkg\version.txt" -Value $version -Encoding ASCII
Set-Content -Path "$pkg\Zainstaluj-Monterio.cmd" -Encoding ASCII -Value @(
    '@echo off',
    'powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" %*',
    'pause'
)

$zip = "$pkg.zip"
Remove-Item $zip -ErrorAction SilentlyContinue
Compress-Archive -Path "$pkg\*" -DestinationPath $zip
Write-Host "Gotowe: $zip"

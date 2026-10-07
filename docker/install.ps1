# Instalator Monterio dla Docker Desktop (Windows PowerShell 5.1+).
# Laduje obrazy z paczki, generuje .env z losowymi sekretami (tylko przy pierwszej instalacji) i
# uruchamia projekt Compose "monterio" - w Docker Desktop pojawi sie jako jedna grupa kontenerow.
# Aktualizacja = uruchom ponownie nowa paczke: .env i dane (wolumeny) zostaja.
param(
    [int] $Port = 5020,
    [string] $PublicUrl = ''
)
# Continue (nie Stop): w PowerShell 5.1 stderr natywnych polecen (np. docker info przy wylaczonym demonie) bylby wyjatkiem; bledy pilnuje $LASTEXITCODE.
$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot

function Fail([string] $msg) { Write-Host "BLAD: $msg" -ForegroundColor Red; exit 1 }

# --- Docker dostepny i uruchomiony
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Fail 'Nie znaleziono polecenia docker. Zainstaluj Docker Desktop (https://www.docker.com/products/docker-desktop).'
}
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    $dd = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dd) {
        Write-Host 'Uruchamiam Docker Desktop...'
        Start-Process $dd
        for ($i = 0; $i -lt 60; $i++) {
            Start-Sleep -Seconds 3
            docker info *> $null
            if ($LASTEXITCODE -eq 0) { break }
        }
    }
    docker info *> $null
    if ($LASTEXITCODE -ne 0) { Fail 'Docker Desktop nie jest uruchomiony. Uruchom go i ponow instalacje.' }
}

# --- .env (nie nadpisujemy istniejacego - zachowuje sekrety i dostep do danych)
function New-Secret([int] $len) {
    $chars = [char[]]'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $bytes = New-Object byte[] $len
    $rng.GetBytes($bytes)
    -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
}

$version = (Get-Content (Join-Path $PSScriptRoot 'version.txt') -ErrorAction Stop | Select-Object -First 1).Trim()
$envFile = Join-Path $PSScriptRoot '.env'
if (Test-Path $envFile) {
    Write-Host '.env istnieje - pozostawiam sekrety i ustawienia, aktualizuje tylko wersje.'
    $lines = Get-Content $envFile | Where-Object { $_ -notmatch '^MONTERIO_VERSION=' }
    Set-Content -Path $envFile -Value (@("MONTERIO_VERSION=$version") + $lines) -Encoding ASCII
} else {
    if (-not $PublicUrl) { $PublicUrl = "http://localhost:$Port" }
    $content = @(
        "MONTERIO_VERSION=$version",
        "MONTERIO_PORT=$Port",
        "MONTERIO_PUBLIC_URL=$($PublicUrl.TrimEnd('/'))",
        "MONTERIO_SA_PASSWORD=$(New-Secret 24)Aa1",
        "MONTERIO_JWT_SECRET=$(New-Secret 64)",
        "MONTERIO_RATING_SECRET=$(New-Secret 64)"
    )
    Set-Content -Path $envFile -Value $content -Encoding ASCII
    Write-Host 'Wygenerowano .env z losowymi sekretami. Zrob jego kopie zapasowa (utrata = brak dostepu do bazy).'
}

# --- Obrazy z paczki (offline) - jesli ich nie ma, docker pobierze/zbuduje wedlug compose
$tar = Join-Path $PSScriptRoot 'images\monterio-images.tar'
if (Test-Path $tar) {
    Write-Host 'Laduje obrazy (moze potrwac kilka minut)...'
    docker load -i $tar
    if ($LASTEXITCODE -ne 0) { Fail 'docker load nie powiodl sie.' }
}

Write-Host 'Uruchamiam Monterio...'
docker compose --env-file $envFile up -d --no-build --pull never
if ($LASTEXITCODE -ne 0) { Fail 'docker compose up nie powiodl sie.' }

# --- Czekamy az API bedzie zdrowe (migracje bazy przy pierwszym starcie moga potrwac)
Write-Host 'Czekam na uruchomienie (do 3 minut)...'
$status = ''
for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 3
    $status = (docker inspect --format '{{.State.Health.Status}}' monterio-api-1 2>$null)
    if ($status -eq 'healthy') { break }
}
if ($status -ne 'healthy') {
    Write-Host 'API nie zglosilo gotowosci. Sprawdz logi: docker compose logs api' -ForegroundColor Yellow
    exit 1
}

$url = (Get-Content $envFile | Where-Object { $_ -match '^MONTERIO_PUBLIC_URL=' }) -replace '^MONTERIO_PUBLIC_URL=', ''
Write-Host ''
Write-Host "Gotowe! Monterio dziala pod adresem: $url" -ForegroundColor Green
Write-Host 'Pierwsze logowanie: admin / Admin123!  (zmien haslo od razu na stronie Pracownicy)'
Write-Host 'W Docker Desktop szukaj projektu "monterio" (zakladka Containers).'

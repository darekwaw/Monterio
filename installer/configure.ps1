# Generuje appsettings.Local.json wdrożenia (sekrety, połączenie z bazą, adresy). Wołany przez instalator.
# Nie nadpisuje istniejącego pliku (aktualizacja = zachowanie sekretów), chyba że -Force.
param(
    [Parameter(Mandatory)] [string] $InstallDir,
    [Parameter(Mandatory)] [string] $Server,
    [Parameter(Mandatory)] [string] $Database,
    [string] $SqlUser = '',
    [string] $SqlPassword = '',
    [int] $Port = 5020,
    [Parameter(Mandatory)] [string] $PublicUrl,
    [switch] $Force
)
$ErrorActionPreference = 'Stop'
$target = Join-Path $InstallDir 'appsettings.Local.json'
if ((Test-Path $target) -and -not $Force) { Write-Host 'appsettings.Local.json istnieje - pozostawiam bez zmian.'; exit 0 }

function New-Secret([int] $bytes = 48) {
    $b = New-Object byte[] $bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
    [Convert]::ToBase64String($b)
}

if ($SqlUser) {
    $pwd = $SqlPassword.Replace("'", "''")
    $conn = "Server=$Server;Database=$Database;User Id=$SqlUser;Password='$pwd';TrustServerCertificate=True;"
} else {
    $conn = "Server=$Server;Database=$Database;Trusted_Connection=True;TrustServerCertificate=True;"
}

$uploads = Join-Path $env:ProgramData 'Monterio\uploads'
New-Item -ItemType Directory -Force -Path $uploads | Out-Null

# PDF protokołów: Edge/Chrome z systemu (bez pobierania Chromium z internetu); puste = pobranie przy pierwszym użyciu.
$chrome = @(
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

$cfg = [ordered]@{
    ConnectionStrings = @{ DefaultConnection = $conn }
    Kestrel           = @{ Endpoints = @{ Http = @{ Url = "http://0.0.0.0:$Port" } } }
    Cors              = @{ Origins = @($PublicUrl.TrimEnd('/')) }
    Storage           = @{ Local = @{ UploadPath = $uploads } }
    EmployeeJwt       = @{ Secret = (New-Secret); Issuer = 'monterio-api'; Audience = 'monterio-employees'; ExpiryMinutes = 480 }
    RatingLink        = @{ Secret = (New-Secret); WebBaseUrl = $PublicUrl.TrimEnd('/') }
    Pdf               = @{ ChromePath = [string]$chrome }
}
$json = $cfg | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($target, $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Zapisano $target"

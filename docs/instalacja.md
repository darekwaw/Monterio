# Monterio — instalacja i wdrożenie

## Wymagania serwera
- Windows 10/11 lub Windows Server 2019+ (x64), uprawnienia administratora do instalacji
- Microsoft SQL Server (Express wystarczy; zalecane logowanie SQL — login z prawem `dbcreator`,
  baza i schemat tworzą się automatycznie przy pierwszym starcie)
- Microsoft Edge lub Chrome (generowanie PDF protokołów; instalator wykrywa je sam, bez internetu).
  Bez przeglądarki aplikacja pobierze Chromium przy pierwszym wydruku (wymaga internetu).
- Otwarty port aplikacji (domyślnie TCP 5020) — instalator dodaje regułę zapory

Node.js ani .NET na serwerze **nie są potrzebne** (API jest self-contained, frontend jest statyczny
i serwowany przez API — jeden proces, jeden port).

## Instalacja
1. Uruchom `Monterio-Setup-<wersja>.exe` jako administrator.
2. Podaj: serwer SQL, nazwę bazy, login/hasło SQL, port, oraz adres, pod którym użytkownicy
   otwierają Monterio (np. `http://serwer-belpol:5020`). Ten adres trafia do linków/QR oceny klienta
   — musi być osiągalny z telefonów klientów.
3. Instalator rejestruje usługę Windows **Monterio** (autostart, restart po awarii), generuje
   unikalne sekrety JWT / linków oceny i startuje usługę. Czeka do 90 s na odpowiedź.
4. Otwórz podany adres. Pierwsze logowanie: `admin` / `Admin123!` — **zmień hasło od razu**
   (strona „Pracownicy").

## Gdzie co leży
| Co | Gdzie |
|---|---|
| Aplikacja | `C:\Program Files\Monterio` |
| Konfiguracja (sekrety, baza, port) | `C:\Program Files\Monterio\appsettings.Local.json` |
| Załączniki zleceń | `C:\ProgramData\Monterio\uploads` |
| Logi | Podgląd zdarzeń → Dzienniki Windows → Aplikacja (źródło „Monterio") |

## Aktualizacja
Uruchom nowy instalator na istniejącej instalacji: zatrzyma usługę, podmieni pliki, **zachowa**
`appsettings.Local.json` (nie pyta ponownie o bazę), uruchomi usługę. Migracje bazy wykonują się
automatycznie przy starcie.

## Kopia zapasowa
Wykonuj regularnie: (1) backup bazy SQL, (2) folder `C:\ProgramData\Monterio\uploads`,
(3) `appsettings.Local.json` (utrata sekretów = unieważnienie sesji i wydanych linków oceny).

## Odinstalowanie
„Aplikacje i funkcje" → Monterio. Usuwa usługę i regułę zapory. **Nie usuwa** bazy, załączników
ani `appsettings.Local.json` (świadomie — dane klienta).

## HTTPS
Domyślnie HTTP w sieci wewnętrznej. Dla dostępu z internetu postaw przed Monterio reverse proxy
(IIS/ARR, nginx, Caddy) z certyfikatem i ustaw w instalatorze/konfiguracji publiczny adres `https://…`
(`RatingLink:WebBaseUrl`, `Cors:Origins`). Proxy musi przepuszczać WebSocket (`/hubs/monterio`).

## Aplikacja mobilna instalatora (APK)
Jedno APK obsługuje każde wdrożenie — adres serwera wpisuje się na ekranie logowania.

Budowa (raz, na maszynie deweloperskiej; lokalny Gradle bywa niedostępny, więc chmura EAS):
```bash
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```
Pobrany `.apk` można dołączyć do instalatora: `installer\build.ps1 -Apk C:\sciezka\app.apk`
(trafi do `C:\Program Files\Monterio\mobile\Monterio-Instalator.apk`). Na telefonie wymagana zgoda
na instalację z nieznanych źródeł. Aplikacja łączy się po HTTP (dozwolone w buildzie).

## Budowanie instalatora (deweloper)
Wymaga Node.js, .NET SDK 10 i Inno Setup 6 (`winget install JRSoftware.InnoSetup`):
```powershell
installer\build.ps1
```
Wynik: `installer\build\Monterio-Setup-<wersja>.exe`. Wersja: `#define AppVersion` w `installer\Monterio.iss`.

## Znane ograniczenia
- Brak ról/RBAC, brak audytu — zgodnie z założeniem „Monterio ma zostać małe".
- Uwierzytelnianie Windows do SQL wymaga loginu dla konta SYSTEM z rolą `dbcreator` (usługa działa
  jako LocalSystem; nazwa konta zależy od języka Windows). Prościej: podaj w instalatorze login i
  hasło SQL. Polecenie niezależne od języka:
  ```
  sqlcmd -S "localhost\SQLEXPRESS" -E -Q "DECLARE @n sysname = SUSER_SNAME(0x010100000000000512000000); DECLARE @q nvarchar(400); IF SUSER_ID(@n) IS NULL BEGIN SET @q = 'CREATE LOGIN ' + QUOTENAME(@n) + ' FROM WINDOWS'; EXEC(@q); END; SET @q = 'ALTER SERVER ROLE dbcreator ADD MEMBER ' + QUOTENAME(@n); EXEC(@q);"
  ```

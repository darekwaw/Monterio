# Monterio — Pamięć projektu

## Projekt

Dedykowana, prosta aplikacja FSM (field service management) dla **Bel-Pol** (dystrybutor
drzwi/podłóg). Powstała jako **świadoma alternatywa** do adaptowania CMMS-a (drugi, znacznie
większy projekt Petrosoftu) pod model montażowy — po tym, jak ta adaptacja okazała się
nieintuicyjna w praktyce (2026-09-25, po realnym demie u klienta). Zob.
`docs/decisions/0001-nowe-repo-zamiast-cmms.md`.

**Zasada nadrzędna**: Monterio ma zostać MAŁE. Zero rozliczeń, zero cenników, zero SLA/priorytetów,
zero wielopoziomowego RBAC, zero multi-tenant drzewa firm. Jeśli funkcja przypomina CMMS-ową
złożoność — to sygnał żeby się zatrzymać, nie żeby kopiować wzorzec. **CMMS i Monterio to dwa
całkowicie niezależne repo/bazy/produkty** — nie ma między nimi współdzielonego kodu; rozwijanie
jednego nie wpływa na drugi.

Projekt jest w fazie przedsprzedażowej — pierwszy potencjalny klient (Bel-Pol) w rozmowach.

- **Backend**: `apps\api\` — .NET 10, Clean Architecture (Domain/Application/Infrastructure/API),
  CQRS+MediatR, EF Core 10, MS SQL Server. Ten sam stack co CMMS, świadomie odchudzony (bez
  Hangfire/MQTT/Redis/Dropbox/GoogleDrive/SSH.NET — dociągnąć tylko gdy faktycznie potrzebne).
- **Frontend**: `apps\web\` — Next.js 16 (App Router, Turbopack), TanStack Query, Tailwind CSS v4,
  Radix UI. **W pełni zaimplementowany** (stan: 2026-09-26) — patrz "Zaimplementowane moduły".
  Premium wygląd (paleta bursztynowo-antracytowa, nie generyczny SaaS-blue) — klient to "bogata
  firma", wygląd ma to odzwierciedlać.
- **Mobile**: **nie zaczęty.** Planowany z powiadomieniami PUSH (Firebase FCM) i wystawianiem oceny
  gwiazdkowej przez klienta — to jedne z rzeczy, które klient explicite chwalił na demie CMMS.
  Backend API pod ocenę już gotowy (`PUT /api/requests/{id}/rating`), czeka tylko na klienta.

## Uruchamianie

```
dotnet run --project apps\api\Monterio.API\Monterio.API.csproj   # API na :5020
npm run dev   # w apps\web\ — frontend na :3000
```

Migracje: `dotnet ef database update --project Monterio.Infrastructure --startup-project Monterio.API`
(**zatrzymaj serwer API przed `dotnet ef migrations add`** — inaczej blokuje DLL, ten sam gotcha
co w CMMS).

Baza dev: `MonterioDb_Dev` na tym samym lokalnym SQL Serverze co CMMS (`JSDWAWSZCZAKPC2\SQLEXPRESS`)
— osobna baza, nie koliduje z `CmmsDb_Dev`.

**Autentykacja — UWAGA, zmieniło się 2026-09-25**: `UseDevAuth` w `appsettings.Development.json`
jest teraz **`false`**. Wcześniej `true` fałszował tożsamość każdego żądania jako sztywno zakodowany
"Dev Dispatcher" (login `dev`), niezależnie od tego, kto faktycznie się zalogował w przeglądarce —
to była realna, cicha wada (m.in. `CreatedByEmployeeId` zawsze pokazywał "dev", niezależnie od tego,
kto naprawdę utworzył zlecenie). Teraz działa **prawdziwe JWT** (HS256, `EmployeeJwt` sekcja w
`appsettings.json`) — trzeba się realnie zalogować przez `POST /api/auth/login`.

Domyślny login dev (seedowany automatycznie): `admin` / `Admin123!`.

## Architektura domeny (stan: 2026-09-26, zaimplementowane end-to-end, przetestowane przez API+web)

### Encje
```
Address                — uniwersalny adres, FK z Company/Location/Contractor/Customer/Request
                          (Request.AddressId = adres WYKONANIA zlecenia, niezależny od adresu
                          klienta — np. nowa budowa pod innym adresem niż siedziba klienta)
Company                 — jeden rekord na wdrożenie (Bel-Pol), nie pełne drzewo jak w CMMS
Location                — materialized path, dowolna głębokość/kształt (Bel-Pol/Oddziały/Sklepy)
ServiceGroup            — przypisana do Location, skupia firmy B2B
Contractor              — firma B2B na umowie, własni pracownicy; agregowana ocena (patrz Request)
Employee                — JEDNA tabela logowania dla dyspozytora (CompanyId, web) i instalatora
                          (ContractorId, mobile/PIN — mobile jeszcze nie istnieje) — dokładnie
                          jedno z dwóch, PBKDF2 hasło, JWT login. Reset hasła: PUT .../password
ServiceGroupMember      — junction ServiceGroup ↔ Contractor
Customer                — klient indywidualny, płaski, zakładany inline przy zleceniu
MeasurementAttribute    — słownik punktów pomiarowych (Wysokość/Szerokość/Kierunek/Powierzchnia/
                          Wilgotność...), płaski, bez podziału typ/instancja. DataType: Decimal/
                          Text/Boolean/Date/Select — UI po stronie zadania (TaskRow) renderuje
                          właściwy widget (number/text/date/select/tak-nie) zależnie od DataType
ServiceCatalogItem      — pozycja katalogu usług, BEZ CENY
ServiceActivity         — czynność usługi, opcjonalny BEZPOŚREDNI FK do MeasurementAttribute
                          (nie key-matching jak w CMMS — Monterio nie ma Assetów, FK wprost wystarcza)
Request                 — zlecenie: klient + lokalizacja + adres wykonania + data planowana
                          (ScheduledDate) + data faktyczna (CompletionDate, auto-ustawiana przy
                          zmianie statusu na Wykonane) + przypisanie (grupa/firma/pracownik) +
                          status (enum) + ocena klienta (Rating 1-5 + RatingComment)
RequestActivity         — usługa na zleceniu, copy-on-assignment. MOŻNA dodać tę samą usługę
                          wielokrotnie (np. 15× "Wymiarowanie drzwi" w nowej budowie) — UI numeruje
                          duplikaty "#1", "#2"... (frontend, licząc po Name, nie ma tego w DB)
RequestActivityTask     — czynność zlecenia; gdy MeasurementAttributeId ustawiony, realizacja
                          zapisuje wartość WPROST na tym rekordzie (Measured{Decimal,Text,
                          Boolean,Date}) — JEDYNY dom wartości pomiaru, bez rozgałęzień jak w CMMS
RequestAttachment       — załącznik do zlecenia (WOW feature #1 z dema CMMS)
RequestNumberCounter    — licznik numeracji zleceń per Company+Year (CompanyId+Year=klucz,
                          LastNumber). NIE BaseEntity — jedyna operacja to atomowy
                          MERGE...OUTPUT (patrz niżej), nie zwykły EF change-tracking
PrintTemplate           — szablon HTML+tokeny do generowania PDF protokołu (WOW feature #2 z dema
                          CMMS) — W PEŁNI DZIAŁAJĄCE (Puppeteer), CRUD + edytor WYSIWYG w UI
```

### Ocena zadowolenia klienta (gwiazdki) — kto co robi
- **Wystawia**: klient, docelowo w aplikacji mobilnej (jeszcze nie istnieje). Backend już gotowy:
  `PUT /api/requests/{id}/rating` (`{rating: 1-5, comment?}`).
- **Web pokazuje, NIE wystawia** — świadoma decyzja usera (2026-09-26). Gwiazdki widoczne: na
  zleceniu (read-only, `Stars` component), przy firmie/instalatorze na liście Wykonawców
  (`averageRating`+`ratingCount`), w selectach przypisania zlecenia (`(★4.6)` przy nazwie).
- **Liczenie średniej**: zwykła nieważona `AVG(Rating)` WHERE `Rating IS NOT NULL`, osobno per
  `ContractorId` (firma) i osobno per `EmployeeId` (konkretna osoba). Ważne: **ocena trafia do
  instalatora tylko jeśli zlecenie miało wskazane konkretne `EmployeeId`**, nie tylko `ContractorId`
  — inaczej ocena "przepada" na poziom samej firmy i nie da się rozróżnić, kto w niej dobrze
  pracuje. Brak wygładzania małych próbek (jedna ocena 1★ dla kogoś z samymi 5★ mocno zbija wynik)
  — świadomie zostawione proste, do rozważenia jeśli klient zgłosi to jako problem.
- Różnica dni planowana/faktyczna: `formatDayDifference()` w `lib/utils.ts` (frontend) i
  `FormatDayDifference()` w `GetRequestProtocolQuery.cs` (backend, token `{{roznica_dni}}`).

### Numeracja zleceń — atomowa, bez wyścigu (2026-09-25)
Wcześniej: `COUNT(Number LIKE 'ZL/{rok}/%') + 1` — wolniejsze z czasem (skan rosnącej tabeli) i
**podatne na wyścig** (dwa równoczesne tworzenia mogły dostać ten sam numer, drugi insert wywalał
się na unique constraint). Teraz: `RequestNumberCounter` + jeden atomowy SQL:
```sql
MERGE RequestNumberCounters WITH (HOLDLOCK) AS target
USING (SELECT @companyId AS CompanyId, @year AS Year) AS src
ON target.CompanyId = src.CompanyId AND target.Year = src.Year
WHEN MATCHED THEN UPDATE SET LastNumber = target.LastNumber + 1
WHEN NOT MATCHED THEN INSERT (CompanyId, Year, LastNumber) VALUES (src.CompanyId, src.Year, 1)
OUTPUT inserted.LastNumber AS Value;
```
(`WITH (HOLDLOCK)` usuwa znaną lukę wyścigu samego MERGE). Zweryfikowane: 20 równoczesnych
tworzeń zleceń → zero duplikatów, numeracja ciągła. Implementacja: `IRequestNumberGenerator` /
`RequestNumberGenerator.cs` (Infrastructure), wołane z `CreateRequestCommandHandler`.

### Generowanie PDF protokołu — Puppeteer z poolingiem przeglądarki
`IPdfRenderer` / `PuppeteerPdfRenderer.cs` — **jedna żywa instancja Chromium na cały czas życia
procesu API** (klasa jest singletonem w DI), każdy PDF dostaje tylko nową, lekką kartę (`Page`),
NIE nowy proces przeglądarki. Bez tego setki równoległych wydruków (setki dyspozytorów) odpalałyby
setki procesów Chromium naraz. Jeśli przeglądarka padnie, `IsConnected` wykrywa to i następne
żądanie odpala ją ponownie. Zweryfikowane: 8 równoległych żądań PDF → liczba procesów `chrome.exe`
się nie zmieniła (single instance).

Tokeny w szablonie (edytowalne w `/szablony-wydruku`, WYSIWYG `RichTextEditor` — port z CMMS,
przystosowany do palety Monterio): `numer_zlecenia`, `data_utworzenia`, `data_wykonania` (planowana),
`data_realizacji` (faktyczna), `roznica_dni`, `klient_nazwa`, `klient_telefon`, `klient_adres`,
`adres_wykonania` (fallback na adres klienta gdy brak), `lokalizacja`, `opis`, `grupa_serwisowa`,
`firma_wykonawcza`, `instalator`, `tabela_uslug` (gotowy HTML, generowany z aktywności/zadań,
formatuje wynik zależnie od `AttributeDataType` zadania).

### Real-time sync — SignalR (2026-09-26)
Dokładnie ten sam mechanizm co w CMMS (push + invalidacja cache po stronie klienta), ale mocno
odchudzony pod jednotenantowość Monterio:
- Backend: `MonterioHub` (`/hubs/monterio`, `[Authorize]`), grupa `company_{id}` (Monterio ma jeden
  Company na wdrożenie, więc to praktycznie "wszyscy"). Jedno zdarzenie `RequestsChanged` (payload:
  `{requestId}`) wysyłane po KAŻDEJ zmianie zlecenia (create/assign/status/activity/measurement/
  attachment/address/date/rating) — 12 handlerów wstrzykuje `IRequestHubService`.
- Frontend: `useRequestsRealtime()` (`hooks/useSignalR.ts`), podpięty raz w `(main)/layout.tsx`.
  Na `RequestsChanged` robi `queryClient.invalidateQueries({queryKey:['requests']})` — trafia i w
  listę, i w otwarte okno szczegółów (częściowe dopasowanie klucza).
- **Gotcha**: `@microsoft/signalr` domyślnie łączy się z `withCredentials: true` (cookies), a CORS
  Monterio nie ma `AllowCredentials()` (auth jest przez token, nie cookies) → błąd CORS przy
  negocjacji. Fix: `withCredentials: false` w opcjach połączenia klienta — NIE dodawaj
  `AllowCredentials()` po stronie serwera, to zły kierunek naprawy dla auth opartego o token.
- Auth handshake: WebSocket nie wysyła nagłówka `Authorization`, więc token leci w query stringu
  (`?access_token=...`, SignalR robi to automatycznie z `accessTokenFactory`). Program.cs ma
  `JwtBearerEvents.OnMessageReceived`, który wyciąga token z query stringu **tylko dla ścieżek
  `/hubs`** (żeby nie osłabić zwykłego auth przez nagłówek gdzie indziej).

### Pobieranie plików — auth-aware, NIE zwykły `<a href>`
Zanim wyłączono DevAuth, zwykłe `<a href="...">` do pobrania załącznika/protokołu działało
przypadkiem (DevAuth i tak ignorował auth). Po włączeniu prawdziwego JWT, przeglądarka przy zwykłej
nawigacji **nie wysyła nagłówka Authorization** → 401. Fix: `lib/download.ts` —
`openAuthenticatedFile()` (pobiera przez `apiClient` z tokenem, otwiera w nowej karcie — dla
protokołu, do podglądu/druku) i `downloadAuthenticatedFile()` (force-download — dla załączników).
Okno trzeba otworzyć SYNCHRONICZNIE w handlerze kliknięcia (`window.open('', '_blank')` przed
`await`), inaczej przeglądarka blokuje je jako popup, bo samo pobranie danych jest asynchroniczne.
**Jeśli dodajesz nowy link do pobrania czegokolwiek z API — użyj tego helpera, nie `<a href>`.**

## Zaimplementowane moduły

### Backend (kontrolery, `apps/api/Monterio.API/Controllers/`)
`AuthController` (login), `LocationsController`, `ServiceGroupsController` (+ members),
`ContractorsController`, `EmployeesController` (+ password), `CustomersController`,
`MeasurementAttributesController`, `ServiceCatalogController` (+ activities), `RequestsController`
(największy — CRUD, activities, assign, status, scheduled-date, completion-date, address, rating,
tasks toggle/measurement, attachments upload/download, protocol.pdf), `PrintTemplatesController`
(+ set-default).

### Frontend (strony, `apps/web/src/app/(main)/`)
`/` (Dashboard), `/zlecenia` (lista z wyszukiwaniem + kolumny Planowana/Faktyczna z plakietką
różnicy dni, okno szczegółów z zakładkami Usługi/Załączniki), `/analizy` (zob. niżej), `/klienci`,
`/lokalizacje` (drzewo, ikony edycji/dodawania na stałe widoczne, nie tylko na hover), `/katalog`
(usługi+czynności+punkty pomiarowe, wszystko edytowalne), `/wykonawcy` (grupy serwisowe, firmy,
instalatorzy — z gwiazdkami), `/pracownicy` (zarządzanie kontami dyspozytorów), `/szablony-wydruku`
(CRUD + `RichTextEditor` WYSIWYG), `/login`.

### Analizy (2026-09-29) — świadomie NIE port CMMS-owego `/analytics`
CMMS ma tam MTTR/MTBF/przeglądy wg cyklu — pojęcia oparte o Assety, których Monterio celowo nie ma.
Monterio dostało własny, dobrany pod jego domenę odpowiednik:
- Backend: `GET /api/requests/analytics` (`companyId`, `fromDate`, `toDate`, opcjonalnie
  `locationId`/`serviceGroupId`/`contractorId`) → `GetRequestAnalyticsQuery`/`RequestAnalyticsDto`
  (`Monterio.Application/Requests/Queries/GetRequestAnalyticsQuery.cs`). Zakres dat filtruje po
  `Request.CreatedAt` (baza), miesięczne słupki grupują też po `CreatedAt`; "wykonane na czas/
  wcześniej/opóźnione" liczone tylko dla zleceń ze statusem Wykonane, które mają OBIE daty
  (`ScheduledDate`+`CompletionDate`) ustawione — reszta zleceń nie wchodzi do tego wskaźnika.
  Filtr lokalizacji to dokładne dopasowanie `LocationId`, BEZ kaskadowania po drzewie (materialized
  path) — świadome uproszczenie na start, do rozważenia jeśli klient zgłosi taką potrzebę.
- Frontend: `/analizy` (`apps/web/src/app/(main)/analizy/page.tsx`), wykresy przez **recharts**
  (nowa zależność, dodana specjalnie pod ten moduł — wcześniej żadnej biblioteki wykresów nie było).
  Metryki: zlecenia utworzone/wykonane miesiąc do miesiąca, terminowość (pie), rozkład statusów
  (pie, etykiety z `REQUEST_STATUS_LABELS`, NIE z surowego `enum.ToString()` z backendu — inaczej
  "WTrakcie" zamiast "W trakcie"), ranking firm wykonawczych i instalatorów (liczba zleceń + średnia
  ocena, reużywa `Stars`).

## Świadome uproszczenia względem CMMS (i dlaczego)
- **Brak Asset/wyposażenia w ogóle.** Monterio nie śledzi zainstalowanego sprzętu — tylko
  wykonanie usługi z zapisanymi pomiarami. `ServiceActivity.MeasurementAttributeId` jest
  bezpośrednim FK, nie kluczem do dopasowania w locie — w CMMS to (`AssetAttributeMatcher`) było
  źródłem realnego, ukrytego buga. W Monterio ta klasa buga jest strukturalnie niemożliwa.
- **`RequestStatus` to enum, nie encja.** Stałe 5 stanów (Nowe/Przypisane/WTrakcie/Wykonane/
  Anulowane). Pierwsze miejsce do rozbudowy, jeśli się okaże za sztywne.
- **Brak audytu (AuditLog).** Tylko `CreatedBy`/`UpdatedBy`/`CreatedAt`/`UpdatedAt` na `BaseEntity`.
  Dodać jeśli klient zapyta "kto to zmienił".
- **Brak RBAC/ról.** Każde konto dyspozytora ma te same prawa — świadoma decyzja (2026-09-26), nie
  luka. Jeśli klient poprosi o rozróżnienie uprawnień, to nowa decyzja architektoniczna, nie
  "naprawianie braku".
- **FK policy: `NoAction` wszędzie poza czystą kompozycją.** Każdy FK do encji z `ISoftDelete` jest
  `NoAction`, nie `Cascade`/`SetNull` — hard-delete i tak nigdy się nie dzieje (Remove()
  przechwytywane w `AppDbContext.SaveChangesAsync`, zamieniane na soft-delete). Tylko prawdziwa
  kompozycja (`RequestActivity→Request`, `RequestActivityTask→RequestActivity`,
  `RequestAttachment→Request`, `ServiceActivity→ServiceCatalogItem`, `ServiceGroupMember`↔oba
  rodzice) ma `Cascade`. Dzięki tej regule migracja `InitialCreate` przeszła za pierwszym razem.

## Częste błędy do unikania
1. **Zatrzymaj serwer API przed `dotnet ef migrations add`** — blokuje DLL (`taskkill //F //PID X`
   po zidentyfikowaniu PID-u z komunikatu błędu builda).
2. **FK do encji z `ISoftDelete` = `NoAction`**, nigdy `Cascade`/`SetNull` bez wyraźnego powodu.
3. **Nowa migracja na tabelę, która już ma dane w innym kształcie numeracji/kluczy — dopisz seed
   danych w tej samej migracji** (patrz `AddRequestNumberCounters` — bez seeda pierwsze zlecenie po
   migracji dostałoby numer, który już istnieje).
4. **SignalR + auth przez token (nie cookies) → `withCredentials: false` po stronie klienta**, nie
   `AllowCredentials()` po stronie serwera.
5. **Link do pobrania pliku z API zawsze przez `lib/download.ts`**, nigdy goły `<a href>` — inaczej
   działa tylko dopóki DevAuth maskuje brak prawdziwej autoryzacji.
6. **Nie kopiuj CMMS-owych wzorców bezrefleksyjnie.** Ten plik dokumentuje gdzie i dlaczego Monterio
   świadomie robi inaczej — jeśli dopisujesz funkcję "bo tak było w CMMS", zatrzymaj się i zapytaj,
   czy to na pewno pasuje do dużo mniejszego zakresu Monterio.
7. **Encoding** — nie używaj PowerShell regex na plikach UTF-8 z polskimi znakami (psuje je). Write
   tool / Edit tool, nie `sed`/regex przez PowerShell.

## Co dalej / znane luki
- **Aplikacja mobilna** — nie zaczęta. Priorytet: logowanie PIN dla instalatora, lista/szczegóły
  przypisanych zleceń, realizacja czynności z pomiarami (uwzględniając `AttributeDataType`, jak w
  webowym `TaskRow`), załączniki, **wystawianie oceny gwiazdkowej klientowi** (endpoint już gotowy:
  `PUT /api/requests/{id}/rating`), docelowo powiadomienia PUSH (Firebase FCM).
- **Sekret JWT jest placeholderem w `appsettings.json`** (`EmployeeJwt:Secret`) — repo jest
  prywatne, ale **rotuj ten sekret i przenieś do zmiennej środowiskowej/`appsettings.Local.json`
  (już ignorowany przez git) przed realnym wdrożeniem produkcyjnym.**
- **Skala/wydajność pod obciążeniem** (analiza 2026-09-26, wzorzec z CMMS: 400 użytkowników ×
  2 zlecenia/dzień × 365): numeracja zleceń i generowanie PDF już naprawione i zweryfikowane pod
  współbieżnością. Nie sprawdzone jeszcze: zachowanie SignalR przy dużej liczbie jednocześnie
  podłączonych klientów (każda zmiana zlecenia dziś odświeża wszystkich na raz — przy setkach
  użytkowników warto rozważyć debounce/throttle, nie pilne przy obecnej skali). Nieznany target
  produkcyjny SQL Server (dev używa SQLEXPRESS, limit 10GB — sprawdzić przed realnym wdrożeniem).
- **RBAC/role** — świadomie pominięte. Jeśli klient poprosi o rozróżnienie uprawnień między
  dyspozytorami, to nowa decyzja do przemyślenia w duchu "zostać MAŁYM", nie kopiowanie CMMS-owego
  `Role`/`Permission`/`EmployeeRole`.

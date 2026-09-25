# Monterio — Pamięć projektu

## Projekt

Dedykowana, prosta aplikacja FSM (field service management) dla Bel-Pol (dystrybutor drzwi/podłóg).
Powstała jako **świadoma alternatywa** do adaptowania CMMS-a (drugi, znacznie większy projekt
Petrosoftu) pod model montażowy — po tym, jak ta adaptacja okazała się nieintuicyjna w praktyce
(2026-09-25, po realnym demie u klienta). Zob. `docs/decisions/0001-nowe-repo-zamiast-cmms.md`.

**Zasada nadrzędna**: Monterio ma zostać MAŁE. Zero rozliczeń, zero cenników, zero SLA/priorytetów,
zero wielopoziomowego RBAC, zero multi-tenant drzewa firm. Jeśli funkcja przypomina CMMS-ową
złożoność — to sygnał żeby się zatrzymać, nie żeby kopiować wzorzec.

- **Backend**: `apps\api\` — .NET 10, Clean Architecture (Domain/Application/Infrastructure/API),
  CQRS+MediatR, EF Core 10, MS SQL Server. Ten sam stack co CMMS, świadomie odchudzony (bez
  Hangfire/MQTT/Redis/Dropbox/GoogleDrive/SSH.NET — dociągnąć tylko gdy faktycznie potrzebne).
- **Frontend**: `apps\web\` — Next.js (App Router), TanStack Query, Tailwind CSS. Jeszcze nie
  zaimplementowany (stan na 2026-09-25).
- **Mobile**: nie zaczęty. Planowany z powiadomieniami PUSH (Firebase FCM) — to jedna z dwóch
  rzeczy, które klient explicite chwalił na demie CMMS.

## Uruchamianie

```
dotnet run --project apps\api\Monterio.API\Monterio.API.csproj   # API na :5020
npm run dev   # w apps\web\ — frontend na :3010 (gdy powstanie)
```

Migracje: `dotnet ef database update --project Monterio.Infrastructure --startup-project Monterio.API`
(zatrzymaj serwer API przed `dotnet ef migrations add` — blokuje DLL, ten sam gotcha co w CMMS).

Baza dev: `MonterioDb_Dev` na tym samym lokalnym SQL Serverze co CMMS (`JSDWAWSZCZAKPC2\SQLEXPRESS`)
— osobna baza, nie koliduje z `CmmsDb_Dev`.

Domyślny login dev: `admin` / `Admin123!` (seedowany automatycznie, `UseDevAuth: true` w
`appsettings.Development.json` i tak omija auth całkowicie — ten sam wzorzec co CMMS).

## Architektura domeny (stan: 2026-09-25, zaimplementowane i przetestowane end-to-end przez API)

### Encje
```
Address                    — uniwersalny adres, FK z Company/Location/Contractor/Customer
                              (WSZYSTKIE CZTERY muszą mieć AddressId — jawna decyzja usera)
Company                    — jeden rekord na wdrożenie (Bel-Pol), nie pełne drzewo jak w CMMS
Location                   — materialized path, dowolna głębokość/kształt (Bel-Pol/Oddziały/Sklepy)
ServiceGroup                — przypisana do Location, skupia firmy B2B
Contractor                  — firma B2B na umowie, własni pracownicy
Employee                    — JEDNA tabela logowania dla dyspozytora (CompanyId) i instalatora
                              (ContractorId) — dokładnie jedno z dwóch, PBKDF2 hasło, JWT login
ServiceGroupMember           — junction ServiceGroup ↔ Contractor
Customer                    — klient indywidualny, płaski, zakładany inline przy zleceniu
MeasurementAttribute         — słownik punktów pomiarowych (Wysokość/Szerokość/Kierunek/
                              Powierzchnia/Wilgotność...), płaski, bez podziału typ/instancja
ServiceCatalogItem           — pozycja katalogu usług, BEZ CENY
ServiceActivity              — czynność usługi, opcjonalny BEZPOŚREDNI FK do MeasurementAttribute
                              (nie key-matching jak w CMMS — Monterio nie ma Assetów, więc nie ma
                              czego disambiguować, FK wprost wystarcza)
Request                     — zlecenie: klient + data + przypisanie (grupa/firma/pracownik) + status
                              (enum, nie konfigurowalny słownik jak w CMMS)
RequestActivity              — usługa na zleceniu, copy-on-assignment (kopia nazwy z katalogu)
RequestActivityTask          — czynność zlecenia; gdy MeasurementAttributeId ustawiony, realizacja
                              zapisuje wartość WPROST na tym rekordzie (Measured*) — JEDYNY dom
                              wartości pomiaru, bez rozgałęzień jak w CMMS (tam AssetAttributeValue
                              vs RequestActivityTask.MeasuredValue, bo CMMS ma dwa różne scenariusze
                              — Monterio ma tylko jeden, bo nie ma Assetów w ogóle)
RequestAttachment            — załącznik do zlecenia (WOW feature #1 z dema)
PrintTemplate                 — szablon HTML+tokeny do generowania PDF (WOW feature #2 z dema) —
                              ENCJA gotowa, ale generowanie PDF (Puppeteer) jeszcze niezaimplementowane
```

### Świadome uproszczenia względem CMMS (i dlaczego)
- **Brak Asset/wyposażenia w ogóle.** Monterio nie śledzi zainstalowanego sprzętu — tylko
  wykonanie usługi z zapisanymi pomiarami. Stąd `ServiceActivity.MeasurementAttributeId` jest
  bezpośrednim FK, nie kluczem do dopasowania w locie — to jedna z rzeczy, która w CMMS dzisiaj
  (25.09) okazała się realnym, ukrytym bugiem (`AssetAttributeMatcher` wymagał `assetId`, więc
  zlecenie bez urządzenia nigdy nie łączyło zadania z punktem pomiarowym). W Monterio ta klasa
  buga jest strukturalnie niemożliwa.
- **`RequestStatus` to enum, nie encja.** CMMS ma konfigurowalny `RequestStatus`+`StatusTransition`
  z rolami dozwalającymi przejścia. Monterio zaczyna od stałych 5 stanów
  (Nowe/Przypisane/WTrakcie/Wykonane/Anulowane). Pierwsze miejsce do rozbudowy, jeśli się okaże
  za sztywne.
- **Brak audytu (AuditLog).** CMMS loguje każdą zmianę encji z diff-em pól. Monterio na razie tylko
  `CreatedBy`/`UpdatedBy`/`CreatedAt`/`UpdatedAt` na `BaseEntity`. Dodać jeśli klient zapyta "kto
  to zmienił".
- **Brak domain events / MediatR notifications.** CMMS dispatchuje `IDomainEvent` przez MediatR do
  m.in. managera powiadomień. Monterio nie ma tego jeszcze wcale — potrzebne dopiero przy PUSH
  (FCM), które jest zaplanowane, ale nieprzeprowadzone.
- **FK policy: `NoAction` wszędzie poza czystą kompozycją.** Każdy FK do encji z `ISoftDelete`
  (czyli prawie każdej) jest `NoAction`, nie `Cascade`/`SetNull` — bo hard-delete tych encji i tak
  nigdy się nie dzieje (Remove() jest przechwytywane w `AppDbContext.SaveChangesAsync` i zamieniane
  na soft-delete). Tylko prawdziwa kompozycja (`RequestActivity→Request`,
  `RequestActivityTask→RequestActivity`, `RequestAttachment→Request`, `ServiceActivity→
  ServiceCatalogItem`, `ServiceGroupMember`↔oba rodzice) ma `Cascade`. Dzięki tej regule migracja
  `InitialCreate` przeszła za pierwszym razem — w CMMS dokładnie ten sam problem (SQL Server
  "multiple cascade paths") kosztował dzisiaj 3 podejścia do migracji `Customer`, bo tamta reguła
  nie była ustalona z góry.

## Częste błędy do unikania (przeniesione z doświadczenia CMMS)
1. **Zatrzymaj serwer API przed `dotnet ef migrations add`** — blokuje DLL.
2. **FK do encji z `ISoftDelete` = `NoAction`**, nigdy `Cascade`/`SetNull` bez wyraźnego powodu —
   zob. wyżej.
3. **Nie kopiuj CMMS-owych wzorców bezrefleksyjnie.** Ten plik ma dokumentować gdzie i dlaczego
   Monterio świadomie robi inaczej — jeśli dopisujesz funkcję "bo tak było w CMMS", zatrzymaj się
   i zapytaj, czy to na pewno pasuje do dużo mniejszego zakresu Monterio.

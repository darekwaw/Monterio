# 0001 — Nowe repo zamiast adaptacji CMMS

**Data:** 2026-09-25
**Status:** zatwierdzone, w realizacji

## Kontekst

Od 22.09.2026 trwała próba zaadaptowania CMMS-a (dużego systemu utrzymania ruchu Petrosoftu) pod
model montażowy Bel-Pol — producenta drzwi/podłóg zlecającego montaż podwykonawcom B2B. Kluczowa
decyzja modelowa: klient indywidualny jako `Asset` (żeby uniknąć migracji i forka kodu).

25.09.2026, po zbudowaniu i przetestowaniu pełnego wydzielenia `Customer` jako osobnego bytu
(reversja tamtej decyzji) i pokazaniu użytkownikowi jak to obsługiwać w praktyce, reakcja była
jednoznaczna:

> "Program stał się tak nieintuicyjny. Wiedziałem że to zły pomysł z adaptacją CMMS'a... Tragedia -
> ja bym tego nie chciał obsługiwać... szkoda czasu. Zatrzymuję prace."

## Decyzja

Zamiast dalszej adaptacji CMMS-a — **nowe, dedykowane repo**, ten sam stack technologiczny
(.NET 10 + Next.js), ale świadomie dużo mniejszy zakres funkcjonalny. Nazwa: **Monterio**.

## Dlaczego to co innego niż porażka

CMMS jest zaprojektowany pod utrzymanie ruchu (majątek własny firmy, przeglądy cykliczne, SLA,
rozliczenia, wielopoziomowe uprawnienia). Model montażowy Bel-Pol to w praktyce **field service
management** — zupełnie inna domena, która tylko przypadkiem dzieliła kilka pojęć (grupa
serwisowa, wykonawca, punkt pomiarowy). Próba wciśnięcia jednego w drugie generowała złożoność,
która nie wynikała z realnych potrzeb Bel-Pol, tylko z bagażu CMMS-a (drzewo Company/Location dla
majątku, Asset jako fundament całego systemu, RBAC pod wiele ról).

## Co zabieramy z CMMS

Nie repozytorium ani kod (poza wzorcami przepisanymi ręcznie, świadomie), tylko **sprawdzone,
przetestowane rozwiązania koncepcyjne**:
- Materialized path dla drzewa lokalizacji
- Grupa serwisowa skupiająca firmy B2B z własnymi pracownikami
- Wzorzec "zakładaj klienta inline w formularzu zlecenia"
- Punkt pomiarowy jako typowane pole (decimal/tekst/bool/data/select) podpięte do czynności usługi
- PBKDF2 hasła, JWT HS256, DevAuth do developmentu
- Szablon wydruku HTML+tokeny (Puppeteer) zamiast martwej ścieżki DevExpress/XML

## Co świadomie zostaje w CMMS, nie trafia do Monterio

SLA, priorytety, kontrakty, rozliczenia/cenniki/koszty/marże, Asset/wyposażenie, wielopoziomowy
RBAC, audyt zmian, multi-tenant drzewo firm, moduł magazynowy, integracja IoT/MQTT.

## Konsekwencje

- Dwa osobne repozytoria do utrzymania zamiast jednego — świadomy koszt, akceptowalny bo domeny
  są faktycznie różne, nie sztucznie rozdzielone.
- Model montażowy FSM w CMMS (`docs/architecture/model-montazowy-fsm.md`,
  branch `feature/customer-entity`) zostaje jako **zarzucony**, nie usunięty — historia i wnioski
  (szczególnie o klasach bugów, których tu unikamy: `AssetAttributeMatcher`, "multiple cascade
  paths") są wartościowe i przeniesione do `CLAUDE.md` tego repo.

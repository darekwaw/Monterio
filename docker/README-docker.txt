MONTERIO w Docker Desktop
=========================

Wymagania
- Windows 10/11 z zainstalowanym Docker Desktop (tryb kontenerow Linux / WSL2).
- Ok. 4 GB wolnej pamieci RAM dla Dockera (SQL Server w kontenerze) i ok. 3 GB miejsca na dysku.
- Internet NIE jest potrzebny - obrazy sa w paczce (images\monterio-images.tar).

Instalacja
1. Rozpakuj paczke do dowolnego folderu (np. C:\Monterio-Docker) i zostaw go na stale -
   w nim leza docker-compose.yml i plik .env z sekretami.
2. Uruchom Zainstaluj-Monterio.cmd (dwuklik).
   Opcjonalnie inny port / adres: Zainstaluj-Monterio.cmd -Port 8080 -PublicUrl http://nazwa-komputera:8080
3. Skrypt zaladuje obrazy, wygeneruje .env z losowymi sekretami i uruchomi projekt "monterio".
4. Otworz http://localhost:5020. Pierwsze logowanie: admin / Admin123! (zmien haslo od razu).

W Docker Desktop
Zakladka Containers -> projekt (kolekcja) "monterio" z dwoma kontenerami:
- api - aplikacja Monterio (API + interfejs www, port 5020),
- db  - SQL Server (dostepny tylko dla api, port nie jest wystawiony na zewnatrz).
Przyciskami Start/Stop przy projekcie wlaczasz i wylaczasz calosc. Kontenery startuja same
po uruchomieniu Docker Desktop (restart: unless-stopped).

Aktualizacja
Rozpakuj nowa paczke do TEGO SAMEGO folderu (nadpisz pliki, zachowaj .env) i uruchom
Zainstaluj-Monterio.cmd. Dane (baza, zalaczniki) zostaja w wolumenach Dockera.
Migracje bazy wykonuja sie automatycznie przy starcie.

Kopia zapasowa
- plik .env (utrata = brak dostepu do bazy),
- wolumeny monterio_monterio-db (baza) i monterio_monterio-uploads (zalaczniki).
  Przyklad kopii zalacznikow:
  docker run --rm -v monterio_monterio-uploads:/data -v %cd%:/backup alpine tar czf /backup/uploads.tar.gz -C /data .

Usuniecie
  docker compose down            (zatrzymuje i usuwa kontenery, dane ZOSTAJA)
  docker compose down -v         (usuwa tez dane - nieodwracalne!)

Logi
  docker compose logs api

Aplikacja mobilna instalatora: adres serwera wpisuje sie na ekranie logowania
(http://<adres-komputera>:5020). Wymaga reguly zapory dla portu i dostepu z sieci telefonu.

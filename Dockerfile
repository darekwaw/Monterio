# Monterio — jeden obraz: API (.NET 10) + statyczny frontend (Next.js export) w wwwroot.
# Kontekst budowania: katalog główny repo. Brak projektu testowego w repo, więc etap `test` pominięty.

# ---- 1) Frontend: statyczny eksport, serwowany przez API (jeden proces, jeden port)
FROM node:22-alpine AS web-build
WORKDIR /src
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY apps/web/ ./
ENV NEXT_OUTPUT=export \
    NEXT_PUBLIC_API_URL=same-origin \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- 2) API: publish framework-dependent (runtime dostarcza obraz aspnet)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api-build
WORKDIR /src
COPY apps/api/ ./apps/api/
RUN dotnet publish apps/api/Monterio.API/Monterio.API.csproj -c Release -o /out /p:UseAppHost=false

# ---- 3) Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
# Chrome: generowanie PDF protokołów (Puppeteer). Pakiet apt `chromium` na Ubuntu 24.04 to tylko
# wrapper na snapa (bez binarki w kontenerze), dlatego oficjalny .deb Google Chrome (build wymaga internetu).
# curl: HEALTHCHECK. libicu74: Microsoft.Data.SqlClient nie działa w trybie Globalization Invariant.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates fonts-liberation libicu74 \
    && curl -fsSL -o /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt-get install -y --no-install-recommends /tmp/chrome.deb \
    && rm -f /tmp/chrome.deb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=api-build /out ./
COPY --from=web-build /src/out ./wwwroot

# Załączniki na wolumenie; katalog należy do użytkownika non-root (wolumen dziedziczy właściciela).
RUN mkdir -p /data/uploads && chown -R app:app /data /app

ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://0.0.0.0:5020 \
    Storage__Local__UploadPath=/data/uploads \
    Pdf__ChromePath=/usr/bin/google-chrome-stable \
    HOME=/tmp

USER app
EXPOSE 5020
VOLUME ["/data/uploads"]

# Wystarczy odpowiedź 200 ze strony głównej (index.html z wwwroot) — migracje bazy kończą się przed startem Kestrela.
HEALTHCHECK --interval=15s --timeout=5s --start-period=90s --retries=5 \
    CMD curl -fs -o /dev/null http://localhost:5020/ || exit 1

ENTRYPOINT ["dotnet", "Monterio.API.dll"]

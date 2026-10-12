# Monterio web — osobny kontener (Next.js standalone). Kontekst budowania: apps/web.
# /api i /hubs są przekierowywane do kontenera "api" (patrz next.config.ts), więc adres API
# nie jest wpisany w kod. Brak testów jednostkowych w projekcie, więc etap `test` pominięty.

FROM node:22-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
# Opcjonalny firmowy CA (siec z inspekcja TLS): sekret `corp_ca`, tylko na czas tego kroku - nie trafia do obrazu.
RUN --mount=type=secret,id=corp_ca \
    if [ -s /run/secrets/corp_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/corp_ca; fi; \
    npm ci --no-audit --no-fund
COPY . .
ENV NEXT_OUTPUT=standalone \
    NEXT_PUBLIC_API_URL=same-origin \
    API_INTERNAL_URL=http://api:5020 \
    NEXT_TELEMETRY_DISABLED=1
# next/font pobiera czcionki Geist z Google Fonts podczas budowania (klient TLS Turbopacka, nie Node - czyta
# SSL_CERT_FILE, ktory zastepuje caly pakiet, wiec laczymy systemowy pakiet z firmowym CA).
RUN --mount=type=secret,id=corp_ca \
    if [ -s /run/secrets/corp_ca ]; then \
        export NODE_EXTRA_CA_CERTS=/run/secrets/corp_ca; \
        cat /etc/ssl/certs/ca-certificates.crt /run/secrets/corp_ca > /tmp/ca-bundle.crt; \
        export SSL_CERT_FILE=/tmp/ca-bundle.crt; \
    fi; \
    npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /src/.next/standalone ./
COPY --from=build --chown=node:node /src/.next/static ./.next/static
COPY --from=build --chown=node:node /src/public ./public

USER node
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
    CMD wget -q -O /dev/null http://127.0.0.1:3000/login || exit 1

CMD ["node", "server.js"]

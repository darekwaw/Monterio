import type { NextConfig } from "next";

// NEXT_OUTPUT=export     → statyczny eksport serwowany przez API (wersja instalacyjna, patrz /installer).
// NEXT_OUTPUT=standalone → osobny kontener web w Dockerze (apps/web/Dockerfile). Przeglądarka rozmawia
//   tylko z tym serwerem (NEXT_PUBLIC_API_URL=same-origin), a /api i /hubs są przekierowywane do API
//   w sieci compose — dzięki temu adres API nie jest wpisany w kod (znany dopiero u klienta) i nie ma CORS.
//   API_INTERNAL_URL jest wartością czasu BUDOWANIA (trafia do routes-manifest).
const output = process.env.NEXT_OUTPUT;

const nextConfig: NextConfig = {
  ...(output === "export" && { output: "export", trailingSlash: true }),
  ...(output === "standalone" && {
    output: "standalone",
    // Next buforuje body przekierowywanych zadan i domyslnie obcina je do 10 MB (potem "socket hang up").
    // Zalaczniki w API maja limit 50 MB (RequestSizeLimit), wiec limit proxy musi byc nie mniejszy.
    experimental: { proxyClientMaxBodySize: "60mb" },
    async rewrites() {
      const api = process.env.API_INTERNAL_URL ?? "http://api:5020";
      return [
        { source: "/api/:path*", destination: `${api}/api/:path*` },
        { source: "/hubs/:path*", destination: `${api}/hubs/:path*` },
      ];
    },
  }),
};

export default nextConfig;

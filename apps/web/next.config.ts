import type { NextConfig } from "next";

// NEXT_OUTPUT=export → statyczny eksport serwowany przez API (wersja instalacyjna, patrz /installer).
const nextConfig: NextConfig = {
  ...(process.env.NEXT_OUTPUT === "export" && { output: "export", trailingSlash: true }),
};

export default nextConfig;

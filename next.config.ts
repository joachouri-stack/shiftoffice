import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mode serveur autonome : génère .next/standalone/server.js, prêt à tourner
  // sous Node (PM2) derrière nginx en reverse proxy sur le VPS.
  output: "standalone",
};

export default nextConfig;

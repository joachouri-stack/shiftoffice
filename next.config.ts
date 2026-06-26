import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export statique : génère un dossier `out/` de fichiers HTML/CSS/JS
  // prêts à déposer sur un serveur nginx (aucun processus Node requis).
  output: "export",
  // L'optimisation d'images Next nécessite un serveur ; on la désactive
  // pour l'export statique (on n'utilise pas next/image pour l'instant).
  images: { unoptimized: true },
  // URLs en /page/ → nginx sert /page/index.html sans config particulière.
  trailingSlash: true,
};

export default nextConfig;

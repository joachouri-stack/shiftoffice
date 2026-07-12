import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/espace", "/compte", "/connexion", "/generer/", "/auth/", "/api/", "/admin"],
    },
    sitemap: "https://shiftoffice.fr/sitemap.xml",
  };
}

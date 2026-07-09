import type { MetadataRoute } from "next";
import { DOCUMENTS, flowHref } from "@/lib/documents";

const BASE = "https://shiftoffice.fr";

export default function sitemap(): MetadataRoute.Sitemap {
  const docs = DOCUMENTS.map((d) => ({
    url: `${BASE}${flowHref(d.slug)}`,
    changeFrequency: "monthly" as const,
    priority: d.free ? 0.9 : 0.8,
  }));
  return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    ...docs,
    { url: `${BASE}/cgv`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/cgu`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/mentions-legales`, changeFrequency: "yearly", priority: 0.2 },
  ];
}

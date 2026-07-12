"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { DOCUMENTS, flowHref } from "@/lib/documents";

/**
 * Mesure d'audience anonyme et sans cookie : à chaque changement de page,
 * un événement `pageview` est envoyé à /api/track. L'identifiant de session
 * est un simple aléa stocké en sessionStorage (perdu à la fermeture de
 * l'onglet) — aucune donnée personnelle, pas de bandeau de consentement
 * nécessaire.
 */

function sid(): string {
  try {
    let s = sessionStorage.getItem("so.sid");
    if (!s) {
      s = crypto.randomUUID();
      sessionStorage.setItem("so.sid", s);
    }
    return s;
  } catch {
    return "anon";
  }
}

/** Slug du document si la page est l'un des 12 parcours. */
function docPour(path: string): string | undefined {
  return DOCUMENTS.find((d) => flowHref(d.slug) === path)?.slug;
}

/** Provenance, envoyée une seule fois par session : utm_source sinon référent externe. */
function sourceInitiale(): string | undefined {
  try {
    if (sessionStorage.getItem("so.src")) return undefined;
    sessionStorage.setItem("so.src", "1");
    const utm = new URLSearchParams(window.location.search).get("utm_source");
    if (utm) return utm;
    if (!document.referrer) return undefined;
    const host = new URL(document.referrer).hostname;
    return host && host !== window.location.hostname ? host : undefined;
  } catch {
    return undefined;
  }
}

export function Track() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const body = JSON.stringify({
      sid: sid(),
      path: pathname,
      doc: docPour(pathname),
      source: sourceInitiale(),
    });
    try {
      const ok = navigator.sendBeacon?.(
        "/api/track",
        new Blob([body], { type: "application/json" })
      );
      if (!ok) {
        void fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
      }
    } catch {
      void fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  }, [pathname]);

  return null;
}

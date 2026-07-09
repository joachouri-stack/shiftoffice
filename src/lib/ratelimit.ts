/**
 * Limiteur de débit en mémoire (fenêtre glissante) — suffisant pour un
 * déploiement mono-serveur (Next standalone). Protège les routes coûteuses
 * (appels IA) contre le martelage.
 */
const hits = new Map<string, number[]>();

export function rateLimitOk(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  // Nettoyage opportuniste pour éviter la croissance infinie.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }
  return true;
}

export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "inconnu";
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Recherche d'entreprise via l'API publique « Recherche d'entreprises »
 * (annuaire-entreprises / data.gouv) — gratuite et sans clé. Proxy serveur
 * pour éviter les soucis CORS et normaliser la réponse.
 *
 * NB : la convention collective est seulement *suggérée* à partir du code NAF
 * (le NAF ≠ la convention applicable) — elle reste à confirmer par l'employeur.
 */

const CONVENTIONS_NAF: Record<string, string> = {
  "4329A": "Convention BTP — Ouvriers",
  "4329B": "Convention BTP — Ouvriers",
  "4311Z": "Convention BTP — Ouvriers",
  "4321A": "Convention BTP — Ouvriers",
  "4322A": "Convention BTP — Ouvriers",
  "4331Z": "Convention BTP — Ouvriers",
  "4332A": "Convention BTP — Ouvriers",
  "4333Z": "Convention BTP — Ouvriers",
  "4334Z": "Convention BTP — Ouvriers",
  "4711D": "Convention Commerce de détail alimentaire",
  "4711F": "Convention Commerce de détail alimentaire",
  "4719A": "Convention Commerce de détail non alimentaire",
  "5610A": "Convention Restauration rapide",
  "5610C": "Convention Restauration traditionnelle",
  "9602A": "Convention Coiffure",
  "8610Z": "Convention Hospitalière privée",
  "6201Z": "Convention Syntec (informatique)",
  "4941A": "Convention Transport routier",
};

type ApiResult = {
  nom_complet?: string;
  nom_raison_sociale?: string;
  siege?: {
    siret?: string;
    adresse?: string;
    numero_voie?: string;
    type_voie?: string;
    libelle_voie?: string;
    code_postal?: string;
    libelle_commune?: string;
    commune?: string;
  };
  activite_principale?: string;
};

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) return Response.json([]);

  try {
    const api = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(
      q
    )}&page=1&per_page=6`;
    const r = await fetch(api, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return Response.json([]);
    const data = (await r.json()) as { results?: ApiResult[] };

    const escapeReg = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const out = (data.results ?? []).map((e) => {
      const s = e.siege ?? {};
      const naf = e.activite_principale ?? "";
      const cp = s.code_postal || "";
      const commune = s.libelle_commune || s.commune || "";
      // Adresse = la rue seule : le code postal et la ville sont renvoyés à
      // part, et les formulaires les recomposent (sinon ils seraient doublés).
      const rue = [s.numero_voie, s.type_voie, s.libelle_voie]
        .filter(Boolean)
        .join(" ");
      let adresse = rue || s.adresse || "";
      if (!rue && cp && commune) {
        adresse = adresse
          .replace(new RegExp(`[,\\s]*${escapeReg(cp)}\\s+${escapeReg(commune)}\\s*$`, "i"), "")
          .trim();
      }
      return {
        nom: e.nom_complet || e.nom_raison_sociale || "",
        siret: s.siret || "",
        adresse,
        codePostal: cp,
        ville: commune,
        codeNaf: naf,
        convention: CONVENTIONS_NAF[naf] || "",
      };
    });
    return Response.json(out);
  } catch {
    return Response.json([]);
  }
}

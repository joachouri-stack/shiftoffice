import { calculerFichePaie } from "@/lib/paie/calcul";
import { buildFichePaiePDF } from "@/lib/pdf/fiche-paie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Génération des documents (formulaire + PDF).
 * NOTE : le paiement (Stripe) n'est pas encore branché. À l'activation, cette
 * route devra exiger un paiement confirmé pour les documents payants.
 */

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function POST(req: Request) {
  let body: { type_document?: string; donnees?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const type = body.type_document ?? "";
  const d = body.donnees ?? {};

  if (type === "fiche-paie") {
    const result = calculerFichePaie({
      salaireBrut: num(d.salaireBrut),
      heuresSup: num(d.heuresSup),
      primes: num(d.primes),
    });
    const pdf = await buildFichePaiePDF({
      entrepriseNom: String(d.entrepriseNom ?? ""),
      entrepriseAdresse: String(d.entrepriseAdresse ?? ""),
      siret: String(d.siret ?? ""),
      salarieNom: String(d.salarieNom ?? ""),
      poste: String(d.poste ?? ""),
      numeroSecu: String(d.numeroSecu ?? ""),
      periode: String(d.periode ?? ""),
      result,
    });
    return new Response(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="fiche-de-paie.pdf"',
        "Cache-Control": "no-store",
      },
    });
  }

  return Response.json(
    { error: "Type de document non pris en charge." },
    { status: 400 }
  );
}

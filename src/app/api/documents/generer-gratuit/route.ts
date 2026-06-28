import { buildQuittancePDF, type QuittanceData } from "@/lib/pdf/quittance";
import {
  buildAttestationPDF,
  type AttestationData,
} from "@/lib/pdf/attestation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FREE_TYPES = ["quittance-loyer", "attestation-employeur"];

function num(v: unknown): number {
  const n =
    typeof v === "string" ? parseFloat(v.replace(",", ".")) : Number(v);
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

  if (!FREE_TYPES.includes(type)) {
    return Response.json(
      { error: "Ce document n'est pas disponible gratuitement." },
      { status: 400 }
    );
  }

  let pdf: Uint8Array;
  let filename: string;

  if (type === "quittance-loyer") {
    const data: QuittanceData = {
      bailleurNom: String(d.bailleurNom ?? ""),
      bailleurAdresse: String(d.bailleurAdresse ?? ""),
      locataire: String(d.locataire ?? ""),
      adresseBien: String(d.adresseBien ?? ""),
      periode: String(d.periode ?? ""),
      loyer: num(d.loyer),
      charges: num(d.charges),
      ville: String(d.ville ?? ""),
      datePaiement: String(d.datePaiement ?? ""),
    };
    pdf = await buildQuittancePDF(data);
    filename = "quittance-loyer.pdf";
  } else if (type === "attestation-employeur") {
    const data: AttestationData = {
      entrepriseNom: String(d.entrepriseNom ?? ""),
      entrepriseAdresse: String(d.entrepriseAdresse ?? ""),
      siret: String(d.siret ?? ""),
      representantNom: String(d.representantNom ?? ""),
      representantQualite: String(d.representantQualite ?? ""),
      salarieNom: String(d.salarieNom ?? ""),
      poste: String(d.poste ?? ""),
      typeContrat:
        d.typeContrat === "determinee" ? "determinee" : "indeterminee",
      dateEmbauche: String(d.dateEmbauche ?? ""),
      ville: String(d.ville ?? ""),
      date: String(d.date ?? ""),
    };
    pdf = await buildAttestationPDF(data);
    filename = "attestation-employeur.pdf";
  } else {
    return Response.json(
      { error: "Document bientôt disponible." },
      { status: 400 }
    );
  }

  return new Response(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

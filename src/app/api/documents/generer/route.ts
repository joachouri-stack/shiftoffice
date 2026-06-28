import { calculerFichePaie } from "@/lib/paie/calcul";
import { buildFichePaiePDF } from "@/lib/pdf/fiche-paie";
import { buildContratPDF } from "@/lib/pdf/contrat";
import { buildCertificatPDF } from "@/lib/pdf/certificat";
import { buildSoldeToutComptePDF } from "@/lib/pdf/solde-tout-compte";
import { buildRupturePDF } from "@/lib/pdf/rupture";
import { buildBailCommercialPDF } from "@/lib/pdf/bail-commercial";
import {
  buildStatutsPDF,
  type Associe,
  type StatutsData,
} from "@/lib/pdf/statuts";
import { getStripe, isStripeEnabled } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Génération des documents payants (formulaire + PDF).
 *
 * Si Stripe est configuré, un `session_id` de paiement vérifié est exigé :
 * le PDF n'est produit qu'après confirmation, côté serveur, que la session
 * Checkout est payée et correspond bien au type de document demandé.
 * Sans Stripe, la génération reste directe (dev / transition).
 */

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Vérifie qu'un paiement valide autorise la génération du document `type`.
 * Retourne true si Stripe est désactivé (mode direct), ou si la session
 * Checkout est payée et porte le bon type.
 */
async function paiementAutorise(
  type: string,
  sessionId: string | undefined
): Promise<boolean> {
  if (!isStripeEnabled()) return true;
  const stripe = getStripe();
  if (!stripe) return true;
  if (!sessionId) return false;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return (
      session.payment_status === "paid" && session.metadata?.type === type
    );
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  let body: {
    type_document?: string;
    donnees?: Record<string, unknown>;
    session_id?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const type = body.type_document ?? "";
  const d = body.donnees ?? {};

  if (!(await paiementAutorise(type, body.session_id))) {
    return Response.json(
      { error: "Paiement requis ou non confirmé." },
      { status: 402 }
    );
  }

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
    return pdfResponse(pdf, "fiche-de-paie.pdf");
  }

  if (type === "contrat-travail") {
    const pdf = await buildContratPDF({
      entrepriseNom: String(d.entrepriseNom ?? ""),
      entrepriseAdresse: String(d.entrepriseAdresse ?? ""),
      siret: String(d.siret ?? ""),
      representantNom: String(d.representantNom ?? ""),
      representantQualite: String(d.representantQualite ?? ""),
      salarieNom: String(d.salarieNom ?? ""),
      salarieAdresse: String(d.salarieAdresse ?? ""),
      typeContrat: d.typeContrat === "cdd" ? "cdd" : "cdi",
      dateDebut: String(d.dateDebut ?? ""),
      dateFin: String(d.dateFin ?? ""),
      motifCdd: String(d.motifCdd ?? ""),
      poste: String(d.poste ?? ""),
      salaireBrut: num(d.salaireBrut),
      heuresSemaine: num(d.heuresSemaine) || 35,
      lieuTravail: String(d.lieuTravail ?? ""),
      periodeEssai: String(d.periodeEssai ?? ""),
      conventionCollective: String(d.conventionCollective ?? ""),
      ville: String(d.ville ?? ""),
      date: String(d.date ?? ""),
    });
    return pdfResponse(pdf, "contrat-de-travail.pdf");
  }

  if (type === "certificat-travail") {
    const pdf = await buildCertificatPDF({
      entrepriseNom: String(d.entrepriseNom ?? ""),
      entrepriseAdresse: String(d.entrepriseAdresse ?? ""),
      siret: String(d.siret ?? ""),
      representantNom: String(d.representantNom ?? ""),
      representantQualite: String(d.representantQualite ?? ""),
      salarieNom: String(d.salarieNom ?? ""),
      poste: String(d.poste ?? ""),
      dateDebut: String(d.dateDebut ?? ""),
      dateFin: String(d.dateFin ?? ""),
      ville: String(d.ville ?? ""),
      date: String(d.date ?? ""),
    });
    return pdfResponse(pdf, "certificat-de-travail.pdf");
  }

  if (type === "solde-tout-compte") {
    const pdf = await buildSoldeToutComptePDF({
      entrepriseNom: String(d.entrepriseNom ?? ""),
      entrepriseAdresse: String(d.entrepriseAdresse ?? ""),
      siret: String(d.siret ?? ""),
      representantNom: String(d.representantNom ?? ""),
      representantQualite: String(d.representantQualite ?? ""),
      salarieNom: String(d.salarieNom ?? ""),
      salarieAdresse: String(d.salarieAdresse ?? ""),
      poste: String(d.poste ?? ""),
      dateEntree: String(d.dateEntree ?? ""),
      dateSortie: String(d.dateSortie ?? ""),
      motifRupture: String(d.motifRupture ?? ""),
      salaireDu: num(d.salaireDu),
      indemniteConges: num(d.indemniteConges),
      indemnitePreavis: num(d.indemnitePreavis),
      indemniteRupture: num(d.indemniteRupture),
      autresSommes: num(d.autresSommes),
      ville: String(d.ville ?? ""),
      date: String(d.date ?? ""),
    });
    return pdfResponse(pdf, "solde-de-tout-compte.pdf");
  }

  if (type === "rupture-conventionnelle") {
    const pdf = await buildRupturePDF({
      entrepriseNom: String(d.entrepriseNom ?? ""),
      entrepriseAdresse: String(d.entrepriseAdresse ?? ""),
      siret: String(d.siret ?? ""),
      representantNom: String(d.representantNom ?? ""),
      representantQualite: String(d.representantQualite ?? ""),
      salarieNom: String(d.salarieNom ?? ""),
      salarieAdresse: String(d.salarieAdresse ?? ""),
      poste: String(d.poste ?? ""),
      dateEmbauche: String(d.dateEmbauche ?? ""),
      salaireBrut: num(d.salaireBrut),
      indemniteRupture: num(d.indemniteRupture),
      dateEntretien: String(d.dateEntretien ?? ""),
      dateRupture: String(d.dateRupture ?? ""),
      ville: String(d.ville ?? ""),
      date: String(d.date ?? ""),
    });
    return pdfResponse(pdf, "rupture-conventionnelle.pdf");
  }

  if (type === "bail-commercial") {
    const pdf = await buildBailCommercialPDF({
      bailleurNom: String(d.bailleurNom ?? ""),
      bailleurAdresse: String(d.bailleurAdresse ?? ""),
      bailleurQualite: String(d.bailleurQualite ?? ""),
      preneurNom: String(d.preneurNom ?? ""),
      preneurAdresse: String(d.preneurAdresse ?? ""),
      preneurRcs: String(d.preneurRcs ?? ""),
      adresseLocal: String(d.adresseLocal ?? ""),
      descriptionLocal: String(d.descriptionLocal ?? ""),
      surface: String(d.surface ?? ""),
      destination: String(d.destination ?? ""),
      loyerAnnuel: num(d.loyerAnnuel),
      depotGarantie: num(d.depotGarantie),
      charges: String(d.charges ?? ""),
      indiceRevision: String(d.indiceRevision ?? ""),
      dateDebut: String(d.dateDebut ?? ""),
      duree: String(d.duree ?? ""),
      ville: String(d.ville ?? ""),
      date: String(d.date ?? ""),
    });
    return pdfResponse(pdf, "bail-commercial.pdf");
  }

  if (type === "statuts-societe") {
    const formes = ["SARL", "SAS", "EURL", "SASU"] as const;
    const forme = formes.includes(d.forme as (typeof formes)[number])
      ? (d.forme as StatutsData["forme"])
      : "SARL";
    const associes: Associe[] = Array.isArray(d.associes)
      ? (d.associes as Array<Record<string, unknown>>).map((a) => ({
          nom: String(a.nom ?? ""),
          adresse: String(a.adresse ?? ""),
          apport: num(a.apport),
        }))
      : [];
    const pdf = await buildStatutsPDF({
      forme,
      denomination: String(d.denomination ?? ""),
      objet: String(d.objet ?? ""),
      siege: String(d.siege ?? ""),
      duree: String(d.duree ?? ""),
      capital: num(d.capital),
      valeurTitre: num(d.valeurTitre),
      associes,
      dirigeantNom: String(d.dirigeantNom ?? ""),
      dirigeantAdresse: String(d.dirigeantAdresse ?? ""),
      ville: String(d.ville ?? ""),
      date: String(d.date ?? ""),
    });
    return pdfResponse(pdf, "statuts-societe.pdf");
  }

  return Response.json(
    { error: "Type de document non pris en charge." },
    { status: 400 }
  );
}

function pdfResponse(pdf: Uint8Array, filename: string): Response {
  return new Response(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

import { PDFDocument, StandardFonts, type PDFPage } from "pdf-lib";
import { INK, GRIS, OR, wrap } from "./helpers";
import type { TypeLicenciement } from "@/lib/paie/licenciement";

export type LettreLicenciementData = {
  entrepriseNom: string;
  entrepriseAdresse: string;
  siret: string;
  representantNom: string;
  representantQualite: string;
  salarieNom: string;
  salarieAdresse: string;
  poste: string;
  typeKey: TypeLicenciement;
  typeLibelle: string; // ex. "faute grave"
  motifs: string;
  dateEntretien: string;
  dateEnvoi: string;
  preavis: string;
  indemniteEligible: boolean;
  indemnite: number;
  ancienneteLabel: string;
  ville: string;
  date: string;
};

const A4: [number, number] = [595.28, 841.89];
const M = 56;
const W = A4[0] - M * 2;
const TOP = 792;

const eur = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[^\S ]/g, " ");

export async function buildLettreLicenciementPDF(
  d: LettreLicenciementData
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = pdf.addPage(A4);
  let y = TOP;

  const ensure = (space: number) => {
    if (y - space < 72) {
      page = pdf.addPage(A4);
      y = TOP;
    }
  };
  const line = (s: string, size = 10.5, f = font, color = INK, x = M) =>
    page.drawText(s, { x, y, size, font: f, color });
  const rline = (s: string, size = 10.5, f = font, color = INK) =>
    page.drawText(s, { x: M + W - f.widthOfTextAtSize(s, size), y, size, font: f, color });
  const para = (s: string, size = 10.5, f = font, color = INK) => {
    for (const l of wrap(s, f, size, W)) {
      ensure(16);
      line(l, size, f, color);
      y -= size + 4.5;
    }
    y -= 6;
  };

  const faute = d.typeKey === "faute-grave" || d.typeKey === "faute-lourde";
  const economique = d.typeKey === "economique";

  // ─── Expéditeur (employeur) ───
  line(d.entrepriseNom || "L'employeur", 12, bold);
  y -= 15;
  for (const l of wrap(d.entrepriseAdresse || "", font, 10, 280)) {
    line(l, 10, font, GRIS);
    y -= 13;
  }
  if (d.siret) {
    line(`SIRET : ${d.siret}`, 10, font, GRIS);
    y -= 13;
  }

  // ─── Destinataire (salarié) — bloc aligné à droite ───
  let dy = TOP - 4;
  const rAtY = (s: string, size: number, f = font, color = INK) => {
    page.drawText(s, { x: M + W - f.widthOfTextAtSize(s, size), y: dy, size, font: f, color });
    dy -= size + 4;
  };
  rAtY(d.salarieNom || "Le/la salarié(e)", 11, bold);
  for (const l of wrap(d.salarieAdresse || "", font, 10, 240)) rAtY(l, 10, font, GRIS);

  y = Math.min(y, dy) - 14;

  // ─── LRAR + lieu/date ───
  line("Lettre recommandée avec accusé de réception", 9.5, bold, GRIS);
  y -= 20;
  rline(`${d.ville || "—"}, le ${d.date || "—"}`, 10.5, font, INK);
  y -= 26;

  // ─── Objet ───
  line(`Objet : Lettre de licenciement pour ${d.typeLibelle}`, 10.5, bold);
  y -= 26;

  // ─── Corps ───
  para("Madame, Monsieur,");
  para(
    `Nous faisons suite à l'entretien préalable qui s'est tenu le ${d.dateEntretien || "—"}, ` +
      `au cours duquel vous avez été informé(e) des motifs de la mesure envisagée et avez pu ` +
      `présenter vos explications, le cas échéant assisté(e) selon les conditions prévues par la loi.`
  );
  para(
    `Nous sommes contraints de vous notifier, par la présente, votre licenciement pour ` +
      `${d.typeLibelle}, en raison des éléments suivants :`
  );
  para(d.motifs || "—", 10.5, font, INK);

  if (economique) {
    para(
      `Ce licenciement repose sur un motif économique. Nous vous informons qu'aucune solution de ` +
        `reclassement compatible avec vos compétences n'a pu être trouvée au sein de l'entreprise. ` +
        `Vous bénéficiez d'une priorité de réembauche pendant un délai d'un an à compter de la rupture, ` +
        `si vous en faites la demande.`
    );
  }

  if (faute) {
    para(
      `Compte tenu de la gravité des faits qui vous sont reprochés, votre licenciement prend effet ` +
        `immédiatement à la date de première présentation de cette lettre, sans préavis ` +
        `ni indemnité de licenciement.`
    );
  } else {
    para(
      `Vous effectuerez un préavis d'une durée de ${d.preavis}, qui débutera à la date de première ` +
        `présentation de la présente lettre.`
    );
    if (d.indemniteEligible) {
      para(
        `Vous percevrez une indemnité légale de licenciement d'un montant de ${eur(d.indemnite)} €, ` +
          `calculée sur la base de votre ancienneté de ${d.ancienneteLabel}.`
      );
    } else {
      para(
        `Compte tenu de votre ancienneté, vous ne remplissez pas les conditions d'ouverture du droit ` +
          `à l'indemnité légale de licenciement.`
      );
    }
  }

  para(
    `À l'issue de votre contrat, nous tiendrons à votre disposition votre certificat de travail, ` +
      `votre attestation France Travail ainsi que votre reçu pour solde de tout compte.`
  );
  para(
    `Nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.`
  );

  // ─── Signature ───
  ensure(70);
  y -= 20;
  rline(d.representantQualite || "L'employeur", 10.5, font, GRIS);
  y -= 15;
  rline(d.representantNom || "", 11, bold, INK);

  return pdf.save();
}

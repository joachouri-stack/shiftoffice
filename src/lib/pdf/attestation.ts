import { PDFDocument, StandardFonts } from "pdf-lib";
import { INK, GRIS, OR, wrap } from "./helpers";

export type AttestationData = {
  entrepriseNom: string;
  entrepriseAdresse: string;
  siret: string;
  representantNom: string;
  representantQualite: string; // ex. "Gérant", "Directeur"
  salarieNom: string;
  poste: string;
  typeContrat: "indeterminee" | "determinee"; // CDI / CDD
  dateEmbauche: string; // ex. "01/03/2024"
  ville: string;
  date: string; // date de délivrance
};

export async function buildAttestationPDF(
  d: AttestationData
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const M = 56;
  const W = 595.28 - M * 2;
  let y = 786;

  const text = (
    s: string,
    x: number,
    yy: number,
    size = 11,
    f = font,
    color = INK
  ) => page.drawText(s, { x, y: yy, size, font: f, color });

  // — En-tête employeur —
  text(d.entrepriseNom || "L'employeur", M, y, 13, bold);
  y -= 16;
  for (const l of wrap(d.entrepriseAdresse || "", font, 10, 260)) {
    text(l, M, y, 10, font, GRIS);
    y -= 13;
  }
  if (d.siret) {
    text(`SIRET : ${d.siret}`, M, y, 10, font, GRIS);
    y -= 13;
  }

  // — Titre —
  y -= 26;
  const titre = "ATTESTATION EMPLOYEUR";
  text(titre, M, y, 20, bold);
  // Le trait épouse la largeur du titre. Petite marge de sécurité (+3 pt) pour
  // qu'il couvre toujours le titre en entier, même si la visionneuse PDF
  // substitue une police dont les glyphes sont légèrement plus larges.
  page.drawRectangle({
    x: M,
    y: y - 8,
    width: bold.widthOfTextAtSize(titre, 20) + 3,
    height: 3,
    color: OR,
  });

  // — Corps —
  y -= 52;
  const contrat =
    d.typeContrat === "determinee"
      ? "à durée déterminée (CDD)"
      : "à durée indéterminée (CDI)";
  const para =
    `Je soussigné(e) ${d.representantNom || "le représentant"}, agissant en qualité de ${d.representantQualite || "représentant"} ` +
    `de la société ${d.entrepriseNom || "l'entreprise"}, certifie que ${d.salarieNom || "le/la salarié(e)"} ` +
    `est employé(e) au sein de notre entreprise depuis le ${d.dateEmbauche || "—"}, ` +
    `en qualité de ${d.poste || "—"}, dans le cadre d'un contrat de travail ${contrat}.`;
  for (const l of wrap(para, font, 11.5, W)) {
    text(l, M, y, 11.5, font, INK);
    y -= 18;
  }

  y -= 12;
  const para2 =
    "La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.";
  for (const l of wrap(para2, font, 11.5, W)) {
    text(l, M, y, 11.5, font, INK);
    y -= 18;
  }

  // — Date + signature —
  y -= 36;
  text(`Fait à ${d.ville || "—"}, le ${d.date || "—"}.`, M, y, 11, font, INK);
  y -= 44;
  text(d.representantQualite || "Le représentant", M + W - 200, y, 11, font, GRIS);
  text(d.representantNom || "", M + W - 200, y - 16, 11, bold);

  return pdf.save();
}

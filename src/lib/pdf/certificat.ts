import { PDFDocument, StandardFonts } from "pdf-lib";
import { INK, GRIS, OR, wrap } from "./helpers";

export type CertificatData = {
  entrepriseNom: string;
  entrepriseAdresse: string;
  siret: string;
  representantNom: string;
  representantQualite: string;
  salarieNom: string;
  poste: string;
  dateDebut: string;
  dateFin: string;
  ville: string;
  date: string;
};

export async function buildCertificatPDF(
  d: CertificatData
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
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

  // En-tête employeur
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

  // Titre
  y -= 26;
  text("CERTIFICAT DE TRAVAIL", M, y, 20, bold);
  page.drawRectangle({
    x: M,
    y: y - 8,
    width: bold.widthOfTextAtSize("CERTIFICAT DE TRAVAIL", 20),
    height: 3,
    color: OR,
  });

  // Corps
  y -= 52;
  const para =
    `Je soussigné(e) ${d.representantNom || "le représentant"}, agissant en qualité de ${d.representantQualite || "représentant"} ` +
    `de la société ${d.entrepriseNom || "l'entreprise"}, certifie que ${d.salarieNom || "le/la salarié(e)"} ` +
    `a été employé(e) dans notre entreprise du ${d.dateDebut || "—"} au ${d.dateFin || "—"}, ` +
    `en qualité de ${d.poste || "—"}.`;
  for (const l of wrap(para, font, 11.5, W)) {
    text(l, M, y, 11.5, font, INK);
    y -= 18;
  }

  y -= 12;
  const para2 =
    "Le salarié quitte l'entreprise libre de tout engagement.";
  for (const l of wrap(para2, font, 11.5, W)) {
    text(l, M, y, 11.5, font, INK);
    y -= 18;
  }

  y -= 6;
  const para3 =
    "En foi de quoi, nous lui délivrons le présent certificat pour servir et valoir ce que de droit.";
  for (const l of wrap(para3, font, 11.5, W)) {
    text(l, M, y, 11.5, font, INK);
    y -= 18;
  }

  // Date + signature
  y -= 36;
  text(`Fait à ${d.ville || "—"}, le ${d.date || "—"}.`, M, y, 11, font, INK);
  y -= 44;
  text(d.representantQualite || "Le représentant", M + W - 200, y, 11, font, GRIS);
  text(d.representantNom || "", M + W - 200, y - 16, 11, bold);


  return pdf.save();
}

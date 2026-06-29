import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { INK, GRIS, OR, eur, wrap } from "./helpers";

export type QuittanceData = {
  bailleurNom: string;
  bailleurAdresse: string;
  locataire: string;
  adresseBien: string;
  periode: string; // ex. "Juin 2025"
  loyer: number;
  charges: number;
  ville: string;
  datePaiement: string; // ex. "28/06/2026"
};

export async function buildQuittancePDF(d: QuittanceData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const M = 56; // marge
  const W = 595.28 - M * 2;
  let y = 786;

  const total = (d.loyer || 0) + (d.charges || 0);

  const text = (
    s: string,
    x: number,
    yy: number,
    size = 11,
    f = font,
    color = INK
  ) => page.drawText(s, { x, y: yy, size, font: f, color });

  // — En-tête bailleur —
  text(d.bailleurNom || "Le bailleur", M, y, 13, bold);
  y -= 16;
  for (const l of wrap(d.bailleurAdresse || "", font, 10, 240)) {
    text(l, M, y, 10, font, GRIS);
    y -= 13;
  }

  // — Titre —
  y -= 26;
  const titre = "QUITTANCE DE LOYER";
  text(titre, M, y, 20, bold);
  // Soulignement sur toute la largeur du titre
  page.drawRectangle({
    x: M,
    y: y - 8,
    width: bold.widthOfTextAtSize(titre, 20),
    height: 3,
    color: OR,
  });
  text(`Période : ${d.periode || "—"}`, M, y - 26, 11, font, GRIS);

  // — Corps —
  y -= 64;
  const para =
    `Je soussigné(e) ${d.bailleurNom || "le bailleur"}, propriétaire du logement situé ${d.adresseBien || "—"}, ` +
    `déclare avoir reçu de ${d.locataire || "le locataire"} la somme de ${eur(total)} euros, ` +
    `au titre du paiement du loyer et des charges pour la période de ${d.periode || "—"}, ` +
    `et lui en donne quittance, sous réserve de tous mes droits.`;
  for (const l of wrap(para, font, 11.5, W)) {
    text(l, M, y, 11.5, font, INK);
    y -= 17;
  }

  // — Détail des montants —
  y -= 18;
  const boxX = M;
  const boxW = W;
  const rows: [string, string][] = [
    ["Loyer hors charges", `${eur(d.loyer || 0)} €`],
    ["Provision pour charges", `${eur(d.charges || 0)} €`],
  ];
  page.drawRectangle({
    x: boxX,
    y: y - rows.length * 22 - 30,
    width: boxW,
    height: rows.length * 22 + 30,
    borderColor: OR,
    borderWidth: 1,
    color: rgb(0.98, 0.965, 0.93),
  });
  let ry = y - 6;
  for (const [label, val] of rows) {
    text(label, boxX + 16, ry - 12, 11, font, GRIS);
    text(val, boxX + boxW - 16 - font.widthOfTextAtSize(val, 11), ry - 12, 11, font, INK);
    ry -= 22;
  }
  // ligne total
  page.drawLine({
    start: { x: boxX + 16, y: ry - 2 },
    end: { x: boxX + boxW - 16, y: ry - 2 },
    color: OR,
    thickness: 1,
  });
  const totalLabel = "Total payé";
  const totalVal = `${eur(total)} €`;
  text(totalLabel, boxX + 16, ry - 20, 12, bold);
  text(totalVal, boxX + boxW - 16 - bold.widthOfTextAtSize(totalVal, 12), ry - 20, 12, bold);
  y = ry - 30 - 30;

  // — Date + signature —
  y -= 20;
  text(`Fait à ${d.ville || "—"}, le ${d.datePaiement || "—"}.`, M, y, 11, font, INK);
  y -= 40;
  text("Le bailleur", M + boxW - 160, y, 11, font, GRIS);
  text(d.bailleurNom || "", M + boxW - 160, y - 16, 11, bold);

  return pdf.save();
}

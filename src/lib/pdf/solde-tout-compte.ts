import { PDFDocument, StandardFonts, type PDFPage } from "pdf-lib";
import { INK, GRIS, OR, CREME, eur, wrap } from "./helpers";

export type SoldeData = {
  entrepriseNom: string;
  entrepriseAdresse: string;
  siret: string;
  representantNom: string;
  representantQualite: string;
  salarieNom: string;
  salarieAdresse: string;
  poste: string;
  dateEntree: string;
  dateSortie: string;
  motifRupture: string;
  // Sommes versées
  salaireDu: number;
  indemniteConges: number;
  indemnitePreavis: number;
  indemniteRupture: number;
  autresSommes: number;
  ville: string;
  date: string;
};

const A4: [number, number] = [595.28, 841.89];
const M = 56;
const W = A4[0] - M * 2;
const TOP = 792;

export async function buildSoldeToutComptePDF(d: SoldeData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = pdf.addPage(A4);
  let y = TOP;

  const ensure = (space: number) => {
    if (y - space < 64) {
      page = pdf.addPage(A4);
      y = TOP;
    }
  };
  const line = (s: string, size = 10.5, f = font, color = INK, x = M) => {
    page.drawText(s, { x, y, size, font: f, color });
  };
  const rtext = (s: string, right: number, size = 10.5, f = font, color = INK) => {
    const wdt = f.widthOfTextAtSize(s, size);
    page.drawText(s, { x: right - wdt, y, size, font: f, color });
  };
  const para = (s: string, size = 10.5, f = font, color = INK) => {
    for (const l of wrap(s, f, size, W)) {
      ensure(16);
      line(l, size, f, color);
      y -= size + 4.5;
    }
    y -= 6;
  };

  // En-tête employeur
  line(d.entrepriseNom || "L'employeur", 13, bold);
  y -= 16;
  for (const l of wrap(d.entrepriseAdresse || "", font, 10, 280)) {
    line(l, 10, font, GRIS);
    y -= 13;
  }
  if (d.siret) {
    line(`SIRET : ${d.siret}`, 10, font, GRIS);
    y -= 13;
  }

  // Titre
  y -= 24;
  line("REÇU POUR SOLDE DE TOUT COMPTE", 17, bold);
  page.drawRectangle({
    x: M,
    y: y - 9,
    width: bold.widthOfTextAtSize("REÇU POUR SOLDE DE TOUT COMPTE", 17) + 3,
    height: 3,
    color: OR,
  });
  y -= 38;

  // Identité salarié
  para(
    `Je soussigné(e) ${d.salarieNom || "le/la salarié(e)"}` +
      `${d.salarieAdresse ? `, demeurant ${d.salarieAdresse}` : ""}, ` +
      `ayant exercé les fonctions de ${d.poste || "—"} au sein de la société ${d.entrepriseNom || "l'entreprise"} ` +
      `du ${d.dateEntree || "—"} au ${d.dateSortie || "—"}, ` +
      `reconnais avoir reçu, à l'occasion de la rupture de mon contrat de travail ` +
      `(${d.motifRupture || "fin de contrat"}), les sommes suivantes :`
  );

  // Tableau des sommes
  const rows: Array<[string, number]> = [
    ["Salaire et accessoires dus", d.salaireDu],
    ["Indemnité compensatrice de congés payés", d.indemniteConges],
    ["Indemnité compensatrice de préavis", d.indemnitePreavis],
    ["Indemnité de rupture (licenciement / fin de CDD)", d.indemniteRupture],
    ["Autres sommes", d.autresSommes],
  ].filter(([, v]) => (v as number) > 0) as Array<[string, number]>;

  const total =
    d.salaireDu +
    d.indemniteConges +
    d.indemnitePreavis +
    d.indemniteRupture +
    d.autresSommes;

  const rightX = M + W;
  const rowH = 22;
  ensure(rowH * (rows.length + 2) + 20);

  // En-tête tableau
  page.drawRectangle({
    x: M,
    y: y - 6,
    width: W,
    height: rowH,
    color: INK,
  });
  line("Nature des sommes", 10, bold, CREME, M + 10);
  rtext("Montant", rightX - 10, 10, bold, CREME);
  y -= rowH;

  rows.forEach(([label, val], i) => {
    if (i % 2 === 1) {
      page.drawRectangle({
        x: M,
        y: y - 6,
        width: W,
        height: rowH,
        color: CREME,
      });
    }
    line(label, 10, font, INK, M + 10);
    rtext(`${eur(val)} €`, rightX - 10, 10, font, INK);
    y -= rowH;
  });

  // Total
  page.drawRectangle({
    x: M,
    y: y - 6,
    width: W,
    height: rowH,
    color: OR,
  });
  line("TOTAL PERÇU", 11, bold, INK, M + 10);
  rtext(`${eur(total)} €`, rightX - 10, 11, bold, INK);
  y -= rowH + 18;

  // Mentions légales
  para(
    `Ce reçu est établi en double exemplaire, dont l'un est remis au salarié.`,
    10
  );
  para(
    `Le présent reçu pour solde de tout compte peut être dénoncé dans les six mois ` +
      `qui suivent sa signature, délai au-delà duquel il devient libératoire pour ` +
      `l'employeur pour les sommes qui y sont mentionnées (article L. 1234-20 du Code du travail).`,
    10,
    font,
    GRIS
  );

  // Signatures
  ensure(110);
  y -= 10;
  para(
    `Fait à ${d.ville || "—"}, le ${d.date || "—"}, en double exemplaire.`
  );
  y -= 18;
  line("Le Salarié", 10.5, bold, INK, M);
  line("L'Employeur", 10.5, bold, INK, M + W - 150);
  y -= 12;
  line("(précédé de la mention « Pour solde de tout compte »)", 8, font, GRIS, M);
  y -= 16;
  line(d.salarieNom || "", 9.5, font, GRIS, M);
  line(d.representantNom || "", 9.5, font, GRIS, M + W - 150);

  return pdf.save();
}

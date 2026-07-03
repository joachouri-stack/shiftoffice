import { PDFDocument, StandardFonts, type PDFPage } from "pdf-lib";
import { INK, GRIS, OR, CREME, eur, wrap } from "./helpers";

export type DepenseLigne = {
  date: string;
  nature: string;
  montantTTC: number;
  tauxTVA: number; // en %, ex. 20, 10, 5.5, 0
};

export type NoteFraisData = {
  entrepriseNom: string;
  entrepriseAdresse: string;
  siret: string;
  demandeurNom: string;
  demandeurQualite: string; // Salarié / Dirigeant / Gérant
  periode: string; // ex. "Juin 2026"
  lignes: DepenseLigne[];
  ville: string;
  date: string;
};

const A4: [number, number] = [595.28, 841.89];
const M = 56;
const W = A4[0] - M * 2;
const TOP = 792;

/** Décompose un montant TTC + taux en (HT, TVA). */
function decomposer(montantTTC: number, tauxTVA: number) {
  const tva = montantTTC * (tauxTVA / (100 + tauxTVA));
  const ht = montantTTC - tva;
  return { ht, tva };
}

export async function buildNoteFraisPDF(d: NoteFraisData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = pdf.addPage(A4);
  let y = TOP;

  const ensure = (space: number) => {
    if (y - space < 96) {
      page = pdf.addPage(A4);
      y = TOP;
    }
  };
  const line = (s: string, size = 10.5, f = font, color = INK, x = M) =>
    page.drawText(s, { x, y, size, font: f, color });
  const at = (s: string, x: number, yy: number, size = 10, f = font, color = INK) =>
    page.drawText(s, { x, y: yy, size, font: f, color });
  const rAt = (s: string, right: number, yy: number, size = 10, f = font, color = INK) =>
    page.drawText(s, { x: right - f.widthOfTextAtSize(s, size), y: yy, size, font: f, color });

  // Tronque un libellé pour tenir dans une largeur donnée.
  const clip = (s: string, size: number, maxW: number) => {
    if (font.widthOfTextAtSize(s, size) <= maxW) return s;
    let t = s;
    while (t.length > 1 && font.widthOfTextAtSize(t + "…", size) > maxW) t = t.slice(0, -1);
    return t + "…";
  };

  // ─── En-tête employeur ───
  line(d.entrepriseNom || "L'entreprise", 13, bold);
  y -= 16;
  for (const l of wrap(d.entrepriseAdresse || "", font, 10, 300)) {
    line(l, 10, font, GRIS);
    y -= 13;
  }
  if (d.siret) {
    line(`SIRET : ${d.siret}`, 10, font, GRIS);
    y -= 13;
  }

  // ─── Titre + période ───
  y -= 24;
  line("NOTE DE FRAIS", 20, bold);
  page.drawRectangle({
    x: M,
    y: y - 9,
    width: bold.widthOfTextAtSize("NOTE DE FRAIS", 20),
    height: 3,
    color: OR,
  });
  y -= 20;
  line(`Période : ${d.periode || "—"}`, 11, font, GRIS);
  y -= 26;

  // ─── Demandeur ───
  line("Demandeur", 9, bold, GRIS);
  y -= 15;
  line(
    `${d.demandeurNom || "—"}${d.demandeurQualite ? `  ·  ${d.demandeurQualite}` : ""}`,
    11.5,
    bold
  );
  y -= 28;

  // ─── Tableau des dépenses ───
  const rightX = M + W;
  const cDate = M + 10; // Date (gauche)
  const cNat = M + 78; // Nature (gauche)
  const cHT = rightX - 200; // Montant HT (droite)
  const cTVA = rightX - 110; // TVA (droite)
  const cTTC = rightX - 10; // Montant TTC (droite)
  const rowH = 20;

  const drawHead = () => {
    page.drawRectangle({ x: M, y: y - 5, width: W, height: rowH, color: INK });
    at("Date", cDate, y, 9, bold, CREME);
    at("Nature", cNat, y, 9, bold, CREME);
    rAt("Montant HT", cHT, y, 9, bold, CREME);
    rAt("TVA", cTVA, y, 9, bold, CREME);
    rAt("Montant TTC", cTTC, y, 9, bold, CREME);
    y -= rowH;
  };

  const lignes = d.lignes.filter((l) => l.montantTTC > 0 || l.nature.trim());
  ensure(rowH * (lignes.length + 3) + 30);
  drawHead();

  let totalHT = 0;
  let totalTVA = 0;
  let totalTTC = 0;

  lignes.forEach((l, i) => {
    if (y - rowH < 96) {
      page = pdf.addPage(A4);
      y = TOP;
      drawHead();
    }
    const { ht, tva } = decomposer(l.montantTTC, l.tauxTVA);
    totalHT += ht;
    totalTVA += tva;
    totalTTC += l.montantTTC;
    if (i % 2 === 1) page.drawRectangle({ x: M, y: y - 5, width: W, height: rowH, color: CREME });
    at(l.date || "—", cDate, y, 9.5, font, INK);
    at(clip(l.nature || "—", 9.5, cHT - cNat - 60), cNat, y, 9.5, font, INK);
    rAt(`${eur(ht)} €`, cHT, y, 9.5, font, GRIS);
    rAt(l.tauxTVA ? `${eur(tva)} €` : "—", cTVA, y, 9.5, font, GRIS);
    rAt(`${eur(l.montantTTC)} €`, cTTC, y, 9.5, font, INK);
    y -= rowH;
  });

  // Arrondis finaux (cohérents avec l'affichage du formulaire).
  totalHT = Math.round(totalHT * 100) / 100;
  totalTVA = Math.round(totalTVA * 100) / 100;
  totalTTC = Math.round(totalTTC * 100) / 100;

  // ─── Totaux ───
  y -= 6;
  const totRow = (label: string, val: number, strong = false) => {
    const f = strong ? bold : font;
    const sz = strong ? 11 : 10;
    if (strong) page.drawRectangle({ x: M, y: y - 5, width: W, height: rowH, color: OR });
    at(label, cNat, y, sz, f, INK);
    rAt(`${eur(val)} €`, cTTC, y, sz, f, INK);
    y -= rowH;
  };
  totRow("Total HT", totalHT);
  totRow("Total TVA", totalTVA);
  totRow("Total TTC", totalTTC, true);

  // ─── Mention + signatures ───
  y -= 24;
  ensure(120);
  line("Certifié exact et sincère.", 10, bold, INK);
  y -= 20;
  line(`Fait à ${d.ville || "—"}, le ${d.date || "—"}.`, 10, font, GRIS);
  y -= 40;
  line("Le demandeur", 10.5, bold, INK, M);
  line("Le responsable", 10.5, bold, INK, M + W - 150);
  y -= 14;
  line("(signature)", 8.5, font, GRIS, M);
  line("(signature)", 8.5, font, GRIS, M + W - 150);
  y -= 14;
  line(d.demandeurNom || "", 9.5, font, GRIS, M);

  return pdf.save();
}

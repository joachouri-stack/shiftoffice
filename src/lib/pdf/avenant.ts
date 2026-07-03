import { PDFDocument, StandardFonts, type PDFPage } from "pdf-lib";
import { INK, GRIS, OR, CREME, wrap } from "./helpers";

export type AvenantModif = {
  intitule: string; // ex. "Salaire brut mensuel"
  ancien: string; // ex. "2 500,00 €"
  nouveau: string; // ex. "2 800,00 €"
};

export type AvenantData = {
  entrepriseNom: string;
  entrepriseAdresse: string;
  siret: string;
  representantNom: string;
  representantQualite: string;
  salarieNom: string;
  salarieAdresse: string;
  poste: string;
  dateContratInitial: string;
  typeModif: string; // libellé du type de modification
  dateEffet: string;
  modifications: AvenantModif[];
  ville: string;
  date: string;
};

const A4: [number, number] = [595.28, 841.89];
const M = 56;
const W = A4[0] - M * 2;
const TOP = 792;

export async function buildAvenantPDF(d: AvenantData): Promise<Uint8Array> {
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
  const at = (s: string, x: number, yy: number, size = 10, f = font, color = INK) =>
    page.drawText(s, { x, y: yy, size, font: f, color });
  const para = (s: string, size = 10.5, f = font, color = INK) => {
    for (const l of wrap(s, f, size, W)) {
      ensure(16);
      line(l, size, f, color);
      y -= size + 4.5;
    }
    y -= 6;
  };
  const heading = (t: string) => {
    ensure(30);
    y -= 6;
    line(t, 11.5, bold);
    y -= 18;
  };

  // ─── En-tête employeur ───
  line(d.entrepriseNom || "L'employeur", 13, bold);
  y -= 16;
  for (const l of wrap(d.entrepriseAdresse || "", font, 10, 300)) {
    line(l, 10, font, GRIS);
    y -= 13;
  }
  if (d.siret) {
    line(`SIRET : ${d.siret}`, 10, font, GRIS);
    y -= 13;
  }

  // ─── Titre ───
  y -= 24;
  line("AVENANT AU CONTRAT DE TRAVAIL", 17, bold);
  page.drawRectangle({
    x: M,
    y: y - 9,
    width: bold.widthOfTextAtSize("AVENANT AU CONTRAT DE TRAVAIL", 17),
    height: 3,
    color: OR,
  });
  y -= 20;
  line(d.typeModif || "Modification du contrat", 10.5, font, GRIS);
  y -= 30;

  // ─── Parties ───
  para("Entre les soussignés :", 10.5, bold);
  para(
    `${d.entrepriseNom || "L'entreprise"}${d.siret ? `, SIRET ${d.siret}` : ""}` +
      `${d.entrepriseAdresse ? `, dont le siège social est situé ${d.entrepriseAdresse}` : ""}, ` +
      `représentée par ${d.representantNom || "son représentant"} en qualité de ${d.representantQualite || "représentant"}, ` +
      `ci-après dénommée « l'Employeur », d'une part,`
  );
  para(
    `Et ${d.salarieNom || "le/la salarié(e)"}${d.salarieAdresse ? `, demeurant ${d.salarieAdresse}` : ""}, ` +
      `exerçant les fonctions de ${d.poste || "—"}, ci-après dénommé(e) « le Salarié », d'autre part,`
  );
  para(
    `Les parties sont convenues de modifier, par le présent avenant, le contrat de travail conclu ` +
      `en date du ${d.dateContratInitial || "—"} dans les conditions ci-après.`
  );

  // ─── Objet ───
  heading("Article 1 — Objet de l'avenant");
  para(
    `Il est convenu de modifier les dispositions suivantes du contrat de travail à compter du ${d.dateEffet || "—"} :`
  );

  // ─── Tableau des modifications ───
  const modifs = d.modifications.filter((m) => m.intitule.trim());
  if (modifs.length) {
    const rightX = M + W;
    const cInt = M + 10;
    const cAnc = M + 200;
    const cNouv = M + 350;
    const rowH = 20;
    ensure(rowH * (modifs.length + 1) + 12);
    page.drawRectangle({ x: M, y: y - 5, width: W, height: rowH, color: INK });
    at("Élément", cInt, y, 9, bold, CREME);
    at("Ancienne disposition", cAnc, y, 9, bold, CREME);
    at("Nouvelle disposition", cNouv, y, 9, bold, CREME);
    y -= rowH;
    modifs.forEach((m, i) => {
      if (y - rowH < 72) { page = pdf.addPage(A4); y = TOP; }
      if (i % 2 === 1) page.drawRectangle({ x: M, y: y - 5, width: W, height: rowH, color: CREME });
      at(m.intitule, cInt, y, 9.5, font, INK);
      at(m.ancien || "—", cAnc, y, 9.5, font, GRIS);
      at(m.nouveau || "—", cNouv, y, 9.5, bold, INK);
      y -= rowH;
    });
    void rightX;
    y -= 12;
  }

  // ─── Clauses inchangées + mention ───
  heading("Article 2 — Maintien des autres clauses");
  para(
    `Toutes les autres clauses et conditions du contrat de travail initial non modifiées par le présent ` +
      `avenant demeurent inchangées et continuent de produire leurs effets.`
  );
  para(
    `Le présent avenant annule et remplace les clauses modifiées du contrat de travail initial en date du ${d.dateContratInitial || "—"}.`,
    10,
    font,
    GRIS
  );

  // ─── Signatures ───
  ensure(120);
  y -= 6;
  para(
    `Fait à ${d.ville || "—"}, le ${d.date || "—"}, en deux exemplaires originaux, dont un remis à chaque partie.`
  );
  y -= 18;
  line("L'Employeur", 10.5, bold, INK, M);
  line("Le Salarié", 10.5, bold, INK, M + W - 150);
  y -= 13;
  line("(signature)", 8.5, font, GRIS, M);
  line("(mention « Lu et approuvé »)", 8.5, font, GRIS, M + W - 150);
  y -= 12;
  line(d.representantNom || "", 9.5, font, GRIS, M);
  line(d.salarieNom || "", 9.5, font, GRIS, M + W - 150);

  return pdf.save();
}

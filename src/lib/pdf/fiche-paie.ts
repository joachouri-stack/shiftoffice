import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { INK, GRIS, OR, eur } from "./helpers";
import type { FichePaieResult } from "@/lib/paie/calcul";

export type FichePaieData = {
  entrepriseNom: string;
  entrepriseAdresse: string;
  siret: string;
  salarieNom: string;
  poste: string;
  numeroSecu: string;
  periode: string;
  result: FichePaieResult;
};

const CREME = rgb(0.98, 0.965, 0.93);
const ZEBRA = rgb(0.975, 0.96, 0.93);
const LIGNE = rgb(0.87, 0.84, 0.78);
const ORL = rgb(0.96, 0.92, 0.82); // doré très clair

export async function buildFichePaiePDF(d: FichePaieData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const M = 40;
  const R = 595.28 - M; // 555.28
  const W = R - M;
  let y = 802;

  const text = (
    s: string,
    x: number,
    yy: number,
    size = 9,
    f = font,
    color = INK
  ) => page.drawText(s, { x, y: yy, size, font: f, color });

  const rtext = (
    s: string,
    xR: number,
    yy: number,
    size = 8,
    f = font,
    color = INK
  ) =>
    page.drawText(s, {
      x: xR - f.widthOfTextAtSize(s, size),
      y: yy,
      size,
      font: f,
      color,
    });

  const rect = (
    x: number,
    yy: number,
    w: number,
    h: number,
    fill?: ReturnType<typeof rgb>,
    border?: ReturnType<typeof rgb>,
    bw = 0.8
  ) =>
    page.drawRectangle({
      x,
      y: yy,
      width: w,
      height: h,
      ...(fill ? { color: fill } : {}),
      ...(border ? { borderColor: border, borderWidth: bw } : {}),
    });

  // ─── Titre ───
  text("BULLETIN DE PAIE", M, y, 19, bold);
  rect(M, y - 9, bold.widthOfTextAtSize("BULLETIN DE PAIE", 19), 3, OR);
  // pastille période à droite
  const perTxt = `Période : ${d.periode || "—"}`;
  const perW = bold.widthOfTextAtSize(perTxt, 9.5) + 20;
  rect(R - perW, y - 3, perW, 22, ORL, OR, 0.8);
  rtext(perTxt, R - 10, y + 4, 9.5, bold, INK);
  y -= 30;

  // ─── Boîtes Employeur / Salarié ───
  const gap = 14;
  const boxW = (W - gap) / 2;
  const boxH = 70;
  const boxY = y - boxH;
  // employeur
  rect(M, boxY, boxW, boxH, undefined, LIGNE, 1);
  rect(M, boxY + boxH - 16, boxW, 16, CREME);
  text("EMPLOYEUR", M + 8, boxY + boxH - 11.5, 7.5, bold, GRIS);
  text(d.entrepriseNom || "—", M + 8, boxY + boxH - 30, 10, bold);
  {
    let yy = boxY + boxH - 43;
    for (const l of (d.entrepriseAdresse || "").match(/.{1,42}(\s|$)/g) ?? []) {
      text(l.trim(), M + 8, yy, 8, font, GRIS);
      yy -= 10.5;
    }
    if (d.siret) text(`SIRET : ${d.siret}`, M + 8, yy, 8, font, GRIS);
  }
  // salarié
  const sx = M + boxW + gap;
  rect(sx, boxY, boxW, boxH, undefined, LIGNE, 1);
  rect(sx, boxY + boxH - 16, boxW, 16, CREME);
  text("SALARIÉ", sx + 8, boxY + boxH - 11.5, 7.5, bold, GRIS);
  text(d.salarieNom || "—", sx + 8, boxY + boxH - 30, 10, bold);
  {
    let yy = boxY + boxH - 43;
    if (d.poste) {
      text(`Poste : ${d.poste}`, sx + 8, yy, 8, font, GRIS);
      yy -= 10.5;
    }
    if (d.numeroSecu)
      text(`N° SS : ${d.numeroSecu}`, sx + 8, yy, 8, font, GRIS);
  }
  y = boxY - 18;

  // ─── Rémunération brute ───
  rect(M, y - 6, W, 24, ORL, OR, 1);
  text("Rémunération brute", M + 10, y + 2, 11, bold);
  rtext(`${eur(d.result.brut)} €`, R - 10, y + 2, 12, bold);
  y -= 36;

  // ─── Tableau cotisations ───
  // colonnes (bords droits)
  const cBase = 330;
  const cTSal = 388;
  const cSal = 452;
  const cTPat = 502;
  const cPat = R;
  const rowH = 13;

  // bandeau d'en-tête
  rect(M, y - 4, W, 16, INK);
  const headY = y + 0.5;
  text("COTISATIONS ET CONTRIBUTIONS", M + 8, headY, 7.5, bold, CREME);
  rtext("Base", cBase, headY, 7, bold, CREME);
  rtext("Taux sal.", cTSal, headY, 7, bold, CREME);
  rtext("Part sal.", cSal, headY, 7, bold, CREME);
  rtext("Taux pat.", cTPat, headY, 7, bold, CREME);
  rtext("Part pat.", cPat - 6, headY, 7, bold, CREME);
  y -= 16;

  d.result.lignes.forEach((l, i) => {
    if (i % 2 === 1) rect(M, y - 3.5, W, rowH, ZEBRA);
    text(l.label, M + 8, y, 7.8, font, INK);
    rtext(eur(l.base), cBase, y, 7.8, font, GRIS);
    rtext(l.tauxSal ? `${l.tauxSal} %` : "—", cTSal, y, 7.8, font, GRIS);
    rtext(l.montSal ? eur(l.montSal) : "—", cSal, y, 7.8, font, INK);
    rtext(l.tauxPat ? `${l.tauxPat} %` : "—", cTPat, y, 7.8, font, GRIS);
    rtext(l.montPat ? eur(l.montPat) : "—", cPat - 6, y, 7.8, font, GRIS);
    y -= rowH;
  });

  // total cotisations
  rect(M, y - 3.5, W, rowH + 1, ORL);
  text("TOTAL DES COTISATIONS", M + 8, y, 8, bold);
  rtext(eur(d.result.totalSal), cSal, y, 8, bold);
  rtext(eur(d.result.totalPat), cPat - 6, y, 8, bold, GRIS);
  y -= rowH + 18;

  // ─── Bloc Net ───
  const netSocial = d.result.netAvantImpot; // approximation (sans PAS)
  const rowsNet: Array<[string, string, boolean]> = [
    ["Net imposable", `${eur(d.result.netImposable)} €`, false],
    ["Montant net social", `${eur(netSocial)} €`, false],
  ];
  const blocH = 30 + rowsNet.length * 16 + 34;
  rect(M, y - blocH + 16, W, blocH, undefined, OR, 1);

  let ny = y;
  for (const [label, val, _s] of rowsNet) {
    void _s;
    text(label, M + 12, ny, 9, font, GRIS);
    rtext(val, R - 12, ny, 9, font, INK);
    ny -= 16;
  }
  // séparateur
  ny -= 2;
  page.drawLine({
    start: { x: M + 12, y: ny + 8 },
    end: { x: R - 12, y: ny + 8 },
    color: LIGNE,
    thickness: 0.8,
  });
  // bandeau NET À PAYER
  rect(M, ny - 14, W, 26, INK);
  text("NET À PAYER", M + 12, ny - 5, 12, bold, CREME);
  rtext(`${eur(d.result.netAvantImpot)} €`, R - 12, ny - 6, 15, bold, OR);
  ny -= 30;
  // coût employeur (note discrète)
  text("Coût total employeur", M + 12, ny, 8.5, font, GRIS);
  rtext(`${eur(d.result.coutEmployeur)} €`, R - 12, ny, 8.5, font, GRIS);

  // ─── Pied ───
  text(
    "Bulletin indicatif généré via Shift Office — shiftoffice.fr.",
    M,
    46,
    7.5,
    font,
    GRIS
  );
  text(
    "Taux indicatifs à vérifier selon votre convention collective. Le « net à payer » est avant prélèvement à la source.",
    M,
    36,
    7.5,
    font,
    GRIS
  );

  return pdf.save();
}

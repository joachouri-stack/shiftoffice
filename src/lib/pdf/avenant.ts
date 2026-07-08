import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";
import { wrap } from "./helpers";

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

// Palette premium (identique au contrat, bail, statuts, rupture).
const NAVY = rgb(0.1059, 0.1647, 0.2902);
const GOLD = rgb(0.7843, 0.6588, 0.2941);
const G100 = rgb(0.9686, 0.9725, 0.9804);
const G200 = rgb(0.9255, 0.9333, 0.949);
const G300 = rgb(0.8314, 0.8471, 0.8784);
const G500 = rgb(0.5333, 0.5725, 0.6431);
const G700 = rgb(0.2902, 0.3333, 0.4078);
const TEXT = rgb(0.102, 0.1255, 0.1725);
const WHITE = rgb(1, 1, 1);

const PW = 595.28;
const PH = 841.89;
const M = 40;
const W = PW - M * 2;
const BOTTOM = 60;

export async function buildAvenantPDF(d: AvenantData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansB = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serifI = await pdf.embedFont(StandardFonts.TimesRomanItalic);

  const pages: PDFPage[] = [];
  let page!: PDFPage;
  let y = PH;

  const newPage = (top = PH - M) => {
    page = pdf.addPage([PW, PH]);
    pages.push(page);
    y = top;
  };

  // ── primitives ──
  const t = (s: string, x: number, yy: number, size = 10, f = sans, c = TEXT) =>
    page.drawText(s, { x, y: yy, size, font: f, color: c });
  const tc = (s: string, cxx: number, yy: number, size = 10, f = sans, c = TEXT) =>
    page.drawText(s, { x: cxx - f.widthOfTextAtSize(s, size) / 2, y: yy, size, font: f, color: c });
  const rect = (
    x: number,
    yy: number,
    w: number,
    h: number,
    fill?: ReturnType<typeof rgb>,
    border?: ReturnType<typeof rgb>,
    bw = 1
  ) =>
    page.drawRectangle({
      x,
      y: yy,
      width: w,
      height: h,
      ...(fill ? { color: fill } : {}),
      ...(border ? { borderColor: border, borderWidth: bw } : {}),
    });
  const hline = (x1: number, x2: number, yy: number, c = G200, th = 1) =>
    page.drawLine({ start: { x: x1, y: yy }, end: { x: x2, y: yy }, thickness: th, color: c });
  const tracked = (s: string, x: number, yy: number, size: number, f: typeof sans, c: typeof TEXT, tr = 1.2) => {
    let cxx = x;
    for (const ch of s) {
      page.drawText(ch, { x: cxx, y: yy, size, font: f, color: c });
      cxx += f.widthOfTextAtSize(ch, size) + tr;
    }
  };
  const trackedC = (s: string, cxx: number, yy: number, size: number, f: typeof sans, c: typeof TEXT, tr = 1.2) => {
    let total = 0;
    for (const ch of s) total += f.widthOfTextAtSize(ch, size) + tr;
    total -= tr;
    tracked(s, cxx - total / 2, yy, size, f, c, tr);
  };
  const clipB = (s: string, size: number, maxW: number, f = sansB): string => {
    if (f.widthOfTextAtSize(s, size) <= maxW) return s;
    let out = s;
    while (out.length > 1 && f.widthOfTextAtSize(out + "…", size) > maxW)
      out = out.slice(0, -1);
    return out.trimEnd() + "…";
  };
  // Bandeau : adapte l'interlettrage/la taille pour un libellé long.
  const fitTrackedC = (s: string, yy: number, size: number, tr: number, maxW: number, color = WHITE) => {
    const width = (txt: string, sz: number, sp: number) => {
      let w = 0;
      for (const ch of txt) w += sansB.widthOfTextAtSize(ch, sz) + sp;
      return w - sp;
    };
    let sz = size;
    let sp = tr;
    while (width(s, sz, sp) > maxW && (sz > 7.5 || sp > 0.4)) {
      if (sp > 0.4) sp = Math.max(0.4, sp - 0.4);
      else sz -= 0.5;
    }
    let out = s;
    while (out.length > 1 && width(out + "…", sz, sp) > maxW) out = out.slice(0, -1);
    if (out !== s) out = out.trimEnd() + "…";
    trackedC(out, PW / 2, yy, sz, sansB, color, sp);
  };

  // ════════════════ PAGE 1 ════════════════
  newPage();
  y = PH;

  // ── Bandeau titre ──
  const bandH = 100;
  rect(0, PH - bandH, PW, bandH, NAVY);
  rect(0, PH - bandH, PW, 3, GOLD);
  const cx = PW / 2;
  trackedC("AVENANT", cx, PH - 42, 22, sansB, WHITE, 4.5);
  trackedC("AU CONTRAT DE TRAVAIL", cx, PH - 64, 11, sansB, WHITE, 2.5);
  fitTrackedC((d.typeModif || "Modification du contrat").toUpperCase(), PH - 84, 8.5, 1.6, W - 20, GOLD);
  y = PH - bandH - 22;

  // ── Parties côte à côte ──
  const gap = 14;
  const colW = (W - gap) / 2;
  const ipad = 12;
  const innerW = colW - ipad * 2;

  const empItems: Array<[string, string]> = [
    ["Adresse :", d.entrepriseAdresse || "—"],
    ["SIRET :", d.siret || "—"],
    [
      "Représenté par :",
      `${d.representantNom || "—"}${d.representantQualite ? ` (${d.representantQualite})` : ""}`,
    ],
  ];
  const salItems: Array<[string, string]> = [
    ["Adresse :", d.salarieAdresse || "—"],
    ["Poste :", d.poste || "—"],
    ["Contrat initial du :", d.dateContratInitial || "—"],
  ];

  const partyHeight = (items: Array<[string, string]>) => {
    let lines = 0;
    for (const [lbl, val] of items) {
      const avail = innerW - sansB.widthOfTextAtSize(`${lbl} `, 9);
      lines += Math.max(1, wrap(val, sans, 9, Math.max(50, avail)).length);
    }
    return 3 + 20 + 12 + 16 + lines * 13 + 10;
  };
  const partyH = Math.max(partyHeight(empItems), partyHeight(salItems));

  const drawParty = (
    x: number,
    accent: ReturnType<typeof rgb>,
    headerBg: ReturnType<typeof rgb>,
    headerColor: ReturnType<typeof rgb>,
    label: string,
    name: string,
    items: Array<[string, string]>
  ) => {
    rect(x, y - partyH, colW, partyH, G100, G300, 1);
    rect(x, y - 3, colW, 3, accent);
    rect(x, y - 23, colW, 20, headerBg);
    tracked(label, x + ipad, y - 17, 9, sansB, headerColor, 1.5);
    let by = y - 23 - 18;
    t(clipB(name, 11.5, innerW), x + ipad, by, 11.5, sansB, NAVY);
    by -= 16;
    for (const [lbl, val] of items) {
      const lblW = sansB.widthOfTextAtSize(`${lbl} `, 9);
      t(lbl, x + ipad, by, 9, sansB, TEXT);
      const vlines = wrap(val, sans, 9, innerW - lblW);
      vlines.forEach((vl, idx) => {
        t(vl, x + ipad + (idx === 0 ? lblW : 0), by, 9, sans, G700);
        if (idx < vlines.length - 1) by -= 12;
      });
      by -= 13;
    }
  };
  drawParty(M, NAVY, NAVY, WHITE, "L'EMPLOYEUR", d.entrepriseNom || "L'entreprise", empItems);
  drawParty(M + colW + gap, GOLD, GOLD, NAVY, "LE SALARIÉ", d.salarieNom || "Le/la salarié(e)", salItems);
  y -= partyH + 18;

  // ── « Il a été convenu… » ──
  hline(M, M + W, y, G300, 1);
  tc("Il a été convenu et arrêté ce qui suit :", cx, y - 16, 13, serifI, NAVY);
  hline(M, M + W, y - 26, G300, 1);
  y -= 40;

  // ── Article 1 : objet + tableau des modifications ──
  const card = (num: number, title: string, body: string, after?: () => void, afterH = 0) => {
    const lines = wrap(body, sans, 9.5, W - 24);
    const headH = 24;
    const cardH = headH + 10 + lines.length * 13.5 + 8 + afterH;
    if (y - cardH < BOTTOM) newPage();
    const y0 = y;
    rect(M, y0 - cardH, W, cardH, undefined, G200, 1);
    rect(M, y0 - headH, W, headH, G100);
    hline(M, M + W, y0 - headH, G200, 1);
    page.drawEllipse({ x: M + 20, y: y0 - headH / 2, xScale: 9, yScale: 9, color: NAVY });
    tc(String(num), M + 20, y0 - headH / 2 - 3.2, 8.5, sansB, WHITE);
    tracked(`ARTICLE ${num} — ${title.toUpperCase()}`, M + 36, y0 - 15.5, 8.5, sansB, NAVY, 0.4);
    let cyy = y0 - headH - 13;
    for (const l of lines) {
      t(l, M + 12, cyy, 9.5, sans, TEXT);
      cyy -= 13.5;
    }
    if (after) {
      y = cyy + 13.5 - 6; // position du tableau dans la carte
      after();
    }
    // Fin de carte : sous la bordure, avec l'espacement standard.
    y = y0 - cardH - 11;
  };

  const modifs = d.modifications.filter((m) => m.intitule.trim());
  const rowH = 20;
  const tabH = modifs.length ? rowH * (modifs.length + 1) + 6 : 0;

  card(
    1,
    "Objet de l'avenant",
    `Les parties conviennent de modifier, par le présent avenant, le contrat de travail conclu en date du ` +
      `${d.dateContratInitial || "—"}. Les dispositions suivantes sont modifiées à compter du ${d.dateEffet || "—"} :`,
    modifs.length
      ? () => {
          const tx = M + 12;
          const tw = W - 24;
          const cInt = tx + 8;
          const cAnc = tx + Math.round(tw * 0.38);
          const cNouv = tx + Math.round(tw * 0.68);
          const cell = (s: string, maxW: number, f = sans) => clipB(s, 9.5, maxW, f);
          rect(tx, y - rowH + 4, tw, rowH, NAVY);
          rect(tx, y - rowH + 4 + rowH - 2, tw, 2, GOLD);
          t("Élément", cInt, y - 9, 9, sansB, WHITE);
          t("Ancienne disposition", cAnc, y - 9, 9, sansB, WHITE);
          t("Nouvelle disposition", cNouv, y - 9, 9, sansB, WHITE);
          let ty = y - rowH - 9 + 4;
          modifs.forEach((m, i) => {
            if (i % 2 === 1) rect(tx, ty - 5, tw, rowH, G100);
            t(cell(m.intitule, cAnc - cInt - 10), cInt, ty, 9.5, sans, TEXT);
            t(cell(m.ancien || "—", cNouv - cAnc - 10), cAnc, ty, 9.5, sans, G700);
            t(cell(m.nouveau || "—", tx + tw - cNouv - 8, sansB), cNouv, ty, 9.5, sansB, TEXT);
            ty -= rowH;
          });
        }
      : undefined,
    tabH
  );

  card(
    2,
    "Maintien des autres clauses",
    `Toutes les autres clauses et conditions du contrat de travail initial non modifiées par le présent ` +
      `avenant demeurent inchangées et continuent de produire leurs effets. Le présent avenant annule et ` +
      `remplace les clauses modifiées du contrat de travail initial en date du ${d.dateContratInitial || "—"}.`
  );

  // ════════════════ Signatures ════════════════
  const sigBlocH = 132;
  const needed = 18 + 18 + sigBlocH + 30;
  if (y - needed < BOTTOM) newPage();
  const stitle = "SIGNATURES";
  tracked(stitle, M, y, 10, sansB, TEXT, 0.6);
  let sw = 0;
  for (const ch of stitle) sw += sansB.widthOfTextAtSize(ch, 10) + 0.6;
  rect(M, y - 6, sw + 3, 2, GOLD);
  y -= 18;
  t(
    `Fait à ${d.ville || "—"}, le ${d.date || "—"}, en deux exemplaires originaux, dont un remis à chaque partie.`,
    M,
    y,
    10,
    serifI,
    G700
  );
  y -= 18;

  const sigW = (W - gap) / 2;
  const sigBox = (x: number, label: string, name: string, role: string) => {
    rect(x, y - sigBlocH, sigW, sigBlocH, G100, G300, 1);
    rect(x, y - 20, sigW, 20, NAVY);
    tracked(label, x + ipad, y - 14, 9, sansB, WHITE, 1.5);
    t(clipB(name || "—", 10.5, sigW - 24), x + ipad, y - 38, 10.5, sansB, TEXT);
    t(role, x + ipad, y - 51, 8.5, sans, G500);
    hline(x + ipad, x + sigW - ipad, y - sigBlocH + 24, NAVY, 0.8);
    t("Lu et approuvé — Bon pour accord", x + ipad, y - sigBlocH + 11, 8, serifI, G500);
  };
  sigBox(M, "L'EMPLOYEUR", d.representantNom, d.representantQualite || "Représentant légal");
  sigBox(M + sigW + gap, "LE SALARIÉ", d.salarieNom, "Salarié(e)");
  y -= sigBlocH + 18;

  // ── Mention légale ──
  if (y - 30 < BOTTOM) newPage();
  hline(M, M + W, y, G300, 1);
  tc("Cet avenant fait partie intégrante du contrat de travail — conservez-le avec celui-ci.", cx, y - 13, 8, sans, G500);
  tc("Conforme aux dispositions du Code du travail en vigueur.", cx, y - 24, 8, sans, G500);

  // ── Pagination ──
  const n = pages.length;
  pages.forEach((p, idx) => {
    const pg = `${idx + 1} / ${n}`;
    p.drawText(pg, {
      x: PW - M - sans.widthOfTextAtSize(pg, 8),
      y: 30,
      size: 8,
      font: sans,
      color: G500,
    });
    p.drawText("Avenant au contrat de travail", { x: M, y: 30, size: 8, font: sans, color: G500 });
  });

  return pdf.save();
}

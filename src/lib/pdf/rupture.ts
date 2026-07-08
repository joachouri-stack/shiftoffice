import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";
import { eur, wrap } from "./helpers";

export type RuptureData = {
  entrepriseNom: string;
  entrepriseAdresse: string;
  siret: string;
  representantNom: string;
  representantQualite: string;
  salarieNom: string;
  salarieAdresse: string;
  poste: string;
  dateEmbauche: string;
  salaireBrut: number;
  indemniteRupture: number;
  dateEntretien: string;
  dateRupture: string; // date envisagée de fin de contrat
  ville: string;
  date: string;
};

// Palette premium (identique au contrat, bail, statuts).
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

export async function buildRupturePDF(d: RuptureData): Promise<Uint8Array> {
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
  const clipB = (s: string, size: number, maxW: number): string => {
    if (sansB.widthOfTextAtSize(s, size) <= maxW) return s;
    let out = s;
    while (out.length > 1 && sansB.widthOfTextAtSize(out + "…", size) > maxW)
      out = out.slice(0, -1);
    return out.trimEnd() + "…";
  };

  // ════════════════ PAGE 1 ════════════════
  newPage();
  y = PH;

  // ── Bandeau titre ──
  const bandH = 100;
  rect(0, PH - bandH, PW, bandH, NAVY);
  rect(0, PH - bandH, PW, 3, GOLD);
  const cx = PW / 2;
  trackedC("RUPTURE CONVENTIONNELLE", cx, PH - 44, 19, sansB, WHITE, 3);
  trackedC("CONVENTION DE RUPTURE D'UN COMMUN ACCORD", cx, PH - 66, 10, sansB, WHITE, 2);
  trackedC("ARTICLES L. 1237-11 ET SUIVANTS DU CODE DU TRAVAIL", cx, PH - 85, 8, sansB, GOLD, 1.6);
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
    ["Embauché(e) le :", d.dateEmbauche || "—"],
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

  // ── L'essentiel de la rupture ──
  const recap: Array<[string, string]> = [
    ["ENTRETIEN PRÉALABLE", d.dateEntretien || "—"],
    ["INDEMNITÉ SPÉCIFIQUE", `${eur(d.indemniteRupture || 0)} € bruts`],
    ["DATE DE RUPTURE ENVISAGÉE", d.dateRupture || "—"],
    ["RÉTRACTATION", "15 jours calendaires"],
    ["SALAIRE DE RÉFÉRENCE", d.salaireBrut > 0 ? `${eur(d.salaireBrut)} € bruts/mois` : "—"],
    ["HOMOLOGATION", "DREETS — 15 jours ouvrables"],
  ];
  const eCols = 3;
  const eRows = Math.ceil(recap.length / eCols);
  const eColW = W / eCols;
  const eInner = eColW - 24;
  const eRowH = 36;
  const eHead = 22;
  const essH = eHead + 12 + eRows * eRowH;
  rect(M, y - essH, W, essH, G100, G300, 1);
  rect(M, y - eHead, W, eHead, NAVY);
  rect(M, y - eHead, W, 2, GOLD);
  tracked("L'ESSENTIEL DE LA RUPTURE", M + ipad, y - 15, 9, sansB, WHITE, 1.5);
  for (let c = 1; c < eCols; c++)
    rect(M + c * eColW, y - essH + 10, 1, essH - eHead - 20, G300);
  recap.forEach((cell, idx) => {
    const r = Math.floor(idx / eCols);
    const c = idx % eCols;
    const ix = M + c * eColW + 14;
    const iy = y - eHead - 18 - r * eRowH;
    tracked(cell[0], ix, iy, 7, sansB, G500, 0.4);
    const all = wrap(cell[1], sansB, 10, eInner);
    const lines = all.slice(0, 2);
    if (all.length > 2) lines[1] += "…";
    let vy = iy - 13;
    for (const vl of lines.map((l) => clipB(l, 10, eInner))) {
      t(vl, ix, vy, 10, sansB, TEXT);
      vy -= 11.5;
    }
  });
  y -= essH + 18;

  // ── « Il a été convenu… » ──
  hline(M, M + W, y, G300, 1);
  tc("Il a été convenu et arrêté ce qui suit :", cx, y - 16, 13, serifI, NAVY);
  hline(M, M + W, y - 26, G300, 1);
  y -= 40;

  // ════════════════ Articles ════════════════
  const arts: Array<[string, string]> = [
    [
      "Principe de la rupture",
      `Les parties conviennent, d'un commun accord et dans le cadre des articles L. 1237-11 et suivants du ` +
        `Code du travail, de rompre le contrat de travail à durée indéterminée qui les lie. Cette rupture ` +
        `résulte de la libre volonté des deux parties et ne peut être imposée par l'une ou l'autre.`,
    ],
    [
      "Entretien(s) préalable(s)",
      `Les parties se sont rencontrées au cours d'un ou plusieurs entretiens, notamment le ${d.dateEntretien || "—"}, ` +
        `afin de convenir du principe et des modalités de la rupture. Le Salarié a été informé de la possibilité ` +
        `de se faire assister lors de ces entretiens.`,
    ],
    [
      "Indemnité spécifique de rupture",
      `Le Salarié percevra une indemnité spécifique de rupture conventionnelle d'un montant de ` +
        `${eur(d.indemniteRupture || 0)} euros bruts. Ce montant ne peut être inférieur à l'indemnité légale de ` +
        `licenciement. Cette indemnité sera versée à la date de rupture effective du contrat.` +
        (d.salaireBrut > 0
          ? ` À titre indicatif, la rémunération mensuelle brute de référence du Salarié s'élève à ${eur(d.salaireBrut)} euros.`
          : ""),
    ],
    [
      "Date de rupture du contrat",
      `La date envisagée de rupture du contrat de travail est fixée au ${d.dateRupture || "—"}, sous réserve de ` +
        `l'homologation de la présente convention par l'autorité administrative compétente (DREETS). La rupture ` +
        `ne peut intervenir avant le lendemain du jour de l'homologation.`,
    ],
    [
      "Droit de rétractation",
      `À compter de la date de signature de la présente convention, chacune des parties dispose d'un délai de ` +
        `quinze (15) jours calendaires pour exercer son droit de rétractation. Ce droit s'exerce par lettre ` +
        `adressée à l'autre partie par tout moyen attestant de sa date de réception.`,
    ],
    [
      "Homologation",
      `À l'issue du délai de rétractation, la partie la plus diligente adresse une demande d'homologation à la ` +
        `DREETS, accompagnée d'un exemplaire de la convention. L'autorité administrative dispose d'un délai ` +
        `d'instruction de quinze (15) jours ouvrables. À défaut de réponse dans ce délai, l'homologation est ` +
        `réputée acquise.`,
    ],
    [
      "Documents de fin de contrat",
      `À la date de rupture, l'Employeur remettra au Salarié un certificat de travail, une attestation ` +
        `France Travail, ainsi qu'un reçu pour solde de tout compte récapitulant l'ensemble des sommes versées.`,
    ],
  ];

  arts.forEach(([title, body], idx) => {
    const lines = wrap(body, sans, 9.5, W - 24);
    const headH = 24;
    const cardH = headH + 10 + lines.length * 13.5 + 8;
    if (y - cardH < BOTTOM) newPage();
    rect(M, y - cardH, W, cardH, undefined, G200, 1);
    rect(M, y - headH, W, headH, G100);
    hline(M, M + W, y - headH, G200, 1);
    page.drawEllipse({ x: M + 20, y: y - headH / 2, xScale: 9, yScale: 9, color: NAVY });
    tc(String(idx + 1), M + 20, y - headH / 2 - 3.2, 8.5, sansB, WHITE);
    tracked(`ARTICLE ${idx + 1} — ${title.toUpperCase()}`, M + 36, y - 15.5, 8.5, sansB, NAVY, 0.4);
    let cyy = y - headH - 13;
    for (const l of lines) {
      t(l, M + 12, cyy, 9.5, sans, TEXT);
      cyy -= 13.5;
    }
    y -= cardH + 11;
  });

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
  tc(
    "Un formulaire de demande d'homologation (CERFA) doit accompagner cette convention auprès de la DREETS.",
    cx,
    y - 13,
    8,
    sans,
    G500
  );
  tc("Chaque partie conserve un exemplaire original signé.", cx, y - 24, 8, sans, G500);

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
    p.drawText("Convention de rupture conventionnelle", { x: M, y: 30, size: 8, font: sans, color: G500 });
  });

  return pdf.save();
}

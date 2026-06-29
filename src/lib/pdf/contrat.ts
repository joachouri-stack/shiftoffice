import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";
import { eur, wrap } from "./helpers";

export type ContratData = {
  entrepriseNom: string;
  entrepriseAdresse: string;
  siret: string;
  representantNom: string;
  representantQualite: string;
  salarieNom: string;
  salarieAdresse: string;
  salarieDateNaissance: string;
  salarieLieuNaissance: string;
  salarieNationalite: string;
  typeContrat: "cdi" | "cdd";
  dateDebut: string;
  dateFin: string; // CDD
  motifCdd: string; // CDD
  poste: string;
  salaireBrut: number;
  heuresSemaine: number;
  lieuTravail: string;
  periodeEssai: string;
  conventionCollective: string;
  ville: string;
  date: string;
};

// Palette reprise du template fourni.
const NAVY = rgb(0.1059, 0.1647, 0.2902); // #1B2A4A
const GOLD = rgb(0.7843, 0.6588, 0.2941); // #C8A84B
const G100 = rgb(0.9686, 0.9725, 0.9804); // #F7F8FA
const G200 = rgb(0.9255, 0.9333, 0.949); // #ECEEF2
const G300 = rgb(0.8314, 0.8471, 0.8784); // #D4D8E0
const G500 = rgb(0.5333, 0.5725, 0.6431); // #8892A4
const G700 = rgb(0.2902, 0.3333, 0.4078); // #4A5568
const TEXT = rgb(0.102, 0.1255, 0.1725); // #1A202C
const WHITE = rgb(1, 1, 1);

const PW = 595.28;
const PH = 841.89;
const M = 40;
const W = PW - M * 2;
const BOTTOM = 60;

export async function buildContratPDF(d: ContratData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansB = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serifB = await pdf.embedFont(StandardFonts.TimesRomanBold);
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
  const tc = (s: string, cx: number, yy: number, size = 10, f = sans, c = TEXT) =>
    page.drawText(s, { x: cx - f.widthOfTextAtSize(s, size) / 2, y: yy, size, font: f, color: c });
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
  // Texte avec interlettrage (libellés en capitales).
  const tracked = (s: string, x: number, yy: number, size: number, f: typeof sans, c: typeof TEXT, tr = 1.2) => {
    let cx = x;
    for (const ch of s) {
      page.drawText(ch, { x: cx, y: yy, size, font: f, color: c });
      cx += f.widthOfTextAtSize(ch, size) + tr;
    }
  };
  const trackedC = (s: string, cx: number, yy: number, size: number, f: typeof sans, c: typeof TEXT, tr = 1.2) => {
    let total = 0;
    for (const ch of s) total += f.widthOfTextAtSize(ch, size) + tr;
    total -= tr;
    tracked(s, cx - total / 2, yy, size, f, c, tr);
  };

  const cdi = d.typeContrat !== "cdd";

  // ════════════════ PAGE 1 ════════════════
  newPage();
  y = PH;

  // ── Bandeau titre (navy, pleine largeur, centré) ──
  const bandH = 92;
  rect(0, PH - bandH, PW, bandH, NAVY);
  rect(0, PH - bandH, PW, 3, GOLD); // liseré doré en bas du bandeau
  const cx = PW / 2;
  tc("CONTRAT DE TRAVAIL", cx, PH - 36, 20, serifB, WHITE);
  tc(cdi ? "À DURÉE INDÉTERMINÉE" : "À DURÉE DÉTERMINÉE", cx, PH - 58, 20, serifB, WHITE);
  trackedC(cdi ? "CDI" : "CDD", cx, PH - 78, 11, sansB, GOLD, 2.5);
  y = PH - bandH;

  // ── Récap (bandeau gris clair, grille) ──
  const recap: Array<[string, string]> = [
    ["POSTE", d.poste || "—"],
    ["LIEU DE TRAVAIL", d.lieuTravail || d.entrepriseAdresse || "—"],
    cdi
      ? ["DATE DE DÉBUT", d.dateDebut || "—"]
      : ["PÉRIODE", `${d.dateDebut || "—"} au ${d.dateFin || "—"}`],
    ["DURÉE HEBDO", `${d.heuresSemaine || 35} h / semaine`],
    ["RÉMUNÉRATION", `${eur(d.salaireBrut || 0)} € brut/mois`],
    ["CONVENTION", d.conventionCollective || "—"],
  ];
  const rcCols = 3;
  const rcRows = Math.ceil(recap.length / rcCols);
  const rcRowH = 30;
  const recapH = 14 + rcRows * rcRowH;
  rect(0, y - recapH, PW, recapH, G100);
  hline(0, PW, y - recapH, G300, 1);
  const rcColW = W / rcCols;
  recap.forEach((cell, i) => {
    const r = Math.floor(i / rcCols);
    const c = i % rcCols;
    const ix = M + c * rcColW;
    const iy = y - 16 - r * rcRowH;
    tracked(cell[0], ix, iy, 7, sansB, G500, 0.4);
    t(cell[1], ix, iy - 13, 11, sansB, TEXT);
  });
  y -= recapH + 18;

  // ── Parties (côte à côte, Employeur navy / Salarié or) ──
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
    [
      "Né(e) le :",
      `${d.salarieDateNaissance || "—"}${d.salarieLieuNaissance ? ` à ${d.salarieLieuNaissance}` : ""}`,
    ],
    ["Nationalité :", d.salarieNationalite || "—"],
  ];

  // Hauteur d'un bloc partie selon le nombre de lignes (valeurs qui s'enroulent).
  const partyHeight = (items: Array<[string, string]>) => {
    let lines = 0;
    for (const [lbl, val] of items) {
      const avail = innerW - sansB.widthOfTextAtSize(`${lbl} `, 9);
      lines += Math.max(1, wrap(val, sans, 9, Math.max(50, avail)).length);
    }
    return 3 + 20 + 12 + 16 + lines * 13 + 10; // accent + header + padTop + name + lignes + padBottom
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
    rect(x, y - partyH, colW, partyH, G100, G300, 1); // corps + bordure
    rect(x, y - 3, colW, 3, accent); // accent haut (navy ou or)
    rect(x, y - 23, colW, 20, headerBg); // bandeau d'en-tête
    tracked(label, x + ipad, y - 17, 9, sansB, headerColor, 1.5);
    let by = y - 23 - 18;
    t(name, x + ipad, by, 11.5, sansB, NAVY);
    by -= 16;
    for (const [lbl, val] of items) {
      const lblW = sansB.widthOfTextAtSize(`${lbl} `, 9);
      t(lbl, x + ipad, by, 9, sansB, TEXT);
      const vlines = wrap(val, sans, 9, innerW - lblW);
      vlines.forEach((vl, i) => {
        t(vl, x + ipad + (i === 0 ? lblW : 0), by, 9, sans, G700);
        if (i < vlines.length - 1) by -= 12;
      });
      by -= 13;
    }
  };
  drawParty(M, NAVY, NAVY, WHITE, "L'EMPLOYEUR", d.entrepriseNom || "L'entreprise", empItems);
  drawParty(M + colW + gap, GOLD, GOLD, NAVY, "LE SALARIÉ", d.salarieNom || "Le/la salarié(e)", salItems);
  y -= partyH + 16;

  // ── « Il a été convenu… » (encadré, italique serif, centré) ──
  hline(M, M + W, y, G300, 1);
  tc("Il a été convenu et arrêté ce qui suit :", cx, y - 16, 13, serifI, NAVY);
  hline(M, M + W, y - 26, G300, 1);
  y -= 40;

  // ════════════════ Articles ════════════════
  const arts: Array<[string, string]> = [
    [
      "Engagement et fonctions",
      `Le Salarié est engagé en qualité de ${d.poste || "—"}. Il exercera ses fonctions sous l'autorité et selon les ` +
        `directives de l'Employeur, à qui il rendra compte de son activité, et se conformera au règlement intérieur de l'entreprise.`,
    ],
    [
      "Durée du contrat",
      cdi
        ? `Le présent contrat est conclu pour une durée indéterminée à compter du ${d.dateDebut || "—"}. Il ne deviendra ` +
          `définitif qu'à l'issue de la période d'essai éventuellement prévue ci-après.`
        : `Le présent contrat est conclu pour une durée déterminée, du ${d.dateDebut || "—"} au ${d.dateFin || "—"}, ` +
          `pour le motif suivant : ${d.motifCdd || "accroissement temporaire d'activité"}. Il prendra fin de plein droit à son terme.`,
    ],
    [
      "Période d'essai",
      d.periodeEssai && d.periodeEssai !== "Aucune"
        ? `Le contrat est assorti d'une période d'essai de ${d.periodeEssai}, durant laquelle chacune des parties pourra y ` +
          `mettre fin librement, sans indemnité, sous réserve du délai de prévenance légal.`
        : `Le contrat ne comporte pas de période d'essai.`,
    ],
    [
      "Lieu de travail",
      `Le Salarié exercera principalement ses fonctions à : ${d.lieuTravail || d.entrepriseAdresse || "—"}. Ce lieu pourra ` +
        `être modifié au sein du même secteur géographique en fonction des nécessités de l'entreprise.`,
    ],
    [
      "Durée et organisation du travail",
      `La durée hebdomadaire de travail est fixée à ${d.heuresSemaine || 35} heures, réparties selon les horaires en vigueur ` +
        `dans l'entreprise. Le Salarié pourra effectuer des heures supplémentaires à la demande de l'Employeur, dans les ` +
        `conditions légales et conventionnelles.`,
    ],
    [
      "Rémunération",
      `En contrepartie de son travail, le Salarié percevra une rémunération brute mensuelle de ${eur(d.salaireBrut || 0)} ` +
        `euros, versée à la fin de chaque mois et donnant lieu à l'établissement d'un bulletin de paie.`,
    ],
  ];
  if (d.conventionCollective)
    arts.push([
      "Convention collective",
      `Les relations entre les parties sont régies par la convention collective : ${d.conventionCollective}, dont le Salarié ` +
        `déclare avoir été informé.`,
    ]);
  arts.push([
    "Congés payés",
    `Le Salarié bénéficiera des congés payés conformément aux dispositions légales et conventionnelles, soit 2,5 jours ` +
      `ouvrables par mois de travail effectif. Les dates seront fixées en accord avec l'Employeur.`,
  ]);
  arts.push([
    "Protection sociale et prévoyance",
    `Le Salarié sera affilié aux régimes de retraite complémentaire, de prévoyance et de complémentaire santé collective ` +
      `dont relève l'entreprise, dans les conditions prévues par les accords applicables.`,
  ]);
  arts.push([
    "Obligations du Salarié",
    `Le Salarié s'engage à exécuter son travail avec loyauté et diligence, à respecter les consignes de sécurité et à ` +
      `observer une stricte confidentialité sur les informations dont il aurait connaissance, pendant et après le contrat.`,
  ]);
  if (!cdi)
    arts.push([
      "Indemnité de fin de contrat",
      `Au terme du contrat, et sauf cas d'exclusion prévus par la loi, le Salarié percevra une indemnité de fin de contrat ` +
        `égale à 10 % de la rémunération brute totale versée, ainsi qu'une indemnité compensatrice de congés payés.`,
    ]);
  arts.push([
    "Rupture du contrat",
    cdi
      ? `Le contrat pourra être rompu par l'une ou l'autre des parties dans le respect des dispositions légales et ` +
        `conventionnelles, notamment en matière de préavis et de procédure.`
      : `Le contrat ne pourra être rompu avant son terme que dans les cas prévus par l'article L. 1243-1 du Code du travail.`,
  ]);
  arts.push([
    "Dispositions générales",
    `Pour tout ce qui n'est pas prévu au présent contrat, les parties se réfèrent au Code du travail et à la convention ` +
      `collective applicable. Les données personnelles du Salarié sont traitées pour la seule gestion de la relation de ` +
      `travail, conformément au RGPD.`,
  ]);

  arts.forEach(([title, body], idx) => {
    const lines = wrap(body, sans, 9.5, W - 24);
    const headH = 24;
    const cardH = headH + 10 + lines.length * 13.5 + 8;
    if (y - cardH < BOTTOM) newPage();
    rect(M, y - cardH, W, cardH, undefined, G200, 1);
    rect(M, y - headH, W, headH, G100);
    hline(M, M + W, y - headH, G200, 1);
    // pastille numérotée
    page.drawEllipse({ x: M + 20, y: y - headH / 2, xScale: 9, yScale: 9, color: NAVY });
    tc(String(idx + 1), M + 20, y - headH / 2 - 3.2, 8.5, sansB, WHITE);
    tracked(title.toUpperCase(), M + 36, y - 15.5, 9, sansB, NAVY, 0.5);
    let cyy = y - headH - 13;
    for (const l of lines) {
      t(l, M + 12, cyy, 9.5, sans, TEXT);
      cyy -= 13.5;
    }
    y -= cardH + 11;
  });

  // ════════════════ Signatures ════════════════
  const sigBlocH = 96;
  const needed = 18 + 18 + sigBlocH + 30;
  if (y - needed < BOTTOM) newPage();
  // titre section avec soulignement doré
  const stitle = "SIGNATURES";
  tracked(stitle, M, y, 10, sansB, NAVY, 0.6);
  let sw = 0;
  for (const ch of stitle) sw += sansB.widthOfTextAtSize(ch, 10) + 0.6;
  rect(M, y - 6, sw, 2, GOLD);
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
    t(name || "—", x + ipad, y - 38, 10.5, sansB, NAVY);
    t(role, x + ipad, y - 51, 8.5, sans, G500);
    hline(x + ipad, x + sigW - ipad, y - sigBlocH + 24, NAVY, 0.8);
    t("Lu et approuvé — Bon pour accord", x + ipad, y - sigBlocH + 11, 8, serifI, G500);
  };
  sigBox(M, "L'EMPLOYEUR", d.representantNom, "Représentant légal");
  sigBox(M + sigW + gap, "LE SALARIÉ", d.salarieNom, "Salarié(e)");
  y -= sigBlocH + 18;

  // ── Mention légale ──
  if (y - 30 < BOTTOM) newPage();
  hline(M, M + W, y, G300, 1);
  tc(
    "Pour faire valoir vos droits, conservez ce contrat sans limitation de durée.",
    cx,
    y - 13,
    8,
    sans,
    G500
  );
  tc(
    "Document généré via Shift Office — conforme aux dispositions du Code du travail en vigueur.",
    cx,
    y - 24,
    8,
    sans,
    G500
  );

  // ── Pied de page (pagination) sur toutes les pages ──
  const n = pages.length;
  pages.forEach((p, i) => {
    const pg = `${i + 1} / ${n}`;
    p.drawText(pg, {
      x: PW - M - sans.widthOfTextAtSize(pg, 8),
      y: 30,
      size: 8,
      font: sans,
      color: G500,
    });
    const lbl = cdi ? "Contrat à durée indéterminée" : "Contrat à durée déterminée";
    p.drawText(lbl, { x: M, y: 30, size: 8, font: sans, color: G500 });
  });

  return pdf.save();
}

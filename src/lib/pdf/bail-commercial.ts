import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";
import { eur, wrap } from "./helpers";

export type MaterielItem = {
  designation: string;
  etat: string; // ex. "bon état", "neuf"
};

export type BailCommercialData = {
  /** commercial = bail 3-6-9 statutaire ; precaire = bail dérogatoire L. 145-5. */
  typeBail: "commercial" | "precaire";
  // Bailleur
  bailleurNom: string;
  bailleurAdresse: string;
  bailleurQualite: string; // particulier / SCI…
  bailleurSiret: string;
  // Preneur
  preneurNom: string;
  preneurAdresse: string;
  preneurRcs: string;
  // Local
  adresseLocal: string;
  descriptionLocal: string;
  surface: string;
  destination: string; // activité autorisée
  // Matériel mis à disposition (local équipé)
  materiel: MaterielItem[];
  // Conditions financières
  loyerAnnuel: number;
  depotGarantie: number;
  pasDePorte: number;
  pasDePorteNature: "supplement" | "indemnite";
  charges: string;
  indiceRevision: string; // ILC, ILAT…
  // Durée
  dateDebut: string;
  duree: string; // ex. "9 ans" ou "24 mois"
  ville: string;
  date: string;
};

// Palette premium (identique au contrat de travail).
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

export async function buildBailCommercialPDF(
  d: BailCommercialData
): Promise<Uint8Array> {
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
  // Tronque un libellé (gras) trop large avec « … ».
  const clipB = (s: string, size: number, maxW: number): string => {
    if (sansB.widthOfTextAtSize(s, size) <= maxW) return s;
    let out = s;
    while (out.length > 1 && sansB.widthOfTextAtSize(out + "…", size) > maxW)
      out = out.slice(0, -1);
    return out.trimEnd() + "…";
  };

  const precaire = d.typeBail === "precaire";
  const mensuel = (d.loyerAnnuel || 0) / 12;
  const materiel = d.materiel.filter((m) => m.designation.trim());

  // ════════════════ PAGE 1 ════════════════
  newPage();
  y = PH;

  // ── Bandeau titre ──
  const bandH = 100;
  rect(0, PH - bandH, PW, bandH, NAVY);
  rect(0, PH - bandH, PW, 3, GOLD);
  const cx = PW / 2;
  trackedC(precaire ? "BAIL DÉROGATOIRE" : "BAIL COMMERCIAL", cx, PH - 44, 20, sansB, WHITE, 3.5);
  trackedC(
    precaire ? "DIT « PRÉCAIRE » — ARTICLE L. 145-5" : "LOCAUX À USAGE COMMERCIAL",
    cx,
    PH - 66,
    10.5,
    sansB,
    WHITE,
    2.5
  );
  trackedC(precaire ? "3 ANS MAXIMUM" : "3 · 6 · 9", cx, PH - 85, 10, sansB, GOLD, 3);
  y = PH - bandH - 22;

  // ── Parties côte à côte (Bailleur navy / Preneur or) ──
  const gap = 14;
  const colW = (W - gap) / 2;
  const ipad = 12;
  const innerW = colW - ipad * 2;

  const bailItems: Array<[string, string]> = [
    ["Adresse :", d.bailleurAdresse || "—"],
    ...(d.bailleurSiret ? ([["SIRET :", d.bailleurSiret]] as Array<[string, string]>) : []),
    ["Qualité :", d.bailleurQualite || "Propriétaire"],
  ];
  const prenItems: Array<[string, string]> = [
    ["Adresse :", d.preneurAdresse || "—"],
    ...(d.preneurRcs ? ([["RCS / SIRET :", d.preneurRcs]] as Array<[string, string]>) : []),
    ["Activité :", d.destination || "—"],
  ];

  const partyHeight = (items: Array<[string, string]>) => {
    let lines = 0;
    for (const [lbl, val] of items) {
      const avail = innerW - sansB.widthOfTextAtSize(`${lbl} `, 9);
      lines += Math.max(1, wrap(val, sans, 9, Math.max(50, avail)).length);
    }
    return 3 + 20 + 12 + 16 + lines * 13 + 10;
  };
  const partyH = Math.max(partyHeight(bailItems), partyHeight(prenItems));

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
  drawParty(M, NAVY, NAVY, WHITE, "LE BAILLEUR", d.bailleurNom || "Le bailleur", bailItems);
  drawParty(M + colW + gap, GOLD, GOLD, NAVY, "LE PRENEUR", d.preneurNom || "Le preneur", prenItems);
  y -= partyH + 18;

  // ── L'essentiel du bail ──
  const recap: Array<[string, string]> = [
    ["LOCAL", d.adresseLocal || "—"],
    ["SURFACE", d.surface ? `${d.surface} m²` : "—"],
    ["DURÉE", d.duree || (precaire ? "— (≤ 3 ans)" : "9 ans")],
    ["LOYER ANNUEL HT", `${eur(d.loyerAnnuel || 0)} €`],
    ["LOYER MENSUEL", `${eur(mensuel)} €`],
    d.pasDePorte > 0
      ? ["PAS-DE-PORTE", `${eur(d.pasDePorte)} €`]
      : ["DÉPÔT DE GARANTIE", d.depotGarantie > 0 ? `${eur(d.depotGarantie)} €` : "Aucun"],
  ];
  const eCols = 3;
  const eRows = Math.ceil(recap.length / eCols);
  const eColW = W / eCols;
  const eInner = eColW - 24;
  const eRowH = 36;
  const eHead = 22;
  const essH = eHead + 12 + eRows * eRowH;
  if (y - essH < BOTTOM) newPage();
  rect(M, y - essH, W, essH, G100, G300, 1);
  rect(M, y - eHead, W, eHead, NAVY);
  rect(M, y - eHead, W, 2, GOLD);
  tracked("L'ESSENTIEL DU BAIL", M + ipad, y - 15, 9, sansB, WHITE, 1.5);
  for (let c = 1; c < eCols; c++)
    rect(M + c * eColW, y - essH + 10, 1, essH - eHead - 20, G300);
  const clipLine = (s: string, size: number, maxW: number): string => {
    if (sansB.widthOfTextAtSize(s, size) <= maxW) return s;
    let out = s;
    while (out.length > 1 && sansB.widthOfTextAtSize(out + "…", size) > maxW)
      out = out.slice(0, -1);
    return out.trimEnd() + "…";
  };
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
    for (const vl of lines.map((l) => clipLine(l, 10, eInner))) {
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
  // Le corps d'un article peut contenir des retours à la ligne « \n » (chaque
  // segment est enroulé séparément) — utilisé pour l'inventaire du matériel.
  const arts: Array<[string, string]> = [];

  arts.push([
    "Désignation des locaux",
    `Le Bailleur donne à bail au Preneur, qui accepte, les locaux à usage commercial situés : ${d.adresseLocal || "—"}.` +
      `${d.descriptionLocal ? ` Ces locaux comprennent : ${d.descriptionLocal}.` : ""}` +
      `${d.surface ? ` Surface approximative : ${d.surface} m².` : ""}` +
      ` Le Preneur déclare parfaitement connaître les lieux pour les avoir visités.`,
  ]);

  if (materiel.length) {
    arts.push([
      "Matériel et équipements mis à disposition",
      `Le local est loué équipé. Le Bailleur met à la disposition du Preneur le matériel suivant, dont un ` +
        `inventaire contradictoire est dressé à l'entrée dans les lieux :\n` +
        materiel
          .map((m) => `•  ${m.designation}${m.etat ? ` — ${m.etat}` : ""}`)
          .join("\n") +
        `\nLe Preneur s'engage à entretenir ce matériel en bon état de fonctionnement et à le restituer en fin de ` +
        `bail, l'usure normale exceptée. Toute détérioration ou disparition sera à sa charge.`,
    ]);
  }

  arts.push([
    "Destination des lieux",
    `Les locaux sont destinés à l'exercice de l'activité suivante : ${d.destination || "—"}. ` +
      `Le Preneur ne pourra exercer aucune autre activité sans l'accord écrit du Bailleur` +
      (precaire ? `.` : `, sous réserve du droit de déspécialisation prévu par la loi.`),
  ]);

  arts.push([
    "Durée",
    precaire
      ? `Le présent bail est conclu pour une durée de ${d.duree || "—"} à compter du ${d.dateDebut || "—"}, ` +
        `en application de l'article L. 145-5 du Code de commerce. Les parties conviennent expressément de ` +
        `déroger au statut des baux commerciaux : le Preneur ne bénéficie ni du droit au renouvellement, ` +
        `ni de l'indemnité d'éviction. La durée totale du bail, renouvellements compris, ne peut excéder ` +
        `trois ans. Si, à l'expiration de cette durée, le Preneur est laissé en possession des lieux plus ` +
        `d'un mois, il s'opère un nouveau bail soumis au statut des baux commerciaux.`
      : `Le présent bail est consenti pour une durée de ${d.duree || "9 ans"} entiers et consécutifs à compter ` +
        `du ${d.dateDebut || "—"}. Le Preneur aura la faculté de donner congé à l'expiration de chaque période ` +
        `triennale, dans les conditions de l'article L. 145-4 du Code de commerce, par acte extrajudiciaire ou ` +
        `lettre recommandée avec accusé de réception, moyennant un préavis de six mois.`,
  ]);

  arts.push([
    "Loyer",
    `Le présent bail est consenti moyennant un loyer annuel de ${eur(d.loyerAnnuel || 0)} euros hors taxes et hors ` +
      `charges, soit ${eur(mensuel)} euros par mois, payable par termes mensuels d'avance au domicile du Bailleur ` +
      `ou par virement. Le loyer du premier mois est versé à la prise d'effet du bail.`,
  ]);

  if (d.pasDePorte > 0) {
    arts.push([
      "Pas-de-porte",
      `Le Preneur verse au Bailleur, à la signature des présentes, un pas-de-porte (droit d'entrée) d'un montant ` +
        `de ${eur(d.pasDePorte)} euros. Les parties conviennent expressément que cette somme constitue ` +
        (d.pasDePorteNature === "indemnite"
          ? `une indemnité forfaitaire et définitive, contrepartie d'éléments de nature diverse, notamment ` +
            `d'avantages commerciaux fournis par le Bailleur, acquise à celui-ci et non restituable en fin de bail.`
          : `un supplément de loyer payé d'avance, s'ajoutant au loyer stipulé ci-dessus.`),
    ]);
  }

  arts.push([
    "Révision du loyer",
    precaire
      ? `Compte tenu de la courte durée du bail, le loyer n'est pas soumis à révision légale. Les parties ` +
        `peuvent toutefois convenir d'une indexation sur l'indice ${d.indiceRevision || "ILC (indice des loyers commerciaux)"} publié par l'INSEE.`
      : `Le loyer sera révisé annuellement, à la date anniversaire du bail, en fonction de la variation de ` +
        `l'indice ${d.indiceRevision || "ILC (indice des loyers commerciaux)"} publié par l'INSEE, l'indice de ` +
        `référence étant le dernier indice connu à la date de prise d'effet du bail.`,
  ]);

  arts.push([
    "Charges, impôts et taxes",
    `${d.charges ? `${d.charges} ` : ""}` +
      `Conformément aux articles L. 145-40-2 et R. 145-35 du Code de commerce, un inventaire précis et limitatif ` +
      `des catégories de charges, impôts, taxes et redevances liés au bail est annexé au présent contrat, avec ` +
      `leur répartition entre le Bailleur et le Preneur. La taxe foncière, si elle est refacturée au Preneur, ` +
      `doit y figurer expressément.`,
  ]);

  arts.push([
    "Dépôt de garantie",
    d.depotGarantie > 0
      ? `À titre de garantie de la bonne exécution du bail, le Preneur verse ce jour au Bailleur un dépôt de ` +
        `garantie de ${eur(d.depotGarantie)} euros, non productif d'intérêts, qui lui sera restitué en fin de ` +
        `bail, déduction faite des sommes éventuellement dues.`
      : `Le présent bail n'est assorti d'aucun dépôt de garantie.`,
  ]);

  arts.push([
    "État des lieux",
    `Un état des lieux contradictoire sera établi lors de la remise des clés et lors de la restitution des ` +
      `locaux, conformément à l'article L. 145-40-1 du Code de commerce, et annexé au présent bail` +
      (materiel.length ? `, de même que l'inventaire du matériel mis à disposition.` : `.`),
  ]);

  arts.push([
    "Entretien et réparations",
    `Le Preneur entretiendra les locaux en bon état et effectuera les réparations locatives. Les grosses ` +
      `réparations au sens de l'article 606 du Code civil restent à la charge du Bailleur. Le Preneur ne pourra ` +
      `effectuer aucuns travaux modifiant la structure des lieux sans l'accord écrit du Bailleur.`,
  ]);

  arts.push([
    "Assurances",
    `Le Preneur s'engage à assurer les locaux${materiel.length ? ", le matériel mis à disposition" : ""} et son ` +
      `activité (responsabilité civile professionnelle, incendie, dégâts des eaux, explosion) auprès d'une ` +
      `compagnie notoirement solvable, et à justifier de cette assurance au Bailleur à première demande, ` +
      `chaque année.`,
  ]);

  arts.push([
    "Cession et sous-location",
    precaire
      ? `Le présent bail étant conclu en considération de la personne du Preneur, toute cession du bail ou ` +
        `sous-location, totale ou partielle, est interdite sauf accord écrit et préalable du Bailleur.`
      : `Le Preneur ne pourra céder son droit au bail qu'à l'acquéreur de son fonds de commerce. Toute ` +
        `sous-location totale ou partielle est interdite, sauf accord écrit et préalable du Bailleur.`,
  ]);

  arts.push([
    "Clause résolutoire",
    `À défaut de paiement d'un seul terme de loyer, de charges${d.pasDePorte > 0 ? ", du pas-de-porte" : ""} ou ` +
      `d'inexécution d'une seule des conditions du bail, et un mois après un commandement de payer ou une mise ` +
      `en demeure demeurés infructueux, le présent bail sera résilié de plein droit si bon semble au Bailleur, ` +
      `sans préjudice de tous dommages et intérêts.`,
  ]);

  arts.push([
    "Diagnostics et annexes",
    `Sont annexés au présent bail : le diagnostic de performance énergétique (DPE), l'état des risques et ` +
      `pollutions (ERP)${materiel.length ? ", l'inventaire du matériel" : ""}, l'inventaire des charges et, le cas ` +
      `échéant, le dossier technique amiante. Le Preneur reconnaît en avoir pris connaissance.`,
  ]);

  arts.push([
    "Élection de domicile — Litiges",
    `Pour l'exécution des présentes, les parties font élection de domicile en leurs adresses respectives ` +
      `indiquées en tête du présent acte. Tout litige relatif au présent bail relèvera de la compétence du ` +
      `tribunal dans le ressort duquel est situé l'immeuble.`,
  ]);

  // Rendu des cartes d'articles (corps multi-segments via « \n »).
  arts.forEach(([title, body], idx) => {
    const segments = body.split("\n");
    const lines: string[] = [];
    for (const seg of segments) lines.push(...wrap(seg, sans, 9.5, W - 24));
    const headH = 24;
    const cardH = headH + 10 + lines.length * 13.5 + 8;
    if (y - cardH < BOTTOM) newPage();
    rect(M, y - cardH, W, cardH, undefined, G200, 1);
    rect(M, y - headH, W, headH, G100);
    hline(M, M + W, y - headH, G200, 1);
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
  sigBox(M, "LE BAILLEUR", d.bailleurNom, d.bailleurQualite || "Propriétaire");
  sigBox(M + sigW + gap, "LE PRENEUR", d.preneurNom, "Preneur");
  y -= sigBlocH + 18;

  // ── Mention légale ──
  if (y - 30 < BOTTOM) newPage();
  hline(M, M + W, y, G300, 1);
  tc(
    precaire
      ? "Bail dérogatoire conclu en application de l'article L. 145-5 du Code de commerce."
      : "Bail soumis aux articles L. 145-1 et suivants du Code de commerce (statut des baux commerciaux).",
    cx,
    y - 13,
    8,
    sans,
    G500
  );
  tc("Conservez ce bail et ses annexes pendant toute sa durée et au-delà.", cx, y - 24, 8, sans, G500);

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
    const lbl = precaire ? "Bail dérogatoire (précaire)" : "Bail commercial (3-6-9)";
    p.drawText(lbl, { x: M, y: 30, size: 8, font: sans, color: G500 });
  });

  return pdf.save();
}

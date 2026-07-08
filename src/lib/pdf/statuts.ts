import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";
import { eur, wrap } from "./helpers";

export type Associe = {
  nom: string;
  adresse: string;
  apport: number;
};

export type StatutsData = {
  forme: "SARL" | "SAS" | "EURL" | "SASU";
  denomination: string;
  objet: string;
  siege: string;
  duree: string; // ex. "99 ans"
  capital: number;
  valeurTitre: number; // valeur nominale d'une part / action
  associes: Associe[];
  dirigeantNom: string;
  dirigeantAdresse: string;
  exerciceDebut: string; // ex. "1er janvier"
  exerciceFin: string; // ex. "31 décembre"
  depotBanque: string; // établissement dépositaire des fonds (optionnel)
  ville: string;
  date: string;
};

// Palette premium (identique au contrat et au bail).
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

export async function buildStatutsPDF(d: StatutsData): Promise<Uint8Array> {
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
  // texte aligné à droite (tableau des associés)
  const rt = (s: string, right: number, yy: number, size = 10, f = sans, c = TEXT) =>
    page.drawText(s, { x: right - f.widthOfTextAtSize(s, size), y: yy, size, font: f, color: c });
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

  // ── terminologie ──
  const unipersonnelle = d.forme === "EURL" || d.forme === "SASU";
  const parts = d.forme === "SARL" || d.forme === "EURL";
  const titre = parts ? "parts sociales" : "actions";
  const titreSing = parts ? "part sociale" : "action";
  const dirigeantTitre = parts ? "gérant" : "président";
  const formeLongue: Record<StatutsData["forme"], string> = {
    SARL: "Société à Responsabilité Limitée",
    EURL: "Entreprise Unipersonnelle à Responsabilité Limitée",
    SAS: "Société par Actions Simplifiée",
    SASU: "Société par Actions Simplifiée Unipersonnelle",
  };

  const associes = d.associes.filter((a) => a.nom.trim());
  const totalApports = associes.reduce((s, a) => s + (a.apport || 0), 0);
  const capital = d.capital && d.capital > 0 ? d.capital : totalApports;
  const nbTitres = d.valeurTitre > 0 ? Math.round(capital / d.valeurTitre) : 0;
  const partsDe = (apport: number) =>
    d.valeurTitre > 0 ? Math.round(apport / d.valeurTitre) : 0;

  // ════════════════ PAGE 1 ════════════════
  newPage();
  y = PH;

  // ── Bandeau titre ──
  const bandH = 100;
  rect(0, PH - bandH, PW, bandH, NAVY);
  rect(0, PH - bandH, PW, 3, GOLD);
  const cx = PW / 2;
  // Adapte taille et interlettrage pour qu'un libellé long tienne dans le
  // bandeau, puis tronque avec « … » en dernier recours.
  const fitTracked = (s: string, yy: number, size: number, tr: number, maxW: number, color = WHITE) => {
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
    trackedC(out, cx, yy, sz, sansB, color, sp);
  };
  trackedC("STATUTS", cx, PH - 42, 22, sansB, WHITE, 4.5);
  fitTracked((d.denomination || "—").toUpperCase(), PH - 65, 11, 2, W - 20);
  fitTracked(formeLongue[d.forme].toUpperCase(), PH - 84, 8.5, 1.6, W - 20, GOLD);
  y = PH - bandH - 22;

  // ── L'essentiel de la société ──
  const recap: Array<[string, string]> = [
    ["FORME", `${formeLongue[d.forme]} (${d.forme})`],
    ["CAPITAL SOCIAL", `${eur(capital)} €`],
    ["SIÈGE SOCIAL", d.siege || "—"],
    [parts ? "PARTS SOCIALES" : "ACTIONS", nbTitres ? `${nbTitres} × ${eur(d.valeurTitre)} €` : "—"],
    ["DURÉE", d.duree || "99 ans"],
    [parts ? "GÉRANT" : "PRÉSIDENT", d.dirigeantNom || "—"],
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
  tracked("LA SOCIÉTÉ EN UN COUP D'ŒIL", M + 12, y - 15, 9, sansB, WHITE, 1.5);
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

  // ── Tableau des associés (apports & répartition) ──
  if (associes.length) {
    const rowH = 20;
    const headH = 22;
    const tabH = headH + rowH * (associes.length + 1) + 8;
    if (y - tabH < BOTTOM) newPage();
    rect(M, y - tabH, W, tabH, undefined, G300, 1);
    rect(M, y - headH, W, headH, NAVY);
    rect(M, y - headH, W, 2, GOLD);
    tracked(unipersonnelle ? "L'ASSOCIÉ UNIQUE" : "LES ASSOCIÉS", M + 12, y - 15, 9, sansB, WHITE, 1.5);
    const cNom = M + 12;
    const cApp = M + W - 190;
    const cParts = M + W - 12;
    let ty = y - headH - 14;
    t("Associé", cNom, ty, 8.5, sansB, G500);
    rt("Apport en numéraire", cApp, ty, 8.5, sansB, G500);
    rt(parts ? "Parts" : "Actions", cParts, ty, 8.5, sansB, G500);
    ty -= rowH * 0.85;
    associes.forEach((a, idx) => {
      if (idx % 2 === 0) rect(M + 1, ty - 6, W - 2, rowH, G100);
      const nomLbl = a.adresse ? `${a.nom} — ${a.adresse}` : a.nom;
      t(clipLine(nomLbl, 9.5, cApp - cNom - 100), cNom, ty, 9.5, sans, TEXT);
      rt(`${eur(a.apport || 0)} €`, cApp, ty, 9.5, sans, G700);
      rt(String(partsDe(a.apport || 0)), cParts, ty, 9.5, sansB, TEXT);
      ty -= rowH;
    });
    hline(M + 1, M + W - 1, ty + rowH - 8, G300, 1);
    t("TOTAL", cNom, ty, 9.5, sansB, TEXT);
    rt(`${eur(totalApports)} €`, cApp, ty, 9.5, sansB, TEXT);
    rt(String(nbTitres), cParts, ty, 9.5, sansB, TEXT);
    y -= tabH + 18;
  }

  // ── « Il a été convenu… » ──
  hline(M, M + W, y, G300, 1);
  tc(
    unipersonnelle
      ? "L'associé unique soussigné a établi ainsi qu'il suit les statuts de la société :"
      : "Les soussignés ont établi ainsi qu'il suit les statuts de la société :",
    cx,
    y - 16,
    12.5,
    serifI,
    NAVY
  );
  hline(M, M + W, y - 26, G300, 1);
  y -= 40;

  // ════════════════ Articles ════════════════
  const arts: Array<[string, string]> = [];

  arts.push([
    "Forme",
    `Il est formé ${unipersonnelle ? "par l'associé unique" : `entre les propriétaires des ${titre} ci-après créées et de celles qui pourraient l'être ultérieurement`} ` +
      `une ${formeLongue[d.forme].toLowerCase()} régie par les dispositions légales en vigueur et par les présents statuts.`,
  ]);

  arts.push([
    "Dénomination sociale",
    `La dénomination de la société est : « ${d.denomination || "—"} ». Tous les actes et documents émanant de la ` +
      `société doivent indiquer la dénomination, précédée ou suivie des mots « ${d.forme} » et de l'énonciation du capital social.`,
  ]);

  arts.push([
    "Objet social",
    `La société a pour objet, en France et à l'étranger : ${d.objet || "—"}.\n` +
      `Et plus généralement, toutes opérations industrielles, commerciales, financières, mobilières ou immobilières ` +
      `se rattachant directement ou indirectement à cet objet ou susceptibles d'en faciliter la réalisation.`,
  ]);

  arts.push([
    "Siège social",
    `Le siège social est fixé à : ${d.siege || "—"}. Il pourra être transféré dans les conditions prévues par la loi.`,
  ]);

  arts.push([
    "Durée",
    `La durée de la société est fixée à ${d.duree || "99 ans"} à compter de son immatriculation au Registre du ` +
      `commerce et des sociétés, sauf dissolution anticipée ou prorogation.`,
  ]);

  arts.push([
    "Apports",
    (associes.length
      ? associes
          .map((a) => `${a.nom} apporte à la société la somme de ${eur(a.apport || 0)} euros en numéraire.`)
          .join("\n") + "\n"
      : "") +
      `Le total des apports en numéraire s'élève à ${eur(capital)} euros, correspondant au capital social. ` +
      `Les fonds ont été intégralement déposés${d.depotBanque ? ` auprès de ${d.depotBanque}` : " sur un compte ouvert au nom de la société en formation"}, ` +
      `ainsi qu'en atteste le certificat du dépositaire.`,
  ]);

  arts.push([
    "Capital social",
    `Le capital social est fixé à la somme de ${eur(capital)} euros. Il est divisé en ${nbTitres || "—"} ${titre} ` +
      `de ${eur(d.valeurTitre || 0)} euros de valeur nominale chacune, ` +
      `${unipersonnelle ? "intégralement attribuées à l'associé unique" : "intégralement souscrites et réparties entre les associés proportionnellement à leurs apports, conformément au tableau figurant en tête des présents statuts"}, ` +
      `numérotées de 1 à ${nbTitres || "—"}, et entièrement libérées.`,
  ]);

  arts.push([
    parts ? "Parts sociales" : "Actions",
    `Chaque ${titreSing} donne droit, dans la propriété de l'actif social et dans le partage des bénéfices, à une ` +
      `fraction proportionnelle au nombre de ${titre} existantes. Les ${titre} sont indivisibles à l'égard de la société.` +
      (parts ? "" : ` Les actions revêtent obligatoirement la forme nominative et sont inscrites en compte au nom de leur titulaire.`),
  ]);

  arts.push([
    `Cession des ${titre}`,
    unipersonnelle
      ? `Tant que la société ne comprend qu'un associé unique, celui-ci est libre de céder ses ${titre} à toute personne. ` +
        `En cas de pluralité d'associés, les cessions seront soumises aux règles légales applicables.`
      : parts
        ? `Les parts sociales ne peuvent être cédées à des tiers étrangers à la société qu'avec le consentement de la ` +
          `majorité des associés représentant au moins la moitié des parts sociales, conformément à l'article L. 223-14 ` +
          `du Code de commerce. Les cessions entre associés sont libres. Toute cession est constatée par acte écrit.`
        : `La cession des actions s'opère librement, sauf clause d'agrément ou de préemption qui pourrait être prévue ` +
          `par décision collective des associés. Toute cession est constatée par un ordre de mouvement inscrit sur le ` +
          `registre des mouvements de titres de la société.`,
  ]);

  arts.push([
    parts ? "Gérance" : "Présidence",
    `La société est ${parts ? "gérée" : "dirigée et représentée"} par ${d.dirigeantNom || "—"}` +
      `${d.dirigeantAdresse ? `, demeurant ${d.dirigeantAdresse}` : ""}, nommé(e) ${dirigeantTitre} pour une durée ` +
      `illimitée à compter de l'immatriculation. Le ${dirigeantTitre} est investi des pouvoirs les plus étendus pour ` +
      `agir en toute circonstance au nom de la société, dans la limite de l'objet social et des pouvoirs expressément ` +
      `réservés par la loi aux décisions ${unipersonnelle ? "de l'associé unique" : "collectives des associés"}.`,
  ]);

  arts.push([
    "Décisions collectives",
    unipersonnelle
      ? `L'associé unique exerce les pouvoirs dévolus par la loi à la collectivité des associés. Il ne peut déléguer ` +
        `ses pouvoirs. Ses décisions sont répertoriées dans un registre coté et paraphé.`
      : `Les décisions collectives sont prises en assemblée ou par consultation écrite, dans les conditions de quorum ` +
        `et de majorité prévues par la loi${parts ? "" : " et les présents statuts"}. Chaque associé dispose d'un nombre ` +
        `de voix égal au nombre de ${titre} qu'il possède. Les décisions sont constatées par des procès-verbaux.`,
  ]);

  arts.push([
    "Exercice social",
    `Chaque exercice social a une durée de douze mois : il commence le ${d.exerciceDebut || "1er janvier"} et se ` +
      `termine le ${d.exerciceFin || "31 décembre"}. Par exception, le premier exercice commencera à la date ` +
      `d'immatriculation de la société et se terminera le ${d.exerciceFin || "31 décembre"} de l'année ${d.exerciceDebut && d.exerciceDebut !== "1er janvier" ? "suivante" : "en cours ou suivante"}.`,
  ]);

  arts.push([
    "Comptes annuels — Affectation du résultat",
    `Il est tenu une comptabilité régulière des opérations sociales. Le ${dirigeantTitre} établit les comptes annuels ` +
      `et, s'il y a lieu, le rapport de gestion. Après dotation à la réserve légale (5 % du bénéfice, jusqu'à ce ` +
      `qu'elle atteigne 10 % du capital), le bénéfice distribuable est réparti entre les associés proportionnellement ` +
      `au nombre de ${titre} détenues, ou affecté en report à nouveau ou en réserves.`,
  ]);

  arts.push([
    "Dissolution — Liquidation",
    `La société est dissoute à l'arrivée du terme, ou par décision ${unipersonnelle ? "de l'associé unique" : "collective des associés"}. ` +
      `La liquidation est effectuée conformément à la loi ; le boni de liquidation est réparti entre les associés ` +
      `proportionnellement à leurs droits.`,
  ]);

  arts.push([
    "Contestations",
    `Toutes contestations relatives aux affaires sociales survenant pendant la durée de la société ou de sa ` +
      `liquidation seront soumises aux tribunaux compétents du siège social.`,
  ]);

  arts.push([
    "Personnalité morale — Actes accomplis pour la société en formation",
    `La société jouira de la personnalité morale à compter de son immatriculation au Registre du commerce et des ` +
      `sociétés. L'état des actes accomplis pour le compte de la société en formation est annexé aux présents ` +
      `statuts ; leur reprise par la société résultera de plein droit de son immatriculation. Tous pouvoirs sont ` +
      `donnés au porteur d'un original des présentes pour accomplir les formalités de publicité et d'immatriculation.`,
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
    tracked(`ARTICLE ${idx + 1} — ${title.toUpperCase()}`, M + 36, y - 15.5, 8.5, sansB, NAVY, 0.4);
    let cyy = y - headH - 13;
    for (const l of lines) {
      t(l, M + 12, cyy, 9.5, sans, TEXT);
      cyy -= 13.5;
    }
    y -= cardH + 11;
  });

  // ════════════════ Signatures ════════════════
  const gap = 14;
  const sigBlocH = 110;
  const signataires = unipersonnelle
    ? [associes[0]?.nom || d.dirigeantNom || "—"]
    : associes.map((a) => a.nom);
  const rows = Math.ceil(Math.max(1, signataires.length) / 2);
  const needed = 18 + 18 + rows * (sigBlocH + 12) + 30;
  if (y - needed < BOTTOM) newPage();
  const stitle = "SIGNATURES";
  tracked(stitle, M, y, 10, sansB, TEXT, 0.6);
  let sw = 0;
  for (const ch of stitle) sw += sansB.widthOfTextAtSize(ch, 10) + 0.6;
  rect(M, y - 6, sw + 3, 2, GOLD);
  y -= 18;
  t(
    `Fait à ${d.ville || "—"}, le ${d.date || "—"}, en autant d'exemplaires originaux que requis par la loi.`,
    M,
    y,
    10,
    serifI,
    G700
  );
  y -= 18;

  const sigW = (W - gap) / 2;
  const sigBox = (x: number, label: string, name: string) => {
    rect(x, y - sigBlocH, sigW, sigBlocH, G100, G300, 1);
    rect(x, y - 20, sigW, 20, NAVY);
    tracked(label, x + 12, y - 14, 8.5, sansB, WHITE, 1.2);
    t(clipLine(name || "—", 10.5, sigW - 24), x + 12, y - 38, 10.5, sansB, TEXT);
    hline(x + 12, x + sigW - 12, y - sigBlocH + 24, NAVY, 0.8);
    t("Lu et approuvé — Bon pour accord", x + 12, y - sigBlocH + 11, 8, serifI, G500);
  };
  signataires.forEach((nom, idx) => {
    const col = idx % 2;
    if (idx > 0 && col === 0) y -= sigBlocH + 12;
    if (y - sigBlocH < BOTTOM) newPage();
    sigBox(M + col * (sigW + gap), unipersonnelle ? "L'ASSOCIÉ UNIQUE" : `ASSOCIÉ ${idx + 1}`, nom);
  });
  y -= sigBlocH + 18;

  // ── Mention légale ──
  if (y - 30 < BOTTOM) newPage();
  hline(M, M + W, y, G300, 1);
  tc(
    `Statuts constitutifs de ${formeLongue[d.forme].toLowerCase()} — à déposer au greffe lors de l'immatriculation.`,
    cx,
    y - 13,
    8,
    sans,
    G500
  );
  tc("Chaque associé conserve un exemplaire original.", cx, y - 24, 8, sans, G500);

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
    p.drawText(clipLine(`Statuts — ${d.denomination || d.forme}`, 8, W - 70), {
      x: M,
      y: 30,
      size: 8,
      font: sans,
      color: G500,
    });
  });

  return pdf.save();
}

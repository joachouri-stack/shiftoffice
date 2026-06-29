import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";
import { INK, GRIS, OR, CREME, eur, wrap } from "./helpers";

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

const A4: [number, number] = [595.28, 841.89];
const PW = A4[0];
const M = 50;
const W = PW - M * 2;
const TOPC = 792; // haut de contenu des pages courantes
const BOTTOM = 78;
const LIGNE = rgb(0.86, 0.83, 0.77);
const ORL = rgb(0.96, 0.92, 0.82);

export async function buildContratPDF(d: ContratData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pages: PDFPage[] = [];
  let page!: PDFPage;
  let y = TOPC;

  const newPage = () => {
    page = pdf.addPage(A4);
    pages.push(page);
    y = TOPC;
  };

  // ── primitives (résolvent toujours sur `page` courant) ──
  const t = (s: string, x: number, yy: number, size = 10.5, f = font, c = INK) =>
    page.drawText(s, { x, y: yy, size, font: f, color: c });
  const rt = (s: string, xR: number, yy: number, size = 10.5, f = font, c = INK) =>
    page.drawText(s, { x: xR - f.widthOfTextAtSize(s, size), y: yy, size, font: f, color: c });
  const tc = (s: string, cx: number, yy: number, size = 10.5, f = font, c = INK) =>
    page.drawText(s, { x: cx - f.widthOfTextAtSize(s, size) / 2, y: yy, size, font: f, color: c });
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
  const hline = (x1: number, x2: number, yy: number, c = LIGNE, th = 0.6) =>
    page.drawLine({ start: { x: x1, y: yy }, end: { x: x2, y: yy }, thickness: th, color: c });
  const vline = (x: number, y1: number, y2: number, c = LIGNE, th = 0.6) =>
    page.drawLine({ start: { x, y: y1 }, end: { x, y: y2 }, thickness: th, color: c });
  // Trait doré en tête d'un encadré (effet carte premium).
  const goldTop = (x: number, topY: number, w: number) => rect(x, topY - 3, w, 3, OR);

  const ensure = (space: number) => {
    if (y - space < BOTTOM) newPage();
  };
  const para = (s: string, size = 10, f = font, color = INK, lead = 4.8) => {
    for (const l of wrap(s, f, size, W)) {
      ensure(16);
      t(l, M, y, size, f, color);
      y -= size + lead;
    }
    y -= 6;
  };

  const cdi = d.typeContrat !== "cdd";

  // ════════════════ PAGE 1 ════════════════
  newPage();
  // Bande dorée pleine largeur en tête
  page.drawRectangle({ x: 0, y: 835.89, width: PW, height: 6, color: OR });

  // ─── Titre (centré) ───
  const CX = PW / 2;
  const ligne2 = cdi ? "À DURÉE INDÉTERMINÉE" : "À DURÉE DÉTERMINÉE";
  y = 782;
  tc("CONTRAT DE TRAVAIL", CX, y, 23, bold, INK);
  y -= 28;
  tc(ligne2, CX, y, 23, bold, INK);
  y -= 16;
  rect(CX - 45, y, 90, 3, OR); // filet doré centré
  y -= 24;
  // Pastille de type, centrée sous le titre
  const typ = cdi ? "CDI" : "CDD";
  const typW = bold.widthOfTextAtSize(typ, 11) + 28;
  rect(CX - typW / 2, y - 6, typW, 23, ORL, OR, 1);
  tc(typ, CX, y + 1, 11, bold, INK);
  y -= 24;
  // Date, centrée sous la pastille
  tc(`Établi à ${d.ville || "—"}, le ${d.date || "—"}`, CX, y, 9, font, GRIS);
  y -= 30;

  // ─── Parties (empilées, niveaux distincts) ───
  const PAD = 16;
  const colW = (W - PAD * 2 - 24) / 2;

  // Un « champ » : intitulé gris en capitales + valeur en gras (max 2 lignes).
  const field = (x: number, w: number, topY: number, label: string, value: string) => {
    t(label, x, topY, 6.8, bold, GRIS);
    let yy = topY - 13;
    for (const l of wrap(value || "—", font, 10, w).slice(0, 2)) {
      t(l, x, yy, 10, bold, INK);
      yy -= 12;
    }
  };

  // En-tête d'encadré, sobre et homogène pour tous les blocs : bandeau crème,
  // fin trait doré en tête, petit repère doré + intitulé, filet de séparation.
  const HB = 28;
  const cardHead = (x: number, top: number, w: number, titre: string) => {
    rect(x, top - HB, w, HB, CREME);
    goldTop(x, top, w);
    rect(x + PAD, top - 18.5, 5, 5, OR);
    t(titre, x + PAD + 13, top - 19, 9, bold, INK);
    hline(x, x + w, top - HB, LIGNE, 0.8);
  };

  const col2 = M + PAD + colW + 24;

  // EMPLOYEUR
  const empBoxH = HB + 18 + 32 + 32;
  rect(M, y - empBoxH, W, empBoxH, undefined, LIGNE, 1);
  cardHead(M, y, W, "EMPLOYEUR");
  let fy = y - HB - 18;
  field(M + PAD, colW, fy, "DÉNOMINATION", d.entrepriseNom || "L'entreprise");
  field(col2, colW, fy, "SIRET", d.siret || "—");
  fy -= 32;
  field(M + PAD, colW, fy, "SIÈGE SOCIAL", d.entrepriseAdresse || "—");
  field(
    col2,
    colW,
    fy,
    "REPRÉSENTÉE PAR",
    `${d.representantNom || "—"}${d.representantQualite ? `, ${d.representantQualite}` : ""}`
  );
  y -= empBoxH;

  // Connecteur « ET »
  y -= 8;
  hline(M + W / 2 - 64, M + W / 2 - 18, y - 3, LIGNE);
  hline(M + W / 2 + 18, M + W / 2 + 64, y - 3, LIGNE);
  tc("ET", M + W / 2, y - 6, 8.5, bold, INK);
  y -= 22;

  // SALARIÉ
  const salBoxH = HB + 18 + 32 + 32 + 32;
  rect(M, y - salBoxH, W, salBoxH, undefined, LIGNE, 1);
  cardHead(M, y, W, "SALARIÉ");
  fy = y - HB - 18;
  field(M + PAD, colW, fy, "NOM ET PRÉNOM", d.salarieNom || "Le/la salarié(e)");
  field(col2, colW, fy, "NATIONALITÉ", d.salarieNationalite || "—");
  fy -= 32;
  field(M + PAD, colW, fy, "NÉ(E) LE", d.salarieDateNaissance || "—");
  field(col2, colW, fy, "À", d.salarieLieuNaissance || "—");
  fy -= 32;
  field(M + PAD, colW, fy, "ADRESSE", d.salarieAdresse || "—");
  y -= salBoxH;

  // ─── Encadré « L'essentiel du contrat » ───
  y -= 22;
  const recap: Array<[string, string]> = [
    ["POSTE OCCUPÉ", d.poste || "—"],
    ["TYPE DE CONTRAT", cdi ? "CDI" : "CDD"],
    ["PÉRIODE D'ESSAI", d.periodeEssai && d.periodeEssai !== "Aucune" ? d.periodeEssai : "Aucune"],
    ["DATE DE DÉBUT", d.dateDebut || "—"],
    [cdi ? "ÉCHÉANCE" : "DATE DE FIN", cdi ? "Indéterminée" : d.dateFin || "—"],
    ["TEMPS DE TRAVAIL", `${d.heuresSemaine || 35} h / semaine`],
    ["RÉMUNÉRATION BRUTE", `${eur(d.salaireBrut || 0)} € / mois`],
    ["CONVENTION", d.conventionCollective || "—"],
    ["CONGÉS PAYÉS", "2,5 j / mois"],
  ];
  const rcCols = 3;
  const rcRows = Math.ceil(recap.length / rcCols);
  const rcRowH = 34;
  const rcH = HB + 14 + rcRows * rcRowH;
  rect(M, y - rcH, W, rcH, undefined, LIGNE, 1);
  cardHead(M, y, W, "L'ESSENTIEL DU CONTRAT");
  const rcColW = (W - PAD * 2) / rcCols;
  // séparateurs verticaux fins entre les colonnes
  for (let c = 1; c < rcCols; c++)
    vline(M + PAD + c * rcColW - 12, y - HB - 12, y - rcH + 12, LIGNE);
  recap.forEach((cell, i) => {
    const r = Math.floor(i / rcCols);
    const c = i % rcCols;
    const cx = M + PAD + c * rcColW;
    const cy = y - HB - 20 - r * rcRowH;
    t(cell[0], cx, cy, 6.5, bold, GRIS);
    for (const l of wrap(cell[1], bold, 10.5, rcColW - 18).slice(0, 1))
      t(l, cx, cy - 14, 10.5, bold, INK);
  });
  y -= rcH + 22;

  // ─── Préambule ───
  para(
    "Les parties désignées ci-dessus, après s'être présentées et avoir échangé sur les conditions de la collaboration " +
      "envisagée, ont arrêté d'un commun accord les dispositions qui suivent, lesquelles forment l'intégralité de leur " +
      "engagement.",
    10,
    font,
    GRIS
  );
  para("Il a été convenu et arrêté ce qui suit :", 10.5, bold);

  // ════════════════ Articles ════════════════
  let art = 0;
  const artHeading = (titreArt: string) => {
    ensure(46);
    y -= 12;
    t(`ARTICLE ${++art}`, M, y, 7.5, bold, OR);
    rt(titreArt.toUpperCase(), M + W, y, 7, bold, GRIS);
    y -= 15;
    t(titreArt, M, y, 12.5, bold, INK);
    y -= 6;
    hline(M, M + W, y, OR, 1);
    y -= 15;
  };

  artHeading("Engagement et fonctions");
  para(
    `Le Salarié est engagé en qualité de ${d.poste || "—"}. Il exercera ses fonctions sous l'autorité et selon les ` +
      `directives de l'Employeur, à qui il rendra compte de son activité. Il s'engage à consacrer tout le soin nécessaire ` +
      `à l'accomplissement de ses missions et à se conformer au règlement intérieur de l'entreprise.`
  );

  artHeading("Durée du contrat");
  if (cdi) {
    para(
      `Le présent contrat est conclu pour une durée indéterminée à compter du ${d.dateDebut || "—"}. Il ne deviendra ` +
        `définitif qu'à l'issue de la période d'essai éventuellement prévue à l'article suivant.`
    );
  } else {
    para(
      `Le présent contrat est conclu pour une durée déterminée, du ${d.dateDebut || "—"} au ${d.dateFin || "—"}, pour le ` +
        `motif suivant : ${d.motifCdd || "accroissement temporaire d'activité"}. Il prendra fin de plein droit à son terme, ` +
        `sans formalité particulière.`
    );
  }

  artHeading("Période d'essai");
  para(
    d.periodeEssai && d.periodeEssai !== "Aucune"
      ? `Le contrat est assorti d'une période d'essai de ${d.periodeEssai}, durant laquelle chacune des parties pourra y ` +
          `mettre fin librement, sans indemnité, sous réserve du respect du délai de prévenance légal.`
      : `Le contrat ne comporte pas de période d'essai.`
  );

  artHeading("Lieu de travail");
  para(
    `Le Salarié exercera principalement ses fonctions à : ${d.lieuTravail || d.entrepriseAdresse || "—"}. Cette mention ` +
      `n'a pas valeur contractuelle ; le lieu de travail pourra être modifié au sein du même secteur géographique en ` +
      `fonction des nécessités de l'entreprise.`
  );

  artHeading("Durée et organisation du travail");
  para(
    `La durée hebdomadaire de travail est fixée à ${d.heuresSemaine || 35} heures, réparties selon les horaires en ` +
      `vigueur dans l'entreprise. Le Salarié pourra être amené à effectuer des heures supplémentaires à la demande de ` +
      `l'Employeur, rémunérées ou récupérées dans les conditions légales et conventionnelles.`
  );

  artHeading("Rémunération");
  para(
    `En contrepartie de son travail, le Salarié percevra une rémunération brute mensuelle de ${eur(d.salaireBrut || 0)} ` +
      `euros, versée à la fin de chaque mois et correspondant à la durée de travail définie ci-dessus. Cette rémunération ` +
      `donnera lieu à l'établissement d'un bulletin de paie.`
  );

  if (d.conventionCollective) {
    artHeading("Convention collective");
    para(
      `Les relations entre les parties sont régies par la convention collective : ${d.conventionCollective}, dont le ` +
        `Salarié déclare avoir été informé et pouvoir prendre connaissance auprès de l'Employeur.`
    );
  }

  artHeading("Congés payés");
  para(
    `Le Salarié bénéficiera des congés payés conformément aux dispositions légales et conventionnelles en vigueur, soit ` +
      `2,5 jours ouvrables par mois de travail effectif. Les dates de congés seront fixées en accord avec l'Employeur, ` +
      `selon les nécessités du service.`
  );

  artHeading("Protection sociale et prévoyance");
  para(
    `Le Salarié sera affilié aux régimes de retraite complémentaire et de prévoyance dont relève l'entreprise, ainsi ` +
      `qu'au régime de complémentaire santé collective lorsqu'il existe, dans les conditions prévues par les accords ` +
      `applicables.`
  );

  artHeading("Obligations du Salarié");
  para(
    `Le Salarié s'engage à exécuter son travail avec loyauté et diligence, à respecter les consignes de sécurité et à ` +
      `observer une stricte confidentialité sur l'ensemble des informations, documents et données dont il aurait ` +
      `connaissance dans l'exercice de ses fonctions, tant pendant l'exécution du contrat qu'après sa rupture.`
  );

  if (!cdi) {
    artHeading("Indemnité de fin de contrat");
    para(
      `Au terme du contrat, et sauf cas d'exclusion prévus par la loi (notamment refus d'un CDI à conditions équivalentes, ` +
        `rupture anticipée à l'initiative du Salarié ou faute grave), le Salarié percevra une indemnité de fin de contrat ` +
        `égale à 10 % de la rémunération brute totale versée pendant la durée du contrat, ainsi qu'une indemnité ` +
        `compensatrice de congés payés.`
    );
  }

  artHeading("Rupture du contrat");
  para(
    cdi
      ? `Le contrat pourra être rompu par l'une ou l'autre des parties dans le respect des dispositions légales et ` +
          `conventionnelles applicables, notamment en matière de préavis, de motif et de procédure.`
      : `Le contrat ne pourra être rompu avant l'échéance de son terme que dans les cas limitativement prévus par ` +
          `l'article L. 1243-1 du Code du travail (accord des parties, faute grave, force majeure, inaptitude ou embauche ` +
          `en CDI).`
  );

  artHeading("Dispositions générales");
  para(
    `Pour tout ce qui n'est pas expressément prévu au présent contrat, les parties se réfèrent aux dispositions du Code ` +
      `du travail et de la convention collective applicable. Les données personnelles du Salarié sont traitées par ` +
      `l'Employeur pour les seuls besoins de la gestion de la relation de travail, conformément au Règlement général sur ` +
      `la protection des données (RGPD), et conservées pendant la durée légale applicable.`
  );

  // ════════════════ Signatures ════════════════
  ensure(200);
  y -= 8;
  para(
    `Fait à ${d.ville || "—"}, le ${d.date || "—"}, en deux exemplaires originaux, dont un remis à chaque partie.`,
    10
  );
  y -= 12;

  const sigGap = 30;
  const sigW = (W - sigGap) / 2;
  const sigH = 150;
  const sigBox = (x: number, role: string, name: string) => {
    rect(x, y - sigH, sigW, sigH, undefined, LIGNE, 1);
    cardHead(x, y, sigW, role);
    t(name || "—", x + PAD, y - HB - 22, 11, bold, INK);
    t("Précédée de la mention « Lu et approuvé »", x + PAD, y - HB - 37, 7.5, font, GRIS);
    // Large zone de signature, refermée par une ligne en bas du cadre.
    hline(x + PAD, x + sigW - PAD, y - sigH + 26, LIGNE, 0.6);
    t("Signature", x + PAD, y - sigH + 13, 7, font, GRIS);
  };
  sigBox(M, "POUR L'EMPLOYEUR", d.representantNom);
  sigBox(M + sigW + sigGap, "LE SALARIÉ", d.salarieNom);
  y -= sigH;

  // ─── Pied de page sur toutes les pages ───
  const n = pages.length;
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 58 }, end: { x: M + W, y: 58 }, thickness: 0.6, color: LIGNE });
    const lbl = cdi ? "Contrat à durée indéterminée" : "Contrat à durée déterminée";
    p.drawText(lbl, { x: M, y: 45, size: 7.5, font, color: GRIS });
    const pg = `Page ${i + 1} / ${n}`;
    p.drawText(pg, { x: M + W - font.widthOfTextAtSize(pg, 7.5), y: 45, size: 7.5, font, color: GRIS });
  });

  return pdf.save();
}

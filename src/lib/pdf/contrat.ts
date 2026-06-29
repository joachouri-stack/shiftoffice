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
const M = 52;
const W = A4[0] - M * 2;
const TOP = 800;
const BOTTOM = 70;
const LIGNE = rgb(0.86, 0.83, 0.77);
const ORL = rgb(0.96, 0.92, 0.82);

export async function buildContratPDF(d: ContratData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pages: PDFPage[] = [];
  let page!: PDFPage;
  let y = TOP;

  const newPage = () => {
    page = pdf.addPage(A4);
    pages.push(page);
    y = TOP;
  };
  newPage();

  // ── primitives ──
  const t = (
    s: string,
    x: number,
    yy: number,
    size = 10.5,
    f = font,
    c = INK
  ) => page.drawText(s, { x, y: yy, size, font: f, color: c });
  const rt = (
    s: string,
    xR: number,
    yy: number,
    size = 10.5,
    f = font,
    c = INK
  ) => page.drawText(s, { x: xR - f.widthOfTextAtSize(s, size), y: yy, size, font: f, color: c });
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

  const ensure = (space: number) => {
    if (y - space < BOTTOM) newPage();
  };
  const para = (s: string, size = 10, f = font, color = INK) => {
    for (const l of wrap(s, f, size, W)) {
      ensure(16);
      t(l, M, y, size, f, color);
      y -= size + 4.5;
    }
    y -= 6;
  };

  const cdi = d.typeContrat !== "cdd";

  // ─── En-tête : titre + pastille type ───
  t("CONTRAT DE TRAVAIL", M, y, 8, bold, OR);
  const typ = cdi ? "CDI" : "CDD";
  const typW = bold.widthOfTextAtSize(typ, 9) + 18;
  rect(M + W - typW, y - 4, typW, 19, ORL, OR, 0.8);
  rt(typ, M + W - 9, y + 1.5, 9, bold, INK);
  y -= 22;
  const titre = cdi ? "À durée indéterminée" : "À durée déterminée";
  t(titre, M, y, 19, bold, INK);
  rect(M, y - 8, bold.widthOfTextAtSize(titre, 19), 3, OR);
  y -= 20;
  rect(M, y, W, 0.8, LIGNE);
  rt(
    `Établi à ${d.ville || "—"}, le ${d.date || "—"}`,
    M + W,
    y - 12,
    8.5,
    font,
    GRIS
  );
  y -= 28;

  // ─── Boîtes Employeur / Salarié ───
  const gap = 16;
  const bw = (W - gap) / 2;
  const PAD = 11;
  const innerW = bw - PAD * 2;

  type L = { s: string; b: boolean; sz: number };
  const buildLines = (items: Array<{ s: string; b?: boolean }>): L[] => {
    const out: L[] = [];
    for (const it of items) {
      const sz = it.b ? 10 : 8.7;
      const f = it.b ? bold : font;
      for (const l of wrap(it.s, f, sz, innerW)) out.push({ s: l, b: !!it.b, sz });
    }
    return out;
  };

  const empLines = buildLines([
    { s: d.entrepriseNom || "L'entreprise", b: true },
    ...(d.siret ? [{ s: `SIRET ${d.siret}` }] : []),
    { s: `Siège : ${d.entrepriseAdresse || "—"}` },
    {
      s: `Représentée par ${d.representantNom || "—"}, en qualité de ${d.representantQualite || "représentant"}`,
    },
  ]);
  const salLines = buildLines([
    { s: d.salarieNom || "Le/la salarié(e)", b: true },
    { s: `Demeurant : ${d.salarieAdresse || "—"}` },
    { s: `Engagé(e) en qualité de ${d.poste || "—"}` },
  ]);

  const HEADER_H = 17;
  const lineH = 12.5;
  const boxH =
    HEADER_H + 10 + Math.max(empLines.length, salLines.length) * lineH + 6;

  const drawParty = (x: number, titreBox: string, lines: L[]) => {
    rect(x, y - boxH, bw, boxH, undefined, LIGNE, 1);
    rect(x, y - HEADER_H, bw, HEADER_H, CREME);
    rect(x, y - HEADER_H, 3, HEADER_H, OR);
    t(titreBox, x + PAD, y - 12, 7.5, bold, GRIS);
    let yy = y - HEADER_H - 13;
    for (const ln of lines) {
      t(ln.s, x + PAD, yy, ln.sz, ln.b ? bold : font, ln.b ? INK : GRIS);
      yy -= lineH;
    }
  };
  drawParty(M, "EMPLOYEUR", empLines);
  drawParty(M + bw + gap, "SALARIÉ", salLines);
  y -= boxH + 16;

  para(
    "Il a été convenu ce qui suit entre les parties désignées ci-dessus :",
    10,
    bold
  );

  // ─── Articles ───
  let art = 0;
  const artHeading = (titreArt: string) => {
    ensure(40);
    y -= 8;
    t(`ARTICLE ${++art}`, M, y, 7.5, bold, OR);
    y -= 13;
    t(titreArt, M, y, 11.5, bold, INK);
    y -= 5;
    rect(M, y, W, 0.6, LIGNE);
    y -= 13;
  };

  artHeading("Engagement et fonctions");
  para(
    `Le Salarié est engagé en qualité de ${d.poste || "—"}. Il exercera ses fonctions ` +
      `sous l'autorité et selon les directives de l'Employeur, et se conformera au règlement intérieur de l'entreprise.`
  );

  artHeading("Durée du contrat");
  if (cdi) {
    para(
      `Le présent contrat est conclu pour une durée indéterminée à compter du ${d.dateDebut || "—"}.`
    );
  } else {
    para(
      `Le présent contrat est conclu pour une durée déterminée, du ${d.dateDebut || "—"} au ${d.dateFin || "—"}, ` +
        `pour le motif suivant : ${d.motifCdd || "accroissement temporaire d'activité"}.`
    );
  }

  artHeading("Période d'essai");
  para(
    d.periodeEssai && d.periodeEssai !== "Aucune"
      ? `Le contrat est assorti d'une période d'essai de ${d.periodeEssai}, durant laquelle chacune des parties pourra y mettre fin dans les conditions légales.`
      : `Le contrat ne comporte pas de période d'essai.`
  );

  artHeading("Lieu de travail");
  para(
    `Le Salarié exercera ses fonctions à : ${d.lieuTravail || d.entrepriseAdresse || "—"}. ` +
      `Ce lieu pourra être modifié en fonction des nécessités de l'entreprise.`
  );

  artHeading("Durée du travail");
  para(
    `La durée hebdomadaire de travail est fixée à ${d.heuresSemaine || 35} heures, ` +
      `répartie selon les horaires en vigueur dans l'entreprise.`
  );

  artHeading("Rémunération");
  para(
    `En contrepartie de son travail, le Salarié percevra une rémunération brute mensuelle de ${eur(d.salaireBrut || 0)} euros, ` +
      `versée à la fin de chaque mois.`
  );

  if (d.conventionCollective) {
    artHeading("Convention collective");
    para(
      `Les relations entre les parties sont régies par la convention collective : ${d.conventionCollective}.`
    );
  }

  artHeading("Congés payés");
  para(
    `Le Salarié bénéficiera des congés payés conformément aux dispositions légales et conventionnelles en vigueur, ` +
      `soit 2,5 jours ouvrables par mois de travail effectif.`
  );

  artHeading("Obligations du Salarié");
  para(
    `Le Salarié s'engage à exécuter son travail avec loyauté et diligence, à respecter les consignes de sécurité ` +
      `et à observer une stricte confidentialité sur l'ensemble des informations, documents et données dont il aurait ` +
      `connaissance dans l'exercice de ses fonctions, tant pendant l'exécution du contrat qu'après sa rupture.`
  );

  // Clause propre au CDD : indemnité de fin de contrat (précarité).
  if (!cdi) {
    artHeading("Indemnité de fin de contrat");
    para(
      `Au terme du contrat, et sauf cas d'exclusion prévus par la loi (notamment refus d'un CDI, rupture anticipée ` +
        `à l'initiative du Salarié ou faute grave), le Salarié percevra une indemnité de fin de contrat égale à 10 % ` +
        `de la rémunération brute totale versée pendant la durée du contrat, ainsi qu'une indemnité compensatrice de ` +
        `congés payés.`
    );
  }

  artHeading("Rupture du contrat");
  para(
    cdi
      ? `Le contrat pourra être rompu par l'une ou l'autre des parties dans le respect des dispositions légales et ` +
          `conventionnelles applicables, notamment en matière de préavis et de procédure.`
      : `Le contrat prendra fin de plein droit à son terme. Il ne pourra être rompu avant l'échéance que dans les cas ` +
          `limitativement prévus par l'article L. 1243-1 du Code du travail.`
  );

  artHeading("Dispositions générales");
  para(
    `Pour tout ce qui n'est pas expressément prévu au présent contrat, les parties se réfèrent aux dispositions du ` +
      `Code du travail et de la convention collective applicable. Les données personnelles du Salarié sont traitées ` +
      `par l'Employeur pour les seuls besoins de la gestion du contrat, conformément au RGPD.`
  );

  // ─── Signatures ───
  ensure(110);
  y -= 6;
  para(`Fait à ${d.ville || "—"}, le ${d.date || "—"}, en double exemplaire.`, 10);
  y -= 4;

  const sigH = 70;
  const sigBox = (x: number, role: string, name: string) => {
    rect(x, y - sigH, bw, sigH, undefined, LIGNE, 1);
    rect(x, y - HEADER_H, bw, HEADER_H, CREME);
    rect(x, y - HEADER_H, 3, HEADER_H, OR);
    t(role, x + PAD, y - 12, 7.5, bold, GRIS);
    t(name || "—", x + PAD, y - HEADER_H - 14, 10, bold, INK);
    t(
      "Signature, précédée de « Lu et approuvé »",
      x + PAD,
      y - sigH + 9,
      7,
      font,
      GRIS
    );
  };
  sigBox(M, "POUR L'EMPLOYEUR", d.representantNom);
  sigBox(M + bw + gap, "LE SALARIÉ", d.salarieNom);
  y -= sigH;

  // ─── Pied de page (sur toutes les pages) ───
  const n = pages.length;
  pages.forEach((p, i) => {
    p.drawLine({
      start: { x: M, y: 56 },
      end: { x: M + W, y: 56 },
      thickness: 0.6,
      color: LIGNE,
    });
    p.drawText("Document généré via Shift Office — shiftoffice.fr", {
      x: M,
      y: 44,
      size: 7.5,
      font,
      color: OR,
    });
    const pg = `Page ${i + 1} / ${n}`;
    p.drawText(pg, {
      x: M + W - font.widthOfTextAtSize(pg, 7.5),
      y: 44,
      size: 7.5,
      font,
      color: GRIS,
    });
  });

  return pdf.save();
}

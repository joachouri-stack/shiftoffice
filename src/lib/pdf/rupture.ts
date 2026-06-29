import { PDFDocument, StandardFonts, type PDFPage } from "pdf-lib";
import { INK, GRIS, OR, eur, wrap } from "./helpers";

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

const A4: [number, number] = [595.28, 841.89];
const M = 56;
const W = A4[0] - M * 2;
const TOP = 792;

export async function buildRupturePDF(d: RuptureData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = pdf.addPage(A4);
  let y = TOP;

  const ensure = (space: number) => {
    if (y - space < 64) {
      page = pdf.addPage(A4);
      y = TOP;
    }
  };
  const line = (s: string, size = 10.5, f = font, color = INK, x = M) => {
    page.drawText(s, { x, y, size, font: f, color });
  };
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

  // Titre
  line("CONVENTION DE RUPTURE CONVENTIONNELLE", 14, bold);
  page.drawRectangle({
    x: M,
    y: y - 9,
    width: bold.widthOfTextAtSize("CONVENTION DE RUPTURE CONVENTIONNELLE", 14),
    height: 3,
    color: OR,
  });
  y -= 22;
  line("Rupture d'un commun accord d'un contrat à durée indéterminée", 9.5, font, GRIS);
  y -= 26;

  // Parties
  para("Entre les soussignés :", 10.5, bold);
  para(
    `${d.entrepriseNom || "L'entreprise"}${d.siret ? `, SIRET ${d.siret}` : ""}, ` +
      `dont le siège social est situé ${d.entrepriseAdresse || "—"}, ` +
      `représentée par ${d.representantNom || "—"} en qualité de ${d.representantQualite || "représentant"}, ` +
      `ci-après dénommée « l'Employeur », d'une part,`
  );
  para(
    `Et ${d.salarieNom || "le/la salarié(e)"}, demeurant ${d.salarieAdresse || "—"}, ` +
      `employé(e) en qualité de ${d.poste || "—"} depuis le ${d.dateEmbauche || "—"}, ` +
      `ci-après dénommé(e) « le Salarié », d'autre part,`
  );
  para(
    `Les parties conviennent, d'un commun accord et dans le cadre des articles L. 1237-11 ` +
      `et suivants du Code du travail, de rompre le contrat de travail à durée indéterminée qui les lie.`
  );

  heading("Article 1 — Principe de la rupture");
  para(
    `La présente convention a pour objet de définir les conditions de la rupture d'un commun ` +
      `accord du contrat de travail. Cette rupture résulte de la libre volonté des deux parties ` +
      `et ne peut être imposée par l'une ou l'autre.`
  );

  heading("Article 2 — Entretien(s) préalable(s)");
  para(
    `Les parties se sont rencontrées au cours d'un ou plusieurs entretiens, notamment le ` +
      `${d.dateEntretien || "—"}, afin de convenir du principe et des modalités de la rupture. ` +
      `Le Salarié a été informé de la possibilité de se faire assister lors de ces entretiens.`
  );

  heading("Article 3 — Indemnité spécifique de rupture");
  para(
    `Le Salarié percevra une indemnité spécifique de rupture conventionnelle d'un montant ` +
      `de ${eur(d.indemniteRupture || 0)} euros bruts. Ce montant ne peut être inférieur à ` +
      `l'indemnité légale de licenciement. Cette indemnité sera versée à la date de rupture effective ` +
      `du contrat.`
  );
  if (d.salaireBrut > 0) {
    para(
      `À titre indicatif, la rémunération mensuelle brute de référence du Salarié s'élève à ` +
        `${eur(d.salaireBrut)} euros.`,
      9.5,
      font,
      GRIS
    );
  }

  heading("Article 4 — Date de rupture du contrat");
  para(
    `La date envisagée de rupture du contrat de travail est fixée au ${d.dateRupture || "—"}, ` +
      `sous réserve de l'homologation de la présente convention par l'autorité administrative ` +
      `compétente (DREETS). La rupture ne peut intervenir avant le lendemain du jour de l'homologation.`
  );

  heading("Article 5 — Droit de rétractation");
  para(
    `À compter de la date de signature de la présente convention, chacune des parties dispose ` +
      `d'un délai de quinze (15) jours calendaires pour exercer son droit de rétractation. ` +
      `Ce droit s'exerce par lettre adressée à l'autre partie par tout moyen attestant de sa date de réception.`
  );

  heading("Article 6 — Homologation");
  para(
    `À l'issue du délai de rétractation, la partie la plus diligente adresse une demande ` +
      `d'homologation à la DREETS, accompagnée d'un exemplaire de la convention. ` +
      `L'autorité administrative dispose d'un délai d'instruction de quinze (15) jours ouvrables. ` +
      `À défaut de réponse dans ce délai, l'homologation est réputée acquise.`
  );

  heading("Article 7 — Solde de tout compte");
  para(
    `À la date de rupture, l'Employeur remettra au Salarié un certificat de travail, ` +
      `une attestation France Travail, ainsi qu'un reçu pour solde de tout compte ` +
      `récapitulant l'ensemble des sommes versées.`
  );

  // Signatures
  ensure(96);
  y -= 10;
  para(
    `Fait à ${d.ville || "—"}, le ${d.date || "—"}, en deux exemplaires originaux, ` +
      `dont un remis à chaque partie.`
  );
  y -= 16;
  line("L'Employeur", 10.5, bold, INK, M);
  line("Le Salarié", 10.5, bold, INK, M + W - 120);
  y -= 13;
  line("(signature)", 8.5, font, GRIS, M);
  line("(mention « Lu et approuvé »)", 8.5, font, GRIS, M + W - 120);
  y -= 12;
  line(d.representantNom || "", 9.5, font, GRIS, M);
  line(d.salarieNom || "", 9.5, font, GRIS, M + W - 120);

  return pdf.save();
}

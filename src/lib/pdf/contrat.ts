import { PDFDocument, StandardFonts, type PDFPage } from "pdf-lib";
import { INK, GRIS, OR, eur, wrap } from "./helpers";

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
const M = 56;
const W = A4[0] - M * 2;
const TOP = 792;

export async function buildContratPDF(d: ContratData): Promise<Uint8Array> {
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

  const cdi = d.typeContrat !== "cdd";

  // Titre
  line(
    cdi
      ? "CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE"
      : "CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE",
    15,
    bold
  );
  page.drawRectangle({ x: M, y: y - 9, width: 64, height: 3, color: OR });
  y -= 34;

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
      `ci-après dénommé(e) « le Salarié », d'autre part,`
  );
  para("Il a été convenu ce qui suit :");

  heading("Article 1 — Engagement et fonctions");
  para(
    `Le Salarié est engagé en qualité de ${d.poste || "—"}. Il exercera ses fonctions ` +
      `sous l'autorité et selon les directives de l'Employeur, et se conformera au règlement intérieur de l'entreprise.`
  );

  heading("Article 2 — Durée du contrat");
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

  heading("Article 3 — Période d'essai");
  para(
    d.periodeEssai && d.periodeEssai !== "Aucune"
      ? `Le contrat est assorti d'une période d'essai de ${d.periodeEssai}, durant laquelle chacune des parties pourra y mettre fin dans les conditions légales.`
      : `Le contrat ne comporte pas de période d'essai.`
  );

  heading("Article 4 — Lieu de travail");
  para(
    `Le Salarié exercera ses fonctions à : ${d.lieuTravail || d.entrepriseAdresse || "—"}. ` +
      `Ce lieu pourra être modifié en fonction des nécessités de l'entreprise.`
  );

  heading("Article 5 — Durée du travail");
  para(
    `La durée hebdomadaire de travail est fixée à ${d.heuresSemaine || 35} heures, ` +
      `répartie selon les horaires en vigueur dans l'entreprise.`
  );

  heading("Article 6 — Rémunération");
  para(
    `En contrepartie de son travail, le Salarié percevra une rémunération brute mensuelle de ${eur(d.salaireBrut || 0)} euros, ` +
      `versée à la fin de chaque mois.`
  );

  if (d.conventionCollective) {
    heading("Article 7 — Convention collective");
    para(
      `Les relations entre les parties sont régies par la convention collective : ${d.conventionCollective}.`
    );
  }

  heading("Article 8 — Congés payés");
  para(
    `Le Salarié bénéficiera des congés payés conformément aux dispositions légales et conventionnelles en vigueur, ` +
      `soit 2,5 jours ouvrables par mois de travail effectif.`
  );

  // Signatures
  ensure(90);
  y -= 10;
  para(
    `Fait à ${d.ville || "—"}, le ${d.date || "—"}, en double exemplaire.`
  );
  y -= 16;
  line("L'Employeur", 10.5, bold, INK, M);
  line("Le Salarié", 10.5, bold, INK, M + W - 120);
  y -= 14;
  line(d.representantNom || "", 9.5, font, GRIS, M);
  line(d.salarieNom || "", 9.5, font, GRIS, M + W - 120);

  // Pied (sur la dernière page)
  page.drawText("Document généré via Shift Office — shiftoffice.fr", {
    x: M,
    y: 40,
    size: 8,
    font,
    color: OR,
  });

  return pdf.save();
}

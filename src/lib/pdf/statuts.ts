import { PDFDocument, StandardFonts, type PDFPage } from "pdf-lib";
import { INK, GRIS, OR, eur, wrap } from "./helpers";

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
  ville: string;
  date: string;
};

const A4: [number, number] = [595.28, 841.89];
const M = 56;
const W = A4[0] - M * 2;
const TOP = 792;

export async function buildStatutsPDF(d: StatutsData): Promise<Uint8Array> {
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

  // Terminologie selon la forme
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
  const nbTitres =
    d.valeurTitre > 0 ? Math.round((d.capital || 0) / d.valeurTitre) : 0;

  // Titre
  line("STATUTS", 20, bold);
  page.drawRectangle({ x: M, y: y - 9, width: 64, height: 3, color: OR });
  y -= 22;
  line(`${formeLongue[d.forme]} (${d.forme})`, 11, font, GRIS);
  y -= 14;
  line(d.denomination || "—", 12, bold);
  if (d.capital > 0) {
    y -= 14;
    line(`Au capital de ${eur(d.capital)} euros`, 10, font, GRIS);
  }
  y -= 28;

  // Soussignés
  para(
    unipersonnelle ? "L'associé unique soussigné :" : "Les soussignés :",
    10.5,
    bold
  );
  if (associes.length) {
    for (const a of associes) {
      para(
        `${a.nom}${a.adresse ? `, demeurant ${a.adresse}` : ""}` +
          `${a.apport > 0 ? `, apportant la somme de ${eur(a.apport)} euros` : ""}.`
      );
    }
  } else {
    para("—");
  }
  para(
    `${unipersonnelle ? "A établi" : "Ont établi"} ainsi qu'il suit les statuts d'une ${formeLongue[d.forme].toLowerCase()} ` +
      `devant exister entre ${unipersonnelle ? "lui" : "eux"} et toute personne qui viendrait ultérieurement à acquérir la qualité d'associé.`
  );

  heading("Article 1 — Forme");
  para(
    `Il est formé ${unipersonnelle ? "par l'associé unique" : "entre les propriétaires des " + titre + " ci-après créées et de celles qui pourraient l'être ultérieurement"} ` +
      `une ${formeLongue[d.forme].toLowerCase()} régie par les dispositions légales en vigueur et par les présents statuts.`
  );

  heading("Article 2 — Objet");
  para(`La société a pour objet, en France et à l'étranger : ${d.objet || "—"}.`);
  para(
    `Et plus généralement, toutes opérations industrielles, commerciales, financières, mobilières ou ` +
      `immobilières se rattachant directement ou indirectement à cet objet ou susceptibles d'en faciliter la réalisation.`
  );

  heading("Article 3 — Dénomination sociale");
  para(
    `La dénomination de la société est : « ${d.denomination || "—"} ». Tous les actes et documents émanant ` +
      `de la société doivent indiquer la dénomination, précédée ou suivie des mots « ${d.forme} » et de l'énonciation du capital social.`
  );

  heading("Article 4 — Siège social");
  para(
    `Le siège social est fixé à : ${d.siege || "—"}. Il pourra être transféré dans les conditions prévues par la loi.`
  );

  heading("Article 5 — Durée");
  para(
    `La durée de la société est fixée à ${d.duree || "99 ans"} à compter de son immatriculation au ` +
      `Registre du commerce et des sociétés, sauf dissolution anticipée ou prorogation.`
  );

  heading("Article 6 — Apports");
  if (associes.length) {
    for (const a of associes) {
      para(
        `${a.nom} apporte à la société la somme de ${eur(a.apport)} euros en numéraire.`
      );
    }
  }
  para(
    `Le total des apports en numéraire s'élève à ${eur(d.capital || 0)} euros, ` +
      `correspondant au capital social.`
  );

  heading("Article 7 — Capital social");
  para(
    `Le capital social est fixé à la somme de ${eur(d.capital || 0)} euros. ` +
      `Il est divisé en ${nbTitres || "—"} ${titre} de ${eur(d.valeurTitre || 0)} euros de valeur nominale chacune, ` +
      `${unipersonnelle ? "intégralement attribuées à l'associé unique" : "intégralement souscrites et réparties entre les associés proportionnellement à leurs apports"}, ` +
      `et entièrement libérées.`
  );

  heading(`Article 8 — ${parts ? "Parts sociales" : "Actions"}`);
  para(
    `Chaque ${titreSing} donne droit, dans la propriété de l'actif social et dans le partage des bénéfices, ` +
      `à une fraction proportionnelle au nombre de ${titre} existantes. Les ${titre} sont indivisibles à l'égard de la société.`
  );

  heading(`Article 9 — Cession des ${titre}`);
  if (unipersonnelle) {
    para(
      `Tant que la société ne comprend qu'un associé unique, celui-ci est libre de céder ses ${titre} à toute personne.`
    );
  } else if (parts) {
    para(
      `Les parts sociales ne peuvent être cédées à des tiers étrangers à la société qu'avec le consentement ` +
        `de la majorité des associés représentant au moins la moitié des parts sociales, conformément à l'article L. 223-14 du Code de commerce. ` +
        `Les cessions entre associés sont libres.`
    );
  } else {
    para(
      `La cession des actions s'opère librement, sauf clause d'agrément ou de préemption qui pourrait être ` +
        `prévue par décision collective des associés. Toute cession est constatée par un ordre de mouvement.`
    );
  }

  heading(`Article 10 — ${parts ? "Gérance" : "Présidence"}`);
  para(
    `La société est ${parts ? "gérée" : "dirigée"} par ${d.dirigeantNom || "—"}` +
      `${d.dirigeantAdresse ? `, demeurant ${d.dirigeantAdresse}` : ""}, ` +
      `nommé(e) ${dirigeantTitre} pour une durée illimitée. ` +
      `Le ${dirigeantTitre} est investi des pouvoirs les plus étendus pour agir au nom de la société dans la limite de l'objet social.`
  );

  heading("Article 11 — Décisions collectives");
  if (unipersonnelle) {
    para(
      `L'associé unique exerce les pouvoirs dévolus à la collectivité des associés. Ses décisions sont ` +
        `constatées dans un registre spécial.`
    );
  } else {
    para(
      `Les décisions collectives sont prises en assemblée ou par consultation écrite, dans les conditions ` +
        `de quorum et de majorité prévues par la loi et les présents statuts. Chaque associé dispose d'un nombre ` +
        `de voix égal au nombre de ${titre} qu'il possède.`
    );
  }

  heading("Article 12 — Exercice social");
  para(
    `Chaque exercice social a une durée de douze mois, commençant le 1er janvier et se terminant le 31 décembre. ` +
      `Par exception, le premier exercice commencera à la date d'immatriculation.`
  );

  heading("Article 13 — Affectation et répartition du résultat");
  para(
    `Après dotation à la réserve légale, le bénéfice distribuable est réparti entre les associés ` +
      `proportionnellement au nombre de ${titre} détenues, ou affecté en report ou en réserve selon décision collective.`
  );

  heading("Article 14 — Dissolution — Liquidation");
  para(
    `La société est dissoute à l'arrivée du terme, ou par décision ${unipersonnelle ? "de l'associé unique" : "collective des associés"}. ` +
      `La liquidation est effectuée conformément à la loi ; le boni de liquidation est réparti entre les associés ` +
      `proportionnellement à leurs droits.`
  );

  heading("Article 15 — Contestations");
  para(
    `Toutes contestations relatives aux affaires sociales survenant pendant la durée de la société ou de sa ` +
      `liquidation seront soumises aux tribunaux compétents du siège social.`
  );

  heading("Article 16 — Personnalité morale — Immatriculation");
  para(
    `La société jouira de la personnalité morale à compter de son immatriculation au Registre du commerce et des sociétés. ` +
      `Les présents statuts ont été établis pour permettre cette immatriculation.`
  );

  // Signatures
  ensure(110);
  y -= 10;
  para(
    `Fait à ${d.ville || "—"}, le ${d.date || "—"}, en autant d'exemplaires que requis par la loi.`
  );
  y -= 16;
  if (unipersonnelle) {
    line("L'associé unique", 10.5, bold, INK, M);
    y -= 13;
    line("(signature)", 8.5, font, GRIS, M);
    y -= 12;
    line(associes[0]?.nom || d.dirigeantNom || "", 9.5, font, GRIS, M);
  } else {
    para("Les associés (signature précédée de la mention « Lu et approuvé ») :", 9.5, font, GRIS);
    for (const a of associes) {
      ensure(18);
      line(a.nom, 9.5, font, INK, M);
      y -= 16;
    }
  }

  // Pied
  page.drawText("Document généré via Shift Office — shiftoffice.fr", {
    x: M,
    y: 40,
    size: 8,
    font,
    color: OR,
  });

  return pdf.save();
}

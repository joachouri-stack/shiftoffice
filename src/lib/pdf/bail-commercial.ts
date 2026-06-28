import { PDFDocument, StandardFonts, type PDFPage } from "pdf-lib";
import { INK, GRIS, OR, eur, wrap } from "./helpers";

export type BailCommercialData = {
  // Bailleur
  bailleurNom: string;
  bailleurAdresse: string;
  bailleurQualite: string; // particulier / SCI…
  // Preneur
  preneurNom: string;
  preneurAdresse: string;
  preneurRcs: string;
  // Local
  adresseLocal: string;
  descriptionLocal: string;
  surface: string;
  destination: string; // activité autorisée
  // Conditions financières
  loyerAnnuel: number;
  depotGarantie: number;
  charges: string;
  indiceRevision: string; // ILC, ILAT…
  // Durée
  dateDebut: string;
  duree: string; // ex. "9 ans"
  ville: string;
  date: string;
};

const A4: [number, number] = [595.28, 841.89];
const M = 56;
const W = A4[0] - M * 2;
const TOP = 792;

export async function buildBailCommercialPDF(
  d: BailCommercialData
): Promise<Uint8Array> {
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

  const mensuel = (d.loyerAnnuel || 0) / 12;

  // Titre
  line("BAIL COMMERCIAL", 17, bold);
  page.drawRectangle({
    x: M,
    y: y - 9,
    width: bold.widthOfTextAtSize("BAIL COMMERCIAL", 17),
    height: 3,
    color: OR,
  });
  y -= 22;
  line(
    "Soumis aux articles L. 145-1 et suivants du Code de commerce",
    9.5,
    font,
    GRIS
  );
  y -= 26;

  // Parties
  para("Entre les soussignés :", 10.5, bold);
  para(
    `${d.bailleurNom || "Le bailleur"}${d.bailleurQualite ? ` (${d.bailleurQualite})` : ""}, ` +
      `demeurant ${d.bailleurAdresse || "—"}, ci-après dénommé « le Bailleur », d'une part,`
  );
  para(
    `Et ${d.preneurNom || "le preneur"}${d.preneurRcs ? `, immatriculé(e) au RCS sous le n° ${d.preneurRcs}` : ""}, ` +
      `dont le siège est situé ${d.preneurAdresse || "—"}, ci-après dénommé « le Preneur », d'autre part,`
  );
  para(
    `Il a été convenu et arrêté ce qui suit, le présent bail étant soumis au statut des baux commerciaux.`
  );

  heading("Article 1 — Désignation des locaux");
  para(
    `Le Bailleur donne à bail au Preneur, qui accepte, les locaux à usage commercial situés : ` +
      `${d.adresseLocal || "—"}.`
  );
  if (d.descriptionLocal || d.surface) {
    para(
      `${d.descriptionLocal ? `Ces locaux comprennent : ${d.descriptionLocal}. ` : ""}` +
        `${d.surface ? `Surface approximative : ${d.surface} m². ` : ""}` +
        `Le Preneur déclare parfaitement connaître les lieux pour les avoir visités.`
    );
  }

  heading("Article 2 — Destination des lieux");
  para(
    `Les locaux sont destinés à l'exercice de l'activité suivante : ${d.destination || "—"}. ` +
      `Le Preneur ne pourra exercer aucune autre activité sans l'accord écrit du Bailleur, ` +
      `sous réserve du droit de déspécialisation prévu par la loi.`
  );

  heading("Article 3 — Durée");
  para(
    `Le présent bail est consenti pour une durée de ${d.duree || "9 ans"} entiers et consécutifs ` +
      `à compter du ${d.dateDebut || "—"}. Le Preneur aura la faculté de donner congé à l'expiration ` +
      `de chaque période triennale, dans les conditions de l'article L. 145-4 du Code de commerce, ` +
      `par acte extrajudiciaire ou lettre recommandée avec accusé de réception, moyennant un préavis de six mois.`
  );

  heading("Article 4 — Loyer");
  para(
    `Le présent bail est consenti moyennant un loyer annuel de ${eur(d.loyerAnnuel || 0)} euros hors taxes ` +
      `et hors charges, soit ${eur(mensuel)} euros par mois, payable par termes mensuels d'avance.`
  );

  heading("Article 5 — Révision du loyer");
  para(
    `Le loyer sera révisé annuellement, à la date anniversaire du bail, en fonction de la variation ` +
      `de l'indice ${d.indiceRevision || "ILC (indice des loyers commerciaux)"} publié par l'INSEE, ` +
      `l'indice de référence étant le dernier indice connu à la date de prise d'effet du bail.`
  );

  heading("Article 6 — Charges, impôts et taxes");
  para(
    `${d.charges ? `${d.charges} ` : ""}` +
      `Conformément aux articles L. 145-40-2 et R. 145-35 du Code de commerce, un inventaire précis ` +
      `et limitatif des catégories de charges, impôts, taxes et redevances liés au bail est annexé au présent contrat, ` +
      `avec leur répartition entre le Bailleur et le Preneur.`
  );

  heading("Article 7 — Dépôt de garantie");
  para(
    d.depotGarantie > 0
      ? `À titre de garantie de la bonne exécution du bail, le Preneur verse ce jour au Bailleur ` +
          `un dépôt de garantie de ${eur(d.depotGarantie)} euros, qui lui sera restitué en fin de bail, ` +
          `déduction faite des sommes éventuellement dues.`
      : `Le présent bail n'est assorti d'aucun dépôt de garantie.`
  );

  heading("Article 8 — État des lieux");
  para(
    `Un état des lieux contradictoire sera établi lors de la remise des clés et lors de la restitution ` +
      `des locaux, et annexé au présent bail conformément à l'article L. 145-40-1 du Code de commerce.`
  );

  heading("Article 9 — Cession et sous-location");
  para(
    `Le Preneur ne pourra céder son droit au bail qu'à l'acquéreur de son fonds de commerce. ` +
      `Toute sous-location totale ou partielle est interdite, sauf accord écrit et préalable du Bailleur.`
  );

  heading("Article 10 — Entretien et réparations");
  para(
    `Le Preneur entretiendra les locaux en bon état et effectuera les réparations locatives. ` +
      `Les grosses réparations au sens de l'article 606 du Code civil restent à la charge du Bailleur.`
  );

  heading("Article 11 — Clause résolutoire");
  para(
    `À défaut de paiement d'un seul terme de loyer ou de charges à son échéance, ou d'inexécution ` +
      `d'une seule des conditions du bail, et un mois après un commandement de payer demeuré infructueux, ` +
      `le présent bail sera résilié de plein droit si bon semble au Bailleur.`
  );

  // Signatures
  ensure(96);
  y -= 10;
  para(
    `Fait à ${d.ville || "—"}, le ${d.date || "—"}, en deux exemplaires originaux.`
  );
  y -= 16;
  line("Le Bailleur", 10.5, bold, INK, M);
  line("Le Preneur", 10.5, bold, INK, M + W - 120);
  y -= 13;
  line("(mention « Lu et approuvé »)", 8.5, font, GRIS, M);
  line("(mention « Lu et approuvé »)", 8.5, font, GRIS, M + W - 120);
  y -= 12;
  line(d.bailleurNom || "", 9.5, font, GRIS, M);
  line(d.preneurNom || "", 9.5, font, GRIS, M + W - 120);

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

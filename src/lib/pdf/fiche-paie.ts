import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { INK, GRIS, OR, eur } from "./helpers";
import type { FichePaieResult, Categorie } from "@/lib/paie/calcul";

export type FichePaieData = {
  entrepriseNom: string;
  entrepriseAdresse: string;
  siret: string;
  codeApe?: string;
  conventionCollective?: string;
  salarieNom: string;
  salarieAdresse?: string;
  poste: string;
  classification?: string;
  dateEntree?: string;
  typeContrat?: string;
  numeroSecu: string;
  periode: string;
  datePaiement?: string;
  congesAcquis?: number;
  congesPris?: number;
  cumulBrut?: number;
  cumulNetImposable?: number;
  result: FichePaieResult;
};

const CREME = rgb(0.98, 0.965, 0.93);
const ZEBRA = rgb(0.975, 0.96, 0.93);
const LIGNE = rgb(0.86, 0.83, 0.77);
const ORL = rgb(0.96, 0.92, 0.82);

const CATS: Categorie[] = [
  "Santé",
  "Retraite",
  "Famille / Accidents",
  "Assurance chômage",
  "CSG / CRDS",
  "Autres contributions",
];

export async function buildFichePaiePDF(d: FichePaieData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const M = 38;
  const R = 595.28 - M;
  const W = R - M;
  let y = 806;

  const t = (s: string, x: number, yy: number, size = 8, f = font, c = INK) =>
    page.drawText(s, { x, y: yy, size, font: f, color: c });
  const rt = (s: string, xR: number, yy: number, size = 8, f = font, c = INK) =>
    page.drawText(s, {
      x: xR - f.widthOfTextAtSize(s, size),
      y: yy,
      size,
      font: f,
      color: c,
    });
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

  const r = d.result;

  // ─── Titre + période ───
  t("BULLETIN DE PAIE", M, y, 18, bold);
  rect(M, y - 8, bold.widthOfTextAtSize("BULLETIN DE PAIE", 18) + 3, 3, OR);
  const per = `Période : ${d.periode || "—"}`;
  const perW = bold.widthOfTextAtSize(per, 9) + 20;
  rect(R - perW, y - 3, perW, 21, ORL, OR, 0.8);
  rt(per, R - 10, y + 3, 9, bold);
  if (d.datePaiement) rt(`Paiement le ${d.datePaiement}`, R, y - 16, 7.5, font, GRIS);
  y -= 28;

  // ─── Boîtes employeur / salarié ───
  const gap = 14;
  const bw = (W - gap) / 2;
  const bh = 88;
  const by = y - bh;
  // Tronque une valeur trop longue pour qu'elle reste dans son encadré.
  const clip = (s: string, size: number, maxW: number, f = font) => {
    if (f.widthOfTextAtSize(s, size) <= maxW) return s;
    let out = s;
    while (out.length > 1 && f.widthOfTextAtSize(out + "…", size) > maxW)
      out = out.slice(0, -1);
    return out.trimEnd() + "…";
  };
  const infoBox = (
    x: number,
    titre: string,
    lignes: Array<[string, string]>
  ) => {
    rect(x, by, bw, bh, undefined, LIGNE, 1);
    rect(x, by + bh - 15, bw, 15, CREME);
    t(titre, x + 8, by + bh - 10.5, 7, bold, GRIS);
    let yy = by + bh - 27;
    for (const [k, v] of lignes) {
      if (!v) continue;
      const f = k === "" ? bold : font;
      t(k, x + 8, yy, 7, font, GRIS);
      t(clip(v, 7.5, bw - 64 - 8, f), x + 64, yy, 7.5, f, INK);
      yy -= 11;
    }
  };
  infoBox(M, "EMPLOYEUR", [
    ["", d.entrepriseNom || "—"],
    ["Adresse", d.entrepriseAdresse || "—"],
    ["SIRET", d.siret || "—"],
    ["Code APE", d.codeApe || "—"],
    ["Convention", d.conventionCollective || "—"],
  ]);
  infoBox(M + bw + gap, "SALARIÉ", [
    ["", d.salarieNom || "—"],
    ["Emploi", d.poste || "—"],
    ["Classif.", d.classification || "—"],
    ["Entrée le", d.dateEntree || "—"],
    ["Contrat", d.typeContrat || "—"],
    ["N° SS", d.numeroSecu || "—"],
  ]);
  y = by - 16;

  // colonnes du tableau
  const cBase = 330;
  const cTSal = 388;
  const cSal = 452;
  const cTPat = 502;
  const cPat = R - 6;
  const rh = 11.5;

  const headBand = (titre: string) => {
    rect(M, y - 3.5, W, 15, INK);
    t(titre, M + 8, y + 0.5, 7.5, bold, CREME);
    rt("Base", cBase, y + 0.5, 6.8, bold, CREME);
    rt("T. sal.", cTSal, y + 0.5, 6.8, bold, CREME);
    rt("Part sal.", cSal, y + 0.5, 6.8, bold, CREME);
    rt("T. pat.", cTPat, y + 0.5, 6.8, bold, CREME);
    rt("Part pat.", cPat, y + 0.5, 6.8, bold, CREME);
    y -= 15.5;
  };

  // ─── Rémunération ───
  rect(M, y - 3.5, W, 15, INK);
  t("RÉMUNÉRATION", M + 8, y + 0.5, 7.5, bold, CREME);
  rt("Nombre / Base", cBase, y + 0.5, 6.8, bold, CREME);
  rt("Montant", cPat, y + 0.5, 6.8, bold, CREME);
  y -= 15.5;

  const remLine = (label: string, detail: string, montant: number, i: number) => {
    if (i % 2 === 1) rect(M, y - 3.5, W, rh, ZEBRA);
    t(label, M + 8, y, 7.8, font, INK);
    rt(detail, cBase, y, 7.8, font, GRIS);
    rt(`${eur(montant)} €`, cPat, y, 7.8, font, INK);
    y -= rh;
  };
  let ri = 0;
  remLine(
    "Salaire de base",
    `${r.heuresMois.toLocaleString("fr-FR")} h × ${eur(r.tauxHoraire)} €`,
    r.salaireBase,
    ri++
  );
  if (r.heuresSup25Montant > 0)
    remLine("Heures supplémentaires (25 %)", "", r.heuresSup25Montant, ri++);
  if (r.heuresSup50Montant > 0)
    remLine("Heures supplémentaires (50 %)", "", r.heuresSup50Montant, ri++);
  if (r.primes > 0) remLine("Primes et indemnités", "", r.primes, ri++);
  rect(M, y - 3, W, rh + 1, ORL);
  t("SALAIRE BRUT", M + 8, y, 8.5, bold);
  rt(`${eur(r.brut)} €`, cPat, y, 9, bold);
  y -= rh + 12;

  // ─── Cotisations ───
  headBand("COTISATIONS ET CONTRIBUTIONS");
  let zi = 0;
  for (const cat of CATS) {
    const lignes = r.lignes.filter((l) => l.categorie === cat);
    if (!lignes.length) continue;
    // libellé de catégorie
    t(cat.toUpperCase(), M + 6, y, 6.8, bold, OR);
    y -= rh;
    let stSal = 0;
    let stPat = 0;
    for (const l of lignes) {
      if (zi++ % 2 === 1) rect(M, y - 3.5, W, rh, ZEBRA);
      t(l.label, M + 12, y, 7.5, font, INK);
      rt(eur(l.base), cBase, y, 7.5, font, GRIS);
      rt(l.tauxSal ? `${l.tauxSal} %` : "—", cTSal, y, 7.5, font, GRIS);
      rt(l.montSal ? eur(l.montSal) : "—", cSal, y, 7.5, font, INK);
      rt(l.tauxPat ? `${l.tauxPat} %` : "—", cTPat, y, 7.5, font, GRIS);
      rt(l.montPat ? eur(l.montPat) : "—", cPat, y, 7.5, font, GRIS);
      stSal += l.montSal;
      stPat += l.montPat;
      y -= rh;
    }
    rt(`Sous-total ${eur(Math.round(stSal * 100) / 100)}`, cSal, y + 1, 6.5, font, GRIS);
    rt(eur(Math.round(stPat * 100) / 100), cPat, y + 1, 6.5, font, GRIS);
    y -= 10;
  }
  // Marge avant la bande TOTAL pour éviter que le dernier sous-total ne la touche.
  y -= 6;
  rect(M, y - 3.5, W, rh + 1, INK);
  t("TOTAL DES COTISATIONS", M + 8, y, 8, bold, CREME);
  rt(eur(r.totalSal), cSal, y, 8, bold, CREME);
  rt(eur(r.totalPat), cPat, y, 8, bold, CREME);
  y -= rh + 4;

  // Réduction générale (RGDU) — allègement patronal, masqué au-delà de 3 SMIC.
  if (r.reductionGenerale > 0) {
    t("Réduction générale de cotisations (RGDU)", M + 12, y, 7.5, font, INK);
    rt(`- ${eur(r.reductionGenerale)} €`, cPat, y, 7.5, font, OR);
    y -= rh + 10;
  } else {
    y -= 10;
  }

  // ─── Bloc Net ───
  const netRows: Array<[string, string]> = [
    ["Net imposable", `${eur(r.netImposable)} €`],
    ["Montant net social", `${eur(r.netSocial)} €`],
    ["Net à payer avant impôt", `${eur(r.netAvantImpot)} €`],
    [
      `Prélèvement à la source${r.tauxPAS ? ` (${r.tauxPAS.toLocaleString("fr-FR")} %${r.pasAuto ? ", barème" : ""})` : r.pasAuto ? " (barème, 0 %)" : ""}`,
      `- ${eur(r.montantPAS)} €`,
    ],
  ];
  const netH = netRows.length * 13 + 40;
  rect(M, y - netH + 13, W, netH, undefined, OR, 1);
  let nyy = y;
  for (const [k, v] of netRows) {
    t(k, M + 12, nyy, 8.5, font, GRIS);
    rt(v, R - 12, nyy, 8.5, font, INK);
    nyy -= 13;
  }
  nyy -= 1;
  rect(M, nyy - 13, W, 25, INK);
  t("NET PAYÉ", M + 12, nyy - 4.5, 12, bold, CREME);
  rt(`${eur(r.netPaye)} €`, R - 12, nyy - 5.5, 15, bold, OR);
  y = y - netH - 8;

  // ─── Congés payés + Cumuls ───
  const half = (W - gap) / 2;
  const cby = y - 52;
  // La case congés n'apparaît que si des congés ont été saisis.
  const aConges = (d.congesAcquis ?? 0) > 0 || (d.congesPris ?? 0) > 0;
  if (aConges) {
    const solde = (d.congesAcquis ?? 0) - (d.congesPris ?? 0);
    rect(M, cby, half, 52, undefined, LIGNE, 1);
    t("CONGÉS PAYÉS", M + 8, cby + 40, 7, bold, GRIS);
    t(`Acquis : ${(d.congesAcquis ?? 0).toLocaleString("fr-FR")} j`, M + 8, cby + 27, 7.5);
    t(`Pris : ${(d.congesPris ?? 0).toLocaleString("fr-FR")} j`, M + 8, cby + 16, 7.5);
    t(`Solde : ${solde.toLocaleString("fr-FR")} j`, M + 8, cby + 5, 7.5, bold);
  }

  const cx = M + half + gap;
  const cumulBrut = d.cumulBrut && d.cumulBrut > 0 ? d.cumulBrut : r.brut;
  const cumulNet = d.cumulNetImposable && d.cumulNetImposable > 0 ? d.cumulNetImposable : r.netImposable;
  rect(cx, cby, half, 52, undefined, LIGNE, 1);
  t("CUMULS ANNUELS", cx + 8, cby + 40, 7, bold, GRIS);
  t("Brut :", cx + 8, cby + 27, 7.5, font, GRIS);
  rt(`${eur(cumulBrut)} €`, cx + half - 8, cby + 27, 7.5);
  t("Net imposable :", cx + 8, cby + 16, 7.5, font, GRIS);
  rt(`${eur(cumulNet)} €`, cx + half - 8, cby + 16, 7.5);
  t("Coût employeur :", cx + 8, cby + 5, 7.5, font, GRIS);
  rt(`${eur(r.coutEmployeur)} €`, cx + half - 8, cby + 5, 7.5);

  // ─── Mentions légales ───
  t(
    "Dans votre intérêt et pour vous aider à faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée.",
    M,
    52,
    6.8,
    font,
    GRIS
  );
  t(
    "Bulletin indicatif. Taux indicatifs à vérifier selon votre convention collective.",
    M,
    42,
    6.8,
    font,
    GRIS
  );
  t("Informations : service-public.fr", M, 32, 6.8, font, OR);

  return pdf.save();
}

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { INK, GRIS, OR, eur } from "./helpers";
import type { FichePaieResult } from "@/lib/paie/calcul";

export type FichePaieData = {
  entrepriseNom: string;
  entrepriseAdresse: string;
  siret: string;
  salarieNom: string;
  poste: string;
  numeroSecu: string;
  periode: string;
  result: FichePaieResult;
};

const CREME = rgb(0.98, 0.965, 0.93);

export async function buildFichePaiePDF(d: FichePaieData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const M = 36;
  const right = 595.28 - M; // 559.28
  let y = 800;

  const text = (
    s: string,
    x: number,
    yy: number,
    size = 9,
    f = font,
    color = INK
  ) => page.drawText(s, { x, y: yy, size, font: f, color });

  const rtext = (
    s: string,
    xRight: number,
    yy: number,
    size = 8,
    f = font,
    color = INK
  ) =>
    page.drawText(s, {
      x: xRight - f.widthOfTextAtSize(s, size),
      y: yy,
      size,
      font: f,
      color,
    });

  // — Titre + en-tête —
  text("BULLETIN DE PAIE", M, y, 18, bold);
  page.drawRectangle({ x: M, y: y - 8, width: 60, height: 3, color: OR });
  rtext(`Période : ${d.periode || "—"}`, right, y + 2, 11, bold);
  y -= 30;

  // Bloc employeur (gauche) / salarié (droite) — colonnes indépendantes
  text(d.entrepriseNom || "Employeur", M, y, 11, bold);
  text(d.salarieNom || "Salarié", 320, y, 11, bold);

  let yL = y - 14;
  let yR = y - 14;
  for (const l of (d.entrepriseAdresse || "").match(/.{1,46}(\s|$)/g) ?? []) {
    text(l.trim(), M, yL, 8.5, font, GRIS);
    yL -= 11;
  }
  if (d.siret) {
    text(`SIRET : ${d.siret}`, M, yL, 8.5, font, GRIS);
    yL -= 11;
  }
  if (d.poste) {
    text(`Poste : ${d.poste}`, 320, yR, 8.5, font, GRIS);
    yR -= 11;
  }
  if (d.numeroSecu) {
    text(`N° SS : ${d.numeroSecu}`, 320, yR, 8.5, font, GRIS);
    yR -= 11;
  }
  y = Math.min(yL, yR) - 14;

  // — Salaire brut —
  page.drawRectangle({
    x: M,
    y: y - 6,
    width: right - M,
    height: 22,
    color: CREME,
    borderColor: OR,
    borderWidth: 0.8,
  });
  text("Salaire brut", M + 8, y + 1, 10, bold);
  rtext(`${eur(d.result.brut)} €`, right - 8, y + 1, 10, bold);
  y -= 28;

  // — Tableau cotisations —
  const colBase = 320;
  const colTSal = 372;
  const colSal = 446;
  const colTPat = 492;
  const colPat = right;

  // En-têtes
  text("Cotisations & contributions", M, y, 8.5, bold);
  rtext("Base", colBase, y, 7.5, bold, GRIS);
  rtext("T. sal.", colTSal, y, 7.5, bold, GRIS);
  rtext("Part sal.", colSal, y, 7.5, bold, GRIS);
  rtext("T. pat.", colTPat, y, 7.5, bold, GRIS);
  rtext("Part pat.", colPat, y, 7.5, bold, GRIS);
  y -= 5;
  page.drawLine({
    start: { x: M, y },
    end: { x: right, y },
    color: OR,
    thickness: 0.6,
  });
  y -= 12;

  for (const l of d.result.lignes) {
    text(l.label, M, y, 8, font, INK);
    rtext(eur(l.base), colBase, y, 8, font, GRIS);
    rtext(l.tauxSal ? `${l.tauxSal}%` : "—", colTSal, y, 8, font, GRIS);
    rtext(l.montSal ? eur(l.montSal) : "—", colSal, y, 8);
    rtext(l.tauxPat ? `${l.tauxPat}%` : "—", colTPat, y, 8, font, GRIS);
    rtext(l.montPat ? eur(l.montPat) : "—", colPat, y, 8, font, GRIS);
    y -= 12.5;
  }

  // Totaux cotisations
  y -= 2;
  page.drawLine({
    start: { x: M, y: y + 6 },
    end: { x: right, y: y + 6 },
    color: OR,
    thickness: 0.6,
  });
  text("Total des cotisations", M, y - 6, 8.5, bold);
  rtext(eur(d.result.totalSal), colSal, y - 6, 8.5, bold);
  rtext(eur(d.result.totalPat), colPat, y - 6, 8.5, bold, GRIS);
  y -= 30;

  // — Net à payer —
  const netBoxH = 64;
  page.drawRectangle({
    x: M,
    y: y - netBoxH + 14,
    width: right - M,
    height: netBoxH,
    color: CREME,
    borderColor: OR,
    borderWidth: 1,
  });
  const line = (label: string, val: string, yy: number, strong = false) => {
    text(label, M + 10, yy, strong ? 11 : 9, strong ? bold : font, INK);
    rtext(`${val} €`, right - 10, yy, strong ? 12 : 9, strong ? bold : font, INK);
  };
  line("Net imposable", eur(d.result.netImposable), y + 4, false);
  line("Net à payer avant impôt", eur(d.result.netAvantImpot), y - 14, true);
  line("Coût total employeur", eur(d.result.coutEmployeur), y - 32, false);
  y -= netBoxH + 6;

  // — Pied —
  text(
    "Bulletin indicatif généré via Shift Office — shiftoffice.fr. Taux simplifiés, à vérifier selon votre convention.",
    M,
    40,
    7.5,
    font,
    GRIS
  );

  return pdf.save();
}

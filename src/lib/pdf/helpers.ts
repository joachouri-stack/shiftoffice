import { rgb, type PDFFont } from "pdf-lib";

export const INK = rgb(0.11, 0.094, 0.063); // #1C1810
export const GRIS = rgb(0.42, 0.376, 0.314); // #6B6050
export const OR = rgb(0.788, 0.635, 0.294); // #C9A24B
export const CREME = rgb(0.98, 0.965, 0.93);

export const eur = (n: number) =>
  n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Découpe un paragraphe en lignes qui tiennent dans la largeur donnée. */
export function wrap(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

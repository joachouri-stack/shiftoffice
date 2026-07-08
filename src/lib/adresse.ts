/**
 * Composition d'adresses (module pur).
 *
 * L'adresse issue de la recherche SIRET contient parfois déjà le code postal
 * et la ville (« 151 RUE ALBERT CAMUS 84100 ORANGE ») : les ré-ajouter
 * produirait « …84100 ORANGE, 84100 ORANGE ». On ne concatène donc que les
 * morceaux réellement absents.
 */
export function adresseComplete(
  adresse?: string,
  codePostal?: string,
  ville?: string
): string {
  const a = (adresse ?? "").trim();
  const cp = (codePostal ?? "").trim();
  const v = (ville ?? "").trim();
  const low = a.toLowerCase();
  const suffixe = [
    cp && !low.includes(cp.toLowerCase()) ? cp : "",
    v && !low.includes(v.toLowerCase()) ? v : "",
  ]
    .filter(Boolean)
    .join(" ");
  return [a, suffixe].filter(Boolean).join(", ");
}

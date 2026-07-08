/**
 * Formatage des champs date à la saisie (module pur).
 *
 * Les « / » s'insèrent automatiquement : dès que les deux premiers chiffres
 * sont tapés (jour), puis les deux suivants (mois). La valeur reste librement
 * modifiable : à la suppression, aucune barre n'est ré-ajoutée, ce qui permet
 * d'effacer naturellement caractère par caractère.
 *
 * @param next  valeur brute du champ après la frappe
 * @param prev  valeur précédente (pour détecter une suppression)
 * @param court true pour un format jj/mm (ex. note de frais), sinon jj/mm/aaaa
 */
export function formatDateInput(next: string, prev: string, court = false): string {
  const suppression = next.length < prev.length;
  const max = court ? 4 : 8;
  const d = next.replace(/\D/g, "").slice(0, max);
  let out: string;
  if (d.length >= 5) out = `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
  else if (d.length >= 3) out = `${d.slice(0, 2)}/${d.slice(2)}`;
  else out = d;
  // À l'ajout, la barre suit immédiatement un groupe complet (jj ou jj/mm).
  if (!suppression && (d.length === 2 || (!court && d.length === 4))) out += "/";
  return out;
}

/** Catalogue des documents générables (module pur, réutilisable partout). */

export type DocItem = {
  slug: string;
  title: string;
  badge: string;
  price: number; // 0 = gratuit
  desc: string;
  tags: string[];
  /** true = accessible sans compte (gratuit) */
  free: boolean;
};

export const DOCUMENTS: DocItem[] = [
  {
    slug: "fiche-paie",
    title: "Fiche de paie",
    badge: "Le + demandé",
    price: 8,
    desc: "Bulletin de salaire conforme, cotisations URSSAF 2026 calculées automatiquement.",
    tags: ["URSSAF 2026", "Cotisations", "Cumuls annuels"],
    free: false,
  },
  {
    slug: "contrat-travail",
    title: "Contrat de travail",
    badge: "CDI / CDD",
    price: 5,
    desc: "CDI ou CDD avec toutes les clauses légales obligatoires.",
    tags: ["Clauses légales", "Période d'essai", "Convention"],
    free: false,
  },
  {
    slug: "solde-tout-compte",
    title: "Solde de tout compte",
    badge: "Officiel",
    price: 3,
    desc: "Reçu pour solde de tout compte avec calcul des indemnités.",
    tags: ["Indemnités", "Congés payés", "Reçu légal"],
    free: false,
  },
  {
    slug: "rupture-conventionnelle",
    title: "Rupture conventionnelle",
    badge: "CERFA inclus",
    price: 5,
    desc: "Formulaire CERFA officiel et indemnité spécifique calculée.",
    tags: ["CERFA 14598", "Indemnité", "Délai 15 j"],
    free: false,
  },
  {
    slug: "bail-commercial",
    title: "Bail commercial",
    badge: "3-6-9 / précaire",
    price: 9,
    desc: "Bail 3-6-9 ou bail précaire : clauses complètes, matériel inclus, pas-de-porte.",
    tags: ["3-6-9 ou précaire", "Pas-de-porte", "Matériel inventorié", "Révision ILC"],
    free: false,
  },
  {
    slug: "certificat-travail",
    title: "Certificat de travail",
    badge: "Officiel",
    price: 3,
    desc: "Certificat de travail à remettre au salarié en fin de contrat.",
    tags: ["Fin de contrat", "Mentions légales", "PDF"],
    free: false,
  },
  {
    slug: "statuts-societe",
    title: "Statuts de société",
    badge: "SASU / EURL",
    price: 19,
    desc: "Statuts juridiques pour créer votre société (SASU, EURL, SARL).",
    tags: ["SASU / EURL", "Capital", "Gérance"],
    free: false,
  },
  {
    slug: "note-de-frais",
    title: "Note de frais",
    badge: "Nouveau",
    price: 3,
    desc: "Relevé de dépenses professionnelles avec calcul TVA automatique.",
    tags: ["Calcul TVA auto", "Toutes catégories", "Conforme 2026"],
    free: false,
  },
  {
    slug: "avenant-contrat",
    title: "Avenant au contrat",
    badge: "Nouveau",
    price: 5,
    desc: "Modification du contrat : salaire, poste, horaires, prolongation CDD.",
    tags: ["Salaire", "Poste", "Temps partiel", "Clauses 2026"],
    free: false,
  },
  {
    slug: "lettre-licenciement",
    title: "Lettre de licenciement",
    badge: "Légal",
    price: 12,
    desc: "Lettre officielle avec calcul des indemnités et vérification des délais légaux 2026.",
    tags: ["Indemnités calculées", "Délais légaux", "Faute grave", "Licenciement éco"],
    free: false,
  },
  {
    slug: "quittance-loyer",
    title: "Quittance de loyer",
    badge: "Gratuit",
    price: 0,
    desc: "Quittance pour votre locataire : loyer, charges et total calculés.",
    tags: ["Loyer + charges", "Sans compte", "PDF immédiat"],
    free: true,
  },
  {
    slug: "attestation-employeur",
    title: "Attestation employeur",
    badge: "Gratuit",
    price: 0,
    desc: "Attestation employeur officielle, prête à remettre, sans compte.",
    tags: ["Officiel", "Sans compte", "PDF immédiat"],
    free: true,
  },
];

export function formatPrice(price: number): string {
  return price === 0 ? "Gratuit" : `${price}€`;
}

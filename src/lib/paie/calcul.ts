/**
 * Moteur de calcul d'un bulletin de paie (France) — barèmes du régime général
 * 2026 (employeur de moins de 50 salariés, salarié non-cadre). Inclut la
 * Réduction Générale Dégressive Unique (RGDU) qui, depuis le 1ᵉʳ janvier 2026,
 * remplace l'ancienne réduction Fillon ainsi que les taux réduits de maladie
 * (7 %) et d'allocations familiales (3,45 %), désormais supprimés.
 * Reste indicatif : à affiner selon la convention collective applicable.
 */

export type FichePaieInput = {
  salaireBrut: number; // brut de base mensuel
  heuresMois?: number; // heures mensuelles (défaut 151,67)
  tauxHoraire?: number; // si fourni, sinon déduit du brut
  heuresSup?: number; // heures sup majorées 25 %
  heuresSup50?: number; // heures sup majorées 50 %
  primes?: number; // primes/indemnités du mois
  tauxPAS?: number; // taux de prélèvement à la source (%)
};

export type Categorie =
  | "Santé"
  | "Retraite"
  | "Famille / Accidents"
  | "Assurance chômage"
  | "CSG / CRDS"
  | "Autres contributions";

export type LigneCotisation = {
  categorie: Categorie;
  label: string;
  base: number;
  tauxSal: number;
  montSal: number;
  tauxPat: number;
  montPat: number;
  deductible: boolean;
};

export type FichePaieResult = {
  heuresMois: number;
  tauxHoraire: number;
  salaireBase: number;
  heuresSup25Montant: number;
  heuresSup50Montant: number;
  primes: number;
  brut: number;
  lignes: LigneCotisation[];
  totalSal: number;
  totalPat: number;
  netAvantImpot: number;
  netImposable: number;
  netSocial: number;
  tauxPAS: number;
  montantPAS: number;
  /** true si le taux appliqué provient de la grille légale (taux neutre). */
  pasAuto: boolean;
  netPaye: number;
  reductionGenerale: number;
  coutEmployeur: number;
};

// Plafond mensuel de la Sécurité sociale 2026 (arrêté du 22 décembre 2025 ;
// plafond annuel 48 060 €).
const PMSS = 4005;

// SMIC mensuel brut au 1ᵉʳ janvier 2026 (35 h) — sert de référence à la RGDU
// et aux contrôles d'anomalies du formulaire.
export const SMIC_MENSUEL = 1823.03;

/**
 * Grille du taux neutre (taux non personnalisé) du prélèvement à la source —
 * art. 204 H du CGI, base mensuelle métropole en vigueur. C'est le barème que
 * l'employeur doit appliquer quand le taux personnalisé du salarié n'est pas
 * connu. Chaque entrée : [plafond de net imposable mensuel, taux en %].
 */
const GRILLE_TAUX_NEUTRE: Array<[number, number]> = [
  [1620, 0],
  [1683, 0.5],
  [1791, 1.3],
  [1911, 2.1],
  [2042, 2.9],
  [2151, 3.5],
  [2294, 4.1],
  [2714, 5.3],
  [3107, 7.5],
  [3539, 9.9],
  [3983, 11.9],
  [4648, 13.8],
  [5574, 15.8],
  [6974, 17.9],
  [8711, 20],
  [12091, 24],
  [16376, 28],
  [25706, 33],
  [55062, 38],
];

/** Taux neutre applicable pour un net imposable mensuel donné. */
export function tauxNeutre(netImposableMensuel: number): number {
  for (const [plafond, taux] of GRILLE_TAUX_NEUTRE) {
    if (netImposableMensuel <= plafond) return taux;
  }
  return 43;
}

// Paramètres 2026 de la Réduction Générale Dégressive Unique (RGDU),
// employeurs de moins de 50 salariés (FNAL à 0,10 %).
const RGDU_TMIN = 0.02; // exonération plancher de 2 % en dessous de 3 SMIC
const RGDU_TDELTA = 0.3781;
const RGDU_TMAX = 0.3973; // valeur maximale du coefficient (au niveau du SMIC)
const RGDU_P = 1.75;

/**
 * Réduction générale dégressive unique sur les cotisations patronales.
 * Dégressive du SMIC (coefficient maximal) jusqu'à 3 SMIC (point de sortie),
 * et nulle à partir de 3 SMIC. Calcul mensuel indicatif sur le brut.
 */
function calculerReductionGenerale(brut: number): number {
  const seuil = 3 * SMIC_MENSUEL; // point de sortie : 3 SMIC
  if (brut <= 0 || brut >= seuil) return 0;
  let coef = RGDU_TMIN + RGDU_TDELTA * Math.pow(0.5 * (seuil / brut - 1), RGDU_P);
  if (coef > RGDU_TMAX) coef = RGDU_TMAX;
  if (coef < 0) coef = 0;
  return r2(coef * brut);
}

type Def = {
  categorie: Categorie;
  label: string;
  tauxSal: number;
  tauxPat: number;
  base: "brut" | "plafond" | "csg";
  deductible?: boolean;
};

const DEFS: Def[] = [
  // Maladie : taux unique 13 % depuis 2026 (taux réduit de 7 % supprimé).
  { categorie: "Santé", label: "Sécurité sociale — Maladie, maternité", tauxSal: 0, tauxPat: 13.0, base: "brut" },
  { categorie: "Santé", label: "Complémentaire santé (mutuelle)", tauxSal: 0, tauxPat: 0, base: "brut" },
  { categorie: "Retraite", label: "Sécurité sociale — Vieillesse plafonnée", tauxSal: 6.9, tauxPat: 8.55, base: "plafond" },
  { categorie: "Retraite", label: "Sécurité sociale — Vieillesse déplafonnée", tauxSal: 0.4, tauxPat: 2.11, base: "brut" },
  { categorie: "Retraite", label: "Retraite complémentaire Agirc-Arrco (T1)", tauxSal: 3.15, tauxPat: 4.72, base: "plafond" },
  { categorie: "Retraite", label: "Contribution d'équilibre général (T1)", tauxSal: 0.86, tauxPat: 1.29, base: "plafond" },
  // Allocations familiales : taux unique 5,25 % depuis 2026 (taux réduit de 3,45 % supprimé).
  { categorie: "Famille / Accidents", label: "Allocations familiales", tauxSal: 0, tauxPat: 5.25, base: "brut" },
  { categorie: "Famille / Accidents", label: "Accident du travail", tauxSal: 0, tauxPat: 2.0, base: "brut" },
  { categorie: "Assurance chômage", label: "Assurance chômage", tauxSal: 0, tauxPat: 4.0, base: "brut" },
  { categorie: "Assurance chômage", label: "AGS (garantie des salaires)", tauxSal: 0, tauxPat: 0.25, base: "brut" },
  { categorie: "Autres contributions", label: "FNAL", tauxSal: 0, tauxPat: 0.1, base: "brut" },
  { categorie: "Autres contributions", label: "Contribution solidarité autonomie", tauxSal: 0, tauxPat: 0.3, base: "brut" },
  { categorie: "CSG / CRDS", label: "CSG déductible", tauxSal: 6.8, tauxPat: 0, base: "csg" },
  { categorie: "CSG / CRDS", label: "CSG / CRDS non déductible", tauxSal: 2.9, tauxPat: 0, base: "csg", deductible: false },
];

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Calcul inverse : retrouve le salaire brut correspondant à un net à payer
 * (avant impôt) cible, par dichotomie. Le net étant croissant avec le brut,
 * la recherche converge sûrement.
 */
export function brutPourNetAvantImpot(netCible: number): number {
  if (netCible <= 0) return 0;
  let lo = netCible;
  let hi = netCible * 2;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const net = calculerFichePaie({ salaireBrut: mid }).netAvantImpot;
    if (net < netCible) lo = mid;
    else hi = mid;
  }
  return r2((lo + hi) / 2);
}

export function calculerFichePaie(input: FichePaieInput): FichePaieResult {
  const salaireBase = Math.max(0, input.salaireBrut || 0);
  const heuresMois = input.heuresMois && input.heuresMois > 0 ? input.heuresMois : 151.67;
  const tauxHoraire = input.tauxHoraire && input.tauxHoraire > 0
    ? input.tauxHoraire
    : r2(salaireBase / heuresMois);
  const heuresSup25Montant = r2((input.heuresSup || 0) * tauxHoraire * 1.25);
  const heuresSup50Montant = r2((input.heuresSup50 || 0) * tauxHoraire * 1.5);
  const primes = Math.max(0, input.primes || 0);
  const brut = r2(salaireBase + heuresSup25Montant + heuresSup50Montant + primes);

  const baseCsg = r2(brut * 0.9825);
  const basePlafond = Math.min(brut, PMSS);

  const lignes: LigneCotisation[] = DEFS.map((d) => {
    const base = d.base === "csg" ? baseCsg : d.base === "plafond" ? basePlafond : brut;
    return {
      categorie: d.categorie,
      label: d.label,
      base: r2(base),
      tauxSal: d.tauxSal,
      montSal: r2((base * d.tauxSal) / 100),
      tauxPat: d.tauxPat,
      montPat: r2((base * d.tauxPat) / 100),
      deductible: d.deductible !== false,
    };
  });

  const totalSal = r2(lignes.reduce((s, l) => s + l.montSal, 0));
  const totalPat = r2(lignes.reduce((s, l) => s + l.montPat, 0));
  const netAvantImpot = r2(brut - totalSal);
  const deductibles = r2(
    lignes.filter((l) => l.deductible).reduce((s, l) => s + l.montSal, 0)
  );
  const netImposable = r2(brut - deductibles);
  const netSocial = netAvantImpot;
  // Taux non fourni → grille légale du taux neutre ; fourni (même 0) → respecté.
  const pasAuto = input.tauxPAS === undefined;
  const tauxPAS = pasAuto ? tauxNeutre(netImposable) : Math.max(0, input.tauxPAS || 0);
  const montantPAS = r2((netImposable * tauxPAS) / 100);
  const netPaye = r2(netAvantImpot - montantPAS);
  const reductionGenerale = calculerReductionGenerale(brut);
  const coutEmployeur = r2(brut + totalPat - reductionGenerale);

  return {
    heuresMois,
    tauxHoraire,
    salaireBase,
    heuresSup25Montant,
    heuresSup50Montant,
    primes,
    brut,
    lignes,
    totalSal,
    totalPat,
    netAvantImpot,
    netImposable,
    netSocial,
    tauxPAS,
    montantPAS,
    pasAuto,
    netPaye,
    reductionGenerale,
    coutEmployeur,
  };
}

/**
 * Moteur de calcul d'un bulletin de paie (France) — version détaillée mais
 * indicative. Taux du régime général (non-cadre), à affiner avec les barèmes
 * URSSAF officiels en vigueur.
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
  netPaye: number;
  coutEmployeur: number;
};

// Plafond mensuel de la Sécurité sociale (indicatif).
const PMSS = 3925;

type Def = {
  categorie: Categorie;
  label: string;
  tauxSal: number;
  tauxPat: number;
  base: "brut" | "plafond" | "csg";
  deductible?: boolean;
};

const DEFS: Def[] = [
  { categorie: "Santé", label: "Sécurité sociale — Maladie, maternité", tauxSal: 0, tauxPat: 7.0, base: "brut" },
  { categorie: "Santé", label: "Complémentaire santé (mutuelle)", tauxSal: 0, tauxPat: 0, base: "brut" },
  { categorie: "Retraite", label: "Sécurité sociale — Vieillesse plafonnée", tauxSal: 6.9, tauxPat: 8.55, base: "plafond" },
  { categorie: "Retraite", label: "Sécurité sociale — Vieillesse déplafonnée", tauxSal: 0.4, tauxPat: 2.02, base: "brut" },
  { categorie: "Retraite", label: "Retraite complémentaire Agirc-Arrco (T1)", tauxSal: 3.15, tauxPat: 4.72, base: "plafond" },
  { categorie: "Retraite", label: "Contribution d'équilibre général (T1)", tauxSal: 0.86, tauxPat: 1.29, base: "plafond" },
  { categorie: "Famille / Accidents", label: "Allocations familiales", tauxSal: 0, tauxPat: 3.45, base: "brut" },
  { categorie: "Famille / Accidents", label: "Accident du travail", tauxSal: 0, tauxPat: 2.0, base: "brut" },
  { categorie: "Assurance chômage", label: "Assurance chômage", tauxSal: 0, tauxPat: 4.05, base: "brut" },
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
  const tauxPAS = Math.max(0, input.tauxPAS || 0);
  const montantPAS = r2((netImposable * tauxPAS) / 100);
  const netPaye = r2(netAvantImpot - montantPAS);
  const coutEmployeur = r2(brut + totalPat);

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
    netPaye,
    coutEmployeur,
  };
}

/**
 * Moteur de calcul d'un bulletin de paie (France) — version simplifiée mais
 * structurée. Taux indicatifs (régime général, non-cadre). À affiner avec les
 * barèmes URSSAF officiels en vigueur.
 */

export type FichePaieInput = {
  salaireBrut: number; // brut mensuel
  heuresSup?: number; // nombre d'heures sup (majorées 25%)
  tauxHoraire?: number; // si fourni, pour valoriser les heures sup
  primes?: number; // primes/indemnités du mois
};

export type LigneCotisation = {
  label: string;
  base: number;
  tauxSal: number; // %
  montSal: number;
  tauxPat: number; // %
  montPat: number;
  deductible: boolean; // déductible du net imposable
};

export type FichePaieResult = {
  brutBase: number;
  heuresSupMontant: number;
  primes: number;
  brut: number;
  lignes: LigneCotisation[];
  totalSal: number;
  totalPat: number;
  netAvantImpot: number;
  netImposable: number;
  coutEmployeur: number;
};

// Plafond mensuel de la Sécurité sociale (indicatif).
const PMSS = 3925;

type Def = {
  label: string;
  tauxSal: number;
  tauxPat: number;
  base: "brut" | "plafond" | "csg";
  deductible?: boolean; // défaut true
};

const DEFS: Def[] = [
  { label: "Sécurité sociale — Maladie", tauxSal: 0, tauxPat: 7.0, base: "brut" },
  { label: "Sécurité sociale — Vieillesse plafonnée", tauxSal: 6.9, tauxPat: 8.55, base: "plafond" },
  { label: "Sécurité sociale — Vieillesse déplafonnée", tauxSal: 0.4, tauxPat: 2.02, base: "brut" },
  { label: "Retraite complémentaire (T1)", tauxSal: 3.15, tauxPat: 4.72, base: "plafond" },
  { label: "Contribution d'équilibre général (T1)", tauxSal: 0.86, tauxPat: 1.29, base: "plafond" },
  { label: "Allocations familiales", tauxSal: 0, tauxPat: 3.45, base: "brut" },
  { label: "Assurance chômage", tauxSal: 0, tauxPat: 4.05, base: "brut" },
  { label: "AGS (garantie des salaires)", tauxSal: 0, tauxPat: 0.25, base: "brut" },
  { label: "Accident du travail", tauxSal: 0, tauxPat: 2.0, base: "brut" },
  { label: "FNAL", tauxSal: 0, tauxPat: 0.1, base: "brut" },
  { label: "Contribution solidarité autonomie", tauxSal: 0, tauxPat: 0.3, base: "brut" },
  { label: "CSG déductible", tauxSal: 6.8, tauxPat: 0, base: "csg" },
  { label: "CSG / CRDS non déductible", tauxSal: 2.9, tauxPat: 0, base: "csg", deductible: false },
];

const r2 = (n: number) => Math.round(n * 100) / 100;

export function calculerFichePaie(input: FichePaieInput): FichePaieResult {
  const brutBase = Math.max(0, input.salaireBrut || 0);
  const tauxHoraire = input.tauxHoraire || brutBase / 151.67;
  const heuresSupMontant = r2((input.heuresSup || 0) * tauxHoraire * 1.25);
  const primes = Math.max(0, input.primes || 0);
  const brut = r2(brutBase + heuresSupMontant + primes);

  const baseCsg = r2(brut * 0.9825);
  const basePlafond = Math.min(brut, PMSS);

  const lignes: LigneCotisation[] = DEFS.map((d) => {
    const base =
      d.base === "csg" ? baseCsg : d.base === "plafond" ? basePlafond : brut;
    return {
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
  const coutEmployeur = r2(brut + totalPat);

  return {
    brutBase,
    heuresSupMontant,
    primes,
    brut,
    lignes,
    totalSal,
    totalPat,
    netAvantImpot,
    netImposable,
    coutEmployeur,
  };
}

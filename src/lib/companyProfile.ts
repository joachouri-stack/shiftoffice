"use client";

import { useCallback, useSyncExternalStore } from "react";

export type FiscalRegime = "micro" | "societe";

/** Profil entreprise de l'artisan, repris automatiquement dans les documents. */
export type CompanyProfile = {
  name: string;
  trade: string; // métier
  email: string;
  phone: string;
  siret: string;
  vat: string; // n° TVA intracommunautaire
  address: string;
  postalCode: string;
  city: string;
  logo: string; // data URL (ou vide)
  // Régime & TVA (collectés à l'onboarding, mappés sur la table `profiles`)
  fiscalRegime: FiscalRegime;
  vatLiable: boolean; // assujetti à la TVA
  vatRate: number; // taux principal (0 si non assujetti, sinon 10 ou 20)
  onboardingComplete: boolean;
};

export const EMPTY_PROFILE: CompanyProfile = {
  name: "",
  trade: "",
  email: "",
  phone: "",
  siret: "",
  vat: "",
  address: "",
  postalCode: "",
  city: "",
  logo: "",
  fiscalRegime: "micro",
  vatLiable: false,
  vatRate: 0,
  onboardingComplete: false,
};

const STORAGE_KEY = "shiftoffice.company";
const EVENT = "shiftoffice:company";

/**
 * Petit store externe local-first. Conçu pour être remplacé plus tard par une
 * persistance cloud (Supabase) sans changer l'interface des composants.
 * Le snapshot est mis en cache pour fournir une référence stable à React.
 */
let cache: CompanyProfile | null = null;

function load(): CompanyProfile {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PROFILE;
    return { ...EMPTY_PROFILE, ...(JSON.parse(raw) as Partial<CompanyProfile>) };
  } catch {
    return EMPTY_PROFILE;
  }
}

function getSnapshot(): CompanyProfile {
  if (cache === null) cache = load();
  return cache;
}

function getServerSnapshot(): CompanyProfile {
  return EMPTY_PROFILE;
}

function subscribe(callback: () => void): () => void {
  const handler = () => {
    cache = load();
    callback();
  };
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function persist(profile: CompanyProfile) {
  cache = profile;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // quota dépassé (logo trop lourd) — ignoré silencieusement
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Hook React : lit/écrit le profil entreprise, synchronisé entre composants. */
export function useCompanyProfile() {
  const profile = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const save = useCallback((next: CompanyProfile) => persist(next), []);
  return { profile, save };
}

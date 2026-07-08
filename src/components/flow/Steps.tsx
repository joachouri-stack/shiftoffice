"use client";

import { useState } from "react";
import { ArrowRight, Building2, Plus, UserPlus } from "lucide-react";
import { SiretSearch } from "@/components/SiretSearch";
import { formatDateInput } from "@/lib/dates";
import {
  localStore,
  type LocalEntreprise,
  type LocalSalarie,
} from "@/lib/local/store";

export const FIELD =
  "border-or/30 bg-white text-noir placeholder:text-gris/50 focus:border-or focus:ring-or/15 h-12 w-full rounded-lg border px-3.5 text-base outline-none transition-all focus:ring-4";

/* ───────────── Barre de progression ───────────── */
export function ProgressBar({
  index,
  total,
  label,
}: {
  index: number;
  total: number;
  label: string;
}) {
  const pct = Math.round(((index + 1) / total) * 100);
  return (
    <div className="mb-5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-noir text-sm font-bold">
          Étape {index + 1} sur {total} — {label}
        </span>
        <span className="text-or-d text-sm font-extrabold">{pct}%</span>
      </div>
      <div className="bg-or/15 h-2 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: pct === 100 ? "#15803D" : "linear-gradient(90deg,#C9A24B,#FF6B2B)",
          }}
        />
      </div>
    </div>
  );
}

/* ───────────── Ligne récap ───────────── */
export function Row({
  label,
  value,
  strong,
  muted,
  pad,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
  pad?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${pad ? "py-2.5" : "py-1"}`}>
      <span className={`text-sm ${muted ? "text-gris" : "text-noir"}`}>{label}</span>
      <span
        className={`text-sm tabular-nums ${
          strong ? "text-noir text-base font-extrabold" : muted ? "text-gris" : "text-noir font-semibold"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* ───────────── Chips ───────────── */
export function Chips({
  label,
  value,
  options,
  fmt,
  onChange,
  allowCustom,
}: {
  label: string;
  value: number;
  options: number[];
  fmt: (v: number) => string;
  onChange: (v: number) => void;
  allowCustom?: boolean;
}) {
  const isCustom = allowCustom && !options.includes(value);
  return (
    <div>
      <label className="text-noir mb-2 block text-sm font-semibold">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              value === o ? "bg-noir text-white" : "bg-creme text-gris hover:text-noir"
            }`}
          >
            {fmt(o)}
          </button>
        ))}
        {allowCustom && (
          <input
            type="number"
            placeholder="Autre"
            value={isCustom ? value : ""}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className={`border-or/30 focus:border-or h-9 w-20 rounded-full border px-3 text-sm outline-none ${isCustom ? "bg-noir/5" : "bg-white"}`}
          />
        )}
      </div>
    </div>
  );
}

/* ───────────── Étape Entreprise (partagée) ───────────── */
export function EntrepriseStep({ onSave }: { onSave: (e: LocalEntreprise) => void }) {
  const [f, setF] = useState<LocalEntreprise>({
    nom: "", siret: "", adresse: "", codePostal: "", ville: "",
    convention: "", representantNom: "", representantQualite: "Gérant",
  });
  const set = (k: keyof LocalEntreprise, v: string) => setF((p) => ({ ...p, [k]: v }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (f.nom.trim()) onSave(f); }} className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 size={18} className="text-or-d" />
        <h3 className="text-noir font-display text-lg font-bold">Votre entreprise</h3>
      </div>
      <p className="text-gris -mt-2 text-xs">Saisie une seule fois — réutilisée pour tous vos documents.</p>
      <SiretSearch
        onSelect={(r) =>
          setF((p) => ({
            ...p,
            nom: r.nom || p.nom, siret: r.siret || p.siret, adresse: r.adresse || p.adresse,
            codePostal: r.codePostal || p.codePostal, ville: r.ville || p.ville,
            codeNaf: r.codeNaf || p.codeNaf, convention: r.convention || p.convention,
            representantNom: r.representantNom || p.representantNom,
            representantQualite: r.representantQualite || p.representantQualite,
          }))
        }
      />
      <div className="my-1 flex items-center gap-3 text-xs">
        <span className="bg-or/20 h-px flex-1" />
        <span className="text-gris">ou saisissez à la main</span>
        <span className="bg-or/20 h-px flex-1" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={FIELD} placeholder="Nom de l'entreprise *" value={f.nom} onChange={(e) => set("nom", e.target.value)} />
        <input className={FIELD} placeholder="SIRET" value={f.siret ?? ""} onChange={(e) => set("siret", e.target.value)} />
      </div>
      <input className={FIELD} placeholder="Adresse" value={f.adresse ?? ""} onChange={(e) => set("adresse", e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-3">
        <input className={FIELD} placeholder="Code postal" value={f.codePostal ?? ""} onChange={(e) => set("codePostal", e.target.value)} />
        <input className={FIELD} placeholder="Ville" value={f.ville ?? ""} onChange={(e) => set("ville", e.target.value)} />
        <input className={FIELD} placeholder="Convention (optionnel)" value={f.convention ?? ""} onChange={(e) => set("convention", e.target.value)} />
      </div>
      <p className="text-gris text-xs">
        La convention collective se remplit automatiquement via la recherche
        ci-dessus. Vous ne la connaissez pas&nbsp;? Laissez vide — elle figure
        sur une ancienne fiche de paie ou sur le contrat de travail.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={FIELD} placeholder="Représentant (ex. Jean Martin)" value={f.representantNom ?? ""} onChange={(e) => set("representantNom", e.target.value)} />
        <input className={FIELD} placeholder="Qualité (Gérant…)" value={f.representantQualite ?? ""} onChange={(e) => set("representantQualite", e.target.value)} />
      </div>
      <div className="flex justify-end">
        <button type="submit" className="bg-noir inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white">
          Continuer <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}

/* ───────────── Étape Salarié (partagée) ───────────── */
export function SalarieStep({ onSelect }: { onSelect: (s: LocalSalarie) => void }) {
  const existing = localStore.getSalaries();
  const [creating, setCreating] = useState(existing.length === 0);
  const [f, setF] = useState({
    nom: "", poste: "", salaire: "", numeroSecu: "", email: "",
    adresse: "", dateEntree: "", typeContrat: "CDI", classification: "",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  if (!creating) {
    return (
      <div className="space-y-4">
        <h3 className="text-noir font-display text-lg font-bold">Quel salarié ?</h3>
        <ul className="divide-or/10 divide-y">
          {existing.map((s) => (
            <li key={s.id}>
              <button onClick={() => onSelect(s)} className="hover:bg-or/5 flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left">
                <span>
                  <span className="text-noir block text-sm font-semibold">{s.nom}</span>
                  <span className="text-gris block text-xs">{[s.poste, s.salaireBrut ? `${s.salaireBrut.toLocaleString("fr-FR")} € brut` : null].filter(Boolean).join(" · ") || "—"}</span>
                </span>
                <ArrowRight size={16} className="text-or-d" />
              </button>
            </li>
          ))}
        </ul>
        <button onClick={() => setCreating(true)} className="border-or/30 text-or-d hover:bg-or/5 inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed px-4 py-2.5 text-sm font-bold">
          <UserPlus size={16} /> Nouveau salarié
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.nom.trim()) return;
        const created = localStore.addSalarie({
          nom: f.nom.trim(),
          poste: f.poste.trim() || undefined,
          salaireBrut: f.salaire ? parseFloat(f.salaire.replace(",", ".")) : undefined,
          numeroSecu: f.numeroSecu.trim() || undefined,
          email: f.email.trim() || undefined,
          adresse: f.adresse.trim() || undefined,
          dateEntree: f.dateEntree.trim() || undefined,
          typeContrat: f.typeContrat,
          classification: f.classification.trim() || undefined,
        });
        onSelect(created);
      }}
      className="space-y-4"
    >
      <h3 className="text-noir font-display text-lg font-bold">Le salarié</h3>
      <p className="text-gris -mt-2 text-xs">Saisi une fois — repris automatiquement sur chaque document.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={FIELD} placeholder="Nom et prénom *" value={f.nom} onChange={(e) => set("nom", e.target.value)} />
        <input className={FIELD} placeholder="Poste" value={f.poste} onChange={(e) => set("poste", e.target.value)} />
      </div>
      <input className={FIELD} placeholder="Adresse du salarié" value={f.adresse} onChange={(e) => set("adresse", e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={FIELD} placeholder="Salaire brut mensuel (€)" inputMode="decimal" value={f.salaire} onChange={(e) => set("salaire", e.target.value)} />
        <input className={FIELD} placeholder="N° de sécurité sociale" value={f.numeroSecu} onChange={(e) => set("numeroSecu", e.target.value)} />
      </div>
      <input className={FIELD} type="email" placeholder="Email du salarié (pour l'envoi)" value={f.email} onChange={(e) => set("email", e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-3">
        <input className={FIELD} placeholder="Date d'entrée" value={f.dateEntree} onChange={(e) => set("dateEntree", formatDateInput(e.target.value, f.dateEntree))} />
        <select className={FIELD} value={f.typeContrat} onChange={(e) => set("typeContrat", e.target.value)}>
          <option value="CDI">CDI</option>
          <option value="CDD">CDD</option>
        </select>
        <input className={FIELD} placeholder="Classification (optionnel)" value={f.classification} onChange={(e) => set("classification", e.target.value)} />
      </div>
      <p className="text-gris text-xs">
        La classification (ex. «&nbsp;Employé Niveau II&nbsp;») figure sur le
        contrat de travail — laissez vide si vous ne la connaissez pas.
      </p>
      <div className="flex items-center justify-between">
        {existing.length > 0 ? (
          <button type="button" onClick={() => setCreating(false)} className="text-gris hover:text-noir text-sm font-semibold">
            ← Choisir un salarié existant
          </button>
        ) : <span />}
        <button type="submit" className="bg-noir inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white">
          <Plus size={16} /> Continuer
        </button>
      </div>
    </form>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Loader2,
  Plus,
  Sparkles,
  TriangleAlert,
  Building2,
  UserPlus,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { SiretSearch } from "@/components/SiretSearch";
import {
  calculerFichePaie,
  brutPourNetAvantImpot,
  SMIC_MENSUEL,
} from "@/lib/paie/calcul";
import {
  localStore,
  type LocalEntreprise,
  type LocalSalarie,
} from "@/lib/local/store";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const LABELS: Record<string, string> = {
  entreprise: "Votre entreprise",
  salarie: "Le salarié",
  remuneration: "La rémunération",
  periode: "La période",
  verification: "Vérification",
};

const eur = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

const FIELD =
  "border-or/30 bg-white text-noir placeholder:text-gris/50 focus:border-or focus:ring-or/15 h-12 w-full rounded-lg border px-3.5 text-base outline-none transition-all focus:ring-4";

export default function FicheDePaieFlow() {
  const now = new Date();
  const [ready, setReady] = useState(false);
  const [ent, setEnt] = useState<LocalEntreprise | null>(null);
  const [sal, setSal] = useState<LocalSalarie | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [i, setI] = useState(0);

  // Rémunération
  const [mode, setMode] = useState<"brut" | "net">("brut");
  const [brut, setBrut] = useState("");
  const [net, setNet] = useState("");
  const [heures, setHeures] = useState("151.67");
  const [heuresSup, setHeuresSup] = useState(0);
  const [primes, setPrimes] = useState(0);

  // Période
  const [mois, setMois] = useState(MOIS[now.getMonth()]);
  const [annee, setAnnee] = useState(String(now.getFullYear()));
  const [conges, setConges] = useState(0);

  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [repris, setRepris] = useState<string | null>(null);

  // Mois suivant à partir d'un libellé mois + année.
  const nextPeriod = (m?: string, a?: string) => {
    const idx = m ? MOIS.indexOf(m) : -1;
    if (idx < 0 || !a) return null;
    const ni = (idx + 1) % 12;
    const ny = ni === 0 ? Number(a) + 1 : Number(a);
    return { mois: MOIS[ni], annee: String(ny) };
  };

  // Reprise : pré-remplit la rémunération depuis la dernière fiche du salarié
  // et avance la période au mois suivant.
  const appliquerReprise = (s: LocalSalarie) => {
    const last = localStore.lastFicheForSalarie(s.id);
    if (!last) {
      if (s.salaireBrut) setBrut(String(s.salaireBrut));
      return;
    }
    setMode("brut");
    setBrut(String(last.brut ?? s.salaireBrut ?? ""));
    if (last.heures) setHeures(last.heures);
    setHeuresSup(last.heuresSup ?? 0);
    setPrimes(last.primes ?? 0);
    setConges(last.conges ?? 0);
    const np = nextPeriod(last.mois, last.annee);
    if (np) {
      setMois(np.mois);
      setAnnee(np.annee);
    }
    setRepris(last.periode);
  };

  useEffect(() => {
    const e = localStore.getEntreprise();
    setEnt(e);
    const id = new URLSearchParams(window.location.search).get("s");
    const found = id ? localStore.getSalaries().find((x) => x.id === id) : null;
    if (found) {
      setSal(found);
      appliquerReprise(found);
    }
    const list: string[] = [];
    if (!e) list.push("entreprise");
    if (!found) list.push("salarie");
    list.push("remuneration", "periode", "verification");
    setSteps(list);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const n = (v: string) => parseFloat(v.replace(",", ".")) || 0;
  const enNet = mode === "net";
  const brutEff = useMemo(
    () => (enNet ? brutPourNetAvantImpot(n(net)) : n(brut)),
    [enNet, net, brut]
  );
  const res = useMemo(
    () =>
      brutEff > 0
        ? calculerFichePaie({ salaireBrut: brutEff, heuresMois: n(heures), heuresSup, primes })
        : null,
    [brutEff, heures, heuresSup, primes]
  );

  if (!ready) return null;

  const key = steps[i] ?? "verification";
  const pct = Math.round(((i + 1) / steps.length) * 100);
  const goNext = () => setI((v) => Math.min(steps.length - 1, v + 1));
  const goBack = () => setI((v) => Math.max(0, v - 1));

  async function generer() {
    if (!res || busy) return;
    setBusy(true);
    setErr("");
    try {
      const donnees = {
        entrepriseNom: ent?.nom ?? "",
        entrepriseAdresse: [ent?.adresse, [ent?.codePostal, ent?.ville].filter(Boolean).join(" ")]
          .filter(Boolean)
          .join(", "),
        siret: ent?.siret ?? "",
        codeApe: ent?.codeNaf ?? "",
        conventionCollective: ent?.convention ?? "",
        salarieNom: sal?.nom ?? "",
        poste: sal?.poste ?? "",
        typeContrat: sal?.typeContrat ?? "",
        numeroSecu: sal?.numeroSecu ?? "",
        dateEntree: sal?.dateEntree ?? "",
        classification: sal?.classification ?? "",
        periode: `${mois} ${annee}`,
        salaireBrut: String(brutEff),
        heuresMois: heures,
        heuresSup: String(heuresSup),
        heuresSup50: "0",
        primes: String(primes),
        tauxPAS: "0",
        congesPris: String(conges),
        congesAcquis: "0",
      };
      const r = await fetch("/api/documents/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type_document: "fiche-paie", donnees }),
      });
      if (!r.ok) {
        setErr(
          r.status === 402
            ? "Paiement requis (Stripe activé) — à brancher au flux de paiement."
            : "La génération a échoué. Réessayez."
        );
        setBusy(false);
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fiche-${(sal?.nom ?? "salarie").replace(/\s+/g, "-").toLowerCase()}-${mois.toLowerCase()}-${annee}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      localStore.addFiche({
        salarieId: sal?.id,
        salarieNom: sal?.nom ?? "Salarié",
        periode: `${mois} ${annee}`,
        mois,
        annee,
        brut: res.brut,
        net: res.netPaye,
        heures,
        heuresSup,
        primes,
        conges,
        creeLe: new Date().toISOString(),
      });
      setDone(true);
    } catch {
      setErr("La génération a échoué. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-creme min-h-dvh">
      <header className="bg-noir">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4 sm:px-6">
          <Link href="/"><Logo theme="dark" /></Link>
          <Link href="/espace" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white">
            Mon espace
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {/* Progression */}
        <div className="mb-5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-noir text-sm font-bold">
              Étape {i + 1} sur {steps.length} — {LABELS[key]}
            </span>
            <span className="text-or-d text-sm font-extrabold">{pct}%</span>
          </div>
          <div className="bg-or/15 h-2 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: pct === 100 ? "#15803D" : "linear-gradient(90deg,#C9A24B,#FF6B2B)" }}
            />
          </div>
        </div>

        {/* Fil d'ariane des infos connues */}
        {(ent || sal) && (
          <div className="text-gris mb-4 text-sm">
            {ent?.nom && <>{ent.nom}</>}
            {sal?.nom && <> · Fiche de <strong className="text-noir">{sal.nom}</strong></>}
          </div>
        )}

        <div className="border-or/20 rounded-2xl border bg-white p-5 sm:p-6">
          {key === "entreprise" && (
            <EntrepriseStep
              onSave={(e) => {
                localStore.setEntreprise(e);
                setEnt(e);
                goNext();
              }}
            />
          )}

          {key === "salarie" && (
            <SalarieStep
              onSelect={(s) => {
                setSal(s);
                appliquerReprise(s);
                goNext();
              }}
            />
          )}

          {key === "remuneration" && (
            <div className="space-y-5">
              {repris && (
                <div className="border-or/30 bg-or/5 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <Sparkles size={15} className="text-or-d shrink-0" />
                  <span className="text-noir font-medium">
                    Repris depuis la fiche de <strong>{repris}</strong> — vérifiez et validez.
                  </span>
                </div>
              )}
              <div className="bg-creme inline-flex rounded-lg p-1">
                {(["brut", "net"] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={`rounded-md px-4 py-1.5 text-sm font-bold transition-colors ${mode === m ? "bg-noir text-white" : "text-gris"}`}>
                    {m === "brut" ? "Je saisis le brut" : "Je saisis le net"}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-noir mb-1.5 block text-sm font-semibold">
                  {enNet ? "Net à payer souhaité (€)" : "Salaire brut mensuel (€)"}
                </label>
                <input className={FIELD} inputMode="decimal" placeholder={enNet ? "1700" : "2200"} value={enNet ? net : brut} onChange={(e) => (enNet ? setNet(e.target.value) : setBrut(e.target.value))} />
                {enNet && brutEff > 0 && (
                  <p className="text-gris mt-1.5 text-xs">Brut calculé : <strong className="text-noir">{eur(brutEff)}</strong></p>
                )}
              </div>
              <div>
                <label className="text-noir mb-1.5 block text-sm font-semibold">Heures mensuelles</label>
                <input className={FIELD} inputMode="decimal" value={heures} onChange={(e) => setHeures(e.target.value)} />
              </div>
              <Chips label="Heures supplémentaires (25 %)" value={heuresSup} options={[0, 2, 5, 10]} fmt={(v) => (v === 0 ? "Aucune" : `${v} h`)} onChange={setHeuresSup} allowCustom />
              <Chips label="Prime ce mois" value={primes} options={[0, 50, 100, 200]} fmt={(v) => (v === 0 ? "Aucune" : `${v} €`)} onChange={setPrimes} allowCustom />
              {res && (
                <div className="border-or/30 bg-or/5 rounded-xl border p-4">
                  <p className="text-or-d mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
                    <Sparkles size={13} /> Aperçu en direct
                  </p>
                  <Row label="Salaire brut" value={eur(res.brut)} />
                  <Row label="Cotisations salariales" value={"- " + eur(res.totalSal)} muted />
                  <div className="bg-or/20 my-2 h-px" />
                  <Row label="Net à payer" value={eur(res.netPaye)} strong />
                  <Row label="Net imposable" value={eur(res.netImposable)} muted />
                </div>
              )}
              {res && res.brut > 0 && res.brut < SMIC_MENSUEL && (
                <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                  Ce brut ({eur(res.brut)}) est sous le SMIC 2026 ({eur(SMIC_MENSUEL)}). Normal seulement pour un temps partiel ou un apprenti.
                </p>
              )}
            </div>
          )}

          {key === "periode" && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-noir mb-1.5 block text-sm font-semibold">Mois</label>
                  <select className={FIELD} value={mois} onChange={(e) => setMois(e.target.value)}>
                    {MOIS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-noir mb-1.5 block text-sm font-semibold">Année</label>
                  <input className={FIELD} inputMode="numeric" value={annee} onChange={(e) => setAnnee(e.target.value)} />
                </div>
              </div>
              <Chips label="Congés pris ce mois" value={conges} options={[0, 5, 10, 15, 20, 25]} fmt={(v) => (v === 0 ? "Aucun" : `${v} j`)} onChange={setConges} />
            </div>
          )}

          {key === "verification" && (
            done ? (
              <div className="py-6 text-center">
                <div className="bg-vert-l text-vert mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full">
                  <Check size={24} />
                </div>
                <p className="text-noir text-lg font-bold">Fiche générée 🎉</p>
                <p className="text-gris mt-1 text-sm">Le PDF a été téléchargé et ajouté à votre espace.</p>
                <Link href="/espace" className="bg-noir mt-5 inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white">
                  Voir mon espace
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-noir font-display text-lg font-bold">Récapitulatif</h3>
                <div className="divide-or/10 divide-y">
                  <Row label="Entreprise" value={ent?.nom ?? "—"} pad />
                  <Row label="Salarié" value={sal?.nom ?? "—"} pad />
                  <Row label="Période" value={`${mois} ${annee}`} pad />
                  <Row label="Salaire brut" value={res ? eur(res.brut) : "—"} pad />
                  {heuresSup > 0 && <Row label="Heures sup (25 %)" value={`${heuresSup} h`} pad />}
                  {primes > 0 && <Row label="Prime" value={eur(primes)} pad />}
                  {conges > 0 && <Row label="Congés pris" value={`${conges} j`} pad />}
                  <Row label="Net à payer" value={res ? eur(res.netPaye) : "—"} pad strong />
                  <Row label="Coût employeur" value={res ? eur(res.coutEmployeur) : "—"} pad muted />
                </div>
                {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
                <button onClick={generer} disabled={busy || !res} className="bg-orange hover:bg-orange-d inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-base font-bold text-white disabled:opacity-50">
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  Générer la fiche de paie
                </button>
              </div>
            )
          )}

          {/* Navigation (sauf étapes à formulaire propre : entreprise, salarié) */}
          {!done && key !== "entreprise" && key !== "salarie" && (
            <div className="mt-6 flex items-center justify-between">
              <button onClick={goBack} disabled={i === 0} className="text-gris hover:text-noir inline-flex items-center gap-1.5 text-sm font-semibold disabled:opacity-0">
                <ArrowLeft size={16} /> Précédent
              </button>
              {key !== "verification" && (
                <button onClick={goNext} disabled={key === "remuneration" && !(brutEff > 0)} className="bg-noir inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">
                  Continuer <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Étape Entreprise ---------- */
function EntrepriseStep({ onSave }: { onSave: (e: LocalEntreprise) => void }) {
  const [f, setF] = useState<LocalEntreprise>({ nom: "", siret: "", adresse: "", codePostal: "", ville: "", convention: "" });
  const set = (k: keyof LocalEntreprise, v: string) => setF((p) => ({ ...p, [k]: v }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (f.nom.trim()) onSave(f); }} className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 size={18} className="text-or-d" />
        <h3 className="text-noir font-display text-lg font-bold">Votre entreprise</h3>
      </div>
      <p className="text-gris -mt-2 text-xs">Saisie une seule fois — réutilisée pour toutes vos fiches.</p>
      <SiretSearch
        onSelect={(r) =>
          setF((p) => ({
            ...p,
            nom: r.nom || p.nom,
            siret: r.siret || p.siret,
            adresse: r.adresse || p.adresse,
            codePostal: r.codePostal || p.codePostal,
            ville: r.ville || p.ville,
            codeNaf: r.codeNaf || p.codeNaf,
            convention: r.convention || p.convention,
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
        <input className={FIELD} placeholder="Convention" value={f.convention ?? ""} onChange={(e) => set("convention", e.target.value)} />
      </div>
      <div className="flex justify-end">
        <button type="submit" className="bg-noir inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white">
          Continuer <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}

/* ---------- Étape Salarié ---------- */
function SalarieStep({ onSelect }: { onSelect: (s: LocalSalarie) => void }) {
  const existing = localStore.getSalaries();
  const [creating, setCreating] = useState(existing.length === 0);
  const [f, setF] = useState({ nom: "", poste: "", salaire: "", numeroSecu: "", dateEntree: "", typeContrat: "CDI", classification: "" });
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
          dateEntree: f.dateEntree.trim() || undefined,
          typeContrat: f.typeContrat,
          classification: f.classification.trim() || undefined,
        });
        onSelect(created);
      }}
      className="space-y-4"
    >
      <h3 className="text-noir font-display text-lg font-bold">Le salarié</h3>
      <p className="text-gris -mt-2 text-xs">Saisi une fois — repris automatiquement sur chaque fiche.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={FIELD} placeholder="Nom et prénom *" value={f.nom} onChange={(e) => set("nom", e.target.value)} />
        <input className={FIELD} placeholder="Poste" value={f.poste} onChange={(e) => set("poste", e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={FIELD} placeholder="Salaire brut mensuel (€)" inputMode="decimal" value={f.salaire} onChange={(e) => set("salaire", e.target.value)} />
        <input className={FIELD} placeholder="N° de sécurité sociale" value={f.numeroSecu} onChange={(e) => set("numeroSecu", e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <input className={FIELD} placeholder="Date d'entrée" value={f.dateEntree} onChange={(e) => set("dateEntree", e.target.value)} />
        <select className={FIELD} value={f.typeContrat} onChange={(e) => set("typeContrat", e.target.value)}>
          <option value="CDI">CDI</option>
          <option value="CDD">CDD</option>
        </select>
        <input className={FIELD} placeholder="Classification" value={f.classification} onChange={(e) => set("classification", e.target.value)} />
      </div>
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

/* ---------- Helpers ---------- */
function Row({ label, value, strong, muted, pad }: { label: string; value: string; strong?: boolean; muted?: boolean; pad?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${pad ? "py-2.5" : "py-1"}`}>
      <span className={`text-sm ${muted ? "text-gris" : "text-noir"}`}>{label}</span>
      <span className={`text-sm tabular-nums ${strong ? "text-noir text-base font-extrabold" : muted ? "text-gris" : "text-noir font-semibold"}`}>{value}</span>
    </div>
  );
}

function Chips({ label, value, options, fmt, onChange, allowCustom }: { label: string; value: number; options: number[]; fmt: (v: number) => string; onChange: (v: number) => void; allowCustom?: boolean }) {
  const isCustom = allowCustom && !options.includes(value);
  return (
    <div>
      <label className="text-noir mb-2 block text-sm font-semibold">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${value === o ? "bg-noir text-white" : "bg-creme text-gris hover:text-noir"}`}>
            {fmt(o)}
          </button>
        ))}
        {allowCustom && (
          <input type="number" placeholder="Autre" value={isCustom ? value : ""} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className={`border-or/30 focus:border-or h-9 w-20 rounded-full border px-3 text-sm outline-none ${isCustom ? "bg-noir/5" : "bg-white"}`} />
        )}
      </div>
    </div>
  );
}

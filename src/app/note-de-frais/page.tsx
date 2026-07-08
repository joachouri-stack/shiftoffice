"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Download, Loader2, Plus, Trash2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { EmailCopy } from "@/components/documents/EmailCopy";
import { EntrepriseStep, Row, ProgressBar, FIELD } from "@/components/flow/Steps";
import { localStore, type LocalEntreprise } from "@/lib/local/store";
import { adresseComplete } from "@/lib/adresse";
import { formatDateInput } from "@/lib/dates";

const LABELS: Record<string, string> = {
  entreprise: "Votre entreprise",
  demandeur: "Le demandeur",
  periode: "La période",
  depenses: "Les dépenses",
  verification: "Vérification",
};

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const QUALITES = ["Salarié", "Dirigeant", "Gérant"];
const CATEGORIES = ["Repas", "Carburant", "Transport", "Hôtel", "Fournitures", "Téléphone", "Autre"];
const TVA_RATES = [20, 10, 5.5, 0];

type Ligne = { date: string; nature: string; montant: string; tva: number };

const eur = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

function todayFr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function NoteFraisFlow() {
  const [ready, setReady] = useState(false);
  const [ent, setEnt] = useState<LocalEntreprise | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [i, setI] = useState(0);

  const [demandeurNom, setDemandeurNom] = useState("");
  const [qualite, setQualite] = useState(QUALITES[0]);
  const [mois, setMois] = useState(MOIS[0]);
  const [annee, setAnnee] = useState("");
  const [lignes, setLignes] = useState<Ligne[]>([
    { date: "", nature: "", montant: "", tva: 20 },
  ]);

  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [lastDonnees, setLastDonnees] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const e = localStore.getEntreprise();
    setEnt(e);
    const now = new Date();
    setMois(MOIS[now.getMonth()]);
    setAnnee(String(now.getFullYear()));
    const list: string[] = [];
    if (!e) list.push("entreprise");
    list.push("demandeur", "periode", "depenses", "verification");
    setSteps(list);
    setReady(true);
  }, []);

  const n = (v: string) => parseFloat(v.replace(",", ".")) || 0;

  // Calcul HT / TVA / TTC à partir des montants TTC saisis.
  const totaux = useMemo(() => {
    const t = lignes.reduce(
      (acc, l) => {
        const ttc = n(l.montant);
        const tva = ttc * (l.tva / (100 + l.tva));
        const ht = ttc - tva;
        return { ht: acc.ht + ht, tva: acc.tva + tva, ttc: acc.ttc + ttc };
      },
      { ht: 0, tva: 0, ttc: 0 }
    );
    return {
      ht: Math.round(t.ht * 100) / 100,
      tva: Math.round(t.tva * 100) / 100,
      ttc: Math.round(t.ttc * 100) / 100,
    };
  }, [lignes]);

  if (!ready) return null;

  const key = steps[i] ?? "verification";
  const goNext = () => setI((v) => Math.min(steps.length - 1, v + 1));
  const goBack = () => setI((v) => Math.max(0, v - 1));
  const setLigne = (idx: number, k: keyof Ligne, v: string | number) =>
    setLignes((p) => p.map((l, j) => (j === idx ? { ...l, [k]: v } : l)));
  const periode = `${mois} ${annee}`.trim();

  async function generer() {
    if (busy) return;
    setBusy(true);
    setErr("");
    const donnees = {
      entrepriseNom: ent?.nom ?? "",
      entrepriseAdresse: adresseComplete(ent?.adresse, ent?.codePostal, ent?.ville),
      siret: ent?.siret ?? "",
      demandeurNom,
      demandeurQualite: qualite,
      periode,
      lignes: lignes
        .filter((l) => n(l.montant) > 0)
        .map((l) => ({ date: l.date, nature: l.nature, montantTTC: n(l.montant), tauxTVA: l.tva })),
      ville: ent?.ville ?? "",
      date: todayFr(),
    };
    const filename = `note-de-frais-${(demandeurNom || "demandeur").replace(/\s+/g, "-").toLowerCase()}.pdf`;
    const docMeta = {
      type: "note-de-frais",
      titre: "Note de frais",
      libelle: [demandeurNom, periode].filter(Boolean).join(" · "),
      montant: totaux.ttc,
      refaireHref: "/note-de-frais",
      creeLe: new Date().toISOString(),
    };
    setLastDonnees(donnees);
    try {
      const co = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "note-de-frais", slug: "note-de-frais" }),
      });
      const cod = (await co.json().catch(() => ({}))) as { url?: string; paymentDisabled?: boolean; error?: string };
      if (cod?.url) {
        sessionStorage.setItem(
          "shiftoffice:pending:note-de-frais",
          JSON.stringify({ type: "note-de-frais", donnees, filename, docMeta })
        );
        window.location.assign(cod.url);
        return;
      }
      if (!cod?.paymentDisabled) {
        setErr(cod?.error ?? "Le paiement n'a pas pu démarrer. Réessayez dans un instant.");
        setBusy(false);
        return;
      }
      const r = await fetch("/api/documents/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type_document: "note-de-frais", donnees }),
      });
      if (!r.ok) {
        setErr("La génération a échoué. Réessayez.");
        setBusy(false);
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      localStore.addDocument(docMeta);
      setDone(true);
    } catch {
      setErr("La génération a échoué. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const L = ({ children }: { children: string }) => (
    <label className="text-noir mb-1.5 block text-sm font-semibold">{children}</label>
  );

  return (
    <div className="bg-creme min-h-dvh">
      <header className="bg-noir">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4 sm:px-6">
          <Logo theme="dark" />
          <Link href="/espace" className="text-sm font-semibold text-white/70 hover:text-white">Mon espace</Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <ProgressBar index={i} total={steps.length} label={LABELS[key]} />

        {ent?.nom && <div className="text-gris mb-4 text-sm">{ent.nom}</div>}

        <div className="border-or/20 rounded-2xl border bg-white p-5 sm:p-6">
          {key === "entreprise" && (
            <EntrepriseStep onSave={(e) => { localStore.setEntreprise(e); setEnt(e); goNext(); }} />
          )}

          {key === "demandeur" && (
            <div className="space-y-5">
              <div>
                <L>Nom et prénom du demandeur</L>
                <input className={FIELD} placeholder="Ex. Marc Petit" value={demandeurNom} onChange={(e) => setDemandeurNom(e.target.value)} />
                {localStore.getSalaries().length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {localStore.getSalaries().map((s) => (
                      <button key={s.id} type="button" onClick={() => setDemandeurNom(s.nom)} className="bg-creme text-gris hover:text-noir rounded-full px-3 py-1 text-xs font-semibold">
                        {s.nom}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <L>Qualité</L>
                <div className="flex flex-wrap gap-2">
                  {QUALITES.map((q) => (
                    <button key={q} type="button" onClick={() => setQualite(q)} className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${qualite === q ? "bg-noir text-white" : "bg-creme text-gris hover:text-noir"}`}>{q}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {key === "periode" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div><L>Mois concerné</L>
                <select className={FIELD} value={mois} onChange={(e) => setMois(e.target.value)}>
                  {MOIS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div><L>Année</L><input className={FIELD} inputMode="numeric" value={annee} onChange={(e) => setAnnee(e.target.value)} /></div>
            </div>
          )}

          {key === "depenses" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-noir font-display text-lg font-bold">Les dépenses</h3>
                <span className="text-gris text-sm">Total TTC : <strong className="text-noir">{eur(totaux.ttc)}</strong></span>
              </div>
              {lignes.map((l, idx) => (
                <div key={idx} className="border-or/20 space-y-2.5 rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gris text-xs font-bold">Dépense {idx + 1}</span>
                    {lignes.length > 1 && (
                      <button type="button" onClick={() => setLignes((p) => p.filter((_, j) => j !== idx))} className="text-gris hover:text-red-600"><Trash2 size={14} /></button>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input className={FIELD} placeholder="Date (ex. 03/06)" value={l.date} onChange={(e) => setLigne(idx, "date", formatDateInput(e.target.value, l.date, true))} />
                    <input className={FIELD} inputMode="decimal" placeholder="Montant TTC (€)" value={l.montant} onChange={(e) => setLigne(idx, "montant", e.target.value)} />
                  </div>
                  <input className={FIELD} placeholder="Nature (ex. Repas client)" value={l.nature} onChange={(e) => setLigne(idx, "nature", e.target.value)} />
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((c) => (
                      <button key={c} type="button" onClick={() => setLigne(idx, "nature", c)} className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${l.nature === c ? "bg-noir text-white" : "bg-creme text-gris hover:text-noir"}`}>{c}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gris text-xs font-semibold">TVA :</span>
                    {TVA_RATES.map((t) => (
                      <button key={t} type="button" onClick={() => setLigne(idx, "tva", t)} className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${l.tva === t ? "bg-or text-white" : "bg-creme text-gris hover:text-noir"}`}>{t} %</button>
                    ))}
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setLignes((p) => [...p, { date: "", nature: "", montant: "", tva: 20 }])} className="border-or/30 text-or-d hover:bg-or/5 inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed px-4 py-2.5 text-sm font-bold">
                <Plus size={16} /> Ajouter une dépense
              </button>
            </div>
          )}

          {key === "verification" && (
            done ? (
              <div className="py-6 text-center">
                <div className="bg-vert-l text-vert mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full"><Check size={24} /></div>
                <p className="text-noir text-lg font-bold">Note de frais générée 🎉</p>
                <p className="text-gris mt-1 text-sm">Le PDF a été téléchargé.</p>
                {lastDonnees && <div className="mt-5 text-left"><EmailCopy type="note-de-frais" donnees={lastDonnees} defaultEmail="" /></div>}
                <Link href="/espace" className="bg-noir mt-5 inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white">Mon espace</Link>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-noir font-display text-lg font-bold">Récapitulatif</h3>
                <div className="divide-or/10 divide-y">
                  <Row label="Demandeur" value={[demandeurNom || "—", qualite].join(" · ")} pad />
                  <Row label="Période" value={periode} pad />
                  <Row label="Dépenses" value={String(lignes.filter((l) => n(l.montant) > 0).length)} pad />
                  <Row label="Total HT" value={eur(totaux.ht)} pad />
                  <Row label="Total TVA" value={eur(totaux.tva)} pad />
                  <Row label="Total TTC" value={eur(totaux.ttc)} pad strong />
                </div>
                {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
                <button onClick={generer} disabled={busy || totaux.ttc <= 0} className="bg-orange hover:bg-orange-d inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-base font-bold text-white disabled:opacity-50">
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  Générer et payer 3€
                </button>
              </div>
            )
          )}

          {!done && key !== "entreprise" && (
            <div className="mt-6 flex items-center justify-between">
              <button onClick={goBack} disabled={i === 0} className="text-gris hover:text-noir inline-flex items-center gap-1.5 text-sm font-semibold disabled:opacity-0"><ArrowLeft size={16} /> Précédent</button>
              {key !== "verification" && (
                <button onClick={goNext} className="bg-noir inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white">Continuer <ArrowRight size={16} /></button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Download, Loader2, Home as HomeIcon, Plus } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { EmailCopy } from "@/components/documents/EmailCopy";
import { Row, ProgressBar, FIELD } from "@/components/flow/Steps";
import { localStore, type LocalBien } from "@/lib/local/store";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const LABELS: Record<string, string> = {
  bien: "Le logement",
  periode: "La période",
  verification: "Vérification",
};

const eur = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

function todayFr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function QuittanceLoyerFlow() {
  const now = new Date();
  const [ready, setReady] = useState(false);
  const [bien, setBien] = useState<LocalBien | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [i, setI] = useState(0);

  const [mois, setMois] = useState(MOIS[now.getMonth()]);
  const [annee, setAnnee] = useState(String(now.getFullYear()));
  const [datePaiement, setDatePaiement] = useState(todayFr());

  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [lastDonnees, setLastDonnees] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("b");
    const found = id ? localStore.getBiens().find((x) => x.id === id) : null;
    if (found) setBien(found);
    const list: string[] = [];
    if (!found) list.push("bien");
    list.push("periode", "verification");
    setSteps(list);
    setReady(true);
  }, []);

  const total = useMemo(() => (bien?.loyer ?? 0) + (bien?.charges ?? 0), [bien]);

  if (!ready) return null;

  const key = steps[i] ?? "verification";
  const goNext = () => setI((v) => Math.min(steps.length - 1, v + 1));
  const goBack = () => setI((v) => Math.max(0, v - 1));

  async function generer() {
    if (busy || !bien) return;
    setBusy(true);
    setErr("");
    const donnees = {
      bailleurNom: bien.bailleurNom,
      bailleurAdresse: bien.bailleurAdresse ?? "",
      locataire: bien.locataire,
      adresseBien: bien.adresseBien ?? "",
      periode: `${mois} ${annee}`,
      loyer: String(bien.loyer ?? 0),
      charges: String(bien.charges ?? 0),
      ville: bien.ville ?? "",
      datePaiement,
    };
    const filename = `quittance-${(bien.locataire || "loyer").replace(/\s+/g, "-").toLowerCase()}-${mois.toLowerCase()}-${annee}.pdf`;
    const docMeta = {
      type: "quittance-loyer",
      titre: "Quittance de loyer",
      libelle: `${bien.locataire} · ${mois} ${annee}`,
      montant: total,
      refaireHref: `/quittance-loyer?b=${bien.id}`,
      creeLe: new Date().toISOString(),
    };
    setLastDonnees(donnees);
    try {
      const r = await fetch("/api/documents/generer-gratuit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type_document: "quittance-loyer", donnees }),
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

  return (
    <div className="bg-creme min-h-dvh">
      <header className="bg-noir">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4 sm:px-6">
          <Link href="/"><Logo theme="dark" /></Link>
          <Link href="/espace" className="text-sm font-semibold text-white/70 hover:text-white">Mon espace</Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <ProgressBar index={i} total={steps.length} label={LABELS[key]} />

        {bien && (
          <div className="text-gris mb-4 text-sm">
            Quittance pour <strong className="text-noir">{bien.locataire}</strong>
          </div>
        )}

        <div className="border-or/20 rounded-2xl border bg-white p-5 sm:p-6">
          {key === "bien" && (
            <BienStep onSelect={(b) => { setBien(b); goNext(); }} />
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
              <div>
                <label className="text-noir mb-1.5 block text-sm font-semibold">Date de paiement</label>
                <input className={FIELD} value={datePaiement} onChange={(e) => setDatePaiement(e.target.value)} />
              </div>
              <div className="border-or/30 bg-or/5 rounded-xl border p-4">
                <Row label="Loyer + charges" value={eur(total)} strong />
              </div>
            </div>
          )}

          {key === "verification" && (
            done ? (
              <div className="py-6 text-center">
                <div className="bg-vert-l text-vert mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full">
                  <Check size={24} />
                </div>
                <p className="text-noir text-lg font-bold">Quittance générée 🎉</p>
                <p className="text-gris mt-1 text-sm">Le PDF a été téléchargé.</p>
                {lastDonnees && (
                  <div className="mt-5 text-left">
                    <EmailCopy type="quittance-loyer" donnees={lastDonnees} defaultEmail="" />
                  </div>
                )}
                <Link href="/espace" className="bg-noir mt-5 inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white">
                  Mon espace
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-noir font-display text-lg font-bold">Récapitulatif</h3>
                <div className="divide-or/10 divide-y">
                  <Row label="Bailleur" value={bien?.bailleurNom ?? "—"} pad />
                  <Row label="Locataire" value={bien?.locataire ?? "—"} pad />
                  <Row label="Logement" value={bien?.adresseBien ?? "—"} pad />
                  <Row label="Période" value={`${mois} ${annee}`} pad />
                  <Row label="Loyer + charges" value={eur(total)} pad strong />
                </div>
                {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
                <button onClick={generer} disabled={busy} className="bg-orange hover:bg-orange-d inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-base font-bold text-white disabled:opacity-50">
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  Générer la quittance (gratuit)
                </button>
              </div>
            )
          )}

          {!done && key !== "bien" && (
            <div className="mt-6 flex items-center justify-between">
              <button onClick={goBack} disabled={i === 0} className="text-gris hover:text-noir inline-flex items-center gap-1.5 text-sm font-semibold disabled:opacity-0">
                <ArrowLeft size={16} /> Précédent
              </button>
              {key !== "verification" && (
                <button onClick={goNext} className="bg-noir inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white">
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

function BienStep({ onSelect }: { onSelect: (b: LocalBien) => void }) {
  const existing = localStore.getBiens();
  const [creating, setCreating] = useState(existing.length === 0);
  const [f, setF] = useState({ bailleurNom: "", bailleurAdresse: "", locataire: "", adresseBien: "", loyer: "", charges: "", ville: "" });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  if (!creating) {
    return (
      <div className="space-y-4">
        <h3 className="text-noir font-display text-lg font-bold">Quel logement ?</h3>
        <ul className="divide-or/10 divide-y">
          {existing.map((b) => (
            <li key={b.id}>
              <button onClick={() => onSelect(b)} className="hover:bg-or/5 flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left">
                <span>
                  <span className="text-noir block text-sm font-semibold">{b.locataire}</span>
                  <span className="text-gris block text-xs">{[b.adresseBien, b.loyer ? `${b.loyer.toLocaleString("fr-FR")} €` : null].filter(Boolean).join(" · ") || "—"}</span>
                </span>
                <ArrowRight size={16} className="text-or-d" />
              </button>
            </li>
          ))}
        </ul>
        <button onClick={() => setCreating(true)} className="border-or/30 text-or-d hover:bg-or/5 inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed px-4 py-2.5 text-sm font-bold">
          <Plus size={16} /> Nouveau logement
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.bailleurNom.trim() || !f.locataire.trim()) return;
        const created = localStore.addBien({
          bailleurNom: f.bailleurNom.trim(),
          bailleurAdresse: f.bailleurAdresse.trim() || undefined,
          locataire: f.locataire.trim(),
          adresseBien: f.adresseBien.trim() || undefined,
          loyer: f.loyer ? parseFloat(f.loyer.replace(",", ".")) : undefined,
          charges: f.charges ? parseFloat(f.charges.replace(",", ".")) : undefined,
          ville: f.ville.trim() || undefined,
        });
        onSelect(created);
      }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <HomeIcon size={18} className="text-or-d" />
        <h3 className="text-noir font-display text-lg font-bold">Le logement loué</h3>
      </div>
      <p className="text-gris -mt-2 text-xs">Saisi une fois — réutilisé chaque mois pour ce locataire.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={FIELD} placeholder="Bailleur (vous) *" value={f.bailleurNom} onChange={(e) => set("bailleurNom", e.target.value)} />
        <input className={FIELD} placeholder="Locataire *" value={f.locataire} onChange={(e) => set("locataire", e.target.value)} />
      </div>
      <input className={FIELD} placeholder="Adresse du bailleur" value={f.bailleurAdresse} onChange={(e) => set("bailleurAdresse", e.target.value)} />
      <input className={FIELD} placeholder="Adresse du logement loué" value={f.adresseBien} onChange={(e) => set("adresseBien", e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-3">
        <input className={FIELD} inputMode="decimal" placeholder="Loyer (€)" value={f.loyer} onChange={(e) => set("loyer", e.target.value)} />
        <input className={FIELD} inputMode="decimal" placeholder="Charges (€)" value={f.charges} onChange={(e) => set("charges", e.target.value)} />
        <input className={FIELD} placeholder="Ville" value={f.ville} onChange={(e) => set("ville", e.target.value)} />
      </div>
      <div className="flex items-center justify-between">
        {existing.length > 0 ? (
          <button type="button" onClick={() => setCreating(false)} className="text-gris hover:text-noir text-sm font-semibold">← Choisir un logement existant</button>
        ) : <span />}
        <button type="submit" className="bg-noir inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white">
          <Plus size={16} /> Continuer
        </button>
      </div>
    </form>
  );
}

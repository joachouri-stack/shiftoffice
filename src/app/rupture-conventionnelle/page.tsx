"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Download, Loader2, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { EmailCopy } from "@/components/documents/EmailCopy";
import { EntrepriseStep, SalarieStep, Row, ProgressBar, RequisHint, FIELD } from "@/components/flow/Steps";
import { localStore, type LocalEntreprise, type LocalSalarie } from "@/lib/local/store";
import { formatDateInput } from "@/lib/dates";
import { adresseComplete } from "@/lib/adresse";

const LABELS: Record<string, string> = {
  entreprise: "Votre entreprise",
  salarie: "Le salarié",
  modalites: "Les modalités",
  verification: "Vérification",
};

const eur = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

function todayFr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// Parse une date jj/mm/aaaa → Date (ou null).
function parseFr(s: string): Date | null {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function RuptureConventionnelleFlow() {
  const [ready, setReady] = useState(false);
  const [ent, setEnt] = useState<LocalEntreprise | null>(null);
  const [sal, setSal] = useState<LocalSalarie | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [i, setI] = useState(0);

  const [dateEntretien, setDateEntretien] = useState("");
  const [dateRupture, setDateRupture] = useState("");
  const [salaireBrut, setSalaireBrut] = useState("");
  const [indemnite, setIndemnite] = useState("");

  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [lastDonnees, setLastDonnees] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const e = localStore.getEntreprise();
    setEnt(e);
    const id = new URLSearchParams(window.location.search).get("s");
    const found = id ? localStore.getSalaries().find((x) => x.id === id) : null;
    if (found) {
      setSal(found);
      if (found.salaireBrut) setSalaireBrut(String(found.salaireBrut));
    }
    const list: string[] = [];
    if (!e) list.push("entreprise");
    if (!found) list.push("salarie");
    list.push("modalites", "verification");
    setSteps(list);
    setReady(true);
  }, []);

  const n = (v: string) => parseFloat(v.replace(",", ".")) || 0;

  // Estimation de l'indemnité légale minimale de rupture conventionnelle
  // (= indemnité légale de licenciement) : 1/4 de mois par an jusqu'à 10 ans,
  // 1/3 au-delà, au prorata. Indicatif.
  const indemniteLegale = useMemo(() => {
    const brut = n(salaireBrut);
    const emb = sal?.dateEntree ? parseFr(sal.dateEntree) : null;
    const fin = parseFr(dateRupture);
    if (!brut || !emb || !fin || fin <= emb) return 0;
    const annees = (fin.getTime() - emb.getTime()) / (365.25 * 24 * 3600 * 1000);
    const base = 0.25 * brut * Math.min(annees, 10);
    const sup = annees > 10 ? (1 / 3) * brut * (annees - 10) : 0;
    return Math.round((base + sup) * 100) / 100;
  }, [salaireBrut, dateRupture, sal]);

  if (!ready) return null;

  const key = steps[i] ?? "verification";
  const goNext = () => setI((v) => Math.min(steps.length - 1, v + 1));
  const goBack = () => setI((v) => Math.max(0, v - 1));

  // Champ obligatoire manquant sur l'étape courante (null = rien ne manque).
  const manque =
    key === "modalites"
      ? !dateEntretien.trim()
        ? "Indiquez la date de l'entretien."
        : !dateRupture.trim()
          ? "Indiquez la date de rupture envisagée."
          : !(n(salaireBrut) > 0)
            ? "Indiquez le salaire brut mensuel."
            : !(n(indemnite) > 0)
              ? "Indiquez l'indemnité de rupture (au moins le minimum légal estimé)."
              : null
      : null;

  async function generer() {
    if (busy) return;
    setBusy(true);
    setErr("");
    const donnees = {
      entrepriseNom: ent?.nom ?? "",
      entrepriseAdresse: adresseComplete(ent?.adresse, ent?.codePostal, ent?.ville),
      siret: ent?.siret ?? "",
      representantNom: ent?.representantNom ?? "",
      representantQualite: ent?.representantQualite ?? "",
      salarieNom: sal?.nom ?? "",
      salarieAdresse: sal?.adresse ?? "",
      poste: sal?.poste ?? "",
      dateEmbauche: sal?.dateEntree ?? "",
      salaireBrut: String(n(salaireBrut)),
      indemniteRupture: String(n(indemnite)),
      dateEntretien,
      dateRupture,
      ville: ent?.ville ?? "",
      date: todayFr(),
    };
    const filename = `rupture-conventionnelle-${(sal?.nom ?? "salarie").replace(/\s+/g, "-").toLowerCase()}.pdf`;
    const docMeta = {
      type: "rupture-conventionnelle",
      titre: "Rupture conventionnelle",
      libelle: sal?.nom ?? "Salarié",
      montant: n(indemnite),
      refaireHref: sal?.id ? `/rupture-conventionnelle?s=${sal.id}` : "/rupture-conventionnelle",
      creeLe: new Date().toISOString(),
    };
    setLastDonnees(donnees);
    try {
      const co = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "rupture-conventionnelle", slug: "rupture-conventionnelle" }),
      });
      const cod = (await co.json().catch(() => ({}))) as { url?: string; paymentDisabled?: boolean; error?: string };
      if (cod?.url) {
        sessionStorage.setItem(
          "shiftoffice:pending:rupture-conventionnelle",
          JSON.stringify({ type: "rupture-conventionnelle", donnees, filename, docMeta })
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
        body: JSON.stringify({ type_document: "rupture-conventionnelle", donnees }),
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
          <Logo theme="dark" />
          <Link href="/espace" className="text-sm font-semibold text-white/70 hover:text-white">Mon espace</Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <ProgressBar index={i} total={steps.length} label={LABELS[key]} />

        {(ent || sal) && (
          <div className="text-gris mb-4 text-sm">
            {ent?.nom && <>{ent.nom}</>}
            {sal?.nom && <> · Rupture de <strong className="text-noir">{sal.nom}</strong></>}
          </div>
        )}

        <div className="border-or/20 rounded-2xl border bg-white p-5 sm:p-6">
          {key === "entreprise" && (
            <EntrepriseStep onSave={(e) => { localStore.setEntreprise(e); setEnt(e); goNext(); }} />
          )}

          {key === "salarie" && (
            <SalarieStep onSelect={(s) => { setSal(s); if (s.salaireBrut) setSalaireBrut(String(s.salaireBrut)); goNext(); }} />
          )}

          {key === "modalites" && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-noir mb-1.5 block text-sm font-semibold">Date de l'entretien</label>
                  <input className={FIELD} placeholder="15/07/2026" value={dateEntretien} onChange={(e) => setDateEntretien(formatDateInput(e.target.value, dateEntretien))} />
                </div>
                <div>
                  <label className="text-noir mb-1.5 block text-sm font-semibold">Date de rupture envisagée</label>
                  <input className={FIELD} placeholder="31/08/2026" value={dateRupture} onChange={(e) => setDateRupture(formatDateInput(e.target.value, dateRupture))} />
                </div>
              </div>
              <div>
                <label className="text-noir mb-1.5 block text-sm font-semibold">Salaire brut mensuel (€)</label>
                <input className={FIELD} inputMode="decimal" placeholder="2200" value={salaireBrut} onChange={(e) => setSalaireBrut(e.target.value)} />
              </div>
              <div>
                <label className="text-noir mb-1.5 block text-sm font-semibold">Indemnité spécifique de rupture (€)</label>
                <input className={FIELD} inputMode="decimal" placeholder="0" value={indemnite} onChange={(e) => setIndemnite(e.target.value)} />
                {indemniteLegale > 0 && (
                  <div className="border-or/30 bg-or/5 mt-2 flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                    <span className="text-noir inline-flex items-center gap-1.5 text-xs">
                      <Sparkles size={13} className="text-or-d" />
                      Minimum légal estimé : <strong>{eur(indemniteLegale)}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIndemnite(String(indemniteLegale))}
                      className="text-or-d hover:bg-or/10 rounded-md px-2.5 py-1 text-xs font-bold"
                    >
                      Utiliser
                    </button>
                  </div>
                )}
                <p className="text-gris mt-1 text-xs">
                  L'indemnité ne peut être inférieure à l'indemnité légale de licenciement.
                </p>
              </div>
            </div>
          )}

          {key === "verification" && (
            done ? (
              <div className="py-6 text-center">
                <div className="bg-vert-l text-vert mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full">
                  <Check size={24} />
                </div>
                <p className="text-noir text-lg font-bold">Document généré 🎉</p>
                <p className="text-gris mt-1 text-sm">Le PDF a été téléchargé.</p>
                {lastDonnees && (
                  <div className="mt-5 text-left">
                    <EmailCopy type="rupture-conventionnelle" donnees={lastDonnees} defaultEmail={sal?.email ?? ""} />
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
                  <Row label="Entreprise" value={ent?.nom ?? "—"} pad />
                  <Row label="Salarié" value={sal?.nom ?? "—"} pad />
                  <Row label="Entretien" value={dateEntretien || "—"} pad />
                  <Row label="Date de rupture" value={dateRupture || "—"} pad />
                  <Row label="Indemnité de rupture" value={eur(n(indemnite))} pad strong />
                </div>
                {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
                <button onClick={generer} disabled={busy} className="bg-orange hover:bg-orange-d inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-base font-bold text-white disabled:opacity-50">
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  Générer la convention de rupture
                </button>
              </div>
            )
          )}

          {!done && key !== "entreprise" && key !== "salarie" && (
            <>
              <RequisHint msg={manque} />
              <div className="mt-6 flex items-center justify-between">
                <button onClick={goBack} disabled={i === 0} className="text-gris hover:text-noir inline-flex items-center gap-1.5 text-sm font-semibold disabled:opacity-0">
                  <ArrowLeft size={16} /> Précédent
                </button>
                {key !== "verification" && (
                  <button onClick={goNext} disabled={!!manque} className="bg-noir inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                    Continuer <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

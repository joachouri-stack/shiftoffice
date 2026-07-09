"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Download, Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { EmailCopy } from "@/components/documents/EmailCopy";
import {
  EntrepriseStep,
  SalarieStep,
  Row,
  ProgressBar,
  RequisHint,
  FIELD,
} from "@/components/flow/Steps";
import {
  localStore,
  type LocalEntreprise,
  type LocalSalarie,
} from "@/lib/local/store";
import { adresseComplete } from "@/lib/adresse";
import { formatDateInput } from "@/lib/dates";

const LABELS: Record<string, string> = {
  entreprise: "Votre entreprise",
  salarie: "Le salarié",
  rupture: "La rupture",
  montants: "Les sommes dues",
  verification: "Vérification",
};

const MOTIFS = [
  "Fin de CDD",
  "Rupture conventionnelle",
  "Démission",
  "Licenciement",
  "Départ à la retraite",
  "Fin de période d'essai",
];

const eur = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

function todayFr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function SoldeToutCompteFlow() {
  const [ready, setReady] = useState(false);
  const [ent, setEnt] = useState<LocalEntreprise | null>(null);
  const [sal, setSal] = useState<LocalSalarie | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [i, setI] = useState(0);

  // Rupture
  const [dateSortie, setDateSortie] = useState("");
  const [motif, setMotif] = useState(MOTIFS[0]);

  // Montants
  const [salaireDu, setSalaireDu] = useState("");
  const [indemniteConges, setIndemniteConges] = useState("");
  const [indemnitePreavis, setIndemnitePreavis] = useState("");
  const [indemniteRupture, setIndemniteRupture] = useState("");
  const [autresSommes, setAutresSommes] = useState("");

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
      if (found.salaireBrut) setSalaireDu(String(found.salaireBrut));
    }
    const list: string[] = [];
    if (!e) list.push("entreprise");
    if (!found) list.push("salarie");
    list.push("rupture", "montants", "verification");
    setSteps(list);
    setReady(true);
  }, []);

  const n = (v: string) => parseFloat(v.replace(",", ".")) || 0;
  const total = useMemo(
    () => n(salaireDu) + n(indemniteConges) + n(indemnitePreavis) + n(indemniteRupture) + n(autresSommes),
    [salaireDu, indemniteConges, indemnitePreavis, indemniteRupture, autresSommes]
  );

  if (!ready) return null;

  const key = steps[i] ?? "verification";
  const goNext = () => setI((v) => Math.min(steps.length - 1, v + 1));
  const goBack = () => setI((v) => Math.max(0, v - 1));

  // Champ obligatoire manquant sur l'étape courante (null = rien ne manque).
  const manque =
    key === "rupture"
      ? !dateSortie.trim()
        ? "Indiquez la date de sortie du salarié."
        : null
      : key === "montants"
        ? !(total > 0)
          ? "Renseignez au moins une somme versée (le total doit être supérieur à 0 €)."
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
      dateEntree: sal?.dateEntree ?? "",
      dateSortie,
      motifRupture: motif,
      salaireDu: String(n(salaireDu)),
      indemniteConges: String(n(indemniteConges)),
      indemnitePreavis: String(n(indemnitePreavis)),
      indemniteRupture: String(n(indemniteRupture)),
      autresSommes: String(n(autresSommes)),
      ville: ent?.ville ?? "",
      date: todayFr(),
    };
    const filename = `solde-tout-compte-${(sal?.nom ?? "salarie").replace(/\s+/g, "-").toLowerCase()}.pdf`;
    const docMeta = {
      type: "solde-tout-compte",
      titre: "Solde de tout compte",
      libelle: sal?.nom ?? "Salarié",
      montant: total,
      refaireHref: sal?.id ? `/solde-tout-compte?s=${sal.id}` : "/solde-tout-compte",
      creeLe: new Date().toISOString(),
    };
    setLastDonnees(donnees);
    try {
      const co = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "solde-tout-compte", slug: "solde-tout-compte" }),
      });
      const cod = (await co.json().catch(() => ({}))) as { url?: string; paymentDisabled?: boolean; error?: string };
      if (cod?.url) {
        sessionStorage.setItem(
          "shiftoffice:pending:solde-tout-compte",
          JSON.stringify({ type: "solde-tout-compte", donnees, filename, docMeta })
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
        body: JSON.stringify({ type_document: "solde-tout-compte", donnees }),
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
            {sal?.nom && <> · Solde de <strong className="text-noir">{sal.nom}</strong></>}
          </div>
        )}

        <div className="border-or/20 rounded-2xl border bg-white p-5 sm:p-6">
          {key === "entreprise" && (
            <EntrepriseStep onSave={(e) => { localStore.setEntreprise(e); setEnt(e); goNext(); }} />
          )}

          {key === "salarie" && (
            <SalarieStep onSelect={(s) => { setSal(s); if (s.salaireBrut) setSalaireDu(String(s.salaireBrut)); goNext(); }} />
          )}

          {key === "rupture" && (
            <div className="space-y-5">
              <div>
                <label className="text-noir mb-1.5 block text-sm font-semibold">Date de sortie</label>
                <input className={FIELD} placeholder="31/07/2026" value={dateSortie} onChange={(e) => setDateSortie(formatDateInput(e.target.value, dateSortie))} />
              </div>
              <div>
                <label className="text-noir mb-1.5 block text-sm font-semibold">Motif de la rupture</label>
                <select className={FIELD} value={motif} onChange={(e) => setMotif(e.target.value)}>
                  {MOTIFS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              {sal?.dateEntree && (
                <p className="text-gris text-xs">Entrée le {sal.dateEntree} — repris depuis la fiche du salarié.</p>
              )}
            </div>
          )}

          {key === "montants" && (
            <div className="space-y-4">
              <Field label="Salaire dû (jusqu'à la sortie)" value={salaireDu} onChange={setSalaireDu} />
              <Field label="Indemnité de congés payés" value={indemniteConges} onChange={setIndemniteConges} />
              <Field label="Indemnité de préavis" value={indemnitePreavis} onChange={setIndemnitePreavis} />
              <Field label="Indemnité de rupture / licenciement" value={indemniteRupture} onChange={setIndemniteRupture} />
              <Field label="Autres sommes" value={autresSommes} onChange={setAutresSommes} />
              <div className="border-or/30 bg-or/5 rounded-xl border p-4">
                <Row label="Total du solde" value={eur(total)} strong />
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
                    <EmailCopy type="solde-tout-compte" donnees={lastDonnees} defaultEmail={sal?.email ?? ""} />
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
                  <Row label="Motif" value={motif} pad />
                  <Row label="Date de sortie" value={dateSortie || "—"} pad />
                  <Row label="Total du solde" value={eur(total)} pad strong />
                </div>
                {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
                <button onClick={generer} disabled={busy} className="bg-orange hover:bg-orange-d inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-base font-bold text-white disabled:opacity-50">
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  Générer le solde de tout compte
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

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-noir mb-1.5 block text-sm font-semibold">{label}</label>
      <input className={FIELD} inputMode="decimal" placeholder="0" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

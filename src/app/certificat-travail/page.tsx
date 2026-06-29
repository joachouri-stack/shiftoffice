"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Download, Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { EmailCopy } from "@/components/documents/EmailCopy";
import { EntrepriseStep, SalarieStep, Row, ProgressBar, FIELD } from "@/components/flow/Steps";
import { localStore, type LocalEntreprise, type LocalSalarie } from "@/lib/local/store";

const LABELS: Record<string, string> = {
  entreprise: "Votre entreprise",
  salarie: "Le salarié",
  periode: "La période d'emploi",
  verification: "Vérification",
};

function todayFr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function CertificatTravailFlow() {
  const [ready, setReady] = useState(false);
  const [ent, setEnt] = useState<LocalEntreprise | null>(null);
  const [sal, setSal] = useState<LocalSalarie | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [i, setI] = useState(0);

  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

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
      if (found.dateEntree) setDateDebut(found.dateEntree);
    }
    const list: string[] = [];
    if (!e) list.push("entreprise");
    if (!found) list.push("salarie");
    list.push("periode", "verification");
    setSteps(list);
    setReady(true);
  }, []);

  if (!ready) return null;

  const key = steps[i] ?? "verification";
  const goNext = () => setI((v) => Math.min(steps.length - 1, v + 1));
  const goBack = () => setI((v) => Math.max(0, v - 1));

  async function generer() {
    if (busy) return;
    setBusy(true);
    setErr("");
    const donnees = {
      entrepriseNom: ent?.nom ?? "",
      entrepriseAdresse: [ent?.adresse, [ent?.codePostal, ent?.ville].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", "),
      siret: ent?.siret ?? "",
      representantNom: ent?.representantNom ?? "",
      representantQualite: ent?.representantQualite ?? "",
      salarieNom: sal?.nom ?? "",
      poste: sal?.poste ?? "",
      dateDebut: dateDebut || sal?.dateEntree || "",
      dateFin,
      ville: ent?.ville ?? "",
      date: todayFr(),
    };
    const filename = `certificat-travail-${(sal?.nom ?? "salarie").replace(/\s+/g, "-").toLowerCase()}.pdf`;
    setLastDonnees(donnees);
    try {
      const co = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "certificat-travail", slug: "certificat-travail" }),
      });
      const cod = (await co.json().catch(() => ({}))) as { url?: string; paymentDisabled?: boolean; error?: string };
      if (cod?.url) {
        sessionStorage.setItem(
          "shiftoffice:pending:certificat-travail",
          JSON.stringify({ type: "certificat-travail", donnees, filename })
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
        body: JSON.stringify({ type_document: "certificat-travail", donnees }),
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

        {(ent || sal) && (
          <div className="text-gris mb-4 text-sm">
            {ent?.nom && <>{ent.nom}</>}
            {sal?.nom && <> · Certificat de <strong className="text-noir">{sal.nom}</strong></>}
          </div>
        )}

        <div className="border-or/20 rounded-2xl border bg-white p-5 sm:p-6">
          {key === "entreprise" && (
            <EntrepriseStep onSave={(e) => { localStore.setEntreprise(e); setEnt(e); goNext(); }} />
          )}

          {key === "salarie" && (
            <SalarieStep onSelect={(s) => { setSal(s); if (s.dateEntree) setDateDebut(s.dateEntree); goNext(); }} />
          )}

          {key === "periode" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-noir mb-1.5 block text-sm font-semibold">Date d'entrée</label>
                <input className={FIELD} placeholder="01/03/2024" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
              </div>
              <div>
                <label className="text-noir mb-1.5 block text-sm font-semibold">Date de sortie</label>
                <input className={FIELD} placeholder="31/08/2026" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
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
                    <EmailCopy type="certificat-travail" donnees={lastDonnees} defaultEmail={sal?.email ?? ""} />
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
                  <Row label="Poste" value={sal?.poste ?? "—"} pad />
                  <Row label="Du" value={dateDebut || "—"} pad />
                  <Row label="Au" value={dateFin || "—"} pad />
                </div>
                {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
                <button onClick={generer} disabled={busy} className="bg-orange hover:bg-orange-d inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-base font-bold text-white disabled:opacity-50">
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  Générer le certificat de travail
                </button>
              </div>
            )
          )}

          {!done && key !== "entreprise" && key !== "salarie" && (
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Download, Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { EmailCopy } from "@/components/documents/EmailCopy";
import { EntrepriseStep, SalarieStep, Row, ProgressBar, RequisHint, FIELD } from "@/components/flow/Steps";
import { formatDateInput } from "@/lib/dates";
import { localStore, type LocalEntreprise, type LocalSalarie } from "@/lib/local/store";
import { adresseComplete } from "@/lib/adresse";

const LABELS: Record<string, string> = {
  entreprise: "Votre entreprise",
  salarie: "Le salarié",
  verification: "Vérification",
};

function todayFr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function AttestationEmployeurFlow() {
  const [ready, setReady] = useState(false);
  const [ent, setEnt] = useState<LocalEntreprise | null>(null);
  const [sal, setSal] = useState<LocalSalarie | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [i, setI] = useState(0);

  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [lastDonnees, setLastDonnees] = useState<Record<string, unknown> | null>(null);

  // Complément inline si la fiche du salarié est incomplète (poste, date d'entrée) :
  // mémorisé sur le salarié au moment de la génération.
  const [posteComp, setPosteComp] = useState("");
  const [dateEntreeComp, setDateEntreeComp] = useState("");

  useEffect(() => {
    const e = localStore.getEntreprise();
    setEnt(e);
    const id = new URLSearchParams(window.location.search).get("s");
    const found = id ? localStore.getSalaries().find((x) => x.id === id) : null;
    if (found) setSal(found);
    const list: string[] = [];
    if (!e) list.push("entreprise");
    if (!found) list.push("salarie");
    list.push("verification");
    setSteps(list);
    setReady(true);
  }, []);

  if (!ready) return null;

  const key = steps[i] ?? "verification";
  const goNext = () => setI((v) => Math.min(steps.length - 1, v + 1));

  // Valeurs effectives : fiche du salarié, complétée inline si besoin.
  const posteEff = (sal?.poste || posteComp).trim();
  const dateEntreeEff = (sal?.dateEntree || dateEntreeComp).trim();
  const manque =
    key === "verification" && !done
      ? !posteEff
        ? "Indiquez le poste du salarié ci-dessus."
        : !dateEntreeEff
          ? "Indiquez la date d'entrée du salarié ci-dessus."
          : null
      : null;

  async function generer() {
    if (busy || !posteEff || !dateEntreeEff) return;
    setBusy(true);
    setErr("");
    // Mémorise les compléments sur la fiche du salarié pour les prochains documents.
    if (sal?.id && (!sal.poste || !sal.dateEntree)) {
      localStore.updateSalarie(sal.id, {
        poste: sal.poste || posteEff,
        dateEntree: sal.dateEntree || dateEntreeEff,
      });
    }
    const donnees = {
      entrepriseNom: ent?.nom ?? "",
      entrepriseAdresse: adresseComplete(ent?.adresse, ent?.codePostal, ent?.ville),
      siret: ent?.siret ?? "",
      representantNom: ent?.representantNom ?? "",
      representantQualite: ent?.representantQualite ?? "",
      salarieNom: sal?.nom ?? "",
      poste: posteEff,
      typeContrat: sal?.typeContrat === "CDD" ? "determinee" : "indeterminee",
      dateEmbauche: dateEntreeEff,
      ville: ent?.ville ?? "",
      date: todayFr(),
    };
    const filename = `attestation-employeur-${(sal?.nom ?? "salarie").replace(/\s+/g, "-").toLowerCase()}.pdf`;
    const docMeta = {
      type: "attestation-employeur",
      titre: "Attestation employeur",
      libelle: sal?.nom ?? "Salarié",
      refaireHref: sal?.id ? `/attestation-employeur?s=${sal.id}` : "/attestation-employeur",
      creeLe: new Date().toISOString(),
    };
    setLastDonnees(donnees);
    try {
      // Document gratuit → génération directe (route gratuite, sans paiement).
      const r = await fetch("/api/documents/generer-gratuit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type_document: "attestation-employeur", donnees }),
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
            {sal?.nom && <> · Attestation pour <strong className="text-noir">{sal.nom}</strong></>}
          </div>
        )}

        <div className="border-or/20 rounded-2xl border bg-white p-5 sm:p-6">
          {key === "entreprise" && (
            <EntrepriseStep onSave={(e) => { localStore.setEntreprise(e); setEnt(e); goNext(); }} />
          )}

          {key === "salarie" && (
            <SalarieStep onSelect={(s) => { setSal(s); goNext(); }} />
          )}

          {key === "verification" && (
            done ? (
              <div className="py-6 text-center">
                <div className="bg-vert-l text-vert mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full">
                  <Check size={24} />
                </div>
                <p className="text-noir text-lg font-bold">Attestation générée 🎉</p>
                <p className="text-gris mt-1 text-sm">Le PDF a été téléchargé.</p>
                {lastDonnees && (
                  <div className="mt-5 text-left">
                    <EmailCopy type="attestation-employeur" donnees={lastDonnees} defaultEmail={sal?.email ?? ""} />
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
                  <Row label="Poste" value={posteEff || "—"} pad />
                  <Row label="Type de contrat" value={sal?.typeContrat ?? "CDI"} pad />
                  <Row label="Depuis le" value={dateEntreeEff || "—"} pad />
                </div>
                {(!sal?.poste || !sal?.dateEntree) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {!sal?.poste && (
                      <div>
                        <label className="text-noir mb-1.5 block text-sm font-semibold">Poste du salarié</label>
                        <input className={FIELD} placeholder="Assistante administrative" value={posteComp} onChange={(e) => setPosteComp(e.target.value)} />
                      </div>
                    )}
                    {!sal?.dateEntree && (
                      <div>
                        <label className="text-noir mb-1.5 block text-sm font-semibold">Date d'entrée</label>
                        <input className={FIELD} placeholder="01/03/2024" value={dateEntreeComp} onChange={(e) => setDateEntreeComp(formatDateInput(e.target.value, dateEntreeComp))} />
                      </div>
                    )}
                  </div>
                )}
                <p className="text-gris text-xs">Attestation de travail — document gratuit.</p>
                <RequisHint msg={manque} />
                {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
                <button onClick={generer} disabled={busy || !!manque} className="bg-orange hover:bg-orange-d inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-base font-bold text-white disabled:opacity-50">
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  Générer l'attestation (gratuit)
                </button>
              </div>
            )
          )}

          {!done && key !== "entreprise" && key !== "salarie" && i > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <button onClick={() => setI((v) => Math.max(0, v - 1))} className="text-gris hover:text-noir inline-flex items-center gap-1.5 text-sm font-semibold">
                <ArrowLeft size={16} /> Précédent
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

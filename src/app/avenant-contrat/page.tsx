"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Download, Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { EmailCopy } from "@/components/documents/EmailCopy";
import { EntrepriseStep, SalarieStep, Row, ProgressBar, FIELD } from "@/components/flow/Steps";
import { localStore, type LocalEntreprise, type LocalSalarie } from "@/lib/local/store";
import { SMIC_MENSUEL } from "@/lib/paie/calcul";

const LABELS: Record<string, string> = {
  entreprise: "Votre entreprise",
  salarie: "Le salarié",
  type: "Type de modification",
  conditions: "Les nouvelles conditions",
  verification: "Vérification",
};

const TYPES = [
  "Augmentation de salaire",
  "Changement de poste",
  "Passage à temps partiel",
  "Changement de lieu de travail",
  "Prolongation CDD",
  "Autre modification",
];

const eur = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

function todayFr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function AvenantFlow() {
  const [ready, setReady] = useState(false);
  const [ent, setEnt] = useState<LocalEntreprise | null>(null);
  const [sal, setSal] = useState<LocalSalarie | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [i, setI] = useState(0);

  const [dateContratInitial, setDateContratInitial] = useState("");
  const [typeModif, setTypeModif] = useState(TYPES[0]);
  const [dateEffet, setDateEffet] = useState("");

  // Champs conditionnels
  const [ancienSalaire, setAncienSalaire] = useState("");
  const [nouveauSalaire, setNouveauSalaire] = useState("");
  const [ancienPoste, setAncienPoste] = useState("");
  const [nouveauPoste, setNouveauPoste] = useState("");
  const [nouveauCoef, setNouveauCoef] = useState("");
  const [ancienHoraire, setAncienHoraire] = useState("35");
  const [nouveauHoraire, setNouveauHoraire] = useState("");
  const [ancienLieu, setAncienLieu] = useState("");
  const [nouveauLieu, setNouveauLieu] = useState("");
  const [dateFinInitiale, setDateFinInitiale] = useState("");
  const [nouvelleDateFin, setNouvelleDateFin] = useState("");
  const [motifProlongation, setMotifProlongation] = useState("");
  const [autreIntitule, setAutreIntitule] = useState("");
  const [autreAncien, setAutreAncien] = useState("");
  const [autreNouveau, setAutreNouveau] = useState("");

  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [lastDonnees, setLastDonnees] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const e = localStore.getEntreprise();
    setEnt(e);
    const id = new URLSearchParams(window.location.search).get("s");
    const found = id ? localStore.getSalaries().find((x) => x.id === id) : null;
    if (found) applySalarie(found);
    const list: string[] = [];
    if (!e) list.push("entreprise");
    list.push("salarie", "type", "conditions", "verification");
    setSteps(list);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const n = (v: string) => parseFloat(v.replace(",", ".")) || 0;

  function applySalarie(s: LocalSalarie) {
    setSal(s);
    if (s.poste) setAncienPoste(s.poste);
    if (s.salaireBrut) setAncienSalaire(String(s.salaireBrut));
  }

  // Salaire calculé au prorata pour le passage à temps partiel.
  const salairePartiel = useMemo(() => {
    if (n(ancienSalaire) > 0 && n(ancienHoraire) > 0 && n(nouveauHoraire) > 0) {
      return Math.round((n(ancienSalaire) * n(nouveauHoraire)) / n(ancienHoraire) * 100) / 100;
    }
    return 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ancienSalaire, ancienHoraire, nouveauHoraire]);

  const modifications = useMemo(() => {
    const num = (v: string) => (n(v) > 0 ? eur(n(v)) : "—");
    switch (typeModif) {
      case "Augmentation de salaire":
        return [{ intitule: "Salaire brut mensuel", ancien: num(ancienSalaire), nouveau: num(nouveauSalaire) }];
      case "Changement de poste":
        return [
          { intitule: "Poste", ancien: ancienPoste || "—", nouveau: nouveauPoste || "—" },
          ...(nouveauCoef ? [{ intitule: "Coefficient", ancien: "—", nouveau: nouveauCoef }] : []),
        ];
      case "Passage à temps partiel":
        return [
          { intitule: "Durée hebdomadaire", ancien: `${ancienHoraire || "35"} h`, nouveau: `${nouveauHoraire || "—"} h` },
          { intitule: "Salaire brut mensuel", ancien: num(ancienSalaire), nouveau: salairePartiel ? eur(salairePartiel) : "—" },
        ];
      case "Changement de lieu de travail":
        return [{ intitule: "Lieu de travail", ancien: ancienLieu || "—", nouveau: nouveauLieu || "—" }];
      case "Prolongation CDD":
        return [
          { intitule: "Date de fin du CDD", ancien: dateFinInitiale || "—", nouveau: nouvelleDateFin || "—" },
          ...(motifProlongation ? [{ intitule: "Motif de prolongation", ancien: "—", nouveau: motifProlongation }] : []),
        ];
      default:
        return [{ intitule: autreIntitule || "Disposition modifiée", ancien: autreAncien || "—", nouveau: autreNouveau || "—" }];
    }
  }, [typeModif, ancienSalaire, nouveauSalaire, ancienPoste, nouveauPoste, nouveauCoef, ancienHoraire, nouveauHoraire, salairePartiel, ancienLieu, nouveauLieu, dateFinInitiale, nouvelleDateFin, motifProlongation, autreIntitule, autreAncien, autreNouveau]);

  // Détection d'anomalies (non bloquante).
  const alertes = useMemo(() => {
    const out: Array<{ level: "error" | "warn"; msg: string }> = [];
    if (typeModif === "Augmentation de salaire") {
      const ns = n(nouveauSalaire);
      if (ns > 0 && ns < SMIC_MENSUEL)
        out.push({ level: "error", msg: `Le nouveau salaire (${eur(ns)}) est inférieur au SMIC 2026 (${eur(SMIC_MENSUEL)}). Cela peut être illégal.` });
      if (ns > 0 && n(ancienSalaire) > 0 && ns < n(ancienSalaire))
        out.push({ level: "warn", msg: `Réduction de salaire détectée : une baisse de rémunération nécessite l'accord écrit du salarié. L'avenant doit être signé par les deux parties.` });
    }
    if (typeModif === "Passage à temps partiel")
      out.push({ level: "warn", msg: `Le passage à temps partiel requiert l'accord écrit du salarié (avenant signé par les deux parties).` });
    return out;
  }, [typeModif, nouveauSalaire, ancienSalaire]);

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
      entrepriseAdresse: [ent?.adresse, [ent?.codePostal, ent?.ville].filter(Boolean).join(" ")].filter(Boolean).join(", "),
      siret: ent?.siret ?? "",
      representantNom: ent?.representantNom ?? "",
      representantQualite: ent?.representantQualite ?? "",
      salarieNom: sal?.nom ?? "",
      salarieAdresse: sal?.adresse ?? "",
      poste: sal?.poste ?? ancienPoste,
      dateContratInitial,
      typeModif,
      dateEffet,
      modifications,
      ville: ent?.ville ?? "",
      date: todayFr(),
    };
    const filename = `avenant-${(sal?.nom ?? "salarie").replace(/\s+/g, "-").toLowerCase()}.pdf`;
    const docMeta = {
      type: "avenant-contrat",
      titre: "Avenant au contrat",
      libelle: [sal?.nom, typeModif].filter(Boolean).join(" · "),
      refaireHref: sal?.id ? `/avenant-contrat?s=${sal.id}` : "/avenant-contrat",
      creeLe: new Date().toISOString(),
    };
    setLastDonnees(donnees);
    try {
      const co = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "avenant-contrat", slug: "avenant-contrat" }),
      });
      const cod = (await co.json().catch(() => ({}))) as { url?: string; paymentDisabled?: boolean; error?: string };
      if (cod?.url) {
        sessionStorage.setItem("shiftoffice:pending:avenant-contrat", JSON.stringify({ type: "avenant-contrat", donnees, filename, docMeta }));
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
        body: JSON.stringify({ type_document: "avenant-contrat", donnees }),
      });
      if (!r.ok) { setErr("La génération a échoué. Réessayez."); setBusy(false); return; }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
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
          <Link href="/"><Logo theme="dark" /></Link>
          <Link href="/espace" className="text-sm font-semibold text-white/70 hover:text-white">Mon espace</Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <ProgressBar index={i} total={steps.length} label={LABELS[key]} />

        {(ent || sal) && (
          <div className="text-gris mb-4 text-sm">
            {ent?.nom}{sal?.nom && <> · Avenant de <strong className="text-noir">{sal.nom}</strong></>}
          </div>
        )}

        <div className="border-or/20 rounded-2xl border bg-white p-5 sm:p-6">
          {key === "entreprise" && (
            <EntrepriseStep onSave={(e) => { localStore.setEntreprise(e); setEnt(e); goNext(); }} />
          )}

          {key === "salarie" && (
            !sal ? (
              <SalarieStep onSelect={applySalarie} />
            ) : (
              <div className="space-y-4">
                <div className="bg-creme rounded-xl p-3 text-sm">
                  <span className="text-noir font-bold">{sal.nom}</span>
                  {sal.poste && <span className="text-gris"> · {sal.poste}</span>}
                  <button onClick={() => setSal(null)} className="text-or-d ml-2 text-xs font-semibold hover:underline">changer</button>
                </div>
                <div><L>Date du contrat de travail initial</L>
                  <input className={FIELD} placeholder="01/03/2024" value={dateContratInitial} onChange={(e) => setDateContratInitial(e.target.value)} />
                </div>
              </div>
            )
          )}

          {key === "type" && (
            <div className="space-y-3">
              <L>Que souhaitez-vous modifier ?</L>
              <div className="grid gap-2 sm:grid-cols-2">
                {TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => setTypeModif(t)} className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${typeModif === t ? "border-noir bg-noir text-white" : "border-or/30 text-gris hover:border-or"}`}>{t}</button>
                ))}
              </div>
            </div>
          )}

          {key === "conditions" && (
            <div className="space-y-4">
              <h3 className="text-noir font-display text-lg font-bold">{typeModif}</h3>

              {typeModif === "Augmentation de salaire" && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><L>Ancien salaire brut (€)</L><input className={FIELD} inputMode="decimal" value={ancienSalaire} onChange={(e) => setAncienSalaire(e.target.value)} /></div>
                    <div><L>Nouveau salaire brut (€)</L><input className={FIELD} inputMode="decimal" value={nouveauSalaire} onChange={(e) => setNouveauSalaire(e.target.value)} /></div>
                  </div>
                </>
              )}

              {typeModif === "Changement de poste" && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><L>Ancien poste</L><input className={FIELD} value={ancienPoste} onChange={(e) => setAncienPoste(e.target.value)} /></div>
                    <div><L>Nouveau poste</L><input className={FIELD} value={nouveauPoste} onChange={(e) => setNouveauPoste(e.target.value)} /></div>
                  </div>
                  <div><L>Nouveau coefficient (optionnel)</L><input className={FIELD} value={nouveauCoef} onChange={(e) => setNouveauCoef(e.target.value)} /></div>
                </>
              )}

              {typeModif === "Passage à temps partiel" && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><L>Ancien volume horaire (h/sem.)</L><input className={FIELD} inputMode="decimal" value={ancienHoraire} onChange={(e) => setAncienHoraire(e.target.value)} /></div>
                    <div><L>Nouveau volume horaire (h/sem.)</L><input className={FIELD} inputMode="decimal" value={nouveauHoraire} onChange={(e) => setNouveauHoraire(e.target.value)} /></div>
                  </div>
                  <div><L>Ancien salaire brut (€)</L><input className={FIELD} inputMode="decimal" value={ancienSalaire} onChange={(e) => setAncienSalaire(e.target.value)} /></div>
                  {salairePartiel > 0 && (
                    <p className="text-gris text-sm">Nouveau salaire calculé au prorata : <strong className="text-noir">{eur(salairePartiel)}</strong></p>
                  )}
                </>
              )}

              {typeModif === "Changement de lieu de travail" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><L>Ancien lieu de travail</L><input className={FIELD} value={ancienLieu} onChange={(e) => setAncienLieu(e.target.value)} /></div>
                  <div><L>Nouveau lieu de travail</L><input className={FIELD} value={nouveauLieu} onChange={(e) => setNouveauLieu(e.target.value)} /></div>
                </div>
              )}

              {typeModif === "Prolongation CDD" && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><L>Date de fin initiale</L><input className={FIELD} value={dateFinInitiale} onChange={(e) => setDateFinInitiale(e.target.value)} /></div>
                    <div><L>Nouvelle date de fin</L><input className={FIELD} value={nouvelleDateFin} onChange={(e) => setNouvelleDateFin(e.target.value)} /></div>
                  </div>
                  <div><L>Motif de la prolongation</L><input className={FIELD} value={motifProlongation} onChange={(e) => setMotifProlongation(e.target.value)} /></div>
                </>
              )}

              {typeModif === "Autre modification" && (
                <>
                  <div><L>Élément modifié</L><input className={FIELD} value={autreIntitule} onChange={(e) => setAutreIntitule(e.target.value)} placeholder="Ex. Horaires de travail" /></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><L>Ancienne disposition</L><input className={FIELD} value={autreAncien} onChange={(e) => setAutreAncien(e.target.value)} /></div>
                    <div><L>Nouvelle disposition</L><input className={FIELD} value={autreNouveau} onChange={(e) => setAutreNouveau(e.target.value)} /></div>
                  </div>
                </>
              )}

              <div><L>Date d'effet de la modification</L><input className={FIELD} placeholder="01/08/2026" value={dateEffet} onChange={(e) => setDateEffet(e.target.value)} /></div>

              {alertes.map((a, idx) => (
                <div key={idx} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm font-medium ${a.level === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" /> <span>{a.msg}</span>
                </div>
              ))}
            </div>
          )}

          {key === "verification" && (
            done ? (
              <div className="py-6 text-center">
                <div className="bg-vert-l text-vert mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full"><Check size={24} /></div>
                <p className="text-noir text-lg font-bold">Avenant généré 🎉</p>
                <p className="text-gris mt-1 text-sm">Le PDF a été téléchargé.</p>
                {lastDonnees && <div className="mt-5 text-left"><EmailCopy type="avenant-contrat" donnees={lastDonnees} defaultEmail={sal?.email ?? ""} /></div>}
                <Link href="/espace" className="bg-noir mt-5 inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white">Mon espace</Link>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-noir font-display text-lg font-bold">Récapitulatif</h3>
                <div className="divide-or/10 divide-y">
                  <Row label="Salarié" value={sal?.nom ?? "—"} pad />
                  <Row label="Contrat initial du" value={dateContratInitial || "—"} pad />
                  <Row label="Modification" value={typeModif} pad />
                  <Row label="Date d'effet" value={dateEffet || "—"} pad strong />
                </div>
                <div className="border-or/20 rounded-xl border p-3 text-sm">
                  {modifications.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 py-1">
                      <span className="text-gris">{m.intitule}</span>
                      <span className="text-noir font-semibold">{m.ancien} → {m.nouveau}</span>
                    </div>
                  ))}
                </div>
                {alertes.map((a, idx) => (
                  <div key={idx} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm font-medium ${a.level === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" /> <span>{a.msg}</span>
                  </div>
                ))}
                {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
                <button onClick={generer} disabled={busy} className="bg-orange hover:bg-orange-d inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-base font-bold text-white disabled:opacity-50">
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  Générer et payer 5€
                </button>
              </div>
            )
          )}

          {!done && key !== "entreprise" && !(key === "salarie" && !sal) && (
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

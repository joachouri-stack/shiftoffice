"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Download, Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { EmailCopy } from "@/components/documents/EmailCopy";
import { EntrepriseStep, SalarieStep, Row, ProgressBar, RequisHint, FIELD } from "@/components/flow/Steps";
import { localStore, type LocalEntreprise, type LocalSalarie } from "@/lib/local/store";
import { savePdf } from "@/lib/local/pdfs";
import { useDraft, useDraftCtx } from "@/lib/local/draft";
import { formatDateInput } from "@/lib/dates";
import { adresseComplete } from "@/lib/adresse";
import { prixDoc } from "@/lib/documents";

const LABELS: Record<string, string> = {
  entreprise: "Votre entreprise",
  salarie: "Le salarié",
  etatcivil: "État civil",
  contrat: "Le contrat",
  poste: "Le poste",
  verification: "Vérification",
};

function todayFr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function ContratTravailFlow() {
  const [ready, setReady] = useState(false);
  const draftCtx = useDraftCtx();
  const [ent, setEnt] = useState<LocalEntreprise | null>(null);
  const [sal, setSal] = useState<LocalSalarie | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [i, setI] = useState(0);

  // État civil (mémorisé sur le salarié)
  const [dateNaissance, setDateNaissance] = useState("");
  const [lieuNaissance, setLieuNaissance] = useState("");
  const [nationalite, setNationalite] = useState("");

  // Contrat
  const [typeContrat, setTypeContrat] = useState<"cdi" | "cdd">("cdi");
  const [dateDebut, setDateDebut] = useState(todayFr());
  const [dateFin, setDateFin] = useState("");
  const [motifCdd, setMotifCdd] = useState("");
  const [periodeEssai, setPeriodeEssai] = useState("2 mois");

  // Poste
  const [poste, setPoste] = useState("");
  const [salaireBrut, setSalaireBrut] = useState("");
  const [heuresSemaine, setHeuresSemaine] = useState("35");
  const [lieuTravail, setLieuTravail] = useState("");
  const [convention, setConvention] = useState("");

  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [lastDonnees, setLastDonnees] = useState<Record<string, unknown> | null>(null);

  // Charge un salarié dans les états (état civil, poste, contrat).
  const loadSalarie = (s: LocalSalarie) => {
    setSal(s);
    setPoste(s.poste ?? "");
    if (s.salaireBrut) setSalaireBrut(String(s.salaireBrut));
    if (s.typeContrat === "CDD") setTypeContrat("cdd");
    setDateNaissance(s.dateNaissance ?? "");
    setLieuNaissance(s.lieuNaissance ?? "");
    setNationalite(s.nationalite ?? "");
  };

  useEffect(() => {
    const e = localStore.getEntreprise();
    setEnt(e);
    if (e?.convention) setConvention(e.convention);
    if (e?.adresse) setLieuTravail(adresseComplete(e.adresse, e.codePostal, e.ville));
    const id = new URLSearchParams(window.location.search).get("s");
    const found = id ? localStore.getSalaries().find((x) => x.id === id) : null;
    if (found) loadSalarie(found);

    const list: string[] = [];
    if (!e) list.push("entreprise");
    if (!found) list.push("salarie");
    if (!found || !found.dateNaissance || !found.nationalite) list.push("etatcivil");
    list.push("contrat", "poste", "verification");
    setSteps(list);
    setReady(true);
  }, []);

  // Brouillon : la saisie survit à un rechargement de page (24 h),
  // cloisonné par salarié — les champs issus de la fiche du salarié
  // (état civil, poste, salaire, type de contrat) n'y figurent pas.
  useDraft("contrat-travail", ready, done, {
    dateDebut: [dateDebut, setDateDebut],
    dateFin: [dateFin, setDateFin],
    motifCdd: [motifCdd, setMotifCdd],
    periodeEssai: [periodeEssai, setPeriodeEssai],
    heuresSemaine: [heuresSemaine, setHeuresSemaine],
    lieuTravail: [lieuTravail, setLieuTravail],
    convention: [convention, setConvention],
  }, draftCtx);

  if (!ready) return null;

  const key = steps[i] ?? "verification";
  const cdd = typeContrat === "cdd";
  const goNext = () => setI((v) => Math.min(steps.length - 1, v + 1));
  const goBack = () => setI((v) => Math.max(0, v - 1));

  // Champ obligatoire manquant sur l'étape courante (null = rien ne manque).
  const manque =
    key === "contrat"
      ? !dateDebut.trim()
        ? "Indiquez la date de début du contrat."
        : cdd && !dateFin.trim()
          ? "Indiquez la date de fin du CDD."
          : null
      : key === "poste"
        ? !poste.trim()
          ? "Indiquez le poste du salarié."
          : !(parseFloat(salaireBrut.replace(",", ".")) > 0)
            ? "Indiquez le salaire brut mensuel."
            : null
        : null;

  // Mémorise l'état civil sur le salarié en quittant l'étape dédiée.
  const saveEtatCivil = () => {
    if (sal?.id) {
      localStore.updateSalarie(sal.id, {
        dateNaissance: dateNaissance.trim() || undefined,
        lieuNaissance: lieuNaissance.trim() || undefined,
        nationalite: nationalite.trim() || undefined,
      });
    }
  };

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
      salarieDateNaissance: dateNaissance,
      salarieLieuNaissance: lieuNaissance,
      salarieNationalite: nationalite,
      salarieNumeroSecu: sal?.numeroSecu ?? "",
      typeContrat,
      dateDebut,
      dateFin,
      motifCdd,
      poste,
      salaireBrut,
      heuresSemaine,
      lieuTravail,
      periodeEssai,
      conventionCollective: convention,
      ville: ent?.ville ?? "",
      date: todayFr(),
    };
    const filename = `contrat-travail-${(sal?.nom ?? "salarie").replace(/\s+/g, "-").toLowerCase()}.pdf`;
    const docMeta = {
      type: "contrat-travail",
      titre: "Contrat de travail",
      libelle: `${sal?.nom ?? "Salarié"} · ${typeContrat.toUpperCase()}`,
      refaireHref: sal?.id ? `/contrat-travail?s=${sal.id}` : "/contrat-travail",
      creeLe: new Date().toISOString(),
    };
    setLastDonnees(donnees);
    try {
      const co = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "contrat-travail", slug: "contrat-travail" }),
      });
      const cod = (await co.json().catch(() => ({}))) as { url?: string; paymentDisabled?: boolean; error?: string };
      if (cod?.url) {
        sessionStorage.setItem(
          "shiftoffice:pending:contrat-travail",
          JSON.stringify({ type: "contrat-travail", donnees, filename, docMeta })
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
        body: JSON.stringify({ type_document: "contrat-travail", donnees }),
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
      void savePdf(localStore.addDocument(docMeta).id, blob);
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
            {sal?.nom && <> · Contrat de <strong className="text-noir">{sal.nom}</strong></>}
          </div>
        )}

        <div className="border-or/20 rounded-2xl border bg-white p-5 sm:p-6">
          {key === "entreprise" && (
            <EntrepriseStep onSave={(e) => { localStore.setEntreprise(e); setEnt(e); if (e.convention) setConvention(e.convention); goNext(); }} />
          )}

          {key === "salarie" && (
            <SalarieStep onSelect={(s) => { loadSalarie(s); goNext(); }} />
          )}

          {key === "etatcivil" && (
            <div className="space-y-4">
              <h3 className="text-noir font-display text-lg font-bold">État civil du salarié</h3>
              <p className="text-gris -mt-2 text-xs">Mémorisé sur le salarié — demandé une seule fois.</p>
              <input className={FIELD} placeholder="Date de naissance (jj/mm/aaaa)" value={dateNaissance} onChange={(e) => setDateNaissance(formatDateInput(e.target.value, dateNaissance))} />
              <input className={FIELD} placeholder="Lieu de naissance" value={lieuNaissance} onChange={(e) => setLieuNaissance(e.target.value)} />
              <input className={FIELD} placeholder="Nationalité" value={nationalite} onChange={(e) => setNationalite(e.target.value)} />
            </div>
          )}

          {key === "contrat" && (
            <div className="space-y-5">
              <div>
                <label className="text-noir mb-2 block text-sm font-semibold">Type de contrat</label>
                <div className="bg-creme inline-flex rounded-lg p-1">
                  {(["cdi", "cdd"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setTypeContrat(t)} className={`rounded-md px-5 py-1.5 text-sm font-bold uppercase transition-colors ${typeContrat === t ? "bg-noir text-white" : "text-gris"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-noir mb-1.5 block text-sm font-semibold">Date de début</label>
                  <input className={FIELD} value={dateDebut} onChange={(e) => setDateDebut(formatDateInput(e.target.value, dateDebut))} />
                </div>
                <div>
                  <label className="text-noir mb-1.5 block text-sm font-semibold">Période d'essai</label>
                  <input className={FIELD} value={periodeEssai} onChange={(e) => setPeriodeEssai(e.target.value)} placeholder="2 mois / Aucune" />
                </div>
              </div>
              {cdd && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-noir mb-1.5 block text-sm font-semibold">Date de fin (CDD)</label>
                    <input className={FIELD} value={dateFin} onChange={(e) => setDateFin(formatDateInput(e.target.value, dateFin))} placeholder="31/12/2026" />
                  </div>
                  <div>
                    <label className="text-noir mb-1.5 block text-sm font-semibold">Motif du CDD</label>
                    <input className={FIELD} value={motifCdd} onChange={(e) => setMotifCdd(e.target.value)} placeholder="Accroissement d'activité" />
                  </div>
                </div>
              )}
            </div>
          )}

          {key === "poste" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-noir mb-1.5 block text-sm font-semibold">Poste</label>
                  <input className={FIELD} value={poste} onChange={(e) => setPoste(e.target.value)} placeholder="Assistante administrative" />
                </div>
                <div>
                  <label className="text-noir mb-1.5 block text-sm font-semibold">Salaire brut mensuel (€)</label>
                  <input className={FIELD} inputMode="decimal" value={salaireBrut} onChange={(e) => setSalaireBrut(e.target.value)} placeholder="2200" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-noir mb-1.5 block text-sm font-semibold">Heures / semaine</label>
                  <input className={FIELD} inputMode="decimal" value={heuresSemaine} onChange={(e) => setHeuresSemaine(e.target.value)} />
                </div>
                <div>
                  <label className="text-noir mb-1.5 block text-sm font-semibold">
                    Convention collective{" "}
                    <span className="text-gris font-normal">(optionnel)</span>
                  </label>
                  <input className={FIELD} placeholder="Laissez vide si inconnue" value={convention} onChange={(e) => setConvention(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-noir mb-1.5 block text-sm font-semibold">Lieu de travail</label>
                <input className={FIELD} value={lieuTravail} onChange={(e) => setLieuTravail(e.target.value)} />
              </div>
            </div>
          )}

          {key === "verification" && (
            done ? (
              <div className="py-6 text-center">
                <div className="bg-vert-l text-vert mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full">
                  <Check size={24} />
                </div>
                <p className="text-noir text-lg font-bold">Contrat généré 🎉</p>
                <p className="text-gris mt-1 text-sm">Le PDF a été téléchargé.</p>
                {lastDonnees && (
                  <div className="mt-5 text-left">
                    <EmailCopy type="contrat-travail" donnees={lastDonnees} defaultEmail={sal?.email ?? ""} />
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
                  <Row label="Type" value={typeContrat.toUpperCase()} pad />
                  <Row label="Poste" value={poste || "—"} pad />
                  <Row label="Début" value={dateDebut || "—"} pad />
                  <Row label="Salaire brut" value={salaireBrut ? `${salaireBrut} €` : "—"} pad strong />
                </div>
                {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
                <button onClick={generer} disabled={busy} className="bg-orange hover:bg-orange-d inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-base font-bold text-white disabled:opacity-50">
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  Générer le contrat de travail — {prixDoc("contrat-travail")}&nbsp;€
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
                  <button onClick={() => { if (key === "etatcivil") saveEtatCivil(); goNext(); }} disabled={!!manque} className="bg-noir inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
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

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Download, Loader2, Plus, Trash2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { EmailCopy } from "@/components/documents/EmailCopy";
import { Row, ProgressBar, RequisHint, FIELD } from "@/components/flow/Steps";
import { localStore } from "@/lib/local/store";

const FORMES = ["SARL", "SAS", "EURL", "SASU"] as const;
const LABELS: Record<string, string> = {
  societe: "La société",
  associes: "Les associés",
  capital: "Le capital",
  dirigeant: "Le dirigeant",
  verification: "Vérification",
};

const eur = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

function todayFr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

type Asso = { nom: string; adresse: string; apport: string };

export default function StatutsSocieteFlow() {
  const [ready, setReady] = useState(false);
  const [i, setI] = useState(0);
  const steps = ["societe", "associes", "capital", "dirigeant", "verification"];

  const [forme, setForme] = useState<(typeof FORMES)[number]>("SARL");
  const [denomination, setDenomination] = useState("");
  const [objet, setObjet] = useState("");
  const [siege, setSiege] = useState("");
  const [dureeSoc, setDureeSoc] = useState("99 ans");
  const [capitalSaisi, setCapitalSaisi] = useState(""); // vide → somme des apports
  const [valeurTitre, setValeurTitre] = useState("10");
  const [associes, setAssocies] = useState<Asso[]>([{ nom: "", adresse: "", apport: "" }]);
  const [dirigeantNom, setDirigeantNom] = useState("");
  const [dirigeantAdresse, setDirigeantAdresse] = useState("");
  const [exerciceDebut, setExerciceDebut] = useState("1er janvier");
  const [exerciceFin, setExerciceFin] = useState("31 décembre");
  const [depotBanque, setDepotBanque] = useState("");
  const [ville, setVille] = useState("");

  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [lastDonnees, setLastDonnees] = useState<Record<string, unknown> | null>(null);

  useEffect(() => setReady(true), []);

  const n = (v: string) => parseFloat(v.replace(",", ".")) || 0;
  const sommeApports = useMemo(() => associes.reduce((s, a) => s + n(a.apport), 0), [associes]);
  // Capital : saisi explicitement, sinon égal à la somme des apports.
  const capital = capitalSaisi.trim() !== "" ? n(capitalSaisi) : sommeApports;
  const nbParts = n(valeurTitre) > 0 ? Math.round(capital / n(valeurTitre)) : 0;
  const capitalIncoherent = capitalSaisi.trim() !== "" && sommeApports > 0 && n(capitalSaisi) !== sommeApports;

  if (!ready) return null;

  const key = steps[i];
  const goNext = () => setI((v) => Math.min(steps.length - 1, v + 1));
  const goBack = () => setI((v) => Math.max(0, v - 1));
  const setAsso = (idx: number, k: keyof Asso, v: string) =>
    setAssocies((p) => p.map((a, j) => (j === idx ? { ...a, [k]: v } : a)));

  // Champ obligatoire manquant sur l'étape courante (null = rien ne manque).
  const assoRemplis = associes.filter((a) => a.nom.trim());
  const manque =
    key === "societe"
      ? !denomination.trim()
        ? "Indiquez la dénomination sociale (le nom de la société)."
        : !siege.trim()
          ? "Indiquez l'adresse du siège social."
          : !objet.trim()
            ? "Décrivez l'objet social (l'activité de la société)."
            : null
      : key === "associes"
        ? assoRemplis.length === 0
          ? "Ajoutez au moins un associé (nom et apport)."
          : assoRemplis.some((a) => !(n(a.apport) > 0))
            ? "Indiquez l'apport en euros de chaque associé."
            : null
        : key === "capital"
          ? !(capital > 0)
            ? "Le capital social doit être supérieur à 0 €."
            : !(n(valeurTitre) > 0)
              ? "Indiquez la valeur d'une part (ou action)."
              : null
          : key === "dirigeant"
            ? !dirigeantNom.trim()
              ? `Indiquez le nom du ${forme === "SARL" || forme === "EURL" ? "gérant" : "président"}.`
              : null
            : null;

  async function generer() {
    if (busy) return;
    setBusy(true);
    setErr("");
    const donnees = {
      forme,
      denomination,
      objet,
      siege,
      duree: dureeSoc,
      capital: String(capital),
      valeurTitre: String(n(valeurTitre)),
      associes: associes
        .filter((a) => a.nom.trim())
        .map((a) => ({ nom: a.nom, adresse: a.adresse, apport: n(a.apport) })),
      dirigeantNom,
      dirigeantAdresse,
      exerciceDebut,
      exerciceFin,
      depotBanque,
      ville,
      date: todayFr(),
    };
    const filename = `statuts-${(denomination || "societe").replace(/\s+/g, "-").toLowerCase()}.pdf`;
    const docMeta = {
      type: "statuts-societe",
      titre: "Statuts de société",
      libelle: denomination || forme,
      montant: capital,
      refaireHref: "/statuts-societe",
      creeLe: new Date().toISOString(),
    };
    setLastDonnees(donnees);
    try {
      const co = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "statuts-societe", slug: "statuts-societe" }),
      });
      const cod = (await co.json().catch(() => ({}))) as { url?: string; paymentDisabled?: boolean; error?: string };
      if (cod?.url) {
        sessionStorage.setItem("shiftoffice:pending:statuts-societe", JSON.stringify({ type: "statuts-societe", donnees, filename, docMeta }));
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
        body: JSON.stringify({ type_document: "statuts-societe", donnees }),
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

        <div className="border-or/20 rounded-2xl border bg-white p-5 sm:p-6">
          {key === "societe" && (
            <div className="space-y-4">
              <div>
                <L>Forme juridique</L>
                <div className="bg-creme inline-flex flex-wrap rounded-lg p-1">
                  {FORMES.map((fo) => (
                    <button key={fo} type="button" onClick={() => setForme(fo)} className={`rounded-md px-4 py-1.5 text-sm font-bold transition-colors ${forme === fo ? "bg-noir text-white" : "text-gris"}`}>{fo}</button>
                  ))}
                </div>
              </div>
              <div><L>Dénomination</L><input className={FIELD} value={denomination} onChange={(e) => setDenomination(e.target.value)} placeholder="Ex. Martin & Co" /></div>
              <div><L>Objet social</L><input className={FIELD} value={objet} onChange={(e) => setObjet(e.target.value)} placeholder="Conseil aux entreprises…" /></div>
              <div><L>Siège social</L><input className={FIELD} value={siege} onChange={(e) => setSiege(e.target.value)} placeholder="12 rue… 84100 Orange" /></div>
            </div>
          )}

          {key === "associes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-noir font-display text-lg font-bold">Les associés</h3>
                <span className="text-gris text-sm">Capital : <strong className="text-noir">{eur(capital)}</strong></span>
              </div>
              {associes.map((a, idx) => (
                <div key={idx} className="border-or/20 space-y-2 rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gris text-xs font-bold">Associé {idx + 1}</span>
                    {associes.length > 1 && (
                      <button type="button" onClick={() => setAssocies((p) => p.filter((_, j) => j !== idx))} className="text-gris hover:text-red-600"><Trash2 size={14} /></button>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input className={FIELD} placeholder="Nom" value={a.nom} onChange={(e) => setAsso(idx, "nom", e.target.value)} />
                    <input className={FIELD} inputMode="decimal" placeholder="Apport (€)" value={a.apport} onChange={(e) => setAsso(idx, "apport", e.target.value)} />
                  </div>
                  <input className={FIELD} placeholder="Adresse" value={a.adresse} onChange={(e) => setAsso(idx, "adresse", e.target.value)} />
                </div>
              ))}
              <button type="button" onClick={() => setAssocies((p) => [...p, { nom: "", adresse: "", apport: "" }])} className="border-or/30 text-or-d hover:bg-or/5 inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed px-4 py-2.5 text-sm font-bold">
                <Plus size={16} /> Ajouter un associé
              </button>
            </div>
          )}

          {key === "capital" && (
            <div className="space-y-4">
              <div>
                <L>Capital social (€)</L>
                <input
                  className={FIELD}
                  inputMode="decimal"
                  placeholder={sommeApports > 0 ? `${sommeApports} (somme des apports)` : "Ex. 5000"}
                  value={capitalSaisi}
                  onChange={(e) => setCapitalSaisi(e.target.value)}
                />
                <p className="text-gris mt-1.5 text-xs">
                  Laissez vide pour reprendre automatiquement la somme des apports ({eur(sommeApports)}).
                </p>
                {capitalIncoherent && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                    ⚠️ Le capital saisi ({eur(n(capitalSaisi))}) diffère de la somme des apports ({eur(sommeApports)}).
                    Dans des statuts, le capital doit correspondre aux apports — vérifiez vos montants.
                  </p>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <L>{forme === "SAS" || forme === "SASU" ? "Valeur d'une action (€)" : "Valeur d'une part (€)"}</L>
                  <input className={FIELD} inputMode="decimal" value={valeurTitre} onChange={(e) => setValeurTitre(e.target.value)} />
                </div>
                <div><L>Durée de la société</L><input className={FIELD} value={dureeSoc} onChange={(e) => setDureeSoc(e.target.value)} /></div>
              </div>
              {nbParts > 0 && (
                <div className="border-or/30 bg-or/5 rounded-xl border p-4">
                  <Row label={forme === "SAS" || forme === "SASU" ? "Nombre d'actions" : "Nombre de parts sociales"} value={`${nbParts} × ${eur(n(valeurTitre))}`} strong />
                  {associes.filter((a) => a.nom.trim() && n(a.apport) > 0).map((a, idx) => (
                    <Row key={idx} label={a.nom} value={`${n(valeurTitre) > 0 ? Math.round(n(a.apport) / n(valeurTitre)) : 0} ${forme === "SAS" || forme === "SASU" ? "actions" : "parts"}`} muted />
                  ))}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div><L>Début d'exercice social</L><input className={FIELD} value={exerciceDebut} onChange={(e) => setExerciceDebut(e.target.value)} /></div>
                <div><L>Fin d'exercice social</L><input className={FIELD} value={exerciceFin} onChange={(e) => setExerciceFin(e.target.value)} /></div>
              </div>
              <div>
                <L>Banque de dépôt des fonds (optionnel)</L>
                <input className={FIELD} value={depotBanque} onChange={(e) => setDepotBanque(e.target.value)} placeholder="Ex. Crédit Agricole, agence d'Orange" />
                <p className="text-gris mt-1.5 text-xs">Le certificat du dépositaire est exigé pour l&apos;immatriculation.</p>
              </div>
            </div>
          )}

          {key === "dirigeant" && (
            <div className="space-y-4">
              <h3 className="text-noir font-display text-lg font-bold">Le dirigeant</h3>
              <div><L>Nom du gérant / président</L><input className={FIELD} value={dirigeantNom} onChange={(e) => setDirigeantNom(e.target.value)} placeholder="Ex. Johane Achouri" /></div>
              <div><L>Adresse du dirigeant</L><input className={FIELD} value={dirigeantAdresse} onChange={(e) => setDirigeantAdresse(e.target.value)} /></div>
              <div><L>Ville de signature</L><input className={FIELD} value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Orange" /></div>
            </div>
          )}

          {key === "verification" && (
            done ? (
              <div className="py-6 text-center">
                <div className="bg-vert-l text-vert mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full"><Check size={24} /></div>
                <p className="text-noir text-lg font-bold">Statuts générés 🎉</p>
                <p className="text-gris mt-1 text-sm">Le PDF a été téléchargé.</p>
                {lastDonnees && <div className="mt-5 text-left"><EmailCopy type="statuts-societe" donnees={lastDonnees} defaultEmail="" /></div>}
                <Link href="/espace" className="bg-noir mt-5 inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white">Mon espace</Link>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-noir font-display text-lg font-bold">Récapitulatif</h3>
                <div className="divide-or/10 divide-y">
                  <Row label="Forme" value={forme} pad />
                  <Row label="Dénomination" value={denomination || "—"} pad />
                  <Row label="Associés" value={String(associes.filter((a) => a.nom.trim()).length)} pad />
                  <Row label="Dirigeant" value={dirigeantNom || "—"} pad />
                  <Row label={forme === "SAS" || forme === "SASU" ? "Actions" : "Parts sociales"} value={nbParts > 0 ? `${nbParts} × ${eur(n(valeurTitre))}` : "—"} pad />
                  <Row label="Capital" value={eur(capital)} pad strong />
                </div>
                {capitalIncoherent && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                    ⚠️ Capital saisi ≠ somme des apports — vérifiez avant de générer.
                  </p>
                )}
                {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
                <button onClick={generer} disabled={busy} className="bg-orange hover:bg-orange-d inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-base font-bold text-white disabled:opacity-50">
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  Générer les statuts
                </button>
              </div>
            )
          )}

          {!done && (
            <>
              <RequisHint msg={manque} />
              <div className="mt-6 flex items-center justify-between">
                <button onClick={goBack} disabled={i === 0} className="text-gris hover:text-noir inline-flex items-center gap-1.5 text-sm font-semibold disabled:opacity-0"><ArrowLeft size={16} /> Précédent</button>
                {key !== "verification" && (
                  <button onClick={goNext} disabled={!!manque} className="bg-noir inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">Continuer <ArrowRight size={16} /></button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

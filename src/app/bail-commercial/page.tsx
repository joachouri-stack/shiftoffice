"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Download, Loader2, Plus, Trash2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { EmailCopy } from "@/components/documents/EmailCopy";
import { EntrepriseStep, Row, ProgressBar, RequisHint, FIELD } from "@/components/flow/Steps";
import { localStore, type LocalEntreprise } from "@/lib/local/store";
import { savePdf } from "@/lib/local/pdfs";
import { useDraft } from "@/lib/local/draft";
import { formatDateInput } from "@/lib/dates";
import { adresseComplete } from "@/lib/adresse";

const LABELS: Record<string, string> = {
  entreprise: "Votre entreprise (bailleur)",
  type: "Type de bail",
  preneur: "Le preneur",
  local: "Le local & le matériel",
  loyer: "Conditions financières",
  duree: "Durée du bail",
  verification: "Vérification",
};

const INDICES = [
  "ILC (Indice des loyers commerciaux)",
  "ILAT (Indice des loyers des activités tertiaires)",
];

type Materiel = { designation: string; etat: string };

const eur = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

function todayFr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function BailCommercialFlow() {
  const [ready, setReady] = useState(false);
  const [ent, setEnt] = useState<LocalEntreprise | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [i, setI] = useState(0);

  const [typeBail, setTypeBail] = useState<"commercial" | "precaire">("commercial");

  const [preneurNom, setPreneurNom] = useState("");
  const [preneurAdresse, setPreneurAdresse] = useState("");
  const [preneurRcs, setPreneurRcs] = useState("");

  const [adresseLocal, setAdresseLocal] = useState("");
  const [descriptionLocal, setDescriptionLocal] = useState("");
  const [surface, setSurface] = useState("");
  const [destination, setDestination] = useState("");
  const [equipe, setEquipe] = useState(false);
  const [materiel, setMateriel] = useState<Materiel[]>([{ designation: "", etat: "bon état" }]);

  const [loyerAnnuel, setLoyerAnnuel] = useState("");
  const [depotGarantie, setDepotGarantie] = useState("");
  const [pasDePorte, setPasDePorte] = useState("");
  const [pasDePorteNature, setPasDePorteNature] = useState<"supplement" | "indemnite">("supplement");
  const [charges, setCharges] = useState("");

  const [dateDebut, setDateDebut] = useState(todayFr());
  const [dureeAnnees, setDureeAnnees] = useState("9");
  const [dureeMois, setDureeMois] = useState("24");
  const [indiceRevision, setIndiceRevision] = useState(INDICES[0]);

  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [lastDonnees, setLastDonnees] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const e = localStore.getEntreprise();
    setEnt(e);
    const list: string[] = [];
    if (!e) list.push("entreprise");
    list.push("type", "preneur", "local", "loyer", "duree", "verification");
    setSteps(list);
    setReady(true);
  }, []);

  // Brouillon : la saisie survit à un rechargement de page (24 h).
  useDraft("bail-commercial", ready, done, {
    typeBail: [typeBail, setTypeBail],
    preneurNom: [preneurNom, setPreneurNom],
    preneurAdresse: [preneurAdresse, setPreneurAdresse],
    preneurRcs: [preneurRcs, setPreneurRcs],
    adresseLocal: [adresseLocal, setAdresseLocal],
    descriptionLocal: [descriptionLocal, setDescriptionLocal],
    surface: [surface, setSurface],
    destination: [destination, setDestination],
    equipe: [equipe, setEquipe],
    materiel: [materiel, setMateriel],
    loyerAnnuel: [loyerAnnuel, setLoyerAnnuel],
    depotGarantie: [depotGarantie, setDepotGarantie],
    pasDePorte: [pasDePorte, setPasDePorte],
    pasDePorteNature: [pasDePorteNature, setPasDePorteNature],
    charges: [charges, setCharges],
    dateDebut: [dateDebut, setDateDebut],
    dureeAnnees: [dureeAnnees, setDureeAnnees],
    dureeMois: [dureeMois, setDureeMois],
    indiceRevision: [indiceRevision, setIndiceRevision],
  });

  if (!ready) return null;

  const n = (v: string) => parseFloat(v.replace(",", ".")) || 0;
  const key = steps[i] ?? "verification";
  const goNext = () => setI((v) => Math.min(steps.length - 1, v + 1));
  const goBack = () => setI((v) => Math.max(0, v - 1));
  const setMat = (idx: number, k: keyof Materiel, v: string) =>
    setMateriel((p) => p.map((m, j) => (j === idx ? { ...m, [k]: v } : m)));

  const precaire = typeBail === "precaire";
  const duree = precaire ? `${n(dureeMois) || "—"} mois` : `${n(dureeAnnees) || 9} ans`;
  const dureeIllegale = precaire && n(dureeMois) > 36;
  const mensuel = n(loyerAnnuel) / 12;

  // Champ obligatoire manquant sur l'étape courante (null = rien ne manque).
  const manque =
    key === "preneur"
      ? !preneurNom.trim()
        ? "Indiquez le nom du preneur (locataire)."
        : null
      : key === "local"
        ? !adresseLocal.trim()
          ? "Indiquez l'adresse du local loué."
          : null
        : key === "loyer"
          ? !(n(loyerAnnuel) > 0)
            ? "Indiquez le loyer annuel hors charges."
            : null
          : key === "duree"
            ? !dateDebut.trim()
              ? "Indiquez la date de prise d'effet du bail."
              : dureeIllegale
                ? "Durée illégale pour un bail précaire : 36 mois maximum."
                : null
            : null;

  async function generer() {
    if (busy || dureeIllegale) return;
    setBusy(true);
    setErr("");
    const donnees = {
      typeBail,
      bailleurNom: ent?.nom ?? "",
      bailleurAdresse: adresseComplete(ent?.adresse, ent?.codePostal, ent?.ville),
      bailleurQualite: ent?.representantQualite || "Propriétaire",
      bailleurSiret: ent?.siret ?? "",
      preneurNom,
      preneurAdresse,
      preneurRcs,
      adresseLocal,
      descriptionLocal,
      surface,
      destination,
      materiel: equipe ? materiel.filter((m) => m.designation.trim()) : [],
      loyerAnnuel: String(n(loyerAnnuel)),
      depotGarantie: String(n(depotGarantie)),
      pasDePorte: String(n(pasDePorte)),
      pasDePorteNature,
      charges,
      indiceRevision,
      dateDebut,
      duree,
      ville: ent?.ville ?? "",
      date: todayFr(),
    };
    const filename = `bail-${precaire ? "precaire" : "commercial"}-${(preneurNom || "preneur").replace(/\s+/g, "-").toLowerCase()}.pdf`;
    const docMeta = {
      type: "bail-commercial",
      titre: precaire ? "Bail précaire" : "Bail commercial",
      libelle: [preneurNom || "Preneur", duree].join(" · "),
      montant: n(loyerAnnuel),
      refaireHref: "/bail-commercial",
      creeLe: new Date().toISOString(),
    };
    setLastDonnees(donnees);
    try {
      const co = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "bail-commercial", slug: "bail-commercial" }),
      });
      const cod = (await co.json().catch(() => ({}))) as { url?: string; paymentDisabled?: boolean; error?: string };
      if (cod?.url) {
        sessionStorage.setItem(
          "shiftoffice:pending:bail-commercial",
          JSON.stringify({ type: "bail-commercial", donnees, filename, docMeta })
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
        body: JSON.stringify({ type_document: "bail-commercial", donnees }),
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

        {ent?.nom && <div className="text-gris mb-4 text-sm">Bailleur : <strong className="text-noir">{ent.nom}</strong></div>}

        <div className="border-or/20 rounded-2xl border bg-white p-5 sm:p-6">
          {key === "entreprise" && (
            <EntrepriseStep onSave={(e) => { localStore.setEntreprise(e); setEnt(e); goNext(); }} />
          )}

          {key === "type" && (
            <div className="space-y-3">
              <L>Quel type de bail ?</L>
              <button
                type="button"
                onClick={() => setTypeBail("commercial")}
                className={`w-full rounded-xl border px-4 py-3.5 text-left transition-colors ${typeBail === "commercial" ? "border-noir bg-noir text-white" : "border-or/30 hover:border-or"}`}
              >
                <span className="block text-sm font-bold">Bail commercial (3-6-9)</span>
                <span className={`mt-0.5 block text-xs ${typeBail === "commercial" ? "text-white/70" : "text-gris"}`}>
                  9 ans, résiliable tous les 3 ans. Le preneur a droit au renouvellement
                  et à l&apos;indemnité d&apos;éviction. Le cadre classique d&apos;un commerce.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTypeBail("precaire")}
                className={`w-full rounded-xl border px-4 py-3.5 text-left transition-colors ${typeBail === "precaire" ? "border-noir bg-noir text-white" : "border-or/30 hover:border-or"}`}
              >
                <span className="block text-sm font-bold">Bail précaire / dérogatoire (≤ 3 ans)</span>
                <span className={`mt-0.5 block text-xs ${typeBail === "precaire" ? "text-white/70" : "text-gris"}`}>
                  Courte durée (art. L. 145-5) : 3 ans maximum, sans droit au
                  renouvellement ni indemnité d&apos;éviction. Idéal pour tester une
                  activité ou un emplacement.
                </span>
              </button>
            </div>
          )}

          {key === "preneur" && (
            <div className="space-y-4">
              <h3 className="text-noir font-display text-lg font-bold">Le preneur (locataire)</h3>
              <input className={FIELD} placeholder="Nom / dénomination du preneur" value={preneurNom} onChange={(e) => setPreneurNom(e.target.value)} />
              <input className={FIELD} placeholder="Adresse ou siège du preneur" value={preneurAdresse} onChange={(e) => setPreneurAdresse(e.target.value)} />
              <input className={FIELD} placeholder="RCS / SIRET du preneur" value={preneurRcs} onChange={(e) => setPreneurRcs(e.target.value)} />
            </div>
          )}

          {key === "local" && (
            <div className="space-y-4">
              <div><L>Adresse du local</L><input className={FIELD} value={adresseLocal} onChange={(e) => setAdresseLocal(e.target.value)} placeholder="10 rue du Commerce, 84100 Orange" /></div>
              <div><L>Description</L><input className={FIELD} value={descriptionLocal} onChange={(e) => setDescriptionLocal(e.target.value)} placeholder="Local commercial en rez-de-chaussée, réserve, vitrine" /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><L>Surface (m²)</L><input className={FIELD} inputMode="decimal" value={surface} onChange={(e) => setSurface(e.target.value)} placeholder="80" /></div>
                <div><L>Activité autorisée (destination)</L><input className={FIELD} value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Commerce de détail" /></div>
              </div>

              <div className="border-or/20 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-noir text-sm font-semibold">Local loué équipé ?</p>
                    <p className="text-gris text-xs">Le matériel mis à disposition sera inventorié dans le bail.</p>
                  </div>
                  <div className="bg-creme inline-flex rounded-lg p-1">
                    {([false, true] as const).map((v) => (
                      <button key={String(v)} type="button" onClick={() => setEquipe(v)} className={`rounded-md px-4 py-1.5 text-sm font-bold transition-colors ${equipe === v ? "bg-noir text-white" : "text-gris"}`}>
                        {v ? "Oui" : "Non"}
                      </button>
                    ))}
                  </div>
                </div>

                {equipe && (
                  <div className="mt-4 space-y-2.5">
                    {materiel.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input className={FIELD} placeholder="Désignation (ex. Four professionnel)" value={m.designation} onChange={(e) => setMat(idx, "designation", e.target.value)} />
                        <input className={`${FIELD} max-w-[130px]`} placeholder="État" value={m.etat} onChange={(e) => setMat(idx, "etat", e.target.value)} />
                        {materiel.length > 1 && (
                          <button type="button" onClick={() => setMateriel((p) => p.filter((_, j) => j !== idx))} className="text-gris hover:text-red-600 shrink-0"><Trash2 size={15} /></button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => setMateriel((p) => [...p, { designation: "", etat: "bon état" }])} className="border-or/30 text-or-d hover:bg-or/5 inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed px-4 py-2 text-sm font-bold">
                      <Plus size={15} /> Ajouter un équipement
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {key === "loyer" && (
            <div className="space-y-4">
              <div>
                <L>Loyer annuel HT hors charges (€)</L>
                <input className={FIELD} inputMode="decimal" value={loyerAnnuel} onChange={(e) => setLoyerAnnuel(e.target.value)} placeholder="12000" />
                {mensuel > 0 && <p className="text-gris mt-1.5 text-xs">Soit <strong className="text-noir">{eur(mensuel)}</strong> par mois.</p>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><L>Dépôt de garantie (€)</L><input className={FIELD} inputMode="decimal" value={depotGarantie} onChange={(e) => setDepotGarantie(e.target.value)} placeholder="3000" /></div>
                <div><L>Charges (précision libre)</L><input className={FIELD} value={charges} onChange={(e) => setCharges(e.target.value)} placeholder="Provision mensuelle de 80 €." /></div>
              </div>

              <div className="border-or/20 rounded-xl border p-4">
                <L>Pas-de-porte (droit d&apos;entrée) — optionnel</L>
                <input className={FIELD} inputMode="decimal" value={pasDePorte} onChange={(e) => setPasDePorte(e.target.value)} placeholder="0 si aucun" />
                {n(pasDePorte) > 0 && (
                  <div className="mt-3">
                    <p className="text-gris mb-1.5 text-xs">Nature juridique de la somme (incidence fiscale) :</p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setPasDePorteNature("supplement")} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${pasDePorteNature === "supplement" ? "bg-noir text-white" : "bg-creme text-gris"}`}>
                        Supplément de loyer
                      </button>
                      <button type="button" onClick={() => setPasDePorteNature("indemnite")} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${pasDePorteNature === "indemnite" ? "bg-noir text-white" : "bg-creme text-gris"}`}>
                        Indemnité définitive
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {key === "duree" && (
            <div className="space-y-4">
              <div><L>Date de prise d&apos;effet</L><input className={FIELD} value={dateDebut} onChange={(e) => setDateDebut(formatDateInput(e.target.value, dateDebut))} /></div>
              {precaire ? (
                <div>
                  <L>Durée (mois — 36 maximum)</L>
                  <input className={FIELD} inputMode="numeric" value={dureeMois} onChange={(e) => setDureeMois(e.target.value)} placeholder="24" />
                  {dureeIllegale && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                      <span>Un bail dérogatoire ne peut pas dépasser 3 ans (36 mois), renouvellements compris — art. L. 145-5 du Code de commerce.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <L>Durée (années)</L>
                  <input className={FIELD} inputMode="numeric" value={dureeAnnees} onChange={(e) => setDureeAnnees(e.target.value)} />
                  <p className="text-gris mt-1.5 text-xs">9 ans est la durée légale minimale du bail commercial, résiliable par le preneur tous les 3 ans.</p>
                </div>
              )}
              <div>
                <L>Indice de révision</L>
                <div className="flex flex-wrap gap-2">
                  {INDICES.map((ind) => (
                    <button key={ind} type="button" onClick={() => setIndiceRevision(ind)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${indiceRevision === ind ? "bg-noir text-white" : "bg-creme text-gris"}`}>
                      {ind.split(" ")[0]}
                    </button>
                  ))}
                </div>
                <p className="text-gris mt-1.5 text-xs">ILC pour un commerce, ILAT pour des bureaux / activités tertiaires.</p>
              </div>
            </div>
          )}

          {key === "verification" && (
            done ? (
              <div className="py-6 text-center">
                <div className="bg-vert-l text-vert mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full"><Check size={24} /></div>
                <p className="text-noir text-lg font-bold">Bail généré 🎉</p>
                <p className="text-gris mt-1 text-sm">Le PDF a été téléchargé.</p>
                {lastDonnees && <div className="mt-5 text-left"><EmailCopy type="bail-commercial" donnees={lastDonnees} defaultEmail="" /></div>}
                <Link href="/espace" className="bg-noir mt-5 inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white">Mon espace</Link>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-noir font-display text-lg font-bold">Récapitulatif</h3>
                <div className="divide-or/10 divide-y">
                  <Row label="Type de bail" value={precaire ? "Bail précaire (L. 145-5)" : "Bail commercial 3-6-9"} pad strong />
                  <Row label="Bailleur" value={ent?.nom ?? "—"} pad />
                  <Row label="Preneur" value={preneurNom || "—"} pad />
                  <Row label="Local" value={adresseLocal || "—"} pad />
                  <Row label="Matériel inclus" value={equipe ? `${materiel.filter((m) => m.designation.trim()).length} équipement(s)` : "Non"} pad />
                  <Row label="Durée" value={duree} pad />
                  <Row label="Loyer annuel HT" value={eur(n(loyerAnnuel))} pad />
                  {n(pasDePorte) > 0 && <Row label="Pas-de-porte" value={eur(n(pasDePorte))} pad />}
                  <Row label="Dépôt de garantie" value={n(depotGarantie) > 0 ? eur(n(depotGarantie)) : "Aucun"} pad />
                </div>
                {dureeIllegale && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>Durée illégale pour un bail précaire : 36 mois maximum.</span>
                  </div>
                )}
                {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
                <button onClick={generer} disabled={busy || dureeIllegale} className="bg-orange hover:bg-orange-d inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-base font-bold text-white disabled:opacity-50">
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  {dureeIllegale ? "Corrigez la durée pour générer" : `Générer le ${precaire ? "bail précaire" : "bail commercial"}`}
                </button>
              </div>
            )
          )}

          {!done && key !== "entreprise" && (
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

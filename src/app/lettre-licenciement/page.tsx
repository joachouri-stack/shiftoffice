"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Download, Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { EmailCopy } from "@/components/documents/EmailCopy";
import { EntrepriseStep, SalarieStep, Row, ProgressBar, FIELD } from "@/components/flow/Steps";
import { localStore, type LocalEntreprise, type LocalSalarie } from "@/lib/local/store";
import { adresseComplete } from "@/lib/adresse";
import {
  calculerAnciennete,
  calculerPreavis,
  calculerIndemnite,
  verifierDelaisLegaux,
  type TypeLicenciement,
} from "@/lib/paie/licenciement";

const LABELS: Record<string, string> = {
  entreprise: "Votre entreprise",
  salarie: "Le salarié licencié",
  type: "Type de licenciement",
  motifs: "Les motifs",
  dates: "Dates et indemnités",
  verification: "Vérification",
};

const TYPES: Array<{ key: TypeLicenciement; label: string; hint: string }> = [
  { key: "cause-reelle", label: "Cause réelle et sérieuse", hint: "Décrivez les faits reprochés ou l'insuffisance professionnelle constatée, avec des éléments précis et datés." },
  { key: "faute-grave", label: "Faute grave", hint: "Décrivez précisément les faits fautifs et la date à laquelle ils se sont produits. La faute grave prive d'indemnité et de préavis." },
  { key: "faute-lourde", label: "Faute lourde", hint: "Décrivez les faits fautifs et l'intention de nuire à l'employeur. La faute lourde prive d'indemnité et de préavis." },
  { key: "economique", label: "Licenciement économique", hint: "Décrivez les difficultés économiques, mutations technologiques ou réorganisations. Le reclassement doit avoir été recherché." },
];

const eur = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

function todayFr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function LicenciementFlow() {
  const [ready, setReady] = useState(false);
  const [ent, setEnt] = useState<LocalEntreprise | null>(null);
  const [sal, setSal] = useState<LocalSalarie | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [i, setI] = useState(0);

  const [dateEmbauche, setDateEmbauche] = useState("");
  const [typeContrat, setTypeContrat] = useState("CDI");
  const [salaireBrut, setSalaireBrut] = useState("");
  const [typeKey, setTypeKey] = useState<TypeLicenciement>("cause-reelle");
  const [motifs, setMotifs] = useState("");
  const [dateEntretien, setDateEntretien] = useState("");
  const [dateEnvoi, setDateEnvoi] = useState("");

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
    setDateEnvoi(todayFr());
    const list: string[] = [];
    if (!e) list.push("entreprise");
    list.push("salarie", "type", "motifs", "dates", "verification");
    setSteps(list);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const n = (v: string) => parseFloat(v.replace(",", ".")) || 0;

  function applySalarie(s: LocalSalarie) {
    setSal(s);
    if (s.dateEntree) setDateEmbauche(s.dateEntree);
    if (s.typeContrat) setTypeContrat(s.typeContrat);
    if (s.salaireBrut) setSalaireBrut(String(s.salaireBrut));
  }

  const anc = useMemo(() => calculerAnciennete(dateEmbauche), [dateEmbauche]);
  const preavis = useMemo(() => calculerPreavis(anc, typeKey), [anc, typeKey]);
  const indemnite = useMemo(
    () => calculerIndemnite(dateEmbauche, n(salaireBrut), typeKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateEmbauche, salaireBrut, typeKey]
  );
  const delais = useMemo(
    () => verifierDelaisLegaux(dateEntretien, dateEnvoi),
    [dateEntretien, dateEnvoi]
  );

  if (!ready) return null;

  const key = steps[i] ?? "verification";
  const goNext = () => setI((v) => Math.min(steps.length - 1, v + 1));
  const goBack = () => setI((v) => Math.max(0, v - 1));
  const ancLabel =
    anc.totalMois > 0
      ? [anc.annees ? `${anc.annees} an${anc.annees > 1 ? "s" : ""}` : "", anc.mois ? `${anc.mois} mois` : ""].filter(Boolean).join(" et ")
      : "moins d'un mois";

  async function generer() {
    if (busy || !delais.ok) return;
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
      dateEmbauche,
      typeContrat,
      salaireBrut: String(n(salaireBrut)),
      typeLicenciement: typeKey,
      motifs,
      dateEntretien,
      dateEnvoi,
      ville: ent?.ville ?? "",
      date: dateEnvoi || todayFr(),
    };
    const filename = `lettre-licenciement-${(sal?.nom ?? "salarie").replace(/\s+/g, "-").toLowerCase()}.pdf`;
    const docMeta = {
      type: "lettre-licenciement",
      titre: "Lettre de licenciement",
      libelle: [sal?.nom, TYPES.find((t) => t.key === typeKey)?.label].filter(Boolean).join(" · "),
      montant: indemnite.eligible ? indemnite.indemnite : undefined,
      refaireHref: sal?.id ? `/lettre-licenciement?s=${sal.id}` : "/lettre-licenciement",
      creeLe: new Date().toISOString(),
    };
    setLastDonnees(donnees);
    try {
      const co = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "lettre-licenciement", slug: "lettre-licenciement" }),
      });
      const cod = (await co.json().catch(() => ({}))) as { url?: string; paymentDisabled?: boolean; error?: string };
      if (cod?.url) {
        sessionStorage.setItem("shiftoffice:pending:lettre-licenciement", JSON.stringify({ type: "lettre-licenciement", donnees, filename, docMeta }));
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
        body: JSON.stringify({ type_document: "lettre-licenciement", donnees }),
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
  const currentHint = TYPES.find((t) => t.key === typeKey)?.hint ?? "";

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
            {ent?.nom}{sal?.nom && <> · Licenciement de <strong className="text-noir">{sal.nom}</strong></>}
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><L>Date d'embauche</L><input className={FIELD} placeholder="01/03/2024" value={dateEmbauche} onChange={(e) => setDateEmbauche(e.target.value)} /></div>
                  <div><L>Type de contrat</L>
                    <select className={FIELD} value={typeContrat} onChange={(e) => setTypeContrat(e.target.value)}>
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                    </select>
                  </div>
                </div>
                <div><L>Salaire brut mensuel (€)</L><input className={FIELD} inputMode="decimal" value={salaireBrut} onChange={(e) => setSalaireBrut(e.target.value)} /></div>
                {anc.totalMois > 0 && <p className="text-gris text-xs">Ancienneté calculée : {ancLabel}.</p>}
              </div>
            )
          )}

          {key === "type" && (
            <div className="space-y-3">
              <L>Motif du licenciement</L>
              <div className="grid gap-2 sm:grid-cols-2">
                {TYPES.map((t) => (
                  <button key={t.key} type="button" onClick={() => setTypeKey(t.key)} className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${typeKey === t.key ? "border-noir bg-noir text-white" : "border-or/30 text-gris hover:border-or"}`}>{t.label}</button>
                ))}
              </div>
            </div>
          )}

          {key === "motifs" && (
            <div className="space-y-3">
              <h3 className="text-noir font-display text-lg font-bold">{TYPES.find((t) => t.key === typeKey)?.label}</h3>
              <div className="bg-or/5 text-or-d flex items-start gap-2 rounded-lg px-3 py-2 text-xs font-medium">
                <ShieldCheck size={15} className="mt-0.5 shrink-0" /> <span>{currentHint}</span>
              </div>
              <textarea
                className={`${FIELD} h-40 resize-none py-3`}
                placeholder="Exposez les faits de manière précise, datée et objective…"
                value={motifs}
                onChange={(e) => setMotifs(e.target.value)}
              />
            </div>
          )}

          {key === "dates" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div><L>Date de l'entretien préalable</L><input className={FIELD} placeholder="20/07/2026" value={dateEntretien} onChange={(e) => setDateEntretien(e.target.value)} /></div>
                <div><L>Date d'envoi de la lettre</L><input className={FIELD} placeholder="24/07/2026" value={dateEnvoi} onChange={(e) => setDateEnvoi(e.target.value)} /></div>
              </div>
              {!delais.ok && delais.alertes.map((a, idx) => (
                <div key={idx} className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" /> <span>{a.message}</span>
                </div>
              ))}
              <div className="border-or/20 space-y-1.5 rounded-xl border p-4">
                <Row label="Ancienneté" value={ancLabel} />
                <Row label="Préavis" value={preavis} />
                <Row label="Indemnité légale" value={indemnite.eligible ? eur(indemnite.indemnite) : indemnite.motif} strong={indemnite.eligible} />
              </div>
              {(typeKey === "faute-grave" || typeKey === "faute-lourde") && (
                <p className="text-gris text-xs">La faute grave ou lourde prive le salarié de préavis et d'indemnité de licenciement.</p>
              )}
            </div>
          )}

          {key === "verification" && (
            done ? (
              <div className="py-6 text-center">
                <div className="bg-vert-l text-vert mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full"><Check size={24} /></div>
                <p className="text-noir text-lg font-bold">Lettre générée 🎉</p>
                <p className="text-gris mt-1 text-sm">Le PDF a été téléchargé.</p>
                {lastDonnees && <div className="mt-5 text-left"><EmailCopy type="lettre-licenciement" donnees={lastDonnees} defaultEmail={sal?.email ?? ""} /></div>}
                <Link href="/espace" className="bg-noir mt-5 inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white">Mon espace</Link>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-noir font-display text-lg font-bold">Récapitulatif</h3>
                <div className="divide-or/10 divide-y">
                  <Row label="Salarié" value={sal?.nom ?? "—"} pad />
                  <Row label="Motif" value={TYPES.find((t) => t.key === typeKey)?.label ?? "—"} pad />
                  <Row label="Entretien préalable" value={dateEntretien || "—"} pad />
                  <Row label="Envoi de la lettre" value={dateEnvoi || "—"} pad />
                  <Row label="Préavis" value={preavis} pad />
                  <Row label="Indemnité" value={indemnite.eligible ? eur(indemnite.indemnite) : indemnite.motif} pad strong={indemnite.eligible} />
                </div>
                {!delais.ok && delais.alertes.map((a, idx) => (
                  <div key={idx} className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" /> <span>{a.message}</span>
                  </div>
                ))}
                {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
                <button onClick={generer} disabled={busy || !delais.ok} className="bg-orange hover:bg-orange-d inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-base font-bold text-white disabled:opacity-50">
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  {delais.ok ? "Générer et payer 12€" : "Corrigez les délais légaux pour générer"}
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

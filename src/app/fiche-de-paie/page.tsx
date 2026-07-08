"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Loader2,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { EmailCopy } from "@/components/documents/EmailCopy";
import { EntrepriseStep, SalarieStep, Chips, Row, ProgressBar, FIELD } from "@/components/flow/Steps";
import {
  calculerFichePaie,
  brutPourNetAvantImpot,
  SMIC_MENSUEL,
} from "@/lib/paie/calcul";
import {
  localStore,
  type LocalEntreprise,
  type LocalSalarie,
} from "@/lib/local/store";
import { adresseComplete } from "@/lib/adresse";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const LABELS: Record<string, string> = {
  entreprise: "Votre entreprise",
  salarie: "Le salarié",
  remuneration: "La rémunération",
  periode: "La période",
  verification: "Vérification",
};

const eur = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export default function FicheDePaieFlow() {
  const now = new Date();
  const [ready, setReady] = useState(false);
  const [ent, setEnt] = useState<LocalEntreprise | null>(null);
  const [sal, setSal] = useState<LocalSalarie | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [i, setI] = useState(0);

  // Rémunération
  const [mode, setMode] = useState<"brut" | "net">("brut");
  const [brut, setBrut] = useState("");
  const [net, setNet] = useState("");
  const [heures, setHeures] = useState("151.67");
  const [heuresSup, setHeuresSup] = useState(0);
  const [primes, setPrimes] = useState(0);

  // Période
  const [mois, setMois] = useState(MOIS[now.getMonth()]);
  const [annee, setAnnee] = useState(String(now.getFullYear()));
  const [conges, setConges] = useState(0);

  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [repris, setRepris] = useState<string | null>(null);
  const [lastDonnees, setLastDonnees] = useState<Record<string, unknown> | null>(null);

  // Mois suivant à partir d'un libellé mois + année.
  const nextPeriod = (m?: string, a?: string) => {
    const idx = m ? MOIS.indexOf(m) : -1;
    if (idx < 0 || !a) return null;
    const ni = (idx + 1) % 12;
    const ny = ni === 0 ? Number(a) + 1 : Number(a);
    return { mois: MOIS[ni], annee: String(ny) };
  };

  // Reprise : pré-remplit la rémunération depuis la dernière fiche du salarié
  // et avance la période au mois suivant.
  const appliquerReprise = (s: LocalSalarie) => {
    const last = localStore.lastFicheForSalarie(s.id);
    if (!last) {
      if (s.salaireBrut) setBrut(String(s.salaireBrut));
      return;
    }
    setMode("brut");
    setBrut(String(last.brut ?? s.salaireBrut ?? ""));
    if (last.heures) setHeures(last.heures);
    setHeuresSup(last.heuresSup ?? 0);
    setPrimes(last.primes ?? 0);
    setConges(last.conges ?? 0);
    const np = nextPeriod(last.mois, last.annee);
    if (np) {
      setMois(np.mois);
      setAnnee(np.annee);
    }
    setRepris(last.periode);
  };

  useEffect(() => {
    const e = localStore.getEntreprise();
    setEnt(e);
    const id = new URLSearchParams(window.location.search).get("s");
    const found = id ? localStore.getSalaries().find((x) => x.id === id) : null;
    if (found) {
      setSal(found);
      appliquerReprise(found);
    }
    const list: string[] = [];
    if (!e) list.push("entreprise");
    if (!found) list.push("salarie");
    list.push("remuneration", "periode", "verification");
    setSteps(list);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const n = (v: string) => parseFloat(v.replace(",", ".")) || 0;
  const enNet = mode === "net";
  const brutEff = useMemo(
    () => (enNet ? brutPourNetAvantImpot(n(net)) : n(brut)),
    [enNet, net, brut]
  );
  const res = useMemo(
    () =>
      brutEff > 0
        ? calculerFichePaie({ salaireBrut: brutEff, heuresMois: n(heures), heuresSup, primes })
        : null,
    [brutEff, heures, heuresSup, primes]
  );

  if (!ready) return null;

  const key = steps[i] ?? "verification";
  const goNext = () => setI((v) => Math.min(steps.length - 1, v + 1));
  const goBack = () => setI((v) => Math.max(0, v - 1));

  async function generer() {
    if (!res || busy) return;
    setBusy(true);
    setErr("");
    const donnees = {
      entrepriseNom: ent?.nom ?? "",
      entrepriseAdresse: adresseComplete(ent?.adresse, ent?.codePostal, ent?.ville),
      siret: ent?.siret ?? "",
      codeApe: ent?.codeNaf ?? "",
      conventionCollective: ent?.convention ?? "",
      salarieNom: sal?.nom ?? "",
      poste: sal?.poste ?? "",
      typeContrat: sal?.typeContrat ?? "",
      numeroSecu: sal?.numeroSecu ?? "",
      dateEntree: sal?.dateEntree ?? "",
      classification: sal?.classification ?? "",
      periode: `${mois} ${annee}`,
      salaireBrut: String(brutEff),
      heuresMois: heures,
      heuresSup: String(heuresSup),
      heuresSup50: "0",
      primes: String(primes),
      tauxPAS: "0",
      congesPris: String(conges),
      congesAcquis: "0",
    };
    const filename = `fiche-${(sal?.nom ?? "salarie").replace(/\s+/g, "-").toLowerCase()}-${mois.toLowerCase()}-${annee}.pdf`;
    const ficheMeta = {
      salarieId: sal?.id,
      salarieNom: sal?.nom ?? "Salarié",
      periode: `${mois} ${annee}`,
      mois,
      annee,
      brut: res.brut,
      net: res.netPaye,
      heures,
      heuresSup,
      primes,
      conges,
      creeLe: new Date().toISOString(),
    };
    const docMeta = {
      type: "fiche-paie",
      titre: "Fiche de paie",
      libelle: `${sal?.nom ?? "Salarié"} · ${mois} ${annee}`,
      montant: res.netPaye,
      refaireHref: sal?.id ? `/fiche-de-paie?s=${sal.id}` : "/fiche-de-paie",
      creeLe: new Date().toISOString(),
    };
    setLastDonnees(donnees);
    try {
      // 1) Paiement : si Stripe est configuré, on passe par Checkout et la page
      //    de succès génère le PDF après confirmation du paiement.
      const co = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "fiche-paie", slug: "fiche-paie" }),
      });
      const cod = (await co.json().catch(() => ({}))) as {
        url?: string;
        paymentDisabled?: boolean;
        error?: string;
      };
      if (cod?.url) {
        sessionStorage.setItem(
          "shiftoffice:pending:fiche-paie",
          JSON.stringify({ type: "fiche-paie", donnees, filename, ficheMeta, docMeta })
        );
        window.location.assign(cod.url);
        return;
      }

      // Stripe est configuré mais la session n'a pas pu être créée : on le dit
      // clairement, sans retomber en génération « gratuite ».
      if (!cod?.paymentDisabled) {
        setErr(
          cod?.error ??
            "Le paiement n'a pas pu démarrer. Vérifiez votre configuration Stripe, ou réessayez dans un instant."
        );
        setBusy(false);
        return;
      }

      // 2) Stripe non configuré → génération directe.
      const r = await fetch("/api/documents/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type_document: "fiche-paie", donnees }),
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
      localStore.addFiche(ficheMeta);
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
          <Link href="/espace" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white">
            Mon espace
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <ProgressBar index={i} total={steps.length} label={LABELS[key]} />

        {/* Fil d'ariane des infos connues */}
        {(ent || sal) && (
          <div className="text-gris mb-4 text-sm">
            {ent?.nom && <>{ent.nom}</>}
            {sal?.nom && <> · Fiche de <strong className="text-noir">{sal.nom}</strong></>}
          </div>
        )}

        <div className="border-or/20 rounded-2xl border bg-white p-5 sm:p-6">
          {key === "entreprise" && (
            <EntrepriseStep
              onSave={(e) => {
                localStore.setEntreprise(e);
                setEnt(e);
                goNext();
              }}
            />
          )}

          {key === "salarie" && (
            <SalarieStep
              onSelect={(s) => {
                setSal(s);
                appliquerReprise(s);
                goNext();
              }}
            />
          )}

          {key === "remuneration" && (
            <div className="space-y-5">
              {repris && (
                <div className="border-or/30 bg-or/5 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <Sparkles size={15} className="text-or-d shrink-0" />
                  <span className="text-noir font-medium">
                    Repris depuis la fiche de <strong>{repris}</strong> — vérifiez et validez.
                  </span>
                </div>
              )}
              <div className="bg-creme inline-flex rounded-lg p-1">
                {(["brut", "net"] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={`rounded-md px-4 py-1.5 text-sm font-bold transition-colors ${mode === m ? "bg-noir text-white" : "text-gris"}`}>
                    {m === "brut" ? "Je saisis le brut" : "Je saisis le net"}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-noir mb-1.5 block text-sm font-semibold">
                  {enNet ? "Net à payer souhaité (€)" : "Salaire brut mensuel (€)"}
                </label>
                <input className={FIELD} inputMode="decimal" placeholder={enNet ? "1700" : "2200"} value={enNet ? net : brut} onChange={(e) => (enNet ? setNet(e.target.value) : setBrut(e.target.value))} />
                {enNet && brutEff > 0 && (
                  <p className="text-gris mt-1.5 text-xs">Brut calculé : <strong className="text-noir">{eur(brutEff)}</strong></p>
                )}
              </div>
              <div>
                <label className="text-noir mb-1.5 block text-sm font-semibold">Heures mensuelles</label>
                <input className={FIELD} inputMode="decimal" value={heures} onChange={(e) => setHeures(e.target.value)} />
              </div>
              <Chips label="Heures supplémentaires (25 %)" value={heuresSup} options={[0, 2, 5, 10]} fmt={(v) => (v === 0 ? "Aucune" : `${v} h`)} onChange={setHeuresSup} allowCustom />
              <Chips label="Prime ce mois" value={primes} options={[0, 50, 100, 200]} fmt={(v) => (v === 0 ? "Aucune" : `${v} €`)} onChange={setPrimes} allowCustom />
              {res && (
                <div className="border-or/30 bg-or/5 rounded-xl border p-4">
                  <p className="text-or-d mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
                    <Sparkles size={13} /> Aperçu en direct
                  </p>
                  <Row label="Salaire brut" value={eur(res.brut)} />
                  <Row label="Cotisations salariales" value={"- " + eur(res.totalSal)} muted />
                  <div className="bg-or/20 my-2 h-px" />
                  <Row label="Net à payer" value={eur(res.netPaye)} strong />
                  <Row label="Net imposable" value={eur(res.netImposable)} muted />
                </div>
              )}
              {res && res.brut > 0 && res.brut < SMIC_MENSUEL && (
                <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                  Ce brut ({eur(res.brut)}) est sous le SMIC 2026 ({eur(SMIC_MENSUEL)}). Normal seulement pour un temps partiel ou un apprenti.
                </p>
              )}
            </div>
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
              <Chips label="Congés pris ce mois" value={conges} options={[0, 5, 10, 15, 20, 25]} fmt={(v) => (v === 0 ? "Aucun" : `${v} j`)} onChange={setConges} />
            </div>
          )}

          {key === "verification" && (
            done ? (
              <div className="py-6 text-center">
                <div className="bg-vert-l text-vert mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full">
                  <Check size={24} />
                </div>
                <p className="text-noir text-lg font-bold">Fiche générée 🎉</p>
                <p className="text-gris mt-1 text-sm">Le PDF a été téléchargé et ajouté à votre espace.</p>
                {lastDonnees && (
                  <div className="mt-5 text-left">
                    <EmailCopy type="fiche-paie" donnees={lastDonnees} defaultEmail={sal?.email ?? ""} />
                  </div>
                )}
                <Link href="/espace" className="bg-noir mt-5 inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white">
                  Voir mon espace
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-noir font-display text-lg font-bold">Récapitulatif</h3>
                {sal?.id && localStore.ficheExiste(sal.id, `${mois} ${annee}`) && (
                  <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                    <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                    Une fiche existe déjà pour {sal.nom} en {mois} {annee}. Vous pouvez tout de même en générer une nouvelle.
                  </p>
                )}
                <div className="divide-or/10 divide-y">
                  <Row label="Entreprise" value={ent?.nom ?? "—"} pad />
                  <Row label="Salarié" value={sal?.nom ?? "—"} pad />
                  <Row label="Période" value={`${mois} ${annee}`} pad />
                  <Row label="Salaire brut" value={res ? eur(res.brut) : "—"} pad />
                  {heuresSup > 0 && <Row label="Heures sup (25 %)" value={`${heuresSup} h`} pad />}
                  {primes > 0 && <Row label="Prime" value={eur(primes)} pad />}
                  {conges > 0 && <Row label="Congés pris" value={`${conges} j`} pad />}
                  <Row label="Net à payer" value={res ? eur(res.netPaye) : "—"} pad strong />
                  <Row label="Coût employeur" value={res ? eur(res.coutEmployeur) : "—"} pad muted />
                </div>
                {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
                <button onClick={generer} disabled={busy || !res} className="bg-orange hover:bg-orange-d inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-base font-bold text-white disabled:opacity-50">
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  Générer la fiche de paie
                </button>
              </div>
            )
          )}

          {/* Navigation (sauf étapes à formulaire propre : entreprise, salarié) */}
          {!done && key !== "entreprise" && key !== "salarie" && (
            <div className="mt-6 flex items-center justify-between">
              <button onClick={goBack} disabled={i === 0} className="text-gris hover:text-noir inline-flex items-center gap-1.5 text-sm font-semibold disabled:opacity-0">
                <ArrowLeft size={16} /> Précédent
              </button>
              {key !== "verification" && (
                <button onClick={goNext} disabled={key === "remuneration" && !(brutEff > 0)} className="bg-noir inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">
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

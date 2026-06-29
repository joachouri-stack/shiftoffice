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

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const eur = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

const FIELD =
  "border-or/30 bg-white text-noir placeholder:text-gris/50 focus:border-or focus:ring-or/15 h-12 w-full rounded-lg border px-3.5 text-base outline-none transition-all focus:ring-4";

export default function FlowFichePaie() {
  const now = new Date();
  const [ready, setReady] = useState(false);
  const [ent, setEnt] = useState<LocalEntreprise | null>(null);
  const [sal, setSal] = useState<LocalSalarie | null>(null);

  // Étapes
  const [step, setStep] = useState(0); // 0 rémunération, 1 période, 2 vérif
  const STEPS = ["La rémunération", "La période", "Vérification"];

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

  useEffect(() => {
    const e = localStore.getEntreprise();
    setEnt(e);
    const id = new URLSearchParams(window.location.search).get("s");
    const found = id ? localStore.getSalaries().find((x) => x.id === id) : null;
    if (found) {
      setSal(found);
      if (found.salaireBrut) setBrut(String(found.salaireBrut));
    }
    setReady(true);
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
        ? calculerFichePaie({
            salaireBrut: brutEff,
            heuresMois: n(heures),
            heuresSup,
            primes,
          })
        : null,
    [brutEff, heures, heuresSup, primes]
  );

  // Anomalies (souples)
  const anomalies: string[] = [];
  if (res && res.brut > 0 && res.brut < SMIC_MENSUEL)
    anomalies.push(
      `Ce brut (${eur(res.brut)}) est sous le SMIC 2026 (${eur(SMIC_MENSUEL)}). Normal seulement pour un temps partiel ou un apprenti.`
    );

  if (!ready) return null;

  async function generer() {
    if (!res || busy) return;
    setBusy(true);
    setErr("");
    try {
      const donnees = {
        entrepriseNom: ent?.nom ?? "",
        entrepriseAdresse: [ent?.adresse, [ent?.codePostal, ent?.ville].filter(Boolean).join(" ")]
          .filter(Boolean)
          .join(", "),
        siret: ent?.siret ?? "",
        codeApe: ent?.codeNaf ?? "",
        conventionCollective: ent?.convention ?? "",
        salarieNom: sal?.nom ?? "",
        poste: sal?.poste ?? "",
        typeContrat: sal?.typeContrat ?? "",
        numeroSecu: "",
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
      const r = await fetch("/api/documents/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type_document: "fiche-paie", donnees }),
      });
      if (!r.ok) {
        setErr(
          r.status === 402
            ? "Paiement requis (Stripe activé). À brancher au flux de paiement."
            : "La génération a échoué. Réessayez."
        );
        setBusy(false);
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fiche-${(sal?.nom ?? "salarie").replace(/\s+/g, "-").toLowerCase()}-${mois.toLowerCase()}-${annee}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      localStore.addFiche({
        salarieNom: sal?.nom ?? "Salarié",
        periode: `${mois} ${annee}`,
        brut: Math.round(res.brut),
        net: Math.round(res.netPaye),
        creeLe: new Date().toISOString(),
      });
      setDone(true);
    } catch {
      setErr("La génération a échoué. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="bg-creme min-h-dvh">
      <header className="bg-noir">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4 sm:px-6">
          <Logo theme="dark" />
          <Link href="/espace" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white">
            <ArrowLeft size={16} />
            Mon espace
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {/* Barre de progression */}
        <div className="mb-5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-noir text-sm font-bold">
              Étape {step + 1} sur {STEPS.length} — {STEPS[step]}
            </span>
            <span className="text-or-d text-sm font-extrabold">{pct}%</span>
          </div>
          <div className="bg-or/15 h-2 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background:
                  pct === 100 ? "#15803D" : "linear-gradient(90deg,#C9A24B,#FF6B2B)",
              }}
            />
          </div>
        </div>

        {/* Contexte salarié */}
        <div className="text-gris mb-4 text-sm">
          {sal ? (
            <>Fiche de <strong className="text-noir">{sal.nom}</strong>{ent?.nom ? ` · ${ent.nom}` : ""}</>
          ) : (
            <>
              Aucun salarié sélectionné.{" "}
              <Link href="/espace" className="text-or-d font-semibold underline">
                Choisir depuis mon espace
              </Link>
            </>
          )}
        </div>

        <div className="border-or/20 rounded-2xl border bg-white p-5 sm:p-6">
          {/* ÉTAPE 0 — Rémunération */}
          {step === 0 && (
            <div className="space-y-5">
              {/* Brut / Net */}
              <div className="bg-creme inline-flex rounded-lg p-1">
                {(["brut", "net"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`rounded-md px-4 py-1.5 text-sm font-bold transition-colors ${
                      mode === m ? "bg-noir text-white" : "text-gris"
                    }`}
                  >
                    {m === "brut" ? "Je saisis le brut" : "Je saisis le net"}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-noir mb-1.5 block text-sm font-semibold">
                  {enNet ? "Net à payer souhaité (€)" : "Salaire brut mensuel (€)"}
                </label>
                <input
                  className={FIELD}
                  inputMode="decimal"
                  placeholder={enNet ? "1700" : "2200"}
                  value={enNet ? net : brut}
                  onChange={(e) => (enNet ? setNet(e.target.value) : setBrut(e.target.value))}
                />
                {enNet && brutEff > 0 && (
                  <p className="text-gris mt-1.5 text-xs">
                    Brut calculé : <strong className="text-noir">{eur(brutEff)}</strong>
                  </p>
                )}
              </div>

              <div>
                <label className="text-noir mb-1.5 block text-sm font-semibold">
                  Heures mensuelles
                </label>
                <input
                  className={FIELD}
                  inputMode="decimal"
                  value={heures}
                  onChange={(e) => setHeures(e.target.value)}
                />
              </div>

              <Chips
                label="Heures supplémentaires (25 %)"
                value={heuresSup}
                options={[0, 2, 5, 10]}
                fmt={(v) => (v === 0 ? "Aucune" : `${v} h`)}
                onChange={setHeuresSup}
                allowCustom
              />

              <Chips
                label="Prime ce mois"
                value={primes}
                options={[0, 50, 100, 200]}
                fmt={(v) => (v === 0 ? "Aucune" : `${v} €`)}
                onChange={setPrimes}
                allowCustom
              />

              {/* Aperçu en direct */}
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

              {anomalies.map((a, i) => (
                <p key={i} className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                  {a}
                </p>
              ))}
            </div>
          )}

          {/* ÉTAPE 1 — Période */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-noir mb-1.5 block text-sm font-semibold">Mois</label>
                  <select className={FIELD} value={mois} onChange={(e) => setMois(e.target.value)}>
                    {MOIS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-noir mb-1.5 block text-sm font-semibold">Année</label>
                  <input className={FIELD} inputMode="numeric" value={annee} onChange={(e) => setAnnee(e.target.value)} />
                </div>
              </div>
              <Chips
                label="Congés pris ce mois"
                value={conges}
                options={[0, 5, 10, 15, 20, 25]}
                fmt={(v) => (v === 0 ? "Aucun" : `${v} j`)}
                onChange={setConges}
              />
            </div>
          )}

          {/* ÉTAPE 2 — Vérification */}
          {step === 2 && (
            <div className="space-y-4">
              {done ? (
                <div className="py-6 text-center">
                  <div className="bg-vert-l text-vert mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full">
                    <Check size={24} />
                  </div>
                  <p className="text-noir text-lg font-bold">Fiche générée 🎉</p>
                  <p className="text-gris mt-1 text-sm">
                    Le PDF a été téléchargé et ajouté à votre espace.
                  </p>
                  <Link
                    href="/espace"
                    className="bg-noir mt-5 inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white"
                  >
                    Retour à mon espace
                  </Link>
                </div>
              ) : (
                <>
                  <h3 className="text-noir font-display text-lg font-bold">Récapitulatif</h3>
                  <div className="divide-or/10 divide-y">
                    <Row label="Salarié" value={sal?.nom ?? "—"} pad />
                    <Row label="Période" value={`${mois} ${annee}`} pad />
                    <Row label="Salaire brut" value={res ? eur(res.brut) : "—"} pad />
                    {heuresSup > 0 && <Row label="Heures sup (25 %)" value={`${heuresSup} h`} pad />}
                    {primes > 0 && <Row label="Prime" value={eur(primes)} pad />}
                    {conges > 0 && <Row label="Congés pris" value={`${conges} j`} pad />}
                    <Row label="Net à payer" value={res ? eur(res.netPaye) : "—"} pad strong />
                    <Row label="Coût employeur" value={res ? eur(res.coutEmployeur) : "—"} pad muted />
                  </div>
                  {err && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>
                  )}
                  <button
                    onClick={generer}
                    disabled={busy || !res}
                    className="bg-orange hover:bg-orange-d inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-base font-bold text-white disabled:opacity-50"
                  >
                    {busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    Générer la fiche de paie
                  </button>
                </>
              )}
            </div>
          )}

          {/* Navigation */}
          {!done && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="text-gris hover:text-noir inline-flex items-center gap-1.5 text-sm font-semibold disabled:opacity-0"
              >
                <ArrowLeft size={16} /> Précédent
              </button>
              {step < STEPS.length - 1 && (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={step === 0 && !(brutEff > 0)}
                  className="bg-noir inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                >
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

function Row({
  label,
  value,
  strong,
  muted,
  pad,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
  pad?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${pad ? "py-2.5" : "py-1"}`}>
      <span className={`text-sm ${muted ? "text-gris" : "text-noir"}`}>{label}</span>
      <span
        className={`text-sm tabular-nums ${
          strong ? "text-noir text-base font-extrabold" : muted ? "text-gris" : "text-noir font-semibold"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Chips({
  label,
  value,
  options,
  fmt,
  onChange,
  allowCustom,
}: {
  label: string;
  value: number;
  options: number[];
  fmt: (v: number) => string;
  onChange: (v: number) => void;
  allowCustom?: boolean;
}) {
  const isCustom = allowCustom && !options.includes(value);
  return (
    <div>
      <label className="text-noir mb-2 block text-sm font-semibold">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              value === o ? "bg-noir text-white" : "bg-creme text-gris hover:text-noir"
            }`}
          >
            {fmt(o)}
          </button>
        ))}
        {allowCustom && (
          <input
            type="number"
            placeholder="Autre"
            value={isCustom ? value : ""}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className={`border-or/30 focus:border-or h-9 w-20 rounded-full border px-3 text-sm outline-none ${
              isCustom ? "bg-noir/5" : "bg-white"
            }`}
          />
        )}
      </div>
    </div>
  );
}

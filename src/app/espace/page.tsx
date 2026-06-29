"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  FileClock,
  Home,
  Plus,
  Trash2,
  HardDrive,
  CloudUpload,
  ArrowRight,
  Pencil,
  FileText,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import {
  localStore,
  type LocalEntreprise,
  type LocalSalarie,
  type LocalFiche,
} from "@/lib/local/store";

const FIELD =
  "border-or/30 bg-white text-noir placeholder:text-gris/50 focus:border-or focus:ring-or/15 h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition-all focus:ring-4";

const NAV = [
  { label: "Tableau de bord", icon: Home, active: true },
  { label: "Mes documents", icon: FileClock },
  { label: "Mes salariés", icon: Users },
  { label: "Mon entreprise", icon: Building2 },
];

export default function EspaceLocalPage() {
  const [ent, setEnt] = useState<LocalEntreprise | null>(null);
  const [salaries, setSalaries] = useState<LocalSalarie[]>([]);
  const [fiches, setFiches] = useState<LocalFiche[]>([]);
  const [editEnt, setEditEnt] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEnt(localStore.getEntreprise());
    setSalaries(localStore.getSalaries());
    setFiches(localStore.getFiches());
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <div className="bg-creme min-h-dvh">
      {/* Header */}
      <header className="bg-noir">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo theme="dark" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
            <HardDrive size={13} />
            Espace local · cet appareil
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col">
            {NAV.map((item) => (
              <span
                key={item.label}
                className={`inline-flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  item.active
                    ? "bg-or/15 text-or-d"
                    : "text-noir hover:bg-or/10"
                }`}
              >
                <item.icon size={17} />
                {item.label}
              </span>
            ))}
          </nav>
        </aside>

        {/* Contenu */}
        <main className="space-y-6">
          <div>
            <h1 className="font-display text-noir text-2xl font-extrabold tracking-tight">
              Bonjour 👋
            </h1>
            <p className="text-gris mt-1 text-sm">
              Votre espace, prêt à l&apos;emploi — sans inscription.
            </p>
          </div>

          {/* Bandeau local + upgrade */}
          <div className="border-or/30 bg-or/5 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="bg-or/15 text-or-d grid h-9 w-9 shrink-0 place-items-center rounded-lg">
                <HardDrive size={16} />
              </div>
              <div>
                <p className="text-noir text-sm font-bold">
                  Vos données sont enregistrées sur cet appareil
                </p>
                <p className="text-gris mt-0.5 text-xs leading-relaxed">
                  Rien n&apos;est envoyé en ligne. Entreprise, salariés et fiches
                  restent dans ce navigateur — aucune connexion nécessaire.
                </p>
              </div>
            </div>
            <button className="bg-noir inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-bold text-white">
              <CloudUpload size={16} />
              Créer un compte pour synchroniser
            </button>
          </div>

          {/* Entreprise */}
          <section className="border-or/20 rounded-2xl border bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-or-d" />
                <h2 className="font-display text-noir text-lg font-bold">
                  Mon entreprise
                </h2>
              </div>
              {ent && !editEnt && (
                <button
                  onClick={() => setEditEnt(true)}
                  className="text-gris hover:text-or-d inline-flex items-center gap-1.5 text-sm font-semibold"
                >
                  <Pencil size={14} />
                  Modifier
                </button>
              )}
            </div>

            {ent && !editEnt ? (
              <div className="bg-creme/60 flex items-center gap-4 rounded-xl p-4">
                <div className="bg-or/15 text-or-d grid h-12 w-12 shrink-0 place-items-center rounded-xl">
                  <Building2 size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-noir truncate text-base font-bold">
                    {ent.nom}
                  </p>
                  <p className="text-gris truncate text-sm">
                    {[
                      ent.ville && ent.codePostal
                        ? `${ent.codePostal} ${ent.ville}`
                        : ent.ville,
                      ent.siret ? `SIRET ${ent.siret}` : null,
                      ent.convention,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
            ) : (
              <EntrepriseForm
                initial={ent}
                onSave={(e) => {
                  localStore.setEntreprise(e);
                  setEnt(e);
                  setEditEnt(false);
                }}
                onCancel={ent ? () => setEditEnt(false) : undefined}
              />
            )}
          </section>

          {/* Salariés */}
          <section className="border-or/20 rounded-2xl border bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Users size={18} className="text-or-d" />
              <h2 className="font-display text-noir text-lg font-bold">
                Mes salariés
              </h2>
              <span className="bg-or/10 text-or-d ml-1 rounded-full px-2 py-0.5 text-xs font-bold">
                {salaries.length}
              </span>
            </div>

            {salaries.length > 0 && (
              <ul className="divide-or/10 mb-4 divide-y">
                {salaries.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="bg-or/15 text-or-d grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold">
                        {s.nom
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-noir truncate text-sm font-semibold">
                          {s.nom}
                        </p>
                        <p className="text-gris truncate text-xs">
                          {[
                            s.poste,
                            s.salaireBrut
                              ? `${s.salaireBrut.toLocaleString("fr-FR")} € brut`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="bg-orange hover:bg-orange-d inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white">
                        <FileText size={13} />
                        Fiche de paie
                      </button>
                      <button
                        onClick={() => {
                          localStore.removeSalarie(s.id);
                          setSalaries(localStore.getSalaries());
                        }}
                        aria-label={`Supprimer ${s.nom}`}
                        className="text-gris hover:bg-red-50 hover:text-red-600 grid h-8 w-8 place-items-center rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <SalarieForm
              onAdd={(s) => {
                localStore.addSalarie(s);
                setSalaries(localStore.getSalaries());
              }}
            />
          </section>

          {/* Fiches récentes */}
          <section className="border-or/20 rounded-2xl border bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileClock size={18} className="text-or-d" />
              <h2 className="font-display text-noir text-lg font-bold">
                Fiches récentes
              </h2>
            </div>
            {fiches.length > 0 ? (
              <ul className="divide-or/10 divide-y">
                {fiches.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-noir truncate text-sm font-semibold">
                        {f.salarieNom} — {f.periode}
                      </p>
                      <p className="text-gris truncate text-xs">
                        Brut {f.brut.toLocaleString("fr-FR")} € · Net{" "}
                        {f.net.toLocaleString("fr-FR")} €
                      </p>
                    </div>
                    <button className="text-or-d hover:bg-or/10 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold">
                      Revoir
                      <ArrowRight size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gris py-6 text-center text-sm">
                Vos fiches générées apparaîtront ici, prêtes à être reprises le
                mois suivant.
              </p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function EntrepriseForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: LocalEntreprise | null;
  onSave: (e: LocalEntreprise) => void;
  onCancel?: () => void;
}) {
  const [f, setF] = useState<LocalEntreprise>(
    initial ?? { nom: "", siret: "", codePostal: "", ville: "", convention: "" }
  );
  const set = (k: keyof LocalEntreprise, v: string) =>
    setF((p) => ({ ...p, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (f.nom.trim()) onSave(f);
      }}
      className="space-y-3"
    >
      <p className="text-gris -mt-1 text-xs">
        Saisie une seule fois — réutilisée pour toutes vos fiches.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={FIELD}
          placeholder="Nom de l'entreprise *"
          value={f.nom}
          onChange={(e) => set("nom", e.target.value)}
        />
        <input
          className={FIELD}
          placeholder="SIRET"
          value={f.siret ?? ""}
          onChange={(e) => set("siret", e.target.value)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          className={FIELD}
          placeholder="Code postal"
          value={f.codePostal ?? ""}
          onChange={(e) => set("codePostal", e.target.value)}
        />
        <input
          className={FIELD}
          placeholder="Ville"
          value={f.ville ?? ""}
          onChange={(e) => set("ville", e.target.value)}
        />
        <input
          className={FIELD}
          placeholder="Convention collective"
          value={f.convention ?? ""}
          onChange={(e) => set("convention", e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="bg-orange hover:bg-orange-d inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white"
        >
          <Plus size={16} />
          Enregistrer
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-gris hover:text-noir px-3 py-2.5 text-sm font-semibold"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}

function SalarieForm({ onAdd }: { onAdd: (s: Omit<LocalSalarie, "id">) => void }) {
  const [nom, setNom] = useState("");
  const [poste, setPoste] = useState("");
  const [salaire, setSalaire] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!nom.trim()) return;
        onAdd({
          nom: nom.trim(),
          poste: poste.trim() || undefined,
          salaireBrut: salaire ? parseFloat(salaire.replace(",", ".")) : undefined,
        });
        setNom("");
        setPoste("");
        setSalaire("");
      }}
      className="border-or/20 grid gap-3 rounded-xl border border-dashed p-3 sm:grid-cols-[1fr_1fr_140px_auto]"
    >
      <input
        className={FIELD}
        placeholder="Nom du salarié"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
      />
      <input
        className={FIELD}
        placeholder="Poste"
        value={poste}
        onChange={(e) => setPoste(e.target.value)}
      />
      <input
        className={FIELD}
        placeholder="Brut €"
        inputMode="decimal"
        value={salaire}
        onChange={(e) => setSalaire(e.target.value)}
      />
      <button
        type="submit"
        className="bg-noir inline-flex items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-bold text-white"
      >
        <Plus size={16} />
        Ajouter
      </button>
    </form>
  );
}

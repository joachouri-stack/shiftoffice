"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  FileClock,
  Home,
  KeyRound,
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
  type LocalBien,
  type LocalDoc,
} from "@/lib/local/store";

const FIELD =
  "border-or/30 bg-white text-noir placeholder:text-gris/50 focus:border-or focus:ring-or/15 h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition-all focus:ring-4";

const NAV = [
  { label: "Tableau de bord", icon: Home, href: "#top", active: true },
  { label: "Mes documents", icon: FileClock, href: "#fiches" },
  { label: "Mes salariés", icon: Users, href: "#salaries" },
  { label: "Mes locations", icon: KeyRound, href: "#biens" },
  { label: "Mon entreprise", icon: Building2, href: "#entreprise" },
];

export default function EspaceLocalPage() {
  const [ent, setEnt] = useState<LocalEntreprise | null>(null);
  const [salaries, setSalaries] = useState<LocalSalarie[]>([]);
  const [biens, setBiens] = useState<LocalBien[]>([]);
  const [documents, setDocuments] = useState<LocalDoc[]>([]);
  const [editEnt, setEditEnt] = useState(false);
  const [editingSal, setEditingSal] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEnt(localStore.getEntreprise());
    setSalaries(localStore.getSalaries());
    setBiens(localStore.getBiens());
    setDocuments(localStore.getDocuments());
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
              <a
                key={item.label}
                href={item.href}
                className={`inline-flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  item.active
                    ? "bg-or/15 text-or-d"
                    : "text-noir hover:bg-or/10"
                }`}
              >
                <item.icon size={17} />
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Contenu */}
        <main className="space-y-6">
          <div id="top" className="scroll-mt-8">
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
          <section id="entreprise" className="border-or/20 scroll-mt-8 rounded-2xl border bg-white p-6">
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
          <section id="salaries" className="border-or/20 scroll-mt-8 rounded-2xl border bg-white p-6">
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
                  <li key={s.id} className="py-3">
                   {editingSal === s.id ? (
                    <SalarieForm
                      initial={s}
                      submitLabel="Enregistrer"
                      onCancel={() => setEditingSal(null)}
                      onSubmit={(patch) => {
                        localStore.updateSalarie(s.id, patch);
                        setSalaries(localStore.getSalaries());
                        setEditingSal(null);
                      }}
                    />
                   ) : (
                    <div className="flex items-center justify-between gap-4">
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
                      <Link
                        href={`/fiche-de-paie?s=${s.id}`}
                        className="bg-orange hover:bg-orange-d inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                      >
                        <FileText size={13} />
                        Fiche de paie
                      </Link>
                      <button
                        onClick={() => setEditingSal(s.id)}
                        aria-label={`Modifier ${s.nom}`}
                        className="text-gris hover:bg-or/10 hover:text-or-d grid h-8 w-8 place-items-center rounded-lg transition-colors"
                      >
                        <Pencil size={14} />
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
                    </div>
                   )}
                  </li>
                ))}
              </ul>
            )}

            <SalarieForm
              onSubmit={(s) => {
                localStore.addSalarie(s);
                setSalaries(localStore.getSalaries());
              }}
            />
          </section>

          {/* Locations */}
          <section id="biens" className="border-or/20 scroll-mt-8 rounded-2xl border bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <KeyRound size={18} className="text-or-d" />
              <h2 className="font-display text-noir text-lg font-bold">Mes locations</h2>
              <span className="bg-or/10 text-or-d ml-1 rounded-full px-2 py-0.5 text-xs font-bold">
                {biens.length}
              </span>
            </div>

            {biens.length > 0 && (
              <ul className="divide-or/10 mb-4 divide-y">
                {biens.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="bg-or/15 text-or-d grid h-9 w-9 shrink-0 place-items-center rounded-lg">
                        <KeyRound size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-noir truncate text-sm font-semibold">{b.locataire}</p>
                        <p className="text-gris truncate text-xs">
                          {[b.adresseBien, b.loyer ? `${b.loyer.toLocaleString("fr-FR")} €` : null]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/quittance-loyer?b=${b.id}`}
                        className="bg-orange hover:bg-orange-d inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                      >
                        <FileText size={13} />
                        Quittance
                      </Link>
                      <button
                        onClick={() => {
                          localStore.removeBien(b.id);
                          setBiens(localStore.getBiens());
                        }}
                        aria-label={`Supprimer ${b.locataire}`}
                        className="text-gris hover:bg-red-50 hover:text-red-600 grid h-8 w-8 place-items-center rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <BienForm
              onAdd={(b) => {
                localStore.addBien(b);
                setBiens(localStore.getBiens());
              }}
            />
          </section>

          {/* Mes documents */}
          <section id="fiches" className="border-or/20 scroll-mt-8 rounded-2xl border bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileClock size={18} className="text-or-d" />
              <h2 className="font-display text-noir text-lg font-bold">
                Mes documents
              </h2>
              {documents.length > 0 && (
                <span className="bg-or/10 text-or-d ml-1 rounded-full px-2 py-0.5 text-xs font-bold">
                  {documents.length}
                </span>
              )}
            </div>
            {documents.length > 0 ? (
              <ul className="divide-or/10 divide-y">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="bg-or/15 text-or-d grid h-9 w-9 shrink-0 place-items-center rounded-lg">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-noir truncate text-sm font-semibold">
                          {d.titre}
                        </p>
                        <p className="text-gris truncate text-xs">
                          {[d.libelle, d.montant ? `${Math.round(d.montant).toLocaleString("fr-FR")} €` : null]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </div>
                    </div>
                    {d.refaireHref ? (
                      <Link
                        href={d.refaireHref}
                        className="text-or-d hover:bg-or/10 inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold"
                      >
                        Refaire
                        <ArrowRight size={13} />
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gris py-6 text-center text-sm">
                Vos documents générés apparaîtront ici, prêts à être refaits en un clic.
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
      <input
        className={FIELD}
        placeholder="Adresse"
        value={f.adresse ?? ""}
        onChange={(e) => set("adresse", e.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={FIELD}
          placeholder="Représentant (ex. Jean Martin)"
          value={f.representantNom ?? ""}
          onChange={(e) => set("representantNom", e.target.value)}
        />
        <input
          className={FIELD}
          placeholder="Qualité (Gérant…)"
          value={f.representantQualite ?? ""}
          onChange={(e) => set("representantQualite", e.target.value)}
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

function SalarieForm({
  initial,
  submitLabel = "Ajouter le salarié",
  onSubmit,
  onCancel,
}: {
  initial?: LocalSalarie;
  submitLabel?: string;
  onSubmit: (s: Omit<LocalSalarie, "id">) => void;
  onCancel?: () => void;
}) {
  const [nom, setNom] = useState(initial?.nom ?? "");
  const [poste, setPoste] = useState(initial?.poste ?? "");
  const [salaire, setSalaire] = useState(initial?.salaireBrut ? String(initial.salaireBrut) : "");
  const [numeroSecu, setNumeroSecu] = useState(initial?.numeroSecu ?? "");
  const [dateEntree, setDateEntree] = useState(initial?.dateEntree ?? "");
  const [typeContrat, setTypeContrat] = useState(initial?.typeContrat ?? "CDI");
  const [classification, setClassification] = useState(initial?.classification ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [adresse, setAdresse] = useState(initial?.adresse ?? "");

  function reset() {
    setNom(""); setPoste(""); setSalaire(""); setNumeroSecu("");
    setDateEntree(""); setTypeContrat("CDI"); setClassification(""); setEmail(""); setAdresse("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!nom.trim()) return;
        onSubmit({
          nom: nom.trim(),
          poste: poste.trim() || undefined,
          salaireBrut: salaire ? parseFloat(salaire.replace(",", ".")) : undefined,
          numeroSecu: numeroSecu.trim() || undefined,
          dateEntree: dateEntree.trim() || undefined,
          typeContrat,
          classification: classification.trim() || undefined,
          email: email.trim() || undefined,
          adresse: adresse.trim() || undefined,
        });
        if (!initial) reset();
      }}
      className="border-or/20 space-y-3 rounded-xl border border-dashed p-4"
    >
      {!initial && (
        <p className="text-gris text-xs">
          Saisi une fois — repris automatiquement sur chaque fiche de paie.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={FIELD} placeholder="Nom et prénom *" value={nom} onChange={(e) => setNom(e.target.value)} />
        <input className={FIELD} placeholder="Poste" value={poste} onChange={(e) => setPoste(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={FIELD} placeholder="Salaire brut mensuel (€)" inputMode="decimal" value={salaire} onChange={(e) => setSalaire(e.target.value)} />
        <input className={FIELD} placeholder="N° de sécurité sociale" value={numeroSecu} onChange={(e) => setNumeroSecu(e.target.value)} />
      </div>
      <input className={FIELD} placeholder="Adresse du salarié" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
      <input className={FIELD} type="email" placeholder="Email du salarié (pour l'envoi de la fiche)" value={email} onChange={(e) => setEmail(e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-3">
        <input className={FIELD} placeholder="Date d'entrée (jj/mm/aaaa)" value={dateEntree} onChange={(e) => setDateEntree(e.target.value)} />
        <select className={FIELD} value={typeContrat} onChange={(e) => setTypeContrat(e.target.value)}>
          <option value="CDI">CDI</option>
          <option value="CDD">CDD</option>
        </select>
        <input className={FIELD} placeholder="Classification (optionnel)" value={classification} onChange={(e) => setClassification(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" className="bg-noir inline-flex items-center justify-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white">
          <Plus size={16} />
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-gris hover:text-noir px-3 py-2.5 text-sm font-semibold">
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}

function BienForm({ onAdd }: { onAdd: (b: Omit<LocalBien, "id">) => void }) {
  const [f, setF] = useState({ bailleurNom: "", bailleurAdresse: "", locataire: "", adresseBien: "", loyer: "", charges: "", ville: "" });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.bailleurNom.trim() || !f.locataire.trim()) return;
        onAdd({
          bailleurNom: f.bailleurNom.trim(),
          bailleurAdresse: f.bailleurAdresse.trim() || undefined,
          locataire: f.locataire.trim(),
          adresseBien: f.adresseBien.trim() || undefined,
          loyer: f.loyer ? parseFloat(f.loyer.replace(",", ".")) : undefined,
          charges: f.charges ? parseFloat(f.charges.replace(",", ".")) : undefined,
          ville: f.ville.trim() || undefined,
        });
        setF({ bailleurNom: "", bailleurAdresse: "", locataire: "", adresseBien: "", loyer: "", charges: "", ville: "" });
      }}
      className="border-or/20 space-y-3 rounded-xl border border-dashed p-4"
    >
      <p className="text-gris text-xs">Saisi une fois — réutilisé chaque mois pour la quittance.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={FIELD} placeholder="Bailleur (vous) *" value={f.bailleurNom} onChange={(e) => set("bailleurNom", e.target.value)} />
        <input className={FIELD} placeholder="Locataire *" value={f.locataire} onChange={(e) => set("locataire", e.target.value)} />
      </div>
      <input className={FIELD} placeholder="Adresse du logement loué" value={f.adresseBien} onChange={(e) => set("adresseBien", e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-3">
        <input className={FIELD} inputMode="decimal" placeholder="Loyer (€)" value={f.loyer} onChange={(e) => set("loyer", e.target.value)} />
        <input className={FIELD} inputMode="decimal" placeholder="Charges (€)" value={f.charges} onChange={(e) => set("charges", e.target.value)} />
        <input className={FIELD} placeholder="Ville" value={f.ville} onChange={(e) => set("ville", e.target.value)} />
      </div>
      <button type="submit" className="bg-noir inline-flex items-center justify-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white">
        <Plus size={16} />
        Ajouter la location
      </button>
    </form>
  );
}

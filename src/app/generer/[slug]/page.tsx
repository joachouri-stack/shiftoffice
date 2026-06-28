"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, FileText, Lock, Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { DOCUMENTS, formatPrice } from "@/lib/documents";

export default function GenererPage() {
  const params = useParams<{ slug: string }>();
  const doc = DOCUMENTS.find((d) => d.slug === params.slug);

  return (
    <div className="bg-creme min-h-dvh">
      {/* Barre */}
      <header className="bg-noir">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo theme="dark" />
          <Link
            href="/#produits"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} />
            Tous les documents
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {!doc ? (
          <Card>
            <p className="text-noir font-display text-xl font-bold">
              Document introuvable
            </p>
            <p className="text-gris mt-2 text-sm">
              Ce document n&apos;existe pas.{" "}
              <Link href="/#produits" className="text-orange font-semibold">
                Voir tous les documents
              </Link>
            </p>
          </Card>
        ) : (
          <>
            {/* En-tête document */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <span className="text-or text-xs font-bold uppercase tracking-[0.16em]">
                  Génération de document
                </span>
                <h1 className="font-display text-noir mt-1 text-3xl font-extrabold tracking-tight">
                  {doc.title}
                </h1>
                <p className="text-gris mt-1 text-sm">{doc.desc}</p>
              </div>
              <span className="text-orange font-display shrink-0 text-2xl font-extrabold">
                {formatPrice(doc.price)}
              </span>
            </div>

            {doc.slug === "quittance-loyer" ? (
              <QuittanceForm />
            ) : doc.slug === "attestation-employeur" ? (
              <AttestationForm />
            ) : doc.free ? (
              <Card>
                <p className="text-noir font-semibold">
                  Formulaire en préparation
                </p>
                <p className="text-gris mt-2 text-sm">
                  Ce document gratuit sera disponible à la génération très
                  bientôt.
                </p>
              </Card>
            ) : (
              <PayantNotice price={doc.price} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-or/20 rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
      {children}
    </div>
  );
}

function PayantNotice({ price }: { price: number }) {
  return (
    <Card>
      <div className="bg-or/15 text-or-d mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl">
        <Lock size={22} />
      </div>
      <p className="text-noir font-display text-lg font-bold">
        Document payant — {price}€
      </p>
      <p className="text-gris mt-2 text-sm leading-relaxed">
        La génération des documents payants nécessite une connexion et un
        paiement sécurisé (Stripe). Cette partie sera activée prochainement. En
        attendant, vous pouvez générer gratuitement la{" "}
        <Link href="/generer/quittance-loyer" className="text-orange font-semibold">
          quittance de loyer
        </Link>
        .
      </p>
    </Card>
  );
}

const FIELD =
  "border-or/30 bg-white text-noir placeholder:text-gris/50 focus:border-or focus:ring-or/15 h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition-all focus:ring-4";

function moisCourant(): string {
  const mois = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  const d = new Date();
  return `${mois[d.getMonth()]} ${d.getFullYear()}`;
}

function aujourdhui(): string {
  return new Date().toLocaleDateString("fr-FR");
}

function QuittanceForm() {
  const [f, setF] = useState({
    bailleurNom: "",
    bailleurAdresse: "",
    locataire: "",
    adresseBien: "",
    periode: moisCourant(),
    loyer: "",
    charges: "0",
    ville: "",
    datePaiement: aujourdhui(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((p) => ({ ...p, [k]: v }));
  }

  const total = useMemo(() => {
    const n = (s: string) => parseFloat(s.replace(",", ".")) || 0;
    return n(f.loyer) + n(f.charges);
  }, [f.loyer, f.charges]);

  const valid =
    f.bailleurNom.trim() &&
    f.locataire.trim() &&
    f.adresseBien.trim() &&
    f.loyer.trim();

  async function generate() {
    if (!valid || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/documents/generer-gratuit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type_document: "quittance-loyer", donnees: f }),
      });
      if (!res.ok) throw new Error("génération");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "quittance-loyer.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("La génération a échoué. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="bg-vert-l text-vert mb-5 inline-flex items-center gap-1.5 rounded-md border border-emerald-200 px-2.5 py-1 text-xs font-bold">
        <FileText size={13} />
        Gratuit · Sans compte
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          generate();
        }}
        className="space-y-5"
      >
        <div>
          <p className="text-noir mb-3 text-sm font-bold">Le bailleur (vous)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nom du bailleur" value={f.bailleurNom} onChange={(v) => set("bailleurNom", v)} placeholder="Ex. M. Martin" />
            <Input label="Ville" value={f.ville} onChange={(v) => set("ville", v)} placeholder="Ex. Lyon" />
          </div>
          <div className="mt-3">
            <Input label="Adresse du bailleur" value={f.bailleurAdresse} onChange={(v) => set("bailleurAdresse", v)} placeholder="12 rue des Lilas, 69003 Lyon" />
          </div>
        </div>

        <div>
          <p className="text-noir mb-3 text-sm font-bold">Le locataire & le bien</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nom du locataire" value={f.locataire} onChange={(v) => set("locataire", v)} placeholder="Ex. M. Dupont" />
            <Input label="Période" value={f.periode} onChange={(v) => set("periode", v)} placeholder="Ex. Juin 2025" />
          </div>
          <div className="mt-3">
            <Input label="Adresse du logement loué" value={f.adresseBien} onChange={(v) => set("adresseBien", v)} placeholder="5 avenue de la République, 69003 Lyon" />
          </div>
        </div>

        <div>
          <p className="text-noir mb-3 text-sm font-bold">Montants</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Loyer (€)" value={f.loyer} onChange={(v) => set("loyer", v)} placeholder="700" inputMode="decimal" />
            <Input label="Charges (€)" value={f.charges} onChange={(v) => set("charges", v)} placeholder="50" inputMode="decimal" />
            <Input label="Date de paiement" value={f.datePaiement} onChange={(v) => set("datePaiement", v)} placeholder="28/06/2026" />
          </div>
          <p className="text-gris mt-3 text-sm">
            Total quittancé :{" "}
            <span className="text-noir font-bold">
              {total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
            </span>
          </p>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!valid || loading}
          className="bg-orange hover:bg-orange-d inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-base font-bold text-white transition-colors disabled:opacity-50 sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Génération…
            </>
          ) : (
            <>
              <Download size={18} />
              Générer et télécharger le PDF
            </>
          )}
        </button>
      </form>
    </Card>
  );
}

async function downloadPdf(
  type: string,
  donnees: Record<string, string>,
  filename: string
): Promise<boolean> {
  const res = await fetch("/api/documents/generer-gratuit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type_document: type, donnees }),
  });
  if (!res.ok) return false;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}

function AttestationForm() {
  const [f, setF] = useState({
    entrepriseNom: "",
    entrepriseAdresse: "",
    siret: "",
    ville: "",
    representantNom: "",
    representantQualite: "Gérant",
    salarieNom: "",
    poste: "",
    typeContrat: "indeterminee",
    dateEmbauche: "",
    date: aujourdhui(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((p) => ({ ...p, [k]: v }));
  }

  const valid =
    f.entrepriseNom.trim() &&
    f.representantNom.trim() &&
    f.salarieNom.trim() &&
    f.poste.trim();

  async function generate() {
    if (!valid || loading) return;
    setLoading(true);
    setError("");
    try {
      const ok = await downloadPdf(
        "attestation-employeur",
        f,
        "attestation-employeur.pdf"
      );
      if (!ok) throw new Error("génération");
    } catch {
      setError("La génération a échoué. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="bg-vert-l text-vert mb-5 inline-flex items-center gap-1.5 rounded-md border border-emerald-200 px-2.5 py-1 text-xs font-bold">
        <FileText size={13} />
        Gratuit · Sans compte
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          generate();
        }}
        className="space-y-5"
      >
        <div>
          <p className="text-noir mb-3 text-sm font-bold">
            L&apos;employeur (vous)
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nom de l'entreprise" value={f.entrepriseNom} onChange={(v) => set("entrepriseNom", v)} placeholder="Ex. Dupont Bâtiment" />
            <Input label="Ville" value={f.ville} onChange={(v) => set("ville", v)} placeholder="Ex. Lyon" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label="Adresse de l'entreprise" value={f.entrepriseAdresse} onChange={(v) => set("entrepriseAdresse", v)} placeholder="12 rue des Artisans, 69003 Lyon" />
            <Input label="SIRET (optionnel)" value={f.siret} onChange={(v) => set("siret", v)} placeholder="123 456 789 00012" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label="Nom du représentant" value={f.representantNom} onChange={(v) => set("representantNom", v)} placeholder="Ex. M. Dupont" />
            <Input label="Qualité" value={f.representantQualite} onChange={(v) => set("representantQualite", v)} placeholder="Ex. Gérant" />
          </div>
        </div>

        <div>
          <p className="text-noir mb-3 text-sm font-bold">Le salarié</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nom et prénom du salarié" value={f.salarieNom} onChange={(v) => set("salarieNom", v)} placeholder="Ex. Sophie Martin" />
            <Input label="Poste occupé" value={f.poste} onChange={(v) => set("poste", v)} placeholder="Ex. Assistante administrative" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <span className="text-noir mb-1.5 block text-sm font-medium">
                Type de contrat
              </span>
              <div className="flex gap-2">
                {[
                  ["indeterminee", "CDI"],
                  ["determinee", "CDD"],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => set("typeContrat", val)}
                    className={`h-11 flex-1 rounded-lg border text-sm font-semibold transition-colors ${
                      f.typeContrat === val
                        ? "border-or bg-or text-white"
                        : "border-or/30 text-noir bg-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Input label="Date d'embauche" value={f.dateEmbauche} onChange={(v) => set("dateEmbauche", v)} placeholder="01/03/2024" />
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!valid || loading}
          className="bg-orange hover:bg-orange-d inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-base font-bold text-white transition-colors disabled:opacity-50 sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Génération…
            </>
          ) : (
            <>
              <Download size={18} />
              Générer et télécharger le PDF
            </>
          )}
        </button>
      </form>
    </Card>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "decimal";
}) {
  return (
    <label className="block">
      <span className="text-noir mb-1.5 block text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className={FIELD}
      />
    </label>
  );
}

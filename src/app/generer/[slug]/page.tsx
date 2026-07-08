"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, FileText, Lock, Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { EmailCopy } from "@/components/documents/EmailCopy";
import { ModeRapide } from "@/components/documents/ModeRapide";
import { DOCUMENTS, formatPrice } from "@/lib/documents";
import { formatDateInput } from "@/lib/dates";
import { calculerFichePaie, brutPourNetAvantImpot } from "@/lib/paie/calcul";

/**
 * Pré-remplissage « Mode rapide » : la valeur extraite par l'IA est partagée
 * via ce contexte ; chaque formulaire la fusionne dans son état local.
 */
const PrefillContext = createContext<Record<string, string> | null>(null);

function usePrefill<T>(setF: Dispatch<SetStateAction<T>>) {
  const prefill = useContext(PrefillContext);
  useEffect(() => {
    if (prefill && Object.keys(prefill).length) {
      setF((p) => ({ ...p, ...prefill }) as T);
    }
  }, [prefill, setF]);
}

export default function GenererPage() {
  const params = useParams<{ slug: string }>();
  const doc = DOCUMENTS.find((d) => d.slug === params.slug);
  const [prefill, setPrefill] = useState<Record<string, string> | null>(null);

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

            <PrefillContext.Provider value={prefill}>
              <ModeRapide type={doc.slug} onFill={setPrefill} />
              {doc.slug === "quittance-loyer" ? (
                <QuittanceForm />
              ) : doc.slug === "attestation-employeur" ? (
                <AttestationForm />
              ) : doc.slug === "fiche-paie" ? (
                <FichePaieForm />
              ) : doc.slug === "contrat-travail" ? (
                <ContratForm />
              ) : doc.slug === "certificat-travail" ? (
                <CertificatForm />
              ) : doc.slug === "solde-tout-compte" ? (
                <SoldeForm />
              ) : doc.slug === "rupture-conventionnelle" ? (
                <RuptureForm />
              ) : doc.slug === "bail-commercial" ? (
                <BailCommercialForm />
              ) : doc.slug === "statuts-societe" ? (
                <StatutsForm />
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
            </PrefillContext.Provider>
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
  usePrefill(setF);

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
            <Input date label="Date de paiement" value={f.datePaiement} onChange={(v) => set("datePaiement", v)} placeholder="28/06/2026" />
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
      <EmailCopy type="quittance-loyer" donnees={f} />
    </Card>
  );
}

async function downloadPdf(
  type: string,
  donnees: Record<string, unknown>,
  filename: string,
  endpoint = "/api/documents/generer-gratuit"
): Promise<boolean> {
  const res = await fetch(endpoint, {
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

/**
 * Document payant : ouvre Stripe Checkout si le paiement est activé, sinon
 * génère directement (transition). Les données du formulaire sont conservées
 * en sessionStorage pour être régénérées au retour de paiement.
 * Pour ces documents, le type de document est identique au slug.
 */
async function submitPaidDoc(
  slug: string,
  donnees: Record<string, unknown>,
  filename: string
): Promise<boolean> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: slug, slug }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { url?: string; paymentDisabled?: boolean };
  if (data.url) {
    sessionStorage.setItem(
      `shiftoffice:pending:${slug}`,
      JSON.stringify({ type: slug, donnees, filename })
    );
    window.location.assign(data.url);
    return true; // navigation vers Stripe en cours
  }
  // Paiement non configuré → génération directe (comportement actuel)
  return downloadPdf(slug, donnees, filename, "/api/documents/generer");
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
  usePrefill(setF);

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
            <Input date label="Date d'embauche" value={f.dateEmbauche} onChange={(v) => set("dateEmbauche", v)} placeholder="01/03/2024" />
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
      <EmailCopy type="attestation-employeur" donnees={f} />
    </Card>
  );
}

function FichePaieForm() {
  const [f, setF] = useState({
    entrepriseNom: "",
    entrepriseAdresse: "",
    siret: "",
    codeApe: "",
    conventionCollective: "",
    salarieNom: "",
    poste: "",
    classification: "",
    dateEntree: "",
    typeContrat: "CDI",
    numeroSecu: "",
    periode: moisCourant(),
    datePaiement: aujourdhui(),
    modeSaisie: "brut",
    salaireBrut: "",
    salaireNet: "",
    heuresMois: "151.67",
    tauxHoraire: "",
    heuresSup: "0",
    heuresSup50: "0",
    primes: "0",
    tauxPAS: "0",
    congesAcquis: "",
    congesPris: "",
    cumulBrut: "",
    cumulNetImposable: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((p) => ({ ...p, [k]: v }));
  }
  usePrefill(setF);

  const n = (s: string) => parseFloat(s.replace(",", ".")) || 0;
  const enNet = f.modeSaisie === "net";
  const brutEff = enNet ? brutPourNetAvantImpot(n(f.salaireNet)) : n(f.salaireBrut);
  const res = useMemo(
    () =>
      calculerFichePaie({
        salaireBrut: brutEff,
        heuresMois: n(f.heuresMois),
        tauxHoraire: n(f.tauxHoraire),
        heuresSup: enNet ? 0 : n(f.heuresSup),
        heuresSup50: enNet ? 0 : n(f.heuresSup50),
        primes: enNet ? 0 : n(f.primes),
        tauxPAS: n(f.tauxPAS),
      }),
    [
      brutEff,
      enNet,
      f.heuresMois,
      f.tauxHoraire,
      f.heuresSup,
      f.heuresSup50,
      f.primes,
      f.tauxPAS,
    ]
  );

  const valid =
    f.entrepriseNom.trim() &&
    f.salarieNom.trim() &&
    (enNet ? n(f.salaireNet) > 0 : n(f.salaireBrut) > 0);

  async function generate() {
    if (!valid || loading) return;
    setLoading(true);
    setError("");
    try {
      const donnees = enNet
        ? {
            ...f,
            salaireBrut: String(brutEff),
            heuresSup: "0",
            heuresSup50: "0",
            primes: "0",
          }
        : f;
      const ok = await submitPaidDoc(
        "fiche-paie",
        donnees,
        "fiche-de-paie.pdf"
      );
      if (!ok) throw new Error("génération");
    } catch {
      setError("La génération a échoué. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const eur2 = (v: number) =>
    v.toLocaleString("fr-FR", { minimumFractionDigits: 2 });

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            generate();
          }}
          className="space-y-5"
        >
          <div>
            <p className="text-noir mb-3 text-sm font-bold">L&apos;employeur</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Nom de l'entreprise" value={f.entrepriseNom} onChange={(v) => set("entrepriseNom", v)} placeholder="Ex. Dupont Bâtiment" />
              <Input label="SIRET" value={f.siret} onChange={(v) => set("siret", v)} placeholder="123 456 789 00012" />
            </div>
            <div className="mt-3">
              <Input label="Adresse de l'entreprise" value={f.entrepriseAdresse} onChange={(v) => set("entrepriseAdresse", v)} placeholder="12 rue des Artisans, 69003 Lyon" />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input label="Code APE / NAF (optionnel)" value={f.codeApe} onChange={(v) => set("codeApe", v)} placeholder="4120A" />
              <Input label="Convention collective (optionnel)" value={f.conventionCollective} onChange={(v) => set("conventionCollective", v)} placeholder="Bâtiment" />
            </div>
          </div>

          <div>
            <p className="text-noir mb-3 text-sm font-bold">Le salarié</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Nom et prénom" value={f.salarieNom} onChange={(v) => set("salarieNom", v)} placeholder="Ex. Ahmed Karim" />
              <Input label="Poste" value={f.poste} onChange={(v) => set("poste", v)} placeholder="Ex. Ouvrier BTP" />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Input label="Classification (optionnel)" value={f.classification} onChange={(v) => set("classification", v)} placeholder="Niveau II, coef. 210" />
              <Input date label="Date d'entrée (optionnel)" value={f.dateEntree} onChange={(v) => set("dateEntree", v)} placeholder="01/03/2023" />
              <Input label="Type de contrat" value={f.typeContrat} onChange={(v) => set("typeContrat", v)} placeholder="CDI" />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Input label="N° de sécurité sociale" value={f.numeroSecu} onChange={(v) => set("numeroSecu", v)} placeholder="1 85 03 69…" />
              <Input label="Période" value={f.periode} onChange={(v) => set("periode", v)} placeholder="Ex. Juin 2026" />
              <Input date label="Date de paiement" value={f.datePaiement} onChange={(v) => set("datePaiement", v)} placeholder="30/06/2026" />
            </div>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-noir text-sm font-bold">Rémunération</p>
              <div className="border-or/30 inline-flex rounded-lg border p-0.5">
                {[
                  ["brut", "Je saisis le Brut"],
                  ["net", "Je saisis le Net"],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => set("modeSaisie", val)}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                      f.modeSaisie === val
                        ? "bg-or text-white"
                        : "text-gris hover:text-noir"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {enNet ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input label="Net à payer souhaité (€)" value={f.salaireNet} onChange={(v) => set("salaireNet", v)} placeholder="1700" inputMode="decimal" />
                  <Input label="Heures / mois" value={f.heuresMois} onChange={(v) => set("heuresMois", v)} placeholder="151.67" inputMode="decimal" />
                  <label className="block">
                    <span className="text-noir mb-1.5 block text-sm font-medium">
                      Brut calculé
                    </span>
                    <div className="border-or/30 bg-creme/60 text-noir flex h-11 items-center rounded-lg border px-3.5 text-sm font-bold">
                      {brutEff.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                    </div>
                  </label>
                </div>
                <p className="text-gris mt-2 text-xs">
                  Le brut est calculé pour atteindre ce net à payer (avant
                  impôt). Heures sup. et primes désactivées en mode Net.
                </p>
              </>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input label="Salaire brut (€)" value={f.salaireBrut} onChange={(v) => set("salaireBrut", v)} placeholder="2200" inputMode="decimal" />
                  <Input label="Heures / mois" value={f.heuresMois} onChange={(v) => set("heuresMois", v)} placeholder="151.67" inputMode="decimal" />
                  <Input label="Taux horaire (auto)" value={f.tauxHoraire} onChange={(v) => set("tauxHoraire", v)} placeholder="auto" inputMode="decimal" />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Input label="Heures sup. 25%" value={f.heuresSup} onChange={(v) => set("heuresSup", v)} placeholder="0" inputMode="decimal" />
                  <Input label="Heures sup. 50%" value={f.heuresSup50} onChange={(v) => set("heuresSup50", v)} placeholder="0" inputMode="decimal" />
                  <Input label="Primes (€)" value={f.primes} onChange={(v) => set("primes", v)} placeholder="0" inputMode="decimal" />
                </div>
              </>
            )}
          </div>

          <div>
            <p className="text-noir mb-3 text-sm font-bold">
              Impôt, congés & cumuls (optionnel)
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input label="Taux prélèvement source (%)" value={f.tauxPAS} onChange={(v) => set("tauxPAS", v)} placeholder="0" inputMode="decimal" />
              <Input label="Congés acquis (jours)" value={f.congesAcquis} onChange={(v) => set("congesAcquis", v)} placeholder="25" inputMode="decimal" />
              <Input label="Congés pris (jours)" value={f.congesPris} onChange={(v) => set("congesPris", v)} placeholder="0" inputMode="decimal" />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input label="Cumul brut annuel (€)" value={f.cumulBrut} onChange={(v) => set("cumulBrut", v)} placeholder="auto = ce mois" inputMode="decimal" />
              <Input label="Cumul net imposable annuel (€)" value={f.cumulNetImposable} onChange={(v) => set("cumulNetImposable", v)} placeholder="auto = ce mois" inputMode="decimal" />
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
                Générer le bulletin (PDF)
              </>
            )}
          </button>
          <p className="text-gris text-xs">
            Le paiement sécurisé (8&nbsp;€) sera requis avant téléchargement dès
            l&apos;activation de Stripe.
          </p>
        </form>
      </Card>

      {/* Aperçu en direct */}
      <div className="border-or/30 bg-noir h-fit rounded-2xl border p-5 text-white lg:sticky lg:top-6">
        <p className="text-or text-xs font-bold uppercase tracking-[0.16em]">
          Aperçu du calcul
        </p>
        <Row label="Salaire brut" value={`${eur2(res.brut)} €`} />
        <Row label="Cotisations salariales" value={`− ${eur2(res.totalSal)} €`} />
        <div className="my-2 h-px bg-white/10" />
        <Row label="Net avant impôt" value={`${eur2(res.netAvantImpot)} €`} />
        <Row label="Net imposable" value={`${eur2(res.netImposable)} €`} muted />
        {res.montantPAS > 0 && (
          <Row label="Prélèvement source" value={`− ${eur2(res.montantPAS)} €`} muted />
        )}
        <div className="my-2 h-px bg-white/10" />
        <Row label="Net payé" value={`${eur2(res.netPaye)} €`} strong />
        <div className="my-2 h-px bg-white/10" />
        <Row label="Coût employeur" value={`${eur2(res.coutEmployeur)} €`} muted />
        <p className="mt-3 text-[0.65rem] leading-relaxed text-white/40">
          Calcul indicatif (taux 2026 simplifiés). Le PDF détaille chaque
          cotisation.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="mt-2 flex items-center justify-between gap-2">
      <span className={`text-sm ${muted ? "text-white/45" : "text-white/70"}`}>
        {label}
      </span>
      <span
        className={`tabular text-sm ${
          strong ? "text-or font-bold" : muted ? "text-white/60" : "font-semibold"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function CertificatForm() {
  const [f, setF] = useState({
    entrepriseNom: "",
    entrepriseAdresse: "",
    siret: "",
    representantNom: "",
    representantQualite: "Gérant",
    salarieNom: "",
    poste: "",
    dateDebut: "",
    dateFin: "",
    ville: "",
    date: aujourdhui(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((p) => ({ ...p, [k]: v }));
  }
  usePrefill(setF);

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
      const ok = await submitPaidDoc(
        "certificat-travail",
        f,
        "certificat-de-travail.pdf"
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          generate();
        }}
        className="space-y-5"
      >
        <div>
          <p className="text-noir mb-3 text-sm font-bold">L&apos;employeur</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nom de l'entreprise" value={f.entrepriseNom} onChange={(v) => set("entrepriseNom", v)} placeholder="Ex. Dupont Bâtiment" />
            <Input label="SIRET (optionnel)" value={f.siret} onChange={(v) => set("siret", v)} placeholder="123 456 789 00012" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label="Représentant" value={f.representantNom} onChange={(v) => set("representantNom", v)} placeholder="Ex. M. Dupont" />
            <Input label="Qualité" value={f.representantQualite} onChange={(v) => set("representantQualite", v)} placeholder="Ex. Gérant" />
          </div>
          <div className="mt-3">
            <Input label="Adresse de l'entreprise" value={f.entrepriseAdresse} onChange={(v) => set("entrepriseAdresse", v)} placeholder="12 rue des Artisans, 69003 Lyon" />
          </div>
        </div>

        <div>
          <p className="text-noir mb-3 text-sm font-bold">Le salarié</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nom et prénom" value={f.salarieNom} onChange={(v) => set("salarieNom", v)} placeholder="Ex. Sophie Martin" />
            <Input label="Poste occupé" value={f.poste} onChange={(v) => set("poste", v)} placeholder="Ex. Assistante administrative" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input date label="Date d'entrée" value={f.dateDebut} onChange={(v) => set("dateDebut", v)} placeholder="01/03/2023" />
            <Input date label="Date de sortie" value={f.dateFin} onChange={(v) => set("dateFin", v)} placeholder="30/06/2026" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label="Ville (signature)" value={f.ville} onChange={(v) => set("ville", v)} placeholder="Lyon" />
            <Input date label="Date de délivrance" value={f.date} onChange={(v) => set("date", v)} placeholder="28/06/2026" />
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
              Générer le certificat (PDF)
            </>
          )}
        </button>
        <p className="text-gris text-xs">
          Le paiement sécurisé (3&nbsp;€) sera requis avant téléchargement dès
          l&apos;activation de Stripe.
        </p>
      </form>
    </Card>
  );
}

function ContratForm() {
  const [f, setF] = useState({
    entrepriseNom: "",
    entrepriseAdresse: "",
    siret: "",
    representantNom: "",
    representantQualite: "Gérant",
    salarieNom: "",
    salarieAdresse: "",
    salarieDateNaissance: "",
    salarieLieuNaissance: "",
    salarieNationalite: "",
    salarieNumeroSecu: "",
    typeContrat: "cdi",
    dateDebut: aujourdhui(),
    dateFin: "",
    motifCdd: "",
    poste: "",
    salaireBrut: "",
    heuresSemaine: "35",
    lieuTravail: "",
    periodeEssai: "2 mois",
    conventionCollective: "",
    ville: "",
    date: aujourdhui(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((p) => ({ ...p, [k]: v }));
  }
  usePrefill(setF);

  const cdd = f.typeContrat === "cdd";
  const valid =
    f.entrepriseNom.trim() &&
    f.representantNom.trim() &&
    f.salarieNom.trim() &&
    f.poste.trim() &&
    (parseFloat(f.salaireBrut.replace(",", ".")) || 0) > 0;

  async function generate() {
    if (!valid || loading) return;
    setLoading(true);
    setError("");
    try {
      const ok = await submitPaidDoc(
        "contrat-travail",
        f,
        "contrat-de-travail.pdf"
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          generate();
        }}
        className="space-y-5"
      >
        {/* Type */}
        <div>
          <span className="text-noir mb-1.5 block text-sm font-medium">
            Type de contrat
          </span>
          <div className="flex gap-2">
            {[
              ["cdi", "CDI"],
              ["cdd", "CDD"],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => set("typeContrat", val)}
                className={`h-11 flex-1 rounded-lg border text-sm font-semibold transition-colors sm:flex-none sm:px-10 ${
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

        <div>
          <p className="text-noir mb-3 text-sm font-bold">L&apos;employeur</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nom de l'entreprise" value={f.entrepriseNom} onChange={(v) => set("entrepriseNom", v)} placeholder="Ex. Dupont Bâtiment" />
            <Input label="SIRET (optionnel)" value={f.siret} onChange={(v) => set("siret", v)} placeholder="123 456 789 00012" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label="Représentant" value={f.representantNom} onChange={(v) => set("representantNom", v)} placeholder="Ex. M. Dupont" />
            <Input label="Qualité" value={f.representantQualite} onChange={(v) => set("representantQualite", v)} placeholder="Ex. Gérant" />
          </div>
          <div className="mt-3">
            <Input label="Adresse de l'entreprise" value={f.entrepriseAdresse} onChange={(v) => set("entrepriseAdresse", v)} placeholder="12 rue des Artisans, 69003 Lyon" />
          </div>
        </div>

        <div>
          <p className="text-noir mb-3 text-sm font-bold">Le salarié</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nom et prénom" value={f.salarieNom} onChange={(v) => set("salarieNom", v)} placeholder="Ex. Sophie Martin" />
            <Input label="Adresse du salarié" value={f.salarieAdresse} onChange={(v) => set("salarieAdresse", v)} placeholder="3 rue des Fleurs, 69003 Lyon" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Input date label="Date de naissance" value={f.salarieDateNaissance} onChange={(v) => set("salarieDateNaissance", v)} placeholder="12/05/1990" />
            <Input label="Lieu de naissance" value={f.salarieLieuNaissance} onChange={(v) => set("salarieLieuNaissance", v)} placeholder="Avignon" />
            <Input label="Nationalité" value={f.salarieNationalite} onChange={(v) => set("salarieNationalite", v)} placeholder="Française" />
          </div>
          <div className="mt-3">
            <Input label="N° de sécurité sociale" value={f.salarieNumeroSecu} onChange={(v) => set("salarieNumeroSecu", v)} placeholder="2 85 06 84 007 042 31" />
          </div>
        </div>

        <div>
          <p className="text-noir mb-3 text-sm font-bold">Le poste</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Poste" value={f.poste} onChange={(v) => set("poste", v)} placeholder="Ex. Assistante administrative" />
            <Input label="Salaire brut mensuel (€)" value={f.salaireBrut} onChange={(v) => set("salaireBrut", v)} placeholder="1802" inputMode="decimal" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input date label="Date de début" value={f.dateDebut} onChange={(v) => set("dateDebut", v)} placeholder="01/07/2026" />
            <Input label="Heures / semaine" value={f.heuresSemaine} onChange={(v) => set("heuresSemaine", v)} placeholder="35" inputMode="decimal" />
          </div>
          {cdd && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input date label="Date de fin (CDD)" value={f.dateFin} onChange={(v) => set("dateFin", v)} placeholder="31/12/2026" />
              <Input label="Motif du CDD" value={f.motifCdd} onChange={(v) => set("motifCdd", v)} placeholder="Accroissement d'activité" />
            </div>
          )}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label="Lieu de travail" value={f.lieuTravail} onChange={(v) => set("lieuTravail", v)} placeholder="12 rue des Artisans, Lyon" />
            <Input label="Période d'essai" value={f.periodeEssai} onChange={(v) => set("periodeEssai", v)} placeholder="2 mois / Aucune" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label="Convention collective (optionnel)" value={f.conventionCollective} onChange={(v) => set("conventionCollective", v)} placeholder="Ex. Bâtiment" />
            <Input label="Ville (signature)" value={f.ville} onChange={(v) => set("ville", v)} placeholder="Lyon" />
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
              Générer le contrat (PDF)
            </>
          )}
        </button>
        <p className="text-gris text-xs">
          Le paiement sécurisé (5&nbsp;€) sera requis avant téléchargement dès
          l&apos;activation de Stripe.
        </p>
      </form>
    </Card>
  );
}

function SoldeForm() {
  const [f, setF] = useState({
    entrepriseNom: "",
    entrepriseAdresse: "",
    siret: "",
    representantNom: "",
    representantQualite: "Gérant",
    salarieNom: "",
    salarieAdresse: "",
    poste: "",
    dateEntree: "",
    dateSortie: "",
    motifRupture: "Fin de CDD",
    salaireDu: "",
    indemniteConges: "",
    indemnitePreavis: "",
    indemniteRupture: "",
    autresSommes: "",
    ville: "",
    date: aujourdhui(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((p) => ({ ...p, [k]: v }));
  }
  usePrefill(setF);

  const n = (s: string) => parseFloat(s.replace(",", ".")) || 0;
  const total = useMemo(
    () =>
      n(f.salaireDu) +
      n(f.indemniteConges) +
      n(f.indemnitePreavis) +
      n(f.indemniteRupture) +
      n(f.autresSommes),
    [
      f.salaireDu,
      f.indemniteConges,
      f.indemnitePreavis,
      f.indemniteRupture,
      f.autresSommes,
    ]
  );

  const valid =
    f.entrepriseNom.trim() &&
    f.salarieNom.trim() &&
    f.poste.trim() &&
    total > 0;

  async function generate() {
    if (!valid || loading) return;
    setLoading(true);
    setError("");
    try {
      const ok = await submitPaidDoc(
        "solde-tout-compte",
        f,
        "solde-de-tout-compte.pdf"
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          generate();
        }}
        className="space-y-5"
      >
        <div>
          <p className="text-noir mb-3 text-sm font-bold">L&apos;employeur</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nom de l'entreprise" value={f.entrepriseNom} onChange={(v) => set("entrepriseNom", v)} placeholder="Ex. Dupont Bâtiment" />
            <Input label="SIRET (optionnel)" value={f.siret} onChange={(v) => set("siret", v)} placeholder="123 456 789 00012" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label="Représentant" value={f.representantNom} onChange={(v) => set("representantNom", v)} placeholder="Ex. M. Dupont" />
            <Input label="Adresse de l'entreprise" value={f.entrepriseAdresse} onChange={(v) => set("entrepriseAdresse", v)} placeholder="12 rue des Artisans, 69003 Lyon" />
          </div>
        </div>

        <div>
          <p className="text-noir mb-3 text-sm font-bold">Le salarié</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nom et prénom" value={f.salarieNom} onChange={(v) => set("salarieNom", v)} placeholder="Ex. Sophie Martin" />
            <Input label="Poste occupé" value={f.poste} onChange={(v) => set("poste", v)} placeholder="Ex. Assistante administrative" />
          </div>
          <div className="mt-3">
            <Input label="Adresse du salarié (optionnel)" value={f.salarieAdresse} onChange={(v) => set("salarieAdresse", v)} placeholder="3 rue des Fleurs, 69003 Lyon" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input date label="Date d'entrée" value={f.dateEntree} onChange={(v) => set("dateEntree", v)} placeholder="01/03/2023" />
            <Input date label="Date de sortie" value={f.dateSortie} onChange={(v) => set("dateSortie", v)} placeholder="30/06/2026" />
          </div>
          <div className="mt-3">
            <Input label="Motif de la rupture" value={f.motifRupture} onChange={(v) => set("motifRupture", v)} placeholder="Fin de CDD, démission, licenciement…" />
          </div>
        </div>

        <div>
          <p className="text-noir mb-3 text-sm font-bold">
            Sommes versées (brut, en €)
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Salaire et accessoires dus" value={f.salaireDu} onChange={(v) => set("salaireDu", v)} placeholder="1500" inputMode="decimal" />
            <Input label="Indemnité de congés payés" value={f.indemniteConges} onChange={(v) => set("indemniteConges", v)} placeholder="450" inputMode="decimal" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label="Indemnité de préavis" value={f.indemnitePreavis} onChange={(v) => set("indemnitePreavis", v)} placeholder="0" inputMode="decimal" />
            <Input label="Indemnité de rupture (licenciement / CDD)" value={f.indemniteRupture} onChange={(v) => set("indemniteRupture", v)} placeholder="0" inputMode="decimal" />
          </div>
          <div className="mt-3">
            <Input label="Autres sommes" value={f.autresSommes} onChange={(v) => set("autresSommes", v)} placeholder="0" inputMode="decimal" />
          </div>
          <p className="text-gris mt-3 text-sm">
            Total perçu :{" "}
            <span className="text-noir font-bold">
              {total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
            </span>
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Ville (signature)" value={f.ville} onChange={(v) => set("ville", v)} placeholder="Lyon" />
          <Input date label="Date de signature" value={f.date} onChange={(v) => set("date", v)} placeholder="28/06/2026" />
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
              Générer le reçu (PDF)
            </>
          )}
        </button>
        <p className="text-gris text-xs">
          Le paiement sécurisé (3&nbsp;€) sera requis avant téléchargement dès
          l&apos;activation de Stripe.
        </p>
      </form>
    </Card>
  );
}

function RuptureForm() {
  const [f, setF] = useState({
    entrepriseNom: "",
    entrepriseAdresse: "",
    siret: "",
    representantNom: "",
    representantQualite: "Gérant",
    salarieNom: "",
    salarieAdresse: "",
    poste: "",
    dateEmbauche: "",
    salaireBrut: "",
    indemniteRupture: "",
    dateEntretien: "",
    dateRupture: "",
    ville: "",
    date: aujourdhui(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((p) => ({ ...p, [k]: v }));
  }
  usePrefill(setF);

  const valid =
    f.entrepriseNom.trim() &&
    f.representantNom.trim() &&
    f.salarieNom.trim() &&
    f.poste.trim() &&
    (parseFloat(f.indemniteRupture.replace(",", ".")) || 0) > 0;

  async function generate() {
    if (!valid || loading) return;
    setLoading(true);
    setError("");
    try {
      const ok = await submitPaidDoc(
        "rupture-conventionnelle",
        f,
        "rupture-conventionnelle.pdf"
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          generate();
        }}
        className="space-y-5"
      >
        <div>
          <p className="text-noir mb-3 text-sm font-bold">L&apos;employeur</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nom de l'entreprise" value={f.entrepriseNom} onChange={(v) => set("entrepriseNom", v)} placeholder="Ex. Dupont Bâtiment" />
            <Input label="SIRET (optionnel)" value={f.siret} onChange={(v) => set("siret", v)} placeholder="123 456 789 00012" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label="Représentant" value={f.representantNom} onChange={(v) => set("representantNom", v)} placeholder="Ex. M. Dupont" />
            <Input label="Qualité" value={f.representantQualite} onChange={(v) => set("representantQualite", v)} placeholder="Ex. Gérant" />
          </div>
          <div className="mt-3">
            <Input label="Adresse de l'entreprise" value={f.entrepriseAdresse} onChange={(v) => set("entrepriseAdresse", v)} placeholder="12 rue des Artisans, 69003 Lyon" />
          </div>
        </div>

        <div>
          <p className="text-noir mb-3 text-sm font-bold">Le salarié</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nom et prénom" value={f.salarieNom} onChange={(v) => set("salarieNom", v)} placeholder="Ex. Sophie Martin" />
            <Input label="Poste occupé" value={f.poste} onChange={(v) => set("poste", v)} placeholder="Ex. Assistante administrative" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label="Adresse du salarié" value={f.salarieAdresse} onChange={(v) => set("salarieAdresse", v)} placeholder="3 rue des Fleurs, 69003 Lyon" />
            <Input date label="Date d'embauche" value={f.dateEmbauche} onChange={(v) => set("dateEmbauche", v)} placeholder="01/03/2021" />
          </div>
        </div>

        <div>
          <p className="text-noir mb-3 text-sm font-bold">Conditions de la rupture</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Salaire brut mensuel (€)" value={f.salaireBrut} onChange={(v) => set("salaireBrut", v)} placeholder="2200" inputMode="decimal" />
            <Input label="Indemnité de rupture (€)" value={f.indemniteRupture} onChange={(v) => set("indemniteRupture", v)} placeholder="1500" inputMode="decimal" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input date label="Date de l'entretien" value={f.dateEntretien} onChange={(v) => set("dateEntretien", v)} placeholder="20/06/2026" />
            <Input date label="Date envisagée de rupture" value={f.dateRupture} onChange={(v) => set("dateRupture", v)} placeholder="31/07/2026" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label="Ville (signature)" value={f.ville} onChange={(v) => set("ville", v)} placeholder="Lyon" />
            <Input date label="Date de signature" value={f.date} onChange={(v) => set("date", v)} placeholder="28/06/2026" />
          </div>
          <p className="text-gris mt-3 text-xs leading-relaxed">
            L&apos;indemnité ne peut être inférieure à l&apos;indemnité légale de
            licenciement. La rupture nécessite l&apos;homologation de la DREETS
            (délai de rétractation de 15 jours).
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
              Générer la convention (PDF)
            </>
          )}
        </button>
        <p className="text-gris text-xs">
          Le paiement sécurisé (5&nbsp;€) sera requis avant téléchargement dès
          l&apos;activation de Stripe.
        </p>
      </form>
    </Card>
  );
}

function BailCommercialForm() {
  const [f, setF] = useState({
    bailleurNom: "",
    bailleurAdresse: "",
    bailleurQualite: "",
    preneurNom: "",
    preneurAdresse: "",
    preneurRcs: "",
    adresseLocal: "",
    descriptionLocal: "",
    surface: "",
    destination: "",
    loyerAnnuel: "",
    depotGarantie: "",
    charges: "",
    indiceRevision: "ILC",
    dateDebut: "",
    duree: "9 ans",
    ville: "",
    date: aujourdhui(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((p) => ({ ...p, [k]: v }));
  }
  usePrefill(setF);

  const loyerMensuel = useMemo(() => {
    const a = parseFloat(f.loyerAnnuel.replace(",", ".")) || 0;
    return a / 12;
  }, [f.loyerAnnuel]);

  const valid =
    f.bailleurNom.trim() &&
    f.preneurNom.trim() &&
    f.adresseLocal.trim() &&
    f.destination.trim() &&
    (parseFloat(f.loyerAnnuel.replace(",", ".")) || 0) > 0;

  async function generate() {
    if (!valid || loading) return;
    setLoading(true);
    setError("");
    try {
      const ok = await downloadPdf(
        "bail-commercial",
        f,
        "bail-commercial.pdf",
        "/api/documents/generer"
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          generate();
        }}
        className="space-y-5"
      >
        <div>
          <p className="text-noir mb-3 text-sm font-bold">Le bailleur</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nom / dénomination" value={f.bailleurNom} onChange={(v) => set("bailleurNom", v)} placeholder="Ex. SCI des Lilas" />
            <Input label="Qualité (optionnel)" value={f.bailleurQualite} onChange={(v) => set("bailleurQualite", v)} placeholder="SCI, particulier…" />
          </div>
          <div className="mt-3">
            <Input label="Adresse du bailleur" value={f.bailleurAdresse} onChange={(v) => set("bailleurAdresse", v)} placeholder="12 rue des Lilas, 69003 Lyon" />
          </div>
        </div>

        <div>
          <p className="text-noir mb-3 text-sm font-bold">Le preneur</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nom / dénomination" value={f.preneurNom} onChange={(v) => set("preneurNom", v)} placeholder="Ex. SARL Le Bistrot" />
            <Input label="N° RCS (optionnel)" value={f.preneurRcs} onChange={(v) => set("preneurRcs", v)} placeholder="Lyon 123 456 789" />
          </div>
          <div className="mt-3">
            <Input label="Adresse du preneur" value={f.preneurAdresse} onChange={(v) => set("preneurAdresse", v)} placeholder="Siège social" />
          </div>
        </div>

        <div>
          <p className="text-noir mb-3 text-sm font-bold">Le local</p>
          <div className="mt-0">
            <Input label="Adresse du local loué" value={f.adresseLocal} onChange={(v) => set("adresseLocal", v)} placeholder="5 place du Marché, 69003 Lyon" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label="Description (optionnel)" value={f.descriptionLocal} onChange={(v) => set("descriptionLocal", v)} placeholder="Rez-de-chaussée, vitrine, réserve" />
            <Input label="Surface (m²)" value={f.surface} onChange={(v) => set("surface", v)} placeholder="85" inputMode="decimal" />
          </div>
          <div className="mt-3">
            <Input label="Destination / activité autorisée" value={f.destination} onChange={(v) => set("destination", v)} placeholder="Ex. Restauration, vente à emporter" />
          </div>
        </div>

        <div>
          <p className="text-noir mb-3 text-sm font-bold">Conditions financières</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Loyer annuel HT/HC (€)" value={f.loyerAnnuel} onChange={(v) => set("loyerAnnuel", v)} placeholder="18000" inputMode="decimal" />
            <Input label="Dépôt de garantie (€)" value={f.depotGarantie} onChange={(v) => set("depotGarantie", v)} placeholder="3000" inputMode="decimal" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label="Indice de révision" value={f.indiceRevision} onChange={(v) => set("indiceRevision", v)} placeholder="ILC, ILAT…" />
            <Input label="Charges (optionnel)" value={f.charges} onChange={(v) => set("charges", v)} placeholder="Provision mensuelle de 80 €." />
          </div>
          <p className="text-gris mt-3 text-sm">
            Loyer mensuel :{" "}
            <span className="text-noir font-bold">
              {loyerMensuel.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
            </span>
          </p>
        </div>

        <div>
          <p className="text-noir mb-3 text-sm font-bold">Durée & signature</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Durée" value={f.duree} onChange={(v) => set("duree", v)} placeholder="9 ans" />
            <Input date label="Date de prise d'effet" value={f.dateDebut} onChange={(v) => set("dateDebut", v)} placeholder="01/09/2026" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label="Ville (signature)" value={f.ville} onChange={(v) => set("ville", v)} placeholder="Lyon" />
            <Input date label="Date de signature" value={f.date} onChange={(v) => set("date", v)} placeholder="28/06/2026" />
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
              Générer le bail (PDF)
            </>
          )}
        </button>
        <p className="text-gris text-xs">
          Le paiement sécurisé (9&nbsp;€) sera requis avant téléchargement dès
          l&apos;activation de Stripe.
        </p>
      </form>
    </Card>
  );
}

type AssocieRow = { nom: string; adresse: string; apport: string };

function StatutsForm() {
  const [f, setF] = useState({
    forme: "SARL",
    denomination: "",
    objet: "",
    siege: "",
    duree: "99 ans",
    valeurTitre: "10",
    dirigeantNom: "",
    dirigeantAdresse: "",
    ville: "",
    date: aujourdhui(),
  });
  const [associes, setAssocies] = useState<AssocieRow[]>([
    { nom: "", adresse: "", apport: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((p) => ({ ...p, [k]: v }));
  }
  usePrefill(setF);

  const unipersonnelle = f.forme === "EURL" || f.forme === "SASU";
  const parts = f.forme === "SARL" || f.forme === "EURL";

  // Les formes unipersonnelles n'ont qu'un seul associé
  function setForme(v: string) {
    setF((p) => ({ ...p, forme: v }));
    if ((v === "EURL" || v === "SASU") && associes.length > 1) {
      setAssocies((p) => [p[0]]);
    }
  }

  function setAssocie(i: number, k: keyof AssocieRow, v: string) {
    setAssocies((p) => p.map((a, j) => (j === i ? { ...a, [k]: v } : a)));
  }
  function addAssocie() {
    setAssocies((p) => [...p, { nom: "", adresse: "", apport: "" }]);
  }
  function removeAssocie(i: number) {
    setAssocies((p) => (p.length > 1 ? p.filter((_, j) => j !== i) : p));
  }

  const n = (s: string) => parseFloat(s.replace(",", ".")) || 0;
  const capital = useMemo(
    () => associes.reduce((s, a) => s + n(a.apport), 0),
    [associes]
  );
  const nbTitres = useMemo(() => {
    const v = n(f.valeurTitre);
    return v > 0 ? Math.round(capital / v) : 0;
  }, [capital, f.valeurTitre]);

  const valid =
    f.denomination.trim() &&
    f.objet.trim() &&
    f.siege.trim() &&
    f.dirigeantNom.trim() &&
    associes.some((a) => a.nom.trim()) &&
    capital > 0;

  async function generate() {
    if (!valid || loading) return;
    setLoading(true);
    setError("");
    try {
      const ok = await submitPaidDoc(
        "statuts-societe",
        { ...f, capital: String(capital), associes },
        "statuts-societe.pdf"
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          generate();
        }}
        className="space-y-5"
      >
        {/* Forme */}
        <div>
          <span className="text-noir mb-1.5 block text-sm font-medium">
            Forme juridique
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {["SARL", "SAS", "EURL", "SASU"].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setForme(val)}
                className={`h-11 rounded-lg border text-sm font-semibold transition-colors ${
                  f.forme === val
                    ? "border-or bg-or text-white"
                    : "border-or/30 text-noir bg-white"
                }`}
              >
                {val}
              </button>
            ))}
          </div>
          <p className="text-gris mt-2 text-xs">
            {unipersonnelle
              ? "Forme unipersonnelle : un seul associé."
              : `Capital divisé en ${parts ? "parts sociales" : "actions"}.`}
          </p>
        </div>

        <div>
          <p className="text-noir mb-3 text-sm font-bold">La société</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Dénomination sociale" value={f.denomination} onChange={(v) => set("denomination", v)} placeholder="Ex. Le Bistrot Lyonnais" />
            <Input label="Durée" value={f.duree} onChange={(v) => set("duree", v)} placeholder="99 ans" />
          </div>
          <div className="mt-3">
            <label className="block">
              <span className="text-noir mb-1.5 block text-sm font-medium">
                Objet social
              </span>
              <textarea
                value={f.objet}
                onChange={(e) => set("objet", e.target.value)}
                placeholder="Ex. l'exploitation d'un restaurant, la vente de plats à emporter…"
                rows={2}
                className="border-or/30 bg-white text-noir placeholder:text-gris/50 focus:border-or focus:ring-or/15 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-4"
              />
            </label>
          </div>
          <div className="mt-3">
            <Input label="Siège social" value={f.siege} onChange={(v) => set("siege", v)} placeholder="5 place du Marché, 69003 Lyon" />
          </div>
        </div>

        {/* Associés */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-noir text-sm font-bold">
              {unipersonnelle ? "L'associé unique" : "Les associés"}
            </p>
            {!unipersonnelle && (
              <button
                type="button"
                onClick={addAssocie}
                className="text-orange text-sm font-semibold hover:underline"
              >
                + Ajouter un associé
              </button>
            )}
          </div>
          <div className="space-y-4">
            {associes.map((a, i) => (
              <div
                key={i}
                className="border-or/20 bg-creme/40 rounded-xl border p-3"
              >
                {!unipersonnelle && associes.length > 1 && (
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-gris text-xs font-bold">
                      Associé {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAssocie(i)}
                      className="text-xs font-semibold text-red-500 hover:underline"
                    >
                      Retirer
                    </button>
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Nom / prénom" value={a.nom} onChange={(v) => setAssocie(i, "nom", v)} placeholder="Ex. Sophie Martin" />
                  <Input label="Apport (€)" value={a.apport} onChange={(v) => setAssocie(i, "apport", v)} placeholder="5000" inputMode="decimal" />
                </div>
                <div className="mt-3">
                  <Input label="Adresse" value={a.adresse} onChange={(v) => setAssocie(i, "adresse", v)} placeholder="3 rue des Fleurs, 69003 Lyon" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-noir mb-3 text-sm font-bold">Capital</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={`Valeur d'${parts ? "une part" : "une action"} (€)`}
              value={f.valeurTitre}
              onChange={(v) => set("valeurTitre", v)}
              placeholder="10"
              inputMode="decimal"
            />
            <div className="bg-noir flex flex-col justify-center rounded-lg px-4 py-2 text-white">
              <span className="text-or text-[0.7rem] font-bold uppercase tracking-wider">
                Capital social
              </span>
              <span className="font-display text-lg font-bold">
                {capital.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
              </span>
              <span className="text-[0.7rem] text-white/50">
                {nbTitres} {parts ? "parts" : "actions"}
              </span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-noir mb-3 text-sm font-bold">
            {parts ? "Le gérant" : "Le président"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nom et prénom" value={f.dirigeantNom} onChange={(v) => set("dirigeantNom", v)} placeholder="Ex. Sophie Martin" />
            <Input label="Adresse" value={f.dirigeantAdresse} onChange={(v) => set("dirigeantAdresse", v)} placeholder="3 rue des Fleurs, 69003 Lyon" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Ville (signature)" value={f.ville} onChange={(v) => set("ville", v)} placeholder="Lyon" />
          <Input date label="Date de signature" value={f.date} onChange={(v) => set("date", v)} placeholder="28/06/2026" />
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
              Générer les statuts (PDF)
            </>
          )}
        </button>
        <p className="text-gris text-xs">
          Le paiement sécurisé (19&nbsp;€) sera requis avant téléchargement dès
          l&apos;activation de Stripe. Modèle à adapter à votre situation ; une
          relecture par un professionnel est recommandée.
        </p>
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
  date,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "decimal";
  /** true : champ date jj/mm/aaaa — les « / » s'insèrent à la saisie. */
  date?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-noir mb-1.5 block text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) =>
          onChange(date ? formatDateInput(e.target.value, value) : e.target.value)
        }
        placeholder={placeholder}
        inputMode={date ? "numeric" : inputMode}
        className={FIELD}
      />
    </label>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CreditCard,
  ExternalLink,
  Eye,
  Gift,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/auth";
import { getStripe } from "@/lib/stripe";
import { DOCUMENTS } from "@/lib/documents";
import { emailsAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Tableau de bord admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Tableau de bord administrateur — réservé aux emails de EMAILS_ADMIN
 * (par défaut : le propriétaire du site). Il faut être CONNECTÉ avec ce compte.
 *
 * Sources des chiffres :
 *  - table Supabase `events` (mesure anonyme, sans cookie) via admin_stats() ;
 *  - API Stripe pour le chiffre d'affaires réellement encaissé.
 */

type Stats = {
  visiteurs: number;
  pages_vues: number;
  gratuits: number;
  checkouts: number;
  paiements: number;
  ca: number;
  par_jour: { jour: string; pages: number; visiteurs: number }[];
  top_pages: { path: string; n: number }[];
  sources: { source: string; n: number }[];
  docs: {
    doc: string;
    visites: number;
    gratuits: number;
    checkouts: number;
    paiements: number;
    ca: number;
  }[];
};

const STATS_VIDES: Stats = {
  visiteurs: 0,
  pages_vues: 0,
  gratuits: 0,
  checkouts: 0,
  paiements: 0,
  ca: 0,
  par_jour: [],
  top_pages: [],
  sources: [],
  docs: [],
};

type StatsStripe = {
  total: number;
  n: number;
  parDoc: { slug: string; n: number; ca: number }[];
} | null;

async function statsStripe(jours: number): Promise<StatsStripe> {
  const stripe = getStripe();
  if (!stripe) return null;
  try {
    const depuis = Math.floor(Date.now() / 1000) - jours * 86400;
    const parDoc = new Map<string, { n: number; ca: number }>();
    let total = 0;
    let n = 0;
    let after: string | undefined;
    for (let page = 0; page < 10; page++) {
      const res = await stripe.checkout.sessions.list({
        limit: 100,
        created: { gte: depuis },
        ...(after ? { starting_after: after } : {}),
      });
      for (const s of res.data) {
        if (s.payment_status !== "paid") continue;
        const eur = (s.amount_total ?? 0) / 100;
        total += eur;
        n += 1;
        const slug = s.metadata?.slug ?? "autre";
        const cur = parDoc.get(slug) ?? { n: 0, ca: 0 };
        cur.n += 1;
        cur.ca += eur;
        parDoc.set(slug, cur);
      }
      if (!res.has_more || res.data.length === 0) break;
      after = res.data[res.data.length - 1].id;
    }
    return {
      total,
      n,
      parDoc: [...parDoc.entries()]
        .map(([slug, v]) => ({ slug, ...v }))
        .sort((a, b) => b.ca - a.ca),
    };
  } catch (err) {
    console.error("stats stripe:", err);
    return null;
  }
}

/** Série complète des N derniers jours (jours sans visite inclus). */
function serieJours(
  jours: number,
  parJourBrut: { jour: string; pages: number; visiteurs: number }[]
): { jour: string; pages: number; visiteurs: number }[] {
  const parJour = new Map(parJourBrut.map((d) => [d.jour, d]));
  const serie: { jour: string; pages: number; visiteurs: number }[] = [];
  for (let i = jours - 1; i >= 0; i--) {
    const key = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
    const v = parJour.get(key);
    serie.push({ jour: key, pages: v?.pages ?? 0, visiteurs: v?.visiteurs ?? 0 });
  }
  return serie;
}

const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);

const titreDoc = (slug: string) =>
  DOCUMENTS.find((d) => d.slug === slug)?.title ?? slug;

const RESEAUX = [
  {
    nom: "Meta Business Suite",
    detail: "Statistiques Facebook + Instagram (abonnés, portée, publications)",
    href: "https://business.facebook.com/latest/insights",
  },
  {
    nom: "Meta Ads Manager",
    detail: "Performances de vos publicités Facebook / Instagram",
    href: "https://adsmanager.facebook.com/adsmanager",
  },
  {
    nom: "YouTube Studio",
    detail: "Vues, abonnés et audience de la chaîne (onglet Données d'analyse)",
    href: "https://studio.youtube.com/",
  },
  {
    nom: "TikTok Studio",
    detail: "Statistiques du compte TikTok (vues, abonnés, tendances)",
    href: "https://www.tiktok.com/tiktokstudio/analytics",
  },
  {
    nom: "LinkedIn",
    detail: "Page entreprise → onglet « Analyses » (visiteurs, abonnés)",
    href: "https://www.linkedin.com/",
  },
  {
    nom: "Google Search Console",
    detail: "Trafic venu de Google : clics, impressions, mots-clés",
    href: "https://search.google.com/search-console",
  },
  {
    nom: "Metricool (recommandé)",
    detail: "Tous vos réseaux au même endroit — connectez-y vos comptes",
    href: "https://app.metricool.com/",
  },
];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ j?: string }>;
}) {
  const sp = await searchParams;
  const jours = [7, 30, 90].includes(Number(sp.j)) ? Number(sp.j) : 30;

  // ── Garde d'accès : connecté ET dans la liste admin ──────────
  if (!isSupabaseEnabled()) redirect("/");
  const user = await getUser();
  if (!user) redirect("/connexion");
  if (!emailsAdmin().includes(user.email?.toLowerCase() ?? "")) redirect("/");

  const supabase = await createClient();
  const [rpc, stripe] = await Promise.all([
    supabase.rpc("admin_stats", { p_jours: jours }),
    statsStripe(jours),
  ]);
  if (rpc.error) console.error("admin_stats:", rpc.error.message);
  const stats: Stats = { ...STATS_VIDES, ...((rpc.data as Partial<Stats>) ?? {}) };

  const abandons = Math.max(0, stats.checkouts - stats.paiements);
  const tauxConversion =
    stats.checkouts > 0 ? Math.round((stats.paiements / stats.checkouts) * 100) : null;

  const serie = serieJours(jours, stats.par_jour);
  const maxVisiteurs = Math.max(1, ...serie.map((d) => d.visiteurs));

  // Entonnoir : les 12 documents du catalogue, triés par résultat.
  const parSlug = new Map(stats.docs.map((d) => [d.doc, d]));
  const lignes = DOCUMENTS.map((d) => {
    const s = parSlug.get(d.slug);
    return {
      slug: d.slug,
      titre: d.title,
      gratuit: d.free,
      visites: s?.visites ?? 0,
      gratuits: s?.gratuits ?? 0,
      checkouts: s?.checkouts ?? 0,
      paiements: s?.paiements ?? 0,
      ca: s?.ca ?? 0,
    };
  }).sort(
    (a, b) => b.ca - a.ca || b.paiements - a.paiements || b.visites - a.visites
  );

  return (
    <div className="bg-creme min-h-dvh">
      <header className="bg-noir">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo theme="dark" />
          <Link
            href="/espace"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} />
            Mon espace
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-noir text-2xl font-extrabold sm:text-3xl">
              Tableau de bord
            </h1>
            <p className="text-gris mt-1 text-sm">
              Mesure anonyme, sans cookie — {jours} derniers jours.
            </p>
          </div>
          <div className="flex gap-1.5">
            {[7, 30, 90].map((j) => (
              <Link
                key={j}
                href={`/admin?j=${j}`}
                className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                  j === jours
                    ? "bg-noir text-white"
                    : "text-noir border-or/30 hover:border-or border bg-white"
                }`}
              >
                {j} j
              </Link>
            ))}
          </div>
        </div>

        {rpc.error && (
          <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>La table de statistiques n&apos;est pas encore installée.</strong>{" "}
            Exécutez le fichier <code>supabase/analytics.sql</code> dans Supabase
            (SQL Editor → New query → Run), puis rechargez cette page.
          </div>
        )}

        {/* ── Chiffres clés ─────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            icone={<Users size={18} className="text-or" />}
            label="Visiteurs"
            valeur={String(stats.visiteurs)}
            note={`${stats.pages_vues} pages vues`}
          />
          <Kpi
            icone={<CreditCard size={18} className="text-vert" />}
            label="Ventes (site)"
            valeur={String(stats.paiements)}
            note={`${eur(stats.ca)} encaissés`}
          />
          <Kpi
            icone={<ShoppingCart size={18} className="text-orange" />}
            label="Paniers abandonnés"
            valeur={String(abandons)}
            note={
              tauxConversion === null
                ? "aucun paiement initié"
                : `${tauxConversion}% des paniers payés`
            }
          />
          <Kpi
            icone={<Gift size={18} className="text-or" />}
            label="Documents gratuits"
            valeur={String(stats.gratuits)}
            note="générés sur la période"
          />
        </div>

        {/* ── Stripe : l'argent réellement encaissé ─────────── */}
        <section className="border-or/20 mt-6 rounded-2xl border bg-white p-5 sm:p-6">
          <h2 className="font-display text-noir flex items-center gap-2 text-lg font-extrabold">
            <TrendingUp size={18} className="text-vert" />
            Revenus Stripe (encaissements réels)
          </h2>
          {stripe === null ? (
            <p className="text-gris mt-3 text-sm">
              Stripe n&apos;a pas répondu (clé absente ou erreur réseau) — les
              montants ci-dessus proviennent de la mesure du site.
            </p>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                <span className="font-display text-noir text-3xl font-extrabold">
                  {eur(stripe.total)}
                </span>
                <span className="text-gris text-sm">
                  {stripe.n} paiement{stripe.n > 1 ? "s" : ""} confirmé
                  {stripe.n > 1 ? "s" : ""} sur {jours} jours
                </span>
              </div>
              {stripe.parDoc.length > 0 && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {stripe.parDoc.map((d) => (
                    <div
                      key={d.slug}
                      className="border-or/15 bg-creme/60 flex items-center justify-between rounded-xl border px-4 py-2.5"
                    >
                      <span className="text-noir text-sm font-semibold">
                        {titreDoc(d.slug)}
                      </span>
                      <span className="text-gris text-sm">
                        {d.n} × · <strong className="text-vert">{eur(d.ca)}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* ── Visiteurs par jour ────────────────────────────── */}
        <section className="border-or/20 mt-6 rounded-2xl border bg-white p-5 sm:p-6">
          <h2 className="font-display text-noir flex items-center gap-2 text-lg font-extrabold">
            <BarChart3 size={18} className="text-or" />
            Visiteurs par jour
          </h2>
          <div className="mt-4 flex h-36 items-end gap-[2px]">
            {serie.map((d) => (
              <div
                key={d.jour}
                className="group relative flex-1"
                title={`${new Date(d.jour).toLocaleDateString("fr-FR")} — ${d.visiteurs} visiteur${d.visiteurs > 1 ? "s" : ""}, ${d.pages} pages`}
              >
                <div
                  className="bg-orange/80 group-hover:bg-orange w-full rounded-t transition-colors"
                  style={{
                    height: `${Math.max(2, Math.round((d.visiteurs / maxVisiteurs) * 100))}%`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="text-gris mt-2 flex justify-between text-xs">
            <span>{new Date(serie[0].jour).toLocaleDateString("fr-FR")}</span>
            <span>aujourd&apos;hui</span>
          </div>
        </section>

        {/* ── Entonnoir par document ────────────────────────── */}
        <section className="border-or/20 mt-6 overflow-hidden rounded-2xl border bg-white">
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <h2 className="font-display text-noir flex items-center gap-2 text-lg font-extrabold">
              <Eye size={18} className="text-or" />
              Entonnoir par document
            </h2>
            <p className="text-gris mt-1 text-sm">
              Visites du parcours → paniers initiés → paiements confirmés.
            </p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gris border-or/15 border-b text-left text-xs uppercase tracking-wide">
                  <th className="px-5 py-2.5 sm:px-6">Document</th>
                  <th className="px-3 py-2.5 text-right">Visites</th>
                  <th className="px-3 py-2.5 text-right">Gratuits</th>
                  <th className="px-3 py-2.5 text-right">Paniers</th>
                  <th className="px-3 py-2.5 text-right">Payés</th>
                  <th className="px-3 py-2.5 text-right">Abandons</th>
                  <th className="px-5 py-2.5 text-right sm:px-6">CA</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => (
                  <tr key={l.slug} className="border-or/10 border-b last:border-0">
                    <td className="text-noir px-5 py-2.5 font-semibold sm:px-6">
                      {l.titre}
                      {l.gratuit && (
                        <span className="text-vert ml-2 text-xs font-bold">gratuit</span>
                      )}
                    </td>
                    <td className="text-gris px-3 py-2.5 text-right">{l.visites}</td>
                    <td className="text-gris px-3 py-2.5 text-right">
                      {l.gratuit ? l.gratuits : "—"}
                    </td>
                    <td className="text-gris px-3 py-2.5 text-right">
                      {l.gratuit ? "—" : l.checkouts}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold">
                      {l.gratuit ? "—" : l.paiements}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {l.gratuit ? (
                        "—"
                      ) : (
                        <span className={l.checkouts > l.paiements ? "text-orange font-bold" : "text-gris"}>
                          {Math.max(0, l.checkouts - l.paiements)}
                        </span>
                      )}
                    </td>
                    <td className="text-vert px-5 py-2.5 text-right font-bold sm:px-6">
                      {l.ca > 0 ? eur(l.ca) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Top pages + provenance ────────────────────────── */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="border-or/20 rounded-2xl border bg-white p-5 sm:p-6">
            <h2 className="font-display text-noir text-lg font-extrabold">Pages les plus vues</h2>
            {stats.top_pages.length === 0 ? (
              <p className="text-gris mt-3 text-sm">Pas encore de données.</p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {stats.top_pages.map((p) => (
                  <li key={p.path} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-noir truncate font-medium">{p.path}</span>
                    <span className="text-gris shrink-0">{p.n}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="border-or/20 rounded-2xl border bg-white p-5 sm:p-6">
            <h2 className="font-display text-noir text-lg font-extrabold">D&apos;où viennent les visiteurs</h2>
            <p className="text-gris mt-1 text-xs">
              « direct » = adresse tapée, favori ou application. Les pubs taguées
              utm_source (facebook, instagram, tiktok…) apparaissent ici.
            </p>
            {stats.sources.length === 0 ? (
              <p className="text-gris mt-3 text-sm">Pas encore de données.</p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {stats.sources.map((s) => (
                  <li key={s.source} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-noir truncate font-medium">{s.source}</span>
                    <span className="text-gris shrink-0">
                      {s.n} visiteur{s.n > 1 ? "s" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ── Réseaux sociaux ───────────────────────────────── */}
        <section className="border-or/20 mt-6 mb-10 rounded-2xl border bg-white p-5 sm:p-6">
          <h2 className="font-display text-noir text-lg font-extrabold">Réseaux sociaux</h2>
          <p className="text-gris mt-1 text-sm">
            Les statistiques des réseaux se consultent sur leurs tableaux de bord
            natifs (accès direct ci-dessous). Pour tout voir au même endroit,
            connectez vos comptes sur Metricool (gratuit).
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {RESEAUX.map((r) => (
              <a
                key={r.nom}
                href={r.href}
                target="_blank"
                rel="noreferrer"
                className="border-or/15 hover:border-or bg-creme/60 group flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors"
              >
                <span>
                  <span className="text-noir block text-sm font-bold">{r.nom}</span>
                  <span className="text-gris block text-xs">{r.detail}</span>
                </span>
                <ExternalLink size={15} className="text-gris group-hover:text-orange shrink-0" />
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Kpi({
  icone,
  label,
  valeur,
  note,
}: {
  icone: React.ReactNode;
  label: string;
  valeur: string;
  note: string;
}) {
  return (
    <div className="border-or/20 rounded-2xl border bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2">
        {icone}
        <span className="text-gris text-xs font-bold uppercase tracking-wide">{label}</span>
      </div>
      <div className="font-display text-noir mt-2 text-3xl font-extrabold">{valeur}</div>
      <div className="text-gris mt-0.5 text-xs">{note}</div>
    </div>
  );
}

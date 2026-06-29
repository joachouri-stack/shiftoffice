import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { GoogleLogin } from "@/components/auth/GoogleLogin";
import { EmailPasswordForm } from "@/components/auth/EmailPasswordForm";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Connexion — Shift Office",
};

// Toujours évalué au runtime : reflète la présence (ou non) des variables
// Supabase même si elles n'étaient pas définies au moment du build.
export const dynamic = "force-dynamic";

export default async function ConnexionPage() {
  const enabled = isSupabaseEnabled();
  const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
  if (enabled) {
    const user = await getUser();
    if (user) redirect("/compte");
  }

  return (
    <div className="bg-creme grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo theme="light" />
        </div>

        <div className="border-or/20 rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="font-display text-noir text-2xl font-extrabold tracking-tight">
            Connexion
          </h1>
          <p className="text-gris mt-2 text-sm">
            Connectez-vous pour retrouver vos documents et pré-remplir vos
            formulaires.
          </p>

          <div className="mt-6">
            {enabled ? (
              <>
                <EmailPasswordForm />
                {googleClientId && (
                  <>
                    <div className="my-5 flex items-center gap-3">
                      <span className="bg-or/20 h-px flex-1" />
                      <span className="text-gris text-xs font-semibold uppercase tracking-wider">
                        ou
                      </span>
                      <span className="bg-or/20 h-px flex-1" />
                    </div>
                    <GoogleLogin clientId={googleClientId} />
                  </>
                )}
              </>
            ) : (
              <div className="bg-or/10 text-or-d rounded-xl p-4 text-sm font-medium">
                La connexion sera disponible très prochainement. En attendant,
                tous les documents restent générables sans compte.
              </div>
            )}
          </div>

          <div className="text-gris mt-6 flex items-start gap-2 text-xs leading-relaxed">
            <ShieldCheck size={16} className="text-vert mt-0.5 shrink-0" />
            <span>
              Vos données sont protégées. Voir notre{" "}
              <Link href="/confidentialite" className="text-orange font-semibold">
                politique de confidentialité
              </Link>
              .
            </span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-gris hover:text-noir inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
          >
            <ArrowLeft size={16} />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

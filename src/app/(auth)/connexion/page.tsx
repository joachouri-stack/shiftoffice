"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCompanyProfile } from "@/lib/companyProfile";

export default function ConnexionPage() {
  const router = useRouter();
  const { profile } = useCompanyProfile();
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // V1 — branchement backend à venir. On simule la redirection :
    // onboarding tant qu'il n'est pas terminé, sinon tableau de bord.
    const dest = profile.onboardingComplete ? "/dashboard" : "/onboarding";
    setTimeout(() => router.push(dest), 600);
  }

  return (
    <Card className="p-7 sm:p-9">
      <div className="text-center">
        <h1 className="text-ink text-2xl font-semibold tracking-tight">
          Bon retour 👋
        </h1>
        <p className="text-muted mt-2 text-sm">
          Connectez-vous pour accéder à votre espace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <Input
          label="Adresse e-mail"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="vous@entreprise.fr"
          required
        />
        <Input
          label="Mot de passe"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />

        <div className="flex justify-end">
          <Link
            href="/connexion"
            className="text-brand hover:text-brand-600 text-sm font-medium"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </Button>
      </form>

      <p className="text-muted mt-7 text-center text-sm">
        Pas encore de compte ?{" "}
        <Link
          href="/inscription"
          className="text-brand hover:text-brand-600 font-medium"
        >
          Créer un compte
        </Link>
      </p>
    </Card>
  );
}

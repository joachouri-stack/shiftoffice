"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Connexion Google via « Google Identity Services » (jeton ID).
 * Google renvoie un ID token au navigateur ; Supabase le vérifie via
 * signInWithIdToken — AUCUN client secret nécessaire (contrairement au flux
 * OAuth par redirection). Nécessite que l'origine du site soit déclarée dans
 * « Authorized JavaScript origins » du client OAuth Google.
 */
export function GoogleLogin({ clientId }: { clientId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clientId) return;
    const supabase = createClient();

    async function handleCredential(response: { credential: string }) {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
      });
      if (error) {
        setError("La connexion Google a échoué. Réessayez.");
        return;
      }
      window.location.assign("/compte");
    }

    function init() {
      if (!window.google?.accounts?.id || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
        use_fedcm_for_prompt: true,
      });
      window.google.accounts.id.renderButton(ref.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "center",
        width: 300,
        locale: "fr",
      });
    }

    if (window.google?.accounts?.id) {
      init();
      return;
    }
    const existing = document.getElementById("gsi-client");
    if (existing) {
      existing.addEventListener("load", init);
      return;
    }
    const s = document.createElement("script");
    s.id = "gsi-client";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = init;
    document.body.appendChild(s);
  }, [clientId]);

  return (
    <div>
      <div ref={ref} className="flex justify-center" />
      {error && (
        <p className="mt-2 text-center text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

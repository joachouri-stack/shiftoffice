"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";

/**
 * « Mode rapide » : zone de saisie en langage naturel. Envoie le texte à
 * l'IA, qui extrait les champs et pré-remplit le formulaire via onFill.
 * Ne s'affiche que si l'IA est configurée (vérifié via /api/config).
 */
export function ModeRapide({
  type,
  onFill,
  placeholder,
}: {
  type: string;
  onFill: (valeurs: Record<string, string>) => void;
  placeholder?: string;
}) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [texte, setTexte] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/config")
      .then((r) => r.json())
      .then((c) => active && setEnabled(Boolean(c.ia)))
      .catch(() => active && setEnabled(false));
    return () => {
      active = false;
    };
  }, []);

  if (!enabled) return null;

  async function remplir() {
    if (loading || !texte.trim()) return;
    setLoading(true);
    setError("");
    setDone(false);
    try {
      const res = await fetch("/api/ia/extraire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, texte: texte.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.valeurs) {
        setError(data.error || "L'extraction a échoué.");
        return;
      }
      const valeurs = data.valeurs as Record<string, string>;
      if (Object.keys(valeurs).length === 0) {
        setError(
          "Aucune information détectée. Précisez votre description ou remplissez à la main."
        );
        return;
      }
      onFill(valeurs);
      setDone(true);
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-or/30 from-or/10 mb-6 rounded-2xl border bg-gradient-to-br to-transparent p-4 sm:p-5">
      <p className="text-noir flex items-center gap-2 text-sm font-bold">
        <Sparkles size={16} className="text-or-d" />
        Mode rapide — décrivez votre document
      </p>
      <p className="text-gris mt-1 text-xs">
        Écrivez en langage naturel, l&apos;IA remplit le formulaire pour vous.
        Vérifiez toujours avant de générer.
      </p>
      <textarea
        value={texte}
        onChange={(e) => {
          setTexte(e.target.value);
          if (error) setError("");
        }}
        rows={3}
        placeholder={
          placeholder ??
          "Ex. : Fiche de paie de Sophie Martin, assistante, 2200 € brut, juin 2026, entreprise Dupont Bâtiment à Lyon."
        }
        className="border-or/30 placeholder:text-gris/50 text-noir focus:border-or focus:ring-or/15 mt-3 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-4"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={remplir}
          disabled={loading || !texte.trim()}
          className="bg-noir inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Wand2 size={16} />
          )}
          Remplir avec l&apos;IA
        </button>
        {done && !error && (
          <span className="text-vert text-xs font-semibold">
            Formulaire pré-rempli — vérifiez les champs.
          </span>
        )}
      </div>
      {error && (
        <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}

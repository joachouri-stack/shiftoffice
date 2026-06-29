"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, Building2 } from "lucide-react";
import type { LocalEntreprise } from "@/lib/local/store";

type Result = LocalEntreprise & { codeNaf?: string };

const FIELD =
  "border-or/30 bg-white text-noir placeholder:text-gris/50 focus:border-or focus:ring-or/15 h-12 w-full rounded-lg border pl-10 pr-3.5 text-base outline-none transition-all focus:ring-4";

export function SiretSearch({ onSelect }: { onSelect: (e: Result) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      ctrl.current?.abort();
      ctrl.current = new AbortController();
      try {
        const r = await fetch(`/api/entreprises/search?q=${encodeURIComponent(q.trim())}`, {
          signal: ctrl.current.signal,
        });
        const data = (await r.json()) as Result[];
        setResults(data);
        setOpen(true);
      } catch {
        /* requête annulée / réseau : on ignore */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  return (
    <div className="relative">
      <div className="relative">
        <Search size={17} className="text-gris absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          className={FIELD}
          placeholder="Rechercher : nom de la société ou SIRET…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          autoComplete="off"
        />
        {loading && (
          <Loader2 size={16} className="text-or-d absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="border-or/20 absolute z-20 mt-1.5 max-h-72 w-full overflow-auto rounded-xl border bg-white py-1 shadow-lg">
          {results.map((r, idx) => (
            <li key={r.siret || idx}>
              <button
                type="button"
                onClick={() => {
                  onSelect(r);
                  setQ(r.nom);
                  setOpen(false);
                }}
                className="hover:bg-or/5 flex w-full items-start gap-3 px-3 py-2.5 text-left"
              >
                <span className="bg-or/15 text-or-d mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg">
                  <Building2 size={15} />
                </span>
                <span className="min-w-0">
                  <span className="text-noir block truncate text-sm font-semibold">{r.nom || "—"}</span>
                  <span className="text-gris block truncate text-xs">
                    {[r.siret ? `SIRET ${r.siret}` : null, [r.codePostal, r.ville].filter(Boolean).join(" ")]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && q.trim().length >= 3 && results.length === 0 && (
        <p className="text-gris mt-1.5 text-xs">
          Aucun résultat — vous pouvez saisir les informations à la main ci-dessous.
        </p>
      )}
    </div>
  );
}

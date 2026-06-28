"use client";

import { useEffect, useState } from "react";

/**
 * Badge « Remplissage par IA » du hero. Affiché uniquement si l'IA est
 * réellement active (clé configurée), vérifié via /api/config — pour ne
 * jamais promettre une fonctionnalité indisponible.
 */
export function AiBadge() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/config")
      .then((r) => r.json())
      .then((c) => active && setShow(Boolean(c.ia)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!show) return null;

  return (
    <span className="border-orange/30 bg-orange/10 text-orange inline-flex items-center gap-1.5 rounded-full border px-[16px] py-[7px] text-[0.7rem] font-bold uppercase tracking-[0.16em]">
      ✨ Boosté par l&apos;IA
    </span>
  );
}

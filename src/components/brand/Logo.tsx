import Link from "next/link";

/**
 * Logo Shift Office.
 *   Carré doré "S" + mot "Shift" (clair/sombre) + "Office" doré.
 */
export function Logo({
  theme = "dark",
  href = "/",
}: {
  /** "dark" = sur fond sombre (texte clair) · "light" = sur fond clair (texte sombre) */
  theme?: "dark" | "light";
  href?: string | null;
}) {
  const word = theme === "dark" ? "text-white" : "text-noir";
  const content = (
    <span className="inline-flex items-center gap-2.5">
      <span className="bg-or font-display text-noir grid h-8 w-8 place-items-center rounded-lg text-base font-extrabold">
        S
      </span>
      <span className={`font-display text-lg font-extrabold tracking-tight ${word}`}>
        Shift<span className="text-or">Office</span>
      </span>
    </span>
  );
  if (href === null) return content;
  return (
    <Link href={href} aria-label="Shift Office — Accueil" className="inline-flex">
      {content}
    </Link>
  );
}

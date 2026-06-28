import Link from "next/link";

/**
 * Wordmark « [Shift] Office » — membre de la famille de marques Shift.
 *   « [Shift] » : Inter ExtraBold orange, crochets en Inter Light.
 *   « Office »  : Fraunces Medium (serif), clair sur fond sombre / encre sur fond clair.
 */
export function Logo({
  theme = "dark",
  href = "/",
  size = 1,
}: {
  /** "dark" = sur fond sombre (Office en blanc) · "light" = sur fond clair (Office en encre) */
  theme?: "dark" | "light";
  href?: string | null;
  /** Facteur d'échelle (1 = taille de référence). */
  size?: number;
}) {
  const qualifierColor = theme === "dark" ? "#FFFFFF" : "#0A0A0F";

  const content = (
    <span
      className="inline-flex items-baseline whitespace-nowrap leading-none"
      style={{ fontFamily: "var(--font-inter), sans-serif", gap: "0.28em" }}
    >
      <span
        className="inline-flex items-baseline"
        style={{
          fontWeight: 800,
          fontSize: `${1.4 * size}rem`,
          letterSpacing: "-0.02em",
          color: "#FF6B2B",
        }}
      >
        <span style={{ fontWeight: 300, opacity: 0.9 }}>[</span>
        <span style={{ marginInline: "0.05em" }}>Shift</span>
        <span style={{ fontWeight: 300, opacity: 0.9 }}>]</span>
      </span>
      <span
        style={{
          fontFamily: "var(--font-fraunces), serif",
          fontSize: `${1.34 * size}rem`,
          fontWeight: 500,
          letterSpacing: "-0.005em",
          color: qualifierColor,
        }}
      >
        Office
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

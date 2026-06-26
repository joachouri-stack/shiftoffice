import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg" | "xl";

const SIZES: Record<LogoSize, string> = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-4xl sm:text-5xl",
};

type LogoProps = {
  /** "dark" = sombre fond → "Office" en blanc. "light" = fond clair → "Office" en noir. */
  theme?: "light" | "dark";
  size?: LogoSize;
  href?: string | null;
  className?: string;
  /** Decorative-only contexts can drop the link + aria label. */
  asText?: boolean;
};

/**
 * Logo officiel Shift Office.
 *   [ ]  → Inter Light 300, orange #FF6B2B
 *   Shift → Inter ExtraBold 800, letter-spacing -0.02em, orange #FF6B2B
 *   Office → Fraunces Medium 500, même taille que Shift,
 *            noir #0A0A0F (fond clair) / blanc #FFFFFF (fond sombre)
 * Ne jamais déformer.
 */
export function Logo({
  theme = "light",
  size = "md",
  href = "/",
  className,
  asText = false,
}: LogoProps) {
  const officeColor = theme === "dark" ? "text-paper" : "text-ink";

  const content = (
    <span
      className={cn(
        "inline-flex select-none items-baseline gap-[0.18em] whitespace-nowrap leading-none",
        SIZES[size],
        className
      )}
    >
      {/* Crochets — Inter Light 300, orange */}
      <span
        aria-hidden="true"
        className="text-brand font-sans font-light tracking-[0.05em]"
      >
        [&nbsp;]
      </span>
      {/* Shift — Inter ExtraBold 800, orange */}
      <span className="text-brand font-sans font-extrabold tracking-[-0.02em]">
        Shift
      </span>
      {/* Office — Fraunces Medium 500 */}
      <span className={cn("font-serif font-medium", officeColor)}>Office</span>
    </span>
  );

  if (asText || href === null) {
    return (
      <span aria-label="Shift Office" role="img">
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label="Shift Office — Accueil"
      className="inline-flex rounded-md transition-opacity hover:opacity-80"
    >
      {content}
    </Link>
  );
}

/** Marque compacte : juste les crochets oranges, pour favicons / avatars / espaces réduits. */
export function LogoMark({
  size = "md",
  className,
}: {
  size?: LogoSize;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "text-brand inline-flex select-none font-sans font-light leading-none tracking-[0.05em]",
        SIZES[size],
        className
      )}
    >
      [&nbsp;]
    </span>
  );
}

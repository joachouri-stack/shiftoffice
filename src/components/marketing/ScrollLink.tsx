"use client";

/**
 * Lien d'ancrage qui défile en douceur vers une section, sans ajouter de
 * #ancre dans l'URL (garde l'adresse propre, ex. shiftoffice.fr).
 */
export function ScrollLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  function onClick(e: React.MouseEvent) {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    document
      .getElementById(href.slice(1))
      ?.scrollIntoView({ behavior: "smooth" });
  }
  return (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  );
}

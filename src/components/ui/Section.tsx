import { cn } from "@/lib/utils";
import { Container } from "./Container";

type SectionProps = {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  size?: "narrow" | "default" | "wide";
  id?: string;
  /** Drop the inner Container (full-bleed content). */
  bleed?: boolean;
};

/** Bloc de page avec espacement vertical responsive cohérent. */
export function Section({
  children,
  className,
  containerClassName,
  size = "default",
  id,
  bleed = false,
}: SectionProps) {
  return (
    <section id={id} className={cn("py-16 sm:py-20 lg:py-28", className)}>
      {bleed ? (
        children
      ) : (
        <Container size={size} className={containerClassName}>
          {children}
        </Container>
      )}
    </section>
  );
}

/** En-tête de section centré : eyebrow + titre + sous-titre. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow && (
        <p className="text-brand mb-3 text-sm font-semibold tracking-tight">
          {eyebrow}
        </p>
      )}
      <h2 className="text-ink text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted mt-4 text-lg leading-relaxed text-pretty">
          {subtitle}
        </p>
      )}
    </div>
  );
}

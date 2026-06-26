import { cn } from "@/lib/utils";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  /** Lift on hover — for interactive cards. */
  interactive?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

/** Carte élégante : coins arrondis, hairline, ombre discrète. */
export function Card({
  children,
  className,
  interactive = false,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "border-line bg-paper rounded-2xl border shadow-[var(--shadow-card)]",
        interactive &&
          "transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-6 sm:p-7", className)}>{children}</div>;
}

import { cn } from "@/lib/utils";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  /** narrow ~720px · default ~1180px · wide ~1320px */
  size?: "narrow" | "default" | "wide";
  as?: React.ElementType;
};

const widths = {
  narrow: "max-w-[720px]",
  default: "max-w-[1180px]",
  wide: "max-w-[1320px]",
};

/** Conteneur centré, padding responsive cohérent. Empêche tout débordement horizontal. */
export function Container({
  children,
  className,
  size = "default",
  as: Tag = "div",
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-5 sm:px-6 lg:px-8",
        widths[size],
        className
      )}
    >
      {children}
    </Tag>
  );
}

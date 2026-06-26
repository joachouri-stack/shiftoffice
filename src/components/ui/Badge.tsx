import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "brand" | "neutral" | "outline" | "success";
};

const variants = {
  brand: "bg-brand-50 text-brand-700",
  neutral: "bg-mist text-muted",
  outline: "border border-line text-muted bg-paper",
  success: "bg-emerald-50 text-emerald-700",
};

/** Petite étiquette / pill. */
export function Badge({ children, className, variant = "brand" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-tight",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

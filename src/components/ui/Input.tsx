import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
};

export const Input = forwardRef<
  HTMLInputElement,
  FieldProps & React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ label, hint, error, className, id, ...rest }, ref) {
  const generated = useId();
  const inputId = id ?? generated;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-ink mb-1.5 block text-sm font-medium"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "border-line bg-paper text-ink placeholder:text-muted/70 h-11 w-full rounded-xl border px-4 text-[0.95rem]",
          "transition-all duration-200 outline-none",
          "focus:border-brand focus:ring-4 focus:ring-brand/10",
          error && "border-red-400 focus:border-red-400 focus:ring-red-100",
          className
        )}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      ) : hint ? (
        <p className="text-muted mt-1.5 text-xs">{hint}</p>
      ) : null}
    </div>
  );
});

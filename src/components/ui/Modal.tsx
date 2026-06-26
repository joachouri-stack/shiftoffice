"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Fenêtre modale centrée, responsive (plein écran en bas sur mobile). */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "bg-paper relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl shadow-[var(--shadow-pop)] sm:max-w-lg sm:rounded-3xl",
          className
        )}
      >
        <div className="border-line bg-paper/95 sticky top-0 flex items-center justify-between border-b px-6 py-4 backdrop-blur-xl">
          <h2 className="text-ink text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-muted hover:bg-mist hover:text-ink -mr-2 inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

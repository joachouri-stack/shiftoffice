"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Check, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; message: string; type: ToastType };

const ToastContext = createContext<(message: string, type?: ToastType) => void>(
  () => {}
);

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = {
  success: Check,
  error: X,
  info: Info,
} as const;

const ACCENTS = {
  success: "bg-emerald-50 text-emerald-600",
  error: "bg-red-50 text-red-500",
  info: "bg-brand-50 text-brand",
} as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++counter.current;
    setToasts((t) => [...t, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:items-end">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              className="animate-toast border-line bg-paper pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 shadow-[var(--shadow-pop)]"
            >
              <span
                className={cn(
                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                  ACCENTS[t.type]
                )}
              >
                <Icon size={17} strokeWidth={2.5} />
              </span>
              <p className="text-ink text-sm font-medium">{t.message}</p>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

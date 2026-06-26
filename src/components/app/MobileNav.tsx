"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { SidebarContent } from "./Sidebar";
import { cn } from "@/lib/utils";

/** Barre supérieure + tiroir — mobile / tablette uniquement. */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="border-line bg-paper/85 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 backdrop-blur-xl lg:hidden">
        <Logo size="sm" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          className="text-ink hover:bg-mist -mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "bg-paper fixed inset-y-0 left-0 z-50 w-[min(82vw,18rem)] shadow-[var(--shadow-pop)] transition-transform duration-300 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fermer le menu"
          className="text-ink hover:bg-mist absolute top-5 right-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors"
        >
          <X size={20} />
        </button>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </aside>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { MARKETING_NAV } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-line bg-paper/80 border-b backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <Container className="flex h-16 items-center justify-between sm:h-18">
        <Logo size="md" />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {MARKETING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted hover:text-ink hover:bg-mist rounded-full px-4 py-2 text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button href="/connexion" variant="ghost" size="sm">
            Connexion
          </Button>
          <Button href="/inscription" size="sm">
            Essayer gratuitement
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          className="text-ink hover:bg-mist -mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors md:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </Container>

      {/* Mobile menu */}
      <div
        className={cn(
          "bg-paper/95 fixed inset-x-0 top-16 z-40 origin-top backdrop-blur-xl transition-all duration-300 md:hidden",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        )}
        style={{ height: "calc(100dvh - 4rem)" }}
      >
        <Container className="flex h-full flex-col">
          <nav className="flex flex-col gap-1 py-6">
            {MARKETING_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-ink hover:bg-mist rounded-xl px-4 py-3.5 text-lg font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-3 pb-10">
            <Button
              href="/connexion"
              variant="outline"
              size="lg"
              onClick={() => setOpen(false)}
            >
              Connexion
            </Button>
            <Button
              href="/inscription"
              size="lg"
              onClick={() => setOpen(false)}
            >
              Essayer gratuitement
            </Button>
          </div>
        </Container>
      </div>
    </header>
  );
}

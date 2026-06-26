"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { APP_NAV, APP_NAV_SECONDARY, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        active
          ? "bg-ink text-paper shadow-[var(--shadow-soft)]"
          : "text-muted hover:bg-mist hover:text-ink"
      )}
    >
      <Icon
        size={19}
        className={cn(
          "shrink-0 transition-colors",
          active ? "text-paper" : "text-muted group-hover:text-ink"
        )}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

/** Contenu de la sidebar — partagé entre desktop (fixe) et mobile (drawer). */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-3 py-5">
        <Logo size="md" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {APP_NAV.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="border-line space-y-1 border-t px-3 py-4">
        {APP_NAV_SECONDARY.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
        <Link
          href="/"
          onClick={onNavigate}
          className="text-muted hover:bg-mist hover:text-ink flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
        >
          <LogOut size={19} className="shrink-0" />
          <span>Déconnexion</span>
        </Link>
      </div>
    </div>
  );
}

/** Sidebar fixe — desktop uniquement. */
export function DesktopSidebar() {
  return (
    <aside className="border-line bg-paper fixed inset-y-0 left-0 z-30 hidden w-64 border-r lg:block">
      <SidebarContent />
    </aside>
  );
}

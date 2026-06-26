"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut, Building2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { APP_NAV, APP_NAV_SECONDARY, type NavItem } from "@/lib/navigation";
import { useCompanyProfile } from "@/lib/companyProfile";
import { cn } from "@/lib/utils";

/** Carte entreprise : logo + nom du profil, repris automatiquement. */
function CompanyBadge() {
  const { profile } = useCompanyProfile();
  if (!profile.name && !profile.logo) return null;
  return (
    <Link
      href="/profil"
      className="border-line bg-mist/50 hover:bg-mist mx-3 mb-2 flex items-center gap-2.5 rounded-xl border px-2.5 py-2 transition-colors"
    >
      <span className="bg-paper border-line text-brand relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
        {profile.logo ? (
          <Image
            src={profile.logo}
            alt=""
            fill
            unoptimized
            className="object-contain"
          />
        ) : (
          <Building2 size={16} />
        )}
      </span>
      <span className="min-w-0">
        <span className="text-ink block truncate text-sm font-semibold">
          {profile.name || "Mon entreprise"}
        </span>
        {profile.trade && (
          <span className="text-muted block truncate text-xs">
            {profile.trade}
          </span>
        )}
      </span>
    </Link>
  );
}

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
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
        active
          ? "bg-mist text-ink"
          : "text-muted hover:bg-mist/60 hover:text-ink"
      )}
    >
      {/* Indicateur actif : barre orange animée */}
      <span
        className={cn(
          "bg-brand absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full transition-all duration-300",
          active ? "opacity-100" : "scale-y-0 opacity-0"
        )}
      />
      <Icon
        size={19}
        className={cn(
          "shrink-0 transition-colors duration-200",
          active ? "text-brand" : "text-muted group-hover:text-ink"
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

      <CompanyBadge />

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

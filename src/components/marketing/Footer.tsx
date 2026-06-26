import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { LEGAL_NAV, MARKETING_NAV } from "@/lib/navigation";

const PRODUCT_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Assistant IA", href: "/assistant" },
  { label: "Devis & Factures", href: "/devis-factures" },
  { label: "Coffre-fort", href: "/coffre-fort" },
];

export function Footer() {
  return (
    <footer className="border-line bg-mist/50 border-t">
      <Container className="py-14 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo size="md" />
            <p className="text-muted mt-4 max-w-xs text-sm leading-relaxed">
              L&apos;IA qui travaille pour votre entreprise. Pensée pour les
              artisans du bâtiment.
            </p>
          </div>

          <FooterCol title="Produit" links={PRODUCT_LINKS} />
          <FooterCol title="Découvrir" links={MARKETING_NAV} />
          <FooterCol title="Légal" links={LEGAL_NAV} />
        </div>

        <div className="border-line mt-12 flex flex-col items-start justify-between gap-4 border-t pt-8 sm:flex-row sm:items-center">
          <p className="text-muted text-sm">
            © {new Date().getFullYear()} Shift Office. Tous droits réservés.
          </p>
          <p className="text-muted text-sm">Fait avec soin en France 🇫🇷</p>
        </div>
      </Container>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-ink text-sm font-semibold">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-muted hover:text-ink text-sm transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

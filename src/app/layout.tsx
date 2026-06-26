import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const SITE = "https://shiftoffice.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Shift Office — L'IA qui travaille pour votre entreprise",
    template: "%s · Shift Office",
  },
  description:
    "Shift Office est l'assistant IA des artisans du bâtiment. Gagnez plusieurs heures par semaine : documents, devis & factures, coffre-fort. Simple, rapide, premium.",
  keywords: [
    "artisan",
    "bâtiment",
    "IA",
    "intelligence artificielle",
    "devis",
    "factures",
    "plombier",
    "électricien",
    "SaaS artisan",
  ],
  authors: [{ name: "Shift Office" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE,
    siteName: "Shift Office",
    title: "Shift Office — L'IA qui travaille pour votre entreprise",
    description:
      "L'assistant IA des artisans du bâtiment. Gagnez plusieurs heures par semaine.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shift Office — L'IA qui travaille pour votre entreprise",
    description:
      "L'assistant IA des artisans du bâtiment. Gagnez plusieurs heures par semaine.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="bg-paper text-ink min-h-full">{children}</body>
    </html>
  );
}

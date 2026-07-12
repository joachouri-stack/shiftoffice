import type { Metadata, Viewport } from "next";
import {
  Plus_Jakarta_Sans,
  DM_Sans,
  Inter,
  Instrument_Sans,
} from "next/font/google";
import "./globals.css";
import { SyncBoot } from "@/components/SyncBoot";
import { Track } from "@/components/analytics/Track";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Marque « [Shift] Office » — Inter (wordmark "[Shift]") + Playfair Display ("Office")
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "800"],
  display: "swap",
});

// Instrument Sans pour le mot « Office » du wordmark.
const officeFont = Instrument_Sans({
  variable: "--font-office",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const SITE_URL = "https://shiftoffice.fr";
const TITLE = "Shift Office — Vos documents légaux en 2 minutes";
const DESCRIPTION =
  "Fiches de paie, contrats, quittances, statuts… Générez vos documents RH et administratifs conformes 2026 en 2 minutes. Sans comptable, sans erreur, sans prise de tête.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s | Shift Office" },
  description: DESCRIPTION,
  applicationName: "Shift Office",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "Shift Office",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#1C1810",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${jakarta.variable} ${dmSans.variable} ${inter.variable} ${officeFont.variable} antialiased`}
    >
      <body className="bg-noir font-sans">
        <SyncBoot />
        <Track />
        {children}
      </body>
    </html>
  );
}

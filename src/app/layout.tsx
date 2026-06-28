import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, DM_Sans, Inter, Fraunces } from "next/font/google";
import "./globals.css";

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

// Marque « [Shift] Office » — Inter (wordmark "[Shift]") + Fraunces ("Office")
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "800"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shift Office — Vos documents légaux en 2 minutes",
  description:
    "Générez fiches de paie, contrats, quittances et statuts conformes à la législation française 2026. Sans comptable, sans erreur, sans prise de tête.",
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
      className={`${jakarta.variable} ${dmSans.variable} ${inter.variable} ${fraunces.variable} antialiased`}
    >
      <body className="bg-noir font-sans">{children}</body>
    </html>
  );
}

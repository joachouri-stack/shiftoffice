import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
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
      className={`${jakarta.variable} ${dmSans.variable} antialiased`}
    >
      <body className="bg-noir font-sans">{children}</body>
    </html>
  );
}

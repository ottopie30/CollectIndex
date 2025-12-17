import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Analytics } from "@/components/analytics/Analytics";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Altum Analytics | Intelligence d'Investissement Pokémon",
  description: "Plateforme d'analyse et de scoring pour investisseurs en cartes Pokémon. Détectez les spéculations, anticipez les corrections, optimisez votre portefeuille.",
  keywords: ["pokemon", "tcg", "investment", "analytics", "trading cards", "speculation", "prix cartes pokemon", "investissement pokemon"],
  authors: [{ name: "Altum Analytics" }],
  openGraph: {
    title: "Altum Analytics | Intelligence d'Investissement Pokémon",
    description: "Scoring 5D pour identifier les opportunités d'investissement vs spéculation",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Altum Analytics",
    description: "Investissez intelligemment dans les cartes Pokémon",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.variable} antialiased bg-gradient-animated min-h-screen`}>
        <Analytics />
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <Sidebar />

          {/* Main content */}
          <div className="flex-1 ml-64 flex flex-col">
            <Header />
            <main className="flex-1 p-6 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

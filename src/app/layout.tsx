import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';
import "./globals.css";
import { PaywallProvider } from '@/contexts/PaywallContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ImVestr – Immobilien-Renditerechner | Cashflow, DSCR & Mikrolage in Sekunden",
  description: "In Sekunden wissen, ob sich eine Immobilie lohnt. Immobilien-Renditerechner mit URL-Import, Foto-Analyse, Cashflow-Berechnung, Nettomietrendite, DSCR und bankfähigem PDF-Report. Mikrolage bewerten, Mietpreis und Quadratmeterpreis vergleichen.",
  keywords: [
    "immobilien renditerechner",
    "cashflow immobilie berechnen",
    "nettomietrendite",
    "eigenkapitalrendite",
    "dscr immobilie",
    "mietpreis vergleich",
    "quadratmeterpreis",
    "mikrolage bewerten",
    "immobilien analyse",
    "immobilienscout24 import",
    "immobilie bewertung",
    "investment immobilie",
  ],
  authors: [{ name: "ImVestr" }],
  creator: "ImVestr",
  publisher: "ImVestr",
  metadataBase: new URL('https://immovestr.de'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://immovestr.de",
    title: "ImVestr – Immobilien-Renditerechner | Cashflow, DSCR & Mikrolage",
    description: "In Sekunden wissen, ob sich eine Immobilie lohnt. URL-Import, Foto-Analyse, Cashflow-Berechnung, DSCR und bankfähiger PDF-Report.",
    siteName: "ImVestr",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ImVestr - Immobilien-Renditerechner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ImVestr – Immobilien-Renditerechner",
    description: "In Sekunden wissen, ob sich eine Immobilie lohnt. Cashflow, DSCR, Mikrolage-Analyse.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={deDE}>
      <PaywallProvider>
        <html lang="de">
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            {children}
          </body>
        </html>
      </PaywallProvider>
    </ClerkProvider>
  );
}
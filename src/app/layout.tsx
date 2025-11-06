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
  title: "KI-basierter Immobilien-Renditerechner | ImVestr – Lohnt sich diese Immobilie?",
  description: "Rendite & Cashflow berechnen, Szenarien testen, PDF exportieren. Mit KI-Import von ImmoScout24 & Immowelt. Cashflow, Nettomietrendite, EK-Rendite & DSCR automatisch berechnen. Mikrolage bewerten, Mietpreis und Quadratmeterpreis vergleichen.",
  keywords: [
    "immobilien renditerechner",
    "ki immobilien analyse",
    "cashflow immobilie berechnen",
    "nettomietrendite rechner",
    "eigenkapitalrendite immobilie",
    "dscr rechner",
    "mietpreis vergleich",
    "quadratmeterpreis analyse",
    "mikrolage bewertung",
    "immobilienscout24 import",
    "immobilie bewertung tool",
    "investment immobilie rechner",
    "rendite rechner immobilie",
    "immobilien roi rechner",
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
    title: "KI-basierter Immobilien-Renditerechner | ImVestr",
    description: "Rendite & Cashflow berechnen, Szenarien testen, PDF exportieren. Mit KI-Import von ImmoScout24 & Immowelt. Cashflow, Nettomietrendite, EK-Rendite & DSCR automatisch berechnen.",
    siteName: "ImVestr",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ImVestr - KI-basierter Immobilien-Renditerechner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KI-basierter Immobilien-Renditerechner | ImVestr",
    description: "Rendite & Cashflow berechnen, Szenarien testen, PDF exportieren. Cashflow, Nettomietrendite, EK-Rendite & DSCR automatisch berechnen.",
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
  verification: {
    google: 'your-google-site-verification-code', // TODO: Replace with actual verification code from Google Search Console
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
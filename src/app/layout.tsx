import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from '@/components/Providers';

const inter = Inter({
  variable: "--font-inter",
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
        url: "/og-image.png",
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
    images: ["/og-image.png"],
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
    google: 'way_YghTPVpoX2sEDvnTsI2KKH1EcXkObmCNTYLMicg', // TODO: Replace with actual verification code from Google Search Console
  },
  themeColor: '#264171',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ImVestr',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
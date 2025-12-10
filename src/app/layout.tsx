import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GoogleTagManager } from '@/components/GoogleTagManager';
import { PaywallProvider } from '@/contexts/PaywallContext';
import { Toaster } from 'sonner';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: '#264171',
};

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
  metadataBase: new URL('https://imvestr.de'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://imvestr.de",
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
    google: 'UBVnkHXPp98wEw176mPlhACJs8t5v3XkDL1MtyR1E9w',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ImVestr',
  },
  manifest: '/manifest.json',
};

/**
 * Root Layout - NO CLERK!
 *
 * This root layout intentionally does NOT include ClerkProvider to prevent
 * Clerk's external scripts from loading on public pages.
 *
 * ClerkProvider is only added in the (auth) route group for authenticated pages.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning className="overflow-x-hidden">
      <body
        className={`${inter.variable} font-sans antialiased overflow-x-hidden`}
        suppressHydrationWarning
      >
        <GoogleTagManager />
        {/* NO ClerkProvider here - only PaywallProvider and Toaster */}
        <PaywallProvider>
          {children}
          <Toaster position="top-center" richColors />
        </PaywallProvider>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from '@/components/Providers';
import { GoogleTagManager } from '@/components/GoogleTagManager';
import CookieBanner from '@/components/CookieBanner';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "imvestr: KI-Immobilien-Renditerechner | Cashflow & Analyse",
  description: "Immobilien-Rendite in Sekunden berechnen: Cashflow, Nettomietrendite, EK-Rendite & DSCR. KI-Import von ImmoScout24. Jetzt kostenlos starten!",
  authors: [{ name: "imvestr" }],
  creator: "imvestr",
  publisher: "imvestr",
  metadataBase: new URL('https://immovestr.de'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://immovestr.de",
    title: "imvestr: KI-Immobilien-Renditerechner | Cashflow & Analyse",
    description: "Immobilien-Rendite in Sekunden berechnen: Cashflow, Nettomietrendite, EK-Rendite & DSCR. KI-Import von ImmoScout24. Jetzt kostenlos starten!",
    siteName: "imvestr",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "imvestr - KI-basierter Immobilien-Renditerechner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "imvestr: KI-Immobilien-Renditerechner | Cashflow & Analyse",
    description: "Immobilien-Rendite in Sekunden berechnen: Cashflow, Nettomietrendite, EK-Rendite & DSCR. KI-Import von ImmoScout24.",
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
    title: 'imvestr',
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
        <GoogleTagManager />
        <Providers>
          {children}
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}
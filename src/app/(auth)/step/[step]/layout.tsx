import type { Metadata } from 'next'
import { appSeiteMetadata, SCHRITT_TITEL } from '@/lib/seitenMetadata'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ step: string }>
}

// Eingabeschritte und Ergebnis: eigener Titel je Schritt, nicht im Index (persönliche Eingaben, kein Suchinhalt)
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { step } = await params
  return appSeiteMetadata(SCHRITT_TITEL[step] ?? 'Analyse')
}

export default function StepLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

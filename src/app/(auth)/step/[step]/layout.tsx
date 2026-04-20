import type { Metadata } from 'next'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ step: string }>
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { step } = await params
  if (step === 'tabs') {
    return {
      robots: { index: false, follow: false },
    }
  }
  return {}
}

export default function StepLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}


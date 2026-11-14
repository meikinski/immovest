import { appSeiteMetadata } from '@/lib/seitenMetadata';

export const metadata = appSeiteMetadata('Hilfe & Fragen');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

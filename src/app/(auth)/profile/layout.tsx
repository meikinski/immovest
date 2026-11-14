import { appSeiteMetadata } from '@/lib/seitenMetadata';

export const metadata = appSeiteMetadata('Profil & Einstellungen');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

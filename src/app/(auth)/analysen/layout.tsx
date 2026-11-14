import { appSeiteMetadata } from '@/lib/seitenMetadata';

export const metadata = appSeiteMetadata('Meine Analysen');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

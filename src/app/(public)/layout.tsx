import { SmartClerkProvider } from '@/components/SmartClerkProvider';

/**
 * Public Layout - Smart Clerk Loading
 *
 * Uses SmartClerkProvider which:
 * - Bots (Google, Bing, etc.): NO Clerk → Clean indexing ✅
 * - Real users: Full Clerk → Profile button when logged in ✅
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SmartClerkProvider>{children}</SmartClerkProvider>;
}

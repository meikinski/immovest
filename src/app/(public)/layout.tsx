import { SmartClerkProvider } from '@/components/SmartClerkProvider';

/**
 * Public Layout - Smart Clerk Loading
 *
 * Uses SmartClerkProvider which:
 * - Detects bots via cookie (set by middleware)
 * - Bots (Google, Bing, etc.): No Clerk → Clean indexing ✅
 * - Real users: Full Clerk → Profile button when logged in ✅
 *
 * This is the professional solution used by large websites.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SmartClerkProvider>{children}</SmartClerkProvider>;
}

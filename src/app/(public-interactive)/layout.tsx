import { InteractiveClerkProvider } from './InteractiveClerkProvider';

/**
 * Layout for interactive public pages (/ and /input-method)
 *
 * Uses InteractiveClerkProvider which loads Clerk after hydration:
 * - SSR: No Clerk (Google sees clean HTML)
 * - After hydration: Clerk loads (users see auth state)
 *
 * This provides better UX than static public pages while still being indexable.
 */
export default function PublicInteractiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <InteractiveClerkProvider>{children}</InteractiveClerkProvider>;
}

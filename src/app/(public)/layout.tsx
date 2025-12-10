/**
 * Public Layout - Pass-through
 *
 * This layout just passes through to children.
 * The root layout already provides the HTML structure and PaywallProvider.
 * This route group ensures NO ClerkProvider is used for public pages.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

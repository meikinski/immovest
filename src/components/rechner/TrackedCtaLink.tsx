'use client';

import Link from 'next/link';
import { AnalyticsEvents, trackEvent } from '@/lib/analytics';

/** Link mit cta_clicked-Event (cta_location unterscheidet die Seiten in GA4) */
export function TrackedCtaLink({
  href,
  ctaName,
  ctaLocation,
  className,
  children,
}: {
  href: string;
  ctaName: string;
  ctaLocation: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackEvent(AnalyticsEvents.CTA_CLICKED, { cta_name: ctaName, cta_location: ctaLocation })}
    >
      {children}
    </Link>
  );
}

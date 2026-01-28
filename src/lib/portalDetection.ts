/**
 * Portal Detection and Validation System
 *
 * PROBLEM SOLVED:
 * Previously, the URL import would silently fail or show generic errors when users
 * entered URLs from unsupported portals (e.g., wohnglueck.de). This created:
 * 1. False positives in analytics (no clear failed status)
 * 2. Poor UX (users didn't know WHY it failed)
 * 3. No guidance on which portals work best
 *
 * SOLUTION:
 * This module provides:
 * - Portal detection from any URL
 * - Reliability ratings (high/medium/unknown)
 * - User-facing warnings for unknown/experimental portals
 * - Better error messages that guide users to alternatives
 *
 * HOW IT WORKS:
 * 1. User enters URL → detectPortal() identifies the portal
 * 2. API adds portal-specific warnings BEFORE attempting scraping
 * 3. If scraping fails, error message explains WHY and suggests alternatives
 * 4. Frontend shows warnings clearly so users know what to expect
 *
 * SUPPORTED PORTALS:
 * - ImmobilienScout24 (high reliability)
 * - Immowelt (high reliability)
 * - eBay Kleinanzeigen (high reliability)
 * - Immonet (medium - experimental)
 * - Austrian portals (medium - different data format)
 *
 * UNKNOWN PORTALS:
 * - Still attempt to scrape (AI is flexible)
 * - Show clear warning about uncertainty
 * - Suggest screenshot alternative
 * - Provide enhanced error messages on failure
 */

export type PortalInfo = {
  name: string;
  domain: string;
  supported: boolean;
  reliability: 'high' | 'medium' | 'low' | 'unknown';
  warning?: string;
};

const KNOWN_PORTALS: Record<string, PortalInfo> = {
  'immobilienscout24.de': {
    name: 'ImmobilienScout24',
    domain: 'immobilienscout24.de',
    supported: false, // Temporarily disabled due to aggressive blocking
    reliability: 'low',
    warning: 'ImmobilienScout24 blockiert aktuell automatische Zugriffe. Nutze stattdessen Immowelt oder eBay Kleinanzeigen.',
  },
  'immowelt.de': {
    name: 'Immowelt',
    domain: 'immowelt.de',
    supported: true,
    reliability: 'high',
  },
  'kleinanzeigen.de': {
    name: 'eBay Kleinanzeigen',
    domain: 'kleinanzeigen.de',
    supported: true,
    reliability: 'high',
  },
  'ebay-kleinanzeigen.de': {
    name: 'eBay Kleinanzeigen (alte Domain)',
    domain: 'ebay-kleinanzeigen.de',
    supported: true,
    reliability: 'high',
  },
  'immonet.de': {
    name: 'Immonet',
    domain: 'immonet.de',
    supported: true,
    reliability: 'medium',
    warning: 'Portal wird experimentell unterstützt. Bitte Daten manuell überprüfen.',
  },
  'immobilienscout.at': {
    name: 'ImmobilienScout24 Österreich',
    domain: 'immobilienscout.at',
    supported: true,
    reliability: 'medium',
    warning: 'Österreichisches Portal - Datenformat kann abweichen.',
  },
  'willhaben.at': {
    name: 'Willhaben',
    domain: 'willhaben.at',
    supported: true,
    reliability: 'medium',
    warning: 'Österreichisches Portal - Datenformat kann abweichen.',
  },
};

/**
 * Detects portal from URL
 */
export function detectPortal(url: string): PortalInfo {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Check exact matches first
    for (const [domain, info] of Object.entries(KNOWN_PORTALS)) {
      if (hostname === domain || hostname === `www.${domain}` || hostname === `m.${domain}`) {
        return info;
      }
    }

    // Check partial matches (e.g., subdomain.immobilienscout24.de)
    for (const [domain, info] of Object.entries(KNOWN_PORTALS)) {
      if (hostname.includes(domain)) {
        return info;
      }
    }

    // Unknown portal
    return {
      name: hostname,
      domain: hostname,
      supported: false,
      reliability: 'unknown',
      warning: `⚠️ UNBEKANNTES PORTAL: ${hostname} ist nicht in unserer Liste bekannter Immobilienportale. Die KI wird versuchen, Daten zu extrahieren, aber die Erfolgsrate ist ungewiss. Bitte überprüfe alle Werte manuell sehr sorgfältig!`,
    };
  } catch {
    // Invalid URL
    return {
      name: 'Ungültige URL',
      domain: '',
      supported: false,
      reliability: 'unknown',
      warning: 'Die eingegebene URL ist ungültig.',
    };
  }
}

/**
 * Validates if URL looks like a real estate listing
 */
export function isLikelyRealEstateListing(url: string): boolean {
  const lowerUrl = url.toLowerCase();

  // Common patterns in real estate URLs
  const patterns = [
    /expose/i,
    /immobilie/i,
    /property/i,
    /objekt/i,
    /anzeige/i,
    /inserat/i,
    /wohnung/i,
    /haus/i,
    /\d{6,}/,  // Usually contains a listing ID (6+ digits)
  ];

  return patterns.some(pattern => pattern.test(lowerUrl));
}

/**
 * Gets a user-friendly portal name for display
 */
export function getPortalDisplayName(url: string): string {
  const portal = detectPortal(url);
  return portal.name;
}

/**
 * Checks if a portal is known and supported
 */
export function isKnownPortal(url: string): boolean {
  const portal = detectPortal(url);
  return portal.supported;
}

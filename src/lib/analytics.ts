/**
 * Analytics Utilities
 *
 * AI-Agent Ready: All events are pushed to GTM dataLayer for easy extraction
 * Use these functions throughout your app to track user behavior
 */

// Extend Window type to include dataLayer
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

/**
 * Track custom events to Google Tag Manager
 * AI-Agent can query these events via GA4 Data API
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, unknown>
) => {
  if (typeof window === 'undefined') return;

  // Initialize dataLayer if not exists
  window.dataLayer = window.dataLayer || [];

  // Push event to dataLayer
  const eventData = {
    event: eventName,
    timestamp: new Date().toISOString(),
    ...eventParams,
  };

  window.dataLayer.push(eventData);

  // Console log for debugging
  console.log('📊 Analytics Event pushed to dataLayer:', eventName, eventData);
  console.log('📊 Current dataLayer:', window.dataLayer);
};

/**
 * Pre-defined events for ImVestr SaaS
 * These align with key conversion points
 */
export const AnalyticsEvents = {
  // User Journey
  PAGE_VIEW: 'page_view',

  // Input Method Selection
  INPUT_METHOD_SELECTED: 'input_method_selected',

  // AI Import
  AI_IMPORT_STARTED: 'ai_import_started',
  AI_IMPORT_COMPLETED: 'ai_import_completed',
  AI_IMPORT_FAILED: 'ai_import_failed',

  // Manual Input
  MANUAL_INPUT_STARTED: 'manual_input_started',
  MANUAL_INPUT_STEP_COMPLETED: 'manual_input_step_completed',

  // Analysis
  ANALYSIS_STARTED: 'analysis_started',
  ANALYSIS_COMPLETED: 'analysis_completed',
  SCENARIO_CREATED: 'scenario_created',

  // Conversions
  SIGNUP_INITIATED: 'signup_initiated',
  SIGNUP_COMPLETED: 'signup_completed',
  ADS_CONVERSION_SIGNUP: 'ads_conversion_signup', // Google Ads Conversion Event
  PRICING_PAGE_VIEWED: 'pricing_page_viewed',
  UPGRADE_CLICKED: 'upgrade_clicked',
  CHECKOUT_STARTED: 'checkout_started',
  PURCHASE_COMPLETED: 'purchase',

  // Feature Usage
  PDF_DOWNLOAD_CLICKED: 'pdf_download_clicked',
  SHARE_CLICKED: 'share_clicked',

  // Engagement
  CTA_CLICKED: 'cta_clicked',
  VIDEO_PLAYED: 'video_played',
  FAQ_OPENED: 'faq_opened',
} as const;

/**
 * Track page views
 */
export const trackPageView = (url: string, title?: string) => {
  trackEvent(AnalyticsEvents.PAGE_VIEW, {
    page_location: url,
    page_title: title || document.title,
  });
};

/**
 * Track conversions (purchases, signups)
 */
export const trackConversion = (
  conversionType: string,
  value?: number,
  currency: string = 'EUR'
) => {
  trackEvent(conversionType, {
    value,
    currency,
  });
};

/**
 * Track user properties (for AI segmentation)
 */
export const setUserProperties = (properties: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'set_user_properties',
    user_properties: properties,
  });
};

/**
 * Subscription Plan IDs
 */
export type SubscriptionPlanId = 'premium_monthly' | 'premium_yearly';

/**
 * E-commerce tracking for premium purchases (deprecated - use trackSubscriptionPurchase)
 * @deprecated Use trackSubscriptionPurchase instead for better subscription tracking
 */
export const trackPurchase = (
  transactionId: string,
  value: number,
  items: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>
) => {
  trackEvent(AnalyticsEvents.PURCHASE_COMPLETED, {
    transaction_id: transactionId,
    value,
    currency: 'EUR',
    items,
  });
};

/**
 * Track subscription purchase with detailed plan information
 * This provides better insights in Google Analytics for subscription analysis
 */
export const trackSubscriptionPurchase = (
  planId: SubscriptionPlanId,
  transactionId: string,
  value: number
) => {
  const isYearly = planId === 'premium_yearly';

  const itemName =
    planId === 'premium_yearly'
      ? 'Imvestr Premium – Jahresabo'
      : 'Imvestr Premium – Monatsabo';

  const interval = isYearly ? 'year' : 'month';

  trackEvent(AnalyticsEvents.PURCHASE_COMPLETED, {
    transaction_id: transactionId,
    value,
    currency: 'EUR',
    subscription_plan_id: planId,
    subscription_interval: interval,
    items: [
      {
        item_id: planId,     // 'premium_monthly' or 'premium_yearly'
        item_name: itemName, // Clear display name
        price: value,
        quantity: 1,
      },
    ],
  });
};

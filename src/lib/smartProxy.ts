/**
 * Smart Proxy Service for bypassing anti-bot protection
 *
 * STRATEGIES:
 * 1. Direct fetch with realistic headers
 * 2. Playwright with stealth mode
 * 3. Request with delays and cookies
 * 4. Rotating user agents
 *
 * This service tries multiple strategies to bypass ImmobilienScout24 blocking
 */

import { scrapeWithBrowser } from './browserScraper';

export type ProxyResult = {
  html: string;
  success: boolean;
  error?: string;
  method: 'direct' | 'playwright' | 'delayed' | 'stealth';
  statusCode?: number;
};

/**
 * User agents to rotate through
 */
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
];

/**
 * Get random user agent
 */
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Realistic headers for browser requests
 */
function getRealisticHeaders(userAgent: string, referer?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'max-age=0',
    'Sec-Ch-Ua': '"Chromium";v="131", "Not_A Brand";v="24", "Google Chrome";v="131"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'DNT': '1',
  };

  if (referer) {
    headers['Referer'] = referer;
  }

  return headers;
}

/**
 * Strategy 1: Direct fetch with realistic headers
 */
async function tryDirectFetch(url: string): Promise<ProxyResult> {
  try {
    console.log('[Proxy] Strategy 1: Direct fetch with realistic headers');

    const userAgent = getRandomUserAgent();
    const headers = getRealisticHeaders(userAgent);

    const response = await fetch(url, {
      headers,
      redirect: 'follow',
    });

    const html = await response.text();

    if (response.status === 403) {
      throw new Error('403 Forbidden');
    }

    if (html.length < 1000) {
      throw new Error('Response too short - likely blocked');
    }

    console.log('[Proxy] ✅ Direct fetch succeeded');
    return {
      html,
      success: true,
      method: 'direct',
      statusCode: response.status,
    };
  } catch (error) {
    console.log('[Proxy] ❌ Direct fetch failed:', (error as Error).message);
    return {
      html: '',
      success: false,
      error: (error as Error).message,
      method: 'direct',
    };
  }
}

/**
 * Strategy 2: Delayed request with cookies (simulate human behavior)
 */
async function tryDelayedFetch(url: string): Promise<ProxyResult> {
  try {
    console.log('[Proxy] Strategy 2: Delayed fetch with cookie simulation');

    // Simulate human delay (500ms - 1500ms)
    const delay = 500 + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    const userAgent = getRandomUserAgent();

    // First visit the homepage to get cookies
    const homeUrl = new URL(url).origin;
    console.log('[Proxy] Pre-fetching homepage for cookies:', homeUrl);

    await fetch(homeUrl, {
      headers: getRealisticHeaders(userAgent),
    });

    // Wait a bit (simulate human browsing)
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    // Now fetch the actual page with referer
    const response = await fetch(url, {
      headers: getRealisticHeaders(userAgent, homeUrl),
      redirect: 'follow',
    });

    const html = await response.text();

    if (response.status === 403) {
      throw new Error('403 Forbidden');
    }

    if (html.length < 1000) {
      throw new Error('Response too short - likely blocked');
    }

    console.log('[Proxy] ✅ Delayed fetch succeeded');
    return {
      html,
      success: true,
      method: 'delayed',
      statusCode: response.status,
    };
  } catch (error) {
    console.log('[Proxy] ❌ Delayed fetch failed:', (error as Error).message);
    return {
      html: '',
      success: false,
      error: (error as Error).message,
      method: 'delayed',
    };
  }
}

/**
 * Strategy 3: Playwright with enhanced stealth
 */
async function tryPlaywrightFetch(url: string): Promise<ProxyResult> {
  try {
    console.log('[Proxy] Strategy 3: Playwright with stealth mode');

    const result = await scrapeWithBrowser(url);

    if (!result.success || !result.html) {
      throw new Error(result.error || 'Playwright failed');
    }

    console.log('[Proxy] ✅ Playwright succeeded');
    return {
      html: result.html,
      success: true,
      method: 'playwright',
      statusCode: result.statusCode,
    };
  } catch (error) {
    console.log('[Proxy] ❌ Playwright failed:', (error as Error).message);
    return {
      html: '',
      success: false,
      error: (error as Error).message,
      method: 'playwright',
    };
  }
}

/**
 * Main proxy service - tries multiple strategies
 */
export async function smartProxyFetch(url: string): Promise<ProxyResult> {
  console.log('[Proxy] Starting smart proxy fetch for:', url);

  // Strategy 1: Direct fetch (fastest)
  let result = await tryDirectFetch(url);
  if (result.success) return result;

  console.log('[Proxy] Strategy 1 failed, trying strategy 2...');

  // Strategy 2: Delayed fetch with cookies (simulates human)
  result = await tryDelayedFetch(url);
  if (result.success) return result;

  console.log('[Proxy] Strategy 2 failed, trying strategy 3...');

  // Strategy 3: Playwright (most robust, slowest)
  result = await tryPlaywrightFetch(url);
  if (result.success) return result;

  console.log('[Proxy] ❌ All strategies failed');

  // All strategies failed
  return {
    html: '',
    success: false,
    error: 'All proxy strategies failed - site may have very strong anti-bot protection',
    method: 'stealth',
  };
}

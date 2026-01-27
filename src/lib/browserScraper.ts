/**
 * Browser-based Scraper using Playwright
 *
 * PURPOSE:
 * This is a fallback scraper for when the AI webSearchTool fails.
 * It uses Playwright to render JavaScript and bypass anti-bot protections.
 *
 * WHEN TO USE:
 * - Unknown portals (not in our supported list)
 * - Portals with heavy JavaScript rendering
 * - Portals with anti-bot protection (CloudFlare, etc.)
 *
 * HOW IT WORKS:
 * 1. Launch headless Chromium browser
 * 2. Navigate to URL with real browser headers
 * 3. Wait for page to load completely (including JavaScript)
 * 4. Extract full HTML content
 * 5. Close browser
 *
 * TRADE-OFFS:
 * ✅ Can render JavaScript
 * ✅ Bypasses many anti-bot systems
 * ✅ Works with unknown portals
 * ❌ Slower (2-5 seconds vs 0.5 seconds)
 * ❌ More resource-intensive
 */

import { chromium, Browser, Page } from 'playwright';

export type BrowserScraperResult = {
  html: string;
  success: boolean;
  error?: string;
  url: string;
  statusCode?: number;
};

/**
 * Scrapes a URL using Playwright browser automation
 */
export async function scrapeWithBrowser(url: string): Promise<BrowserScraperResult> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    console.log('[Browser Scraper] Launching headless browser...');

    // Launch browser with anti-detection settings
    browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    // Create page with realistic viewport
    page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    console.log(`[Browser Scraper] Navigating to: ${url}`);

    // Navigate with timeout
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded', // Wait for DOM to load (not full load - faster)
      timeout: 15000, // 15 second timeout
    });

    const statusCode = response?.status() || 0;
    console.log(`[Browser Scraper] Page loaded with status: ${statusCode}`);

    if (statusCode >= 400) {
      throw new Error(`HTTP ${statusCode}: Page returned error status`);
    }

    // Wait a bit for JavaScript to execute (dynamic content)
    await page.waitForTimeout(1500);

    // Extract HTML content
    const html = await page.content();

    console.log(`[Browser Scraper] ✅ Success - extracted ${html.length} characters`);

    return {
      html,
      success: true,
      url,
      statusCode,
    };

  } catch (err) {
    const error = err as Error;
    console.error('[Browser Scraper] ❌ Failed:', error.message);

    return {
      html: '',
      success: false,
      error: error.message,
      url,
    };
  } finally {
    // Always clean up resources
    try {
      if (page) await page.close();
      if (browser) await browser.close();
      console.log('[Browser Scraper] Browser closed');
    } catch (cleanupErr) {
      console.error('[Browser Scraper] Cleanup error:', cleanupErr);
    }
  }
}

/**
 * Checks if browser scraping is available
 * (Playwright might not be installed in all environments)
 *
 * NOTE: This is a lightweight check that doesn't actually launch a browser.
 * If Playwright is installed but browsers aren't downloaded, the actual
 * scraping attempt will fail with a clear error message.
 */
export async function isBrowserScrapingAvailable(): Promise<boolean> {
  try {
    // Just check if the chromium module can be accessed
    // Don't actually launch a browser (too slow and might fail in dev)
    const hasChromium = chromium !== undefined;
    return hasChromium;
  } catch {
    console.warn('[Browser Scraper] Playwright not available - browser scraping disabled');
    return false;
  }
}

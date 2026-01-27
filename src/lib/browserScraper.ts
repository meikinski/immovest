/**
 * Browser-based Scraper using Playwright with Stealth Mode
 *
 * PURPOSE:
 * This is a fallback scraper for when the AI webSearchTool fails.
 * Uses Playwright with stealth plugin to bypass aggressive anti-bot detection.
 *
 * STEALTH FEATURES:
 * - Hides webdriver property
 * - Mocks Chrome runtime
 * - Randomizes browser fingerprint
 * - Bypasses common bot detection (Cloudflare, DataDome, etc.)
 */

import { chromium } from 'playwright-extra';
import stealth from 'playwright-extra-plugin-stealth';

// Add stealth plugin (with type assertion to satisfy TypeScript)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
chromium.use(stealth() as any);

export type BrowserScraperResult = {
  html: string;
  success: boolean;
  error?: string;
  url: string;
  statusCode?: number;
};

/**
 * Scrapes a URL using Playwright with stealth mode
 */
export async function scrapeWithBrowser(url: string): Promise<BrowserScraperResult> {
  let browser = null;
  let page = null;

  try {
    console.log('[Browser Scraper] Launching stealth browser...');

    // Launch browser with stealth mode
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    // Create page with realistic settings
    page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    });

    console.log(`[Browser Scraper] Navigating to: ${url}`);

    // Navigate with timeout
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 20000, // 20 second timeout
    });

    const statusCode = response?.status() || 0;
    console.log(`[Browser Scraper] Page loaded with status: ${statusCode}`);

    if (statusCode >= 400) {
      throw new Error(`HTTP ${statusCode}: Page returned error status`);
    }

    // Wait for content to render
    await page.waitForTimeout(2000);

    // Extract HTML
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
    // Cleanup
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
 */
export async function isBrowserScrapingAvailable(): Promise<boolean> {
  try {
    const hasChromium = chromium !== undefined;
    return hasChromium;
  } catch {
    console.warn('[Browser Scraper] Playwright not available');
    return false;
  }
}

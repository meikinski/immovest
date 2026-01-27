/**
 * Browser-based Scraper using Playwright with enhanced anti-detection
 *
 * PURPOSE:
 * Fallback scraper when webSearchTool fails.
 * Uses aggressive anti-detection measures to bypass bot detection.
 */

import { chromium } from 'playwright';

export type BrowserScraperResult = {
  html: string;
  success: boolean;
  error?: string;
  url: string;
  statusCode?: number;
};

/**
 * Scrapes a URL using Playwright with aggressive anti-detection
 */
export async function scrapeWithBrowser(url: string): Promise<BrowserScraperResult> {
  let browser = null;
  let page = null;

  try {
    console.log('[Browser Scraper] Launching stealth browser...');

    // Launch with anti-detection args
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      locale: 'de-DE',
      timezoneId: 'Europe/Berlin',
    });

    page = await context.newPage();

    // Aggressive anti-detection scripts
    await page.addInitScript(() => {
      // Hide webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });

      // Mock permissions
      const originalQuery = window.navigator.permissions.query;
      // @ts-ignore
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['de-DE', 'de', 'en-US', 'en'],
      });
    });

    console.log(`[Browser Scraper] Navigating to: ${url}`);

    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    const statusCode = response?.status() || 0;
    console.log(`[Browser Scraper] Page loaded with status: ${statusCode}`);

    if (statusCode >= 400) {
      throw new Error(`HTTP ${statusCode}: Page returned error status`);
    }

    // Wait for content
    await page.waitForTimeout(2000);

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
    try {
      if (page) await page.close();
      if (browser) await browser.close();
      console.log('[Browser Scraper] Browser closed');
    } catch (cleanupErr) {
      console.error('[Browser Scraper] Cleanup error:', cleanupErr);
    }
  }
}

export async function isBrowserScrapingAvailable(): Promise<boolean> {
  try {
    return chromium !== undefined;
  } catch {
    console.warn('[Browser Scraper] Playwright not available');
    return false;
  }
}

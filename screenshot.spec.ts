import { test, expect } from '@playwright/test';

test('take screenshot of the landing page', async ({ page }) => {
  await page.goto('http://localhost:3006/');
  await page.screenshot({ path: 'public/screenshot.png', fullPage: true });
});

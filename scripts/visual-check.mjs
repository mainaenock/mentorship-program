import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
for (const width of [1440, 390]) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(`${process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173'}/`, {
    waitUntil: 'networkidle',
  });
  await page.screenshot({ path: `artifacts/home-viewport-${width}.png` });
  await page.screenshot({ path: `artifacts/home-${width}.png`, fullPage: true });
}
console.log(JSON.stringify({ errors }));
await browser.close();

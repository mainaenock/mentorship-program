import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 180000,
  expect: { timeout: 10000 },
  workers: 1,
  use: {
    channel: process.env.PLAYWRIGHT_CHANNEL,
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'pnpm dev --port 3000',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120000,
      },
  reporter: [['list'], ['html', { open: 'never' }]],
});

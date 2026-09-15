import { test, expect } from '@playwright/test';
test('forms are inert without JavaScript and never default to GET', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/register`);
  await expect(page.locator('form')).toHaveAttribute('method', 'post');
  await expect(page.getByLabel('Email address')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Create account', exact: true })).toBeDisabled();
  await context.close();
});
test('privacy preferences survive reload', async ({ page }) => {
  await page.goto('/privacy-centre');
  const choice = page.getByLabel('Allow optional analytics when configured');
  await page.getByRole('button', { name: 'Save preferences' }).waitFor();
  await expect(page.getByRole('button', { name: 'Save preferences' })).toBeEnabled();
  await choice.check();
  await page.getByRole('button', { name: 'Save preferences' }).click();
  await expect(page.getByText('Your preferences have been saved on this device.')).toBeVisible();
  await page.reload();
  await expect(choice).toBeChecked();
});
test('mentor status fixtures include every review outcome and allow additional information', async ({
  page,
}) => {
  for (const state of ['draft', 'submitted', 'under-review', 'approved', 'rejected', 'suspended']) {
    await page.goto(`/mentor/application/status/demo-${state}`);
    await expect(page.locator('main .badge')).toHaveText(state.replaceAll('-', ' '));
  }
  await page.goto('/mentor/application/status/demo-more-information-required');
  await page.getByRole('button', { name: 'Provide more information' }).click();
  await page
    .getByLabel('Additional information')
    .fill('I have supported adult learners through project-based mentoring for five years.');
  await page.getByRole('button', { name: 'Submit additional information' }).click();
  await expect(page.locator('main .badge')).toHaveText('under review');
  await page.reload();
  await expect(page.locator('main .badge')).toHaveText('under review');
});
test('suspended and activation-pending accounts cannot resume onboarding', async ({ page }) => {
  await page.goto('/');
  for (const status of ['suspended', 'activation_pending', 'mentor_pending']) {
    await page.evaluate(
      (status) =>
        sessionStorage.setItem(
          'gap-demo-session',
          JSON.stringify({
            id: 'fixture',
            role: 'member',
            email: 'fixture@example.test',
            status,
            expiresAt: Date.now() + 600000,
          }),
        ),
      status,
    );
    await page.goto('/onboarding');
    await expect(page).toHaveURL('/account-status');
    await page.getByRole('link', { name: 'Continue', exact: true }).click();
    await expect(page).toHaveURL(
      status === 'suspended'
        ? '/account-suspended'
        : status === 'activation_pending'
          ? '/account-pending'
          : '/mentor-pending',
    );
  }
});
test('PWA manifest and cache contain only the public offline shell', async ({ page, context, request }) => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'Service worker is enabled in production only.');
  const response = await request.get('/manifest.webmanifest');
  const manifest = await response.json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual(['192x192', '512x512']);
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const paths = await page.evaluate(async () => {
    const cache = await caches.open('gap-public-shell-v1');
    return (await cache.keys()).map((request) => new URL(request.url).pathname).sort();
  });
  expect(paths).toEqual(['/icon-192.png', '/icon-512.png', '/icon.svg', '/offline.html']);
  await context.setOffline(true);
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'A short pause in your journey.' })).toBeVisible();
  await context.setOffline(false);
});

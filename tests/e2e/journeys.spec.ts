import { test, expect, type Page } from '@playwright/test';
async function register(page: Page) {
  await page.goto('/register');
  await page.getByLabel('Email address').fill('member@example.test');
  await page.getByLabel('Password', { exact: true }).fill('demonstration-password');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page).toHaveURL(/verify-email/);
  await page.getByLabel('Six-digit verification code').fill('123456');
  await page.getByRole('button', { name: 'Verify and continue' }).click();
  await expect(page).toHaveURL(/onboarding/);
}
test('public pages respond and have no placeholder links', async ({ page }) => {
  for (const path of [
    '/',
    '/about',
    '/how-it-works',
    '/goals',
    '/mentorship',
    '/learning',
    '/pricing',
    '/become-a-mentor',
    '/success-stories',
    '/faq',
    '/contact',
    '/help',
    '/privacy',
    '/terms',
    '/safeguarding',
    '/mentor-code-of-conduct',
    '/refund-policy',
    '/privacy-centre',
    '/accessibility',
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('a[href="#"]')).toHaveCount(0);
  }
});
test('responsive homepage and forms at all specified widths', async ({ page }) => {
  test.setTimeout(300000);
  for (const width of [360, 390, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/register', '/mentor/application']) {
      await page.goto(path);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${path} at ${width}`,
      ).toBe(true);
    }
  }
});
test('mobile navigation traps focus and restores it on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Open navigation' });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page
    .getByRole('navigation', { name: 'Mobile navigation' })
    .getByRole('link', { name: 'About', exact: true })
    .click();
  await expect(page).toHaveURL('/about');
});
test('theme persists and keyboard skip link works', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.getByRole('button', { name: 'Toggle color theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
test('adult registers, verifies, completes setup and logs out', async ({ page }) => {
  await register(page);
  await page.getByLabel('Date of birth').fill('1995-02-10');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('First name').fill('Demo');
  await page.getByLabel('Last name').fill('Member');
  await page.getByLabel('Phone', { exact: true }).fill('+254712345678');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Primary interest').selectOption('Technology');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('What do you want to achieve?').fill('Build my first project');
  await page.getByLabel('How will you measure success?').fill('Publish one working project');
  await page.getByLabel('Target date').fill('2027-12-31');
  await page.getByLabel('Your first recurring action').fill('Practice every Tuesday');
  await page.getByRole('button', { name: 'Create first goal' }).click();
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Your demo setup is complete.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Log out', exact: true }).last().click();
  await expect(page).toHaveURL('/login');
});
test('minor cannot activate without independent guardian consent', async ({ page }) => {
  await register(page);
  await page.getByLabel('Date of birth').fill('2012-03-10');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Guardian name').fill('Demo Guardian');
  await page.getByLabel('Relationship', { exact: true }).selectOption('Parent');
  await page.getByLabel('Guardian email').fill('guardian@example.test');
  await page.getByRole('button', { name: 'Invite guardian' }).click();
  await expect(
    page.getByText('Your demo account is pending guardian consent.', { exact: false }),
  ).toBeVisible();
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/onboarding');
});
test('guardian invitation states and consent review', async ({ page }) => {
  for (const state of ['expired', 'used', 'invalid']) {
    await page.goto(`/guardian/invitation/${state}`);
    await expect(page.getByRole('heading', { name: `Invitation ${state}` })).toBeVisible();
  }
  await page.goto('/guardian/invitation/demo-invitation');
  await page.getByLabel('Guardian full name').fill('Demo Guardian');
  await page.getByLabel('Guardian email').fill('guardian@example.test');
  await page.getByLabel('Relationship', { exact: true }).selectOption('Parent');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Verification code', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Decline invitation' }).click();
  await expect(page.getByText('Invitation declined.', { exact: false })).toBeVisible();
});
test('FAQ search and offline failure', async ({ page, context }) => {
  await page.goto('/faq');
  await page.getByLabel('Search questions').fill('zzzz');
  await expect(page.getByText('No matching questions')).toBeVisible();
  await page.goto('/forgot-password');
  await page.getByLabel('Email address').fill('demo@example.test');
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Send recovery instructions' }).click();
  await expect(page.getByRole('alert')).toContainText('offline');
  await context.setOffline(false);
});

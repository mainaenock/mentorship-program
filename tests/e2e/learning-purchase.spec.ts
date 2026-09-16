import { expect, test } from '@playwright/test';
test('explicit member demo purchases a learning path once and earns its certificate', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Open Member Demo', exact: true }).click();
  await expect(page).toHaveURL('/app');
  await page.goto('/app/learning/demo-mini-course');
  await page.getByRole('button', { name: 'Purchase', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Start Learning', exact: true }).click();
  await page.getByRole('button', { name: 'Mark Complete', exact: true }).first().click();
  await expect(page.getByText('1 of 2 lessons complete', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mark Complete', exact: true }).first().click();
  await expect(page.getByText('2 of 2 lessons complete', { exact: true })).toBeVisible();
  await page.getByRole('radio', { name: 'Spend 20 minutes drafting one portfolio page' }).check();
  await page.getByRole('button', { name: 'Submit Quiz' }).click();
  await page.getByRole('button', { name: 'View Certificate' }).click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
  expect((await downloaded).suggestedFilename()).toBe('learning-certificate.txt');
  await page.goto('/app/credits');
  await expect(page.locator('.metric-value')).toHaveText('50');
  await page.goto('/app/payments?success=true');
  for (const status of [
    'Created',
    'Awaiting payment',
    'Pending',
    'Successful',
    'Failed',
    'Abandoned',
    'Reversed',
    'Refunded',
    'Partially refunded',
  ]) {
    await page.getByLabel('Payment status', { exact: true }).selectOption(status);
    await expect(page.locator('.badge').filter({ hasText: new RegExp(`^${status}$`) })).toBeVisible();
  }
});

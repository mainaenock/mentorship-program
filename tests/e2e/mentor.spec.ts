import { test, expect } from '@playwright/test';
test('mentor completes all application steps and submits sample evidence', async ({ page }) => {
  await page.goto('/mentor/application');
  await page.getByLabel('Full name').fill('Demo Mentor');
  await page.getByLabel('Email', { exact: true }).fill('mentor@example.test');
  await page.getByLabel('Phone', { exact: true }).fill('+254712345678');
  const next = () => page.getByRole('button', { name: 'Continue', exact: true }).click();
  await next();
  await page.getByLabel('Verification code').fill('123456');
  await next();
  await page.getByLabel('Professional role').fill('Technology educator');
  await page.getByLabel('Years of relevant experience').fill('5');
  await page
    .getByLabel('Professional background')
    .fill('I support learners in building practical technology skills and projects.');
  await next();
  await page.getByLabel('Primary expertise').selectOption('Technology');
  await page
    .getByLabel('Skills and experience you can share')
    .fill('Programming, planning and project delivery');
  await next();
  await page.getByLabel('Preferred age group').selectOption('Adults only');
  await next();
  await page.getByLabel('Languages spoken').fill('English, Kiswahili');
  await next();
  await page.getByLabel('Available days and times').fill('Tuesday 16:00 to 18:00');
  await next();
  await page.getByLabel('Maximum mentee capacity').fill('3');
  await next();
  await page.getByLabel('Reference name', { exact: true }).fill('Demo Reference');
  await page.getByLabel('Reference email', { exact: true }).fill('reference@example.test');
  await page.getByLabel('Professional relationship', { exact: true }).fill('Colleague');
  await page.getByRole('button', { name: 'Add reference' }).click();
  await expect(page.getByRole('group', { name: 'Reference 2' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove reference' }).click();
  await next();
  await page.getByLabel('Upload sample supporting documents').setInputFiles({
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\nDemo only'),
  });
  await next();
  for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.check();
  await next();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Review', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Review your application' })).toBeVisible();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Submit application' }).click();
  await expect(page.getByRole('heading', { name: 'Thank you for stepping forward.' })).toBeVisible();
  await expect(page.getByText('Submitted · Demo', { exact: true })).toBeVisible();
});
test('mentor draft restores safe details without persisting identity or files', async ({ page }) => {
  await page.goto('/mentor/application');
  await page.getByLabel('Full name').fill('Private sample name');
  await page.getByLabel('Email', { exact: true }).fill('private@example.test');
  await page.getByRole('button', { name: 'Save draft' }).click();
  const draft = await page.evaluate(() => sessionStorage.getItem('gap-mentor-draft'));
  expect(draft).not.toContain('private@example.test');
  expect(draft).not.toContain('Private sample name');
  await page.reload();
  await expect(page.getByText('Step 1 of 13')).toBeVisible();
});

import { expect, test } from '@playwright/test';
test('administrator approves an application with a decision reason and audit history', async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      'gap-demo-session',
      JSON.stringify({
        id: 'admin-test',
        email: 'admin@example.test',
        role: 'administrator',
        status: 'active',
        expiresAt: Date.now() + 3600000,
      }),
    ),
  );
  await page.goto('/admin/mentorship/applications');
  await page.getByRole('button', { name: 'View', exact: true }).first().click();
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await page.getByLabel('Decision reason').fill('Screening requirements reviewed for this demonstration.');
  await page.getByRole('dialog').last().getByRole('button', { name: 'Confirm', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByText('Approved', { exact: true }).last()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Approve', exact: true })).toBeVisible();
  await page.goto('/admin/finance/payments');
  await expect(page.getByRole('heading', { name: 'This space needs permission.' })).toBeVisible();
});
test('guardian accepts a relationship, grants and withdraws participation consent', async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      'gap-demo-session',
      JSON.stringify({
        id: 'guardian-test',
        email: 'guardian@example.test',
        role: 'guardian',
        status: 'active',
        expiresAt: Date.now() + 3600000,
      }),
    ),
  );
  await page.goto('/guardian/children');
  await page.getByRole('button', { name: 'Accept Relationship', exact: true }).click();
  await page.getByLabel('Relationship decision reason').fill('I confirm this demonstration relationship.');
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.goto('/guardian/consents');
  await page.getByRole('button', { name: 'Grant participation Consent', exact: true }).click();
  await page.getByRole('dialog').getByRole('checkbox').check();
  await page.getByLabel('Consent decision reason').fill('I approve participation in this demonstration.');
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Withdraw participation Consent', exact: true }).click();
  await page.getByRole('dialog').getByRole('checkbox').check();
  await page.getByLabel('Consent decision reason').fill('Please restrict participation again.');
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Grant participation Consent', exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'participation consent withdrawn · v1', exact: true }),
  ).toBeVisible();
});
test('mentor reviews an assigned evaluation and cannot open an unassigned member', async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      'gap-demo-session',
      JSON.stringify({
        id: 'mentor-test',
        email: 'mentor@example.test',
        role: 'mentor',
        status: 'active',
        expiresAt: Date.now() + 3600000,
      }),
    ),
  );
  await page.goto('/mentor/evaluations');
  await page.getByRole('button', { name: 'Review Evaluation', exact: true }).first().click();
  await page.getByLabel('Review notes').fill('Choose a manageable first project step.');
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByText('Reviewed', { exact: true })).toBeVisible();
  await page.goto('/mentor/mentees/unassigned');
  await expect(page.getByRole('alert')).toContainText('not assigned');
});

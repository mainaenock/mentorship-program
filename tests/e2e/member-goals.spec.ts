import { expect, test } from '@playwright/test';
test('member creates a weighted goal, completes an action and submits an evaluation', async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      'gap-demo-session',
      JSON.stringify({
        id: 'member-journey',
        email: 'member@example.test',
        role: 'member',
        status: 'active',
        expiresAt: Date.now() + 3600000,
      }),
    ),
  );
  await page.goto('/app/goals/new');
  await page.getByLabel('Goal category', { exact: true }).selectOption('Technology');
  const next = () => page.getByRole('button', { name: 'Continue', exact: true }).click();
  await next();
  await page.getByLabel('Goal title', { exact: true }).fill('Build a portfolio');
  await page.getByLabel('Describe the outcome').fill('Create and publish my portfolio website.');
  await next();
  await page.getByLabel('Where are you starting from?').fill('A blank project');
  await next();
  await page.getByLabel('What will success look like?').fill('One working portfolio website');
  await next();
  await page
    .getByLabel('Why does this goal matter to you?')
    .fill('I want to share my work with collaborators.');
  await next();
  await page.getByLabel('Goal deadline', { exact: true }).fill('2027-12-31');
  await next();
  await page.getByRole('button', { name: 'Add Milestone', exact: true }).click();
  await page.getByLabel('Milestone title').fill('Publish website');
  await page.getByLabel('Unit of measurement').fill('website');
  await next();
  await page.getByRole('button', { name: 'Add Action', exact: true }).click();
  await page.getByLabel('Action title').fill('Publish first page');
  await next();
  await expect(page.getByText('Needs work', { exact: false })).toHaveCount(0);
  await page.getByRole('button', { name: 'Review Goal', exact: true }).click();
  await next();
  await page.getByRole('button', { name: 'Create Goal', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/goals\/[a-z0-9-]+$/);
  await page
    .getByRole('navigation', { name: 'Goal sections' })
    .getByRole('link', { name: 'Actions', exact: true })
    .click();
  await page.getByRole('button', { name: 'Complete', exact: true }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('progressbar', { name: 'Weighted goal progress' })).toHaveAttribute(
    'aria-valuenow',
    '100',
  );
  await page.keyboard.press('Escape');
  await page
    .getByRole('navigation', { name: 'Goal sections' })
    .getByRole('link', { name: 'Evaluations', exact: true })
    .click();
  await page.getByLabel('What went well').fill('I followed the plan.');
  await page.getByLabel('Challenges', { exact: true }).fill('Finding time.');
  await page.getByLabel('Planned adjustment').fill('Practice earlier.');
  await page.getByRole('button', { name: 'Submit Evaluation' }).click();
  await expect(page.getByText('Immutable snapshot', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Immutable snapshot', { exact: true })).toBeVisible();
});

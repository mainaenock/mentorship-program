import { expect, test } from '@playwright/test';
import { portalRoutes } from '../../domains/portal/routes';
const roles = [
  { role: 'member', prefix: '/app', home: '/app' },
  { role: 'mentor', prefix: '/mentor', home: '/mentor' },
  { role: 'guardian', prefix: '/guardian', home: '/guardian' },
  { role: 'super_administrator', prefix: '/admin', home: '/admin' },
];
for (const workspace of roles) {
  test(`${workspace.role} route inventory, mobile navigation and responsive shell`, async ({ page }) => {
    test.setTimeout(600000);
    await page.addInitScript(
      ({ role }) =>
        sessionStorage.setItem(
          'gap-demo-session',
          JSON.stringify({
            id: `acceptance-${role}`,
            email: `${role}@example.test`,
            role,
            status: 'active',
            expiresAt: Date.now() + 3600000,
          }),
        ),
      workspace,
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const route of portalRoutes.filter(
      (item) => item.path === workspace.prefix || item.path.startsWith(`${workspace.prefix}/`),
    )) {
      const path = route.path
        .replace('[goalId]', 'missing-goal')
        .replace('[materialId]', workspace.prefix === '/admin' ? 'demo-materials-1' : 'demo-article')
        .replace('[sessionId]', 'missing-session')
        .replace('[memberId]', 'assigned-demo-member')
        .replace('[relationshipId]', 'demo-relationship')
        .replace('[userId]', 'demo-users-1');
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await expect(page.getByRole('heading', { level: 1, name: route.title, exact: true })).toBeVisible();
      await expect(page.locator('a[href="#"]')).toHaveCount(0);
    }
    for (const width of [360, 390, 430, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(workspace.home);
      await expect(page.locator('.portal-shell')).toBeVisible();
      await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
      await expect(page.getByRole('status', { name: 'Loading content' })).toHaveCount(0);
      if (workspace.role === 'super_administrator')
        await expect(page.getByRole('heading', { name: 'Goal achievement funnel' })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${workspace.role} at ${width}`,
      ).toBe(true);
      if (width < 900)
        await expect(page.getByRole('navigation', { name: 'Mobile workspace navigation' })).toBeVisible();
      if (width === 390 || width === 1440)
        await page.screenshot({ path: `artifacts/${workspace.role}-${width}.png`, fullPage: true });
    }
    const trigger = page.getByRole('button', { name: 'More destinations', exact: true });
    await trigger.click();
    await expect(page.getByRole('dialog', { name: 'More destinations' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    expect(errors).toEqual([]);
  });
}

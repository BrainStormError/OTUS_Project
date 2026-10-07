import { expect, test } from '@playwright/test';

test('an unauthenticated visitor is redirected to /login', async ({ page }) => {
  await page.goto('/films');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();
});

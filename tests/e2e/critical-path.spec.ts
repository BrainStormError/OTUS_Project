import { expect, test } from '@playwright/test';

// Requires a migrated database and E2E_DB=1 with DEMO_LOGIN=1.
test.skip(process.env.E2E_DB !== '1', 'requires E2E_DB=1 and a migrated database');

test('critical path: login -> directory read -> mutation -> admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@demo.local');
  await page.getByRole('button', { name: 'Войти' }).click();

  await page.waitForURL('**/directory');
  await expect(page.getByRole('heading', { name: 'Справочник' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Новая запись' })).toBeVisible();

  const name = `E2E ${Date.now()}`;
  await page.getByLabel('Название').fill(name);
  await page.getByRole('button', { name: 'Добавить запись' }).click();

  await expect(page.getByText(name)).toBeVisible();
});

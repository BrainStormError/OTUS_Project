import { expect, test, type Page } from '@playwright/test';

// Requires a migrated database and E2E_DB=1 with DEMO_LOGIN=1.
test.skip(process.env.E2E_DB !== '1', 'requires E2E_DB=1 and a migrated database');

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === '/');
}

test('profile edit: change display name and tag', async ({ page }) => {
  const stamp = Date.now();
  await login(page, `profile-${stamp}@demo.local`);

  await page.goto('/settings');
  await page.getByRole('button', { name: 'Изменить имя' }).click();
  const nameDialog = page.getByRole('dialog');
  await expect(nameDialog).toBeVisible();
  await nameDialog.getByLabel('Отображаемое имя').fill('Новое Имя');
  await nameDialog.getByRole('button', { name: 'Сохранить' }).click();
  await expect(nameDialog).toBeHidden();

  const tag = `e2e-${stamp}`;
  await page.getByRole('button', { name: 'Изменить тэг' }).click();
  const tagDialog = page.getByRole('dialog');
  await expect(tagDialog).toBeVisible();
  await tagDialog.getByLabel('Тэг (handle)').fill(tag);
  await tagDialog.getByRole('button', { name: 'Сохранить' }).click();
  await expect(tagDialog).toBeHidden();

  await page.goto('/me');
  await expect(page.getByRole('heading', { name: 'Новое Имя' })).toBeVisible();
  await expect(page.getByText(`@${tag}`)).toBeVisible();
});

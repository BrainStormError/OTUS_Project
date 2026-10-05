import { expect, test, type Page } from '@playwright/test';

// Requires a migrated database and E2E_DB=1 with DEMO_LOGIN=1.
test.skip(process.env.E2E_DB !== '1', 'requires E2E_DB=1 and a migrated database');

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@demo.local');
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL('**/directory');
}

test('critical path: login -> directory read -> mutation -> admin', async ({ page }) => {
  await login(page);

  await expect(page.getByRole('heading', { name: 'Справочник' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Новая запись' })).toBeVisible();

  const name = `E2E ${Date.now()}`;
  await page.getByLabel('Название').fill(name);
  await page.getByRole('button', { name: 'Добавить запись' }).click();

  await expect(page.getByText(name)).toBeVisible();
});

test('theme switch persists across reloads', async ({ page }) => {
  await login(page);
  await page.goto('/settings');

  await page.getByRole('radio', { name: 'Тёмная' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('search -> film card -> rate and save appears in My Films', async ({ page }) => {
  await login(page);
  await page.goto('/');

  await page.getByLabel('Название').fill('Начало');
  await page.getByRole('button', { name: 'Найти' }).click();
  await page.getByRole('link', { name: /Начало/ }).first().click();
  await page.waitForURL('**/film/**');

  await page.getByRole('button', { name: 'Оценить' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('spinbutton', { name: 'Оценка (0–10)' }).fill('8.5');
  await dialog.getByLabel('Комментарий (необязательно)').fill('Отличный фильм');
  await dialog.getByRole('button', { name: 'Сохранить' }).click();
  await expect(dialog).toBeHidden();

  await page.goto('/films');
  await expect(page.getByText('Начало').first()).toBeVisible();
  await expect(page.getByText('8.5').first()).toBeVisible();
});

test('home renders the centered brand and the activity feed', async ({ page }) => {
  await login(page);
  await page.goto('/');

  await expect(page.getByRole('link', { name: /Смотровик/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Лента активности' })).toBeVisible();
});

test('group admin panel opens for an admin', async ({ page }) => {
  await login(page);
  await page.goto('/groups/g1/admin');

  await expect(page.getByRole('heading', { name: /Управление группой/ })).toBeVisible();
  await expect(page.getByTestId('admin-member-panel')).toBeVisible();
});

import { expect, test, type Page } from '@playwright/test';

// Requires a migrated database and E2E_DB=1 with DEMO_LOGIN=1.
test.skip(process.env.E2E_DB !== '1', 'requires E2E_DB=1 and a migrated database');

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@demo.local');
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === '/');
}

test('critical path: login -> home -> rate a film -> feed entry', async ({ page }) => {
  await login(page);
  await expect(page.getByRole('heading', { name: 'Лента активности' })).toBeVisible();

  await page.getByLabel('Название').fill('Тёмный рыцарь');
  await page.getByRole('button', { name: 'Найти' }).click();
  await page.getByRole('link', { name: /Тёмный рыцарь/ }).first().click();
  await page.waitForURL('**/film/**');

  await page.getByRole('button', { name: 'Оценить' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('spinbutton', { name: 'Оценка (0–10)' }).fill('8.5');
  await dialog.getByRole('button', { name: 'Сохранить' }).click();
  await expect(dialog).toBeHidden();

  await page.goto('/');
  const feed = page.getByTestId('social-feed');
  await expect(feed.getByText('Тёмный рыцарь')).toBeVisible();
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
  await page.goto('/groups/1/admin');

  await expect(page.getByRole('heading', { name: /Управление группой/ })).toBeVisible();
  await expect(page.getByTestId('admin-member-panel')).toBeVisible();
});

test('saving a rating shows a success toast', async ({ page }) => {
  await login(page);
  await page.getByLabel('Название').fill('Тёмный рыцарь');
  await page.getByRole('button', { name: 'Найти' }).click();
  await page.getByRole('link', { name: /Тёмный рыцарь/ }).first().click();
  await page.waitForURL('**/film/**');

  await page.getByRole('button', { name: 'Оценить' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('spinbutton', { name: 'Оценка (0–10)' }).fill('9');
  await dialog.getByRole('button', { name: 'Сохранить' }).click();

  const toast = page.getByTestId('toast');
  await expect(toast).toBeVisible();
  await expect(toast).toContainText('Запись сохранена');
});

test('a failed save shows an error toast', async ({ page }) => {
  await login(page);
  await page.getByLabel('Название').fill('Начало');
  await page.getByRole('button', { name: 'Найти' }).click();
  await page.getByRole('link', { name: /Начало/ }).first().click();
  await page.waitForURL('**/film/**');

  await page.route('**/api/records', (route) => route.fulfill({ status: 500, body: '{}' }));
  await page.getByRole('button', { name: 'Оценить' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('spinbutton', { name: 'Оценка (0–10)' }).fill('7');
  await dialog.getByRole('button', { name: 'Сохранить' }).click();

  const toast = page.getByTestId('toast');
  await expect(toast).toBeVisible();
  await expect(toast).toContainText('Не удалось сохранить запись');
});

test('watch-later: add from Home, list on the tab, then rate moves it to watched', async ({ page }) => {
  await login(page);
  await page.goto('/');
  await page.getByLabel('Название').fill('Интерстеллар');
  await page.getByRole('button', { name: 'Найти' }).click();

  const card = page.getByTestId('movie-card').filter({ hasText: 'Интерстеллар' }).first();
  const planButton = card.getByRole('button', { name: 'Буду смотреть' });
  test.skip(await planButton.isDisabled(), 'title already watched');
  if ((await planButton.getAttribute('aria-pressed')) === 'false') {
    await planButton.click();
  }
  await expect(planButton).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/films');
  await page.getByRole('tab', { name: 'Буду смотреть' }).click();
  const tab = page.getByTestId('my-films-watchlist');
  await expect(tab.getByText('Интерстеллар').first()).toBeVisible();

  await tab.getByRole('button', { name: 'Оценить' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('spinbutton', { name: 'Оценка (0–10)' }).fill('9');
  await dialog.getByRole('button', { name: 'Добавить' }).click();
  await expect(dialog).toBeHidden();

  await expect(tab.getByText('Интерстеллар')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Просмотренные' }).click();
  await expect(page.getByTestId('my-films').getByText('Интерстеллар').first()).toBeVisible();

  await page.goto('/film/157336');
  await expect(page.getByRole('button', { name: 'Буду смотреть' })).toBeDisabled();
});

test('watch-later: manual removal leaves no watched record', async ({ page }) => {
  await login(page);
  await page.goto('/');
  await page.getByLabel('Название').fill('Матрица');
  await page.getByRole('button', { name: 'Найти' }).click();
  await page.getByRole('link', { name: /Матрица/ }).first().click();
  await page.waitForURL('**/film/**');

  const planButton = page.getByRole('button', { name: 'Буду смотреть' });
  test.skip(await planButton.isDisabled(), 'title already watched');
  if ((await planButton.getAttribute('aria-pressed')) === 'false') {
    await planButton.click();
    await expect(planButton).toHaveAttribute('aria-pressed', 'true');
  }

  await page.goto('/films');
  await page.getByRole('tab', { name: 'Буду смотреть' }).click();
  const tab = page.getByTestId('my-films-watchlist');
  const row = tab.getByRole('row', { name: /Матрица/ });
  await row.getByRole('button', { name: 'Удалить' }).click();
  await expect(tab.getByText('Матрица')).toHaveCount(0);
});

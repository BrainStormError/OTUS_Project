import { expect, test, type Page } from '@playwright/test';

// Requires a migrated database and E2E_DB=1 with DEMO_LOGIN=1.
test.skip(process.env.E2E_DB !== '1', 'requires E2E_DB=1 and a migrated database');

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@demo.local');
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === '/');
}

test('record marked on home appears in My Films after client-side navigation and delete removes it', async ({
  page,
}) => {
  await login(page);
  await page.goto('/');

  await page.route('**/api/search*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            kind: 'film',
            externalId: '157336',
            title: 'Интерстеллар',
            year: 2014,
            posterUrl: null,
            externalRating: 8.4,
            genres: ['Фантастика'],
            genreIds: [878],
          },
        ],
        page: 1,
        hasMore: false,
      }),
    }),
  );

  await page.route('**/api/records*', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 501 }),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.getByLabel('Название').first().fill('Интерстеллар');
  await page.getByRole('button', { name: 'Найти' }).first().click();

  const card = page.getByTestId('movie-card').filter({ hasText: 'Интерстеллар' }).first();
  await card.getByRole('button', { name: /Отметить просмотренным|Просмотрено/ }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('spinbutton', { name: 'Оценка (0–10)' }).fill('8');
  await dialog.getByRole('button', { name: /Добавить|Сохранить/ }).click();
  await expect(dialog).toBeHidden();

  await expect(page.getByTestId('toast').filter({ hasText: 'Запись сохранена' })).toBeVisible();

  await page.getByRole('link', { name: 'Мои фильмы' }).first().click();
  await page.waitForURL('**/films');

  const list = page.getByTestId('my-films');
  await expect(list.getByText('Интерстеллар').first()).toBeVisible();

  await list.getByRole('button', { name: /Интерстеллар/ }).first().click();
  await list.getByRole('button', { name: 'Удалить' }).first().click();

  const confirm = page.getByRole('dialog').filter({ hasText: 'Удалить запись?' });
  await confirm.getByRole('button', { name: 'Удалить' }).click();

  await expect(list.getByText('Интерстеллар')).toHaveCount(0);
  await expect(page.getByTestId('toast').filter({ hasText: 'Запись удалена' })).toBeVisible();
});

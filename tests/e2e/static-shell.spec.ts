import { expect, test, type Page } from '@playwright/test';

test.skip(process.env.E2E_DB !== '1', 'requires E2E_DB=1 and a migrated database');

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@demo.local');
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === '/');
}

test('the served document carries no identity, which arrives from the read contract', async ({
  page,
}) => {
  await login(page);

  const response = await page.goto('/films');
  const html = await response!.text();
  expect(html).not.toContain('Пётр');
  expect(html).not.toContain('admin@demo.local');

  await expect(page.getByText('Пётр')).toBeVisible();
});

test('the same page returns the same document bytes on every load', async ({ page }) => {
  await login(page);

  const first = await page.goto('/films');
  const firstHtml = await first!.text();
  const second = await page.goto('/films');
  const secondHtml = await second!.text();

  expect(secondHtml).toBe(firstHtml);

  // Rewritten detail URLs share one shell document: the id is not baked in.
  const groupA = await page.goto('/groups/4');
  const groupAHtml = await groupA!.text();
  const groupB = await page.goto('/groups/5');
  const groupBHtml = await groupB!.text();
  expect(groupBHtml).toBe(groupAHtml);
});

test('detail and profile rewrites resolve data through the read contract', async ({ page }) => {
  await login(page);

  await page.goto('/u/maria');
  await expect(page.getByRole('heading', { name: 'Мария' })).toBeVisible();

  // The catalog detail is read from TMDB; stub the contract so the shell check
  // does not depend on the external service being reachable.
  await page.route('**/api/catalog/detail*', async (route) => {
    const kind = new URL(route.request().url()).searchParams.get('kind');
    const isFilm = kind === 'film';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        item: {
          kind: isFilm ? 'film' : 'series',
          externalId: isFilm ? '27205' : '1396',
          title: isFilm ? 'Начало' : 'Во все тяжкие',
          year: isFilm ? 2010 : 2008,
          posterUrl: null,
          externalRating: 8.8,
          genres: ['Драма'],
          genreIds: [18],
          overview: null,
          director: null,
        },
      }),
    });
  });
  await page.route('**/api/records*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [] }),
    }),
  );
  await page.route('**/api/watchlist*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [] }),
    }),
  );

  await page.goto('/film/27205');
  await expect(page.getByRole('heading', { name: 'Начало' })).toBeVisible();

  await page.goto('/series/1396');
  await expect(page.getByRole('heading', { name: 'Во все тяжкие' })).toBeVisible();
});

test('a stale cookie reaches the shell and the client guard sends it to login', async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: 'authjs.session-token', value: 'stale', domain: 'localhost', path: '/' },
  ]);

  const response = await page.goto('/films');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/login$/);
});

test('the reserved area stays empty on a slow read and content does not shift the shell', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await login(page);

  await page.route('**/api/records*', async (route) => {
    if (route.request().method() === 'GET') {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    await route.continue();
  });

  await page.goto('/films');
  const heading = page.getByRole('heading', { name: 'Мои фильмы' });
  await expect(heading).toBeVisible();

  const before = await heading.boundingBox();
  await expect(page.getByTestId('my-films')).toHaveCount(0);
  const during = await heading.boundingBox();

  await expect(page.getByTestId('my-films')).toBeVisible();
  const after = await heading.boundingBox();

  expect(before).not.toBeNull();
  expect(during?.y).toBe(before?.y);
  expect(during?.height).toBe(before?.height);
  expect(after?.y).toBe(before?.y);
  expect(after?.height).toBe(before?.height);
});

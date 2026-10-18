import { expect, test, type Page } from '@playwright/test';

// Requires a migrated database and E2E_DB=1 with DEMO_LOGIN=1.
test.skip(process.env.E2E_DB !== '1', 'requires E2E_DB=1 and a migrated database');

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@demo.local');
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === '/');
}

function nonPrefetchRscRequests(page: Page, matcher: (url: string) => boolean): string[] {
  const requests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    // Background prefetches are not an activation round trip.
    if (request.headers()['next-router-prefetch']) {
      return;
    }
    if (url.includes('_rsc') && matcher(url)) {
      requests.push(url);
    }
  });
  return requests;
}

test('revisiting a section inside a session issues no navigation request', async ({ page }) => {
  await login(page);

  await page.goto('/films');
  await page.goto('/series');
  // Let the shell's viewport prefetch of the other sections settle first.
  await page.waitForTimeout(500);

  const rscRequests = nonPrefetchRscRequests(page, (url) => url.includes('/films'));

  await page.getByRole('link', { name: 'Мои фильмы' }).click();
  await expect(page).toHaveURL(/\/films$/);
  await expect(page.getByRole('heading', { name: 'Мои фильмы' })).toBeVisible();

  expect(rscRequests).toHaveLength(0);
});

test('repeating a navigation after a reload is served from the browser cache', async ({
  page,
  context,
}) => {
  await login(page);

  await page.goto('/films');
  await page.goto('/series');
  await page.waitForTimeout(500);

  const client = await context.newCDPSession(page);
  await client.send('Network.enable');
  const servedFromCache: string[] = [];
  client.on('Network.requestServedFromCache', (event) => {
    servedFromCache.push(event.requestId);
  });
  const cachedUrls: string[] = [];
  client.on('Network.responseReceived', (event) => {
    const fromCache = event.response.fromDiskCache || event.response.fromPrefetchCache;
    if (fromCache && event.response.url.includes('_rsc')) {
      cachedUrls.push(event.response.url);
    }
  });

  await page.reload();
  await page.getByRole('link', { name: 'Мои фильмы' }).click();
  await expect(page).toHaveURL(/\/films$/);
  await expect(page.getByRole('heading', { name: 'Мои фильмы' })).toBeVisible();

  expect(
    servedFromCache.length > 0 || cachedUrls.some((url) => url.includes('/films')),
  ).toBe(true);
});

test('the read contract keeps its own policy, not the navigation policy', async ({ page }) => {
  await login(page);

  const response = await page.request.get('/api/records');
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toBe('private, max-age=31536000');
  expect(response.headers()['cache-control']).not.toContain('s-maxage');
});

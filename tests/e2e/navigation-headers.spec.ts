import { expect, test } from '@playwright/test';

// Served navigation-payload contract. These assertions run against the built
// app (Playwright `webServer`) and fail if a response class drifts from its
// policy; they need no database.
const SESSION = { cookie: 'authjs.session-token=header-contract' };

test('the HTML document is private and revalidated, never shared-cacheable', async ({
  request,
}) => {
  const response = await request.get('/films', { headers: SESSION });
  expect(response.status()).toBe(200);

  const cacheControl = response.headers()['cache-control'];
  expect(cacheControl).toBe('private, no-cache');
  expect(cacheControl).not.toContain('public');
  expect(cacheControl).not.toContain('s-maxage');
});

test('a flight payload is private and browser-cacheable for one year', async ({ request }) => {
  const response = await request.get('/films?_rsc=header-contract', { headers: SESSION });

  const cacheControl = response.headers()['cache-control'];
  expect(cacheControl).toBe('private, max-age=31536000');
  expect(cacheControl).not.toContain('public');
  expect(cacheControl).not.toContain('s-maxage');
});

test('static assets keep the immutable public policy', async ({ request }) => {
  const document = await request.get('/films', { headers: SESSION });
  const asset = (await document.text()).match(/\/_next\/static\/[^"'\\]+\.js/)?.[0];
  expect(asset).toBeTruthy();

  const response = await request.get(asset!);
  expect(response.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
});

test('the navigation policy never reaches API reads', async ({ request }) => {
  const response = await request.get('/api/records');
  expect(response.headers()['cache-control'] ?? '').not.toBe('private, no-cache');
});

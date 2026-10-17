import { expect, test } from '@playwright/test';

test('unauthenticated root redirects to login and carries security headers', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  expect(response?.headers()['x-content-type-options']).toBe('nosniff');
  expect(response?.headers()['strict-transport-security']).toContain('max-age=');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();
});

test('the served document carries a hash-based CSP and no per-request secret', async ({ page }) => {
  const response = await page.goto('/login');
  const csp = response?.headers()['content-security-policy'] ?? '';
  expect(csp).not.toContain('nonce-');
  expect(csp).not.toContain('strict-dynamic');
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain('https://image.tmdb.org');
  expect(response?.headers()['x-nonce']).toBeUndefined();
});

test('a data read without a session is refused with 401', async ({ request }) => {
  const response = await request.get('/api/me/stats');
  expect(response.status()).toBe(401);
});

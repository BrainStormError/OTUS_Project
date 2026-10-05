import { expect, test } from '@playwright/test';

test('unauthenticated root redirects to login and carries security headers', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  expect(response?.headers()['x-content-type-options']).toBe('nosniff');
  expect(response?.headers()['strict-transport-security']).toContain('max-age=');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();
});

test('CSP nonce is present in the response headers', async ({ page }) => {
  const response = await page.goto('/login');
  const csp = response?.headers()['content-security-policy'] ?? '';
  expect(csp).toContain('nonce-');
  expect(csp).toContain("object-src 'none'");
});

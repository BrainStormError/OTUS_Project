import { expect, test } from '@playwright/test';

test('landing page renders and carries security headers', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  expect(response?.headers()['x-content-type-options']).toBe('nosniff');
  expect(response?.headers()['strict-transport-security']).toContain('max-age=');
  await expect(
    page.getByRole('heading', { name: 'Movie Tracker' }),
  ).toBeVisible();
});

test('CSP nonce is present in the response headers', async ({ page }) => {
  const response = await page.goto('/');
  const csp = response?.headers()['content-security-policy'] ?? '';
  expect(csp).toContain('nonce-');
  expect(csp).toContain("object-src 'none'");
});

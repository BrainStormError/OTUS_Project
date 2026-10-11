import { expect, test, type Page } from '@playwright/test';

// Requires a migrated database and E2E_DB=1 with DEMO_LOGIN=1.
test.skip(process.env.E2E_DB !== '1', 'requires E2E_DB=1 and a migrated database');

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === '/');
}

test('user A searches user B, sends a request, B accepts, both see friendship', async ({
  page,
}) => {
  const stamp = Date.now();
  const emailA = `anna-${stamp}@demo.local`;
  const emailB = `boris-${stamp}@demo.local`;

  await login(page, emailB);

  await page.context().clearCookies();
  await login(page, emailA);

  await page.goto('/friends');
  const searchRegion = page.getByRole('region', { name: 'Поиск людей' });
  await searchRegion.getByRole('searchbox', { name: 'Поиск людей' }).fill(`boris-${stamp}`);
  await searchRegion.getByRole('button', { name: `Добавить ${emailB}` }).click();
  await expect(searchRegion.getByText('Заявка отправлена')).toBeVisible();

  await page.context().clearCookies();
  await login(page, emailB);

  await page.goto('/friends');
  await page.getByRole('tab', { name: /Заявки/ }).click();
  await page.getByRole('button', { name: `Принять заявку от ${emailA}` }).click();
  await page.getByRole('tab', { name: /Друзья/ }).click();
  const friendsB = page.getByRole('region', { name: 'Мои друзья' });
  await expect(friendsB.getByRole('link', { name: new RegExp(emailA) })).toBeVisible();

  await page.context().clearCookies();
  await login(page, emailA);

  await page.goto('/friends');
  await page.getByRole('tab', { name: /Друзья/ }).click();
  const friendsA = page.getByRole('region', { name: 'Мои друзья' });
  await expect(friendsA.getByRole('link', { name: new RegExp(emailB) })).toBeVisible();
});

test('user removes an accepted friend with confirmation and can add again', async ({ page }) => {
  const stamp = Date.now();
  const emailA = `carol-${stamp}@demo.local`;
  const emailB = `dave-${stamp}@demo.local`;

  await login(page, emailB);
  await page.context().clearCookies();
  await login(page, emailA);

  await page.goto('/friends');
  const searchRegion = page.getByRole('region', { name: 'Поиск людей' });
  await searchRegion.getByRole('searchbox', { name: 'Поиск людей' }).fill(`dave-${stamp}`);
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes('/api/friendships') && response.request().method() === 'POST',
    ),
    searchRegion.getByRole('button', { name: `Добавить ${emailB}` }).click(),
  ]);
  await expect(searchRegion.getByText('Заявка отправлена')).toBeVisible();

  await page.context().clearCookies();
  await login(page, emailB);
  await page.goto('/friends');
  await page.getByRole('tab', { name: /Заявки/ }).click();
  await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/friendships/accept')),
    page.getByRole('button', { name: `Принять заявку от ${emailA}` }).click(),
  ]);
  await page.getByRole('tab', { name: /Друзья/ }).click();
  const friendsB = page.getByRole('region', { name: 'Мои друзья' });
  await expect(friendsB.getByRole('link', { name: new RegExp(emailA) })).toBeVisible();

  await page.context().clearCookies();
  await login(page, emailA);
  await page.goto('/friends');
  await page.getByRole('tab', { name: /Друзья/ }).click();
  const friendsA = page.getByRole('region', { name: 'Мои друзья' });
  await expect(friendsA.getByRole('link', { name: new RegExp(emailB) })).toBeVisible();

  await friendsA.getByRole('button', { name: `Убрать ${emailB} из друзей` }).click();
  await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/friendships/remove')),
    page.getByRole('dialog').getByRole('button', { name: 'Убрать' }).click(),
  ]);

  await expect(friendsA.getByRole('link', { name: new RegExp(emailB) })).toHaveCount(0);

  await page.getByRole('tab', { name: /Поиск/ }).click();
  const searchAgain = page.getByRole('region', { name: 'Поиск людей' });
  await searchAgain.getByRole('searchbox', { name: 'Поиск людей' }).fill(`dave-${stamp}`);
  await expect(searchAgain.getByRole('button', { name: `Добавить ${emailB}` })).toBeVisible();
});

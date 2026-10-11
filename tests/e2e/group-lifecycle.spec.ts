import { expect, test, type Page } from '@playwright/test';

// Requires a migrated, seeded database (scripts/seed-dev.ts) and E2E_DB=1 with
// DEMO_LOGIN=1. Demo login provisions accounts on demand, so the owner and the
// joining member can be demo accounts created per run.
test.skip(process.env.E2E_DB !== '1', 'requires E2E_DB=1 and a seeded database');

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === '/');
}

test('a member leaves an open group from its page', async ({ page }) => {
  const stamp = Date.now();
  const groupName = `Открытая ${stamp}`;
  const memberEmail = `leaver-${stamp}@demo.local`;

  await login(page, `owner-${stamp}@demo.local`);
  await page.goto('/groups');
  await page.getByRole('button', { name: 'Создать группу' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Название').fill(groupName);
  await dialog.getByRole('button', { name: 'Создать группу' }).click();
  await page.waitForURL(/\/groups\/\d+$/);
  const groupId = page.url().split('/').pop();

  await page.context().clearCookies();
  await login(page, memberEmail);
  await page.goto('/groups');
  await page.getByRole('searchbox', { name: 'Поиск групп' }).fill(groupName);
  const joinResponse = page.waitForResponse(
    (res) => res.url().includes('/api/groups/join') && res.request().method() === 'POST',
  );
  await page.getByRole('button', { name: `Вступить в группу ${groupName}` }).click();
  await joinResponse;

  await page.goto(`/groups/${groupId}`);
  await expect(page.getByRole('heading', { name: groupName })).toBeVisible();

  const leaveResponse = page.waitForResponse(
    (res) => res.url().includes('/membership') && res.request().method() === 'DELETE',
  );
  await page.getByRole('button', { name: 'Покинуть группу' }).click();
  await leaveResponse;
  await page.waitForURL((url) => url.pathname === '/groups');

  await page.goto(`/groups/${groupId}`);
  await expect(page.getByRole('button', { name: 'Покинуть группу' })).toHaveCount(0);
});

test('an administrator dissolves a group and it becomes not found', async ({ page }) => {
  const stamp = Date.now();
  const groupName = `Распустить ${stamp}`;

  await login(page, `dissolve-${stamp}@demo.local`);
  await page.goto('/groups');
  await page.getByRole('button', { name: 'Создать группу' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Название').fill(groupName);
  await dialog.getByRole('button', { name: 'Создать группу' }).click();
  await page.waitForURL(/\/groups\/\d+$/);
  const groupId = page.url().split('/').pop();

  await page.goto(`/groups/${groupId}/admin`);
  await expect(page.getByRole('heading', { name: new RegExp(groupName) })).toBeVisible();

  const dissolveResponse = page.waitForResponse(
    (res) => res.url().includes(`/api/groups/${groupId}`) && res.request().method() === 'DELETE',
  );
  await page.getByRole('button', { name: 'Распустить группу' }).click();
  await page.getByRole('button', { name: 'Подтвердить роспуск' }).click();
  await dissolveResponse;
  await page.waitForURL((url) => url.pathname === '/groups');

  const gone = await page.goto(`/groups/${groupId}`);
  expect(gone?.status()).toBe(404);
});

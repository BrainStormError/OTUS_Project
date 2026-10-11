import { expect, test, type Page } from '@playwright/test';

// Requires a migrated, seeded database (scripts/seed-dev.ts) and E2E_DB=1 with
// DEMO_LOGIN=1. Demo login provisions accounts on demand, so both the creator
// and the invitee can be demo accounts. The invitee signs in once up front so
// the account exists and the group's member search can find it.
test.skip(process.env.E2E_DB !== '1', 'requires E2E_DB=1 and a seeded database');

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === '/');
}

test('create a closed group and join it by invitation', async ({ page }) => {
  const stamp = Date.now();
  const groupName = `Закрытая ${stamp}`;
  const inviteeEmail = `invitee-${stamp}@demo.local`;

  await login(page, inviteeEmail);

  await page.context().clearCookies();
  await login(page, `owner-${stamp}@demo.local`);

  await page.goto('/groups');
  await page.getByRole('button', { name: 'Создать группу' }).click();

  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Название').fill(groupName);
  await dialog.getByLabel('Закрытая — только по приглашению').check();
  await dialog.getByRole('button', { name: 'Создать группу' }).click();

  await page.waitForURL(/\/groups\/\d+$/);
  await expect(page.getByRole('heading', { name: groupName })).toBeVisible();
  const groupId = page.url().split('/').pop();

  await page.goto(`/groups/${groupId}/admin`);
  const inviteRegion = page.getByRole('region', { name: 'Пригласить участника' });
  await inviteRegion.getByRole('searchbox', { name: 'Поиск людей для приглашения' }).fill(inviteeEmail);
  await inviteRegion.getByRole('button', { name: `Пригласить ${inviteeEmail}` }).click();
  await expect(
    page.getByRole('region', { name: 'Ожидающие приглашения' }).getByText(inviteeEmail),
  ).toBeVisible();

  await page.context().clearCookies();
  await login(page, inviteeEmail);

  await page.goto('/groups');
  const invitations = page.getByRole('region', { name: 'Входящие приглашения' });
  await expect(invitations.getByText(groupName)).toBeVisible();

  const accepted = page.waitForResponse(
    (res) => res.url().includes('/api/groups/invitations/') && res.request().method() === 'POST',
  );
  await invitations.getByRole('button', { name: `Принять приглашение в ${groupName}` }).click();
  await accepted;

  const response = await page.goto(`/groups/${groupId}`);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: groupName })).toBeVisible();
});

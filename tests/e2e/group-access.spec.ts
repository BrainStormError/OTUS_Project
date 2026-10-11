import { expect, test, type Page } from '@playwright/test';

// Requires a migrated, seeded database (scripts/seed-dev.ts) and E2E_DB=1 with
// DEMO_LOGIN=1. The seed marks group 4 as restricted with user 6 as its only
// member; user 1 (employee@demo.local) is a non-member.
test.skip(process.env.E2E_DB !== '1', 'requires E2E_DB=1 and a seeded database');

const OPEN_GROUP_ID = 3;
const RESTRICTED_GROUP_ID = 4;

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === '/');
}

test('a non-member gets not-found for a restricted group and no member list', async ({ page }) => {
  await login(page, 'employee@demo.local');

  const response = await page.goto(`/groups/${RESTRICTED_GROUP_ID}`);
  expect(response?.status()).toBe(404);
  await expect(page.getByTestId('group-members')).toHaveCount(0);

  const adminResponse = await page.goto(`/groups/${RESTRICTED_GROUP_ID}/admin`);
  expect(adminResponse?.status()).toBe(404);
  await expect(page.getByTestId('admin-member-panel')).toHaveCount(0);
});

test('a member of a restricted group can read it', async ({ page }) => {
  await login(page, 'admin@demo.local');

  const response = await page.goto(`/groups/${RESTRICTED_GROUP_ID}?tab=members`);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Закрытый клуб' })).toBeVisible();
  await expect(page.getByTestId('group-members')).toBeVisible();
});

test('an open group stays readable by a non-member and by a restricted-group member', async ({
  page,
}) => {
  await login(page, 'employee@demo.local');
  const nonMemberResponse = await page.goto(`/groups/${OPEN_GROUP_ID}`);
  expect(nonMemberResponse?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Документальное кино' })).toBeVisible();

  await login(page, 'admin@demo.local');
  const memberResponse = await page.goto(`/groups/${OPEN_GROUP_ID}`);
  expect(memberResponse?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Документальное кино' })).toBeVisible();
});

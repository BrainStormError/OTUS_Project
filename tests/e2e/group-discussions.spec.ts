import { expect, test, type Page } from '@playwright/test';

// Requires a migrated, seeded database and E2E_DB=1 with DEMO_LOGIN=1.
// The demo employee (employee@demo.local) is an admin of the "Киновечера" group.
test.skip(process.env.E2E_DB !== '1', 'requires E2E_DB=1 and a seeded database');

const GROUP_ID = 1;

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('employee@demo.local');
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === '/');
}

test('member rates a film, attaches a discussion and sees it across tabs', async ({ page }) => {
  await login(page);
  await page.goto(`/groups/${GROUP_ID}?tab=ratings`);

  // Member rates a film through the same media picker UX as My Films.
  await page.getByRole('button', { name: 'Добавить оценку' }).click();
  const picker = page.getByRole('dialog');
  await picker.getByLabel('Название').fill('Паразиты');
  await picker.getByRole('button', { name: 'Найти' }).click();
  await picker.getByRole('button', { name: /Паразиты/ }).click();

  const ratingForm = page.getByRole('dialog');
  await ratingForm.getByLabel(/^Оценка \(/).fill('8.5');
  await ratingForm.getByRole('button', { name: 'Сохранить' }).click();

  const ratings = page.getByTestId('group-ratings');
  await expect(ratings.getByText('Паразиты')).toBeVisible();

  // Admin attaches a discussion to the rated media.
  const parasityRow = ratings.getByRole('row', { name: /Паразиты/ });
  await parasityRow.getByRole('button', { name: 'Обсудить' }).click();
  const attach = page.getByRole('dialog');
  await attach.getByLabel('Название обсуждения').fill('Обсуждаем Паразиты');
  await attach.getByRole('button', { name: 'Прикрепить' }).click();

  // The ratings tab now links to the attached discussion.
  await expect(parasityRow.getByRole('link', { name: 'К обсуждению' })).toBeVisible();

  // The discussion is visible in the discussions tab.
  await page.goto(`/groups/${GROUP_ID}?tab=discussions`);
  await expect(page.getByText('Обсуждаем Паразиты')).toBeVisible();

  // The activity tab exposes the rating with a link to the discussion.
  await page.goto(`/groups/${GROUP_ID}?tab=activity`);
  const activity = page.getByTestId('group-activity');
  await expect(activity.getByRole('link', { name: 'К обсуждению' }).first()).toBeVisible();
});

test('keeps the group shell in place and streams the tab skeleton', async ({ page }) => {
  await login(page);
  await page.goto(`/groups/${GROUP_ID}?tab=discussions`);

  const heading = page.getByRole('heading', { level: 1 });
  const tablist = page.getByRole('tablist');
  await expect(heading).toBeVisible();
  await expect(tablist).toBeVisible();

  // The streamed document for a tab renders the shell and its skeleton before the content arrives.
  const streamed = await page.request.get(`/groups/${GROUP_ID}?tab=ratings`);
  expect(streamed.ok()).toBeTruthy();
  const html = await streamed.text();
  expect(html).toContain('group-tab-skeleton');
  expect(html).toContain('data-tab="ratings"');

  // Switching tabs keeps the header and tab list visible.
  await page.getByRole('tab', { name: 'Оценки' }).click();
  await expect(heading).toBeVisible();
  await expect(tablist).toBeVisible();
});

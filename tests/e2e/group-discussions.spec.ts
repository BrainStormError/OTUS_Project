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

  // The ratings tab now offers the attached discussion.
  await expect(parasityRow.getByRole('button', { name: 'К обсуждению' })).toBeVisible();

  // The discussion is visible in the discussions tab.
  await page.goto(`/groups/${GROUP_ID}?tab=discussions`);
  await expect(page.getByText('Обсуждаем Паразиты')).toBeVisible();

  // The activity tab exposes the rating with a control to the discussion.
  await page.goto(`/groups/${GROUP_ID}?tab=activity`);
  const activity = page.getByTestId('group-activity');
  await expect(activity.getByRole('button', { name: 'К обсуждению' }).first()).toBeVisible();
});

test('keeps the group shell in place and switches tabs without a server round trip', async ({
  page,
}) => {
  await login(page);
  await page.goto(`/groups/${GROUP_ID}?tab=discussions`);

  const heading = page.getByRole('heading', { level: 1 });
  const tablist = page.getByRole('tablist');
  await expect(heading).toBeVisible();
  await expect(tablist).toBeVisible();

  const rscRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    // Background prefetches of the "Управление" link are not a tab round trip.
    if (request.headers()['next-router-prefetch']) {
      return;
    }
    if (url.includes(`/groups/${GROUP_ID}`) && url.includes('_rsc')) {
      rscRequests.push(url);
    }
  });

  // Switching tabs updates the panel and the address without reloading the page.
  await page.getByRole('tab', { name: 'Оценки' }).click();
  await expect(heading).toBeVisible();
  await expect(tablist).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/groups/${GROUP_ID}\\?tab=ratings$`));
  expect(rscRequests).toHaveLength(0);
});

test('switching tabs does not add browser history entries', async ({ page }) => {
  await login(page);
  await page.goto('/groups');
  await page.goto(`/groups/${GROUP_ID}`);

  await page.getByRole('tab', { name: 'Оценки' }).click();
  await page.getByRole('tab', { name: 'Участники' }).click();

  await page.goBack();
  await expect(page).toHaveURL(/\/groups$/);
});

test('changing the timezone and clock format changes a comment moment', async ({ page }) => {
  await login(page);

  // Pin a zero-offset zone and the 24-hour clock.
  await page.goto('/settings');
  await page.getByLabel('Тайм-зона').first().selectOption('Africa/Abidjan');
  await page.getByRole('radio', { name: '24 часа' }).first().click();

  const discussionUrl = `/groups/${GROUP_ID}?tab=discussions&discussion=1`;
  await page.goto(discussionUrl);
  const posts = page.getByTestId('discussion-posts').first();
  await expect(posts.getByText('Финал гениален, спорить бесполезно.').first()).toBeVisible();

  const firstTime = posts.locator('time').first();
  const baseline = await firstTime.textContent();
  expect(baseline).toMatch(/^\d{2}:\d{2} \d{2}\.\d{2}\.\d{2}$/);
  const baselineHour = Number(baseline?.slice(0, 2));

  // A +14 zone moves the hour by 14 while keeping the same format.
  await page.goto('/settings');
  await page.getByLabel('Тайм-зона').first().selectOption('Pacific/Kiritimati');
  await page.goto(discussionUrl);
  const shifted = await posts.locator('time').first().textContent();
  expect(shifted).not.toBe(baseline);
  const shiftedHour = Number(shifted?.slice(0, 2));
  expect((shiftedHour - baselineHour + 24) % 24).toBe(14);

  // The 12-hour clock switches the hour to a 1–12 value.
  await page.goto('/settings');
  await page.getByRole('radio', { name: '12 часов' }).first().click();
  await page.goto(discussionUrl);
  const twelveHour = await posts.locator('time').first().textContent();
  const parsedHour = Number(/^(\d{1,2}):/.exec(twelveHour ?? '')?.[1]);
  expect(parsedHour).toBeGreaterThanOrEqual(1);
  expect(parsedHour).toBeLessThanOrEqual(12);
  expect(twelveHour).not.toBe(shifted);
});

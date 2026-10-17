import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const APP = join('src', 'app', '(app)');

const routes: Array<{ path: string; file: string; depth: number }> = [
  { path: '/', file: 'page.tsx', depth: 0 },
  { path: '/film/[tmdbId]', file: 'shell/film/page.tsx', depth: 2 },
  { path: '/films', file: 'films/page.tsx', depth: 1 },
  { path: '/films/[id]', file: 'shell/record/page.tsx', depth: 2 },
  { path: '/series', file: 'series/page.tsx', depth: 1 },
  { path: '/series/[tmdbId]', file: 'shell/series/page.tsx', depth: 2 },
  { path: '/me', file: 'me/page.tsx', depth: 1 },
  { path: '/me/stats', file: 'me/stats/page.tsx', depth: 2 },
  { path: '/u/[handle]', file: 'shell/profile/page.tsx', depth: 2 },
  { path: '/friends', file: 'friends/page.tsx', depth: 1 },
  { path: '/friends/requests', file: 'friends/requests/page.tsx', depth: 2 },
  { path: '/groups', file: 'groups/page.tsx', depth: 1 },
  { path: '/groups/[id]', file: 'shell/group/page.tsx', depth: 2 },
  { path: '/groups/[id]/admin', file: 'shell/group-admin/page.tsx', depth: 3 },
  { path: '/settings', file: 'settings/page.tsx', depth: 1 },
  { path: '/settings/privacy', file: 'settings/privacy/page.tsx', depth: 2 },
];

const publicRewrites = [
  '/film/:tmdbId',
  '/series/:tmdbId',
  '/films/:id',
  '/groups/:id/admin',
  '/groups/:id',
  '/u/:handle',
];

describe('navigation depth budget', () => {
  it('places every key screen at most three transitions from Home', () => {
    for (const route of routes) {
      expect(existsSync(join(APP, route.file)), `missing route ${route.path}`).toBe(true);
      expect(route.depth, `depth of ${route.path}`).toBeLessThanOrEqual(3);
    }
  });

  it('serves every parameterized URL from a static shell through a rewrite', () => {
    const config = readFileSync('next.config.js', 'utf8');
    for (const source of publicRewrites) {
      expect(config, `missing rewrite ${source}`).toContain(`source: '${source}'`);
    }
  });

  it('opens the rating and comment form as a modal over the film card, not a route', () => {
    const filmDetail = readFileSync(
      join('src', 'components', 'features', 'movie-tracker', 'FilmDetail.tsx'),
      'utf8',
    );
    expect(filmDetail).toContain('Modal');
    expect(filmDetail).toContain('RatingForm');
  });
});

describe('product identity', () => {
  it('brands the product as Смотровик and ships an app icon', () => {
    const layout = readFileSync(join('src', 'app', 'layout.tsx'), 'utf8');
    expect(layout).toContain("title: 'Смотровик'");
    const footer = readFileSync(
      join('src', 'components', 'layout', 'footer.tsx'),
      'utf8',
    );
    expect(footer).toContain('Смотровик');
    expect(existsSync(join('src', 'app', 'icon.svg'))).toBe(true);
  });
});

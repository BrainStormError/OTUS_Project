import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import AppLoading from '@/app/(app)/loading';
import LoginLoading from '@/app/(auth)/login/loading';

describe('route loading boundaries', () => {
  it('ships loading.tsx inside the authenticated shell and the login route', () => {
    const appLoadingPath = join('src', 'app', '(app)', 'loading.tsx');
    expect(existsSync(appLoadingPath)).toBe(true);
    expect(existsSync(join('src', 'app', '(auth)', 'login', 'loading.tsx'))).toBe(true);

    const appLoading = readFileSync(appLoadingPath, 'utf8');
    expect(appLoading).toContain('RouteLoadingSkeleton');
  });

  it('renders the shared busy skeleton for authenticated routes', () => {
    const html = renderToString(<AppLoading />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-hidden="true"');
  });

  it('renders a busy form skeleton for the login route', () => {
    const html = renderToString(<LoginLoading />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-hidden="true"');
  });
});

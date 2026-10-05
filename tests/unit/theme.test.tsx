import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { Banners } from '@/components/layout/banners';
import { ThemeSelect } from '@/components/features/movie-tracker/ThemeSelect';

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.setAttribute('data-theme', 'light');
});

describe('ThemeSelect (Settings only)', () => {
  it('changes the theme through the data-theme attribute without editing components', async () => {
    render(<ThemeSelect />);
    const dark = await screen.findByRole('radio', { name: 'Тёмная' });

    await userEvent.click(dark);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(window.localStorage.getItem('theme')).toBe('dark');

    await userEvent.click(screen.getByRole('radio', { name: 'Светлая' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(window.localStorage.getItem('theme')).toBe('light');
  });
});

describe('Banners', () => {
  it('renders nothing when there are no banners', () => {
    const { container } = render(<Banners banners={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('announces each banner with its message', () => {
    render(<Banners banners={[{ id: '1', tone: 'warning', message: 'Осторожно' }]} />);
    expect(screen.getByRole('status')).toHaveTextContent('Осторожно');
  });
});

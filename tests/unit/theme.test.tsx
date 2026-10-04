import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { Banners } from '@/components/layout/banners';
import { ThemeSwitcher } from '@/components/layout/theme-switcher';

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.setAttribute('data-theme', 'light');
});

describe('ThemeSwitcher', () => {
  it('changes the theme through the data-theme attribute without editing components', async () => {
    render(<ThemeSwitcher />);
    const button = await screen.findByRole('button', { name: /тёмную тему/i });

    await userEvent.click(button);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(window.localStorage.getItem('theme')).toBe('dark');

    await userEvent.click(button);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
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

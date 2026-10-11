import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ViewTabs } from '@/components/features/movie-tracker/ViewTabs';

const TABS = [
  { id: 'watched', label: 'Просмотренные' },
  { id: 'watchlist', label: 'Буду смотреть' },
];

describe('ViewTabs', () => {
  it('exposes tablist and tab semantics with the active tab selected', () => {
    render(<ViewTabs tabs={TABS} active="watched" onChange={() => undefined} ariaLabel="Мои фильмы" />);

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Просмотренные' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Буду смотреть' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('links each tab to its panel and reports changes', async () => {
    const onChange = vi.fn();
    render(<ViewTabs tabs={TABS} active="watched" onChange={onChange} ariaLabel="Мои фильмы" />);

    const tab = screen.getByRole('tab', { name: 'Буду смотреть' });
    expect(tab).toHaveAttribute('aria-controls', 'panel-watchlist');

    await userEvent.click(tab);
    expect(onChange).toHaveBeenCalledWith('watchlist');
  });
});

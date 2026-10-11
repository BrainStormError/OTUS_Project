import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { avatarParams } from '@/components/ui/avatar-params';
import { Avatar, getAvatarParams } from '@/components/ui/avatar';

vi.mock('@/components/ui/avatar-params', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ui/avatar-params')>();
  return { ...actual, avatarParams: vi.fn(actual.avatarParams) };
});

const avatarParamsMock = vi.mocked(avatarParams);

beforeEach(() => {
  avatarParamsMock.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('avatar parameters', () => {
  it('derives identical parameters for the same seed across repeated calls', () => {
    expect(avatarParams('alex')).toEqual(avatarParams('alex'));
    expect(avatarParams('same-user')).toEqual(avatarParams('same-user'));
  });

  it('derives different hue and shape parameters for different seeds', () => {
    const alex = avatarParams('alex');
    const maria = avatarParams('maria');

    expect(alex).not.toEqual(maria);
    expect(alex.base.hue).not.toBe(maria.base.hue);
    expect(alex.spots).not.toEqual(maria.spots);
  });

  it('keeps an id-based fallback seed stable across calls', () => {
    expect(avatarParams(String(42))).toEqual(avatarParams(String(42)));
    expect(avatarParams(String(42))).not.toEqual(avatarParams(String(43)));
  });
});

describe('Avatar component', () => {
  it('memoizes parameters per seed and renders distinct SVG ids per instance', () => {
    const { container } = render(
      <>
        <Avatar seed="memo-shared" />
        <Avatar seed="memo-shared" />
      </>,
    );

    expect(avatarParamsMock).toHaveBeenCalledTimes(1);
    expect(getAvatarParams('memo-shared')).toBe(getAvatarParams('memo-shared'));

    const clipIds = Array.from(container.querySelectorAll('clipPath')).map((node) =>
      node.getAttribute('id'),
    );
    expect(clipIds).toHaveLength(2);
    expect(new Set(clipIds).size).toBe(2);
  });

  it('is decorative when no label is given and labeled when it is', () => {
    const { container, unmount } = render(<Avatar seed="a11y-decorative" />);
    const decorative = container.querySelector('svg')!;
    expect(decorative).toHaveAttribute('aria-hidden', 'true');
    expect(decorative).not.toHaveAttribute('role');
    unmount();

    render(<Avatar seed="a11y-labeled" label="Мария" />);
    expect(screen.getByRole('img', { name: 'Мария' })).toBeInTheDocument();
  });

  it('presents the same visual at every size and follows the seed', () => {
    const { container } = render(
      <>
        <Avatar seed="identity-user" size={32} />
        <Avatar seed="identity-user" size={64} />
      </>,
    );
    const [small, large] = Array.from(container.querySelectorAll('svg'));
    expect(small!.querySelector('rect')!.getAttribute('fill')).toBe(
      large!.querySelector('rect')!.getAttribute('fill'),
    );
    expect(small).toHaveAttribute('width', '32');
    expect(large).toHaveAttribute('width', '64');

    const renamed = render(<Avatar seed="identity-renamed" />);
    expect(renamed.container.querySelector('rect')!.getAttribute('fill')).not.toBe(
      small!.querySelector('rect')!.getAttribute('fill'),
    );
  });

  it('generates deterministically without persistence or network', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem');
    const clear = vi.spyOn(Storage.prototype, 'clear');
    const fetchMock = vi.fn();
    const indexedDbOpen = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('indexedDB', { open: indexedDbOpen });

    const cookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    const cookieSetter = vi.fn();
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => '',
      set: cookieSetter,
    });

    render(<Avatar seed="hygiene-user" />);
    expect(screen.getByTestId('avatar')).toBeInTheDocument();

    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
    expect(cookieSetter).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(indexedDbOpen).not.toHaveBeenCalled();

    setItem.mockRestore();
    removeItem.mockRestore();
    clear.mockRestore();
    Object.defineProperty(document, 'cookie', cookieDescriptor!);
  });
});

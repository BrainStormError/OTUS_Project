import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AsyncView } from '@/components/features/AsyncView';

describe('AsyncView', () => {
  it('renders the loading state', () => {
    render(<AsyncView state={{ status: 'loading' }}>{() => null}</AsyncView>);
    expect(screen.getByTestId('async-loading')).toBeInTheDocument();
  });

  it('renders an empty state distinct from loading and error', () => {
    render(
      <AsyncView state={{ status: 'empty' }} emptyMessage="Пусто">
        {() => null}
      </AsyncView>,
    );
    expect(screen.getByTestId('async-empty')).toHaveTextContent('Пусто');
    expect(screen.queryByTestId('async-error')).not.toBeInTheDocument();
  });

  it('renders an error state with a retry control', () => {
    render(
      <AsyncView state={{ status: 'error', message: 'Сбой', retry: () => undefined }}>
        {() => null}
      </AsyncView>,
    );
    expect(screen.getByTestId('async-error')).toHaveTextContent('Сбой');
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument();
  });

  it('renders the success payload', () => {
    render(<AsyncView state={{ status: 'success', data: ['x'] }}>{(d) => <span>{d[0]}</span>}</AsyncView>);
    expect(screen.getByText('x')).toBeInTheDocument();
  });
});


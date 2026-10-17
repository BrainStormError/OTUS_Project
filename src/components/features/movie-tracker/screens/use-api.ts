'use client';

import { useEffect, useState } from 'react';

export type Loadable<T> =
  | { status: 'loading' }
  | { status: 'error'; code?: number }
  | { status: 'ready'; data: T };

type HttpError = Error & { status?: number };

async function readJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal,
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`) as HttpError;
    error.status = response.status;
    throw error;
  }
  return (await response.json()) as T;
}

function codeOf(error: unknown): number | undefined {
  return (error as HttpError | undefined)?.status;
}

// The screen gets its data from an authorized read after the static document
// has been served. No placeholder is rendered while the read is pending.
export function useApi<T>(url: string): Loadable<T> {
  const [state, setState] = useState<Loadable<T>>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    void readJson<T>(url, controller.signal)
      .then((data) => setState({ status: 'ready', data }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setState({ status: 'error', code: codeOf(error) });
        }
      });
    return () => controller.abort();
  }, [url]);

  return state;
}

export function useApiAll<T extends readonly unknown[]>(
  urls: readonly string[],
): Loadable<T> {
  const key = urls.join('\n');
  const [state, setState] = useState<Loadable<T>>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    const list = key.length > 0 ? key.split('\n') : [];
    void Promise.all(list.map((url) => readJson<unknown>(url, controller.signal)))
      .then((data) => setState({ status: 'ready', data: data as unknown as T }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setState({ status: 'error', code: codeOf(error) });
        }
      });
    return () => controller.abort();
  }, [key]);

  return state;
}

'use client';

import * as Toast from '@radix-ui/react-toast';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import * as React from 'react';

import { Button } from './button';
import { cn } from './utils';

export type ToastTone = 'success' | 'error';

export type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
};

type ToastItem = {
  id: number;
  tone: ToastTone;
  message: string;
};

const DURATION: Record<ToastTone, number> = {
  success: 4000,
  error: 6000,
};

const noop = () => undefined;

const ToastContext = React.createContext<ToastApi>({ success: noop, error: noop });

export function useToast(): ToastApi {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const nextId = React.useRef(0);

  const notify = React.useCallback((tone: ToastTone, message: string) => {
    nextId.current += 1;
    setToasts((prev) => [...prev, { id: nextId.current, tone, message }]);
  }, []);

  const api = React.useMemo<ToastApi>(
    () => ({
      success: (message) => notify('success', message),
      error: (message) => notify('error', message),
    }),
    [notify],
  );

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={api}>
      <Toast.Provider swipeDirection="right" label="Уведомление ({hotkey})">
        {children}
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            open
            duration={DURATION[toast.tone]}
            data-testid="toast"
            data-tone={toast.tone}
            onOpenChange={(open) => {
              if (!open) dismiss(toast.id);
            }}
            className={cn(
              'animate-slide pointer-events-auto flex w-full items-start gap-3 rounded-md border bg-card p-3 elevation-raised',
              toast.tone === 'error'
                ? 'border-destructive/60 text-destructive'
                : 'border-border text-card-foreground',
            )}
          >
            {toast.tone === 'error' ? (
              <CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <CircleCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <span className="sr-only">
                {toast.tone === 'error' ? 'Ошибка: ' : 'Успех: '}
              </span>
              <p className="text-sm">{toast.message}</p>
            </div>
            <Toast.Close asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Закрыть уведомление"
                className="-mr-1 -mt-1 shrink-0"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </Button>
            </Toast.Close>
          </Toast.Root>
        ))}
        <Toast.Viewport
          label="Уведомления ({hotkey})"
          className="z-[100] fixed inset-x-0 bottom-0 flex max-h-screen w-full flex-col gap-2 p-4 sm:inset-x-auto sm:right-0 sm:w-96"
        />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

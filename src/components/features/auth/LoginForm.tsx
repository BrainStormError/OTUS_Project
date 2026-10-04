'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

export function LoginForm({ demoEnabled }: { demoEnabled: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await signIn('demo', {
      email,
      redirect: false,
      callbackUrl: '/directory',
    });
    if (!result || (typeof result !== 'string' && result.error)) {
      setError('Не удалось войти. Проверьте email.');
      setPending(false);
      return;
    }
    router.push('/directory');
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {demoEnabled ? (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="employee@demo.local"
            />
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Вход…' : 'Войти'}
          </Button>
        </>
      ) : (
        <Button
          type="button"
          className="w-full"
          onClick={() => signIn('google', { callbackUrl: '/directory' })}
        >
          Войти через OAuth
        </Button>
      )}
    </form>
  );
}

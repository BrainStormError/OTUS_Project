import { env } from '@/core/config/env';
import { LoginForm } from '@/components/features/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="container flex min-h-screen items-center justify-center py-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Вход</h1>
          <p className="text-sm text-muted-foreground">
            Войдите, чтобы продолжить работу.
          </p>
        </div>
        <LoginForm demoEnabled={env.DEMO_LOGIN === '1'} />
      </div>
    </main>
  );
}

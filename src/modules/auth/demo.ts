import { env } from '@/core/config/env';

import { auditAuth } from './audit';
import { findOrCreateDemoUser } from './repository';
import { demoLoginInput } from './schema';

// Demo login is a course affordance: it is only active when explicitly enabled
// and never in production, regardless of configuration.
export function isDemoLoginEnabled(nodeEnv: string, demoLogin: string): boolean {
  return demoLogin === '1' && nodeEnv !== 'production';
}

export async function authorizeDemoUser(credentials: unknown) {
  if (!isDemoLoginEnabled(env.NODE_ENV, env.DEMO_LOGIN)) {
    auditAuth('auth.signin.failed', { provider: 'demo' });
    return null;
  }

  const parsed = demoLoginInput.safeParse(credentials);
  if (!parsed.success) {
    auditAuth('auth.signin.failed', { provider: 'demo' });
    return null;
  }

  const user = await findOrCreateDemoUser(parsed.data.email, parsed.data.name);
  if (!user) {
    auditAuth('auth.signin.failed', { provider: 'demo' });
    return null;
  }

  auditAuth('auth.signin.success', { provider: 'demo', userId: user.id });
  return {
    id: String(user.id),
    email: user.email,
    name: user.name ?? user.email,
  };
}

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

import { ensureAuthUrl, env } from '@/core/config/env';

import { auditAuth } from './audit';
import { authorizeDemoUser, isDemoLoginEnabled } from './demo';
import { resolveGoogleUser } from './identity';
import {
  buildSessionCookieConfig,
  SESSION_MAX_AGE_SECONDS,
} from './session-cookie';

// Pin Auth.js to the canonical origin before initialization. This replaces the
// implicit `trustHost` host-header detection: every request URL is rewritten to
// APP_ORIGIN, so OAuth callbacks and redirects never follow a spoofed Host.
ensureAuthUrl();

function isSecureOrigin(): boolean {
  return env.APP_ORIGIN.startsWith('https://');
}

const demoProvider = Credentials({
  id: 'demo',
  name: 'Demo',
  credentials: {
    email: { label: 'Email', type: 'text' },
    name: { label: 'Name', type: 'text' },
  },
  async authorize(credentials) {
    return authorizeDemoUser(credentials);
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.SESSION_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: '/login',
  },
  cookies: {
    sessionToken: buildSessionCookieConfig(isSecureOrigin()),
  },
  providers: [
    Google({
      clientId: env.OAUTH_CLIENT_ID,
      clientSecret: env.OAUTH_CLIENT_SECRET,
    }),
    ...(isDemoLoginEnabled(env.NODE_ENV, env.DEMO_LOGIN) ? [demoProvider] : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') {
        return true;
      }
      if (!user.email) {
        auditAuth('auth.signin.failed', { provider: 'google' });
        return false;
      }

      const resolved = await resolveGoogleUser({
        email: user.email,
        name: user.name ?? null,
        subject: account.providerAccountId ?? '',
      });
      if (!resolved) {
        auditAuth('auth.signin.failed', { provider: 'google' });
        return false;
      }

      auditAuth('auth.signin.success', { provider: 'google', userId: resolved.id });
      user.id = String(resolved.id);
      return true;
    },
    jwt({ token, user }) {
      if (user?.id) {
        token.uid = Number(user.id);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.uid === 'number') {
        (session.user as { id?: number }).id = token.uid;
      }
      return session;
    },
  },
});

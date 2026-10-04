import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

import { env } from '@/core/config/env';

import { authorizeDemoUser } from './demo';
import {
  buildSessionCookieConfig,
  SESSION_MAX_AGE_SECONDS,
} from './session-cookie';

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
  trustHost: true,
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
    ...(env.DEMO_LOGIN === '1' ? [demoProvider] : []),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.uid = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.uid === 'string') {
        session.user.id = token.uid;
      }
      return session;
    },
  },
});

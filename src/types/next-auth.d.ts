import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: Omit<NonNullable<DefaultSession['user']>, 'id'> & { id?: number };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid?: number;
  }
}

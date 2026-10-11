import {
  bindProviderSubject,
  findUserByEmail,
  findUserByProviderSubject,
  insertUser,
} from './repository';
import type { UserRow } from './types';

// Matches a returned Google sign-in to a durable account by the provider
// subject. Email is only used to bind the subject once for legacy rows that
// have no provider identity yet; it never authenticates an account created by
// a different provider.
export async function resolveGoogleUser(input: {
  email: string;
  name: string | null;
  subject: string;
}): Promise<UserRow | null> {
  const subject = input.subject.trim();
  if (!subject) {
    return null;
  }

  const bySubject = await findUserByProviderSubject('google', subject);
  if (bySubject) {
    return bySubject;
  }

  const byEmail = await findUserByEmail(input.email);
  if (byEmail) {
    if (byEmail.provider !== null && byEmail.provider !== 'google') {
      return null;
    }
    if (
      byEmail.provider === 'google' &&
      byEmail.providerSubject !== null &&
      byEmail.providerSubject !== subject
    ) {
      return null;
    }
    await bindProviderSubject(byEmail.id, 'google', subject);
    return { ...byEmail, provider: 'google', providerSubject: subject };
  }

  return insertUser({
    email: input.email,
    name: input.name,
    role: 'employee',
    provider: 'google',
    providerSubject: subject,
  });
}

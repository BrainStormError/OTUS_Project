import type { Actor } from '@/core/auth/policy';
import { err, ok, type Result } from '@/core/result';

import {
  bindProviderSubject,
  findUserByEmail,
  findUserByHandle,
  findUserByProviderSubject,
  insertUser,
  updateIdentity as updateIdentityRow,
} from './repository';
import { identityUpdateInput } from './schema';
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

export type IdentityUpdate = { name: string; handle: string };

function cooldownMessage(availableAt: Date): string {
  const remainingMs = availableAt.getTime() - Date.now();
  const days = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
  return `Тэг можно менять раз в месяц. Повторите через ${days} дн.`;
}

// Updates the signed-in owner's own display name and/or tag. Only the actor's
// account is touched; the input never carries a target id. Format and reserved
// values are re-checked here so the service is safe to call directly, while
// uniqueness and the monthly tag cooldown are enforced against the database.
export async function updateIdentity(
  actor: Actor,
  input: unknown,
): Promise<Result<IdentityUpdate>> {
  const parsed = identityUpdateInput.safeParse(input);
  if (!parsed.success) {
    return err(
      'VALIDATION',
      'Проверьте данные: имя 1–100 символов, тэг из латиницы, цифр, «_» и «-» до 50 символов, кроме admin и root',
    );
  }

  const { name, handle } = parsed.data;

  if (handle !== undefined) {
    const taken = await findUserByHandle(handle);
    if (taken && taken.id !== actor.id) {
      return err('CONFLICT', 'Этот тэг уже занят');
    }
  }

  const outcome = await updateIdentityRow(actor.id, { name, handle });
  switch (outcome.status) {
    case 'not_found':
      return err('NOT_FOUND', 'Пользователь не найден');
    case 'handle_taken':
      return err('CONFLICT', 'Этот тэг уже занят');
    case 'cooldown':
      return err('CONFLICT', cooldownMessage(outcome.availableAt));
    case 'updated':
      return ok({
        name: outcome.user.name ?? '',
        handle: outcome.user.handle ?? '',
      });
  }
}

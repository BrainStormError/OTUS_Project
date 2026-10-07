import type { Actor } from '@/core/auth/policy';
import { err, ok, type Result } from '@/core/result';

import { findUserById, updatePrivacy as updatePrivacyRow } from './repository';
import type { PrivacyInput } from './schema';

export type PrivacyFlags = { profileHidden: boolean; statsHidden: boolean };

export async function getPrivacy(actor: Actor): Promise<Result<PrivacyFlags>> {
  const row = await findUserById(actor.id);
  if (!row) {
    return err('NOT_FOUND', 'Пользователь не найден');
  }
  return ok({ profileHidden: row.profileHidden, statsHidden: row.statsHidden });
}

export async function updatePrivacy(
  actor: Actor,
  input: PrivacyInput,
): Promise<Result<PrivacyFlags>> {
  const row = await updatePrivacyRow(actor.id, input);
  if (!row) {
    return err('NOT_FOUND', 'Пользователь не найден');
  }
  return ok({ profileHidden: row.profileHidden, statsHidden: row.statsHidden });
}

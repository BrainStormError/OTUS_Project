import { query } from '@/core/db/pool';
import { withTransaction } from '@/core/db/transaction';

import type { UserRow } from './types';

type UserDbRow = {
  id: number;
  email: string;
  name: string | null;
  handle: string | null;
  role: number;
  provider: string | null;
  provider_subject: string | null;
  profile_hidden: boolean;
  stats_hidden: boolean;
  created_at: Date;
};

const ROLE_CODE = { employee: 0, admin: 1 } as const;

function roleFromCode(code: number): 'employee' | 'admin' {
  return code === 1 ? 'admin' : 'employee';
}

const COLUMNS =
  'id, email, name, handle, role, provider, provider_subject, profile_hidden, stats_hidden, created_at';

function mapUser(row: UserDbRow): UserRow {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    handle: row.handle,
    role: roleFromCode(row.role),
    provider: row.provider,
    providerSubject: row.provider_subject,
    profileHidden: row.profile_hidden,
    statsHidden: row.stats_hidden,
    createdAt: row.created_at.toISOString(),
  };
}

// Derives a stable, non-null handle from an email so every account can be
// addressed through /u/<handle>. The short hash suffix keeps handles unique
// across domains that share a local part.
export function deriveHandle(email: string): string {
  const local = email.split('@')[0] ?? '';
  const base = (local.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'user').slice(
    0,
    40,
  );
  let hash = 0;
  for (let index = 0; index < email.length; index += 1) {
    hash = (hash * 31 + email.charCodeAt(index)) | 0;
  }
  const suffix = Math.abs(hash).toString(36).slice(0, 6) || '0';
  return `${base}-${suffix}`.slice(0, 50);
}

export async function findUserById(id: number): Promise<UserRow | null> {
  const rows = await query<UserDbRow>(`SELECT ${COLUMNS} FROM users WHERE id = $1`, [id]);
  const row = rows[0];
  return row ? mapUser(row) : null;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const rows = await query<UserDbRow>(`SELECT ${COLUMNS} FROM users WHERE email = $1`, [email]);
  const row = rows[0];
  return row ? mapUser(row) : null;
}

export async function findUserByProviderSubject(
  provider: string,
  subject: string,
): Promise<UserRow | null> {
  const rows = await query<UserDbRow>(
    `SELECT ${COLUMNS} FROM users WHERE provider = $1 AND provider_subject = $2`,
    [provider, subject],
  );
  const row = rows[0];
  return row ? mapUser(row) : null;
}

export async function bindProviderSubject(
  userId: number,
  provider: string,
  subject: string,
): Promise<void> {
  await query(
    `UPDATE users SET provider = $2, provider_subject = $3, updated_at = now() WHERE id = $1`,
    [userId, provider, subject],
  );
}

export async function findUserByHandle(handle: string): Promise<UserRow | null> {
  const rows = await query<UserDbRow>(`SELECT ${COLUMNS} FROM users WHERE handle = $1`, [handle]);
  const row = rows[0];
  return row ? mapUser(row) : null;
}

export async function insertUser(input: {
  email: string;
  name: string | null;
  handle?: string | null;
  role: 'employee' | 'admin';
  provider?: string | null;
  providerSubject?: string | null;
}): Promise<UserRow> {
  const rows = await query<UserDbRow>(
    `INSERT INTO users (email, name, handle, role, provider, provider_subject)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${COLUMNS}`,
    [
      input.email,
      input.name,
      input.handle ?? deriveHandle(input.email),
      ROLE_CODE[input.role],
      input.provider ?? null,
      input.providerSubject ?? null,
    ],
  );
  const row = rows[0];
  if (!row) {
    throw new Error('insertUser returned no row');
  }
  return mapUser(row);
}

export async function updatePrivacy(
  userId: number,
  input: { profileHidden?: boolean; statsHidden?: boolean },
): Promise<UserRow | null> {
  const rows = await query<UserDbRow>(
    `UPDATE users
        SET profile_hidden = COALESCE($2, profile_hidden),
            stats_hidden = COALESCE($3, stats_hidden),
            updated_at = now()
      WHERE id = $1
      RETURNING ${COLUMNS}`,
    [userId, input.profileHidden ?? null, input.statsHidden ?? null],
  );
  const row = rows[0];
  return row ? mapUser(row) : null;
}

export type IdentityUpdateOutcome =
  | { status: 'updated'; user: UserRow }
  | { status: 'not_found' }
  | { status: 'handle_taken' }
  | { status: 'cooldown'; availableAt: Date };

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
}

// Updates the owner's display name and tag. The tag change is guarded by a
// one-month cooldown evaluated inside the same transaction as a conditional
// UPDATE (not just a pre-read), so a concurrent change cannot slip past it.
// Submitting the current tag is a no-op that leaves the cooldown untouched.
export async function updateIdentity(
  userId: number,
  input: { name?: string; handle?: string },
): Promise<IdentityUpdateOutcome> {
  try {
    return await withTransaction(async (tx) => {
      const currentRows = await tx.query<UserDbRow & { handle_changed_at: Date | null }>(
        `SELECT ${COLUMNS}, handle_changed_at FROM users WHERE id = $1 FOR UPDATE`,
        [userId],
      );
      const current = currentRows.rows[0];
      if (!current) {
        return { status: 'not_found' };
      }

      const changingHandle = input.handle !== undefined && input.handle !== current.handle;

      if (!changingHandle) {
        const updated = await tx.query<UserDbRow>(
          `UPDATE users
              SET name = COALESCE($2, name),
                  updated_at = now()
            WHERE id = $1
            RETURNING ${COLUMNS}`,
          [userId, input.name ?? null],
        );
        const row = updated.rows[0];
        if (!row) {
          return { status: 'not_found' };
        }
        return { status: 'updated', user: mapUser(row) };
      }

      const updated = await tx.query<UserDbRow>(
        `UPDATE users
            SET name = COALESCE($2, name),
                handle = $3,
                handle_changed_at = now(),
                updated_at = now()
          WHERE id = $1
            AND (handle_changed_at IS NULL OR handle_changed_at <= now() - interval '1 month')
          RETURNING ${COLUMNS}`,
        [userId, input.name ?? null, input.handle],
      );
      const row = updated.rows[0];
      if (!row) {
        const available = await tx.query<{ available_at: Date }>(
          `SELECT handle_changed_at + interval '1 month' AS available_at
             FROM users WHERE id = $1`,
          [userId],
        );
        const availableAt =
          available.rows[0]?.available_at ??
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return { status: 'cooldown', availableAt };
      }
      return { status: 'updated', user: mapUser(row) };
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { status: 'handle_taken' };
    }
    throw error;
  }
}

// Resolves only accounts the demo path itself provisioned (provider `demo`,
// subject = email). An email already taken by another provider is refused
// rather than impersonated, and new demo accounts always get the
// least-privilege role. Role is never derived from the email text.
export async function findOrCreateDemoUser(
  email: string,
  name?: string,
): Promise<UserRow | null> {
  const existing = await findUserByProviderSubject('demo', email);
  if (existing) {
    return existing;
  }

  const clash = await findUserByEmail(email);
  if (clash) {
    return null;
  }

  return insertUser({
    email,
    name: name ?? email,
    role: 'employee',
    provider: 'demo',
    providerSubject: email,
  });
}

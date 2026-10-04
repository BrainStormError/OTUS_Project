import { query } from '@/core/db/pool';

import type { UserRow } from './types';

type UserDbRow = {
  id: string;
  email: string;
  name: string | null;
  role: 'employee' | 'admin';
  provider: string | null;
  provider_subject: string | null;
  created_at: Date;
};

const COLUMNS = 'id, email, name, role, provider, provider_subject, created_at';

function mapUser(row: UserDbRow): UserRow {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    provider: row.provider,
    providerSubject: row.provider_subject,
    createdAt: row.created_at.toISOString(),
  };
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const rows = await query<UserDbRow>(
    `SELECT ${COLUMNS} FROM users WHERE id = $1`,
    [id],
  );
  const row = rows[0];
  return row ? mapUser(row) : null;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const rows = await query<UserDbRow>(
    `SELECT ${COLUMNS} FROM users WHERE email = $1`,
    [email],
  );
  const row = rows[0];
  return row ? mapUser(row) : null;
}

export async function insertUser(input: {
  email: string;
  name: string | null;
  role: 'employee' | 'admin';
  provider?: string | null;
  providerSubject?: string | null;
}): Promise<UserRow> {
  const rows = await query<UserDbRow>(
    `INSERT INTO users (email, name, role, provider, provider_subject)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLUMNS}`,
    [
      input.email,
      input.name,
      input.role,
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

export async function findOrCreateDemoUser(
  email: string,
  name?: string,
): Promise<UserRow> {
  const existing = await findUserByEmail(email);
  if (existing) {
    return existing;
  }
  const role = email.toLowerCase().startsWith('admin') ? 'admin' : 'employee';
  return insertUser({
    email,
    name: name ?? email,
    role,
    provider: 'demo',
    providerSubject: email,
  });
}

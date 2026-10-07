import type { ActivityCursor } from './types';

export function encodeCursor(createdAt: string, id: number | string): string {
  return Buffer.from(`${createdAt}|${id}`, 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): ActivityCursor | null {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const separator = decoded.indexOf('|');
    if (separator <= 0) {
      return null;
    }
    const createdAt = decoded.slice(0, separator);
    const rawId = decoded.slice(separator + 1);
    const id = Number(rawId);
    if (createdAt.length === 0 || rawId.length === 0 || !Number.isInteger(id)) {
      return null;
    }
    return { createdAt, id };
  } catch {
    return null;
  }
}

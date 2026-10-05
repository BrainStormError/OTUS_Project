import type { ActivityCursor } from './types';

export function encodeCursor(createdAt: string, id: string): string {
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
    const id = decoded.slice(separator + 1);
    if (createdAt.length === 0 || id.length === 0) {
      return null;
    }
    return { createdAt, id };
  } catch {
    return null;
  }
}

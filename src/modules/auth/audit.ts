import { log } from '@/core/log/logger';

export type AuthAuditEvent = 'auth.signin.success' | 'auth.signin.failed';

// Structured, redaction-safe authentication audit record. The logger strips any
// field whose name looks like a secret, and the fields passed here are only the
// provider and the resolved user id.
export function auditAuth(
  event: AuthAuditEvent,
  fields: { provider: string; userId?: number },
): void {
  log(event === 'auth.signin.failed' ? 'warn' : 'info', event, fields);
}

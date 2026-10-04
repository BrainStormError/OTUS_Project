import { createHmac, timingSafeEqual } from 'node:crypto';

import { env } from '@/core/config/env';
import { err, ok, type Result } from '@/core/result';

export type TicketPayload = { email: string; exp: number };

export const DEFAULT_TICKET_TTL_SECONDS = 15 * 60;

function base64UrlEncode(value: Buffer | string): string {
  return Buffer.from(value).toString('base64url');
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function issueTicket(
  email: string,
  ttlSeconds: number = DEFAULT_TICKET_TTL_SECONDS,
  now: number = Date.now(),
): string {
  const payload: TicketPayload = {
    email,
    exp: Math.floor(now / 1000) + ttlSeconds,
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encoded, env.REGISTRATION_TICKET_SECRET);
  return `${encoded}.${signature}`;
}

export function verifyTicket(
  token: string,
  expectedEmail: string,
  now: number = Date.now(),
): Result<TicketPayload> {
  const parts = token.split('.');
  const encoded = parts[0];
  const signature = parts[1];
  if (!encoded || !signature || parts.length !== 2) {
    return err('VALIDATION', 'Некорректный ticket');
  }

  const expectedSignature = sign(encoded, env.REGISTRATION_TICKET_SECRET);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return err('VALIDATION', 'Некорректный ticket');
  }

  let payload: TicketPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as TicketPayload;
  } catch {
    return err('VALIDATION', 'Некорректный ticket');
  }

  if (typeof payload.email !== 'string' || typeof payload.exp !== 'number') {
    return err('VALIDATION', 'Некорректный ticket');
  }

  if (payload.exp * 1000 < now) {
    return err('VALIDATION', 'Ticket истёк');
  }

  if (payload.email.toLowerCase() !== expectedEmail.toLowerCase()) {
    return err('FORBIDDEN', 'Email не совпадает с ticket');
  }

  return ok(payload);
}
